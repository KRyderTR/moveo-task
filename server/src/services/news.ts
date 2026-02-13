type NewsItem = { id: string; title: string; url?: string };

function fallbackNews(mode: "personalized" | "general"): { source: string; mode: string; items: NewsItem[] } {
    const items: NewsItem[] = [
        { id: "n1", title: "Bitcoin volatility rises ahead of macro events" },
        { id: "n2", title: "Ethereum L2 activity continues to grow" },
        { id: "n3", title: "Solana ecosystem sees new memecoin wave" },
        { id: "n4", title: "Crypto market mixed as traders wait for catalysts" },
    ];
    return { source: "fallback", mode, items };
}

const ASSET_TO_TICKER: Record<string, string> = {
    bitcoin: "BTC",
    ethereum: "ETH",
    solana: "SOL",
    dogecoin: "DOGE",
};

function toTickers(assets: string[], defaultTickers: string[] = ["BTC", "ETH", "SOL"]): string[] {
    const tickers = assets
        .map((a) => ASSET_TO_TICKER[a.toLowerCase()])
        .filter((t): t is string => typeof t === "string");

    const unique = Array.from(new Set(tickers));
    return unique.length ? unique : defaultTickers;
}

export async function getNews(params: { mode: "personalized" | "general"; assets: string[] }) {
    const token = process.env.CRYPTOPANIC_TOKEN;
    if (!token) return fallbackNews(params.mode);

    try {
        const base = "https://cryptopanic.com/api/developer/v2/posts/";
        const url = new URL(base);

        url.searchParams.set("auth_token", token);
        url.searchParams.set("public", "true");
        url.searchParams.set("regions", "en");
        url.searchParams.set("kind", "news");

        // default assets?
        const tickers = toTickers(params.mode === "personalized" ? params.assets : []);
        url.searchParams.set("currencies", tickers.join(","));

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`CryptoPanic HTTP ${res.status}`);

        const json: unknown = await res.json();

        if (!json || typeof json !== "object" || !("results" in json)) {
            throw new Error("Unexpected CryptoPanic response");
        }

        const results = (json as { results?: any[] }).results ?? [];
        const items: NewsItem[] = results.slice(0, 6).map((r, idx) => ({
            id: String(r?.id ?? `cp_${idx}`),
            title: String(r?.title ?? "Untitled"),
            url: typeof r?.url === "string" ? r.url : undefined,
        }));

        if (!items.length) return fallbackNews(params.mode);

        return { source: "cryptopanic", mode: params.mode, items };
    } catch {
        return fallbackNews(params.mode);
    }
}
