const STORAGE_KEY = "elv-acceptance-offline-v2";
const ATTACHMENT_DB_NAME = "elv-acceptance-attachments";
const ATTACHMENT_STORE = "attachments";
const MEDIA_UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024;
const API_BASE =
  window.__ELV_API_BASE__ ||
  import.meta.env?.VITE_API_BASE ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.port === "5176" || window.location.port === "5173"
    ? `http://${window.location.hostname}:4177/api`
    : "/api");
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
    navMedia: "Drawings & Media",
    mediaLibrary: "Equipment Media Library",
    mediaType: "Media Type",
    mediaComments: "Media Comments",
    uploadMedia: "Upload Media",
    noMedia: "No drawings, photos or documents attached to this equipment",
    mediaSaved: "Media saved",
    uploadFailed: "Upload failed",
    uploadInProgress: "Upload in progress",
    drawing: "Drawing",
    map: "Map",
    locationPlan: "Location Plan",
    wiring: "Wiring Diagram",
    photo: "Photo",
    document: "Document",
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
    allAttention: "All Attention",
    filteredBy: "Filtered by",
    matchingRecords: "matching records",
    noMatchingRecords: "No records match this drilldown",
    issueDetails: "Issue Details",
    ageing: "Stalled",
    days: "days",
    viewIssues: "View in Issues",
    close: "Close",
    noPhotos: "No photos attached",
    issueOwner: "Owner",
    issueContext: "Context",
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
    missingColumn: "Missing required column",
    treeView: "Location Tree",
    allNodes: "All",
    building: "Building",
    floor: "Floor",
    room: "Room",
    back: "Back"
  },
  zh: {
    appName: "ELV 項目驗收",
    field: "現場端",
    admin: "管理端",
    project: "項目",
    location: "位置",
    team: "團隊/分類",
    equipment: "設備",
    point: "點位/子設備",
    inspections: "驗收項目",
    overview: "總覽",
    people: "人員",
    pending: "待驗收",
    passed: "已通過",
    failed: "失敗",
    rectification: "整改中",
    closed: "已關閉",
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
    syncPending: "待同步",
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
    openItems: "未關閉問題",
    noRecord: "選擇一個驗收項目開始",
    editHint: "可修改現場名稱、補充備註、拍照或上傳附件，然後保存。",
    syncNow: "立即同步",
    lastUpdated: "最後更新",
    importExcel: "導入 Excel",
    downloadTemplate: "下載 Excel 模板",
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
    reference: "參考值",
    equipmentCards: "設備卡片",
    items: "項目",
    quickActions: "快捷操作",
    addComment: "備註",
    commentPlaceholder: "輸入備註，系統會自動聯想歷史備註。",
    selectedEquipment: "已選設備",
    noEquipment: "此項目/位置/團隊下沒有設備",
    logoText: "ELV",
    adminDashboard: "項目指揮中心",
    projectManager: "項目經理",
    equipmentQty: "設備數量",
    inspectedQty: "已驗收",
    issueQty: "問題數",
    dataTable: "驗收資料表",
    allEquipment: "所有設備",
    updateManager: "更新負責人",
    rowSaved: "行資料已保存",
    equipmentName: "設備名稱",
    pointName: "點位名稱",
    equipmentType: "設備類型",
    pointType: "點位類型",
    status: "狀態",
    navDashboard: "儀表板",
    navData: "資料表",
    navImport: "導入與同步",
    navIssues: "問題",
    navPeople: "人員",
    navMedia: "圖紙與媒體",
    mediaLibrary: "設備媒體庫",
    mediaType: "媒體類型",
    mediaComments: "媒體備註",
    uploadMedia: "上傳媒體",
    noMedia: "此設備暫無圖紙、照片或文件",
    mediaSaved: "媒體已保存",
    uploadFailed: "上傳失敗",
    uploadInProgress: "正在上傳",
    drawing: "圖紙",
    map: "地圖",
    locationPlan: "位置圖",
    wiring: "接線圖",
    photo: "照片",
    document: "文件",
    portfolioHealth: "項目健康度",
    totalProjects: "項目",
    totalEquipment: "設備",
    totalPoints: "點位",
    passRate: "通過率",
    riskLoad: "風險負載",
    unassigned: "未分配",
    overdue: "逾期",
    projectRank: "項目表現",
    attentionNow: "需要關注",
    noIssues: "暫無未關閉問題",
    allAttention: "所有關注項",
    filteredBy: "當前篩選",
    matchingRecords: "筆匹配資料",
    noMatchingRecords: "此下鑽條件暫無資料",
    issueDetails: "問題詳情",
    ageing: "已滯留",
    days: "天",
    viewIssues: "前往問題頁",
    close: "關閉",
    noPhotos: "暫無照片附件",
    issueOwner: "負責人",
    issueContext: "上下文",
    editPoint: "編輯點位",
    fieldAddPoint: "新增現場點位",
    pointSaved: "點位已保存",
    dropExcel: "拖拽 Excel 點位表到此處",
    validateExcel: "校驗 Excel",
    importValidated: "導入已校驗文件",
    validationPassed: "校驗通過",
    validationErrors: "錯誤",
    validationWarnings: "警告",
    previewRows: "預覽行",
    duplicatePoint: "重複點位",
    unknownType: "未知設備類型",
    missingColumn: "缺少必填欄位",
    treeView: "位置樹",
    allNodes: "全部",
    building: "樓棟",
    floor: "樓層",
    room: "機房",
    back: "返回"
  }
};
const fallbackData = {
  version: 1,
  projects: [{ id: "p1", name: "Harbour Tower BMS Upgrade", client: "Facility Team" }],
  locations: [{ id: "l1", projectId: "p1", name: "Tower A / 12F / AHU Room" }],
  equipment: [{ id: "e1", projectId: "p1", locationId: "l1", team: "BMS", name: "DDC-12F-AHU-01", type: "DDC Panel", status: "pending" }],
  points: [{ id: "pt1", equipmentId: "e1", name: "BACnet/IP communication", type: "Network", reference: "Online", status: "pending" }],
  media: [],
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
let pendingMediaUploadFiles = [];
let pendingMediaUploadDraft = {};
let mediaUploadSaving = false;

init();

async function init() {
  render();
  await syncRecords(false);
  await bootstrapFromServer();
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
    fieldMobileLevel: "project",
    fieldMobilePath: {},
    toast: "",
    conflicts: [],
    adminProjectId: "p1",
    adminEquipmentId: "",
    adminSearch: "",
    adminPage: "dashboard",
    adminTreeSelection: null,
    collapsedTreeNodes: [],
    adminTreeWidth: null,
    adminTreeWidthManual: false,
    adminColumnWidths: null,
    dashboardFilter: "all",
    dashboardEntityId: "",
    mediaEquipmentId: "e1",
    mediaProjectId: "",
    mediaBuilding: "",
    mediaFloor: "",
    mediaRoom: "",
    mediaSearch: "",
    mediaCategoryFilter: "all",
    mediaUploadOpen: false,
    mediaUploadEquipmentId: "",
    selectedIssueId: "",
    fieldAddPointOpen: false,
    importPreview: null,
    serverOnline: false,
    data: structuredClone(fallbackData)
  };
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState();
    const parsed = JSON.parse(stored);
    if (parsed.adminTreeWidthManual !== true) {
      parsed.adminTreeWidth = null;
      parsed.adminTreeWidthManual = false;
    }
    parsed.mediaUploadOpen = false;
    parsed.mediaUploadEquipmentId = "";
    return { ...defaultState(), ...parsed };
  } catch (error) {
    console.warn("Unable to load saved ELV state. Falling back to defaults.", error);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures; default state keeps the UI usable.
    }
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Unable to persist ELV state. Browser storage may be full.", error);
  }
}

async function bootstrapFromServer() {
  try {
    const data = await apiGet("/bootstrap");
    const pending = getPendingRecords();
    const merged = pending.length ? mergeLocalPendingRecords(data, pending, state.conflicts) : data;
    setState({ data: normalizeSelection(merged), serverOnline: true, toast: "" }, false);
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
  data.media = Array.isArray(data.media) ? data.media : [];
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
      ${renderIssueModal()}
      ${renderFieldAddPointModal()}
      ${renderMediaUploadModal()}
      <div class="toast ${state.toast ? "show" : ""}">${escapeHtml(state.toast)}</div>
    </main>
  `;
  bindEvents();
  hydrateLocalAttachmentImages();
}

function renderTopbar() {
  const pendingSync = state.data.records.filter((record) => record.sync === "pending").length;
  const isOnline = navigator.onLine && state.serverOnline;
  const syncText = pendingSync ? `${pendingSync} ${t("syncPending")}` : t("synced");
  return `
    <header class="topbar">
      <div class="topbar-brand">
        <div class="brand-row"><span class="logo-mark">${t("logoText")}</span><h1>${t("appName")}</h1></div>
      </div>
      ${state.view === "admin" ? `<nav class="top-nav">${renderAdminNavItem("dashboard", t("navDashboard"))}${renderAdminNavItem("data", t("navData"))}${renderAdminNavItem("media", t("navMedia"))}${renderAdminNavItem("import", t("navImport"))}${renderAdminNavItem("issues", t("navIssues"))}${renderAdminNavItem("people", t("navPeople"))}</nav>` : ""}
      <div class="topbar-actions">
        <span class="sync-pill ${isOnline ? "online" : "offline"} ${pendingSync ? "pending-sync" : ""}">
          <i></i>
          <span>
            <strong>${isOnline ? t("online") : t("offline")}</strong>
            <small>${syncText}</small>
          </span>
        </span>
        <div class="actions">
          <button class="icon-btn" data-action="toggle-lang" title="${t("bilingual")}">${state.lang === "en" ? "EN" : "ZH"}</button>
          <button class="mode-btn ${state.view === "field" ? "active" : ""}" data-view="field">${t("field")}</button>
          <button class="mode-btn ${state.view === "admin" ? "active" : ""}" data-view="admin">${t("admin")}</button>
        </div>
      </div>
    </header>
  `;
}

function renderField() {
  const isMobileDetail = state.fieldMobileLevel === "detail";
  return `
    <section class="field-grid ${isMobileDetail ? "mobile-detail-open" : ""}">
      <aside class="panel stack field-sidebar">
        <div class="field-desktop-tree">
          ${renderFieldTree()}
        </div>
        <div class="field-mobile-drill">
          ${renderFieldMobileDrill()}
        </div>
      </aside>
      <section class="panel detail field-detail">
        ${renderFieldOperation()}
      </section>
    </section>
  `;
}

function renderFieldTree() {
  return `
    <div class="section-title">${t("treeView")}</div>
    <div class="tree-view field-tree-view">
      ${state.data.projects.map((project) => renderFieldProjectBranch(project)).join("")}
    </div>
  `;
}

function renderFieldProjectBranch(project) {
  const tree = buildLocationTree(project.id);
  const equipmentCount = state.data.equipment.filter((item) => item.projectId === project.id).length;
  const projectNode = { type: "project", projectId: project.id, label: project.name, count: equipmentCount };
  return `${renderFieldTreeNode(projectNode, 0)}${[...tree.values()].map((building) => renderFieldTreeBranch(building, 1)).join("")}`;
}

function renderFieldTreeBranch(node, level) {
  const children = node.children ? [...node.children.values()].map((child) => renderFieldTreeBranch(child, level + 1)).join("") : "";
  const equipment = node.equipment ? node.equipment.map((item) => renderFieldTreeEquipment(item, level + 1)).join("") : "";
  return `${renderFieldTreeNode(node, level)}${children}${equipment}`;
}

function renderFieldTreeEquipment(item, level) {
  const records = state.data.records.filter((record) => record.equipmentId === item.id);
  const stats = getStats(records);
  const node = {
    type: "equipment",
    projectId: item.projectId,
    locationId: item.locationId,
    equipmentId: item.id,
    label: item.name,
    meta: `${item.type} / ${stats.completion}%`
  };
  return renderFieldTreeNode(node, level, item.status);
}

function renderFieldTreeNode(node, level, status = "") {
  const active = isFieldTreeActive(node);
  const path = isFieldTreePath(node);
  const meta = node.meta || `${node.type}${node.count !== undefined ? ` / ${node.count}` : ""}`;
  return `
    <button class="tree-node field-tree-node ${active ? "active" : ""} ${path ? "path" : ""}" style="--level:${level}" data-field-tree-node="${encodeTreeNode(node)}">
      <span>${escapeHtml(node.label)}</span>
      <small class="${status}">${escapeHtml(meta)}</small>
    </button>
  `;
}

function renderFieldMobileDrill() {
  const level = state.fieldMobileLevel || "project";
  const path = state.fieldMobilePath || {};
  if (level === "detail") return renderFieldMobileDetailNav();

  const options = getFieldMobileOptions(level, path);
  const step = getFieldMobileStepInfo(level);
  return `
    <div class="mobile-drill-shell">
      <div class="mobile-drill-nav-card">
        <div class="mobile-drill-topline">
          ${renderFieldMobileBackButton(level, path)}
          <span class="mobile-step-pill">Step ${step.current}/${step.total}</span>
        </div>
        <div class="mobile-current-level">
          <p class="eyebrow">Now selecting</p>
          <div class="section-title">${getFieldMobilePrompt(level)}</div>
          <p>${getFieldMobileContext(level, path)}</p>
        </div>
        <div class="mobile-drill-meta">
          <span>${options.length} options</span>
          <span>${getFieldMobileTitle(level)}</span>
        </div>
      </div>
      ${renderFieldMobileStepper(level)}
      ${renderFieldMobileBreadcrumb(path)}
      <div class="mobile-drill-list">
        ${options.map((item) => renderFieldMobileChoice(item)).join("") || `<div class="empty small">${t("noEquipment")}</div>`}
      </div>
    </div>
  `;
}

function renderFieldMobileDetailNav() {
  const equipment = state.data.equipment.find((item) => item.id === state.selectedEquipmentId);
  const path = state.fieldMobilePath || {};
  const step = getFieldMobileStepInfo("equipment");
  return `
    <div class="mobile-drill-nav-card detail-nav">
      <div class="mobile-drill-topline">
        ${renderFieldMobileBackButton("detail", path)}
        <span class="mobile-step-pill">Step ${step.current}/${step.total}</span>
      </div>
      <div class="mobile-current-level">
        <p class="eyebrow">${t("selectedEquipment")}</p>
        <div class="section-title">${escapeHtml(equipment?.name || t("equipment"))}</div>
        <p>Review points, comments, photos and acceptance status.</p>
      </div>
    </div>
    ${renderFieldMobileBreadcrumb({ projectId: state.selectedProjectId, ...path, team: state.selectedTeam, equipment: equipment?.name })}
  `;
}

function renderFieldMobileBackButton(level, path) {
  if (level === "project") {
    return `
      <div class="mobile-level-label">
        <span><small>Start level</small><strong>${t("project")}</strong></span>
      </div>
    `;
  }
  return `
    <button class="mobile-back-action" data-field-mobile-back>
      <span class="mobile-back-arrow">&larr;</span>
      <span><small>Back to</small><strong>${escapeHtml(getFieldMobileBackTarget(level, path))}</strong></span>
    </button>
  `;
}

function renderFieldMobileChoice(item) {
  const tone = item.status ? ` ${item.status}` : "";
  return `
    <button class="mobile-drill-choice${tone}" data-field-mobile-choice="${encodeURIComponent(JSON.stringify(item.payload))}">
      <span>
        <strong>${escapeHtml(item.label)}</strong>
        <small>${escapeHtml(item.meta || "")}</small>
        ${item.progress !== undefined ? `<i><b style="width:${item.progress}%"></b></i>` : ""}
      </span>
      <em>${item.action || ">"}</em>
    </button>
  `;
}

function renderFieldMobileStepper(level) {
  const levels = ["project", "building", "floor", "room", "team", "equipment"];
  const activeIndex = Math.max(0, levels.indexOf(level === "detail" ? "equipment" : level));
  return `
    <div class="mobile-stepper">
      ${levels.map((item, index) => `
        <span class="${index <= activeIndex ? "active" : ""} ${index === activeIndex ? "current" : ""}">
          <i>${index + 1}</i>
          <b>${getFieldMobileTitle(item)}</b>
        </span>
      `).join("")}
    </div>
  `;
}

function renderFieldMobileBreadcrumb(path) {
  const chips = getFieldMobileBreadcrumbItems(path);
  if (!chips.length) {
    return `
      <div class="mobile-path-hint">
        <span>Current path</span>
        <strong>Select a project to start</strong>
      </div>
    `;
  }
  return `
    <div class="mobile-path-trail">
      <small>Current path</small>
      <div>
        ${chips.map((chip, index) => `
          <span>
            <b>${index + 1}</b>
            ${escapeHtml(chip)}
          </span>
        `).join("")}
      </div>
    </div>
  `;
}

function getFieldMobileBreadcrumbItems(path) {
  const chips = [];
  if (path.projectId) chips.push(getProjectName(path.projectId));
  if (path.building) chips.push(path.building);
  if (path.floor) chips.push(path.floor);
  if (path.room) chips.push(path.room);
  if (path.team) chips.push(path.team);
  if (path.equipment) chips.push(path.equipment);
  return chips.filter(Boolean);
}

function getFieldMobileStepInfo(level) {
  const levels = ["project", "building", "floor", "room", "team", "equipment"];
  const normalized = level === "detail" ? "equipment" : level;
  return {
    current: Math.max(1, levels.indexOf(normalized) + 1),
    total: levels.length
  };
}

function getFieldMobilePrompt(level) {
  const labels = {
    project: `Select ${t("project")}`,
    building: `Select ${t("building")}`,
    floor: `Select ${t("floor")}`,
    room: `Select ${t("room")}`,
    team: `Select ${t("team")}`,
    equipment: `Select ${t("equipment")}`
  };
  return labels[level] || t("equipment");
}

function getFieldMobileContext(level, path) {
  if (level === "project") return "Choose the active project before entering site locations.";
  const parent = getFieldMobileBreadcrumbItems(path).slice(-1)[0];
  if (!parent) return "Continue through the site hierarchy.";
  return `Inside ${parent}`;
}

function getFieldMobileBackTarget(level, path) {
  if (level === "detail") return t("equipment");
  const previous = {
    building: t("project"),
    floor: t("building"),
    room: t("floor"),
    team: t("room"),
    equipment: t("team")
  }[level] || t("project");
  const chips = getFieldMobileBreadcrumbItems(path);
  const parentValue = chips[Math.max(0, chips.length - 2)];
  return parentValue ? `${previous}: ${parentValue}` : previous;
}

function getFieldMobileTitle(level) {
  const labels = {
    project: t("project"),
    building: t("building"),
    floor: t("floor"),
    room: t("room"),
    team: t("team"),
    equipment: t("equipment")
  };
  return labels[level] || t("equipment");
}

function getFieldMobileOptions(level, path) {
  if (level === "project") {
    return state.data.projects.map((project) => ({
      label: project.name,
      meta: `${state.data.equipment.filter((item) => item.projectId === project.id).length} ${t("equipment")}`,
      progress: getStats(state.data.records.filter((record) => record.projectId === project.id)).completion,
      payload: { level, projectId: project.id }
    }));
  }

  const projectId = path.projectId || state.selectedProjectId;
  const tree = buildLocationTree(projectId);
  if (level === "building") {
    return [...tree.values()].map((building) => ({
      label: building.label,
      meta: t("building"),
      progress: getStats(getRecordsForFieldPath({ projectId, building: building.building })).completion,
      payload: { level, projectId, building: building.building }
    }));
  }

  const building = tree.get(path.building);
  if (level === "floor") {
    return [...(building?.children?.values() || [])].map((floor) => ({
      label: floor.label,
      meta: t("floor"),
      progress: getStats(getRecordsForFieldPath({ projectId, building: path.building, floor: floor.floor })).completion,
      payload: { level, projectId, building: path.building, floor: floor.floor }
    }));
  }

  const floor = building?.children?.get(path.floor);
  if (level === "room") {
    return [...(floor?.children?.values() || [])].map((room) => ({
      label: room.label,
      meta: t("room"),
      progress: getStats(state.data.records.filter((record) => record.locationId === room.locationId)).completion,
      payload: { level, projectId, building: path.building, floor: path.floor, room: room.room, locationId: room.locationId }
    }));
  }

  const locationEquipment = state.data.equipment.filter((item) => item.locationId === path.locationId);
  if (level === "team") {
    return [...new Set(locationEquipment.map((item) => item.team))].map((team) => ({
      label: team,
      meta: `${locationEquipment.filter((item) => item.team === team).length} ${t("equipment")}`,
      progress: getStats(state.data.records.filter((record) => record.locationId === path.locationId && record.team === team)).completion,
      payload: { level, projectId, building: path.building, floor: path.floor, room: path.room, locationId: path.locationId, team }
    }));
  }

  if (level === "equipment") {
    return locationEquipment
      .filter((item) => item.team === path.team)
      .map((item) => {
        const records = state.data.records.filter((record) => record.equipmentId === item.id);
        const stats = getStats(records);
        return {
          label: item.name,
          meta: `${item.type} / ${stats.completion}% ${t("completion")}`,
          action: statusLabel(item.status),
          progress: stats.completion,
          status: item.status,
          payload: { level, equipmentId: item.id }
        };
      });
  }

  return [];
}

function getRecordsForFieldPath(path) {
  return state.data.records.filter((record) => {
    if (path.projectId && record.projectId !== path.projectId) return false;
    const equipment = state.data.equipment.find((item) => item.id === record.equipmentId);
    const location = state.data.locations.find((item) => item.id === equipment?.locationId);
    const parts = parseLocationParts(location?.name || "");
    if (path.building && parts.building !== path.building) return false;
    if (path.floor && parts.floor !== path.floor) return false;
    if (path.room && parts.room !== path.room) return false;
    return true;
  });
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
        <button class="field-add-point-trigger" data-open-add-point>
          <span>+</span>
          <strong>${t("fieldAddPoint")}</strong>
          <small>${escapeHtml(equipment.name)}</small>
        </button>
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
        ${["Pass", "Fail", "N/A"].map((result) => `<button class="ghost compact" data-quick-result="${result}" data-record="${record?.id || ""}" data-point-id="${point.id}">${result}</button>`).join("")}
        <button class="ghost compact" data-comment-record="${record?.id || ""}" ${record ? "" : "disabled"}>${t("addComment")}</button>
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

function renderFieldAddPointModal() {
  if (!state.fieldAddPointOpen) return "";
  const equipment = state.data.equipment.find((item) => item.id === state.selectedEquipmentId);
  if (!equipment) return "";
  return `
    <div class="modal-backdrop" data-field-add-point-backdrop>
      <section class="modal field-add-point-modal" role="dialog" aria-modal="true" aria-label="${t("fieldAddPoint")}" data-field-add-point-modal>
        <div class="modal-head">
          <div>
            <p class="eyebrow">${t("selectedEquipment")}</p>
            <h2>${t("fieldAddPoint")}</h2>
            <small>${escapeHtml(equipment.name)}</small>
          </div>
          <button class="icon-btn" data-close-add-point title="${t("close")}">X</button>
        </div>
        <div class="modal-block">
          <p>Add a temporary site point when the installed item is missing from the schedule.</p>
        </div>
        ${renderFieldAddPointForm(equipment)}
      </section>
    </div>
  `;
}

function renderMediaUploadModal() {
  if (!state.mediaUploadOpen) return "";
  const equipmentId = state.mediaUploadEquipmentId || state.mediaEquipmentId;
  const equipment = state.data.equipment.find((item) => item.id === equipmentId);
  if (!equipment) return "";
  const currentCategory = pendingMediaUploadDraft.category || getUploadMediaCategory();
  const title = pendingMediaUploadDraft.title ?? (pendingMediaUploadFiles[0] ? stripFileExtension(pendingMediaUploadFiles[0].name) : "");
  const reference = pendingMediaUploadDraft.reference || "";
  const comments = pendingMediaUploadDraft.comments || "";
  const totalSize = getTotalFileSize(pendingMediaUploadFiles);
  return `
    <div class="modal-backdrop" data-media-upload-backdrop>
      <section class="modal media-upload-modal" role="dialog" aria-modal="true" aria-label="${t("uploadMedia")}" data-media-upload-modal>
        <div class="modal-head">
          <div>
            <p class="eyebrow">${t("uploadMedia")}</p>
            <h2>${escapeHtml(equipment.name)}</h2>
            <small>${escapeHtml(equipment.type)} &middot; ${escapeHtml(getLocationName(equipment.locationId))}</small>
          </div>
          <button class="icon-btn" data-close-media-upload title="${t("close")}" ${mediaUploadSaving ? "disabled" : ""}>X</button>
        </div>
        <form class="media-upload-form" data-media-upload-form="${equipment.id}">
          <div class="media-upload-summary">
            <span><strong>${pendingMediaUploadFiles.length}</strong> file(s)</span>
            <span><strong>${formatFileSize(totalSize)}</strong> selected</span>
            <span><strong>${formatFileSize(MEDIA_UPLOAD_LIMIT_BYTES)}</strong> max per upload</span>
          </div>
          <div class="media-type-grid">
            ${getMediaTypes()
              .map(
                (type) => `
                  <label class="media-type-option ${type === currentCategory ? "active" : ""}">
                    <input type="radio" name="category" value="${type}" ${type === currentCategory ? "checked" : ""} />
                    <span>${t(type)}</span>
                  </label>
                `
              )
              .join("")}
          </div>
          <div class="modal-grid">
            <label>Title
              <input name="title" placeholder="e.g. AHU control schematic / Panel front photo" value="${escapeHtml(title)}" />
            </label>
            <label>Reference / Revision
              <input name="reference" placeholder="e.g. Rev A, As-built, Site photo" value="${escapeHtml(reference)}" />
            </label>
          </div>
          <label>${t("mediaComments")}
            <textarea name="comments" rows="4" placeholder="${t("commentPlaceholder")}">${escapeHtml(comments)}</textarea>
          </label>
          <label class="media-modal-drop" data-media-modal-drop="${equipment.id}">
            <strong>${pendingMediaUploadFiles.length ? "Files ready for review" : "Drop files here or click to choose"}</strong>
            <span>${pendingMediaUploadFiles.length ? "Drop again to replace the current selection." : "PDF, image, DWG/DXF, Word or Excel files are supported."}</span>
            <input name="mediaFiles" type="file" accept="image/*,.pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx" multiple />
          </label>
          <div class="media-file-list">
            ${pendingMediaUploadFiles.map((file, index) => renderPendingMediaFile(file, index)).join("") || `<div class="empty small">No files selected yet. You can also save a comment-only media note.</div>`}
          </div>
          <div class="modal-actions">
            <button class="ghost" type="button" data-close-media-upload ${mediaUploadSaving ? "disabled" : ""}>${t("close")}</button>
            <button class="primary media-save-button" type="submit" ${mediaUploadSaving ? "disabled" : ""}>
              <span class="button-spinner" aria-hidden="true"></span>
              ${mediaUploadSaving ? "Uploading..." : t("saveChanges")}
            </button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderPendingMediaFile(file, index) {
  return `
    <div class="media-file-row">
      <span>${getFileIcon(file)}</span>
      <strong>${escapeHtml(file.name)}</strong>
      <small>${escapeHtml(file.type || "File")} &middot; ${formatFileSize(file.size)}</small>
      <button type="button" class="media-file-remove" data-media-remove-file="${index}" aria-label="Remove ${escapeHtml(file.name)}">X</button>
    </div>
  `;
}

function getTotalFileSize(files) {
  return [...files].reduce((total, file) => total + Number(file.size || 0), 0);
}

function formatUploadError(error) {
  const detail = error?.detail || error?.message || "";
  if (error?.status === 413 || /too large|payload too large|entity too large/i.test(detail)) {
    return `${t("uploadFailed")}: files are too large. Please split files or compress images before uploading.`;
  }
  if (detail) return `${t("uploadFailed")}: ${detail}`;
  return `${t("uploadFailed")}: please check the upload service and try again.`;
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
        ${(record.photos || []).map(renderAttachmentThumb).join("")}
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
        ${(record.photos || []).map(renderAttachmentThumb).join("")}
      </div>
      <button class="primary" type="submit">${t("save")}</button>
    </form>
  `;
}

function renderAdmin() {
  return `<section class="admin-main">${renderAdminPage()}</section>`;
}

function renderAdminNavItem(page, label) {
  return `<button class="admin-nav-item ${state.adminPage === page ? "active" : ""}" data-admin-page="${page}">${label}</button>`;
}

function renderAdminPage() {
  if (state.adminPage === "data") {
    const treeWidth = getAdminTreeWidth();
    return `
      <section class="data-workbench" style="--tree-width:${treeWidth}px">
        <aside class="panel tree-panel">
          <div class="section-title">${t("treeView")}</div>
          ${renderLocationTree()}
          <span class="tree-resize-handle" data-tree-resize title="Resize tree"></span>
          ${state.adminTreeWidthManual ? `<button class="tree-auto-width" data-tree-auto-width title="Auto fit tree width">Auto</button>` : ""}
        </aside>
        <section class="data-stack">
          ${renderProjectSelectorCard()}
          <section class="panel data-panel">
            <div class="section-title">${t("dataTable")}</div>
            ${renderAdminContextBar()}
            ${renderAdminFilters()}
            ${renderDataTable()}
          </section>
        </section>
      </section>
    `;
  }
  if (state.adminPage === "media") return renderMediaPage();
  if (state.adminPage === "import") return renderImportPage();
  if (state.adminPage === "issues") return renderIssuesPage();
  if (state.adminPage === "people") return renderPeoplePage();
  return `
    ${renderDashboardHero()}
    <section class="dashboard-grid">
      <section class="panel project-rank">
        ${renderDashboardPrimaryPanel()}
      </section>
      <section class="panel attention-panel">
        ${renderAttentionHeader()}
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
        ${renderKpi(t("totalProjects"), metrics.projects, "", "projects")}
        ${renderKpi(t("totalEquipment"), metrics.equipment, "", "equipment")}
        ${renderKpi(t("totalPoints"), metrics.points, "", "points")}
        ${renderKpi(t("issueQty"), metrics.issues, "danger", "issues")}
        ${renderKpi(t("unassigned"), metrics.unassigned, metrics.unassigned ? "warn" : "", "unassigned")}
        ${renderKpi(t("overdue"), metrics.overdue, metrics.overdue ? "danger" : "", "overdue")}
      </div>
    </section>
  `;
}

function renderKpi(label, value, tone = "", filter = "") {
  const active = filter && state.dashboardFilter === filter ? "active" : "";
  if (!filter) return `<div class="kpi-card ${tone}"><strong>${value}</strong><span>${label}</span></div>`;
  return `<button class="kpi-card ${tone} ${active}" data-dashboard-filter="${filter}"><strong>${value}</strong><span>${label}</span></button>`;
}

function renderDashboardPrimaryPanel() {
  const filter = state.dashboardFilter || "all";
  const meta = getDashboardFilterMeta(filter);
  if (filter === "equipment") {
    return `
      <div class="section-title">${meta.label}</div>
      <div class="dashboard-entity-grid">
        ${state.data.equipment.map(renderEquipmentSummary).join("")}
      </div>
    `;
  }
  if (filter === "points") {
    return `
      <div class="section-title">${meta.label}</div>
      <div class="dashboard-point-list">
        <div class="dashboard-point-head">
          <span>${t("status")}</span>
          <span>${t("point")}</span>
          <span>${t("equipment")}</span>
          <span>${t("location")}</span>
        </div>
        ${state.data.points.map(renderPointSummary).join("")}
      </div>
    `;
  }
  return `
    <div class="section-title">${filter === "projects" ? meta.label : t("projectRank")}</div>
    ${state.data.projects.map(renderProjectSummary).join("")}
  `;
}

function renderMediaPage() {
  const equipment = getFilteredMediaEquipment();
  const activeEquipment = equipment.find((item) => item.id === state.mediaEquipmentId) || equipment[0];
  const media = getEquipmentMedia(activeEquipment?.id);
  const visibleMedia = getVisibleMediaForCategory(media);
  const records = state.data.records.filter((record) => record.equipmentId === activeEquipment?.id);
  return `
    <section class="media-workbench">
      <section class="panel media-filter-panel">
        ${renderMediaFilters()}
      </section>
      <aside class="panel media-device-panel">
        <div class="section-title">${t("equipment")}</div>
        <div class="media-device-list">
          ${equipment.map((item) => renderMediaEquipmentButton(item, activeEquipment?.id)).join("") || `<div class="empty small">${t("noEquipment")}</div>`}
        </div>
      </aside>
      <section class="panel media-detail-panel">
        ${
          activeEquipment
            ? `
              <div class="media-detail-head">
                <div>
                  <p class="eyebrow">${t("mediaLibrary")}</p>
                  <h2>${escapeHtml(activeEquipment.name)}</h2>
                  <span>${escapeHtml(activeEquipment.type)} &middot; ${escapeHtml(getLocationName(activeEquipment.locationId))}</span>
                </div>
                <span class="badge ${activeEquipment.status || "pending"}">${statusLabel(activeEquipment.status || "pending")}</span>
              </div>
              <div class="media-toolbar">
                ${renderMediaCategoryFilter(media)}
              </div>
              <div class="media-upload-card" data-media-drop-zone="${activeEquipment.id}">
                <div class="media-upload-copy">
                  <p class="eyebrow">Upload Center</p>
                  <strong>Drop drawings, photos, PDFs or documents here</strong>
                  <span>Release files to review type, title and comments before saving.</span>
                </div>
                <div class="media-upload-actions">
                  <label class="file-button">Choose Files
                    <input data-media-file-picker="${activeEquipment.id}" type="file" accept="image/*,.pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx" multiple />
                  </label>
                  <button class="primary" type="button" data-media-open-upload="${activeEquipment.id}">${t("uploadMedia")}</button>
                </div>
              </div>
              <div class="media-section-title">${t("attachments")} <span>${visibleMedia.length}/${media.length}</span></div>
              <div class="media-grid">
                ${visibleMedia.map(renderMediaCard).join("") || `<div class="empty small">${t("noMedia")}</div>`}
              </div>
              <div class="media-section-title">${t("comments")} <span>${records.filter((record) => record.comments).length}</span></div>
              <div class="media-comment-list">
                ${records.filter((record) => record.comments).map(renderMediaComment).join("") || `<div class="empty small">${t("noRecord")}</div>`}
              </div>
            `
            : `<div class="empty">${t("noEquipment")}</div>`
        }
      </section>
    </section>
  `;
}

function renderMediaEquipmentButton(equipment, activeId) {
  const mediaCount = getEquipmentMedia(equipment.id).length;
  const records = state.data.records.filter((record) => record.equipmentId === equipment.id);
  const commentCount = records.filter((record) => record.comments).length;
  return `
    <button class="media-device ${equipment.id === activeId ? "active" : ""}" data-media-equipment="${equipment.id}">
      <span>
        <strong>${escapeHtml(equipment.name)}</strong>
        <small>${escapeHtml(equipment.type)} &middot; ${escapeHtml(getCompactLocationName(equipment.locationId))}</small>
      </span>
      <em>${mediaCount} ${t("attachments")} / ${commentCount} ${t("comments")}</em>
    </button>
  `;
}

function renderMediaFilters() {
  const projects = state.data.projects;
  const projectId = state.mediaProjectId || "";
  const equipment = state.data.equipment.filter((item) => !projectId || item.projectId === projectId);
  const locationParts = equipment.map((item) => parseLocationParts(getLocationName(item.locationId)));
  const buildings = uniqueSorted(locationParts.map((item) => item.building));
  const floors = uniqueSorted(locationParts.filter((item) => !state.mediaBuilding || item.building === state.mediaBuilding).map((item) => item.floor));
  const rooms = uniqueSorted(
    locationParts
      .filter((item) => !state.mediaBuilding || item.building === state.mediaBuilding)
      .filter((item) => !state.mediaFloor || item.floor === state.mediaFloor)
      .map((item) => item.room)
  );
  return `
    <div class="media-filter-grid">
      <label>${t("project")}
        <select data-media-filter="mediaProjectId">
          <option value="">${t("allNodes")}</option>
          ${projects.map((project) => option(project.id, project.name, projectId)).join("")}
        </select>
      </label>
      <label>${t("building")}
        <select data-media-filter="mediaBuilding">
          <option value="">${t("allNodes")}</option>
          ${buildings.map((item) => option(item, item, state.mediaBuilding)).join("")}
        </select>
      </label>
      <label>${t("floor")}
        <select data-media-filter="mediaFloor">
          <option value="">${t("allNodes")}</option>
          ${floors.map((item) => option(item, item, state.mediaFloor)).join("")}
        </select>
      </label>
      <label>${t("room")}
        <select data-media-filter="mediaRoom">
          <option value="">${t("allNodes")}</option>
          ${rooms.map((item) => option(item, item, state.mediaRoom)).join("")}
        </select>
      </label>
      <label>${t("search")}
        <input data-media-filter="mediaSearch" value="${escapeHtml(state.mediaSearch || "")}" placeholder="Search equipment, type, location, media comments" />
      </label>
    </div>
  `;
}

function renderMediaCategoryFilter(media) {
  const types = ["all", ...getMediaTypes()];
  return `
    <div class="media-category-filter">
      ${types
        .map((type) => {
          const count = type === "all" ? media.length : media.filter((item) => (item.category || "document") === type).length;
          const active = (state.mediaCategoryFilter || "all") === type;
          return `<button type="button" class="${active ? "active" : ""}" data-media-category="${type}">${type === "all" ? t("allNodes") : t(type)} <span>${count}</span></button>`;
        })
        .join("")}
    </div>
  `;
}

function getVisibleMediaForCategory(media) {
  const category = state.mediaCategoryFilter || "all";
  if (category === "all") return media;
  return media.filter((item) => (item.category || "document") === category);
}

function getFilteredMediaEquipment() {
  const search = String(state.mediaSearch || "").trim().toLowerCase();
  return state.data.equipment.filter((item) => {
    if (state.mediaProjectId && item.projectId !== state.mediaProjectId) return false;
    const location = getLocationName(item.locationId);
    const parts = parseLocationParts(location);
    if (state.mediaBuilding && parts.building !== state.mediaBuilding) return false;
    if (state.mediaFloor && parts.floor !== state.mediaFloor) return false;
    if (state.mediaRoom && parts.room !== state.mediaRoom) return false;
    if (!search) return true;
    const mediaText = getEquipmentMedia(item.id).map((media) => `${media.comments || ""} ${media.file?.name || ""} ${media.category || ""}`).join(" ");
    return `${item.name} ${item.type} ${location} ${mediaText}`.toLowerCase().includes(search);
  });
}

function getEquipmentMedia(equipmentId) {
  if (!equipmentId) return [];
  return [...getDemoMedia(), ...(state.data.media || [])].filter((item) => item.equipmentId === equipmentId);
}

function getMediaTypes() {
  return ["drawing", "map", "locationPlan", "wiring", "photo", "document"];
}

function getUploadMediaCategory() {
  const category = state.mediaCategoryFilter || "all";
  return category === "all" ? "drawing" : category;
}

function getDemoMedia() {
  const equipment = state.data.equipment[0];
  if (!equipment) return [];
  return [
    {
      id: "demo-media-drawing",
      equipmentId: equipment.id,
      projectId: equipment.projectId,
      locationId: equipment.locationId,
      category: "drawing",
      comments: "Demo BMS control schematic linked to the selected equipment.",
      createdAt: "2026-06-21T09:00:00.000Z",
      file: createDemoMediaFile("BMS-control-schematic.svg", "System Drawing", "#174f6f")
    },
    {
      id: "demo-media-location",
      equipmentId: equipment.id,
      projectId: equipment.projectId,
      locationId: equipment.locationId,
      category: "locationPlan",
      comments: "Demo location plan showing AHU room and nearby access path.",
      createdAt: "2026-06-21T09:05:00.000Z",
      file: createDemoMediaFile("AHU-room-location-plan.svg", "Location Plan", "#16864b")
    },
    {
      id: "demo-media-wiring",
      equipmentId: equipment.id,
      projectId: equipment.projectId,
      locationId: equipment.locationId,
      category: "wiring",
      comments: "Demo wiring diagram for DDC panel I/O and BACnet/IP link.",
      createdAt: "2026-06-21T09:10:00.000Z",
      file: createDemoMediaFile("DDC-wiring-diagram.svg", "Wiring Diagram", "#b66b00")
    },
    {
      id: "demo-media-photo",
      equipmentId: equipment.id,
      projectId: equipment.projectId,
      locationId: equipment.locationId,
      category: "photo",
      comments: "Demo site photo placeholder for panel front view.",
      createdAt: "2026-06-21T09:15:00.000Z",
      file: createDemoMediaFile("panel-front-photo.svg", "Site Photo", "#4d55b8")
    }
  ];
}

function createDemoMediaFile(name, label, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="#f8fbfa"/><rect x="32" y="32" width="576" height="356" rx="18" fill="white" stroke="${color}" stroke-width="4"/><path d="M82 120h190v70H82zM368 120h190v70H368zM82 250h190v70H82zM368 250h190v70H368z" fill="${color}" opacity=".12" stroke="${color}" stroke-width="2"/><path d="M272 155h96M272 285h96M177 190v60M463 190v60" stroke="${color}" stroke-width="6" stroke-linecap="round"/><text x="54" y="78" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#17212b">${label}</text><text x="54" y="358" font-family="Arial, sans-serif" font-size="18" fill="#60727a">Demo equipment media preview</text></svg>`;
  return {
    name,
    type: "image/svg+xml",
    size: svg.length,
    url: `data:image/svg+xml;base64,${btoa(svg)}`,
    uploadedAt: "2026-06-21T09:00:00.000Z"
  };
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function renderMediaCard(item) {
  const file = item.file || {};
  const hasFile = Boolean(item.file);
  return `
    <article class="media-card">
      <div class="media-thumb">${hasFile ? renderAttachmentThumb(file) : `<span>${t("mediaComments")}</span>`}</div>
      <div>
        <span class="badge">${t(item.category || "document")}</span>
        <strong>${escapeHtml(item.title || file.name || t("attachments"))}</strong>
        <small>${escapeHtml(formatDateTime(item.createdAt) || item.createdAt || "")}</small>
        ${item.reference ? `<small>${escapeHtml(item.reference)}</small>` : ""}
      </div>
      ${item.comments ? `<p>${escapeHtml(item.comments)}</p>` : ""}
    </article>
  `;
}

function renderMediaComment(record) {
  const point = state.data.points.find((item) => item.id === record.pointId);
  return `
    <article class="media-comment">
      <strong>${escapeHtml(point?.name || record.title)}</strong>
      <p>${escapeHtml(record.comments || "")}</p>
      <small>${escapeHtml(record.updatedAt || formatDateTime(record.serverUpdatedAt) || "")}</small>
    </article>
  `;
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
        ${getOpenIssueRecords().map(renderIssueRow).join("")}
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
  const progressTone = getProjectProgressTone(stats);
  return `
    <section class="project-card">
      <div class="project-card-head">
        <div class="project-title-block">
          <p class="eyebrow">${escapeHtml(project.client || "-")}</p>
          <h2>${escapeHtml(project.name)}</h2>
          <span>${t("projectManager")}: <strong>${escapeHtml(project.manager || "-")}</strong></span>
        </div>
        <form data-project-manager="${project.id}" class="manager-popover">
          <button class="manager-edit-button" type="button" title="${t("updateManager")}" aria-label="${t("updateManager")}">&#9998;</button>
          <div class="manager-edit-panel">
            <label>${t("projectManager")}
              <input name="manager" value="${escapeHtml(project.manager || "")}" placeholder="PM / Engineer" />
            </label>
            <button class="ghost compact" type="submit">${t("saveChanges")}</button>
          </div>
        </form>
      </div>
      <div class="stats wide">
        ${statCard(t("equipmentQty"), equipment.length)}
        ${statCard(t("pointCount"), points.length)}
        ${statCard(t("inspectedQty"), stats.passed)}
        ${statCard(t("pending"), stats.pending)}
        ${statCard(t("issueQty"), stats.failed + stats.rectification)}
      </div>
      <div class="project-progress-line ${progressTone}">
        <span>${stats.completion}%</span>
        <div class="mini-progress"><span style="width:${stats.completion}%"></span></div>
      </div>
    </section>
  `;
}

function renderEquipmentSummary(equipment) {
  const records = state.data.records.filter((record) => record.equipmentId === equipment.id);
  const points = state.data.points.filter((point) => point.equipmentId === equipment.id);
  const stats = getStats(records);
  const issueCount = stats.failed + stats.rectification;
  return `
    <button class="dashboard-entity-card ${equipment.status || "pending"} ${state.dashboardEntityId === equipment.id ? "active" : ""}" data-dashboard-equipment="${equipment.id}">
      <div>
        <p class="eyebrow">${escapeHtml(getProjectName(equipment.projectId))}</p>
        <h3>${escapeHtml(equipment.name)}</h3>
        <span>${escapeHtml(equipment.type)} &middot; ${escapeHtml(getCompactLocationName(equipment.locationId))}</span>
      </div>
      <div class="dashboard-entity-meta">
        <strong>${stats.completion}%</strong>
        <span>${points.length} ${t("pointCount")}</span>
        <span>${issueCount} ${t("issueQty")}</span>
      </div>
      <div class="mini-progress"><span style="width:${stats.completion}%"></span></div>
    </button>
  `;
}

function renderPointSummary(point) {
  const equipment = state.data.equipment.find((item) => item.id === point.equipmentId);
  const record = state.data.records.find((item) => item.pointId === point.id);
  const status = record?.status || point.status || "pending";
  return `
    <button class="dashboard-point-row ${status}" data-issue-detail="${record?.id || ""}" ${record ? "" : "disabled"}>
      <span class="dashboard-point-status"><span class="badge ${status}">${statusLabel(status)}</span></span>
      <div>
        <strong>${escapeHtml(point.name)}</strong>
        <small>${escapeHtml(point.type)} / ${escapeHtml(point.reference || "-")}</small>
      </div>
      <em>${escapeHtml(equipment?.name || "-")}</em>
      <small>${escapeHtml(equipment ? getCompactLocationName(equipment.locationId) : "-")}</small>
    </button>
  `;
}

function getProjectProgressTone(stats) {
  if (stats.total === 0 || stats.completion === 0) return "empty";
  if (stats.failed || stats.rectification) return "risk";
  if (stats.completion === 100) return "complete";
  return "active";
}

function renderAttentionList() {
  const records = getDashboardDrilldownRecords().slice(0, 8);
  if (!records.length) return `<div class="empty small">${state.dashboardFilter === "all" ? t("noIssues") : t("noMatchingRecords")}</div>`;
  return records.map(renderAttentionIssueCard).join("");
}

function renderAttentionHeader() {
  const filter = getDashboardFilterMeta(state.dashboardFilter);
  const count = getDashboardDrilldownRecords().length;
  return `
    <div class="attention-head">
      <div>
        <div class="section-title">${t("attentionNow")}</div>
        <p class="muted">${t("filteredBy")}: <strong>${filter.label}</strong> / ${count} ${t("matchingRecords")}</p>
      </div>
      ${state.dashboardFilter === "all" ? "" : `<button class="ghost compact" data-dashboard-filter="all">${t("allAttention")}</button>`}
    </div>
  `;
}

function getDashboardDrilldownRecords() {
  const filter = state.dashboardFilter || "all";
  if (filter === "projects") return getProjectDrilldownRecords();
  if (filter === "equipment") return getEquipmentDrilldownRecords();
  if (filter === "points") return [...state.data.records].sort(compareIssuePriority);
  if (filter === "issues") return getOpenIssueRecords().filter((record) => ["failed", "rectification"].includes(record.status));
  if (filter === "unassigned") return getOpenIssueRecords().filter((record) => !record.assignee);
  if (filter === "overdue") return getOpenIssueRecords().filter(isRecordOverdue);
  return getOpenIssueRecords();
}

function getProjectDrilldownRecords() {
  return state.data.projects
    .flatMap((project) => {
      const records = state.data.records.filter((record) => record.projectId === project.id);
      const open = records.filter((record) => ["failed", "rectification", "pending"].includes(record.status));
      return (open.length ? open : records).sort(compareIssuePriority).slice(0, 3);
    })
    .sort(compareIssuePriority);
}

function getEquipmentDrilldownRecords() {
  if (state.dashboardEntityId) {
    return state.data.records.filter((record) => record.equipmentId === state.dashboardEntityId).sort(compareIssuePriority);
  }
  return state.data.equipment
    .flatMap((equipment) => {
      const records = state.data.records.filter((record) => record.equipmentId === equipment.id);
      const open = records.filter((record) => ["failed", "rectification", "pending"].includes(record.status));
      return (open.length ? open : records).sort(compareIssuePriority).slice(0, 2);
    })
    .sort(compareIssuePriority);
}

function getDashboardFilterMeta(filter) {
  const labels = {
    all: t("allAttention"),
    projects: t("totalProjects"),
    equipment: t("totalEquipment"),
    points: t("totalPoints"),
    issues: t("issueQty"),
    unassigned: t("unassigned"),
    overdue: t("overdue")
  };
  return { label: labels[filter] || labels.all };
}

function isRecordOverdue(record) {
  if (!record.due || ["passed", "closed"].includes(record.status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(record.due);
  return !Number.isNaN(due.getTime()) && due < today;
}

function renderProjectSelectorCard() {
  const activeProjectId = state.adminProjectId || state.selectedProjectId;
  return `
    <section class="project-selector-card">
      <div class="project-selector-head">
        <span>Active Project</span>
        <strong>${state.data.projects.length} ${t("totalProjects")}</strong>
      </div>
      <div class="project-option-grid">
        ${state.data.projects.map((project) => renderProjectOption(project, activeProjectId)).join("")}
      </div>
    </section>
  `;
}

function renderProjectOption(project, activeProjectId) {
  const records = state.data.records.filter((record) => record.projectId === project.id);
  const equipment = state.data.equipment.filter((item) => item.projectId === project.id);
  const stats = getStats(records);
  return `
    <button class="project-option ${project.id === activeProjectId ? "active" : ""}" data-admin-project="${project.id}">
      <span>
        <strong>${escapeHtml(project.name)}</strong>
        <small>${escapeHtml(project.client || project.manager || "-")}</small>
      </span>
      <em>${stats.completion}%</em>
      <small>${equipment.length} ${t("equipment")} / ${stats.failed + stats.rectification} ${t("issueQty")}</small>
    </button>
  `;
}

function renderAdminFilters() {
  const equipmentOptions = getAdminFilteredEquipmentOptions();
  const searchValue = state.adminSearchDraft ?? state.adminSearch ?? "";
  return `
    <div class="admin-filter-row">
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

function renderAdminContextBar() {
  const segments = getAdminContextSegments();
  return `
    <div class="data-context-bar">
      <span>Context</span>
      <strong>${segments.map((segment) => escapeHtml(segment)).join(" / ")}</strong>
    </div>
  `;
}

function renderLocationTree() {
  const projectId = state.adminProjectId || state.selectedProjectId;
  const project = state.data.projects.find((item) => item.id === projectId);
  const tree = buildLocationTree(projectId);
  const projectNode = { type: "project", projectId, label: project?.name || t("allNodes"), children: tree };
  return `
    <div class="tree-view location-tree-view">
      ${renderTreeBranch(projectNode, 0)}
    </div>
  `;
}

function renderTreeBranch(node, level) {
  const children = node.children ? [...node.children.values()].map((child) => renderTreeBranch(child, level + 1)).join("") : "";
  const equipment = node.equipment ? node.equipment.map((item) => renderEquipmentTreeLeaf(item, level + 1)).join("") : "";
  const childContent = `${children}${equipment}`;
  const hasChildren = Boolean(childContent);
  const collapsed = hasChildren && isTreeCollapsed(node);
  return `
    <div class="tree-branch">
      ${renderTreeNode(node, level, hasChildren, collapsed)}
      ${hasChildren && !collapsed ? `<div class="tree-children" style="--level:${level}">${childContent}</div>` : ""}
    </div>
  `;
}

function getAdminTreeWidth() {
  if (state.adminTreeWidthManual && state.adminTreeWidth) return clampTreeWidth(state.adminTreeWidth);
  const projectId = state.adminProjectId || state.selectedProjectId;
  const project = state.data.projects.find((item) => item.id === projectId);
  const tree = buildLocationTree(projectId);
  const projectNode = { type: "project", projectId, label: project?.name || t("allNodes"), children: tree };
  const visibleNodes = collectVisibleTreeNodes(projectNode, 0);
  const estimated = visibleNodes.reduce((width, item) => Math.max(width, estimateTreeNodeWidth(item.node, item.level)), 260);
  return clampTreeWidth(estimated);
}

function collectVisibleTreeNodes(node, level) {
  const nodes = [{ node, level }];
  if (isTreeCollapsed(node)) return nodes;
  if (node.children) {
    [...node.children.values()].forEach((child) => nodes.push(...collectVisibleTreeNodes(child, level + 1)));
  }
  if (node.equipment) {
    node.equipment.forEach((item) =>
      nodes.push({
        node: { type: "equipment", projectId: item.projectId, locationId: item.locationId, equipmentId: item.id, label: item.name },
        level: level + 1
      })
    );
  }
  return nodes;
}

function estimateTreeNodeWidth(node, level) {
  const stats = getTreeNodeStats(node);
  const subtitle = getTreeNodeSubtitle(node, stats);
  const labelWidth = estimateTextWidth(node.label, node.type === "equipment" ? 8.2 : 9);
  const subtitleWidth = subtitle ? estimateTextWidth(subtitle, 6.2) : 0;
  const textWidth = Math.max(labelWidth, subtitleWidth);
  const guideWidth = level * 22;
  const chromeWidth = 96;
  return guideWidth + textWidth + chromeWidth;
}

function estimateTextWidth(text, averageCharWidth) {
  return String(text || "").length * averageCharWidth;
}

function renderEquipmentTreeLeaf(item, level) {
  const node = { type: "equipment", projectId: item.projectId, locationId: item.locationId, equipmentId: item.id, label: item.name };
  return `<div class="tree-branch">${renderTreeNode(node, level, false, false)}</div>`;
}

function renderTreeNode(node, level, hasChildren = false, collapsed = false) {
  const selected = isTreeSelected(node);
  const stats = getTreeNodeStats(node);
  const tone = getTreeNodeTone(stats);
  const subtitle = getTreeNodeSubtitle(node, stats);
  const encoded = encodeTreeNode(node);
  const levelClass = `tree-level-${Math.min(level, 4)}`;
  return `
    <div class="tree-node ${levelClass} ${hasChildren ? "has-children" : ""} ${subtitle ? "has-subtitle" : ""} ${collapsed ? "collapsed" : ""} ${selected ? "active" : ""}" style="--level:${level}" role="button" tabindex="0" data-tree-node="${encoded}" ${hasChildren ? `aria-expanded="${collapsed ? "false" : "true"}"` : ""}>
      <span class="tree-label">
        ${
          hasChildren
            ? `<button class="tree-toggle" type="button" data-tree-toggle="${encoded}" aria-label="${collapsed ? "Expand" : "Collapse"}"><span class="tree-caret">▶</span></button>`
            : `<span class="tree-toggle-spacer"></span>`
        }
        <span class="tree-text">
          <span class="tree-title">${escapeHtml(node.label)}</span>
          ${subtitle ? `<small class="tree-subtitle">${escapeHtml(subtitle)}</small>` : ""}
        </span>
      </span>
      <span class="tree-meta" title="${stats.failed + stats.rectification} ${t("issueQty")} / ${stats.pending} ${t("pending")}">
        <i class="tree-status-dot tree-status-${tone}"></i>
        <small class="tree-count">${stats.passed}/${stats.total}</small>
      </span>
    </div>
  `;
}

function renderDataTable() {
  const tableClasses = ["excel-table"];
  if (isAdminProjectFixed()) tableClasses.push("hide-project");
  if (state.adminTreeSelection || state.adminProjectId) tableClasses.push("compact-location");
  const columns = getAdminTableColumns();
  return `
    <div class="excel-table-wrap">
      ${state.adminColumnWidths ? `<button class="column-auto-width" data-column-auto-width title="Reset table column widths">Auto columns</button>` : ""}
      <div class="${tableClasses.join(" ")}" style="${getAdminColumnStyle()}">
        <div class="excel-row excel-head">
          ${columns.map((column, index) => renderColumnHeader(column, index)).join("")}
        </div>
        ${getAdminRows().map(renderDataRow).join("")}
      </div>
    </div>
  `;
}

function renderColumnHeader(column, index) {
  return `
    <span title="${escapeHtml(column.label)}" data-column-key="${column.key}">
      ${escapeHtml(column.label)}
      ${column.resizable ? `<i class="column-resize-handle" data-column-resize="${index}" title="Resize column"></i>` : ""}
    </span>
  `;
}

function getAdminTableColumns() {
  const hideProject = isAdminProjectFixed();
  const compactLocation = Boolean(state.adminTreeSelection || state.adminProjectId);
  return [
    { key: "project", label: t("project"), auto: hideProject ? "0" : "140px", min: hideProject ? 0 : 120, resizable: !hideProject },
    { key: "equipment", label: `${t("equipmentName")} & Context`, auto: compactLocation ? "300px" : "280px", min: 220, resizable: true },
    { key: "point", label: "Point Name", auto: compactLocation ? "340px" : "310px", min: 240, resizable: true },
    { key: "pointType", label: "Point Type", auto: "104px", min: 88, resizable: true },
    { key: "reference", label: t("reference"), auto: compactLocation ? "180px" : "170px", min: 140, resizable: true },
    { key: "assignee", label: t("assignee"), auto: "96px", min: 84, resizable: true },
    { key: "status", label: t("status"), auto: "132px", min: 118, resizable: true },
    { key: "save", label: "", auto: "68px", min: 64, resizable: false }
  ];
}

function getAdminColumnStyle() {
  return `--admin-grid:${getAdminColumnTemplate(state.adminColumnWidths)}`;
}

function getAdminColumnTemplate(widths) {
  return getAdminTableColumns().map((column) => (column.resizable && widths?.[column.key] ? `${widths[column.key]}px` : column.auto)).join(" ");
}

function resizeAdminColumn(index, width) {
  const column = getAdminTableColumns()[index];
  if (!column || !column.resizable) return;
  const nextWidth = Math.max(column.min, Math.min(640, Math.round(width)));
  setState({ adminColumnWidths: { ...(state.adminColumnWidths || {}), [column.key]: nextWidth } }, false);
}

function renderDataRow(row) {
  return `
    <form class="excel-row" data-row-editor data-record-id="${row.record.id}" data-equipment-id="${row.equipment.id}" data-point-id="${row.point.id}">
      <select name="projectId" title="${escapeHtml(getProjectName(row.equipment.projectId))}">${state.data.projects.map((project) => option(project.id, project.name, row.equipment.projectId)).join("")}</select>
      <div class="equipment-context-cell" title="${escapeHtml(`${row.equipment.name} / ${row.equipment.type} / ${getLocationName(row.equipment.locationId)}`)}">
        <input name="equipmentName" value="${escapeHtml(row.equipment.name)}" />
        <input name="equipmentType" type="hidden" value="${escapeHtml(row.equipment.type)}" />
        <input name="locationId" type="hidden" value="${escapeHtml(row.equipment.locationId)}" />
        <span>${escapeHtml(row.equipment.type)} &middot; ${escapeHtml(getCompactLocationName(row.equipment.locationId))}</span>
      </div>
      <input name="pointName" value="${escapeHtml(row.point.name)}" title="${escapeHtml(row.point.name)}" />
      <input name="pointType" value="${escapeHtml(row.point.type)}" title="${escapeHtml(row.point.type)}" />
      <input name="reference" value="${escapeHtml(row.point.reference || "")}" title="${escapeHtml(row.point.reference || "")}" />
      <input name="assignee" value="${escapeHtml(row.record.assignee || "")}" title="${escapeHtml(row.record.assignee || "")}" />
      ${renderStatusPicker(row.record.status)}
      <button class="ghost" type="submit">${t("saveChanges")}</button>
    </form>
  `;
}

function renderStatusPicker(currentStatus) {
  const statuses = ["pending", "passed", "failed", "rectification", "closed"];
  return `
    <div class="status-picker ${currentStatus}" data-status-picker>
      <input type="hidden" name="status" value="${escapeHtml(currentStatus)}" />
      <button type="button" class="status-picker-button ${currentStatus}" data-status-toggle title="${statusLabel(currentStatus)}">
        <span>${statusLabel(currentStatus)}</span>
        <i>⌄</i>
      </button>
      <div class="status-picker-menu">
        ${statuses.map((status) => `
          <button type="button" class="${status === currentStatus ? "active" : ""}" data-status-choice="${status}">
            <span class="status-dot ${status}"></span>
            <strong>${statusLabel(status)}</strong>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderIssueRow(record) {
  const equipment = state.data.equipment.find((item) => item.id === record.equipmentId);
  const point = state.data.points.find((item) => item.id === record.pointId);
  return `
    <button class="row issue-row-button" data-issue-detail="${record.id}">
      <div>
        <strong>${escapeHtml(record.title)}</strong>
        <span>${escapeHtml(equipment?.name || "")} / ${escapeHtml(point?.name || "")}</span>
      </div>
      <span>${t("ageing")} ${ageInDays(record)} ${t("days")}</span>
      <span>${escapeHtml(record.assignee || "-")}</span>
      <span class="badge ${record.status}">${statusLabel(record.status)}</span>
    </button>
  `;
}

function renderAttentionIssueCard(record) {
  const equipment = state.data.equipment.find((item) => item.id === record.equipmentId);
  const point = state.data.points.find((item) => item.id === record.pointId);
  const location = state.data.locations.find((item) => item.id === record.locationId);
  return `
    <button class="issue-card ${record.status}" data-issue-detail="${record.id}">
      <div class="issue-card-head">
        <span class="badge ${record.status}">${statusLabel(record.status)}</span>
        <strong>${t("ageing")} ${ageInDays(record)} ${t("days")}</strong>
      </div>
      <div>
        <h3>${escapeHtml(record.title)}</h3>
        <p>${escapeHtml(equipment?.name || "")} / ${escapeHtml(point?.name || "")}</p>
      </div>
      <div class="issue-card-meta">
        <span>${t("assignee")}: <strong>${escapeHtml(record.assignee || "-")}</strong></span>
        <span>${t("due")}: <strong>${escapeHtml(record.due || "-")}</strong></span>
        <span>${escapeHtml(location?.name || "")}</span>
      </div>
    </button>
  `;
}

function renderIssueModal() {
  if (!state.selectedIssueId) return "";
  const record = state.data.records.find((item) => item.id === state.selectedIssueId);
  if (!record) return "";
  const project = state.data.projects.find((item) => item.id === record.projectId);
  const location = state.data.locations.find((item) => item.id === record.locationId);
  const equipment = state.data.equipment.find((item) => item.id === record.equipmentId);
  const point = state.data.points.find((item) => item.id === record.pointId);
  const photos = record.photos || [];
  return `
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="${t("issueDetails")}" data-modal>
        <div class="modal-head">
          <div>
            <p class="eyebrow">${t("issueDetails")}</p>
            <h2>${escapeHtml(record.title)}</h2>
          </div>
          <button class="icon-btn" data-close-modal title="${t("close")}">X</button>
        </div>
        <div class="modal-summary">
          <span class="badge ${record.status}">${statusLabel(record.status)}</span>
          <strong>${t("ageing")} ${ageInDays(record)} ${t("days")}</strong>
          <span>${t("due")}: ${escapeHtml(record.due || "-")}</span>
        </div>
        <div class="modal-grid">
          ${modalDetail(t("project"), project?.name)}
          ${modalDetail(t("location"), location?.name)}
          ${modalDetail(t("equipment"), equipment?.name)}
          ${modalDetail(t("point"), point?.name)}
          ${modalDetail(t("issueOwner"), record.assignee || "-")}
          ${modalDetail(t("lastUpdated"), record.updatedAt || formatDateTime(record.serverUpdatedAt) || "-")}
        </div>
        <div class="modal-block">
          <div class="section-title">${t("comments")}</div>
          <p>${escapeHtml(record.comments || "-")}</p>
        </div>
        <div class="modal-block">
          <div class="section-title">${t("attachments")}</div>
          ${
            photos.length
              ? `<div class="modal-photos">${photos.map(renderAttachmentThumb).join("")}</div>`
              : `<div class="empty small">${t("noPhotos")}</div>`
          }
        </div>
        <div class="modal-actions">
          <button class="ghost" data-go-issues>${t("viewIssues")}</button>
          <button class="primary" data-close-modal>${t("close")}</button>
        </div>
      </section>
    </div>
  `;
}

function modalDetail(label, value) {
  return `<div class="modal-detail"><span>${label}</span><strong>${escapeHtml(value || "-")}</strong></div>`;
}

function ageInDays(record) {
  const timestamp = getIssueTimestamp(record);
  if (!timestamp) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(timestamp);
  start.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
}

function getIssueTimestamp(record) {
  if (record.localUpdatedAt) return record.localUpdatedAt;
  if (record.serverUpdatedAt) return record.serverUpdatedAt;
  if (record.updatedAt) {
    const parsed = new Date(record.updatedAt);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  if (record.due) {
    const parsed = new Date(record.due);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  return 0;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("sv-SE");
}

function openIssueDetail(recordId) {
  setState({ selectedIssueId: recordId });
}

function closeIssueDetail() {
  setState({ selectedIssueId: "" });
}

function openFieldAddPointModal() {
  setState({ fieldAddPointOpen: true });
}

function closeFieldAddPointModal() {
  setState({ fieldAddPointOpen: false });
}

function openMediaUploadModal(equipmentId, files = []) {
  pendingMediaUploadFiles = [...files];
  pendingMediaUploadDraft = {};
  setState({ mediaUploadOpen: true, mediaUploadEquipmentId: equipmentId || state.mediaEquipmentId });
}

function closeMediaUploadModal() {
  if (mediaUploadSaving) return;
  pendingMediaUploadFiles = [];
  pendingMediaUploadDraft = {};
  mediaUploadSaving = false;
  setState({ mediaUploadOpen: false, mediaUploadEquipmentId: "" });
}

function goToIssuesPage() {
  setState({ adminPage: "issues", selectedIssueId: "" });
}

function handleModalBackdrop(event) {
  if (event.target !== event.currentTarget) return;
  if (event.currentTarget.dataset.mediaUploadBackdrop !== undefined) {
    closeMediaUploadModal();
    return;
  }
  if (event.currentTarget.dataset.fieldAddPointBackdrop !== undefined) {
    closeFieldAddPointModal();
    return;
  }
  closeIssueDetail();
}

function stopModalClick(event) {
  event.stopPropagation();
}

function handleEscapeKey(event) {
  if (event.key !== "Escape") return;
  if (state.mediaUploadOpen) {
    closeMediaUploadModal();
    return;
  }
  if (state.fieldAddPointOpen) {
    closeFieldAddPointModal();
    return;
  }
  if (state.selectedIssueId) closeIssueDetail();
}

function setAdminPage(page) {
  if (mediaUploadSaving) {
    flash(t("uploadInProgress"));
    return;
  }
  pendingMediaUploadFiles = [];
  pendingMediaUploadDraft = {};
  mediaUploadSaving = false;
  setState({ adminPage: page, selectedIssueId: "", fieldAddPointOpen: false, mediaUploadOpen: false, mediaUploadEquipmentId: "", dashboardFilter: page === "dashboard" ? state.dashboardFilter : "all", dashboardEntityId: page === "dashboard" ? state.dashboardEntityId : "" });
}

function setView(view) {
  if (mediaUploadSaving) {
    flash(t("uploadInProgress"));
    return;
  }
  pendingMediaUploadFiles = [];
  pendingMediaUploadDraft = {};
  mediaUploadSaving = false;
  setState({ view, selectedIssueId: "", fieldAddPointOpen: false, mediaUploadOpen: false, mediaUploadEquipmentId: "" });
}

function setDashboardFilter(filter) {
  setState({ dashboardFilter: filter || "all", dashboardEntityId: "", selectedIssueId: "" });
}

function setDashboardEquipment(equipmentId) {
  setState({ dashboardFilter: "equipment", dashboardEntityId: equipmentId || "", selectedIssueId: "" });
}

function updateMediaFilter(key, value) {
  const patch = { [key]: value };
  if (key === "mediaProjectId") {
    patch.mediaBuilding = "";
    patch.mediaFloor = "";
    patch.mediaRoom = "";
  }
  if (key === "mediaBuilding") {
    patch.mediaFloor = "";
    patch.mediaRoom = "";
  }
  if (key === "mediaFloor") {
    patch.mediaRoom = "";
  }
  const nextState = { ...state, ...patch };
  const nextEquipment = state.data.equipment.find((item) => {
    if (nextState.mediaProjectId && item.projectId !== nextState.mediaProjectId) return false;
    const parts = parseLocationParts(getLocationName(item.locationId));
    if (nextState.mediaBuilding && parts.building !== nextState.mediaBuilding) return false;
    if (nextState.mediaFloor && parts.floor !== nextState.mediaFloor) return false;
    if (nextState.mediaRoom && parts.room !== nextState.mediaRoom) return false;
    return true;
  });
  patch.mediaEquipmentId = nextEquipment?.id || "";
  setState(patch);
}

function bindMediaDropZone(zone) {
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.classList.add("dragging");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragging"));
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("dragging");
    const files = [...event.dataTransfer.files];
    if (files.length) openMediaUploadModal(zone.dataset.mediaDropZone, files);
  });
}

function bindMediaModalDropZone(zone) {
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.classList.add("dragging");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragging"));
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("dragging");
    pendingMediaUploadDraft = readMediaUploadDraft(zone);
    pendingMediaUploadFiles = [...event.dataTransfer.files];
    render();
  });
  zone.querySelector("input")?.addEventListener("change", (event) => {
    pendingMediaUploadDraft = readMediaUploadDraft(zone);
    pendingMediaUploadFiles = [...event.currentTarget.files];
    render();
  });
}

function removePendingMediaFile(fileIndex, sourceElement) {
  pendingMediaUploadDraft = readMediaUploadDraft(sourceElement);
  pendingMediaUploadFiles = pendingMediaUploadFiles.filter((_file, index) => index !== fileIndex);
  render();
}

function readMediaUploadDraft(element) {
  const form = element.closest("[data-media-upload-form]");
  if (!form) return pendingMediaUploadDraft;
  const payload = Object.fromEntries(new FormData(form).entries());
  return {
    category: payload.category || getUploadMediaCategory(),
    title: payload.title || "",
    reference: payload.reference || "",
    comments: payload.comments || ""
  };
}

function compareIssuePriority(a, b) {
  const rank = { failed: 0, rectification: 1, pending: 2 };
  return (rank[a.status] ?? 9) - (rank[b.status] ?? 9) || ageInDays(b) - ageInDays(a);
}

function getOpenIssueRecords() {
  return [...state.data.records].filter((record) => ["failed", "rectification", "pending"].includes(record.status)).sort(compareIssuePriority);
}

function bindIssueDetailEvents() {
  document.querySelectorAll("[data-issue-detail]").forEach((button) => {
    button.addEventListener("click", () => openIssueDetail(button.dataset.issueDetail));
  });
  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeIssueDetail);
  });
  document.querySelector("[data-open-add-point]")?.addEventListener("click", openFieldAddPointModal);
  document.querySelectorAll("[data-close-add-point]").forEach((button) => {
    button.addEventListener("click", closeFieldAddPointModal);
  });
  document.querySelector("[data-go-issues]")?.addEventListener("click", goToIssuesPage);
  document.querySelector("[data-modal]")?.addEventListener("click", stopModalClick);
  document.querySelector("[data-field-add-point-modal]")?.addEventListener("click", stopModalClick);
  document.querySelector("[data-media-upload-modal]")?.addEventListener("click", stopModalClick);
  document.querySelectorAll("[data-close-media-upload]").forEach((button) => {
    button.addEventListener("click", closeMediaUploadModal);
  });
  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", handleModalBackdrop);
  });
  window.removeEventListener("keydown", handleEscapeKey);
  window.addEventListener("keydown", handleEscapeKey);
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
  document.querySelectorAll("[data-admin-page]").forEach((button) => {
    button.addEventListener("click", () => setAdminPage(button.dataset.adminPage));
  });
  document.querySelectorAll("[data-media-equipment]").forEach((button) => {
    button.addEventListener("click", () => setState({ mediaEquipmentId: button.dataset.mediaEquipment }));
  });
  document.querySelectorAll("[data-media-filter]").forEach((field) => {
    field.addEventListener(field.tagName === "INPUT" ? "input" : "change", () => updateMediaFilter(field.dataset.mediaFilter, field.value));
  });
  document.querySelectorAll("[data-media-category]").forEach((button) => {
    button.addEventListener("click", () => setState({ mediaCategoryFilter: button.dataset.mediaCategory || "all" }));
  });
  document.querySelectorAll("[data-media-drop-zone]").forEach(bindMediaDropZone);
  document.querySelectorAll("[data-media-open-upload]").forEach((button) => {
    button.addEventListener("click", () => openMediaUploadModal(button.dataset.mediaOpenUpload, []));
  });
  document.querySelectorAll("[data-media-file-picker]").forEach((input) => {
    input.addEventListener("change", () => openMediaUploadModal(input.dataset.mediaFilePicker, input.files || []));
  });
  document.querySelectorAll("[data-media-modal-drop]").forEach(bindMediaModalDropZone);
  document.querySelectorAll("[data-media-remove-file]").forEach((button) => {
    button.addEventListener("click", () => removePendingMediaFile(Number(button.dataset.mediaRemoveFile), button));
  });
  document.querySelectorAll("[data-media-upload-form]").forEach((form) => {
    form.addEventListener("submit", saveMedia);
  });
  document.querySelectorAll("[data-admin-project]").forEach((button) => {
    button.addEventListener("click", () => selectAdminProject(button.dataset.adminProject));
  });
  document.querySelector("[data-tree-resize]")?.addEventListener("pointerdown", startTreeResize);
  document.querySelector("[data-tree-auto-width]")?.addEventListener("click", () => setState({ adminTreeWidth: null, adminTreeWidthManual: false }));
  document.querySelector("[data-column-auto-width]")?.addEventListener("click", () => setState({ adminColumnWidths: null }));
  document.querySelectorAll("[data-column-resize]").forEach((handle) => {
    handle.addEventListener("pointerdown", startColumnResize);
  });
  document.querySelectorAll("[data-tree-node]").forEach((node) => {
    node.addEventListener("click", () => selectAdminTreeNode(JSON.parse(decodeURIComponent(node.dataset.treeNode))));
    node.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      selectAdminTreeNode(JSON.parse(decodeURIComponent(node.dataset.treeNode)));
    });
  });
  document.querySelectorAll("[data-tree-toggle]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleTreeNode(button.dataset.treeToggle);
    });
  });
  document.querySelectorAll("[data-field-tree-node]").forEach((button) => {
    button.addEventListener("click", () => selectFieldTreeNode(JSON.parse(decodeURIComponent(button.dataset.fieldTreeNode))));
  });
  document.querySelectorAll("[data-field-mobile-choice]").forEach((button) => {
    button.addEventListener("click", () => selectFieldMobileChoice(JSON.parse(decodeURIComponent(button.dataset.fieldMobileChoice))));
  });
  document.querySelectorAll("[data-field-mobile-back]").forEach((button) => {
    button.addEventListener("click", goFieldMobileBack);
  });
  document.querySelectorAll("[data-dashboard-filter]").forEach((button) => {
    button.addEventListener("click", () => setDashboardFilter(button.dataset.dashboardFilter));
  });
  document.querySelectorAll("[data-dashboard-equipment]").forEach((button) => {
    button.addEventListener("click", () => setDashboardEquipment(button.dataset.dashboardEquipment));
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
    button.addEventListener("click", () => updateRecordQuick(button.dataset.record, button.dataset.quickResult, button.dataset.pointId));
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
  bindStatusPickers();
  document.querySelectorAll("[data-field-point-editor]").forEach((form) => {
    form.addEventListener("submit", saveFieldPoint);
  });
  document.querySelector(".inspection-form")?.addEventListener("submit", saveInspection);
  document.querySelector(".attachment-dock")?.addEventListener("submit", saveInspection);
  document.querySelectorAll("[data-editor]").forEach((form) => {
    form.addEventListener("submit", saveAdminEditor);
  });
  bindIssueDetailEvents();
}

function startTreeResize(event) {
  event.preventDefault();
  const startX = event.clientX;
  const startWidth = getAdminTreeWidth();
  const workbench = document.querySelector(".data-workbench");
  let nextWidth = startWidth;
  document.body.classList.add("resizing-tree");
  const move = (moveEvent) => {
    nextWidth = clampTreeWidth(startWidth + moveEvent.clientX - startX);
    workbench?.style.setProperty("--tree-width", `${nextWidth}px`);
  };
  const stop = () => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", stop);
    document.body.classList.remove("resizing-tree");
    setState({ adminTreeWidth: nextWidth, adminTreeWidthManual: true }, false);
  };
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", stop);
}

function startColumnResize(event) {
  event.preventDefault();
  event.stopPropagation();
  const index = Number(event.currentTarget.dataset.columnResize);
  const header = event.currentTarget.closest("[data-column-key]");
  const table = event.currentTarget.closest(".excel-table");
  if (!header || !table || Number.isNaN(index)) return;
  const column = getAdminTableColumns()[index];
  const startX = event.clientX;
  const startWidth = header.getBoundingClientRect().width;
  let nextWidth = startWidth;
  document.body.classList.add("resizing-column");
  const move = (moveEvent) => {
    nextWidth = Math.max(column.min, Math.min(640, Math.round(startWidth + moveEvent.clientX - startX)));
    const widths = { ...(state.adminColumnWidths || {}) };
    widths[column.key] = nextWidth;
    table.style.setProperty("--admin-grid", getAdminColumnTemplate(widths));
  };
  const stop = () => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", stop);
    document.body.classList.remove("resizing-column");
    resizeAdminColumn(index, nextWidth);
  };
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", stop);
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

function selectFieldTreeNode(node) {
  const equipment = getFirstEquipmentForFieldNode(node);
  if (!equipment) {
    setState({ selectedProjectId: node.projectId || state.selectedProjectId });
    return;
  }
  const point = state.data.points.find((item) => item.equipmentId === equipment.id);
  const record = state.data.records.find((item) => item.equipmentId === equipment.id && item.pointId === point?.id);
  setState({
    selectedProjectId: equipment.projectId,
    selectedLocationId: equipment.locationId,
    selectedTeam: equipment.team,
    selectedEquipmentId: equipment.id,
    selectedPointId: point?.id || "",
    selectedRecordId: record?.id || "",
    fieldMobileLevel: "detail",
    fieldMobilePath: getFieldMobilePathForEquipment(equipment)
  });
}

function selectFieldMobileChoice(payload) {
  const currentPath = state.fieldMobilePath || {};
  if (payload.level === "equipment") {
    selectFieldTreeNode({ type: "equipment", equipmentId: payload.equipmentId });
    return;
  }

  const levelOrder = ["project", "building", "floor", "room", "team", "equipment"];
  const nextLevel = levelOrder[levelOrder.indexOf(payload.level) + 1] || "equipment";
  setState({
    selectedProjectId: payload.projectId || state.selectedProjectId,
    selectedLocationId: payload.locationId || state.selectedLocationId,
    selectedTeam: payload.team || state.selectedTeam,
    fieldMobileLevel: nextLevel,
    fieldMobilePath: { ...currentPath, ...payload }
  });
}

function goFieldMobileBack() {
  const level = state.fieldMobileLevel || "project";
  const path = { ...(state.fieldMobilePath || {}) };
  if (level === "detail") {
    setState({ fieldMobileLevel: "equipment" });
    return;
  }
  if (level === "equipment") {
    delete path.team;
    setState({ fieldMobileLevel: "team", fieldMobilePath: path });
    return;
  }
  if (level === "team") {
    delete path.locationId;
    delete path.room;
    setState({ fieldMobileLevel: "room", fieldMobilePath: path });
    return;
  }
  if (level === "room") {
    delete path.floor;
    setState({ fieldMobileLevel: "floor", fieldMobilePath: path });
    return;
  }
  if (level === "floor") {
    delete path.building;
    setState({ fieldMobileLevel: "building", fieldMobilePath: path });
    return;
  }
  setState({ fieldMobileLevel: "project", fieldMobilePath: {} });
}

function selectAdminProject(projectId) {
  setState({
    adminProjectId: projectId,
    adminEquipmentId: "",
    adminTreeSelection: null,
    adminSearchDraft: state.adminSearch || ""
  });
}

function clampTreeWidth(width) {
  return Math.max(240, Math.min(520, Math.round(width)));
}

function selectAdminTreeNode(node) {
  const patch = {
    adminTreeSelection: node,
    adminProjectId: node.projectId || state.adminProjectId || state.selectedProjectId,
    adminSearchDraft: state.adminSearch || ""
  };
  patch.adminEquipmentId = node.type === "equipment" ? node.equipmentId : "";
  setState(patch);
}

function toggleTreeNode(encodedNode) {
  const collapsed = new Set(state.collapsedTreeNodes || []);
  if (collapsed.has(encodedNode)) {
    collapsed.delete(encodedNode);
  } else {
    collapsed.add(encodedNode);
  }
  setState({ collapsedTreeNodes: [...collapsed] });
}

function getTreeNodeSubtitle(node, stats) {
  if (node.type !== "equipment") return "";
  const equipment = state.data.equipment.find((item) => item.id === node.equipmentId);
  const location = state.data.locations.find((item) => item.id === equipment?.locationId);
  const parts = parseLocationParts(location?.name || "");
  const place = [parts.floor, parts.room].filter(Boolean).join(" / ");
  return [equipment?.type || "Equipment", place, `${stats.passed}/${stats.total}`].filter(Boolean).join(" · ");
}

function getAdminContextSegments() {
  const projectId = state.adminProjectId || state.selectedProjectId;
  const project = state.data.projects.find((item) => item.id === projectId);
  const selected = state.adminTreeSelection;
  if (!selected) return [project?.name || t("allNodes")];
  const segments = [project?.name || t("allNodes")];
  if (selected.type === "building") segments.push(selected.building);
  if (selected.type === "floor") segments.push(selected.building, selected.floor);
  if (selected.type === "room") segments.push(selected.building, selected.floor, selected.room);
  if (selected.type === "equipment") {
    const equipment = state.data.equipment.find((item) => item.id === selected.equipmentId);
    const location = state.data.locations.find((item) => item.id === equipment?.locationId);
    const parts = parseLocationParts(location?.name || "");
    segments.push(parts.building, parts.floor, parts.room, equipment?.name || selected.label);
  }
  return segments.filter(Boolean);
}

function updateAdminFilter(field) {
  const patch = {};
  if (field.dataset.adminFilter === "project") {
    patch.adminProjectId = field.value;
    patch.adminEquipmentId = "";
    patch.adminTreeSelection = null;
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

function bindStatusPickers() {
  document.querySelectorAll("[data-status-toggle]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const picker = button.closest("[data-status-picker]");
      const isOpen = picker?.classList.contains("open");
      closeStatusPickers();
      if (!isOpen) picker?.classList.add("open");
    });
  });
  document.querySelectorAll("[data-status-choice]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setStatusPickerValue(button.closest("[data-status-picker]"), button.dataset.statusChoice);
    });
  });
  document.addEventListener("click", closeStatusPickers, { once: true });
}

function setStatusPickerValue(picker, status) {
  if (!picker || !status) return;
  const input = picker.querySelector("input[name='status']");
  const button = picker.querySelector("[data-status-toggle]");
  input.value = status;
  picker.className = `status-picker ${status}`;
  button.className = `status-picker-button ${status}`;
  button.title = statusLabel(status);
  button.querySelector("span").textContent = statusLabel(status);
  picker.querySelectorAll("[data-status-choice]").forEach((choice) => {
    choice.classList.toggle("active", choice.dataset.statusChoice === status);
  });
}

function closeStatusPickers() {
  document.querySelectorAll("[data-status-picker].open").forEach((picker) => picker.classList.remove("open"));
}

async function saveInspection(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.dataset.form;
  const files = [...form.camera.files, ...form.attachments.files];
  const attachments = await storeInspectionAttachments(files);
  const records = state.data.records.map((record) => {
    if (record.id !== id) return record;
    const result = form.result?.value || record.result || "Pending";
    const now = new Date();
    return {
      ...record,
      title: form.title?.value || record.title,
      result,
      comments: form.comments?.value || record.comments || "",
      photos: [...(record.photos || []), ...attachments],
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

async function updateRecordQuick(recordId, result, pointId = "") {
  const ensuredRecordId = ensureRecordForPoint(recordId, pointId);
  if (!ensuredRecordId) {
    flash(t("noRecord"));
    return;
  }
  updateRecord(ensuredRecordId, { result, status: statusFromResult(result) });
  await syncRecords(false);
}

function ensureRecordForPoint(recordId, pointId) {
  if (recordId && state.data.records.some((record) => record.id === recordId)) return recordId;
  const point = state.data.points.find((item) => item.id === pointId);
  if (!point) return "";
  const existing = state.data.records.find((record) => record.pointId === point.id);
  if (existing) return existing.id;
  const equipment = state.data.equipment.find((item) => item.id === point.equipmentId);
  if (!equipment) return "";
  const now = new Date();
  const nextRecord = {
    id: createLocalId("r"),
    projectId: equipment.projectId,
    locationId: equipment.locationId,
    team: equipment.team,
    equipmentId: equipment.id,
    pointId: point.id,
    title: `${equipment.name} - ${point.name}`,
    status: point.status || "pending",
    result: "Pending",
    comments: "",
    photos: [],
    assignee: "",
    due: "",
    sync: "pending",
    localUpdatedAt: now.getTime(),
    updatedAt: now.toLocaleString("sv-SE")
  };
  const data = refreshLocalStatuses({ ...state.data, records: [...state.data.records, nextRecord] });
  setState({ data, selectedPointId: point.id, selectedRecordId: nextRecord.id }, false);
  return nextRecord.id;
}

async function updateRecordComment(recordId, comments) {
  if (!recordId || !state.data.records.some((record) => record.id === recordId)) {
    flash(t("noRecord"));
    return;
  }
  updateRecord(recordId, { comments });
  await syncRecords(false);
}

function updateRecord(recordId, patch) {
  if (!recordId || !state.data.records.some((record) => record.id === recordId)) {
    flash(t("noRecord"));
    return false;
  }
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
  return true;
}

async function syncRecords(showToast) {
  const pending = getPendingRecords();
  if (!pending.length) {
    if (showToast) flash(t("synced"));
    return;
  }
  try {
    const uploadResult = await uploadPendingLocalAttachments(pending);
    if (uploadResult.uploadedLocalIds.length) {
      persistUploadedAttachmentRecords(uploadResult.records);
      await deleteLocalAttachments(uploadResult.uploadedLocalIds);
    }
    const response = await apiPost("/sync", { records: uploadResult.records });
    const { conflicts = [], ...serverData } = response;
    const data = mergeLocalPendingRecords(serverData, uploadResult.records, conflicts);
    setState({ data: normalizeSelection(data), conflicts, serverOnline: true });
    if (showToast) flash(conflicts.length ? t("syncConflicts") : t("synced"));
  } catch {
    setState({ serverOnline: false });
    if (showToast) flash(t("serverOffline"));
  }
}

function persistUploadedAttachmentRecords(records) {
  const uploadedById = new Map(records.map((record) => [record.id, record]));
  const nextRecords = state.data.records.map((record) => uploadedById.get(record.id) || record);
  setState({ data: refreshLocalStatuses({ ...state.data, records: nextRecords }) }, false);
}

function getPendingRecords() {
  return state.data.records.filter((record) => record.sync === "pending");
}

function mergeLocalPendingRecords(serverData, pendingRecords, conflicts = []) {
  if (!pendingRecords.length) return serverData;
  const conflictIds = new Set(conflicts.map((item) => item.local?.id).filter(Boolean));
  const records = [...serverData.records];
  for (const pending of pendingRecords) {
    if (!conflictIds.has(pending.id)) continue;
    const localConflict = { ...pending, sync: "pending", hasConflict: true };
    const index = records.findIndex((record) => record.id === pending.id);
    if (index === -1) {
      records.push(localConflict);
    } else {
      records[index] = localConflict;
    }
  }
  return refreshLocalStatuses({ ...serverData, records });
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
    setState({
      selectedEquipmentId: payload.equipmentId,
      selectedPointId: point?.id || state.selectedPointId,
      selectedRecordId: record?.id || state.selectedRecordId,
      fieldAddPointOpen: false,
      toast: t("pointSaved")
    });
    window.setTimeout(() => setState({ toast: "" }), 1800);
  } catch {
    flash(t("serverOffline"));
  }
}

async function saveMedia(event) {
  event.preventDefault();
  if (mediaUploadSaving) return;
  const form = event.currentTarget;
  const equipmentId = form.dataset.mediaUploadForm;
  const payload = Object.fromEntries(new FormData(form).entries());
  pendingMediaUploadDraft = {
    category: payload.category || getUploadMediaCategory(),
    title: payload.title || "",
    reference: payload.reference || "",
    comments: payload.comments || ""
  };
  const files = pendingMediaUploadFiles.length ? pendingMediaUploadFiles : [...(form.mediaFiles?.files || [])];
  if (!files.length && !String(payload.comments || "").trim()) return;
  const totalSize = getTotalFileSize(files);
  if (totalSize > MEDIA_UPLOAD_LIMIT_BYTES) {
    flash(`${t("uploadFailed")}: ${formatFileSize(totalSize)} selected. Please upload less than ${formatFileSize(MEDIA_UPLOAD_LIMIT_BYTES)} at a time.`);
    return;
  }
  try {
    mediaUploadSaving = true;
    render();
    const formData = new FormData();
    formData.append("equipmentId", equipmentId);
    formData.append("category", payload.category || getUploadMediaCategory());
    formData.append("title", payload.title || "");
    formData.append("reference", payload.reference || "");
    formData.append("comments", payload.comments || "");
    files.forEach((file) => formData.append("files", file));
    const response = await apiFormPost("/admin/media-upload", formData);
    setData(response);
    pendingMediaUploadFiles = [];
    pendingMediaUploadDraft = {};
    mediaUploadSaving = false;
    setState({ mediaEquipmentId: equipmentId, mediaUploadOpen: false, mediaUploadEquipmentId: "", toast: t("mediaSaved") });
    window.setTimeout(() => setState({ toast: "" }), 1800);
  } catch (error) {
    mediaUploadSaving = false;
    render();
    console.warn("Media upload failed.", error);
    flash(formatUploadError(error));
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
  if (!response.ok) throw await createApiError(response, path);
  return response.json();
}

async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw await createApiError(response, path);
  return response.json();
}

async function apiFormPost(path, formData) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData
  });
  if (!response.ok) throw await createApiError(response, path);
  return response.json();
}

async function createApiError(response, path) {
  let detail = "";
  try {
    const text = await response.text();
    if (text) {
      try {
        const body = JSON.parse(text);
        detail = body.error || body.message || text;
      } catch {
        detail = text;
      }
    }
  } catch {
    detail = detail || "";
  }
  const error = new Error(detail || `API failed: ${response.status}`);
  error.status = response.status;
  error.path = path;
  error.detail = detail;
  return error;
}

function getFilteredRecords() {
  return state.data.records.filter((record) => record.equipmentId === state.selectedEquipmentId);
}

function getVisibleEquipment() {
  return state.data.equipment.filter((item) => item.locationId === state.selectedLocationId && item.team === state.selectedTeam);
}

function getFirstEquipmentForFieldNode(node) {
  if (node.type === "equipment") return state.data.equipment.find((item) => item.id === node.equipmentId);
  const projectId = node.projectId || state.selectedProjectId;
  return state.data.equipment.find((item) => {
    if (item.projectId !== projectId) return false;
    const location = state.data.locations.find((candidate) => candidate.id === item.locationId);
    const parts = parseLocationParts(location?.name || "");
    if (node.type === "building") return parts.building === node.building;
    if (node.type === "floor") return parts.building === node.building && parts.floor === node.floor;
    if (node.type === "room") return item.locationId === node.locationId;
    return true;
  });
}

function getFieldMobilePathForEquipment(equipment) {
  const location = state.data.locations.find((item) => item.id === equipment.locationId);
  const parts = parseLocationParts(location?.name || "");
  return {
    projectId: equipment.projectId,
    building: parts.building,
    floor: parts.floor,
    room: parts.room,
    locationId: equipment.locationId,
    team: equipment.team
  };
}

function isFieldTreeActive(node) {
  return node.type === "equipment" && node.equipmentId === state.selectedEquipmentId;
}

function isFieldTreePath(node) {
  if (node.type === "equipment") return node.equipmentId === state.selectedEquipmentId;
  const equipment = state.data.equipment.find((item) => item.id === state.selectedEquipmentId);
  if (!equipment) return node.type === "project" && node.projectId === state.selectedProjectId;
  const location = state.data.locations.find((item) => item.id === equipment.locationId);
  const parts = parseLocationParts(location?.name || "");
  if (node.type === "project") return node.projectId === equipment.projectId;
  if (node.type === "building") return node.projectId === equipment.projectId && node.building === parts.building;
  if (node.type === "floor") return node.projectId === equipment.projectId && node.building === parts.building && node.floor === parts.floor;
  if (node.type === "room") return node.locationId === equipment.locationId;
  return false;
}

function getAdminFilteredEquipmentOptions() {
  const projectId = state.adminProjectId || state.selectedProjectId;
  return state.data.equipment.filter((item) => item.projectId === projectId);
}

function getProjectName(projectId) {
  return state.data.projects.find((item) => item.id === projectId)?.name || "";
}

function getLocationName(locationId) {
  return state.data.locations.find((item) => item.id === locationId)?.name || "";
}

function isAdminProjectFixed() {
  return Boolean(state.adminProjectId || state.adminTreeSelection?.projectId);
}

function getCompactLocationName(locationId) {
  const name = getLocationName(locationId);
  const selected = state.adminTreeSelection;
  if (!selected || selected.type === "project" || selected.type === "equipment") {
    const parts = parseLocationParts(name);
    return [parts.floor, parts.room].filter(Boolean).join(" / ") || name;
  }

  const parts = parseLocationParts(name);
  if (selected.type === "building" && parts.building === selected.building) return [parts.floor, parts.room].filter(Boolean).join(" / ") || name;
  if (selected.type === "floor" && parts.building === selected.building && parts.floor === selected.floor) return parts.room || name;
  if (selected.type === "room" && locationId === selected.locationId) return selected.room || parts.room || name;
  return name;
}

function buildLocationTree(projectId) {
  const buildings = new Map();
  const equipment = state.data.equipment.filter((item) => item.projectId === projectId);
  for (const item of equipment) {
    const location = state.data.locations.find((candidate) => candidate.id === item.locationId);
    const parts = parseLocationParts(location?.name || "Unassigned / Unassigned / Unassigned");
    const building = getTreeChild(buildings, parts.building, { type: "building", projectId, building: parts.building, label: parts.building, children: new Map() });
    const floor = getTreeChild(building.children, parts.floor, { type: "floor", projectId, building: parts.building, floor: parts.floor, label: parts.floor, children: new Map() });
    const room = getTreeChild(floor.children, parts.room, { type: "room", projectId, building: parts.building, floor: parts.floor, room: parts.room, locationId: item.locationId, label: parts.room, equipment: [] });
    room.equipment.push(item);
  }
  return buildings;
}

function getTreeChild(map, key, value) {
  if (!map.has(key)) map.set(key, value);
  return map.get(key);
}

function parseLocationParts(name) {
  const parts = String(name).split("/").map((part) => part.trim()).filter(Boolean);
  return {
    building: parts[0] || "Unassigned Building",
    floor: parts[1] || "Unassigned Floor",
    room: parts.slice(2).join(" / ") || "Unassigned Room"
  };
}

function encodeTreeNode(node) {
  const { children, equipment, ...payload } = node;
  return encodeURIComponent(JSON.stringify(payload));
}

function isTreeSelected(node) {
  const selected = state.adminTreeSelection;
  if (!selected) return node.type === "project";
  return encodeTreeNode(selected) === encodeTreeNode(node);
}

function isTreeCollapsed(node) {
  return (state.collapsedTreeNodes || []).includes(encodeTreeNode(node));
}

function getTreeNodeStats(node) {
  const equipmentIds = new Set(getEquipmentForTreeNode(node).map((item) => item.id));
  const records = state.data.records.filter((record) => equipmentIds.has(record.equipmentId));
  return getStats(records);
}

function getEquipmentForTreeNode(node) {
  const projectId = node.projectId || state.adminProjectId || state.selectedProjectId;
  return state.data.equipment.filter((item) => {
    if (item.projectId !== projectId) return false;
    if (node.type === "project") return true;
    if (node.type === "equipment") return item.id === node.equipmentId;
    const location = state.data.locations.find((candidate) => candidate.id === item.locationId);
    const parts = parseLocationParts(location?.name || "");
    if (node.type === "building") return parts.building === node.building;
    if (node.type === "floor") return parts.building === node.building && parts.floor === node.floor;
    if (node.type === "room") return item.locationId === node.locationId;
    return true;
  });
}

function getTreeNodeTone(stats) {
  if (!stats.total) return "empty";
  if (stats.failed || stats.rectification) return "risk";
  if (stats.pending) return "pending";
  return "complete";
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
    .filter((row) => rowMatchesTree(row))
    .filter((row) => !state.adminEquipmentId || row.equipment.id === state.adminEquipmentId)
    .filter((row) => {
      if (!search) return true;
      return [row.equipment.name, row.equipment.type, row.equipment.team, row.point.name, row.point.type, row.point.reference, row.record.assignee]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
}

function rowMatchesTree(row) {
  const selected = state.adminTreeSelection;
  if (!selected || selected.type === "project") return true;
  const location = state.data.locations.find((item) => item.id === row.equipment.locationId);
  const parts = parseLocationParts(location?.name || "");
  if (selected.type === "building") return parts.building === selected.building;
  if (selected.type === "floor") return parts.building === selected.building && parts.floor === selected.floor;
  if (selected.type === "room") return row.equipment.locationId === selected.locationId;
  if (selected.type === "equipment") return row.equipment.id === selected.equipmentId;
  return true;
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

function createLocalId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function renderAttachmentThumb(photo) {
  const src = getAttachmentSrc(photo);
  const name = typeof photo === "object" ? photo.name || "Inspection photo" : "Inspection photo";
  if (src && isImageAttachment(photo)) return `<img src="${escapeHtml(src)}" alt="${escapeHtml(name)}" />`;
  if (src) return `<a class="attachment-chip" href="${escapeHtml(src)}" target="_blank" rel="noreferrer">${escapeHtml(name)}</a>`;
  if (photo?.localId && isImageAttachment(photo)) return `<img data-local-attachment="${escapeHtml(photo.localId)}" alt="${escapeHtml(name)}" />`;
  return `<div class="attachment-chip">${escapeHtml(name)}</div>`;
}

function stripFileExtension(name = "") {
  return String(name).replace(/\.[^/.]+$/, "");
}

function formatFileSize(size = 0) {
  if (!Number.isFinite(size) || size <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`;
}

function getFileIcon(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  if (type.startsWith("image/")) return "IMG";
  if (type.includes("pdf") || name.endsWith(".pdf")) return "PDF";
  if (name.endsWith(".dwg") || name.endsWith(".dxf")) return "CAD";
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "XLS";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "DOC";
  return "FILE";
}

function getAttachmentSrc(photo) {
  if (!photo) return "";
  if (typeof photo === "string") return photo;
  return resolveAttachmentUrl(photo.url) || photo.dataUrl || "";
}

function resolveAttachmentUrl(url) {
  if (!url) return "";
  if (/^(data:|blob:|https?:)/i.test(url)) return url;
  if (!url.startsWith("/uploads/")) return url;
  try {
    return `${new URL(API_BASE, window.location.href).origin}${url}`;
  } catch {
    return url;
  }
}

function isImageAttachment(photo) {
  if (!photo) return false;
  if (typeof photo === "string") return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(photo) || photo.startsWith("data:image/");
  return String(photo.type || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(photo.name || photo.url || "");
}

async function hydrateLocalAttachmentImages() {
  const images = [...document.querySelectorAll("img[data-local-attachment]")];
  if (!images.length) return;
  await Promise.all(
    images.map(async (image) => {
      const attachment = await getLocalAttachment(image.dataset.localAttachment);
      if (attachment?.dataUrl) image.src = attachment.dataUrl;
    })
  );
}

async function storeInspectionAttachments(files) {
  const fileList = [...files];
  if (!fileList.length) return [];
  try {
    const response = await uploadAttachmentFiles(fileList);
    return response.files || [];
  } catch {
    const dataFiles = await filesToDataUrls(fileList);
    const localAttachments = [];
    for (const file of dataFiles) {
      const localId = createLocalAttachmentId();
      try {
        await putLocalAttachment({ ...file, localId, createdAt: Date.now() });
        localAttachments.push({ name: file.name, type: file.type, localId, pendingUpload: true });
      } catch (error) {
        console.warn("Unable to save local attachment.", error);
      }
    }
    return localAttachments;
  }
}

async function uploadPendingLocalAttachments(records) {
  const localIds = [
    ...new Set(
      records
        .flatMap((record) => record.photos || [])
        .map((photo) => photo?.localId)
        .filter(Boolean)
    )
  ];
  if (!localIds.length) return { records, uploadedLocalIds: [] };

  const localFiles = (await Promise.all(localIds.map(getLocalAttachment))).filter(Boolean);
  if (!localFiles.length) return { records, uploadedLocalIds: [] };
  const response = await uploadAttachmentFiles(localFiles);
  const uploaded = response.files || [];
  const replacements = new Map();
  uploaded.forEach((file, index) => {
    replacements.set(localFiles[index].localId, file);
  });

  return {
    records: records.map((record) => ({
      ...record,
      photos: (record.photos || []).map((photo) => (photo?.localId && replacements.has(photo.localId) ? replacements.get(photo.localId) : photo))
    })),
    uploadedLocalIds: [...replacements.keys()]
  };
}

async function uploadAttachmentFiles(files) {
  const formData = new FormData();
  for (const file of files) {
    const uploadFile = file instanceof File || file instanceof Blob
      ? file
      : dataUrlToFile(file.dataUrl, file.name || "attachment", file.type || "application/octet-stream");
    formData.append("files", uploadFile, file.name || "attachment");
  }
  return apiFormPost("/attachments", formData);
}

function dataUrlToFile(dataUrl, name, type) {
  const [header = "", body = ""] = String(dataUrl || "").split(",");
  const mime = header.match(/^data:([^;]+);base64$/)?.[1] || type || "application/octet-stream";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], name, { type: mime });
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

function createLocalAttachmentId() {
  if (crypto.randomUUID) return `att_${crypto.randomUUID()}`;
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function openAttachmentDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ATTACHMENT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(ATTACHMENT_STORE, { keyPath: "localId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withAttachmentStore(mode, callback) {
  const db = await openAttachmentDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ATTACHMENT_STORE, mode);
    const store = transaction.objectStore(ATTACHMENT_STORE);
    const result = callback(store);
    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putLocalAttachment(attachment) {
  await withAttachmentStore("readwrite", (store) => store.put(attachment));
}

async function getLocalAttachment(localId) {
  if (!localId) return null;
  try {
    return await withAttachmentStore("readonly", (store) => idbRequest(store.get(localId)));
  } catch (error) {
    console.warn("Unable to read local attachment.", error);
    return null;
  }
}

async function deleteLocalAttachments(localIds) {
  const ids = localIds.filter(Boolean);
  if (!ids.length) return;
  try {
    await withAttachmentStore("readwrite", (store) => {
      ids.forEach((id) => store.delete(id));
    });
  } catch (error) {
    console.warn("Unable to clear synced local attachments.", error);
  }
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
    Project: pickImportValue(row, ["Project", "項目", "项目"]),
    Location: pickImportValue(row, ["Location", "Area", "位置", "地點", "地点"]),
    Team: pickImportValue(row, ["Team", "Category", "System", "團隊", "团队", "分類", "分类", "系統", "系统"]),
    Equipment: pickImportValue(row, ["Equipment", "Equipment Name", "Name", "Device", "設備", "设备", "設備名稱", "设备名称"]),
    Type: pickImportValue(row, ["Type", "Equipment Type", "類型", "类型", "設備類型", "设备类型"]),
    Point: pickImportValue(row, ["Point", "Point Name", "Sub Device", "點位", "点位", "子設備", "子设备"]),
    "Point Type": pickImportValue(row, ["Point Type", "Signal Type", "點位類型", "点位类型", "信號類型", "信号类型"]),
    Reference: pickImportValue(row, ["Reference", "Expected", "參考值", "参考值", "標準", "标准"]),
    Assignee: pickImportValue(row, ["Assignee", "Owner", "負責人", "负责人"]),
    Due: pickImportValue(row, ["Due", "Target Date", "目標日期", "目标日期"])
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
