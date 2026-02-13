import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import { Preferences } from "../models/Preferences";

const router = Router();

type ContentKey = "news" | "prices" | "ai" | "meme";

function hasContent(contentTypes: unknown, key: ContentKey): boolean {
  return Array.isArray(contentTypes) && contentTypes.includes(key);
}

async function getCoinGeckoPrices(assets: string[]) {
  const ids = (assets.length ? assets : ["bitcoin", "ethereum"]).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
    ids
  )}&vs_currencies=usd&include_24hr_change=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("CoinGecko failed");

  const json: unknown = await res.json();

  // json looks like { bitcoin: { usd: 123, usd_24h_change: 1.2 }, ... }
  if (!json || typeof json !== "object") return { source: "coingecko", items: [] };

  const obj = json as Record<string, { usd?: number; usd_24h_change?: number }>;

  const items = Object.entries(obj).map(([id, v]) => ({
    id,
    usd: typeof v.usd === "number" ? v.usd : null,
    change24h: typeof v.usd_24h_change === "number" ? v.usd_24h_change : null,
  }));

  return { source: "coingecko", items };
}

function getNewsFallback(assets: string[]) {
  const keywords = assets.map((a) => a.toLowerCase());
  const all = [
    { id: "n1", title: "Bitcoin volatility rises ahead of macro events" },
    { id: "n2", title: "Ethereum L2 activity continues to grow" },
    { id: "n3", title: "Solana ecosystem sees new memecoin wave" },
    { id: "n4", title: "Crypto market mixed as traders wait for catalysts" },
  ];

  // simple filter by asset keywords if possible
  const filtered = all.filter((x) => keywords.some((k) => x.title.toLowerCase().includes(k)));
  return { source: "fallback", items: filtered.length ? filtered : all };
}

function getMemeFallback() {
  const memes = [
    { id: "m1", title: "HODL mode activated", url: "" },
    { id: "m2", title: "Bought the top again", url: "" },
    { id: "m3", title: "Day trader life", url: "" },
  ];
  return memes[Math.floor(Math.random() * memes.length)];
}

function getAiFallback(prefs: { investorType: string; assets: string[] }) {
  const assetText = prefs.assets.length ? prefs.assets.join(", ") : "top coins";
  return {
    source: "fallback",
    text: `Daily insight for a ${prefs.investorType} interested in ${assetText}: Stay disciplined with risk management and avoid overreacting to short-term noise.`,
  };
}

function dateKey(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

router.get("/daily", requireAuth, async (req: AuthedRequest, res) => {
  const prefs = await Preferences.findOne({ userId: req.userId }).lean();

  if (!prefs) {
    return res.status(409).json({ message: "NO_PREFERENCES" });
  }

  const contentTypes = prefs.contentTypes as unknown;
  const assets = Array.isArray(prefs.assets) ? prefs.assets : [];
  const investorType = typeof prefs.investorType === "string" ? prefs.investorType : "HODLer";

  // Build sections based on user preferences (keys)
  const includeNews = hasContent(contentTypes, "news");
  const includePrices = hasContent(contentTypes, "prices");
  const includeAi = hasContent(contentTypes, "ai");
  const includeMeme = hasContent(contentTypes, "meme");

  // fetch only what user asked for
  const [pricesResult] = await Promise.allSettled([
    includePrices ? getCoinGeckoPrices(assets) : Promise.resolve(null),
  ]);

  const prices =
    pricesResult.status === "fulfilled" ? pricesResult.value : { source: "fallback", items: [] };

  const news = includeNews ? getNewsFallback(assets) : null;
  const meme = includeMeme ? getMemeFallback() : null;
  const aiInsight = includeAi ? getAiFallback({ investorType, assets }) : null;

  res.json({
    dateKey: dateKey(),
    preferences: {
      assets,
      investorType,
      contentTypes: Array.isArray(contentTypes) ? contentTypes : [],
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
