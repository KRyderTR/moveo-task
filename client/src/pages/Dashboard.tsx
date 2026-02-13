import { useEffect, useState } from "react";
import { getDailyDashboard } from "../api/dashboard";

export default function Dashboard() {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getDailyDashboard>
  > | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const d = await getDailyDashboard();
        setData(d);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load dashboard";
        setErr(msg);
      }
    })();
  }, []);

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return <div className="p-6">Loading dashboard...</div>;

  const { sections } = data;

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-bold">Daily Dashboard</h1>
        <div className="text-sm opacity-70">{data.dateKey}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* News - always */}
        <div className="bg-white rounded-2xl shadow p-5 space-y-2">
          <div className="font-semibold">Market News</div>
          <div className="text-sm opacity-70">
            source: {sections.news.source} • mode: {sections.news.mode}
          </div>
          <ul className="list-disc pl-5">
            {sections.news.items.slice(0, 6).map((n) => (
              <li key={n.id}>{n.title}</li>
            ))}
          </ul>
        </div>

        {/* Prices - always */}
        <div className="bg-white rounded-2xl shadow p-5 space-y-2">
          <div className="font-semibold">Coin Prices</div>
          <div className="text-sm opacity-70">
            source: {sections.prices.source}
          </div>
          <ul className="space-y-1">
            {sections.prices.items.slice(0, 8).map((c) => (
              <li key={c.id} className="flex justify-between">
                <span>{c.id}</span>
                <span>
                  {c.usd === null ? "-" : `$${c.usd}`}
                  {c.change24h === null ? "" : ` (${c.change24h.toFixed(2)}%)`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* AI - always */}
        <div className="bg-white rounded-2xl shadow p-5 space-y-2">
          <div className="font-semibold">AI Insight of the Day</div>
          <div className="text-sm opacity-70">
            source: {sections.aiInsight.source} • mode:{" "}
            {sections.aiInsight.mode}
          </div>
          <p className="whitespace-pre-wrap">{sections.aiInsight.text}</p>
        </div>

        {/* Meme - always */}
        <div className="bg-white rounded-2xl shadow p-5 space-y-2">
          <div className="font-semibold">Fun Crypto Meme</div>
          <div className="text-sm opacity-70">{sections.meme.title}</div>
          {sections.meme.url ? (
            <img
              src={sections.meme.url}
              className="rounded-xl max-h-72 object-contain"
            />
          ) : (
            <div className="border rounded-xl p-6 opacity-70">
              Meme placeholder
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
