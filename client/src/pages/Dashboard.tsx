import { useEffect, useState } from "react";
import { getDailyDashboard } from "../api/dashboard";
import { getDailyVotes, voteSection } from "../api/votes";
import type { SectionKey, VoteValue, DailyVotes } from "../api/votes";

function VoteBar({
  section,
  current,
  onVote,
}: {
  section: SectionKey;
  current?: VoteValue;
  onVote: (section: SectionKey, value: VoteValue) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onVote(section, 1)}
        className={`px-3 py-1 rounded-xl border ${
          current === 1 ? "bg-black text-white" : "bg-white"
        }`}
      >
        👍
      </button>
      <button
        type="button"
        onClick={() => onVote(section, -1)}
        className={`px-3 py-1 rounded-xl border ${
          current === -1 ? "bg-black text-white" : "bg-white"
        }`}
      >
        👎
      </button>
    </div>
  );
}

function getMemeIdFromContext(context: unknown): string | null {
  if (!context || typeof context !== "object") return null;
  const anyCtx = context as Record<string, unknown>;
  return typeof anyCtx.memeId === "string" ? anyCtx.memeId : null;
}

export default function Dashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDailyDashboard>> | null>(null);
  const [votes, setVotes] = useState<DailyVotes>({});
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const [d, v] = await Promise.all([getDailyDashboard(), getDailyVotes()]);
        setData(d);
        setVotes(v.votes ?? {});
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load dashboard";
        setErr(msg);
      }
    })();
  }, []);

  async function onVote(section: SectionKey, value: VoteValue) {
    if (!data) return;

    const context =
      section === "news"
        ? { itemIds: data.sections.news.items.map((x) => x.id) }
        : section === "prices"
        ? { coinIds: data.sections.prices.items.map((x) => x.id) }
        : section === "ai"
        ? { snippet: data.sections.aiInsight.text.slice(0, 120) }
        : { memeId: data.sections.meme.item.id, memeUrl: data.sections.meme.item.url };

    // optimistic update (keep context!)
    setVotes((prev) => ({ ...prev, [section]: { vote: value, context } }));

    try {
      await voteSection({ section, vote: value, context });
    } catch (e) {
      // revert on error
      setVotes((prev) => {
        const copy = { ...prev };
        delete copy[section];
        return copy;
      });

      const msg = e instanceof Error ? e.message : "Failed to vote";
      setErr(msg);
    }
  }

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return <div className="p-6">Loading dashboard...</div>;

  const { sections } = data;

  // ✅ Votes for each section
  const newsCurrent = votes.news?.vote;
  const pricesCurrent = votes.prices?.vote;
  const aiCurrent = votes.ai?.vote;

  // ✅ Meme vote is only "active" if it was for the currently displayed meme
  const memeVote = votes.meme;
  const votedMemeId = getMemeIdFromContext(memeVote?.context);
  const currentMemeId = sections.meme.item.id;
  const memeCurrent = votedMemeId && votedMemeId === currentMemeId ? memeVote?.vote : undefined;

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-bold">Daily Dashboard</h1>
        <div className="text-sm opacity-70">{data.dateKey}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* News */}
        <div className="bg-white rounded-2xl shadow p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Market News</div>
            <VoteBar section="news" current={newsCurrent} onVote={onVote} />
          </div>

          <div className="text-sm opacity-70">
            source: {sections.news.source} • mode: {sections.news.mode}
          </div>

          <ul className="list-disc pl-5">
            {sections.news.items.slice(0, 6).map((n) => (
              <li key={n.id}>{n.title}</li>
            ))}
          </ul>
        </div>

        {/* Prices */}
        <div className="bg-white rounded-2xl shadow p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Coin Prices</div>
            <VoteBar section="prices" current={pricesCurrent} onVote={onVote} />
          </div>

          <div className="text-sm opacity-70">source: {sections.prices.source}</div>

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

        {/* AI */}
        <div className="bg-white rounded-2xl shadow p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">AI Insight of the Day</div>
            <VoteBar section="ai" current={aiCurrent} onVote={onVote} />
          </div>

          <div className="text-sm opacity-70">
            source: {sections.aiInsight.source} • mode: {sections.aiInsight.mode}
          </div>

          <p className="whitespace-pre-wrap">{sections.aiInsight.text}</p>
        </div>

        {/* Meme */}
        <div className="bg-white rounded-2xl shadow p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Fun Crypto Meme</div>
            <VoteBar section="meme" current={memeCurrent} onVote={onVote} />
          </div>

          <div className="text-sm opacity-70">
            source: {sections.meme.source} • mode: {sections.meme.mode}
          </div>

          <div className="text-sm opacity-70">{sections.meme.item.title}</div>

          {sections.meme.item.url ? (
            <img
              src={sections.meme.item.url}
              className="rounded-xl max-h-72 object-contain"
              alt={sections.meme.item.title}
            />
          ) : (
            <div className="border rounded-xl p-6 opacity-70">Meme placeholder</div>
          )}

          {votes.meme?.vote && memeCurrent === undefined && (
            <div className="text-xs opacity-60">
              You voted on a different meme earlier today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
