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

app.post("/api/admin/equipment", async (request, response) => {
  const db = await readDb();
  const body = request.body || {};
  const equipment = {
    id: body.id || createId("e"),
    projectId: body.projectId || db.projects[0]?.id,
    locationId: body.locationId || db.locations[0]?.id,
    team: body.team || "BMS",
    name: body.name || "New Equipment",
    type: body.type || "Equipment",
    status: body.status || "pending"
  };
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

  refreshDerivedStatuses(db);
  await writeDb(db);
  response.json(db);
});

app.post("/api/admin/project", async (request, response) => {
  const db = await readDb();
  const body = request.body || {};
  const index = db.projects.findIndex((item) => item.id === body.id);
  if (index === -1) {
    response.status(404).json({ error: "Project not found." });
    return;
  }
  db.projects[index] = {
    ...db.projects[index],
    name: body.name || db.projects[index].name,
    client: body.client ?? db.projects[index].client,
    manager: body.manager ?? db.projects[index].manager
  };
  await writeDb(db);
  response.json(db);
});

app.post("/api/admin/row", async (request, response) => {
  const db = await readDb();
  const body = request.body || {};
  const equipment = db.equipment.find((item) => item.id === body.equipmentId);
  const point = db.points.find((item) => item.id === body.pointId);
  const record = db.records.find((item) => item.id === body.recordId);
  if (!equipment || !point || !record) {
    response.status(404).json({ error: "Row target not found." });
    return;
  }

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

  refreshDerivedStatuses(db);
  await writeDb(db);
  response.json(db);
});

app.post("/api/admin/point", async (request, response) => {
  const db = await readDb();
  const body = request.body || {};
  const equipment = db.equipment.find((item) => item.id === body.equipmentId);
  if (!equipment) {
    response.status(404).json({ error: "Equipment not found." });
    return;
  }

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

  refreshDerivedStatuses(db);
  await writeDb(db);
  response.json(db);
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
    const name = pick(row, ["Equipment", "Equipment Name", "Name", "Device", "設備", "设备", "設備名稱", "设备名称"]);
    if (!name) continue;
    const projectName = pick(row, ["Project", "項目", "项目"]) || db.projects[0]?.name || "Default Project";
    const locationName = pick(row, ["Location", "Area", "位置", "地點", "地点"]) || "Unassigned";
    const team = pick(row, ["Team", "Category", "System", "團隊", "团队", "分類", "分类", "系統", "系统"]) || "BMS";
    const type = pick(row, ["Type", "Equipment Type", "類型", "类型", "設備類型", "设备类型"]) || "Equipment";
    const pointName = pick(row, ["Point", "Point Name", "Sub Device", "點位", "点位", "子設備", "子设备"]);
    const pointType = pick(row, ["Point Type", "Signal Type", "點位類型", "点位类型", "信號類型", "信号类型"]) || "Point";
    const reference = pick(row, ["Reference", "Expected", "參考值", "参考值", "標準", "标准"]) || "";
    const assignee = pick(row, ["Assignee", "Owner", "負責人", "负责人"]) || "";
    const due = pick(row, ["Due", "Target Date", "目標日期", "目标日期"]) || "";

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
      const nextRecord = {
        projectId: project.id,
        locationId: location.id,
        team,
        equipmentId: item.id,
        pointId: point.id,
        title: `${name} - ${pointName}`,
        status: point.status || "pending",
        result: resultFromStatus(point.status || "pending"),
        assignee,
        due,
        sync: "synced",
        updatedAt: new Date().toLocaleString("sv-SE"),
        serverUpdatedAt: Date.now()
      };
      if (recordIndex === -1) {
        db.records.push({ id: createId("r"), comments: "", photos: [], ...nextRecord });
      } else {
        db.records[recordIndex] = {
          ...db.records[recordIndex],
          ...nextRecord,
          comments: db.records[recordIndex].comments || "",
          photos: db.records[recordIndex].photos || []
        };
      }
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

function resultFromStatus(status) {
  if (status === "passed") return "Pass";
  if (status === "failed") return "Fail";
  if (status === "closed") return "N/A";
  if (status === "rectification") return "Rectification";
  return "Pending";
}
