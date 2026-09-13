/**
 * lib/api.ts
 *
 * Thin fetch wrapper for calling the FastAPI backend.
 * Stores the JWT in localStorage and attaches it as a Bearer header
 * on every authenticated request.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

// ── Token helpers ─────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setToken(token: string): void {
  localStorage.setItem("access_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("access_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ── Generic fetch ─────────────────────────────────────────

interface FetchOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  { method = "GET", body, auth = false }: FetchOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: "Something went wrong." }));
    throw new ApiError(res.status, data.detail ?? `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth API ──────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export async function signup(email: string, password: string, fullName: string) {
  const data = await apiFetch<TokenResponse>("/auth/signup", {
    method: "POST",
    body: { email, password, full_name: fullName },
  });
  setToken(data.access_token);
  return data;
}

export async function login(email: string, password: string) {
  const data = await apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  setToken(data.access_token);
  return data;
}

export function logout() {
  clearToken();
}

export async function getMe() {
  return apiFetch("/auth/me", { auth: true });
}
