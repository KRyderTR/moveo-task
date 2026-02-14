import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

import { getDailyDashboard } from "../api/dashboard";
import { getDailyVotes, voteSection } from "../api/votes";
import type { SectionKey, VoteValue, DailyVotes } from "../api/votes";

import { me } from "../api/auth";
import type { AuthUser } from "../api/auth";

import DashboardHeader from "../components/DashboardHeader";

import {
  BiLike,
  BiDislike,
  BiSolidLike,
  BiSolidDislike,
} from "react-icons/bi";

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
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onVote(section, 1)}
        className="text-2xl transition hover:scale-110 cursor-pointer"
      >
        {current === 1 ? (
          <BiSolidLike className="text-green-600" />
        ) : (
          <BiLike className="text-gray-600 hover:text-green-600" />
        )}
      </button>

      <button
        type="button"
        onClick={() => onVote(section, -1)}
        className="text-2xl transition hover:scale-110 cursor-pointer"
      >
        {current === -1 ? (
          <BiSolidDislike className="text-red-600" />
        ) : (
          <BiDislike className="text-gray-600 hover:text-red-600" />
        )}
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
  // const nav = useNavigate();

  const [data, setData] = useState<Awaited<
    ReturnType<typeof getDailyDashboard>
  > | null>(null);

  const [votes, setVotes] = useState<DailyVotes>({});
  const [meUser, setMeUser] = useState<AuthUser | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const [d, v, m] = await Promise.all([
          getDailyDashboard(),
          getDailyVotes(),
          me(),
        ]);

        setData(d);
        setVotes(v.votes ?? {});
        setMeUser(m.user);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Failed to load dashboard";
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
        : {
            memeId: data.sections.meme.item.id,
            memeUrl: data.sections.meme.item.url,
          };

    // optimistic update
    setVotes((prev) => ({
      ...prev,
      [section]: { vote: value, context },
    }));

    try {
      await voteSection({ section, vote: value, context });
    } catch (e) {
      setVotes((prev) => {
        const copy = { ...prev };
        delete copy[section];
        return copy;
      });

      const msg =
        e instanceof Error ? e.message : "Failed to vote";
      setErr(msg);
    }
  }

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data || !meUser)
    return <div className="p-6">Loading dashboard...</div>;

  const { sections } = data;

  const newsCurrent = votes.news?.vote;
  const pricesCurrent = votes.prices?.vote;
  const aiCurrent = votes.ai?.vote;

  const memeVote = votes.meme;
  const votedMemeId = getMemeIdFromContext(memeVote?.context);
  const currentMemeId = sections.meme.item.id;
  const memeCurrent =
    votedMemeId && votedMemeId === currentMemeId
      ? memeVote?.vote
      : undefined;

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto space-y-4">
      {/* Header Component */}
      <DashboardHeader
        dateKey={data.dateKey}
        name={meUser.name}
        email={meUser.email}
      />

      <div className="grid md:grid-cols-2 gap-4">
        {/* News */}
        <div className="bg-white rounded-2xl shadow shadow-gray-300 p-5 space-y-2">
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
        <div className="bg-white rounded-2xl shadow shadow-gray-300 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Coin Prices</div>
            <VoteBar
              section="prices"
              current={pricesCurrent}
              onVote={onVote}
            />
          </div>

          <div className="text-sm opacity-70">
            source: {sections.prices.source}
          </div>

          <ul className="space-y-1">
            {sections.prices.items.slice(0, 8).map((c) => (
              <li key={c.id} className="flex justify-between">
                <span>{c.id}</span>
                <span>
                  {c.usd === null ? "-" : `$${c.usd}`}
                  {c.change24h === null
                    ? ""
                    : ` (${c.change24h.toFixed(2)}%)`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* AI */}
        <div className="bg-white rounded-2xl shadow shadow-gray-300 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">AI Insight of the Day</div>
            <VoteBar section="ai" current={aiCurrent} onVote={onVote} />
          </div>

          <div className="text-sm opacity-70">
            source: {sections.aiInsight.source} • mode:{" "}
            {sections.aiInsight.mode}
          </div>

          <p className="whitespace-pre-wrap">
            {sections.aiInsight.text}
          </p>
        </div>

        {/* Meme */}
        <div className="bg-white rounded-2xl shadow shadow-gray-300 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Fun Crypto Meme</div>
            <VoteBar section="meme" current={memeCurrent} onVote={onVote} />
          </div>

          <div className="text-sm opacity-70">
            source: {sections.meme.source} • mode: {sections.meme.mode}
          </div>

          <div className="text-sm opacity-70">
            {sections.meme.item.title}
          </div>

          <div className="flex items-center justify-center pt-2">
            {sections.meme.item.url ? (
              <img
                src={sections.meme.item.url}
                className="rounded-xl max-h-72 object-contain"
                alt={sections.meme.item.title}
              />
            ) : (
              <div className="border rounded-xl p-6 opacity-70">
                Meme placeholder
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
