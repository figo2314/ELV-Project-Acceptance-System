const apiBase = process.env.SMOKE_API_BASE || "http://127.0.0.1:4177/api";

async function main() {
  const ready = await apiGet("/ready");
  assert(ready.ok, "API readiness check failed.");
  assert(ready.dataStore === "postgres", `Expected postgres mode, got ${ready.dataStore}.`);
  assert(ready.database?.connected === true, "PostgreSQL is not connected.");

  const adminPassword = `SmokeAdmin-${Date.now()}`;
  const login = await apiPost("/auth/login", { username: "admin", password: "admin123", returnToken: true });
  assert(login.token, "Login did not return a token.");
  assert(login.user?.role === "admin", "Admin login did not return admin role.");
  assert(login.data?.projects?.length, "Bootstrap data has no projects.");

  const token = login.token;
  let data = login.data;
  if (login.user?.mustChangePassword) {
    const changed = await apiPost("/auth/change-password", {
      currentPassword: "admin123",
      newPassword: adminPassword
    }, token);
    assert(changed.user?.mustChangePassword === false, "Password change did not clear the required flag.");
    data = changed.data;
  }
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

  const failedLogin = await apiFetch("/auth/login", {
    method: "POST",
    body: { username: "admin", password: "wrong-password" },
    expectedStatus: 401
  });
  assert(failedLogin.error, "Failed login did not return an error payload.");

  const browserStyleLogin = await apiPost("/auth/login", { username: "field", password: "field123" });
  assert(!browserStyleLogin.token, "Browser-style login should not return a readable token.");

  const managerLogin = await apiPost("/auth/login", { username: "manager", password: "manager123", returnToken: true });
  await apiFetch("/metrics", {
    method: "GET",
    token: managerLogin.token,
    expectedStatus: 403
  });

  const lockUserName = `lock-${Date.now()}`;
  const lockPassword = `Temp-${Date.now()}-pass`;
  const afterUser = await apiPost("/admin/user", {
    username: lockUserName,
    name: "Smoke Lock User",
    role: "field",
    active: true,
    projectIds: [equipment.projectId],
    password: lockPassword
  }, token);
  const lockUser = afterUser.users.find((user) => user.username === lockUserName);
  assert(lockUser?.mustChangePassword === true, "New users should require a password change.");
  for (let index = 0; index < 5; index += 1) {
    await apiFetch("/auth/login", {
      method: "POST",
      body: { username: lockUserName, password: "wrong-password" },
      expectedStatus: index === 4 ? 423 : 401
    });
  }
  const unlocked = await apiPost("/admin/user/unlock", { id: lockUser.id }, token);
  const unlockedUser = unlocked.users.find((user) => user.id === lockUser.id);
  assert(!unlockedUser.lockedUntil, "Admin unlock did not clear lockedUntil.");

  const metrics = await apiGet("/metrics", token);
  assert(metrics.requestsTotal >= 1, "Metrics did not record requests.");
  assert(metrics.dataStore === "postgres", "Metrics did not report postgres mode.");
  assert(metrics.failedLogins >= 1, "Metrics did not record failed logins.");

  console.log(JSON.stringify({
    ok: true,
    checks: ["ready", "login", "point", "sync", "media", "import", "metrics"],
    projectCount: imported.data.projects.length,
    recordCount: imported.data.records.length,
    requestsTotal: metrics.requestsTotal,
    failedLogins: metrics.failedLogins
  }, null, 2));
}

async function apiGet(path, token) {
  return apiFetch(path, { method: "GET", token });
}

async function apiPost(path, body, token) {
  return apiFetch(path, { method: "POST", body, token });
}

async function apiFetch(path, options = {}) {
  const expectedStatus = options.expectedStatus || 200;
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
  if (response.status !== expectedStatus) {
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
