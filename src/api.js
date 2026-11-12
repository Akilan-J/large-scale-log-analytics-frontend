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
  if (!res.ok) {
    // status lets a page tell "nothing here yet" (404) apart from a failure.
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export function apiGet(path, params) {
  const query = params
    ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")).toString()
    : "";
  return request(`${path}${query}`);
}

// Authenticated file download (e.g. a CSV export): fetches with the bearer
// token, then saves the response through a temporary object URL.
export async function apiDownload(path, params, filename) {
  const query = params
    ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")).toString()
    : "";
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}${query}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Session expired. Please sign in again.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Download failed: ${res.status}`);
  }
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
// `fields` adds extra form fields (e.g. { source: "openstack" }).
export function apiUpload(path, file, onProgress, fields = {}) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    Object.entries(fields).forEach(([key, value]) => form.append(key, value));

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
