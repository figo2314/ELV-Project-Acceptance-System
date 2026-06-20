const STORAGE_KEY = "elv-acceptance-offline-v2";
const API_BASE = "http://127.0.0.1:4177/api";
const KNOWN_EQUIPMENT_TYPES = ["DDC Panel", "Temperature Sensor", "Air Handling Unit", "Lighting Panel", "Power Meter", "Controller", "Sensor", "Actuator", "Valve", "Meter", "Equipment"];

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
    reference: "Reference",
    equipmentCards: "Equipment Cards",
    items: "Items",
    quickActions: "Quick Actions",
    addComment: "Comment",
    commentPlaceholder: "Type a comment. Previous comments are suggested automatically.",
    selectedEquipment: "Selected Equipment",
    noEquipment: "No equipment in this project/location/team",
    logoText: "ELV",
    adminDashboard: "Project Command Center",
    projectManager: "Project Manager",
    equipmentQty: "Equipment",
    inspectedQty: "Inspected",
    issueQty: "Issues",
    dataTable: "Inspection Data Table",
    allEquipment: "All Equipment",
    updateManager: "Update Manager",
    rowSaved: "Row saved",
    equipmentName: "Equipment Name",
    pointName: "Point Name",
    equipmentType: "Equipment Type",
    pointType: "Point Type",
    status: "Status",
    navDashboard: "Dashboard",
    navData: "Data Table",
    navImport: "Import & Sync",
    navIssues: "Issues",
    navPeople: "People",
    portfolioHealth: "Portfolio Health",
    totalProjects: "Projects",
    totalEquipment: "Equipment",
    totalPoints: "Points",
    passRate: "Pass Rate",
    riskLoad: "Risk Load",
    unassigned: "Unassigned",
    overdue: "Overdue",
    projectRank: "Project Performance",
    attentionNow: "Needs Attention",
    noIssues: "No open issues",
    editPoint: "Edit Point",
    fieldAddPoint: "Add Site Point",
    pointSaved: "Point saved",
    dropExcel: "Drop Excel point schedule here",
    validateExcel: "Validate Excel",
    importValidated: "Import Validated File",
    validationPassed: "Validation passed",
    validationErrors: "Errors",
    validationWarnings: "Warnings",
    previewRows: "Preview rows",
    duplicatePoint: "Duplicate point",
    unknownType: "Unknown equipment type",
    missingColumn: "Missing required column"
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
let adminSearchTimer = null;

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
    adminProjectId: "p1",
    adminEquipmentId: "",
    adminSearch: "",
    adminPage: "dashboard",
    importPreview: null,
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
        <div class="brand-row"><span class="logo-mark">${t("logoText")}</span><h1>${t("appName")}</h1></div>
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
  return `
    <section class="field-grid">
      <aside class="panel stack field-sidebar">
        ${renderSelectors()}
        ${renderEquipmentCards()}
      </aside>
      <section class="panel detail field-detail">
        ${renderFieldOperation()}
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
  `;
}

function renderEquipmentCards() {
  const equipment = getVisibleEquipment();
  return `
    <div class="section-title">${t("equipmentCards")}</div>
    <div class="equipment-card-grid">
      ${equipment
        .map((item) => {
          const records = state.data.records.filter((record) => record.equipmentId === item.id);
          const stats = getStats(records);
          const points = state.data.points.filter((point) => point.equipmentId === item.id);
          return `
            <button class="equipment-card ${item.id === state.selectedEquipmentId ? "active" : ""}" data-equipment-card="${item.id}">
              <div class="equipment-card-head">
                <span>
                  <strong>${escapeHtml(item.name)}</strong>
                  <small>${escapeHtml(item.type)} / ${escapeHtml(item.team)}</small>
                </span>
                <em class="badge ${item.status}">${statusLabel(item.status)}</em>
              </div>
              <div class="equipment-metrics">
                ${miniMetric(t("items"), records.length)}
                ${miniMetric(t("pointCount"), points.length)}
                ${miniMetric(t("completion"), `${stats.completion}%`)}
              </div>
              <div class="mini-progress"><span style="width:${stats.completion}%"></span></div>
              <small>${stats.passed} ${t("passed")} / ${stats.failed} ${t("failed")} / ${stats.pending} ${t("pending")}</small>
            </button>
          `;
        })
        .join("") || `<div class="empty small">${t("noEquipment")}</div>`}
    </div>
  `;
}

function renderFieldOperation() {
  const equipment = state.data.equipment.find((item) => item.id === state.selectedEquipmentId);
  if (!equipment) return `<div class="empty">${t("noEquipment")}</div>`;
  const records = state.data.records.filter((record) => record.equipmentId === equipment.id);
  const points = state.data.points.filter((point) => point.equipmentId === equipment.id);
  const selectedRecord = records.find((record) => record.id === state.selectedRecordId) || records[0];
  return `
    <div class="field-operation">
      <div class="form-head">
        <div>
          <p class="eyebrow">${t("selectedEquipment")}</p>
          <h2>${escapeHtml(equipment.name)}</h2>
        </div>
        <span class="badge ${equipment.status}">${statusLabel(equipment.status)}</span>
      </div>
      ${renderQuickStats(records)}
      <datalist id="comment-suggestions">${getCommentSuggestions().map((comment) => `<option value="${escapeHtml(comment)}"></option>`).join("")}</datalist>
      <div class="point-action-list">
        ${points.map((point) => renderPointActionRow(point)).join("")}
        ${renderFieldAddPointForm(equipment)}
      </div>
      ${selectedRecord ? renderAttachmentDock(selectedRecord) : ""}
    </div>
  `;
}

function renderPointActionRow(point) {
  const record = state.data.records.find((item) => item.pointId === point.id);
  const isSelected = record?.id === state.selectedRecordId;
  return `
    <div class="point-action-row ${isSelected ? "active" : ""}">
      <button class="point-main" data-point="${point.id}">
        <strong>${escapeHtml(point.name)}</strong>
        <span>${escapeHtml(point.type)} / ${t("reference")}: ${escapeHtml(point.reference || "-")}</span>
      </button>
      <span class="badge ${record?.status || point.status}">${statusLabel(record?.status || point.status)}</span>
      <div class="quick-actions">
        ${["Pass", "Fail", "N/A"].map((result) => `<button class="ghost compact" data-quick-result="${result}" data-record="${record?.id || ""}">${result}</button>`).join("")}
        <button class="ghost compact" data-comment-record="${record?.id || ""}">${t("addComment")}</button>
        <button class="ghost compact" data-edit-point="${point.id}">${t("editPoint")}</button>
      </div>
      <div class="comment-panel ${isSelected ? "show" : ""}">
        <textarea rows="2" list="comment-suggestions" data-comment-input="${record?.id || ""}" placeholder="${t("commentPlaceholder")}">${escapeHtml(record?.comments || "")}</textarea>
      </div>
      ${renderFieldPointEditor(point, isSelected)}
    </div>
  `;
}

function renderFieldPointEditor(point, isSelected) {
  return `
    <form class="field-point-editor ${isSelected ? "show" : ""}" data-field-point-editor data-id="${point.id}" data-equipment-id="${point.equipmentId}">
      <input name="name" value="${escapeHtml(point.name)}" placeholder="${t("pointName")}" />
      <input name="type" value="${escapeHtml(point.type)}" placeholder="${t("pointType")}" />
      <input name="reference" value="${escapeHtml(point.reference || "")}" placeholder="${t("reference")}" />
      <input name="status" type="hidden" value="${escapeHtml(point.status || "pending")}" />
      <button class="ghost compact" type="submit">${t("saveChanges")}</button>
    </form>
  `;
}

function renderFieldAddPointForm(equipment) {
  return `
    <form class="field-add-point" data-field-point-editor data-equipment-id="${equipment.id}">
      <input name="name" placeholder="${t("pointName")}" required />
      <input name="type" placeholder="${t("pointType")}" value="Point" />
      <input name="reference" placeholder="${t("reference")}" />
      <input name="status" type="hidden" value="pending" />
      <button class="primary" type="submit">${t("fieldAddPoint")}</button>
    </form>
  `;
}

function renderAttachmentDock(record) {
  return `
    <form class="attachment-dock" data-form="${record.id}">
      <label class="file-button">${t("camera")}
        <input name="camera" type="file" accept="image/*" capture="environment" multiple />
      </label>
      <label class="file-button">${t("gallery")}
        <input name="attachments" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" multiple />
      </label>
      <button type="button" class="ghost" data-action="translate">${t("translate")}</button>
      <button class="primary" type="submit">${t("save")}</button>
      <div class="photos">
        ${(record.photos || []).map((photo) => `<img src="${photo.dataUrl || photo}" alt="${escapeHtml(photo.name || "Inspection photo")}" />`).join("")}
      </div>
    </form>
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
  return `
    <section class="admin-shell">
      <aside class="admin-sidebar">
        <div class="admin-side-title">${t("admin")}</div>
        ${renderAdminNavItem("dashboard", t("navDashboard"))}
        ${renderAdminNavItem("data", t("navData"))}
        ${renderAdminNavItem("import", t("navImport"))}
        ${renderAdminNavItem("issues", t("navIssues"))}
        ${renderAdminNavItem("people", t("navPeople"))}
      </aside>
      <section class="admin-main">
        ${renderAdminPage()}
      </section>
    </section>
  `;
}

function renderAdminNavItem(page, label) {
  return `<button class="admin-nav-item ${state.adminPage === page ? "active" : ""}" data-admin-page="${page}">${label}</button>`;
}

function renderAdminPage() {
  if (state.adminPage === "data") {
    return `
      <section class="panel">
        <div class="section-title">${t("dataTable")}</div>
        ${renderAdminFilters()}
        ${renderDataTable()}
      </section>
    `;
  }
  if (state.adminPage === "import") return renderImportPage();
  if (state.adminPage === "issues") return renderIssuesPage();
  if (state.adminPage === "people") return renderPeoplePage();
  return `
    ${renderDashboardHero()}
    <section class="dashboard-grid">
      <section class="panel project-rank">
        <div class="section-title">${t("projectRank")}</div>
        ${state.data.projects.map(renderProjectSummary).join("")}
      </section>
      <section class="panel attention-panel">
        <div class="section-title">${t("attentionNow")}</div>
        ${renderAttentionList()}
      </section>
    </section>
  `;
}

function renderDashboardHero() {
  const metrics = getDashboardMetrics();
  return `
    <section class="dashboard-hero">
      <div>
        <p class="eyebrow">${t("portfolioHealth")}</p>
        <h2>${metrics.completion}%</h2>
        <span>${metrics.passed}/${metrics.total} ${t("inspectedQty")}</span>
      </div>
      <div class="hero-kpis">
        ${renderKpi(t("totalProjects"), metrics.projects)}
        ${renderKpi(t("totalEquipment"), metrics.equipment)}
        ${renderKpi(t("totalPoints"), metrics.points)}
        ${renderKpi(t("issueQty"), metrics.issues, "danger")}
        ${renderKpi(t("unassigned"), metrics.unassigned, metrics.unassigned ? "warn" : "")}
        ${renderKpi(t("overdue"), metrics.overdue, metrics.overdue ? "danger" : "")}
      </div>
    </section>
  `;
}

function renderKpi(label, value, tone = "") {
  return `<div class="kpi-card ${tone}"><strong>${value}</strong><span>${label}</span></div>`;
}

function renderImportPage() {
  const preview = state.importPreview;
  return `
    <section class="panel import-panel">
      <div>
        <div class="section-title">${t("navImport")}</div>
        <p class="muted">${t("templateHint")}</p>
      </div>
      <label class="drop-zone" data-drop-zone>
        <strong>${t("dropExcel")}</strong>
        <span>${t("templateHint")}</span>
        <input data-action="import-excel" type="file" accept=".xlsx,.xls,.csv" />
      </label>
      <div class="import-actions">
        <a class="file-button" href="${API_BASE}/template/equipment">${t("downloadTemplate")}</a>
        <button class="primary" data-action="commit-import" ${preview?.errors?.length ? "disabled" : ""}>${t("importValidated")}</button>
        <button class="ghost" data-action="sync">${t("syncNow")}</button>
      </div>
      ${preview ? renderImportPreview(preview) : ""}
      ${state.conflicts.length ? `<div class="section-title">${t("syncConflicts")}</div>${state.conflicts.map((item) => `<p class="muted">${escapeHtml(item.local.title)}</p>`).join("")}` : ""}
    </section>
  `;
}

function renderImportPreview(preview) {
  return `
    <div class="validation-grid">
      ${renderValidationCard(t("previewRows"), preview.rows.length)}
      ${renderValidationCard(t("validationErrors"), preview.errors.length, preview.errors.length ? "danger" : "")}
      ${renderValidationCard(t("validationWarnings"), preview.warnings.length, preview.warnings.length ? "warn" : "")}
    </div>
    <div class="validation-list">
      ${preview.errors.map((item) => `<div class="validation-item danger">${escapeHtml(item)}</div>`).join("")}
      ${preview.warnings.map((item) => `<div class="validation-item warn">${escapeHtml(item)}</div>`).join("")}
      ${!preview.errors.length && !preview.warnings.length ? `<div class="validation-item ok">${t("validationPassed")}</div>` : ""}
    </div>
    <div class="preview-table">
      ${preview.rows
        .slice(0, 8)
        .map((row, index) => `<div><strong>#${index + 1}</strong><span>${escapeHtml(row.Project || "")}</span><span>${escapeHtml(row.Equipment || "")}</span><span>${escapeHtml(row.Point || "")}</span></div>`)
        .join("")}
    </div>
  `;
}

function renderValidationCard(label, value, tone = "") {
  return `<div class="validation-card ${tone}"><strong>${value}</strong><span>${label}</span></div>`;
}

function renderIssuesPage() {
  return `
    <section class="panel">
      <div class="section-title">${t("openItems")}</div>
      <div class="table">
        ${state.data.records
          .filter((record) => ["failed", "rectification", "pending"].includes(record.status))
          .map(renderIssueRow)
          .join("")}
      </div>
    </section>
  `;
}

function renderPeoplePage() {
  const people = getPeopleStats();
  return `
    <section class="panel">
      <div class="section-title">${t("personStats")}</div>
      <div class="people">
        ${people.map((person) => `<div><strong>${escapeHtml(person.name || "-")}</strong><span>${person.done}/${person.total}</span><progress value="${person.done}" max="${person.total}"></progress></div>`).join("")}
      </div>
    </section>
  `;
}

function renderProjectSummary(project) {
  const equipment = state.data.equipment.filter((item) => item.projectId === project.id);
  const records = state.data.records.filter((record) => record.projectId === project.id);
  const points = state.data.points.filter((point) => equipment.some((item) => item.id === point.equipmentId));
  const stats = getStats(records);
  return `
    <section class="project-card">
      <form data-project-manager="${project.id}" class="manager-row">
        <div>
          <p class="eyebrow">${escapeHtml(project.client || "-")}</p>
          <h2>${escapeHtml(project.name)}</h2>
        </div>
        <label>${t("projectManager")}
          <input name="manager" value="${escapeHtml(project.manager || "")}" placeholder="PM / Engineer" />
        </label>
        <button class="ghost" type="submit">${t("updateManager")}</button>
      </form>
      <div class="stats wide">
        ${statCard(t("equipmentQty"), equipment.length)}
        ${statCard(t("pointCount"), points.length)}
        ${statCard(t("inspectedQty"), stats.passed)}
        ${statCard(t("pending"), stats.pending)}
        ${statCard(t("issueQty"), stats.failed + stats.rectification)}
      </div>
      <div class="project-progress-line">
        <span>${stats.completion}%</span>
        <div class="mini-progress"><span style="width:${stats.completion}%"></span></div>
      </div>
    </section>
  `;
}

function renderAttentionList() {
  const records = state.data.records.filter((record) => ["failed", "rectification", "pending"].includes(record.status)).slice(0, 8);
  if (!records.length) return `<div class="empty small">${t("noIssues")}</div>`;
  return records.map(renderIssueRow).join("");
}

function renderAdminFilters() {
  const equipmentOptions = getAdminFilteredEquipmentOptions();
  const searchValue = state.adminSearchDraft ?? state.adminSearch ?? "";
  return `
    <div class="admin-filter-row">
      <label>${t("project")}
        <select data-admin-filter="project">${state.data.projects.map((project) => option(project.id, project.name, state.adminProjectId || state.selectedProjectId)).join("")}</select>
      </label>
      <label>${t("equipment")}
        <select data-admin-filter="equipment">
          <option value="">${t("allEquipment")}</option>
          ${equipmentOptions.map((item) => option(item.id, item.name, state.adminEquipmentId || "")).join("")}
        </select>
      </label>
      <label>${t("search")}
        <input data-admin-filter="search" value="${escapeHtml(searchValue)}" placeholder="${t("search")}" />
      </label>
    </div>
  `;
}

function renderDataTable() {
  return `
    <div class="excel-table-wrap">
      <div class="excel-table">
        <div class="excel-row excel-head">
          <span>${t("project")}</span>
          <span>${t("location")}</span>
          <span>${t("team")}</span>
          <span>${t("equipmentName")}</span>
          <span>${t("equipmentType")}</span>
          <span>${t("pointName")}</span>
          <span>${t("pointType")}</span>
          <span>${t("reference")}</span>
          <span>${t("assignee")}</span>
          <span>${t("due")}</span>
          <span>${t("status")}</span>
          <span></span>
        </div>
        ${getAdminRows().map(renderDataRow).join("")}
      </div>
    </div>
  `;
}

function renderDataRow(row) {
  return `
    <form class="excel-row" data-row-editor data-record-id="${row.record.id}" data-equipment-id="${row.equipment.id}" data-point-id="${row.point.id}">
      <select name="projectId">${state.data.projects.map((project) => option(project.id, project.name, row.equipment.projectId)).join("")}</select>
      <select name="locationId">${state.data.locations.map((location) => option(location.id, location.name, row.equipment.locationId)).join("")}</select>
      <input name="team" value="${escapeHtml(row.equipment.team)}" />
      <input name="equipmentName" value="${escapeHtml(row.equipment.name)}" />
      <input name="equipmentType" value="${escapeHtml(row.equipment.type)}" />
      <input name="pointName" value="${escapeHtml(row.point.name)}" />
      <input name="pointType" value="${escapeHtml(row.point.type)}" />
      <input name="reference" value="${escapeHtml(row.point.reference || "")}" />
      <input name="assignee" value="${escapeHtml(row.record.assignee || "")}" />
      <input name="due" value="${escapeHtml(row.record.due || "")}" />
      <select name="status">${["pending", "passed", "failed", "rectification", "closed"].map((status) => option(status, statusLabel(status), row.record.status)).join("")}</select>
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
  document.querySelectorAll("[data-admin-page]").forEach((button) => {
    button.addEventListener("click", () => setState({ adminPage: button.dataset.adminPage }));
  });
  document.querySelector("[data-action='toggle-lang']")?.addEventListener("click", () => setState({ lang: state.lang === "en" ? "zh" : "en" }));
  document.querySelectorAll("[data-field]").forEach((select) => {
    select.addEventListener("change", () => handleSelectorChange(select.dataset.field, select.value));
  });
  document.querySelectorAll("[data-point]").forEach((button) => {
    button.addEventListener("click", () => selectPoint(button.dataset.point));
  });
  document.querySelectorAll("[data-equipment-card]").forEach((button) => {
    button.addEventListener("click", () => selectEquipment(button.dataset.equipmentCard));
  });
  document.querySelectorAll("[data-record]").forEach((button) => {
    button.addEventListener("click", () => setState({ selectedRecordId: button.dataset.record }));
  });
  document.querySelectorAll("[data-quick-result]").forEach((button) => {
    button.addEventListener("click", () => updateRecordQuick(button.dataset.record, button.dataset.quickResult));
  });
  document.querySelectorAll("[data-comment-record]").forEach((button) => {
    button.addEventListener("click", () => setState({ selectedRecordId: button.dataset.commentRecord }));
  });
  document.querySelectorAll("[data-edit-point]").forEach((button) => {
    button.addEventListener("click", () => selectPoint(button.dataset.editPoint));
  });
  document.querySelectorAll("[data-comment-input]").forEach((input) => {
    input.addEventListener("change", () => updateRecordComment(input.dataset.commentInput, input.value));
  });
  document.querySelector("[data-action='sync']")?.addEventListener("click", () => syncRecords(true));
  document.querySelector("[data-action='translate']")?.addEventListener("click", translateComment);
  document.querySelector("[data-action='import-excel']")?.addEventListener("change", (event) => validateExcelFile(event.target.files[0]));
  document.querySelector("[data-action='commit-import']")?.addEventListener("click", commitValidatedImport);
  document.querySelector("[data-drop-zone]")?.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.currentTarget.classList.add("dragging");
  });
  document.querySelector("[data-drop-zone]")?.addEventListener("dragleave", (event) => {
    event.currentTarget.classList.remove("dragging");
  });
  document.querySelector("[data-drop-zone]")?.addEventListener("drop", (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove("dragging");
    validateExcelFile(event.dataTransfer.files[0]);
  });
  document.querySelectorAll("[data-admin-filter]").forEach((field) => {
    if (field.dataset.adminFilter === "search") {
      field.addEventListener("input", () => updateAdminSearch(field.value));
    } else {
      field.addEventListener("change", () => updateAdminFilter(field));
    }
  });
  document.querySelectorAll("[data-project-manager]").forEach((form) => {
    form.addEventListener("submit", saveProjectManager);
  });
  document.querySelectorAll("[data-row-editor]").forEach((form) => {
    form.addEventListener("submit", saveDataRow);
  });
  document.querySelectorAll("[data-field-point-editor]").forEach((form) => {
    form.addEventListener("submit", saveFieldPoint);
  });
  document.querySelector(".inspection-form")?.addEventListener("submit", saveInspection);
  document.querySelector(".attachment-dock")?.addEventListener("submit", saveInspection);
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

function selectEquipment(equipmentId) {
  const point = state.data.points.find((item) => item.equipmentId === equipmentId);
  const record = state.data.records.find((item) => item.equipmentId === equipmentId && item.pointId === point?.id);
  setState({ selectedEquipmentId: equipmentId, selectedPointId: point?.id || "", selectedRecordId: record?.id || "" });
}

function updateAdminFilter(field) {
  const patch = {};
  if (field.dataset.adminFilter === "project") {
    patch.adminProjectId = field.value;
    patch.adminEquipmentId = "";
    patch.adminSearchDraft = state.adminSearch || "";
  }
  if (field.dataset.adminFilter === "equipment") patch.adminEquipmentId = field.value;
  setState(patch);
}

function updateAdminSearch(value) {
  state = { ...state, adminSearchDraft: value };
  saveState();
  window.clearTimeout(adminSearchTimer);
  adminSearchTimer = window.setTimeout(() => {
    setState({ adminSearch: value, adminSearchDraft: value });
  }, 350);
}

async function saveInspection(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.dataset.form;
  const cameraFiles = await filesToDataUrls(form.camera.files);
  const attachmentFiles = await filesToDataUrls(form.attachments.files);
  const records = state.data.records.map((record) => {
    if (record.id !== id) return record;
    const result = form.result?.value || record.result || "Pending";
    const now = new Date();
    return {
      ...record,
      title: form.title?.value || record.title,
      result,
      comments: form.comments?.value || record.comments || "",
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

async function updateRecordQuick(recordId, result) {
  updateRecord(recordId, { result, status: statusFromResult(result) });
  await syncRecords(false);
}

async function updateRecordComment(recordId, comments) {
  updateRecord(recordId, { comments });
  await syncRecords(false);
}

function updateRecord(recordId, patch) {
  const now = new Date();
  const records = state.data.records.map((record) => {
    if (record.id !== recordId) return record;
    return {
      ...record,
      ...patch,
      sync: "pending",
      localUpdatedAt: now.getTime(),
      baseServerUpdatedAt: record.serverUpdatedAt,
      updatedAt: now.toLocaleString("sv-SE")
    };
  });
  const data = refreshLocalStatuses({ ...state.data, records });
  setState({ data, selectedRecordId: recordId, toast: t("success") });
  window.setTimeout(() => setState({ toast: "" }), 1600);
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

async function validateExcelFile(file) {
  if (!file) return;
  try {
    const rows = await readExcelRows(file);
    const preview = validateImportRows(rows);
    preview.fileName = file.name;
    preview.base64 = await fileToBase64(file);
    setState({ importPreview: preview });
  } catch {
    flash("Unable to read Excel file");
  }
}

async function commitValidatedImport() {
  const preview = state.importPreview;
  if (!preview || preview.errors.length) return;
  try {
    const response = await apiPost("/import/equipment", { fileName: preview.fileName, base64: preview.base64 });
    setData(response.data);
    setState({ importPreview: null });
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

async function saveFieldPoint(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  if (form.dataset.id) payload.id = form.dataset.id;
  payload.equipmentId = form.dataset.equipmentId;
  try {
    const response = await apiPost("/admin/point", payload);
    const point = response.points.find((item) => item.equipmentId === payload.equipmentId && item.name === payload.name) || response.points.find((item) => item.id === payload.id);
    const record = response.records.find((item) => item.pointId === point?.id);
    setData(response);
    setState({ selectedEquipmentId: payload.equipmentId, selectedPointId: point?.id || state.selectedPointId, selectedRecordId: record?.id || state.selectedRecordId, toast: t("pointSaved") });
    window.setTimeout(() => setState({ toast: "" }), 1800);
  } catch {
    flash(t("serverOffline"));
  }
}

async function saveProjectManager(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.id = form.dataset.projectManager;
  try {
    const response = await apiPost("/admin/project", payload);
    setData(response);
    flash(t("updateSuccess"));
  } catch {
    flash(t("serverOffline"));
  }
}

async function saveDataRow(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.recordId = form.dataset.recordId;
  payload.equipmentId = form.dataset.equipmentId;
  payload.pointId = form.dataset.pointId;
  try {
    const response = await apiPost("/admin/row", payload);
    setData(response);
    flash(t("rowSaved"));
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

function getVisibleEquipment() {
  return state.data.equipment.filter((item) => item.locationId === state.selectedLocationId && item.team === state.selectedTeam);
}

function getAdminFilteredEquipmentOptions() {
  const projectId = state.adminProjectId || state.selectedProjectId;
  return state.data.equipment.filter((item) => item.projectId === projectId);
}

function getAdminRows() {
  const projectId = state.adminProjectId || state.selectedProjectId;
  const search = String(state.adminSearch || "").trim().toLowerCase();
  return state.data.records
    .map((record) => ({
      record,
      equipment: state.data.equipment.find((item) => item.id === record.equipmentId),
      point: state.data.points.find((item) => item.id === record.pointId)
    }))
    .filter((row) => row.equipment && row.point)
    .filter((row) => row.equipment.projectId === projectId)
    .filter((row) => !state.adminEquipmentId || row.equipment.id === state.adminEquipmentId)
    .filter((row) => {
      if (!search) return true;
      return [row.equipment.name, row.equipment.type, row.equipment.team, row.point.name, row.point.type, row.point.reference, row.record.assignee]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
}

function getCommentSuggestions() {
  return [...new Set(state.data.records.map((record) => record.comments).filter(Boolean))].slice(0, 20);
}

function getStats(records = state.data.records) {
  const total = records.length;
  const passed = records.filter((record) => ["passed", "closed"].includes(record.status)).length;
  const failed = records.filter((record) => record.status === "failed").length;
  const rectification = records.filter((record) => record.status === "rectification").length;
  const pending = records.filter((record) => record.status === "pending").length;
  return { total, passed, failed, rectification, pending, completion: total ? Math.round((passed / total) * 100) : 0 };
}

function getDashboardMetrics() {
  const stats = getStats();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = state.data.records.filter((record) => {
    if (!record.due || ["passed", "closed"].includes(record.status)) return false;
    const due = new Date(record.due);
    return !Number.isNaN(due.getTime()) && due < today;
  }).length;
  return {
    ...stats,
    projects: state.data.projects.length,
    equipment: state.data.equipment.length,
    points: state.data.points.length,
    issues: stats.failed + stats.rectification,
    unassigned: state.data.records.filter((record) => !record.assignee).length,
    overdue
  };
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

function miniMetric(label, value) {
  return `<span><strong>${value}</strong><small>${label}</small></span>`;
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

async function readExcelRows(file) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" }).map(normalizeImportRow).filter((row) => row.Project || row.Location || row.Equipment || row.Point);
}

function normalizeImportRow(row) {
  return {
    Project: pickImportValue(row, ["Project", "項目"]),
    Location: pickImportValue(row, ["Location", "Area", "地點", "位置"]),
    Team: pickImportValue(row, ["Team", "Category", "System", "團隊", "分類", "系統"]),
    Equipment: pickImportValue(row, ["Equipment", "Equipment Name", "Name", "Device", "設備", "設備名稱"]),
    Type: pickImportValue(row, ["Type", "Equipment Type", "類型"]),
    Point: pickImportValue(row, ["Point", "Point Name", "Sub Device", "點位", "子設備"]),
    "Point Type": pickImportValue(row, ["Point Type", "Signal Type", "點位類型"]),
    Reference: pickImportValue(row, ["Reference", "Expected", "標準", "參考"]),
    Assignee: pickImportValue(row, ["Assignee", "Owner", "負責人"]),
    Due: pickImportValue(row, ["Due", "Target Date", "目標日期"])
  };
}

function validateImportRows(rows) {
  const errors = [];
  const warnings = [];
  const required = ["Project", "Location", "Equipment", "Point"];
  const seen = new Map();

  rows.forEach((row, index) => {
    const rowNo = index + 2;
    required.forEach((column) => {
      if (!row[column]) errors.push(`${t("missingColumn")} ${column} @ row ${rowNo}`);
    });
    const key = [row.Project, row.Location, row.Equipment, row.Point].map((value) => String(value).trim().toLowerCase()).join("|");
    if (seen.has(key)) errors.push(`${t("duplicatePoint")} @ rows ${seen.get(key)} and ${rowNo}: ${row.Equipment} / ${row.Point}`);
    if (key !== "|||") seen.set(key, rowNo);
    if (row.Type && !KNOWN_EQUIPMENT_TYPES.some((type) => type.toLowerCase() === row.Type.toLowerCase())) {
      warnings.push(`${t("unknownType")} @ row ${rowNo}: ${row.Type}`);
    }
  });

  return { rows, errors, warnings };
}

function pickImportValue(row, names) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
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
