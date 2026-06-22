export const STORAGE_KEY = "elv-acceptance-offline-v2";
export const ATTACHMENT_DB_NAME = "elv-acceptance-attachments";
export const ATTACHMENT_STORE = "attachments";
export const OFFLINE_SYNC_DB_NAME = "elv-offline-sync-core";
export const OFFLINE_SYNC_DB_VERSION = 1;
export const MUTATION_STORE = "pending_mutations";
export const ASSET_STORE = "pending_assets";
export const MEDIA_UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024;
export const SEARCH_DEBOUNCE_MS = 1100;
export const SYNC_RETRY_DELAYS = [5000, 10000];
export const MAX_SYNC_RETRY_DELAY = 60000;

export function loadPersistedState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function savePersistedState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getPendingSyncRecords(data) {
  return Array.isArray(data?.records) ? data.records.filter((record) => record.sync === "pending") : [];
}

export function getSyncQueueCount(data) {
  return getPendingSyncRecords(data).length;
}

export function getNextSyncRetryDelay(attempt = 0) {
  return SYNC_RETRY_DELAYS[Math.min(Math.max(Number(attempt) || 0, 0), SYNC_RETRY_DELAYS.length - 1)];
}

export function createSyncRetryState(attempt = 0, now = Date.now()) {
  const nextAttempt = Math.min((Number(attempt) || 0) + 1, SYNC_RETRY_DELAYS.length);
  const delay = getNextSyncRetryDelay(nextAttempt - 1);
  return {
    syncRetryAttempt: nextAttempt,
    syncRetryAt: now + delay
  };
}

export function clearSyncRetryState() {
  return {
    syncRetryAttempt: 0,
    syncRetryAt: 0
  };
}

export function calculateExponentialBackoffDelay(attempt = 0, random = Math.random) {
  return Math.min(MAX_SYNC_RETRY_DELAY, 1000 * Math.pow(2, Math.max(Number(attempt) || 0, 0))) + random() * 1000;
}

export function createMutationRetryState(mutation = {}, now = Date.now(), random = Math.random) {
  const attempt = (Number(mutation.retryAttempt) || 0) + 1;
  const delay = calculateExponentialBackoffDelay(attempt, random);
  return {
    retryAttempt: attempt,
    retryAt: now + delay,
    lastError: mutation.lastError || ""
  };
}

export function openOfflineSyncDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }
    const request = indexedDB.open(OFFLINE_SYNC_DB_NAME, OFFLINE_SYNC_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MUTATION_STORE)) {
        const store = db.createObjectStore(MUTATION_STORE, { keyPath: "id" });
        store.createIndex("equipmentId", "equipmentId", { unique: false });
        store.createIndex("recordId", "recordId", { unique: false });
        store.createIndex("retryAt", "retryAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        const store = db.createObjectStore(ASSET_STORE, { keyPath: "id" });
        store.createIndex("mutationId", "mutationId", { unique: false });
        store.createIndex("equipmentId", "equipmentId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function withOfflineSyncStore(storeNames, mode, callback) {
  const db = await openOfflineSyncDb();
  const names = Array.isArray(storeNames) ? storeNames : [storeNames];
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(names, mode);
    const stores = Object.fromEntries(names.map((name) => [name, transaction.objectStore(name)]));
    const result = callback(Array.isArray(storeNames) ? stores : stores[names[0]], transaction);
    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error || new Error("Offline sync transaction aborted."));
    };
  });
}

export function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function createOfflineId(prefix = "offline") {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function queuePendingMutation(mutation) {
  const now = Date.now();
  const record = {
    id: mutation.id || createOfflineId("mut"),
    type: mutation.type || "record.update",
    endpoint: mutation.endpoint || "/sync",
    method: mutation.method || "POST",
    payload: mutation.payload || null,
    formFields: mutation.formFields || null,
    recordId: mutation.recordId || mutation.payload?.id || "",
    equipmentId: mutation.equipmentId || mutation.payload?.equipmentId || "",
    assetIds: mutation.assetIds || [],
    retryAttempt: Number(mutation.retryAttempt) || 0,
    retryAt: Number(mutation.retryAt) || 0,
    createdAt: mutation.createdAt || now,
    updatedAt: now,
    lastError: mutation.lastError || ""
  };
  await withOfflineSyncStore(MUTATION_STORE, "readwrite", (store) => store.put(record));
  return record;
}

export async function listPendingMutations() {
  return withOfflineSyncStore(MUTATION_STORE, "readonly", (store) => idbRequest(store.getAll()));
}

export async function getPendingMutation(id) {
  return withOfflineSyncStore(MUTATION_STORE, "readonly", (store) => idbRequest(store.get(id)));
}

export async function updatePendingMutation(id, patch) {
  const mutation = await getPendingMutation(id);
  if (!mutation) return null;
  return queuePendingMutation({ ...mutation, ...patch, updatedAt: Date.now() });
}

export async function deletePendingMutation(id) {
  await withOfflineSyncStore([MUTATION_STORE, ASSET_STORE], "readwrite", ({ pending_mutations: mutations, pending_assets: assets }) => {
    mutations.delete(id);
    const index = assets.index("mutationId");
    const request = index.openCursor(IDBKeyRange.only(id));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      cursor.delete();
      cursor.continue();
    };
  });
}

export async function queuePendingAsset(file, metadata = {}) {
  const id = metadata.id || createOfflineId("asset");
  const blob = file instanceof Blob ? file : new Blob([file], { type: metadata.type || "application/octet-stream" });
  const asset = {
    id,
    mutationId: metadata.mutationId || "",
    equipmentId: metadata.equipmentId || "",
    fieldName: metadata.fieldName || "files",
    name: metadata.name || file?.name || "attachment",
    type: metadata.type || file?.type || blob.type || "application/octet-stream",
    size: Number(metadata.size || file?.size || blob.size || 0),
    blob,
    createdAt: metadata.createdAt || Date.now()
  };
  await withOfflineSyncStore(ASSET_STORE, "readwrite", (store) => store.put(asset));
  return asset;
}

export async function listPendingAssets(mutationId = "") {
  return withOfflineSyncStore(ASSET_STORE, "readonly", (store) => {
    if (!mutationId) return idbRequest(store.getAll());
    return idbRequest(store.index("mutationId").getAll(mutationId));
  });
}

export async function queueFormUploadMutation(endpoint, formData, metadata = {}) {
  const mutationId = metadata.id || createOfflineId("upload");
  const formFields = {};
  const assetIds = [];
  for (const [key, value] of formData.entries()) {
    if (value instanceof File || value instanceof Blob) {
      const asset = await queuePendingAsset(value, {
        mutationId,
        equipmentId: metadata.equipmentId || formData.get("equipmentId") || "",
        fieldName: key,
        name: value.name || "upload",
        type: value.type,
        size: value.size
      });
      assetIds.push(asset.id);
    } else {
      formFields[key] = value;
    }
  }
  return queuePendingMutation({
    id: mutationId,
    type: metadata.type || "form.upload",
    endpoint,
    method: "POST",
    equipmentId: metadata.equipmentId || formFields.equipmentId || "",
    formFields,
    assetIds,
    lastError: metadata.lastError || ""
  });
}

export async function markMutationRetry(mutation, errorMessage = "", now = Date.now(), random = Math.random) {
  return updatePendingMutation(mutation.id, {
    ...createMutationRetryState({ ...mutation, lastError: errorMessage }, now, random),
    lastError: errorMessage
  });
}
