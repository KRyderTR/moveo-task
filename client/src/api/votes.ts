import { api } from "./http";

export type SectionKey = "news" | "prices" | "ai" | "meme";
export type VoteValue = 1 | -1;

export type DailyVotes = Partial<Record<SectionKey, { vote: VoteValue; context?: unknown }>>;

export async function getDailyVotes() {
  return api<{ dateKey: string; votes: DailyVotes }>("/votes/daily");
}

export async function voteSection(body: {
  section: SectionKey;
  vote: VoteValue;
  context?: unknown;
}) {
  return api<{ ok: true }>("/votes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
