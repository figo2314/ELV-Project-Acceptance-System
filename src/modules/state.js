export const STORAGE_KEY = "elv-acceptance-offline-v2";
export const ATTACHMENT_DB_NAME = "elv-acceptance-attachments";
export const ATTACHMENT_STORE = "attachments";
export const MEDIA_UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024;
export const SEARCH_DEBOUNCE_MS = 1100;

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