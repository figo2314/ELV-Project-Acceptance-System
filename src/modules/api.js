export const API_BASE =
  window.__ELV_API_BASE__ ||
  import.meta.env?.VITE_API_BASE ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.port === "5188" ||
  window.location.port === "5176" ||
  window.location.port === "5173"
    ? `http://${window.location.hostname}:4177/api`
    : "/api");

let onUnauthorized = null;

export function configureApi(options = {}) {
  onUnauthorized = typeof options.onUnauthorized === "function" ? options.onUnauthorized : null;
}

export async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!response.ok) throw await createApiError(response, path);
  return response.json();
}

export async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
  if (!response.ok) throw await createApiError(response, path);
  return response.json();
}

export async function apiFormPost(path, formData) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData
  });
  if (!response.ok) throw await createApiError(response, path);
  return response.json();
}

export async function createApiError(response, path) {
  let detail = "";
  let body = null;
  try {
    const text = await response.text();
    if (text) {
      try {
        body = JSON.parse(text);
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
  error.body = body;
  if (response.status === 401 && onUnauthorized) onUnauthorized();
  return error;
}
