const apiBase = process.env.LOAD_API_BASE || process.env.SMOKE_API_BASE || "http://127.0.0.1:4177/api";
const concurrency = Number(process.env.LOAD_CONCURRENCY || 100);
const durationSeconds = Number(process.env.LOAD_DURATION_SECONDS || 60);
const username = process.env.LOAD_USERNAME || "field";
const password = process.env.LOAD_PASSWORD || "field123";
const adminUsername = process.env.LOAD_ADMIN_USERNAME || "admin";
const adminPassword = process.env.LOAD_ADMIN_PASSWORD || "admin123";

const deadline = Date.now() + durationSeconds * 1000;
const results = [];

async function main() {
  const admin = await login(adminUsername, adminPassword);
  const seed = admin.data;
  const equipment = seed.equipment[0];
  const record = seed.records[0];
  if (!equipment?.id || !record?.id) throw new Error("Load test requires seeded equipment and records.");

  const workers = Array.from({ length: concurrency }, (_, index) => worker(index, equipment, record));
  await Promise.all(workers);

  const summary = summarize(results);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.errors > 0) process.exitCode = 1;
  if (summary.p95Ms > Number(process.env.LOAD_MAX_P95_MS || 2500)) process.exitCode = 1;
}

async function worker(index, equipment, record) {
  const session = await measure("login", () => login(username, password));
  while (Date.now() < deadline) {
    await measure("bootstrap", () => apiGet("/bootstrap", session.token));
    await measure("sync", () => apiPost("/sync", {
      records: [{
        ...record,
        comments: `Load test worker ${index}`,
        baseServerUpdatedAt: record.serverUpdatedAt
      }]
    }, session.token));
    if (index % 10 === 0) {
      await measure("import-preview", () => apiPost("/import/equipment/preview", {
        fileName: `load-${index}.csv`,
        base64: Buffer.from([
          "Project,Location,Team,Equipment,Type,Point,Point Type,Reference,Assignee,Due",
          `Load Test Project,Load Tower / ${index}F / Room,BMS,LOAD-DDC-${index},DDC Panel,Load Point ${Date.now()},Analog Input,20-25 C,QA,2026-06-30`
        ].join("\n")).toString("base64")
      }, session.token));
    }
    if (index % 25 === 0) {
      await measure("upload", () => apiMultipart("/admin/media-upload", {
        equipmentId: equipment.id,
        category: "document",
        title: `Load upload ${index}`,
        comments: "Load test upload"
      }, [{
        name: `load-${index}.txt`,
        type: "text/plain",
        content: `load test ${index}`
      }], session.token));
    }
  }
}

async function measure(name, fn) {
  const started = Date.now();
  try {
    const value = await fn();
    results.push({ name, ok: true, ms: Date.now() - started });
    return value;
  } catch (error) {
    results.push({ name, ok: false, ms: Date.now() - started, error: error.message });
    throw error;
  }
}

async function login(loginUsername, loginPassword) {
  const response = await apiPost("/auth/login", { username: loginUsername, password: loginPassword, returnToken: true });
  if (response.user?.mustChangePassword) {
    const nextPassword = `${loginUsername}-Load-${Date.now()}`;
    const changed = await apiPost("/auth/change-password", {
      currentPassword: loginPassword,
      newPassword: nextPassword
    }, response.token);
    return { ...changed, token: response.token };
  }
  return response;
}

async function apiGet(path, token) {
  return apiFetch(path, { method: "GET", token });
}

async function apiPost(path, body, token) {
  return apiFetch(path, { method: "POST", body, token });
}

async function apiMultipart(path, fields, files, token) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields || {})) form.append(key, String(value));
  for (const file of files || []) form.append("files", new Blob([file.content], { type: file.type }), file.name);
  return apiFetch(path, { method: "POST", body: form, token, multipart: true });
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method: options.method || "GET",
    headers: options.multipart ? {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    } : {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body === undefined ? undefined : options.multipart ? options.body : JSON.stringify(options.body)
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${text}`);
  return payload;
}

function summarize(items) {
  const sorted = items.map((item) => item.ms).sort((a, b) => a - b);
  const byName = {};
  for (const item of items) {
    byName[item.name] ||= { count: 0, errors: 0, totalMs: 0 };
    byName[item.name].count += 1;
    byName[item.name].errors += item.ok ? 0 : 1;
    byName[item.name].totalMs += item.ms;
  }
  for (const value of Object.values(byName)) {
    value.avgMs = Math.round(value.totalMs / Math.max(1, value.count));
    delete value.totalMs;
  }
  return {
    ok: items.every((item) => item.ok),
    apiBase,
    concurrency,
    durationSeconds,
    requests: items.length,
    errors: items.filter((item) => !item.ok).length,
    p50Ms: percentile(sorted, 0.5),
    p95Ms: percentile(sorted, 0.95),
    p99Ms: percentile(sorted, 0.99),
    byName
  };
}

function percentile(sorted, ratio) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index];
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
