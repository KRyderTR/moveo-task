import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import { Preferences } from "../models/Preferences";
import { getNews } from "../services/news";
import { getAiInsight } from "../services/ai";

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

/* -------------------- Meme / AI (Fallback for now) -------------------- */

function getMemeFallback(mode: "personalized" | "general", investorType: string) {
  const general = [
    { id: "m1", title: "HODL mode activated", url: "" },
    { id: "m2", title: "Bought the top again", url: "" },
    { id: "m3", title: "Crypto is calm... until it isn’t", url: "" },
  ];

  const dayTrader = [
    { id: "m4", title: "Day trader life: candles everywhere", url: "" },
    { id: "m5", title: "1-minute chart decisions 😅", url: "" },
  ];

  const nft = [
    { id: "m6", title: "NFT collector: screenshotting vibes", url: "" },
    { id: "m7", title: "Floor price watching 24/7", url: "" },
  ];

  let pool = general;
  if (mode === "personalized") {
    if (investorType === "Day Trader") pool = [...dayTrader, ...general];
    if (investorType === "NFT Collector") pool = [...nft, ...general];
    if (investorType === "HODLer") pool = general;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function getAiFallback(mode: "personalized" | "general", prefs: { investorType: string; assets: string[] }) {
  const assetText = prefs.assets.length ? prefs.assets.join(", ") : "top crypto assets";

  if (mode === "general") {
    return {
      source: "fallback",
      mode,
      text:
        "Daily insight: Manage risk, avoid overtrading, and focus on a consistent strategy rather than short-term noise.",
    };
  }

  return {
    source: "fallback",
    mode,
    text: `Daily insight for a ${prefs.investorType} interested in ${assetText}: Define your rules (entries/exits), size positions conservatively, and stick to your plan during volatility.`,
  };
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

  const prefers = (key: ContentKey) => userContentTypes.includes(key);

  const newsMode: "personalized" | "general" = prefers("news") ? "personalized" : "general";
  const pricesAssets = prefers("prices") && userAssets.length > 0 ? userAssets : [...DEFAULT_ASSETS];
  const aiMode: "personalized" | "general" = prefers("ai") ? "personalized" : "general";
  const memeMode: "personalized" | "general" = prefers("meme") ? "personalized" : "general";

  // Prices (real API) — keep dashboard alive even if CoinGecko fails
  const pricesResult = await Promise.allSettled([getCoinGeckoPrices(pricesAssets)]);
  const prices =
    pricesResult[0].status === "fulfilled"
      ? pricesResult[0].value
      : { source: "fallback", items: [] as { id: string; usd: number | null; change24h: number | null }[] };

  // News (CryptoPanic) — always return something, with fallback inside service
  const news = await getNews({ mode: newsMode, assets: userAssets });

  // AI/Meme
  const aiInsight = await getAiInsight({
    mode: aiMode,
    investorType,
    assets: userAssets,
  });
  const meme = getMemeFallback(memeMode, investorType);

  res.json({
    dateKey: dateKey(),
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
