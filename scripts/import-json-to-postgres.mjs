import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const rootDir = process.cwd();
const defaultDbPath = path.join(rootDir, "data", "db.json");
const seedDbPath = path.join(rootDir, "data", "seed.json");
const sourcePath = process.argv[2] || (existsSync(defaultDbPath) ? defaultDbPath : seedDbPath);
const prisma = new PrismaClient();
const validStatuses = new Set(["pending", "passed", "failed", "rectification", "closed"]);
const defaultUsers = [
  { id: "u-admin", username: "admin", name: "System Admin", role: "admin", password: "admin123", active: true, projectIds: [] },
  { id: "u-manager", username: "manager", name: "Project Manager", role: "manager", password: "manager123", active: true, projectIds: ["p1", "p2"] },
  { id: "u-engineer", username: "engineer", name: "Site Engineer", role: "engineer", password: "engineer123", active: true, projectIds: ["p1"] },
  { id: "u-field", username: "field", name: "Field User", role: "field", password: "field123", active: true, projectIds: ["p1"] }
];

async function main() {
  const db = JSON.parse((await readFile(sourcePath, "utf8")).replace(/^\uFEFF/, ""));
  normalizeDb(db);
  await prisma.$transaction(async (tx) => {
    await clearDatabase(tx);
    await importProjects(tx, db);
    await importLocations(tx, db);
    await importEquipment(tx, db);
    await importPoints(tx, db);
    await importRecords(tx, db);
    await importMedia(tx, db);
    await importUsers(tx, db);
    await importAuditLogs(tx, db);
  }, { timeout: 60_000 });
  console.log(JSON.stringify({
    source: path.relative(rootDir, sourcePath),
    projects: db.projects.length,
    locations: db.locations.length,
    equipment: db.equipment.length,
    points: db.points.length,
    records: db.records.length,
    media: db.media.length,
    users: db.users.length,
    auditLogs: db.auditLogs.length
  }, null, 2));
}

function normalizeDb(db) {
  db.projects = Array.isArray(db.projects) ? db.projects : [];
  db.locations = Array.isArray(db.locations) ? db.locations : [];
  db.equipment = Array.isArray(db.equipment) ? db.equipment : [];
  db.points = Array.isArray(db.points) ? db.points : [];
  db.records = Array.isArray(db.records) ? db.records : [];
  db.media = Array.isArray(db.media) ? db.media : [];
  db.users = Array.isArray(db.users) && db.users.length ? db.users : defaultUsers.map((user) => ({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    passwordHash: bcrypt.hashSync(user.password, Number(process.env.BCRYPT_ROUNDS || 12)),
    active: user.active,
    projectIds: user.projectIds,
    createdAt: new Date().toISOString()
  }));
  db.auditLogs = Array.isArray(db.auditLogs) ? db.auditLogs : [];
}

async function clearDatabase(tx) {
  await tx.auditLog.deleteMany();
  await tx.syncConflict.deleteMany();
  await tx.session.deleteMany();
  await tx.userProjectAccess.deleteMany();
  await tx.user.deleteMany();
  await tx.attachment.deleteMany();
  await tx.mediaAsset.deleteMany();
  await tx.inspectionRecord.deleteMany();
  await tx.point.deleteMany();
  await tx.equipment.deleteMany();
  await tx.location.deleteMany();
  await tx.project.deleteMany();
}

async function importProjects(tx, db) {
  for (const project of db.projects) {
    await tx.project.create({
      data: {
        id: String(project.id),
        name: String(project.name || "Untitled Project"),
        client: project.client || null,
        manager: project.manager || null
      }
    });
  }
}

async function importLocations(tx, db) {
  for (const [index, location] of db.locations.entries()) {
    if (!db.projects.some((project) => project.id === location.projectId)) continue;
    await tx.location.create({
      data: {
        id: String(location.id),
        projectId: String(location.projectId),
        type: location.type && ["project", "building", "floor", "room", "area"].includes(location.type) ? location.type : "area",
        name: String(location.name || "Unassigned"),
        path: location.path || location.name || null,
        sortOrder: Number(location.sortOrder ?? index)
      }
    });
  }
  const locationIds = new Set(db.locations.map((item) => item.id));
  for (const location of db.locations) {
    if (!location.parentId || !locationIds.has(location.parentId)) continue;
    await tx.location.update({
      where: { id: String(location.id) },
      data: { parentId: String(location.parentId) }
    });
  }
}

async function importEquipment(tx, db) {
  const projectIds = new Set(db.projects.map((item) => item.id));
  const locationIds = new Set(db.locations.map((item) => item.id));
  for (const item of db.equipment) {
    if (!projectIds.has(item.projectId) || !locationIds.has(item.locationId)) continue;
    await tx.equipment.create({
      data: {
        id: String(item.id),
        projectId: String(item.projectId),
        locationId: String(item.locationId),
        team: String(item.team || "BMS"),
        name: String(item.name || "Equipment"),
        type: String(item.type || "Equipment"),
        status: toStatus(item.status),
        revision: Number(item.revision || 1)
      }
    });
  }
}

async function importPoints(tx, db) {
  const equipmentIds = new Set(db.equipment.map((item) => item.id));
  for (const point of db.points) {
    if (!equipmentIds.has(point.equipmentId)) continue;
    await tx.point.create({
      data: {
        id: String(point.id),
        equipmentId: String(point.equipmentId),
        name: String(point.name || "Point"),
        type: String(point.type || "Point"),
        reference: point.reference || null,
        status: toStatus(point.status),
        revision: Number(point.revision || 1)
      }
    });
  }
}

async function importRecords(tx, db) {
  const projectIds = new Set(db.projects.map((item) => item.id));
  const locationIds = new Set(db.locations.map((item) => item.id));
  const equipmentIds = new Set(db.equipment.map((item) => item.id));
  const pointIds = new Set(db.points.map((item) => item.id));
  for (const record of db.records) {
    if (!projectIds.has(record.projectId) || !locationIds.has(record.locationId) || !equipmentIds.has(record.equipmentId)) continue;
    await tx.inspectionRecord.create({
      data: {
        id: String(record.id),
        projectId: String(record.projectId),
        locationId: String(record.locationId),
        equipmentId: String(record.equipmentId),
        pointId: pointIds.has(record.pointId) ? String(record.pointId) : null,
        team: String(record.team || "BMS"),
        title: String(record.title || "Inspection Record"),
        result: String(record.result || resultFromStatus(record.status)),
        status: toStatus(record.status),
        comments: record.comments || null,
        assignee: record.assignee || null,
        due: parseDateOnly(record.due),
        syncState: record.sync || "synced",
        revision: Number(record.revision || 1),
        clientUpdatedAt: parseDateTime(record.updatedAt),
        serverUpdatedAt: parseServerTime(record.serverUpdatedAt) || new Date(),
        attachments: {
          create: toRecordAttachments(record)
        }
      }
    });
  }
}

async function importMedia(tx, db) {
  const projectIds = new Set(db.projects.map((item) => item.id));
  const locationIds = new Set(db.locations.map((item) => item.id));
  const equipmentIds = new Set(db.equipment.map((item) => item.id));
  for (const media of db.media) {
    if (!projectIds.has(media.projectId) || !locationIds.has(media.locationId) || !equipmentIds.has(media.equipmentId)) continue;
    const mediaId = String(media.id);
    await tx.mediaAsset.create({
      data: {
        id: mediaId,
        equipmentId: String(media.equipmentId),
        projectId: String(media.projectId),
        locationId: String(media.locationId),
        category: String(media.category || "document"),
        title: media.title || null,
        reference: media.reference || null,
        comments: media.comments || null,
        createdAt: parseDateTime(media.createdAt) || new Date(),
        attachments: media.file ? { create: [toMediaAttachment(mediaId, media.file)] } : undefined
      }
    });
  }
}

async function importUsers(tx, db) {
  const projectIds = new Set(db.projects.map((item) => item.id));
  for (const user of db.users) {
    const role = ["admin", "manager", "engineer", "field"].includes(user.role) ? user.role : "field";
    const accessibleProjects = role === "admin"
      ? []
      : (Array.isArray(user.projectIds) ? user.projectIds : []).filter((id) => projectIds.has(id));
    await tx.user.create({
      data: {
        id: String(user.id),
        username: String(user.username || "").toLowerCase(),
        name: String(user.name || user.username || "User"),
        role,
        active: user.active !== false,
        passwordHash: String(user.passwordHash || bcrypt.hashSync("changeme123", Number(process.env.BCRYPT_ROUNDS || 12))),
        createdAt: parseDateTime(user.createdAt) || new Date(),
        projectAccess: {
          create: accessibleProjects.map((projectId) => ({ projectId }))
        }
      }
    });
  }
}

async function importAuditLogs(tx, db) {
  const projectIds = new Set(db.projects.map((item) => item.id));
  const userIds = new Set(db.users.map((item) => item.id));
  for (const log of db.auditLogs) {
    await tx.auditLog.create({
      data: {
        id: String(log.id),
        userId: userIds.has(log.userId) ? String(log.userId) : null,
        userName: String(log.userName || "Guest"),
        role: String(log.role || "guest"),
        action: String(log.action || "unknown"),
        targetType: String(log.targetType || ""),
        targetId: String(log.targetId || ""),
        projectId: projectIds.has(log.projectId) ? String(log.projectId) : null,
        success: log.success !== false,
        details: log.details || {},
        createdAt: parseDateTime(log.createdAt) || new Date()
      }
    });
  }
}

function toRecordAttachments(record) {
  return (Array.isArray(record.photos) ? record.photos : [])
    .filter((file) => file?.url)
    .map((file) => ({
      id: file.id || createImportedId("att"),
      fileName: file.name || path.basename(file.url),
      mimeType: file.type || null,
      size: Number(file.size || 0) || null,
      storagePath: file.url,
      source: file.source === "camera" ? "camera" : "upload",
      createdAt: parseDateTime(file.uploadedAt) || new Date()
    }));
}

function toMediaAttachment(mediaId, file) {
  return {
    id: file.id || createImportedId("att"),
    fileName: file.name || path.basename(file.url || "media-file"),
    mimeType: file.type || null,
    size: Number(file.size || 0) || null,
    storagePath: file.url || "",
    source: "media",
    createdAt: parseDateTime(file.uploadedAt) || new Date()
  };
}

function toStatus(status) {
  const value = String(status || "pending").toLowerCase();
  return validStatuses.has(value) ? value : "pending";
}

function resultFromStatus(status) {
  const value = toStatus(status);
  if (value === "passed") return "Pass";
  if (value === "failed") return "Fail";
  if (value === "rectification") return "Rectification";
  if (value === "closed") return "N/A";
  return "Pending";
}

function parseDateOnly(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function parseDateTime(value) {
  if (!value) return null;
  if (typeof value === "number") return new Date(value);
  const normalized = String(value).includes("T") ? String(value) : String(value).replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function parseServerTime(value) {
  if (!value) return null;
  const date = new Date(Number(value));
  return Number.isNaN(date.valueOf()) ? parseDateTime(value) : date;
}

function createImportedId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
