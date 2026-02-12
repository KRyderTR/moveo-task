import { api } from "./http";

export type InvestorType = "HODLer" | "Day Trader" | "NFT Collector";
export type ContentKey = "news" | "prices" | "ai" | "meme";

export type Preferences = {
  assets: string[];
  investorType: InvestorType;
  contentTypes: ContentKey[];
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
