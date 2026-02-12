const API_BASE = import.meta.env.VITE_API_BASE as string;

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function clearToken(): void {
  localStorage.removeItem("token");
}

function extractErrorMessage(data: unknown, status: number): string {
  let message = `Request failed (${status})`;

  if (data && typeof data === "object" && "message" in data) {
    const maybe = (data as { message?: unknown }).message;
    if (typeof maybe === "string") message = maybe;
  }

  return message;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, res.status));
  }

  return data as T;
}
