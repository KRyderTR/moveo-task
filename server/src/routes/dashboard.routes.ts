import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import { Preferences } from "../models/Preferences";
import { getNews } from "../services/news";
import { getAiInsight } from "../services/ai";
import { getMeme } from "../services/meme";
import { DailyDashboardCache } from "../models/DailyDashboardCache";

const router = Router();

type ContentKey = "news" | "prices" | "ai" | "meme";

const DEFAULT_ASSETS = ["bitcoin", "ethereum", "solana"] as const;

/* -------------------- Helpers -------------------- */

function dateKey(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeContentTypes(raw: unknown): ContentKey[] {
  if (!Array.isArray(raw)) return [];
  const allowed: ContentKey[] = ["news", "prices", "ai", "meme"];
  return raw.filter((x): x is ContentKey => allowed.includes(x));
}

function normalizeAssets(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
}

/* -------------------- External Data (Prices) -------------------- */

async function getCoinGeckoPrices(assets: string[]) {
  const ids = (assets.length ? assets : [...DEFAULT_ASSETS]).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
    ids
  )}&vs_currencies=usd&include_24hr_change=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("CoinGecko failed");

  const json: unknown = await res.json();

  if (!json || typeof json !== "object") {
    return {
      source: "coingecko",
      items: [] as { id: string; usd: number | null; change24h: number | null }[],
    };
  }

  const obj = json as Record<string, { usd?: number; usd_24h_change?: number }>;

  const items = Object.entries(obj).map(([id, v]) => ({
    id,
    usd: typeof v.usd === "number" ? v.usd : null,
    change24h: typeof v.usd_24h_change === "number" ? v.usd_24h_change : null,
  }));

  return { source: "coingecko", items };
}

/* -------------------- Route -------------------- */

router.get("/daily", requireAuth, async (req: AuthedRequest, res) => {
  const prefs = await Preferences.findOne({ userId: req.userId }).lean();

  if (!prefs) {
    return res.status(409).json({ message: "NO_PREFERENCES" });
  }

  const userContentTypes = normalizeContentTypes(prefs.contentTypes as unknown);
  const userAssets = normalizeAssets(prefs.assets as unknown);

  const investorType = typeof prefs.investorType === "string" ? prefs.investorType : "HODLer";

  // "Preference affects content quality" (not whether section exists)
  const prefers = (key: ContentKey) => userContentTypes.includes(key);

  const newsMode: "personalized" | "general" = prefers("news") ? "personalized" : "general";
  const pricesAssets = prefers("prices") && userAssets.length > 0 ? userAssets : [...DEFAULT_ASSETS];
  const aiMode: "personalized" | "general" = prefers("ai") ? "personalized" : "general";
  const memeMode: "personalized" | "general" = prefers("meme") ? "personalized" : "general";

  const today = dateKey();

  // ---- Daily cache for: News, Prices, AI ----
  const cached = await DailyDashboardCache.findOne({ userId: req.userId, dateKey: today }).lean();

  let news: any;
  let prices: any;
  let aiInsight: any;

  if (cached) {
    news = cached.news;
    prices = cached.prices;
    aiInsight = cached.aiInsight;
  } else {
    // Prices (CoinGecko) - keep dashboard alive if fails
    const pricesResult = await Promise.allSettled([getCoinGeckoPrices(pricesAssets)]);
    prices =
      pricesResult[0].status === "fulfilled"
        ? pricesResult[0].value
        : { source: "fallback", items: [] as { id: string; usd: number | null; change24h: number | null }[] };

    // News (CryptoPanic with fallback inside service)
    news = await getNews({ mode: newsMode, assets: userAssets });

    // AI (OpenRouter with fallback inside service)
    aiInsight = await getAiInsight({
      mode: aiMode,
      investorType,
      assets: userAssets,
    });

    // Save cache
    await DailyDashboardCache.create({
      userId: req.userId,
      dateKey: today,
      news,
      prices,
      aiInsight,
    });
  }

  // ---- Meme is always dynamic (not cached) ----
  const meme = await getMeme({ mode: memeMode, investorType });

  res.json({
    dateKey: today,
    preferences: {
      assets: userAssets,
      investorType,
      contentTypes: userContentTypes,
    },
    sections: {
      news,
      prices,
      aiInsight,
      meme,
    },
  });
});

export default router;
