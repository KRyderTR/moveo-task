import { api } from "./http";

export type DashboardResponse = {
  dateKey: string;
  sections: {
    news: { source: string; mode: "personalized" | "general"; items: { id: string; title: string }[] };
    prices: { source: string; items: { id: string; usd: number | null; change24h: number | null }[] };
    aiInsight: { source: string; mode: "personalized" | "general"; text: string };
    meme: { id: string; title: string; url: string };
  };
};

export async function getDailyDashboard() {
  return api<DashboardResponse>("/dashboard/daily");
}
