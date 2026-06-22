import express from "express";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import XLSX from "xlsx";

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
let dbWriteQueue = Promise.resolve();
let dbMutationQueue = Promise.resolve();

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

app.use((request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json({ limit: jsonLimit }));
app.use("/uploads", express.static(uploadDir));

app.use((error, _request, response, next) => {
  if (!error) {
    next();
    return;
  }
  sendApiError(response, error);
});

function sendApiError(response, error) {
  if (response.headersSent) return;
  console.warn("API request rejected:", error.type || error.name || "Error", error.message);
  if (error.type === "entity.too.large" || error.code === "LIMIT_FILE_SIZE") {
    response.status(413).json({ error: "Upload is too large. Please split files or compress images before uploading." });
    return;
  }
  if (error.type === "entity.parse.failed") {
    response.status(400).json({ error: "Invalid JSON request payload." });
    return;
  }
  if (error.code === "LIMIT_FILE_COUNT") {
    response.status(413).json({ error: `Too many files. Upload up to ${maxUploadFiles} files at a time.` });
    return;
  }
  if (error.status) {
    response.status(error.status).json({ error: error.message || "Request failed." });
    return;
  }
  response.status(error.status || 400).json({ error: error.message || "Invalid request payload." });
}

const asyncRoute = (handler) => async (request, response) => {
  try {
    await handler(request, response);
  } catch (error) {
    sendApiError(response, error);
  }
};

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, time: Date.now() });
});

app.get("/api/bootstrap", async (_request, response) => {
  response.json(await readDb());
});

app.get("/api/template/equipment", (_request, response) => {
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
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 30 },
    { wch: 32 },
    { wch: 14 },
    { wch: 24 },
    { wch: 18 },
    { wch: 28 },
    { wch: 18 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 72 }
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Equipment Import");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  response.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  response.setHeader("Content-Disposition", "attachment; filename=\"elv-equipment-import-template.xlsx\"");
  response.send(buffer);
});

app.post("/api/sync", async (request, response) => {
  const incoming = Array.isArray(request.body.records) ? request.body.records : [];
  const conflicts = [];
  const db = await withDbMutation(async (db) => {
    for (const record of incoming) {
      const index = db.records.findIndex((item) => item.id === record.id);
      const nextRecord = { ...record, sync: "synced", serverUpdatedAt: Date.now() };
      if (index === -1) {
        db.records.push(nextRecord);
        continue;
      }

      const current = db.records[index];
      const serverTime = Number(current.serverUpdatedAt || 0);
      if (record.baseServerUpdatedAt && Number(record.baseServerUpdatedAt) < serverTime) {
        conflicts.push({ local: record, server: current });
        continue;
      }
      db.records[index] = nextRecord;
    }

    return db;
  });
  response.json({ ...db, conflicts });
});

app.post("/api/attachments", upload.array("files", maxUploadFiles), asyncRoute(async (request, response) => {
  const multipartFiles = Array.isArray(request.files) ? request.files : [];
  const files = multipartFiles.length ? multipartFiles : Array.isArray(request.body.files) ? request.body.files : [];
  if (!files.length) {
    response.status(400).json({ error: "Missing attachment files." });
    return;
  }

  await mkdir(uploadDir, { recursive: true });
  const totalSize = files.reduce((sum, file) => sum + Number(file.size || file.buffer?.length || 0), 0);
  if (totalSize > maxUploadTotalBytes) {
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
  upload.array("files", maxUploadFiles),
  asyncRoute(async (request, response) => {
    const body = request.body || {};
    const files = Array.isArray(request.files) ? request.files : [];
    const totalSize = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
    const comments = String(body.comments || "").trim();
    if (!files.length && !comments) {
      response.status(400).json({ error: "Media file or comment is required." });
      return;
    }
    if (totalSize > maxUploadTotalBytes) {
      response.status(413).json({ error: `Upload is too large. Upload less than ${Math.round(maxUploadTotalBytes / 1024 / 1024)} MB at a time.` });
      return;
    }

    await mkdir(uploadDir, { recursive: true });
    const savedFiles = [];
    try {
      for (const file of files) {
        savedFiles.push(await saveMulterAttachment(file));
      }

      const result = await withDbMutation(async (db) => {
        db.media = Array.isArray(db.media) ? db.media : [];
        const equipment = db.equipment.find((item) => item.id === body.equipmentId);
        if (!equipment) return mutationError(404, "Equipment not found.");
        appendMediaRecords(db, equipment, {
          category: body.category,
          title: body.title,
          reference: body.reference,
          comments,
          files: savedFiles
        });
        return db;
      });
      if (sendMutationError(response, result)) {
        await deleteUploadedFiles(savedFiles);
        return;
      }
      response.json(result);
    } catch (error) {
      await deleteUploadedFiles(savedFiles);
      throw error;
    }
  })
);

app.post("/api/equipment", async (request, response) => {
  const result = await withDbMutation(async (db) => {
    const item = validateEquipmentPayload(db, request.body || {}, "eq");
    if (item.mutationError) return item;
    db.equipment.push(item);
    return item;
  });
  if (sendMutationError(response, result)) return;
  response.status(201).json(result);
});

app.post("/api/admin/equipment", async (request, response) => {
  const body = request.body || {};
  const result = await withDbMutation(async (db) => {
    const equipment = validateEquipmentPayload(db, body, "e");
    if (equipment.mutationError) return equipment;
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

    return db;
  });
  if (sendMutationError(response, result)) return;
  response.json(result);
});

app.post("/api/admin/project", async (request, response) => {
  const body = request.body || {};
  const result = await withDbMutation(async (db) => {
    const index = db.projects.findIndex((item) => item.id === body.id);
    if (index === -1) return mutationError(404, "Project not found.");
    db.projects[index] = {
      ...db.projects[index],
      name: body.name || db.projects[index].name,
      client: body.client ?? db.projects[index].client,
      manager: body.manager ?? db.projects[index].manager
    };
    return db;
  });
  if (sendMutationError(response, result)) return;
  response.json(result);
});

app.post("/api/admin/media", async (request, response) => {
  const body = request.body || {};
  const result = await withDbMutation(async (db) => {
    db.media = Array.isArray(db.media) ? db.media : [];
    const equipment = db.equipment.find((item) => item.id === body.equipmentId);
    if (!equipment) return mutationError(404, "Equipment not found.");
    const files = Array.isArray(body.files) ? body.files : [];
    const comments = String(body.comments || "").trim();
    if (!files.length && !comments) return mutationError(400, "Media file or comment is required.");
    appendMediaRecords(db, equipment, { category: body.category, title: body.title, reference: body.reference, comments, files });
    return db;
  });
  if (sendMutationError(response, result)) return;
  response.json(result);
});

app.post("/api/admin/row", async (request, response) => {
  const body = request.body || {};
  const result = await withDbMutation(async (db) => {
    const equipment = db.equipment.find((item) => item.id === body.equipmentId);
    const point = db.points.find((item) => item.id === body.pointId);
    const record = db.records.find((item) => item.id === body.recordId);
    if (!equipment || !point || !record) return mutationError(404, "Row target not found.");

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

    return db;
  });
  if (sendMutationError(response, result)) return;
  response.json(result);
});

app.post("/api/admin/point", async (request, response) => {
  const body = request.body || {};
  const result = await withDbMutation(async (db) => {
    const equipment = db.equipment.find((item) => item.id === body.equipmentId);
    if (!equipment) return mutationError(404, "Equipment not found.");

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

    return db;
  });
  if (sendMutationError(response, result)) return;
  response.json(result);
});

app.post("/api/import/equipment", asyncRoute(async (request, response) => {
  const { fileName = "equipment.xlsx", base64 } = request.body;
  if (!base64) {
    response.status(400).json({ error: "Missing base64 Excel payload." });
    return;
  }

  const workbook = readImportWorkbook(base64);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    response.status(400).json({ error: "Excel file does not contain a readable worksheet." });
    return;
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (!rows.length) {
    response.status(400).json({ error: "Excel file does not contain any import rows." });
    return;
  }
  const imported = [];

  const db = await withDbMutation(async (db) => {
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

    return db;
  });
  if (!imported.length) {
    response.status(400).json({ error: "Excel file does not contain any valid equipment rows. Please check the Equipment column or use the exported template." });
    return;
  }
  response.json({ fileName, importedCount: imported.length, data: db });
}));

app.use((error, _request, response, _next) => {
  sendApiError(response, error);
});

app.listen(port, () => {
  console.log(`ELV acceptance API listening on http://127.0.0.1:${port}`);
});

async function readDb() {
  await dbWriteQueue.catch(() => {});
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(dbPath)) {
    const seed = existsSync(seedDbPath) ? await readFile(seedDbPath, "utf8") : `${JSON.stringify(createEmptyDb(), null, 2)}\n`;
    await writeFile(dbPath, seed.endsWith("\n") ? seed : `${seed}\n`);
  }
  const content = await readFile(dbPath, "utf8");
  const db = JSON.parse(content.replace(/^\uFEFF/, ""));
  db.media = Array.isArray(db.media) ? db.media : [];
  return db;
}

function createEmptyDb() {
  return { version: 1, projects: [], locations: [], equipment: [], points: [], media: [], records: [] };
}

async function writeDb(db) {
  dbWriteQueue = dbWriteQueue.catch(() => {}).then(() => writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`));
  await dbWriteQueue;
}

async function withDbMutation(handler) {
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

function readImportWorkbook(base64) {
  try {
    if (!/^[A-Za-z0-9+/=\s]+$/.test(String(base64 || ""))) {
      throw new Error("Invalid base64 payload.");
    }
    const buffer = Buffer.from(base64, "base64");
    if (!buffer.length) throw new Error("Empty Excel payload.");
    return XLSX.read(buffer, { type: "buffer" });
  } catch {
    const error = new Error("Unable to read Excel file. Please use the exported template format.");
    error.status = 400;
    throw error;
  }
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
