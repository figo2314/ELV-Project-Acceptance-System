export const STORAGE_KEY = "elv-acceptance-offline-v2";
export const ATTACHMENT_DB_NAME = "elv-acceptance-attachments";
export const ATTACHMENT_STORE = "attachments";
export const MEDIA_UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024;
export const SEARCH_DEBOUNCE_MS = 1100;
export const SYNC_RETRY_DELAYS = [5000, 10000];

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
