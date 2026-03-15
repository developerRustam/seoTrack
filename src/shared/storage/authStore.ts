import type { PublicUser } from "../types/auth";

const API_URL = (import.meta.env.VITE_API_URL as string).replace(/\/$/, "");


export type AuthErrorCode =
  | "EMAIL_TAKEN"
  | "INVALID_CREDENTIALS"
  | "VALIDATION"
  | "NO_SESSION"
  | "UNKNOWN";

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type ApiError = {
  error?: string;
  code?: AuthErrorCode;
};

async function parseAuthError(res: Response): Promise<AuthError> {
  try {
    const data = (await res.json()) as ApiError;
    const code = data.code ?? "UNKNOWN";
    const message = data.error ?? "Something went wrong";
    return new AuthError(code, message);
  } catch {
    return new AuthError("UNKNOWN", "Something went wrong");
  }
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await parseAuthError(res);
  return res.json() as Promise<T>;
}

export async function register(email: string, password: string, name: string): Promise<PublicUser> {
  return apiPost<PublicUser>("/auth/register", { email, password, name });
}

export async function login(email: string, password: string): Promise<PublicUser> {
  return apiPost<PublicUser>("/auth/login", { email, password });
}

export async function logout(): Promise<void> {
  await apiPost("/auth/logout");
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw await parseAuthError(res);
  return (await res.json()) as PublicUser;
}
