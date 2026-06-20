import express from "express";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const dbPath = path.join(dataDir, "db.json");
const port = Number(process.env.API_PORT || 4177);

const app = express();
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
app.use(express.json({ limit: "25mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, time: Date.now() });
});

app.get("/api/bootstrap", async (_request, response) => {
  response.json(await readDb());
});

app.post("/api/sync", async (request, response) => {
  const incoming = Array.isArray(request.body.records) ? request.body.records : [];
  const db = await readDb();
  const conflicts = [];

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

  refreshDerivedStatuses(db);
  await writeDb(db);
  response.json({ ...db, conflicts });
});

app.post("/api/equipment", async (request, response) => {
  const db = await readDb();
  const equipment = {
    id: request.body.id || createId("eq"),
    projectId: request.body.projectId,
    locationId: request.body.locationId,
    team: request.body.team || "BMS",
    name: request.body.name,
    type: request.body.type || "Equipment",
    status: request.body.status || "pending"
  };
  db.equipment.push(equipment);
  await writeDb(db);
  response.status(201).json(equipment);
});

app.post("/api/import/equipment", async (request, response) => {
  const { fileName = "equipment.xlsx", base64 } = request.body;
  if (!base64) {
    response.status(400).json({ error: "Missing base64 Excel payload." });
    return;
  }

  const workbook = XLSX.read(Buffer.from(base64, "base64"), { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const db = await readDb();
  const imported = [];

  for (const row of rows) {
    const name = pick(row, ["Equipment", "Equipment Name", "Name", "Device", "設備", "設備名稱"]);
    if (!name) continue;
    const projectName = pick(row, ["Project", "項目"]) || db.projects[0]?.name || "Default Project";
    const locationName = pick(row, ["Location", "Area", "地點", "位置"]) || "Unassigned";
    const team = pick(row, ["Team", "Category", "System", "團隊", "分類", "系統"]) || "BMS";
    const type = pick(row, ["Type", "Equipment Type", "類型"]) || "Equipment";
    const pointName = pick(row, ["Point", "Point Name", "Sub Device", "點位", "子設備"]);

    const project = upsertByName(db.projects, { id: createId("p"), name: projectName, client: "" });
    const location = upsertLocation(db.locations, { id: createId("l"), projectId: project.id, name: locationName });
    let item = db.equipment.find((candidate) => candidate.name === name && candidate.locationId === location.id);
    if (!item) {
      item = { id: createId("e"), projectId: project.id, locationId: location.id, team, name, type, status: "pending" };
      db.equipment.push(item);
    }
    if (pointName) {
      const point = {
        id: createId("pt"),
        equipmentId: item.id,
        name: pointName,
        type: pick(row, ["Point Type", "Signal Type", "點位類型"]) || "Point",
        reference: pick(row, ["Reference", "Expected", "標準", "參考"]) || "",
        status: "pending"
      };
      db.points.push(point);
      db.records.push({
        id: createId("r"),
        projectId: project.id,
        locationId: location.id,
        team,
        equipmentId: item.id,
        pointId: point.id,
        title: `${name} - ${pointName}`,
        status: "pending",
        result: "Pending",
        comments: "",
        photos: [],
        assignee: pick(row, ["Assignee", "Owner", "負責人"]) || "",
        due: pick(row, ["Due", "Target Date", "目標日期"]) || "",
        sync: "synced",
        updatedAt: new Date().toLocaleString("sv-SE"),
        serverUpdatedAt: Date.now()
      });
    }
    imported.push(item);
  }

  refreshDerivedStatuses(db);
  await writeDb(db);
  response.json({ fileName, importedCount: imported.length, data: db });
});

app.listen(port, () => {
  console.log(`ELV acceptance API listening on http://127.0.0.1:${port}`);
});

async function readDb() {
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(dbPath)) {
    await writeFile(dbPath, JSON.stringify({ version: 1, projects: [], locations: [], equipment: [], points: [], records: [] }, null, 2));
  }
  return JSON.parse(await readFile(dbPath, "utf8"));
}

async function writeDb(db) {
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`);
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
