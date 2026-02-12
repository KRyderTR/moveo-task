import { api } from "./http";

export type Preferences = {
  assets: string[];
  investorType: "beginner" | "intermediate" | "advanced";
  contentTypes: string[];
};

export async function getMyPreferences() {
  return api<{ preferences: Preferences | null }>("/preferences/me");
}

export async function saveMyPreferences(prefs: Preferences) {
  return api<{ preferences: Preferences }>("/preferences/me", {
    method: "POST",
    body: JSON.stringify(prefs),
  });
}
