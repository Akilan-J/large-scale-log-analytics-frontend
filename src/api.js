export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, options);
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
