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
  return Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === "string")
    : [];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* -------------------- External Data (Prices) -------------------- */

type PriceItem = { id: string; usd: number | null; change24h: number | null };
type PricesPayload = { source: "coingecko" | "fallback"; items: PriceItem[] };

function getPricesFallback(assets: string[]): PricesPayload {
  const ids = (assets.length ? assets : [...DEFAULT_ASSETS]).slice(0, 8);
  return {
    source: "fallback",
    items: ids.map((id) => ({ id, usd: null, change24h: null })),
  };
}

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);

  try {
    return await fetch(url, {
      signal: ac.signal,
      headers: {
        // לפעמים עוזר נגד חסימות/התנהגות מוזרה בפרודקשן
        "User-Agent": "moveo-task/1.0",
        Accept: "application/json",
      },
    });
  } finally {
    clearTimeout(t);
  }
}

async function getCoinGeckoPrices(assets: string[]): Promise<PricesPayload> {
  const cleanAssets = (assets.length ? assets : [...DEFAULT_ASSETS]).map((a) =>
    a.toLowerCase().trim()
  );

  const ids = cleanAssets.join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
    ids
  )}&vs_currencies=usd&include_24hr_change=true`;

  // retry 1 פעם עם backoff קטן
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(url, 8000);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(
          "CoinGecko error:",
          res.status,
          text.slice(0, 200)
        );
        throw new Error(`CoinGecko ${res.status}`);
      }

      const json: unknown = await res.json();

      if (!json || typeof json !== "object") {
        return { source: "coingecko", items: [] };
      }

      const obj = json as Record<string, { usd?: number; usd_24h_change?: number }>;

      const items: PriceItem[] = Object.entries(obj).map(([id, v]) => ({
        id,
        usd: typeof v.usd === "number" ? v.usd : null,
        change24h: typeof v.usd_24h_change === "number" ? v.usd_24h_change : null,
      }));

      return { source: "coingecko", items };
    } catch (e) {
      // אם זה attempt ראשון – נחכה קצת וננסה שוב
      if (attempt === 0) {
        await sleep(500);
        continue;
      }
      throw e;
    }
  }

  // לא אמור להגיע לפה
  return { source: "fallback", items: [] };
}

/* -------------------- Route -------------------- */

router.get("/daily", requireAuth, async (req: AuthedRequest, res) => {
  const prefs = await Preferences.findOne({ userId: req.userId }).lean();

  if (!prefs) {
    return res.status(409).json({ message: "NO_PREFERENCES" });
  }

  const userContentTypes = normalizeContentTypes(prefs.contentTypes as unknown);
  const userAssets = normalizeAssets(prefs.assets as unknown);

  const investorType =
    typeof prefs.investorType === "string" ? prefs.investorType : "HODLer";

  const prefers = (key: ContentKey) => userContentTypes.includes(key);

  const newsMode: "personalized" | "general" = prefers("news") ? "personalized" : "general";
  const pricesAssets = prefers("prices") && userAssets.length > 0 ? userAssets : [...DEFAULT_ASSETS];
  const aiMode: "personalized" | "general" = prefers("ai") ? "personalized" : "general";
  const memeMode: "personalized" | "general" = prefers("meme") ? "personalized" : "general";

  const today = dateKey();

  // ---- Daily cache for: News, Prices, AI ----
  const cached = await DailyDashboardCache.findOne({ userId: req.userId, dateKey: today }).lean();

  let news: any;
  let prices: PricesPayload;
  let aiInsight: any;

  if (cached) {
    news = cached.news;
    prices = cached.prices as PricesPayload;
    aiInsight = cached.aiInsight;
  } else {
    // Prices (CoinGecko) — keep dashboard alive if fails + better fallback
    const pricesResult = await Promise.allSettled([getCoinGeckoPrices(pricesAssets)]);
    prices =
      pricesResult[0].status === "fulfilled"
        ? pricesResult[0].value
        : getPricesFallback(pricesAssets);

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
