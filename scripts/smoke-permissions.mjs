const apiBase = process.env.SMOKE_API_BASE || "http://127.0.0.1:4177/api";

const users = {
  admin: { username: "admin", password: "admin123", nextPassword: `AdminPerm-${Date.now()}` },
  manager: { username: "manager", password: "manager123", nextPassword: `ManagerPerm-${Date.now()}` },
  engineer: { username: "engineer", password: "engineer123", nextPassword: `EngineerPerm-${Date.now()}` },
  field: { username: "field", password: "field123", nextPassword: `FieldPerm-${Date.now()}` }
};

async function main() {
  const sessions = {};
  for (const [role, user] of Object.entries(users)) {
    sessions[role] = await login(user);
  }

  const adminData = sessions.admin.data;
  const equipment = adminData.equipment[0];
  const record = adminData.records[0];
  assert(equipment?.id, "Permission smoke needs equipment seed data.");
  assert(record?.id, "Permission smoke needs record seed data.");

  await expectStatus("GET", "/metrics", null, sessions.admin.token, 200);
  await expectStatus("GET", "/metrics", null, sessions.manager.token, 403);
  await expectStatus("GET", "/metrics", null, sessions.engineer.token, 403);
  await expectStatus("GET", "/metrics", null, sessions.field.token, 403);
  await expectStatus("GET", "/audit-logs?page=1&pageSize=5", null, sessions.admin.token, 200);
  await expectStatus("GET", "/audit-logs?page=1&pageSize=5", null, sessions.manager.token, 200);
  await expectStatus("GET", "/audit-logs?page=1&pageSize=5", null, sessions.engineer.token, 200);
  await expectStatus("GET", "/audit-logs?page=1&pageSize=5", null, sessions.field.token, 200);

  await expectStatus("POST", "/admin/user", {
    username: `denied-${Date.now()}`,
    name: "Denied User",
    role: "field",
    active: true,
    projectIds: []
  }, sessions.manager.token, 403);
  await expectStatus("POST", "/admin/user", {
    username: `denied-engineer-${Date.now()}`,
    name: "Denied Engineer User",
    role: "field",
    active: true,
    projectIds: []
  }, sessions.engineer.token, 403);
  await expectStatus("POST", "/admin/user", {
    username: `denied-field-${Date.now()}`,
    name: "Denied Field User",
    role: "field",
    active: true,
    projectIds: []
  }, sessions.field.token, 403);

  await expectStatus("POST", "/import/equipment/preview", {
    fileName: "permission.csv",
    base64: Buffer.from("Project,Location,Equipment,Point\nA,B,C,D").toString("base64")
  }, sessions.engineer.token, 403);
  await expectStatus("POST", "/admin/storage/cleanup", { dryRun: true }, sessions.manager.token, 403);

  await expectStatus("POST", "/admin/point", {
    equipmentId: equipment.id,
    name: `Field-created point ${Date.now()}`,
    type: "Digital Input",
    reference: "Permission smoke",
    status: "pending"
  }, sessions.field.token, 200);

  await expectStatus("POST", "/admin/row", {
    recordId: record.id,
    equipmentId: record.equipmentId,
    pointId: record.pointId,
    status: "passed",
    result: "Pass",
    comments: "Permission smoke"
  }, sessions.field.token, 403);

  console.log(JSON.stringify({
    ok: true,
    checks: [
      "metrics-admin-only",
      "audit-log-project-scoped-read",
      "user-management-admin-only",
      "import-manager-admin-only",
      "storage-cleanup-admin-only",
      "field-point-create-allowed",
      "field-row-update-denied"
    ]
  }, null, 2));
}

async function login(user) {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: { username: user.username, password: user.password, returnToken: true }
  });
  let session = response;
  if (response.user?.mustChangePassword) {
    session = await apiFetch("/auth/change-password", {
      method: "POST",
      token: response.token,
      body: { currentPassword: user.password, newPassword: user.nextPassword }
    });
    session.token = response.token;
  }
  assert(session.token, `Login for ${user.username} did not return a token.`);
  return session;
}

async function expectStatus(method, path, body, token, expectedStatus) {
  await apiFetch(path, { method, body, token, expectedStatus });
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
  const expectedStatus = options.expectedStatus || 200;
  if (response.status !== expectedStatus) {
    throw new Error(`${options.method || "GET"} ${path} expected ${expectedStatus}, got ${response.status}: ${text}`);
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
