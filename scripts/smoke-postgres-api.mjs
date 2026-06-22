const apiBase = process.env.SMOKE_API_BASE || "http://127.0.0.1:4177/api";

async function main() {
  const ready = await apiGet("/ready");
  assert(ready.ok, "API readiness check failed.");
  assert(ready.dataStore === "postgres", `Expected postgres mode, got ${ready.dataStore}.`);
  assert(ready.database?.connected === true, "PostgreSQL is not connected.");

  const login = await apiPost("/auth/login", { username: "admin", password: "admin123" });
  assert(login.token, "Login did not return a token.");
  assert(login.user?.role === "admin", "Admin login did not return admin role.");
  assert(login.data?.projects?.length, "Bootstrap data has no projects.");

  const token = login.token;
  const data = login.data;
  const equipment = data.equipment[0];
  assert(equipment?.id, "No equipment available for smoke test.");

  const pointName = `Smoke Point ${Date.now()}`;
  const afterPoint = await apiPost("/admin/point", {
    equipmentId: equipment.id,
    name: pointName,
    type: "Digital Input",
    reference: "Normal",
    status: "pending"
  }, token);
  const createdPoint = afterPoint.points.find((point) => point.equipmentId === equipment.id && point.name === pointName);
  assert(createdPoint?.id, "Point upsert did not return created point.");

  const createdRecord = afterPoint.records.find((record) => record.pointId === createdPoint.id);
  assert(createdRecord?.id, "Point upsert did not create inspection record.");

  const synced = await apiPost("/sync", {
    records: [{
      ...createdRecord,
      status: "passed",
      result: "Pass",
      comments: "Smoke sync passed",
      baseServerUpdatedAt: createdRecord.serverUpdatedAt
    }]
  }, token);
  assert(Array.isArray(synced.conflicts) && synced.conflicts.length === 0, "Sync returned unexpected conflicts.");
  const syncedRecord = synced.records.find((record) => record.id === createdRecord.id);
  assert(syncedRecord?.status === "passed", "Sync did not update record status.");

  const media = await apiPost("/admin/media", {
    equipmentId: equipment.id,
    category: "photo",
    title: "Smoke media note",
    comments: "Smoke media comment",
    files: []
  }, token);
  assert(media.media.some((item) => item.equipmentId === equipment.id && item.comments === "Smoke media comment"), "Media note was not created.");

  const csv = [
    "Project,Location,Team,Equipment,Type,Point,Point Type,Reference,Assignee,Due",
    "Smoke Import Project,Smoke Tower / 1F / Plant Room,BMS,SMOKE-DDC-01,DDC Panel,Smoke AI Point,Analog Input,20-25 C,QA,2026-06-30"
  ].join("\n");
  const imported = await apiPost("/import/equipment", {
    fileName: "smoke.csv",
    base64: Buffer.from(csv, "utf8").toString("base64")
  }, token);
  assert(imported.importedCount >= 1, "Import did not create equipment.");
  assert(imported.data.projects.some((project) => project.name === "Smoke Import Project"), "Imported project missing from bootstrap.");

  console.log(JSON.stringify({
    ok: true,
    checks: ["ready", "login", "point", "sync", "media", "import"],
    projectCount: imported.data.projects.length,
    recordCount: imported.data.records.length
  }, null, 2));
}

async function apiGet(path, token) {
  return apiFetch(path, { method: "GET", token });
}

async function apiPost(path, body, token) {
  return apiFetch(path, { method: "POST", body, token });
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${text}`);
  }
  return payload;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
