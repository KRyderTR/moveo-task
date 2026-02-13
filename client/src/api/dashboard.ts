import { api } from "./http";

export type ContentKey = "news" | "prices" | "ai" | "meme";

export type DashboardResponse = {
  dateKey: string;
  sections: {
    news: null | { source: string; items: { id: string; title: string }[] };
    prices: null | { source: string; items: { id: string; usd: number | null; change24h: number | null }[] };
    aiInsight: null | { source: string; text: string };
    meme: null | { id: string; title: string; url: string };
  };
};

export async function getDailyDashboard() {
  return api<DashboardResponse>("/dashboard/daily");
}
