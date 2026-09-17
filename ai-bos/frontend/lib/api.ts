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
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", token);
  document.cookie = `access_token=${token}; path=/; max-age=604800; SameSite=Lax`;
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
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

export async function getMe(): Promise<User> {
  return apiFetch<User>("/auth/me", { auth: true });
}

// ── Document API ──────────────────────────────────────────

export interface DocumentItem {
  id: string;
  user_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  status: "pending" | "processing" | "completed" | "failed";
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new ApiError(res.status, data.detail ?? `Upload failed with status ${res.status}`);
  }

  return res.json() as Promise<DocumentItem>;
}

export async function getDocuments(): Promise<DocumentItem[]> {
  return apiFetch<DocumentItem[]>("/documents", { auth: true });
}

export async function deleteDocument(id: string): Promise<{ success: boolean; id: string }> {
  return apiFetch<{ success: boolean; id: string }>(`/documents/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

// ── Chat API ──────────────────────────────────────────────

export interface ChatSource {
  filename: string;
  document_id: string;
  chunk_index: number;
  relevance_score: number;
  text_excerpt: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  model: string;
  token_usage: Record<string, number>;
}

export async function askQuestion(
  question: string,
  topK: number = 5
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/chat/ask", {
    method: "POST",
    body: { question, top_k: topK },
    auth: true,
  });
}
