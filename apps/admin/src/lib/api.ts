export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, method?: string) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, method: method || 'GET' });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}