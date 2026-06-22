import express from "express";
import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import multer from "multer";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { dataStore, isPostgresMode, startupMode } from "./config.js";
import { checkPostgresReady, disconnectPrisma } from "./prisma.js";
import {
  appendPostgresAuditLog,
  createPostgresMedia,
  createPostgresSession,
  deletePostgresSession,
  findPostgresUserById,
  findPostgresUserByUsername,
  getPostgresBootstrapForUser,
  getPostgresUserByToken,
  importPostgresEquipmentRows,
  registerPostgresFailedLogin,
  resetPostgresLoginFailures,
  syncPostgresRecords,
  unlockPostgresUser,
  updatePostgresPassword,
  updatePostgresProject,
  updatePostgresRow,
  upsertPostgresEquipment,
  upsertPostgresUser,
  upsertPostgresPoint,
  upgradePostgresPasswordHash
} from "./postgresRepository.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const dbPath = path.join(dataDir, "db.json");
const seedDbPath = path.join(dataDir, "seed.json");
const uploadDir = path.join(dataDir, "uploads");
const port = Number(process.env.API_PORT || 4177);
const jsonLimit = process.env.API_JSON_LIMIT || "25mb";
const maxUploadFiles = 12;
const maxUploadFileBytes = 50 * 1024 * 1024;
const maxUploadTotalBytes = 100 * 1024 * 1024;
const sessionDurationMs = 1000 * 60 * 60 * 12;
const bcryptRounds = Number(process.env.BCRYPT_ROUNDS || 12);
const loginLockThreshold = Number(process.env.LOGIN_LOCK_THRESHOLD || 5);
const loginLockDurationMs = Number(process.env.LOGIN_LOCK_DURATION_MINUTES || 15) * 60 * 1000;
const allowDemoUsers = String(process.env.ALLOW_DEMO_USERS || (process.env.NODE_ENV === "production" ? "false" : "true")).toLowerCase() === "true";
const allowedOrigins = String(
  process.env.CORS_ORIGINS || "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173"
)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const accessLogEnabled = String(process.env.ACCESS_LOG || "true").toLowerCase() !== "false";
const metricsStartedAt = Date.now();
const metrics = {
  requestsTotal: 0,
  requestsByRoute: {},
  statusCodes: {},
  errorsTotal: 0,
  failedLogins: 0,
  syncConflicts: 0,
  uploadFailures: 0,
  importFailures: 0,
  totalDurationMs: 0,
  maxDurationMs: 0
};
let dbWriteQueue = Promise.resolve();
let dbMutationQueue = Promise.resolve();
const roles = ["admin", "manager", "engineer", "field"];
const defaultUsers = [
  { id: "u-admin", username: "admin", name: "System Admin", role: "admin", password: "admin123", active: true, projectIds: [] },
  { id: "u-manager", username: "manager", name: "Project Manager", role: "manager", password: "manager123", active: true, projectIds: ["p1", "p2"] },
  { id: "u-engineer", username: "engineer", name: "Site Engineer", role: "engineer", password: "engineer123", active: true, projectIds: ["p1"] },
  { id: "u-field", username: "field", name: "Field User", role: "field", password: "field123", active: true, projectIds: ["p1"] }
];

const projectAliases = ["Project", "項目", "项目"];
const locationAliases = ["Location", "Area", "位置", "地點", "地点"];
const teamAliases = ["Team", "Category", "System", "團隊", "团队", "分類", "分类", "系統", "系统"];
const equipmentNameAliases = ["Equipment", "Equipment Name", "Name", "Device", "設備", "设备", "設備名稱", "设备名称"];
const equipmentTypeAliases = ["Type", "Equipment Type", "類型", "类型", "設備類型", "设备类型"];
const pointNameAliases = ["Point", "Point Name", "Sub Device", "點位", "点位", "子設備", "子设备"];
const pointTypeAliases = ["Point Type", "Signal Type", "點位類型", "点位类型", "信號類型", "信号类型"];
const referenceAliases = ["Reference", "Expected", "參考值", "参考值", "標準", "标准"];
const assigneeAliases = ["Assignee", "Owner", "負責人", "负责人"];
const dueAliases = ["Due", "Target Date", "目標日期", "目标日期"];

const app = express();
const allowedUploadTypes = new Map([
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
  ["image/webp", [".webp"]],
  ["image/gif", [".gif"]],
  ["image/svg+xml", [".svg"]],
  ["application/pdf", [".pdf"]],
  ["application/acad", [".dwg"]],
  ["application/x-acad", [".dwg"]],
  ["application/dwg", [".dwg"]],
  ["image/vnd.dwg", [".dwg"]],
  ["application/dxf", [".dxf"]],
  ["image/vnd.dxf", [".dxf"]],
  ["application/vnd.ms-excel", [".xls"]],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", [".xlsx"]],
  ["application/msword", [".doc"]],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", [".docx"]],
  ["text/plain", [".txt"]]
]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadFileBytes, files: maxUploadFiles }
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 600),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a moment and try again." }
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_RATE_LIMIT || 10),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Too many login attempts. Please wait before trying again." }
});
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.UPLOAD_RATE_LIMIT || 60),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many upload requests. Please wait a moment and try again." }
});

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use((request, response, next) => {
  const incomingId = String(request.headers["x-request-id"] || "").trim();
  request.id = incomingId || randomUUID();
  request.startedAt = Date.now();
  response.setHeader("X-Request-Id", request.id);
  const json = response.json.bind(response);
  response.json = (body) => {
    if (response.statusCode >= 400 && body && typeof body === "object" && !Array.isArray(body) && !body.requestId) {
      return json({ ...body, requestId: request.id });
    }
    return json(body);
  };
  response.on("finish", () => logAccess(request, response));
  next();
});
app.use((request, response, next) => {
  const origin = request.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  } else if (!origin) {
    response.setHeader("Access-Control-Allow-Origin", allowedOrigins[0] || "http://127.0.0.1:5173");
  }
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }
  next();
});
app.use("/api", apiLimiter);
app.use(express.json({ limit: jsonLimit }));
app.use("/uploads", express.static(uploadDir));

app.use((error, request, response, next) => {
  if (!error) {
    next();
    return;
  }
  sendApiError(response, error, request);
});

function sendApiError(response, error, request) {
  if (response.headersSent) return;
  metrics.errorsTotal += 1;
  if (request?.path?.includes("/upload") || request?.path?.includes("/attachments")) metrics.uploadFailures += 1;
  if (request?.path?.includes("/import")) metrics.importFailures += 1;
  logEvent("warn", "API request rejected", {
    requestId: request?.id,
    errorType: error.type || error.name || "Error",
    message: error.message
  });
  if (error.type === "entity.too.large" || error.code === "LIMIT_FILE_SIZE") {
    response.status(413).json(errorPayload("Upload is too large. Please split files or compress images before uploading.", request));
    return;
  }
  if (error.type === "entity.parse.failed") {
    response.status(400).json(errorPayload("Invalid JSON request payload.", request));
    return;
  }
  if (error.code === "LIMIT_FILE_COUNT") {
    response.status(413).json(errorPayload(`Too many files. Upload up to ${maxUploadFiles} files at a time.`, request));
    return;
  }
  if (error.status) {
    response.status(error.status).json(errorPayload(error.message || "Request failed.", request));
    return;
  }
  response.status(error.status || 400).json(errorPayload(error.message || "Invalid request payload.", request));
}

function errorPayload(message, request) {
  return { error: message, requestId: request?.id || "" };
}

function logAccess(request, response) {
  if (!request.path?.startsWith("/api")) return;
  const durationMs = Date.now() - Number(request.startedAt || Date.now());
  recordRequestMetrics(request, response, durationMs);
  if (!accessLogEnabled) return;
  logEvent(response.statusCode >= 500 ? "error" : "info", "api.request", {
    requestId: request.id,
    method: request.method,
    path: request.path,
    status: response.statusCode,
    durationMs,
    dataStore,
    userId: request.auth?.user?.id || "",
    role: request.auth?.user?.role || "",
    ip: request.ip
  });
}

function logEvent(level, message, details = {}) {
  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...details
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

function recordRequestMetrics(request, response, durationMs) {
  metrics.requestsTotal += 1;
  metrics.totalDurationMs += durationMs;
  metrics.maxDurationMs = Math.max(metrics.maxDurationMs, durationMs);
  const status = String(response.statusCode);
  metrics.statusCodes[status] = (metrics.statusCodes[status] || 0) + 1;
  if (response.statusCode >= 500) metrics.errorsTotal += 1;
  const key = `${request.method} ${normalizeMetricPath(request.path || "")}`;
  metrics.requestsByRoute[key] = (metrics.requestsByRoute[key] || 0) + 1;
}

function normalizeMetricPath(pathname) {
  return pathname
    .replace(/\/[a-z]+_[a-z0-9_]+/gi, "/:id")
    .replace(/\/[0-9a-f-]{12,}/gi, "/:id");
}

function metricsSnapshot() {
  return {
    startedAt: new Date(metricsStartedAt).toISOString(),
    uptimeSeconds: Math.round((Date.now() - metricsStartedAt) / 1000),
    dataStore,
    requestsTotal: metrics.requestsTotal,
    statusCodes: metrics.statusCodes,
    requestsByRoute: metrics.requestsByRoute,
    averageDurationMs: metrics.requestsTotal ? Math.round(metrics.totalDurationMs / metrics.requestsTotal) : 0,
    maxDurationMs: metrics.maxDurationMs,
    errorsTotal: metrics.errorsTotal,
    failedLogins: metrics.failedLogins,
    syncConflicts: metrics.syncConflicts,
    uploadFailures: metrics.uploadFailures,
    importFailures: metrics.importFailures
  };
}

const asyncRoute = (handler) => async (request, response) => {
  try {
    await handler(request, response);
  } catch (error) {
    sendApiError(response, error, request);
  }
};

const requireAuth = (allowedRoles = roles) => async (request, response, next) => {
  try {
    if (isPostgresMode) {
      const token = getBearerToken(request);
      const user = await getPostgresUserByToken(token);
      if (!user) {
        response.status(401).json({ error: "Login required." });
        return;
      }
      if (!allowedRoles.includes(user.role)) {
        await appendPostgresAuditLog(user, "permission.denied", request.method, request.path, { allowedRoles }, false);
        response.status(403).json({ error: "Permission denied." });
        return;
      }
      request.auth = { token, user };
      if (user.mustChangePassword && !["/api/auth/me", "/api/auth/logout", "/api/auth/change-password"].includes(request.path)) {
        response.status(403).json({ error: "Password change required.", code: "PASSWORD_CHANGE_REQUIRED" });
        return;
      }
      next();
      return;
    }
    const db = await readDb();
    const token = getBearerToken(request);
    const user = getUserFromRequest(request, db);
    if (!user) {
      response.status(401).json({ error: "Login required." });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      appendAuditLog(db, user, "permission.denied", request.method, request.path, { allowedRoles }, false);
      await writeDb(db);
      response.status(403).json({ error: "Permission denied." });
      return;
    }
    request.auth = { token, user };
    if (user.mustChangePassword && !["/api/auth/me", "/api/auth/logout", "/api/auth/change-password"].includes(request.path)) {
      response.status(403).json({ error: "Password change required.", code: "PASSWORD_CHANGE_REQUIRED" });
      return;
    }
    next();
  } catch (error) {
    sendApiError(response, error, request);
  }
};

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, time: Date.now(), dataStore });
});

app.get("/api/ready", asyncRoute(async (_request, response) => {
  const storage = await checkStorageReady();
  const database = await checkPostgresReady();
  const ok = storage.ok && database.ok;
  response.status(ok ? 200 : 503).json({ ok, time: Date.now(), dataStore, storage, database });
}));

app.get("/api/metrics", requireAuth(["admin"]), (_request, response) => {
  response.json(metricsSnapshot());
});

app.post("/api/auth/login", loginLimiter, asyncRoute(async (request, response) => {
  const username = String(request.body?.username || "").trim().toLowerCase();
  const password = String(request.body?.password || "");
  if (isPostgresMode) {
    const user = await findPostgresUserByUsername(username);
    if (isUserLocked(user)) {
      response.status(423).json({ error: `Account locked. Try again in ${lockRemainingSeconds(user)} seconds.` });
      return;
    }
    if (!user || !(await verifyPassword(password, user))) {
      metrics.failedLogins += 1;
      const updatedUser = await registerPostgresFailedLogin(user, loginLockThreshold, loginLockDurationMs);
      await appendPostgresAuditLog(updatedUser, "login.failed", "auth", username || "unknown", { username, failedLoginCount: updatedUser?.failedLoginCount || 0 }, false);
      if (isUserLocked(updatedUser)) {
        response.status(423).json({ error: `Account locked. Try again in ${lockRemainingSeconds(updatedUser)} seconds.` });
        return;
      }
      response.status(401).json({ error: "Invalid username or password." });
      return;
    }
    if (isLegacyPasswordHash(user.passwordHash)) {
      user.passwordHash = hashPassword(password);
      await upgradePostgresPasswordHash(user.id, user.passwordHash);
    }
    await resetPostgresLoginFailures(user.id);
    const token = await createPostgresSession(user.id, sessionDurationMs);
    await appendPostgresAuditLog(user, "login.success", "auth", user.id);
    response.json({ token, user: publicUser(user), data: await getPostgresBootstrapForUser(user) });
    return;
  }
  const db = await readDb();
  const user = db.users.find((item) => item.username.toLowerCase() === username && item.active !== false);
  if (isUserLocked(user)) {
    response.status(423).json({ error: `Account locked. Try again in ${lockRemainingSeconds(user)} seconds.` });
    return;
  }
  if (!user || !(await verifyPassword(password, user))) {
    metrics.failedLogins += 1;
    const updatedUser = registerJsonFailedLogin(db, user);
    appendAuditLog(db, updatedUser, "login.failed", "auth", username || "unknown", { username, failedLoginCount: updatedUser?.failedLoginCount || 0 }, false);
    await writeDb(db);
    if (isUserLocked(updatedUser)) {
      response.status(423).json({ error: `Account locked. Try again in ${lockRemainingSeconds(updatedUser)} seconds.` });
      return;
    }
    response.status(401).json({ error: "Invalid username or password." });
    return;
  }
  if (isLegacyPasswordHash(user.passwordHash)) {
    user.passwordHash = hashPassword(password);
  }
  resetJsonLoginFailures(user);
  const token = createSession(db, user);
  appendAuditLog(db, user, "login.success", "auth", user.id);
  await writeDb(db);
  response.json({ token, user: publicUser(user), data: filterDbForUser(db, user) });
}));

app.post("/api/auth/logout", requireAuth(), asyncRoute(async (request, response) => {
  if (isPostgresMode) {
    await deletePostgresSession(request.auth.token);
    await appendPostgresAuditLog(request.auth.user, "logout", "auth", request.auth.user.id);
    response.json({ ok: true });
    return;
  }
  const db = await readDb();
  db.sessions = (db.sessions || []).filter((session) => session.token !== request.auth.token);
  appendAuditLog(db, request.auth.user, "logout", "auth", request.auth.user.id);
  await writeDb(db);
  response.json({ ok: true });
}));

app.post("/api/auth/change-password", requireAuth(), asyncRoute(async (request, response) => {
  const currentPassword = String(request.body?.currentPassword || "");
  const nextPassword = String(request.body?.newPassword || "");
  const validationError = validatePasswordChangePayload(currentPassword, nextPassword);
  if (validationError) {
    response.status(400).json({ error: validationError });
    return;
  }

  if (isPostgresMode) {
    const user = await findPostgresUserById(request.auth.user.id);
    if (!user || !(await verifyPassword(currentPassword, user))) {
      metrics.failedLogins += 1;
      response.status(401).json({ error: "Current password is incorrect." });
      return;
    }
    const updatedUser = await updatePostgresPassword(user, hashPassword(nextPassword));
    response.json({ user: publicUser(updatedUser), data: await getPostgresBootstrapForUser(updatedUser) });
    return;
  }

  const db = await readDb();
  const user = db.users.find((item) => item.id === request.auth.user.id && item.active !== false);
  if (!user || !(await verifyPassword(currentPassword, user))) {
    metrics.failedLogins += 1;
    response.status(401).json({ error: "Current password is incorrect." });
    return;
  }
  user.passwordHash = hashPassword(nextPassword);
  user.mustChangePassword = false;
  user.passwordChangedAt = new Date().toISOString();
  resetJsonLoginFailures(user);
  appendAuditLog(db, user, "password.change", "user", user.id);
  await writeDb(db);
  response.json({ user: publicUser(user), data: filterDbForUser(db, user) });
}));

app.get("/api/auth/me", requireAuth(), asyncRoute(async (request, response) => {
  if (isPostgresMode) {
    const user = await findPostgresUserById(request.auth.user.id);
    response.json({ user: publicUser(user), data: await getPostgresBootstrapForUser(user) });
    return;
  }
  const db = await readDb();
  const user = db.users.find((item) => item.id === request.auth.user.id && item.active !== false);
  response.json({ user: publicUser(user), data: filterDbForUser(db, user) });
}));

app.get("/api/bootstrap", requireAuth(), asyncRoute(async (request, response) => {
  if (isPostgresMode) {
    response.json(await getPostgresBootstrapForUser(request.auth.user));
    return;
  }
  response.json(filterDbForUser(await readDb(), request.auth.user));
}));

app.get("/api/template/equipment", asyncRoute(async (_request, response) => {
  const rows = [
    {
      Project: "Harbour Tower BMS Upgrade",
      Location: "Tower A / 12F / AHU Room",
      Team: "BMS",
      Equipment: "DDC-12F-AHU-01",
      Type: "DDC Panel",
      Point: "Supply air temperature AI",
      "Point Type": "Analog Input",
      Reference: "22-26 C",
      Assignee: "Ken",
      Due: "2026-06-28",
      Notes: "One row creates or updates one equipment point/sub-device inspection item."
    },
    {
      Project: "Harbour Tower BMS Upgrade",
      Location: "Tower A / 12F / AHU Room",
      Team: "BMS",
      Equipment: "DDC-12F-AHU-01",
      Type: "DDC Panel",
      Point: "Fan start command DO",
      "Point Type": "Digital Output",
      Reference: "Start/Stop command",
      Assignee: "Ken",
      Due: "2026-06-28",
      Notes: "Repeat Equipment with different Point values for multiple points under the same device."
    }
  ];
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ELV Project Acceptance System";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("Equipment Import");
  worksheet.columns = [
    { header: "Project", key: "Project", width: 30 },
    { header: "Location", key: "Location", width: 32 },
    { header: "Team", key: "Team", width: 14 },
    { header: "Equipment", key: "Equipment", width: 24 },
    { header: "Type", key: "Type", width: 18 },
    { header: "Point", key: "Point", width: 28 },
    { header: "Point Type", key: "Point Type", width: 18 },
    { header: "Reference", key: "Reference", width: 24 },
    { header: "Assignee", key: "Assignee", width: 14 },
    { header: "Due", key: "Due", width: 14 },
    { header: "Notes", key: "Notes", width: 72 }
  ];
  worksheet.addRows(rows);
  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  response.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  response.setHeader("Content-Disposition", "attachment; filename=\"elv-equipment-import-template.xlsx\"");
  response.send(buffer);
}));

app.post("/api/sync", requireAuth(), async (request, response) => {
  const incoming = Array.isArray(request.body.records) ? request.body.records : [];
  if (isPostgresMode) {
    const result = await syncPostgresRecords(request.auth.user, incoming);
    metrics.syncConflicts += result.conflicts.length;
    response.json({ ...result.data, conflicts: result.conflicts });
    return;
  }
  const conflicts = [];
  const db = await withDbMutation(async (db) => {
    const user = getFreshUser(db, request.auth.user);
    for (const record of incoming) {
      if (!canAccessProject(user, record.projectId)) {
        conflicts.push({ local: record, server: null, error: "Permission denied." });
        continue;
      }
      const index = db.records.findIndex((item) => item.id === record.id);
      const nextRecord = { ...record, sync: "synced", serverUpdatedAt: Date.now() };
      if (index === -1) {
        db.records.push(nextRecord);
        appendAuditLog(db, user, "record.create", "record", nextRecord.id, { projectId: nextRecord.projectId, status: nextRecord.status });
        continue;
      }

      const current = db.records[index];
      const serverTime = Number(current.serverUpdatedAt || 0);
      if (record.baseServerUpdatedAt && Number(record.baseServerUpdatedAt) < serverTime) {
        conflicts.push({ local: record, server: current });
        continue;
      }
      db.records[index] = nextRecord;
      appendAuditLog(db, user, "record.sync", "record", nextRecord.id, { projectId: nextRecord.projectId, status: nextRecord.status });
    }

    return db;
  });
  metrics.syncConflicts += conflicts.length;
  response.json({ ...filterDbForUser(db, request.auth.user), conflicts });
});

app.post("/api/attachments", requireAuth(), uploadLimiter, upload.array("files", maxUploadFiles), asyncRoute(async (request, response) => {
  const multipartFiles = Array.isArray(request.files) ? request.files : [];
  const files = multipartFiles.length ? multipartFiles : Array.isArray(request.body.files) ? request.body.files : [];
  if (!files.length) {
    metrics.uploadFailures += 1;
    response.status(400).json({ error: "Missing attachment files." });
    return;
  }

  await mkdir(uploadDir, { recursive: true });
  const totalSize = files.reduce((sum, file) => sum + Number(file.size || file.buffer?.length || 0), 0);
  if (totalSize > maxUploadTotalBytes) {
    metrics.uploadFailures += 1;
    response.status(413).json({ error: `Upload is too large. Upload less than ${Math.round(maxUploadTotalBytes / 1024 / 1024)} MB at a time.` });
    return;
  }
  const savedFiles = [];
  for (const file of files) {
    savedFiles.push(file.buffer ? await saveMulterAttachment(file) : await saveAttachment(file));
  }
  response.status(201).json({ files: savedFiles });
}));

app.post(
  "/api/admin/media-upload",
  requireAuth(["admin", "manager", "engineer"]),
  uploadLimiter,
  upload.array("files", maxUploadFiles),
  asyncRoute(async (request, response) => {
    const body = request.body || {};
    const files = Array.isArray(request.files) ? request.files : [];
    const totalSize = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
    const comments = String(body.comments || "").trim();
    if (!files.length && !comments) {
      metrics.uploadFailures += 1;
      response.status(400).json({ error: "Media file or comment is required." });
      return;
    }
    if (totalSize > maxUploadTotalBytes) {
      metrics.uploadFailures += 1;
      response.status(413).json({ error: `Upload is too large. Upload less than ${Math.round(maxUploadTotalBytes / 1024 / 1024)} MB at a time.` });
      return;
    }

    await mkdir(uploadDir, { recursive: true });
    const savedFiles = [];
    try {
      for (const file of files) {
        savedFiles.push(await saveMulterAttachment(file));
      }

      if (isPostgresMode) {
        const result = await createPostgresMedia(request.auth.user, body, savedFiles);
        if (sendMutationError(response, result)) {
          await deleteUploadedFiles(savedFiles);
          return;
        }
        response.json(result.data);
        return;
      }

      const result = await withDbMutation(async (db) => {
        const user = getFreshUser(db, request.auth.user);
        db.media = Array.isArray(db.media) ? db.media : [];
        const equipment = db.equipment.find((item) => item.id === body.equipmentId);
        if (!equipment) return mutationError(404, "Equipment not found.");
        if (!canAccessProject(user, equipment.projectId)) return mutationError(403, "Permission denied.");
        appendMediaRecords(db, equipment, {
          category: body.category,
          title: body.title,
          reference: body.reference,
          comments,
          files: savedFiles
        });
        appendAuditLog(db, user, "media.upload", "equipment", equipment.id, { projectId: equipment.projectId, files: savedFiles.length, category: body.category });
        return db;
      });
      if (sendMutationError(response, result)) {
        await deleteUploadedFiles(savedFiles);
        return;
      }

  response.json(filterDbForUser(result, request.auth.user));
    } catch (error) {
      await deleteUploadedFiles(savedFiles);
      throw error;
    }
  })
);

app.post("/api/equipment", requireAuth(["admin", "manager", "engineer"]), async (request, response) => {
  if (isPostgresMode) {
    const result = await upsertPostgresEquipment(request.auth.user, request.body || {}, "eq");
    if (sendMutationError(response, result)) return;
    response.status(201).json(result.item);
    return;
  }
  const result = await withDbMutation(async (db) => {
    const user = getFreshUser(db, request.auth.user);
    const item = validateEquipmentPayload(db, request.body || {}, "eq");
    if (item.mutationError) return item;
    if (!canAccessProject(user, item.projectId)) return mutationError(403, "Permission denied.");
    db.equipment.push(item);
    appendAuditLog(db, user, "equipment.create", "equipment", item.id, { projectId: item.projectId, name: item.name });
    return item;
  });
  if (sendMutationError(response, result)) return;
  response.status(201).json(result);
});

app.post("/api/admin/equipment", requireAuth(["admin", "manager", "engineer"]), async (request, response) => {
  const body = request.body || {};
  if (isPostgresMode) {
    const result = await upsertPostgresEquipment(request.auth.user, body, "e");
    if (sendMutationError(response, result)) return;
    response.json(result.data);
    return;
  }
  const result = await withDbMutation(async (db) => {
    const user = getFreshUser(db, request.auth.user);
    const equipment = validateEquipmentPayload(db, body, "e");
    if (equipment.mutationError) return equipment;
    if (!canAccessProject(user, equipment.projectId)) return mutationError(403, "Permission denied.");
    const index = db.equipment.findIndex((item) => item.id === equipment.id);
    if (index === -1) {
      db.equipment.push(equipment);
    } else {
      db.equipment[index] = { ...db.equipment[index], ...equipment };
    }

    for (const record of db.records.filter((item) => item.equipmentId === equipment.id)) {
      record.projectId = equipment.projectId;
      record.locationId = equipment.locationId;
      record.team = equipment.team;
      record.serverUpdatedAt = Date.now();
    }

    appendAuditLog(db, user, index === -1 ? "equipment.create" : "equipment.update", "equipment", equipment.id, { projectId: equipment.projectId, name: equipment.name });
    return db;
  });
  if (sendMutationError(response, result)) return;

  response.json(filterDbForUser(result, request.auth.user));
});

app.post("/api/admin/project", requireAuth(["admin", "manager"]), async (request, response) => {
  const body = request.body || {};
  if (isPostgresMode) {
    const result = await updatePostgresProject(request.auth.user, body);
    if (sendMutationError(response, result)) return;
    response.json(result.data);
    return;
  }
  const result = await withDbMutation(async (db) => {
    const user = getFreshUser(db, request.auth.user);
    const index = db.projects.findIndex((item) => item.id === body.id);
    if (index === -1) return mutationError(404, "Project not found.");
    if (!canAccessProject(user, body.id)) return mutationError(403, "Permission denied.");
    db.projects[index] = {
      ...db.projects[index],
      name: body.name || db.projects[index].name,
      client: body.client ?? db.projects[index].client,
      manager: body.manager ?? db.projects[index].manager
    };
    appendAuditLog(db, user, "project.update", "project", body.id, { projectId: body.id, manager: db.projects[index].manager });
    return db;
  });
  if (sendMutationError(response, result)) return;

  response.json(filterDbForUser(result, request.auth.user));
});

app.post("/api/admin/user", requireAuth(["admin"]), async (request, response) => {
  const body = request.body || {};
  if (isPostgresMode) {
    const result = await upsertPostgresUser(request.auth.user, body);
    if (sendMutationError(response, result)) return;
    response.json(result.data);
    return;
  }
  const result = await withDbMutation(async (db) => {
    const user = getFreshUser(db, request.auth.user);
    const username = String(body.username || "").trim().toLowerCase();
    const name = String(body.name || username || "User").trim();
    const role = roles.includes(body.role) ? body.role : "field";
    const projectIds = Array.isArray(body.projectIds)
      ? body.projectIds.filter((id) => db.projects.some((project) => project.id === id))
      : String(body.projectIds || "").split(",").map((id) => id.trim()).filter((id) => db.projects.some((project) => project.id === id));
    if (!username) return mutationError(400, "Username is required.");
    const existingIndex = db.users.findIndex((item) => item.id === body.id || item.username.toLowerCase() === username);
    const nextUser = {
      id: existingIndex === -1 ? createId("u") : db.users[existingIndex].id,
      username,
      name,
      role,
      active: body.active === false || body.active === "false" ? false : true,
      projectIds: role === "admin" ? [] : projectIds,
      createdAt: existingIndex === -1 ? new Date().toISOString() : db.users[existingIndex].createdAt,
      passwordHash: db.users[existingIndex]?.passwordHash || hashPassword(body.password || createTemporaryPassword()),
      mustChangePassword: body.mustChangePassword === true || body.mustChangePassword === "true" || Boolean(body.password) || existingIndex === -1,
      failedLoginCount: Number(db.users[existingIndex]?.failedLoginCount || 0),
      lockedUntil: db.users[existingIndex]?.lockedUntil || "",
      passwordChangedAt: db.users[existingIndex]?.passwordChangedAt || ""
    };
    if (body.password) {
      nextUser.passwordHash = hashPassword(String(body.password));
      nextUser.failedLoginCount = 0;
      nextUser.lockedUntil = "";
      nextUser.passwordChangedAt = new Date().toISOString();
    }
    if (existingIndex === -1) {
      db.users.push(nextUser);
    } else {
      db.users[existingIndex] = { ...db.users[existingIndex], ...nextUser };
    }
    appendAuditLog(db, user, existingIndex === -1 ? "user.create" : "user.update", "user", nextUser.id, { role: nextUser.role, active: nextUser.active });
    return db;
  });
  if (sendMutationError(response, result)) return;
  response.json(filterDbForUser(result, request.auth.user));
});

app.post("/api/admin/user/unlock", requireAuth(["admin"]), asyncRoute(async (request, response) => {
  const userId = String(request.body?.id || "").trim();
  if (!userId) {
    response.status(400).json({ error: "User id is required." });
    return;
  }

  if (isPostgresMode) {
    await unlockPostgresUser(request.auth.user, userId);
    response.json(await getPostgresBootstrapForUser(request.auth.user));
    return;
  }

  const db = await withDbMutation(async (db) => {
    const admin = getFreshUser(db, request.auth.user);
    const user = db.users.find((item) => item.id === userId);
    if (!user) return mutationError(404, "User not found.");
    user.failedLoginCount = 0;
    user.lockedUntil = "";
    appendAuditLog(db, admin, "user.unlock", "user", user.id);
    return db;
  });
  if (sendMutationError(response, db)) return;
  response.json(filterDbForUser(db, request.auth.user));
}));

app.post("/api/admin/media", requireAuth(["admin", "manager", "engineer"]), async (request, response) => {
  const body = request.body || {};
  if (isPostgresMode) {
    const result = await createPostgresMedia(request.auth.user, body, Array.isArray(body.files) ? body.files : []);
    if (sendMutationError(response, result)) return;
    response.json(result.data);
    return;
  }
  const result = await withDbMutation(async (db) => {
    const user = getFreshUser(db, request.auth.user);
    db.media = Array.isArray(db.media) ? db.media : [];
    const equipment = db.equipment.find((item) => item.id === body.equipmentId);
    if (!equipment) return mutationError(404, "Equipment not found.");
    if (!canAccessProject(user, equipment.projectId)) return mutationError(403, "Permission denied.");
    const files = Array.isArray(body.files) ? body.files : [];
    const comments = String(body.comments || "").trim();
    if (!files.length && !comments) return mutationError(400, "Media file or comment is required.");
    appendMediaRecords(db, equipment, { category: body.category, title: body.title, reference: body.reference, comments, files });
    appendAuditLog(db, user, "media.create", "equipment", equipment.id, { projectId: equipment.projectId, files: files.length, category: body.category });
    return db;
  });
  if (sendMutationError(response, result)) return;

  response.json(filterDbForUser(result, request.auth.user));
});

app.post("/api/admin/row", requireAuth(["admin", "manager", "engineer"]), async (request, response) => {
  const body = request.body || {};
  if (isPostgresMode) {
    const result = await updatePostgresRow(request.auth.user, body);
    if (sendMutationError(response, result)) return;
    response.json(result.data);
    return;
  }
  const result = await withDbMutation(async (db) => {
    const user = getFreshUser(db, request.auth.user);
    const equipment = db.equipment.find((item) => item.id === body.equipmentId);
    const point = db.points.find((item) => item.id === body.pointId);
    const record = db.records.find((item) => item.id === body.recordId);
    if (!equipment || !point || !record) return mutationError(404, "Row target not found.");
    if (!canAccessProject(user, equipment.projectId) || !canAccessProject(user, body.projectId || equipment.projectId)) return mutationError(403, "Permission denied.");

    equipment.projectId = body.projectId || equipment.projectId;
    equipment.locationId = body.locationId || equipment.locationId;
    equipment.team = body.team || equipment.team;
    equipment.name = body.equipmentName || equipment.name;
    equipment.type = body.equipmentType || equipment.type;

    point.name = body.pointName || point.name;
    point.type = body.pointType || point.type;
    point.reference = body.reference ?? point.reference;
    point.status = body.status || point.status;

    record.projectId = equipment.projectId;
    record.locationId = equipment.locationId;
    record.team = equipment.team;
    record.equipmentId = equipment.id;
    record.pointId = point.id;
    record.title = `${equipment.name} - ${point.name}`;
    record.assignee = body.assignee ?? record.assignee;
    record.due = body.due ?? record.due;
    record.status = body.status || record.status;
    record.result = resultFromStatus(record.status);
    record.sync = "synced";
    record.updatedAt = new Date().toLocaleString("sv-SE");
    record.serverUpdatedAt = Date.now();

    appendAuditLog(db, user, "row.update", "record", record.id, { projectId: record.projectId, status: record.status });
    return db;
  });
  if (sendMutationError(response, result)) return;

  response.json(filterDbForUser(result, request.auth.user));
});

app.post("/api/admin/point", requireAuth(["admin", "manager", "engineer", "field"]), async (request, response) => {
  const body = request.body || {};
  if (isPostgresMode) {
    const result = await upsertPostgresPoint(request.auth.user, body);
    if (sendMutationError(response, result)) return;
    response.json(result.data);
    return;
  }
  const result = await withDbMutation(async (db) => {
    const user = getFreshUser(db, request.auth.user);
    const equipment = db.equipment.find((item) => item.id === body.equipmentId);
    if (!equipment) return mutationError(404, "Equipment not found.");
    if (!canAccessProject(user, equipment.projectId)) return mutationError(403, "Permission denied.");

    const point = {
      id: body.id || createId("pt"),
      equipmentId: equipment.id,
      name: body.name || "New Point",
      type: body.type || "Point",
      reference: body.reference || "",
      status: body.status || "pending"
    };
    const pointIndex = db.points.findIndex((item) => item.id === point.id);
    if (pointIndex === -1) {
      db.points.push(point);
    } else {
      db.points[pointIndex] = { ...db.points[pointIndex], ...point };
    }

    const recordTitle = `${equipment.name} - ${point.name}`;
    const recordIndex = db.records.findIndex((item) => item.pointId === point.id);
    if (recordIndex === -1) {
      db.records.push({
        id: createId("r"),
        projectId: equipment.projectId,
        locationId: equipment.locationId,
        team: equipment.team,
        equipmentId: equipment.id,
        pointId: point.id,
        title: recordTitle,
        status: point.status,
        result: point.status === "passed" ? "Pass" : point.status === "failed" ? "Fail" : "Pending",
        comments: "",
        photos: [],
        assignee: body.assignee || "",
        due: body.due || "",
        sync: "synced",
        updatedAt: new Date().toLocaleString("sv-SE"),
        serverUpdatedAt: Date.now()
      });
    } else {
      db.records[recordIndex] = {
        ...db.records[recordIndex],
        title: recordTitle,
        status: point.status,
        result: resultFromStatus(point.status),
        assignee: body.assignee ?? db.records[recordIndex].assignee,
        due: body.due ?? db.records[recordIndex].due,
        updatedAt: new Date().toLocaleString("sv-SE"),
        serverUpdatedAt: Date.now()
      };
    }

    appendAuditLog(db, user, pointIndex === -1 ? "point.create" : "point.update", "point", point.id, { projectId: equipment.projectId, equipmentId: equipment.id, status: point.status });
    return db;
  });
  if (sendMutationError(response, result)) return;

  response.json(filterDbForUser(result, request.auth.user));
});

app.post("/api/import/equipment", requireAuth(["admin", "manager"]), asyncRoute(async (request, response) => {
  const { fileName = "equipment.xlsx", base64 } = request.body;
  if (!base64) {
    metrics.importFailures += 1;
    response.status(400).json({ error: "Missing base64 Excel payload." });
    return;
  }

  const rows = await readImportRows(fileName, base64);
  if (!rows.length) {
    metrics.importFailures += 1;
    response.status(400).json({ error: "Excel file does not contain any import rows." });
    return;
  }
  if (isPostgresMode) {
    const result = await importPostgresEquipmentRows(request.auth.user, fileName, rows, {
      projectAliases,
      locationAliases,
      teamAliases,
      equipmentNameAliases,
      equipmentTypeAliases,
      pointNameAliases,
      pointTypeAliases,
      referenceAliases,
      assigneeAliases,
      dueAliases
    });
    if (!result.importedCount) {
      metrics.importFailures += 1;
      response.status(400).json({ error: "Excel file does not contain any valid equipment rows. Please check the Equipment column or use the exported template." });
      return;
    }
    response.json({ fileName, importedCount: result.importedCount, data: result.data });
    return;
  }
  const imported = [];

  const db = await withDbMutation(async (db) => {
    const user = getFreshUser(db, request.auth.user);
    for (const row of rows) {
      const name = pick(row, equipmentNameAliases);
      if (!name) continue;
      const projectName = pick(row, projectAliases) || db.projects[0]?.name || "Default Project";
      const locationName = pick(row, locationAliases) || "Unassigned";
      const team = pick(row, teamAliases) || "BMS";
      const type = pick(row, equipmentTypeAliases) || "Equipment";
      const pointName = pick(row, pointNameAliases);
      const pointType = pick(row, pointTypeAliases) || "Point";
      const reference = pick(row, referenceAliases) || "";
      const assignee = pick(row, assigneeAliases) || "";
      const due = pick(row, dueAliases) || "";

      const project = upsertByName(db.projects, { id: createId("p"), name: projectName, client: "" });
      if (!canAccessProject(user, project.id)) continue;
      const location = upsertLocation(db.locations, { id: createId("l"), projectId: project.id, name: locationName });
      let item = db.equipment.find((candidate) => candidate.name === name && candidate.locationId === location.id);
      if (!item) {
        item = { id: createId("e"), projectId: project.id, locationId: location.id, team, name, type, status: "pending" };
        db.equipment.push(item);
      } else {
        item.projectId = project.id;
        item.locationId = location.id;
        item.team = team;
        item.type = type;
      }

      if (pointName) {
        let point = db.points.find((candidate) => candidate.equipmentId === item.id && candidate.name.trim().toLowerCase() === pointName.trim().toLowerCase());
        if (!point) {
          point = { id: createId("pt"), equipmentId: item.id, name: pointName, type: pointType, reference, status: "pending" };
          db.points.push(point);
        } else {
          point.type = pointType;
          point.reference = reference;
        }

        const recordIndex = db.records.findIndex((candidate) => candidate.pointId === point.id);
        const existingRecord = recordIndex === -1 ? null : db.records[recordIndex];
        const status = point.status || existingRecord?.status || "pending";
        const nextRecord = {
          projectId: project.id,
          locationId: location.id,
          team,
          equipmentId: item.id,
          pointId: point.id,
          title: `${name} - ${pointName}`,
          status,
          result: resultFromStatus(status),
          assignee: assignee || existingRecord?.assignee || "",
          due: due || existingRecord?.due || "",
          sync: "synced",
          updatedAt: new Date().toLocaleString("sv-SE"),
          serverUpdatedAt: Date.now()
        };
        if (recordIndex === -1) {
          db.records.push({ id: createId("r"), comments: "", photos: [], ...nextRecord });
        } else {
          db.records[recordIndex] = {
            ...existingRecord,
            ...nextRecord,
            comments: existingRecord.comments || "",
            photos: existingRecord.photos || []
          };
        }
      }
      imported.push(item);
    }

    appendAuditLog(db, user, "equipment.import", "import", fileName, { importedCount: imported.length });
    return db;
  });
  if (!imported.length) {
    metrics.importFailures += 1;
    response.status(400).json({ error: "Excel file does not contain any valid equipment rows. Please check the Equipment column or use the exported template." });
    return;
  }
  response.json({ fileName, importedCount: imported.length, data: filterDbForUser(db, request.auth.user) });
}));

app.use((error, request, response, _next) => {
  sendApiError(response, error, request);
});

app.listen(port, () => {
  logEvent("info", "api.started", { port, dataStore: startupMode.dataStore });
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await disconnectPrisma().catch(() => {});
    process.exit(0);
  });
}

async function readDb() {
  assertJsonDataStore();
  await dbWriteQueue.catch(() => {});
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(dbPath)) {
    const seed = existsSync(seedDbPath) ? await readFile(seedDbPath, "utf8") : `${JSON.stringify(createEmptyDb(), null, 2)}\n`;
    await writeFile(dbPath, seed.endsWith("\n") ? seed : `${seed}\n`);
  }
  const content = await readFile(dbPath, "utf8");
  const db = JSON.parse(content.replace(/^\uFEFF/, ""));
  db.media = Array.isArray(db.media) ? db.media : [];
  ensureSecurityData(db);
  return db;
}

function createEmptyDb() {
  const db = { version: 1, projects: [], locations: [], equipment: [], points: [], media: [], records: [], users: [], auditLogs: [] };
  ensureSecurityData(db);
  return db;
}

async function writeDb(db) {
  assertJsonDataStore();
  dbWriteQueue = dbWriteQueue.catch(() => {}).then(() => writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`));
  await dbWriteQueue;
}

async function withDbMutation(handler) {
  assertJsonDataStore();
  const run = dbMutationQueue
    .catch(() => {})
    .then(async () => {
      const db = await readDb();
      const result = await handler(db);
      if (result?.mutationError) return result;
      refreshDerivedStatuses(db);
      await writeDb(db);
      return result ?? db;
    });
  dbMutationQueue = run;
  return run;
}

function mutationError(status, message) {
  return { mutationError: true, status, error: message };
}

function sendMutationError(response, result) {
  if (!result?.mutationError) return false;
  response.status(result.status || 500).json({ error: result.error || "Database mutation failed." });
  return true;
}

function assertJsonDataStore() {
  if (!isPostgresMode) return;
  const error = new Error("PostgreSQL runtime repositories are not enabled for this endpoint yet. Set DATA_STORE=json or complete the repository migration.");
  error.status = 503;
  throw error;
}

async function checkStorageReady() {
  try {
    await mkdir(uploadDir, { recursive: true });
    await readFile(seedDbPath, "utf8").catch(() => "");
    return { ok: true, uploadDir: path.relative(rootDir, uploadDir) };
  } catch (error) {
    return { ok: false, uploadDir: path.relative(rootDir, uploadDir), error: error.message };
  }
}

function ensureSecurityData(db) {
  db.users = Array.isArray(db.users) ? db.users : [];
  db.auditLogs = Array.isArray(db.auditLogs) ? db.auditLogs : [];
  db.sessions = Array.isArray(db.sessions) ? db.sessions : [];
  db.sessions = db.sessions.filter((session) => Number(session.expiresAt || 0) > Date.now());
  if (!allowDemoUsers && !db.users.length) {
    throw new Error("Production startup requires seeded users. Set ALLOW_DEMO_USERS=true only for local development.");
  }
  for (const user of db.users) normalizeSecurityUser(user);
  if (!allowDemoUsers && db.users.some(isDefaultDemoUser)) {
    throw new Error("Production startup blocked because demo users are present. Rename or replace seeded accounts before deployment.");
  }
  if (!allowDemoUsers) return;
  for (const user of defaultUsers) {
    if (db.users.some((item) => item.username?.toLowerCase() === user.username.toLowerCase())) continue;
    db.users.push({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      passwordHash: hashPassword(user.password),
      active: user.active,
      projectIds: user.projectIds,
      mustChangePassword: true,
      failedLoginCount: 0,
      lockedUntil: "",
      passwordChangedAt: "",
      createdAt: new Date().toISOString()
    });
  }
}

function normalizeSecurityUser(user) {
  const hasMustChangeFlag = Object.prototype.hasOwnProperty.call(user, "mustChangePassword");
  user.mustChangePassword = hasMustChangeFlag ? user.mustChangePassword === true : isDefaultDemoUser(user);
  user.failedLoginCount = Number(user.failedLoginCount || 0);
  user.lockedUntil = user.lockedUntil || "";
  user.passwordChangedAt = user.passwordChangedAt || "";
}

function isDefaultDemoUser(user) {
  return defaultUsers.some((item) => item.id === user?.id || item.username === String(user?.username || "").toLowerCase());
}

function hashPassword(password) {
  return bcrypt.hashSync(String(password), bcryptRounds);
}

function legacyPasswordHash(password) {
  return createHash("sha256").update(`elv:${password}`).digest("hex");
}

function isLegacyPasswordHash(passwordHash) {
  return typeof passwordHash === "string" && /^[a-f0-9]{64}$/i.test(passwordHash);
}

function isUserLocked(user) {
  const lockedUntil = user?.lockedUntil ? new Date(user.lockedUntil).getTime() : 0;
  return Number.isFinite(lockedUntil) && lockedUntil > Date.now();
}

function lockRemainingSeconds(user) {
  const lockedUntil = user?.lockedUntil ? new Date(user.lockedUntil).getTime() : 0;
  return Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000));
}

function registerJsonFailedLogin(db, user) {
  if (!user) return null;
  normalizeSecurityUser(user);
  user.failedLoginCount += 1;
  if (user.failedLoginCount >= loginLockThreshold) {
    user.lockedUntil = new Date(Date.now() + loginLockDurationMs).toISOString();
  }
  return user;
}

function resetJsonLoginFailures(user) {
  if (!user) return;
  user.failedLoginCount = 0;
  user.lockedUntil = "";
}

function validatePasswordChangePayload(currentPassword, nextPassword) {
  if (!String(currentPassword || "")) return "Current password is required.";
  if (String(nextPassword || "").length < 10) return "New password must be at least 10 characters.";
  if (String(currentPassword) === String(nextPassword)) return "New password must be different from the current password.";
  return "";
}

async function verifyPassword(password, user) {
  const passwordHash = user?.passwordHash;
  if (!passwordHash) return false;
  if (isLegacyPasswordHash(passwordHash)) {
    return passwordHash === legacyPasswordHash(password);
  }
  return bcrypt.compare(String(password), passwordHash);
}

function createSession(db, user) {
  const token = randomUUID();
  db.sessions = Array.isArray(db.sessions) ? db.sessions : [];
  db.sessions.push({ token, userId: user.id, createdAt: Date.now(), expiresAt: Date.now() + sessionDurationMs });
  return token;
}

function createTemporaryPassword() {
  return `Change-${randomUUID().replace(/-/g, "").slice(0, 18)}`;
}

function getBearerToken(request) {
  const header = request.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function getUserFromRequest(request, db) {
  const token = getBearerToken(request);
  if (!token) return null;
  db.sessions = Array.isArray(db.sessions) ? db.sessions : [];
  const session = db.sessions.find((item) => item.token === token);
  if (!session || session.expiresAt < Date.now()) {
    db.sessions = db.sessions.filter((item) => item.token !== token && Number(item.expiresAt || 0) > Date.now());
    return null;
  }
  return db.users.find((item) => item.id === session.userId && item.active !== false) || null;
}

function getFreshUser(db, user) {
  return db.users.find((item) => item.id === user?.id && item.active !== false) || user;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    active: user.active !== false,
    mustChangePassword: user.mustChangePassword === true,
    failedLoginCount: Number(user.failedLoginCount || 0),
    lockedUntil: user.lockedUntil || "",
    passwordChangedAt: user.passwordChangedAt || "",
    projectIds: Array.isArray(user.projectIds) ? user.projectIds : []
  };
}

function canAccessProject(user, projectId) {
  if (!user || user.role === "admin") return true;
  const projectIds = Array.isArray(user.projectIds) ? user.projectIds : [];
  return !projectId || projectIds.includes(projectId);
}

function filterDbForUser(db, user) {
  if (!user || user.role === "admin") return sanitizeDbForClient(db);
  const allowedProjects = new Set(Array.isArray(user.projectIds) ? user.projectIds : []);
  const equipment = db.equipment.filter((item) => allowedProjects.has(item.projectId));
  const equipmentIds = new Set(equipment.map((item) => item.id));
  const points = db.points.filter((item) => equipmentIds.has(item.equipmentId));
  const pointIds = new Set(points.map((item) => item.id));
  return sanitizeDbForClient({
    ...db,
    projects: db.projects.filter((item) => allowedProjects.has(item.id)),
    locations: db.locations.filter((item) => allowedProjects.has(item.projectId)),
    equipment,
    points,
    records: db.records.filter((item) => allowedProjects.has(item.projectId) && equipmentIds.has(item.equipmentId) && pointIds.has(item.pointId)),
    media: (db.media || []).filter((item) => allowedProjects.has(item.projectId) && equipmentIds.has(item.equipmentId)),
    auditLogs: (db.auditLogs || []).filter((item) => allowedProjects.has(item.projectId) || item.userId === user.id),
    users: []
  }, { includeUsers: false });
}

function sanitizeDbForClient(db, options = {}) {
  const includeUsers = options.includeUsers !== false;
  const { sessions: _sessions, ...clientDb } = db;
  return {
    ...clientDb,
    users: includeUsers ? (db.users || []).map(publicUser) : [],
    auditLogs: [...(db.auditLogs || [])].slice(-300).reverse()
  };
}

function appendAuditLog(db, user, action, targetType, targetId, details = {}, success = true) {
  db.auditLogs = Array.isArray(db.auditLogs) ? db.auditLogs : [];
  db.auditLogs.push({
    id: createId("log"),
    userId: user?.id || "",
    userName: user?.name || user?.username || "Guest",
    role: user?.role || "guest",
    action,
    targetType,
    targetId: targetId || "",
    projectId: details.projectId || "",
    success,
    details,
    createdAt: new Date().toISOString()
  });
  if (db.auditLogs.length > 1000) db.auditLogs = db.auditLogs.slice(-1000);
}

async function saveAttachment(file) {
  const parsed = parseDataUrl(file?.dataUrl);
  if (!parsed) {
    const error = new Error("Attachment must be a data URL.");
    error.status = 400;
    throw error;
  }
  const originalName = sanitizeFileName(file.name || "attachment");
  validateUploadFile({ name: originalName, type: file.type || parsed.mimeType, size: parsed.buffer.length, mimeType: parsed.mimeType });
  const extension = getSafeExtension(originalName, file.type || parsed.mimeType);
  const storedName = `${Date.now()}-${randomUUID()}${extension}`;
  await writeFile(path.join(uploadDir, storedName), parsed.buffer);
  return {
    name: originalName,
    type: file.type || parsed.mimeType,
    size: parsed.buffer.length,
    url: `/uploads/${storedName}`,
    uploadedAt: new Date().toISOString()
  };
}

async function saveMulterAttachment(file) {
  const originalName = sanitizeFileName(file.originalname || "attachment");
  validateUploadFile({ name: originalName, type: file.mimetype, size: file.size, mimeType: file.mimetype });
  const extension = getSafeExtension(originalName, file.mimetype);
  const storedName = `${Date.now()}-${randomUUID()}${extension}`;
  await writeFile(path.join(uploadDir, storedName), file.buffer);
  return {
    name: originalName,
    type: file.mimetype || "application/octet-stream",
    size: file.size,
    url: `/uploads/${storedName}`,
    uploadedAt: new Date().toISOString()
  };
}

async function deleteUploadedFiles(files) {
  await Promise.all(
    files
      .map((file) => file?.url)
      .filter((url) => typeof url === "string" && url.startsWith("/uploads/"))
      .map((url) => rm(path.join(uploadDir, path.basename(url)), { force: true }).catch(() => {}))
  );
}

function validateUploadFile(file) {
  const size = Number(file.size || 0);
  if (size > maxUploadFileBytes) {
    const error = new Error(`File is too large. Each file must be under ${Math.round(maxUploadFileBytes / 1024 / 1024)} MB.`);
    error.status = 413;
    throw error;
  }
  const type = normalizeMimeType(file.type || file.mimeType || "");
  const ext = path.extname(file.name || "").toLowerCase();
  const allowedExtensions = allowedUploadTypes.get(type) || (type === "application/octet-stream" ? getAllowedExtensions() : null);
  if (!allowedExtensions || !allowedExtensions.includes(ext)) {
    const error = new Error(`Unsupported file type: ${file.name || type || "unknown"}.`);
    error.status = 400;
    throw error;
  }
}

function appendMediaRecords(db, equipment, payload) {
  const files = Array.isArray(payload.files) ? payload.files : [];
  const comments = String(payload.comments || "").trim();
  const title = String(payload.title || "").trim();
  const reference = String(payload.reference || "").trim();
  const category = String(payload.category || "document").trim() || "document";
  const createdAt = new Date().toISOString();
  if (files.length) {
    for (const file of files) {
      db.media.push({
        id: createId("m"),
        equipmentId: equipment.id,
        projectId: equipment.projectId,
        locationId: equipment.locationId,
        category,
        title,
        reference,
        comments,
        file,
        createdAt
      });
    }
    return;
  }
  db.media.push({
    id: createId("m"),
    equipmentId: equipment.id,
    projectId: equipment.projectId,
    locationId: equipment.locationId,
    category,
    title,
    reference,
    comments,
    file: null,
    createdAt
  });
}

async function readImportRows(fileName, base64) {
  try {
    if (!/^[A-Za-z0-9+/=\s]+$/.test(String(base64 || ""))) {
      throw new Error("Invalid base64 payload.");
    }
    const buffer = Buffer.from(base64, "base64");
    if (!buffer.length) throw new Error("Empty import payload.");
    const name = String(fileName || "").toLowerCase();
    if (name.endsWith(".csv")) return parseCsvRows(buffer.toString("utf8"));
    if (!name.endsWith(".xlsx")) {
      const error = new Error("Unsupported import file. Please use .xlsx or .csv.");
      error.status = 400;
      throw error;
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      const error = new Error("Excel file does not contain a readable worksheet.");
      error.status = 400;
      throw error;
    }
    return worksheetToRows(worksheet);
  } catch (caughtError) {
    if (caughtError?.status) throw caughtError;
    const error = new Error("Unable to read Excel file. Please use the exported template format.");
    error.status = 400;
    throw error;
  }
}

function worksheetToRows(worksheet) {
  const headers = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    headers[columnNumber - 1] = cellToText(cell.value);
  });
  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const item = {};
    headers.forEach((header, index) => {
      if (!header) return;
      item[header] = cellToText(row.getCell(index + 1).value);
    });
    if (Object.values(item).some((value) => String(value).trim())) rows.push(item);
  });
  return rows;
}

function cellToText(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if (value.text) return String(value.text);
    if (value.result !== undefined) return cellToText(value.result);
    if (Array.isArray(value.richText)) return value.richText.map((item) => item.text || "").join("");
    if (value.hyperlink && value.text) return String(value.text);
  }
  return String(value).trim();
}

function parseCsvRows(content) {
  const rows = parseCsv(content.replace(/^\uFEFF/, ""));
  if (!rows.length) return [];
  const headers = rows[0].map((header) => String(header || "").trim());
  return rows.slice(1).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      if (header) item[header] = String(row[index] || "").trim();
    });
    return item;
  }).filter((item) => Object.values(item).some((value) => String(value).trim()));
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
      continue;
    }
    value += char;
  }
  row.push(value);
  if (row.some((cell) => cell !== "")) rows.push(row);
  return rows;
}

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:([^;,]+)?;base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1] || "application/octet-stream",
    buffer: Buffer.from(match[2], "base64")
  };
}

function sanitizeFileName(name) {
  const clean = path.basename(String(name)).replace(/[^\w.\- ()\u4e00-\u9fff]/g, "_").trim();
  return clean || "attachment";
}

function getSafeExtension(name, mimeType) {
  const ext = path.extname(name).toLowerCase();
  const type = normalizeMimeType(mimeType);
  const allowedExtensions = allowedUploadTypes.get(type) || [];
  if (allowedExtensions.includes(ext)) return ext;
  if (type === "application/octet-stream" && getAllowedExtensions().includes(ext)) return ext;
  return allowedExtensions[0] || ".bin";
}

function normalizeMimeType(mimeType) {
  const type = String(mimeType || "").toLowerCase();
  return type;
}

function getAllowedExtensions() {
  return [...new Set([...allowedUploadTypes.values()].flat())];
}

function validateEquipmentPayload(db, body, prefix) {
  const projectId = String(body.projectId || "").trim();
  const locationId = String(body.locationId || "").trim();
  const name = String(body.name || "").trim();
  const project = db.projects.find((item) => item.id === projectId);
  const location = db.locations.find((item) => item.id === locationId);
  if (!projectId || !locationId || !name) {
    return mutationError(400, "projectId, locationId and name are required.");
  }
  if (!project) return mutationError(400, "Project not found.");
  if (!location || location.projectId !== projectId) return mutationError(400, "Location not found for project.");
  return {
    id: body.id || createId(prefix),
    projectId,
    locationId,
    team: String(body.team || "BMS").trim() || "BMS",
    name,
    type: String(body.type || "Equipment").trim() || "Equipment",
    status: String(body.status || "pending").trim() || "pending"
  };
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function pick(row, names) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

function upsertByName(collection, item) {
  const existing = collection.find((candidate) => candidate.name === item.name);
  if (existing) return existing;
  collection.push(item);
  return item;
}

function upsertLocation(collection, item) {
  const existing = collection.find((candidate) => candidate.name === item.name && candidate.projectId === item.projectId);
  if (existing) return existing;
  collection.push(item);
  return item;
}

function refreshDerivedStatuses(db) {
  for (const point of db.points) {
    const records = db.records.filter((record) => record.pointId === point.id);
    if (records.length) point.status = summarizeStatus(records);
  }
  for (const item of db.equipment) {
    const records = db.records.filter((record) => record.equipmentId === item.id);
    if (records.length) item.status = summarizeStatus(records);
  }
}

function summarizeStatus(records) {
  if (records.some((record) => record.status === "failed")) return "failed";
  if (records.some((record) => record.status === "rectification")) return "rectification";
  if (records.every((record) => ["passed", "closed"].includes(record.status))) return "passed";
  return "pending";
}

function resultFromStatus(status) {
  if (status === "passed") return "Pass";
  if (status === "failed") return "Fail";
  if (status === "closed") return "N/A";
  if (status === "rectification") return "Rectification";
  return "Pending";
}
