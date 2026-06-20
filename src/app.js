const STORAGE_KEY = "elv-acceptance-offline-v2";
const API_BASE = "http://127.0.0.1:4177/api";

const dictionary = {
  en: {
    appName: "ELV Project Acceptance",
    field: "Field",
    admin: "Admin",
    project: "Project",
    location: "Location",
    team: "Team/Category",
    equipment: "Equipment",
    point: "Point/Sub-device",
    inspections: "Inspections",
    overview: "Overview",
    people: "People",
    pending: "Pending",
    passed: "Passed",
    failed: "Failed",
    rectification: "Rectification",
    closed: "Closed",
    total: "Total",
    completion: "Completion",
    comments: "Comments",
    attachments: "Attachments",
    camera: "Camera",
    gallery: "Upload",
    save: "Save Inspection",
    success: "Saved offline and queued for sync",
    online: "Online",
    offline: "Offline",
    syncPending: "pending sync",
    synced: "Synced",
    search: "Search project, location, equipment, point",
    rename: "Site Name",
    result: "Result",
    assignee: "Assignee",
    due: "Target Date",
    bilingual: "Language",
    translate: "Translate",
    allProjects: "All Project Statistics",
    personStats: "Person Statistics",
    openItems: "Open Issues",
    noRecord: "Select an inspection item to begin",
    editHint: "Edit the site name, add comments, take photos, upload files, then save.",
    syncNow: "Sync Now",
    lastUpdated: "Last updated",
    importExcel: "Import Excel",
    downloadTemplate: "Download Excel Template",
    templateHint: "Excel columns: Project, Location, Team, Equipment, Type, Point, Point Type, Reference, Assignee, Due",
    equipmentManager: "Equipment Manager",
    pointCount: "Points",
    syncConflicts: "Sync conflicts",
    serverOffline: "API offline. Local mode is active.",
    importSuccess: "Excel imported and database updated",
    database: "JSON database",
    manualAdd: "Manual Add",
    addEquipment: "Add Equipment",
    addPoint: "Add Point",
    saveChanges: "Save",
    updateSuccess: "Data updated",
    type: "Type",
    reference: "Reference"
  },
  zh: {
    appName: "ELV 項目驗收系統",
    field: "現場端",
    admin: "管理端",
    project: "項目",
    location: "地點",
    team: "團隊/分類",
    equipment: "設備",
    point: "點位/子設備",
    inspections: "驗收項",
    overview: "總覽",
    people: "人員",
    pending: "待驗收",
    passed: "已通過",
    failed: "不合格",
    rectification: "待整改",
    closed: "已閉環",
    total: "總數",
    completion: "完成率",
    comments: "備註",
    attachments: "附件",
    camera: "拍照",
    gallery: "上傳",
    save: "保存驗收",
    success: "已離線保存並加入同步隊列",
    online: "在線",
    offline: "離線",
    syncPending: "等待同步",
    synced: "已同步",
    search: "搜尋項目、位置、設備、點位",
    rename: "現場名稱",
    result: "結果",
    assignee: "負責人",
    due: "目標日期",
    bilingual: "語言",
    translate: "翻譯",
    allProjects: "所有項目統計",
    personStats: "人員統計",
    openItems: "未閉環問題",
    noRecord: "選擇一個驗收項開始",
    editHint: "可修改現場名稱、補充備註、拍照或上傳附件，然後保存。",
    syncNow: "立即同步",
    lastUpdated: "最後更新",
    importExcel: "導入 Excel",
    downloadTemplate: "下載 Excel 範本",
    templateHint: "Excel 欄位：Project, Location, Team, Equipment, Type, Point, Point Type, Reference, Assignee, Due",
    equipmentManager: "設備管理",
    pointCount: "點位",
    syncConflicts: "同步衝突",
    serverOffline: "API 離線，目前使用本地模式。",
    importSuccess: "Excel 已導入並更新資料庫",
    database: "JSON 資料庫",
    manualAdd: "手動新增",
    addEquipment: "新增設備",
    addPoint: "新增點位",
    saveChanges: "保存",
    updateSuccess: "資料已更新",
    type: "類型",
    reference: "參考標準"
  }
};

const fallbackData = {
  version: 1,
  projects: [{ id: "p1", name: "Harbour Tower BMS Upgrade", client: "Facility Team" }],
  locations: [{ id: "l1", projectId: "p1", name: "Tower A / 12F / AHU Room" }],
  equipment: [{ id: "e1", projectId: "p1", locationId: "l1", team: "BMS", name: "DDC-12F-AHU-01", type: "DDC Panel", status: "pending" }],
  points: [{ id: "pt1", equipmentId: "e1", name: "BACnet/IP communication", type: "Network", reference: "Online", status: "pending" }],
  records: [
    {
      id: "r1",
      projectId: "p1",
      locationId: "l1",
      team: "BMS",
      equipmentId: "e1",
      pointId: "pt1",
      title: "DDC panel communication test",
      status: "pending",
      result: "Pending",
      comments: "",
      photos: [],
      assignee: "Ken",
      due: "2026-06-28",
      sync: "synced",
      updatedAt: "2026-06-20 09:15",
      serverUpdatedAt: 1781927700000
    }
  ]
};

let state = loadState();

init();

async function init() {
  render();
  await bootstrapFromServer();
  await syncRecords(false);
  render();
}

function defaultState() {
  return {
    lang: "en",
    view: "field",
    selectedProjectId: "p1",
    selectedLocationId: "l1",
    selectedTeam: "BMS",
    selectedEquipmentId: "e1",
    selectedPointId: "pt1",
    selectedRecordId: "r1",
    toast: "",
    conflicts: [],
    serverOnline: false,
    data: structuredClone(fallbackData)
  };
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultState();
  return { ...defaultState(), ...JSON.parse(stored) };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function bootstrapFromServer() {
  try {
    const data = await apiGet("/bootstrap");
    setState({ data, serverOnline: true, toast: "" }, false);
  } catch {
    setState({ serverOnline: false, toast: t("serverOffline") }, false);
    window.setTimeout(() => setState({ toast: "" }), 2500);
  }
}

function t(key) {
  return dictionary[state.lang][key] || key;
}

function setState(patch, shouldRender = true) {
  state = { ...state, ...patch };
  saveState();
  if (shouldRender) render();
}

function setData(data) {
  setState({ data: normalizeSelection(data), serverOnline: true });
}

function normalizeSelection(data) {
  const project = data.projects.find((item) => item.id === state.selectedProjectId) || data.projects[0];
  const location = data.locations.find((item) => item.id === state.selectedLocationId && item.projectId === project?.id) || data.locations.find((item) => item.projectId === project?.id);
  const locationEquipment = data.equipment.filter((item) => item.locationId === location?.id);
  const team = locationEquipment.some((item) => item.team === state.selectedTeam) ? state.selectedTeam : locationEquipment[0]?.team;
  const equipment = locationEquipment.find((item) => item.id === state.selectedEquipmentId && item.team === team) || locationEquipment.find((item) => item.team === team);
  const point = data.points.find((item) => item.id === state.selectedPointId && item.equipmentId === equipment?.id) || data.points.find((item) => item.equipmentId === equipment?.id);
  const record = data.records.find((item) => item.id === state.selectedRecordId && item.pointId === point?.id) || data.records.find((item) => item.pointId === point?.id);
  state.selectedProjectId = project?.id || "";
  state.selectedLocationId = location?.id || "";
  state.selectedTeam = team || "";
  state.selectedEquipmentId = equipment?.id || "";
  state.selectedPointId = point?.id || "";
  state.selectedRecordId = record?.id || "";
  return data;
}

function render() {
  document.querySelector("#app").innerHTML = `
    <main class="shell">
      ${renderTopbar()}
      ${state.view === "field" ? renderField() : renderAdmin()}
      <div class="toast ${state.toast ? "show" : ""}">${escapeHtml(state.toast)}</div>
    </main>
  `;
  bindEvents();
}

function renderTopbar() {
  const pendingSync = state.data.records.filter((record) => record.sync === "pending").length;
  const onlineText = navigator.onLine && state.serverOnline ? t("online") : t("offline");
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">${onlineText} / ${pendingSync ? `${pendingSync} ${t("syncPending")}` : t("synced")}</p>
        <h1>${t("appName")}</h1>
      </div>
      <div class="actions">
        <button class="icon-btn" data-action="toggle-lang" title="${t("bilingual")}">${state.lang === "en" ? "EN" : "中"}</button>
        <button class="mode-btn ${state.view === "field" ? "active" : ""}" data-view="field">${t("field")}</button>
        <button class="mode-btn ${state.view === "admin" ? "active" : ""}" data-view="admin">${t("admin")}</button>
      </div>
    </header>
  `;
}

function renderField() {
  const selectedRecord = state.data.records.find((record) => record.id === state.selectedRecordId);
  return `
    <section class="mobile-grid">
      <aside class="panel stack">
        <input class="search" placeholder="${t("search")}" />
        ${renderSelectors()}
        ${renderQuickStats(getFilteredRecords())}
        ${renderPointNavigator()}
      </aside>
      <section class="panel detail">
        ${selectedRecord ? renderInspectionForm(selectedRecord) : `<div class="empty">${t("noRecord")}</div>`}
      </section>
    </section>
  `;
}

function renderSelectors() {
  const { projects, locations, equipment } = state.data;
  const projectLocations = locations.filter((location) => location.projectId === state.selectedProjectId);
  const locationEquipment = equipment.filter((item) => item.locationId === state.selectedLocationId);
  const teams = [...new Set(locationEquipment.map((item) => item.team))];
  const teamEquipment = locationEquipment.filter((item) => item.team === state.selectedTeam);
  return `
    <label>${t("project")}
      <select data-field="selectedProjectId">
        ${projects.map((project) => option(project.id, project.name, state.selectedProjectId)).join("")}
      </select>
    </label>
    <label>${t("location")}
      <select data-field="selectedLocationId">
        ${projectLocations.map((location) => option(location.id, location.name, state.selectedLocationId)).join("")}
      </select>
    </label>
    <label>${t("team")}
      <select data-field="selectedTeam">
        ${teams.map((team) => option(team, team, state.selectedTeam)).join("")}
      </select>
    </label>
    <label>${t("equipment")}
      <select data-field="selectedEquipmentId">
        ${teamEquipment.map((item) => option(item.id, `${item.name} / ${item.type}`, state.selectedEquipmentId)).join("")}
      </select>
    </label>
  `;
}

function renderPointNavigator() {
  const points = state.data.points.filter((point) => point.equipmentId === state.selectedEquipmentId);
  const records = getFilteredRecords();
  return `
    <div class="section-title">${t("point")}</div>
    <div class="point-list">
      ${points
        .map((point) => {
          const count = records.filter((record) => record.pointId === point.id).length;
          return `
            <button class="point-card ${point.id === state.selectedPointId ? "active" : ""}" data-point="${point.id}">
              <span>
                <strong>${escapeHtml(point.name)}</strong>
                <small>${escapeHtml(point.type)} / ${escapeHtml(point.reference || "-")}</small>
              </span>
              <em class="badge ${point.status}">${statusLabel(point.status)}</em>
              <small>${count} ${t("inspections")}</small>
            </button>
          `;
        })
        .join("")}
    </div>
    <div class="section-title">${t("inspections")}</div>
    <div class="list">
      ${records
        .filter((record) => record.pointId === state.selectedPointId)
        .map(
          (record) => `
            <button class="record ${record.id === state.selectedRecordId ? "active" : ""}" data-record="${record.id}">
              <span>${escapeHtml(record.title)}</span>
              <small class="badge ${record.status}">${statusLabel(record.status)}</small>
            </button>
          `
        )
        .join("") || `<div class="empty small">${t("noRecord")}</div>`}
    </div>
  `;
}

function renderInspectionForm(record) {
  const point = state.data.points.find((item) => item.id === record.pointId);
  return `
    <form class="inspection-form" data-form="${record.id}">
      <div class="form-head">
        <div>
          <p class="eyebrow">${escapeHtml(record.assignee || "-")} / ${t("due")} ${escapeHtml(record.due || "-")}</p>
          <h2>${escapeHtml(record.title)}</h2>
        </div>
        <span class="badge ${record.status}">${statusLabel(record.status)}</span>
      </div>
      <div class="subdevice-strip">
        <strong>${escapeHtml(point?.name || "")}</strong>
        <span>${escapeHtml(point?.type || "")}</span>
        <span>${t("reference")}: ${escapeHtml(point?.reference || "-")}</span>
      </div>
      <p class="muted">${t("editHint")}</p>
      <label>${t("rename")}
        <input name="title" value="${escapeHtml(record.title)}" />
      </label>
      <label>${t("result")}
        <select name="result">
          ${["Pending", "Pass", "Fail", "N/A", "Rectification"].map((result) => option(result, result, record.result)).join("")}
        </select>
      </label>
      <label>${t("comments")}
        <textarea name="comments" rows="5">${escapeHtml(record.comments || "")}</textarea>
      </label>
      <div class="photo-row">
        <label class="file-button">${t("camera")}
          <input name="camera" type="file" accept="image/*" capture="environment" multiple />
        </label>
        <label class="file-button">${t("gallery")}
          <input name="attachments" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple />
        </label>
        <button type="button" class="ghost" data-action="translate">${t("translate")}</button>
      </div>
      <div class="photos">
        ${(record.photos || []).map((photo) => `<img src="${photo.dataUrl || photo}" alt="${escapeHtml(photo.name || "Inspection photo")}" />`).join("")}
      </div>
      <button class="primary" type="submit">${t("save")}</button>
    </form>
  `;
}

function renderAdmin() {
  const stats = getStats();
  const people = getPeopleStats();
  return `
    <section class="desktop-grid">
      <section class="panel hero-dashboard">
        <div>
          <p class="eyebrow">${t("overview")}</p>
          <h2>${t("allProjects")}</h2>
        </div>
        <div class="big-stat">${stats.completion}<span>%</span></div>
      </section>
      <section class="panel">
        <div class="stats wide">
          ${statCard(t("total"), stats.total)}
          ${statCard(t("pending"), stats.pending)}
          ${statCard(t("failed"), stats.failed)}
          ${statCard(t("rectification"), stats.rectification)}
          ${statCard(t("passed"), stats.passed)}
        </div>
      </section>
      <section class="panel admin-tools">
        <div>
          <div class="section-title">${t("equipmentManager")}</div>
          <p class="muted">${t("templateHint")}</p>
        </div>
        <label class="file-button">${t("importExcel")}
          <input data-action="import-excel" type="file" accept=".xlsx,.xls,.csv" />
        </label>
        <a class="file-button" href="${API_BASE}/template/equipment">${t("downloadTemplate")}</a>
        <button class="primary sync" data-action="sync">${t("syncNow")}</button>
      </section>
      <section class="panel">
        <div class="section-title">${t("database")}</div>
        ${renderNewEquipmentForm()}
        <div class="equipment-table">
          ${state.data.equipment.map(renderEquipmentRow).join("")}
        </div>
      </section>
      <section class="panel">
        <div class="section-title">${t("openItems")}</div>
        <div class="table">
          ${state.data.records
            .filter((record) => ["failed", "rectification", "pending"].includes(record.status))
            .map(renderIssueRow)
            .join("")}
        </div>
      </section>
      <section class="panel">
        <div class="section-title">${t("personStats")}</div>
        <div class="people">
          ${people.map((person) => `<div><strong>${escapeHtml(person.name || "-")}</strong><span>${person.done}/${person.total}</span><progress value="${person.done}" max="${person.total}"></progress></div>`).join("")}
        </div>
      </section>
      ${state.conflicts.length ? `<section class="panel"><div class="section-title">${t("syncConflicts")}</div>${state.conflicts.map((item) => `<p class="muted">${escapeHtml(item.local.title)}</p>`).join("")}</section>` : ""}
    </section>
  `;
}

function renderNewEquipmentForm() {
  return `
    <form class="editor-row new-equipment" data-editor="equipment">
      <select name="projectId">${state.data.projects.map((project) => option(project.id, project.name, state.selectedProjectId)).join("")}</select>
      <select name="locationId">${state.data.locations.map((location) => option(location.id, location.name, state.selectedLocationId)).join("")}</select>
      <input name="team" placeholder="${t("team")}" value="BMS" />
      <input name="name" placeholder="${t("equipment")}" required />
      <input name="type" placeholder="${t("type")}" value="Equipment" />
      <button class="primary" type="submit">${t("addEquipment")}</button>
    </form>
  `;
}

function renderEquipmentRow(item) {
  const project = state.data.projects.find((candidate) => candidate.id === item.projectId);
  const location = state.data.locations.find((candidate) => candidate.id === item.locationId);
  const points = state.data.points.filter((point) => point.equipmentId === item.id);
  return `
    <div class="equipment-editor">
      <form class="editor-row" data-editor="equipment" data-id="${item.id}">
        <select name="projectId">${state.data.projects.map((candidate) => option(candidate.id, candidate.name, item.projectId)).join("")}</select>
        <select name="locationId">${state.data.locations.map((candidate) => option(candidate.id, candidate.name, item.locationId)).join("")}</select>
        <input name="team" value="${escapeHtml(item.team)}" />
        <input name="name" value="${escapeHtml(item.name)}" />
        <input name="type" value="${escapeHtml(item.type)}" />
        <select name="status">${["pending", "passed", "failed", "rectification", "closed"].map((status) => option(status, statusLabel(status), item.status)).join("")}</select>
        <button class="ghost" type="submit">${t("saveChanges")}</button>
      </form>
      <div class="point-editor-list">
        ${points.map((point) => renderPointEditor(point)).join("")}
        <form class="editor-row point-editor" data-editor="point" data-equipment-id="${item.id}">
          <input name="name" placeholder="${t("point")}" required />
          <input name="type" placeholder="${t("type")}" value="Point" />
          <input name="reference" placeholder="${t("reference")}" />
          <select name="status">${["pending", "passed", "failed", "rectification", "closed"].map((status) => option(status, statusLabel(status), "pending")).join("")}</select>
          <button class="ghost" type="submit">${t("addPoint")}</button>
        </form>
      </div>
    </div>
  `;
}

function renderPointEditor(point) {
  return `
    <form class="editor-row point-editor" data-editor="point" data-id="${point.id}" data-equipment-id="${point.equipmentId}">
      <input name="name" value="${escapeHtml(point.name)}" />
      <input name="type" value="${escapeHtml(point.type)}" />
      <input name="reference" value="${escapeHtml(point.reference || "")}" />
      <select name="status">${["pending", "passed", "failed", "rectification", "closed"].map((status) => option(status, statusLabel(status), point.status)).join("")}</select>
      <button class="ghost" type="submit">${t("saveChanges")}</button>
    </form>
  `;
}

function renderIssueRow(record) {
  const equipment = state.data.equipment.find((item) => item.id === record.equipmentId);
  const point = state.data.points.find((item) => item.id === record.pointId);
  return `
    <div class="row">
      <div>
        <strong>${escapeHtml(record.title)}</strong>
        <span>${escapeHtml(equipment?.name || "")} / ${escapeHtml(point?.name || "")}</span>
      </div>
      <span>${escapeHtml(record.assignee || "-")}</span>
      <span class="badge ${record.status}">${statusLabel(record.status)}</span>
    </div>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setState({ view: button.dataset.view }));
  });
  document.querySelector("[data-action='toggle-lang']")?.addEventListener("click", () => setState({ lang: state.lang === "en" ? "zh" : "en" }));
  document.querySelectorAll("[data-field]").forEach((select) => {
    select.addEventListener("change", () => handleSelectorChange(select.dataset.field, select.value));
  });
  document.querySelectorAll("[data-point]").forEach((button) => {
    button.addEventListener("click", () => selectPoint(button.dataset.point));
  });
  document.querySelectorAll("[data-record]").forEach((button) => {
    button.addEventListener("click", () => setState({ selectedRecordId: button.dataset.record }));
  });
  document.querySelector("[data-action='sync']")?.addEventListener("click", () => syncRecords(true));
  document.querySelector("[data-action='translate']")?.addEventListener("click", translateComment);
  document.querySelector("[data-action='import-excel']")?.addEventListener("change", importExcel);
  document.querySelector(".inspection-form")?.addEventListener("submit", saveInspection);
  document.querySelectorAll("[data-editor]").forEach((form) => {
    form.addEventListener("submit", saveAdminEditor);
  });
}

function handleSelectorChange(field, value) {
  state[field] = value;
  normalizeSelection(state.data);
  saveState();
  render();
}

function selectPoint(pointId) {
  const record = state.data.records.find((item) => item.pointId === pointId);
  setState({ selectedPointId: pointId, selectedRecordId: record?.id || "" });
}

async function saveInspection(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.dataset.form;
  const cameraFiles = await filesToDataUrls(form.camera.files);
  const attachmentFiles = await filesToDataUrls(form.attachments.files);
  const records = state.data.records.map((record) => {
    if (record.id !== id) return record;
    const result = form.result.value;
    const now = new Date();
    return {
      ...record,
      title: form.title.value,
      result,
      comments: form.comments.value,
      photos: [...(record.photos || []), ...cameraFiles, ...attachmentFiles],
      status: statusFromResult(result),
      sync: "pending",
      localUpdatedAt: now.getTime(),
      baseServerUpdatedAt: record.serverUpdatedAt,
      updatedAt: now.toLocaleString("sv-SE")
    };
  });
  const data = refreshLocalStatuses({ ...state.data, records });
  setState({ data, toast: t("success") });
  window.setTimeout(() => setState({ toast: "" }), 2200);
  await syncRecords(false);
}

async function syncRecords(showToast) {
  const pending = state.data.records.filter((record) => record.sync === "pending");
  if (!pending.length) {
    if (showToast) flash(t("synced"));
    return;
  }
  try {
    const response = await apiPost("/sync", { records: pending });
    setState({ data: normalizeSelection(response), conflicts: response.conflicts || [], serverOnline: true });
    if (showToast) flash(response.conflicts?.length ? t("syncConflicts") : t("synced"));
  } catch {
    setState({ serverOnline: false });
    if (showToast) flash(t("serverOffline"));
  }
}

async function importExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  const base64 = await fileToBase64(file);
  try {
    const response = await apiPost("/import/equipment", { fileName: file.name, base64 });
    setData(response.data);
    flash(`${t("importSuccess")}: ${response.importedCount}`);
  } catch {
    flash(t("serverOffline"));
  }
}

async function saveAdminEditor(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  if (form.dataset.id) payload.id = form.dataset.id;
  if (form.dataset.equipmentId) payload.equipmentId = form.dataset.equipmentId;
  const endpoint = form.dataset.editor === "point" ? "/admin/point" : "/admin/equipment";
  try {
    const response = await apiPost(endpoint, payload);
    setData(response);
    flash(t("updateSuccess"));
  } catch {
    flash(t("serverOffline"));
  }
}

function translateComment() {
  const textarea = document.querySelector("textarea[name='comments']");
  if (!textarea?.value.trim()) return;
  textarea.value = state.lang === "en" ? `${textarea.value}\n\n[ZH draft] ${textarea.value}` : `${textarea.value}\n\n[EN draft] ${textarea.value}`;
}

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`API failed: ${response.status}`);
  return response.json();
}

async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`API failed: ${response.status}`);
  return response.json();
}

function getFilteredRecords() {
  return state.data.records.filter((record) => record.equipmentId === state.selectedEquipmentId);
}

function getStats(records = state.data.records) {
  const total = records.length;
  const passed = records.filter((record) => ["passed", "closed"].includes(record.status)).length;
  const failed = records.filter((record) => record.status === "failed").length;
  const rectification = records.filter((record) => record.status === "rectification").length;
  const pending = records.filter((record) => record.status === "pending").length;
  return { total, passed, failed, rectification, pending, completion: total ? Math.round((passed / total) * 100) : 0 };
}

function getPeopleStats() {
  return [...new Set(state.data.records.map((record) => record.assignee))].map((name) => {
    const own = state.data.records.filter((record) => record.assignee === name);
    const done = own.filter((record) => ["passed", "closed"].includes(record.status)).length;
    return { name, total: own.length, done };
  });
}

function renderQuickStats(records) {
  const stats = getStats(records);
  return `<div class="stats">${statCard(t("completion"), `${stats.completion}%`)}${statCard(t("pending"), stats.pending)}${statCard(t("passed"), stats.passed)}${statCard(t("failed"), stats.failed)}</div>`;
}

function statCard(label, value) {
  return `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`;
}

function statusLabel(status) {
  return dictionary[state.lang][status] || status;
}

function statusFromResult(result) {
  if (result === "Pass") return "passed";
  if (result === "Fail") return "failed";
  if (result === "N/A") return "closed";
  if (result === "Rectification") return "rectification";
  return "pending";
}

function refreshLocalStatuses(data) {
  const points = data.points.map((point) => {
    const records = data.records.filter((record) => record.pointId === point.id);
    return records.length ? { ...point, status: summarizeStatus(records) } : point;
  });
  const equipment = data.equipment.map((item) => {
    const records = data.records.filter((record) => record.equipmentId === item.id);
    return records.length ? { ...item, status: summarizeStatus(records) } : item;
  });
  return { ...data, points, equipment };
}

function summarizeStatus(records) {
  if (records.some((record) => record.status === "failed")) return "failed";
  if (records.some((record) => record.status === "rectification")) return "rectification";
  if (records.every((record) => ["passed", "closed"].includes(record.status))) return "passed";
  return "pending";
}

function option(value, label, selected) {
  return `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function filesToDataUrls(files) {
  return Promise.all([...files].map(async (file) => ({ name: file.name, type: file.type, dataUrl: await fileToDataUrl(file) })));
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(file);
  });
}

function flash(message) {
  setState({ toast: message });
  window.setTimeout(() => setState({ toast: "" }), 2200);
}

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

window.addEventListener("online", () => syncRecords(false));
window.addEventListener("offline", render);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
