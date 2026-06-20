const STORAGE_KEY = "elv-acceptance-state-v1";

const dictionary = {
  zh: {
    appName: "ELV 項目驗收系統",
    mobile: "手機端",
    desktop: "電腦端",
    project: "項目",
    location: "地點",
    team: "團隊/分類",
    equipment: "設備",
    inspections: "驗收項",
    dashboard: "總覽",
    people: "人員",
    pending: "待驗收",
    passed: "已通過",
    failed: "不合格",
    rectification: "待整改",
    closed: "已閉環",
    total: "總數",
    completion: "完成率",
    comments: "Comments",
    photos: "照片",
    save: "保存驗收",
    success: "保存成功，已加入同步隊列",
    online: "在線",
    offline: "離線",
    syncReady: "可同步",
    syncPending: "等待同步",
    synced: "已同步",
    search: "搜尋項目、位置、設備",
    rename: "現場名稱",
    result: "結果",
    assignee: "負責人",
    due: "目標日期",
    bilingual: "中 / EN",
    translate: "翻譯",
    allProjects: "所有項目統計",
    personStats: "人員統計",
    openItems: "未閉環問題",
    noRecord: "選擇一個待驗收項目開始",
    editHint: "可按現場實際情況修改名稱、補充備註並上傳照片。",
    syncNow: "立即同步",
    lastUpdated: "最後更新"
  },
  en: {
    appName: "ELV Project Acceptance",
    mobile: "Mobile",
    desktop: "Desktop",
    project: "Project",
    location: "Location",
    team: "Team/Category",
    equipment: "Equipment",
    inspections: "Inspections",
    dashboard: "Overview",
    people: "People",
    pending: "Pending",
    passed: "Passed",
    failed: "Failed",
    rectification: "Rectification",
    closed: "Closed",
    total: "Total",
    completion: "Completion",
    comments: "Comments",
    photos: "Photos",
    save: "Save Inspection",
    success: "Saved and added to sync queue",
    online: "Online",
    offline: "Offline",
    syncReady: "Ready",
    syncPending: "Pending sync",
    synced: "Synced",
    search: "Search projects, locations, equipment",
    rename: "Site Name",
    result: "Result",
    assignee: "Assignee",
    due: "Target Date",
    bilingual: "ZH / EN",
    translate: "Translate",
    allProjects: "All Project Statistics",
    personStats: "Person Statistics",
    openItems: "Open Issues",
    noRecord: "Select a pending inspection to begin",
    editHint: "Adjust the site name, add comments, and attach photos.",
    syncNow: "Sync Now",
    lastUpdated: "Last updated"
  }
};

const sampleState = {
  lang: "zh",
  view: "mobile",
  selectedProjectId: "p1",
  selectedLocationId: "l1",
  selectedTeam: "BMS",
  selectedEquipmentId: "e1",
  selectedRecordId: "r1",
  toast: "",
  records: [
    {
      id: "r1",
      projectId: "p1",
      locationId: "l1",
      team: "BMS",
      equipmentId: "e1",
      title: "DDC Panel 通訊及點位測試",
      titleEn: "DDC panel communication and point test",
      status: "pending",
      result: "Pending",
      comments: "",
      photos: [],
      assignee: "Ken",
      due: "2026-06-28",
      sync: "synced",
      updatedAt: "2026-06-20 09:15"
    },
    {
      id: "r2",
      projectId: "p1",
      locationId: "l1",
      team: "BMS",
      equipmentId: "e2",
      title: "溫度感測器讀數核對",
      titleEn: "Temperature sensor reading verification",
      status: "failed",
      result: "Fail",
      comments: "讀數偏差 2.5°C，需要校準。",
      photos: [],
      assignee: "Ivy",
      due: "2026-06-24",
      sync: "synced",
      updatedAt: "2026-06-19 16:40"
    },
    {
      id: "r3",
      projectId: "p1",
      locationId: "l2",
      team: "HVAC",
      equipmentId: "e3",
      title: "AHU 啟停控制及狀態反饋",
      titleEn: "AHU start/stop control and status feedback",
      status: "passed",
      result: "Pass",
      comments: "測試正常。",
      photos: [],
      assignee: "Ken",
      due: "2026-06-23",
      sync: "synced",
      updatedAt: "2026-06-18 12:05"
    },
    {
      id: "r4",
      projectId: "p2",
      locationId: "l4",
      team: "Metering",
      equipmentId: "e5",
      title: "電錶 Modbus 數據核對",
      titleEn: "Power meter Modbus data verification",
      status: "rectification",
      result: "Fail",
      comments: "地址表與現場不一致。",
      photos: [],
      assignee: "May",
      due: "2026-07-02",
      sync: "synced",
      updatedAt: "2026-06-20 10:20"
    }
  ]
};

const projects = [
  { id: "p1", name: "Harbour Tower BMS 升級", client: "Facility Team" },
  { id: "p2", name: "Central Plant ELV 驗收", client: "Operations" }
];

const locations = [
  { id: "l1", projectId: "p1", name: "Tower A / 12F / AHU Room" },
  { id: "l2", projectId: "p1", name: "Tower A / Roof / Plant Room" },
  { id: "l3", projectId: "p1", name: "Tower B / 3F / Office Zone" },
  { id: "l4", projectId: "p2", name: "Central Plant / LV Room" }
];

const equipment = [
  { id: "e1", locationId: "l1", team: "BMS", name: "DDC-12F-AHU-01", type: "DDC Panel" },
  { id: "e2", locationId: "l1", team: "BMS", name: "TE-12F-RA-03", type: "Temperature Sensor" },
  { id: "e3", locationId: "l2", team: "HVAC", name: "AHU-RF-02", type: "Air Handling Unit" },
  { id: "e4", locationId: "l3", team: "Lighting", name: "LCP-03F-01", type: "Lighting Panel" },
  { id: "e5", locationId: "l4", team: "Metering", name: "PM-LV-01", type: "Power Meter" }
];

let state = loadState();

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(sampleState);
  return { ...structuredClone(sampleState), ...JSON.parse(stored) };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function t(key) {
  return dictionary[state.lang][key] || key;
}

function statusLabel(status) {
  const map = {
    pending: t("pending"),
    passed: t("passed"),
    failed: t("failed"),
    rectification: t("rectification"),
    closed: t("closed")
  };
  return map[status] || status;
}

function getFilteredRecords() {
  return state.records.filter((record) => {
    return (
      record.projectId === state.selectedProjectId &&
      record.locationId === state.selectedLocationId &&
      record.team === state.selectedTeam &&
      record.equipmentId === state.selectedEquipmentId
    );
  });
}

function getStats(records = state.records) {
  const total = records.length;
  const passed = records.filter((record) => record.status === "passed" || record.status === "closed").length;
  const failed = records.filter((record) => record.status === "failed").length;
  const rectification = records.filter((record) => record.status === "rectification").length;
  const pending = records.filter((record) => record.status === "pending").length;
  const completion = total ? Math.round((passed / total) * 100) : 0;
  return { total, passed, failed, rectification, pending, completion };
}

function setState(patch) {
  state = { ...state, ...patch };
  saveState();
  render();
}

function render() {
  const root = document.querySelector("#app");
  root.innerHTML = `
    <main class="shell">
      ${renderTopbar()}
      ${state.view === "mobile" ? renderMobile() : renderDesktop()}
      <div class="toast ${state.toast ? "show" : ""}">${state.toast}</div>
    </main>
  `;
  bindEvents();
}

function renderTopbar() {
  const pendingSync = state.records.filter((record) => record.sync === "pending").length;
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">${navigator.onLine ? t("online") : t("offline")} · ${pendingSync ? `${pendingSync} ${t("syncPending")}` : t("synced")}</p>
        <h1>${t("appName")}</h1>
      </div>
      <div class="actions">
        <button class="icon-btn" data-action="toggle-lang" title="${t("bilingual")}">${state.lang === "zh" ? "中" : "EN"}</button>
        <button class="mode-btn ${state.view === "mobile" ? "active" : ""}" data-view="mobile">${t("mobile")}</button>
        <button class="mode-btn ${state.view === "desktop" ? "active" : ""}" data-view="desktop">${t("desktop")}</button>
      </div>
    </header>
  `;
}

function renderMobile() {
  const selectedRecord = state.records.find((record) => record.id === state.selectedRecordId);
  return `
    <section class="mobile-grid">
      <aside class="panel stack">
        <input class="search" placeholder="${t("search")}" data-action="search" />
        ${renderSelectors()}
        ${renderQuickStats(getFilteredRecords())}
        ${renderRecordList()}
      </aside>
      <section class="panel detail">
        ${selectedRecord ? renderInspectionForm(selectedRecord) : `<div class="empty">${t("noRecord")}</div>`}
      </section>
    </section>
  `;
}

function renderSelectors() {
  const projectLocations = locations.filter((location) => location.projectId === state.selectedProjectId);
  const locationEquipment = equipment.filter((item) => item.locationId === state.selectedLocationId);
  const teams = [...new Set(locationEquipment.map((item) => item.team))];
  const teamEquipment = locationEquipment.filter((item) => item.team === state.selectedTeam);
  return `
    <label>${t("project")}
      <select data-field="selectedProjectId">
        ${projects.map((project) => `<option value="${project.id}" ${project.id === state.selectedProjectId ? "selected" : ""}>${project.name}</option>`).join("")}
      </select>
    </label>
    <label>${t("location")}
      <select data-field="selectedLocationId">
        ${projectLocations.map((location) => `<option value="${location.id}" ${location.id === state.selectedLocationId ? "selected" : ""}>${location.name}</option>`).join("")}
      </select>
    </label>
    <label>${t("team")}
      <select data-field="selectedTeam">
        ${teams.map((team) => `<option value="${team}" ${team === state.selectedTeam ? "selected" : ""}>${team}</option>`).join("")}
      </select>
    </label>
    <label>${t("equipment")}
      <select data-field="selectedEquipmentId">
        ${teamEquipment.map((item) => `<option value="${item.id}" ${item.id === state.selectedEquipmentId ? "selected" : ""}>${item.name} · ${item.type}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderQuickStats(records) {
  const stats = getStats(records);
  return `
    <div class="stats">
      ${statCard(t("completion"), `${stats.completion}%`)}
      ${statCard(t("pending"), stats.pending)}
      ${statCard(t("passed"), stats.passed)}
      ${statCard(t("failed"), stats.failed)}
    </div>
  `;
}

function statCard(label, value) {
  return `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`;
}

function renderRecordList() {
  const records = getFilteredRecords();
  return `
    <div class="list">
      <div class="section-title">${t("inspections")}</div>
      ${records
        .map(
          (record) => `
            <button class="record ${record.id === state.selectedRecordId ? "active" : ""}" data-record="${record.id}">
              <span>${state.lang === "zh" ? record.title : record.titleEn}</span>
              <small class="badge ${record.status}">${statusLabel(record.status)}</small>
            </button>
          `
        )
        .join("") || `<div class="empty small">${t("noRecord")}</div>`}
    </div>
  `;
}

function renderInspectionForm(record) {
  return `
    <form class="inspection-form" data-form="${record.id}">
      <div class="form-head">
        <div>
          <p class="eyebrow">${record.assignee} · ${t("due")} ${record.due}</p>
          <h2>${state.lang === "zh" ? record.title : record.titleEn}</h2>
        </div>
        <span class="badge ${record.status}">${statusLabel(record.status)}</span>
      </div>
      <p class="muted">${t("editHint")}</p>
      <label>${t("rename")}
        <input name="title" value="${escapeHtml(record.title)}" />
      </label>
      <label>${t("result")}
        <select name="result">
          ${["Pending", "Pass", "Fail", "N/A"].map((result) => `<option ${record.result === result ? "selected" : ""}>${result}</option>`).join("")}
        </select>
      </label>
      <label>${t("comments")}
        <textarea name="comments" rows="5">${escapeHtml(record.comments)}</textarea>
      </label>
      <div class="photo-row">
        <label class="file-label">${t("photos")}
          <input name="photos" type="file" accept="image/*" capture="environment" multiple />
        </label>
        <button type="button" class="ghost" data-action="translate">${t("translate")}</button>
      </div>
      <div class="photos">
        ${record.photos.map((photo) => `<img src="${photo}" alt="Inspection photo" />`).join("")}
      </div>
      <button class="primary" type="submit">${t("save")}</button>
    </form>
  `;
}

function renderDesktop() {
  const stats = getStats();
  const people = getPeopleStats();
  return `
    <section class="desktop-grid">
      <section class="panel hero-dashboard">
        <div>
          <p class="eyebrow">${t("dashboard")}</p>
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
      <section class="panel">
        <div class="section-title">${t("openItems")}</div>
        <div class="table">
          ${state.records
            .filter((record) => ["failed", "rectification", "pending"].includes(record.status))
            .map((record) => renderIssueRow(record))
            .join("")}
        </div>
      </section>
      <section class="panel">
        <div class="section-title">${t("personStats")}</div>
        <div class="people">
          ${people.map((person) => `<div><strong>${person.name}</strong><span>${person.done}/${person.total}</span><progress value="${person.done}" max="${person.total}"></progress></div>`).join("")}
        </div>
        <button class="primary sync" data-action="sync">${t("syncNow")}</button>
      </section>
    </section>
  `;
}

function renderIssueRow(record) {
  const project = projects.find((item) => item.id === record.projectId);
  const location = locations.find((item) => item.id === record.locationId);
  return `
    <div class="row">
      <div>
        <strong>${state.lang === "zh" ? record.title : record.titleEn}</strong>
        <span>${project?.name || ""} · ${location?.name || ""}</span>
      </div>
      <span>${record.assignee}</span>
      <span class="badge ${record.status}">${statusLabel(record.status)}</span>
    </div>
  `;
}

function getPeopleStats() {
  return [...new Set(state.records.map((record) => record.assignee))].map((name) => {
    const own = state.records.filter((record) => record.assignee === name);
    const done = own.filter((record) => ["passed", "closed"].includes(record.status)).length;
    return { name, total: own.length, done };
  });
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setState({ view: button.dataset.view }));
  });

  document.querySelector("[data-action='toggle-lang']")?.addEventListener("click", () => {
    setState({ lang: state.lang === "zh" ? "en" : "zh" });
  });

  document.querySelectorAll("[data-field]").forEach((select) => {
    select.addEventListener("change", () => handleSelectorChange(select.dataset.field, select.value));
  });

  document.querySelectorAll("[data-record]").forEach((button) => {
    button.addEventListener("click", () => setState({ selectedRecordId: button.dataset.record }));
  });

  document.querySelector("[data-action='sync']")?.addEventListener("click", syncRecords);
  document.querySelector("[data-action='translate']")?.addEventListener("click", translateComment);

  document.querySelector(".inspection-form")?.addEventListener("submit", saveInspection);
}

function handleSelectorChange(field, value) {
  const patch = { [field]: value };
  if (field === "selectedProjectId") {
    const firstLocation = locations.find((location) => location.projectId === value);
    patch.selectedLocationId = firstLocation?.id || "";
    const firstEquipment = equipment.find((item) => item.locationId === patch.selectedLocationId);
    patch.selectedTeam = firstEquipment?.team || "";
    patch.selectedEquipmentId = firstEquipment?.id || "";
  }
  if (field === "selectedLocationId") {
    const firstEquipment = equipment.find((item) => item.locationId === value);
    patch.selectedTeam = firstEquipment?.team || "";
    patch.selectedEquipmentId = firstEquipment?.id || "";
  }
  if (field === "selectedTeam") {
    const firstEquipment = equipment.find((item) => item.locationId === state.selectedLocationId && item.team === value);
    patch.selectedEquipmentId = firstEquipment?.id || "";
  }
  const nextRecords = state.records.filter((record) => {
    const projectId = patch.selectedProjectId || state.selectedProjectId;
    const locationId = patch.selectedLocationId || state.selectedLocationId;
    const team = patch.selectedTeam || state.selectedTeam;
    const equipmentId = patch.selectedEquipmentId || state.selectedEquipmentId;
    return record.projectId === projectId && record.locationId === locationId && record.team === team && record.equipmentId === equipmentId;
  });
  patch.selectedRecordId = nextRecords[0]?.id || "";
  setState(patch);
}

async function saveInspection(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.dataset.form;
  const photos = await filesToDataUrls(form.photos.files);
  const records = state.records.map((record) => {
    if (record.id !== id) return record;
    const result = form.result.value;
    return {
      ...record,
      title: form.title.value,
      result,
      comments: form.comments.value,
      photos: [...record.photos, ...photos],
      status: result === "Pass" ? "passed" : result === "Fail" ? "failed" : result === "N/A" ? "closed" : "pending",
      sync: "pending",
      updatedAt: new Date().toLocaleString("zh-Hant", { hour12: false })
    };
  });
  setState({ records, toast: t("success") });
  window.setTimeout(() => setState({ toast: "" }), 2200);
}

function translateComment() {
  const textarea = document.querySelector("textarea[name='comments']");
  if (!textarea?.value.trim()) return;
  const glossary = {
    "測試正常。": "Test completed successfully.",
    "需要校準": "Calibration is required.",
    "地址表與現場不一致。": "The address table does not match site conditions."
  };
  textarea.value = glossary[textarea.value.trim()] || `${textarea.value}\n\n[EN draft] ${textarea.value}`;
}

function syncRecords() {
  if (!navigator.onLine) {
    setState({ toast: t("offline") });
    window.setTimeout(() => setState({ toast: "" }), 1800);
    return;
  }
  const records = state.records.map((record) => (record.sync === "pending" ? { ...record, sync: "synced" } : record));
  setState({ records, toast: t("synced") });
  window.setTimeout(() => setState({ toast: "" }), 1800);
}

function filesToDataUrls(files) {
  return Promise.all(
    [...files].map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    )
  );
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

window.addEventListener("online", syncRecords);
window.addEventListener("offline", render);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}

render();
