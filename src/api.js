// 127.0.0.1, not "localhost": on macOS localhost resolves to IPv6 ::1 first,
// and the Flask dev server binds IPv4, so "localhost" sent the browser to
// ::1:5000 and every request died as an unexplained "Failed to fetch".
// Pinning the loopback address keeps the two on the same stack.
export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

export const TOKEN_KEY = "mg_token";
export const USER_KEY = "mg_user";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

// The token has a 24h TTL, so an open tab will eventually start getting 401s.
// Drop the stale session and return to the login screen rather than leaving
// the dashboard stuck on an error it cannot recover from.
function handleUnauthorized() {
  clearSession();
  window.location.reload();
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Session expired. Please sign in again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export function apiGet(path, params) {
  const query = params
    ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")).toString()
    : "";
  return request(`${path}${query}`);
}

export function apiPost(path, body) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
}

// Multipart upload with progress. fetch() cannot report upload progress, so
// this uses XHR; the auth header and 401 handling match request() above.
export function apiUpload(path, file, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}${path}`);

    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress((e.loaded / e.total) * 100);
    };

    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}

      if (xhr.status === 401) {
        handleUnauthorized();
        reject(new Error("Session expired. Please sign in again."));
      } else if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject(new Error(data.error || `Upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed — could not reach the server."));

    xhr.send(form);
  });
}
