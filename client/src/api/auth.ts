import { api } from "./http";

export type AuthUser = { id: string; name: string; email: string };

export async function signup(body: { name: string; email: string; password: string }) {
  return api<{ token: string; user: AuthUser }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function login(body: { email: string; password: string }) {
  return api<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function me() {
  return api<{ user: AuthUser }>("/auth/me");
}
