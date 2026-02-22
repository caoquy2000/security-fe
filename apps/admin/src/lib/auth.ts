import "server-only";
import { cookies } from "next/headers";

const API = process.env.ADMIN_API_BASE_URL!;
const ACCESS_COOKIE = "admin_access_token";

function assertApi() {
  if (!API) throw new Error("Missing ADMIN_API_BASE_URL");
}

// ✅ Next 16: cookies() là async => phải await
export async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value ?? null;
}

export async function setAccessToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearAccessToken() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
}

export async function loginWithBackend(email: string, password: string) {
  assertApi();

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    let msg = "Login failed";
    try {
      const data = await res.json();
      msg = data?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  const data = (await res.json()) as { token: string };
  if (!data?.token) throw new Error("Missing token in response");

  await setAccessToken(data.token);
  return data.token;
}

// (tùy chọn) decode JWT payload để hiển thị
export function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    // Buffer (Node runtime) / atob (Edge/browser)
    const json =
      typeof Buffer !== "undefined"
        ? Buffer.from(payload, "base64").toString("utf8")
        : atob(payload);

    return JSON.parse(json);
  } catch {
    return null;
  }
}