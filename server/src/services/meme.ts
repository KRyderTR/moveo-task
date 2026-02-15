import memesFallback from "../data/memes.json";

type MemeItem = { id: string; title: string; url: string };

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isImageUrl(url: string) {
  return /\.(png|jpg|jpeg|gif|webp)$/i.test(url);
}

async function getRedditMemes(): Promise<MemeItem[]> {
  const subreddits = ["cryptomemes", "CryptoCurrencyMemes", "BitcoinMemes"];
  const subreddit = pickRandom(subreddits);

  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "moveo-task/1.0 (by u/anonymous)",
      "Accept": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Reddit HTTP ${res.status}`);

  const json: unknown = await res.json();

  // parse listing
  const children =
    json &&
      typeof json === "object" &&
      "data" in json &&
      (json as any).data &&
      Array.isArray((json as any).data.children)
      ? (json as any).data.children
      : [];

  const items: MemeItem[] = [];

  for (const c of children) {
    const d = c?.data;
    if (!d) continue;

    const directUrl = typeof d.url_overridden_by_dest === "string" ? d.url_overridden_by_dest : "";
    const title = typeof d.title === "string" ? d.title : "Crypto meme";
    const id = typeof d.id === "string" ? `rd_${d.id}` : `rd_${Math.random()}`;

    if (directUrl && isImageUrl(directUrl)) {
      items.push({ id, title, url: directUrl });
    }
  }

  return items;
}

export async function getMeme(params: { mode: "personalized" | "general"; investorType: string }) {
  try {
    const redditItems = await getRedditMemes();
    if (redditItems.length > 0) {
      return {
        source: "reddit",
        mode: params.mode,
        item: pickRandom(redditItems),
      };
    }
  } catch {
    // ignore → fallback
  }

  // fallback → static JSON
  const fallbackList = Array.isArray(memesFallback) ? (memesFallback as any[]) : [];
  const cleaned: MemeItem[] = fallbackList.map((m, idx) => ({
    id: String(m?.id ?? `fb_${idx}`),
    title: String(m?.title ?? "Crypto meme"),
    url: typeof m?.url === "string" ? m.url : "",
  }));

  const item = cleaned.length
    ? pickRandom(cleaned)
    : { id: "fb_0", title: "Crypto meme", url: "" };

  return {
    source: "static_json",
    mode: params.mode,
    item,
  };
}
