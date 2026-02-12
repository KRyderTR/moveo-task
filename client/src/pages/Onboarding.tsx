import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ContentKey, InvestorType } from "../api/preferences";
import { saveMyPreferences } from "../api/preferences";

const ASSETS = ["bitcoin", "ethereum", "solana", "dogecoin"] as const;

const INVESTOR_TYPES: InvestorType[] = ["HODLer", "Day Trader", "NFT Collector"];

const CONTENT: { key: ContentKey; label: string }[] = [
  { key: "news", label: "Market News" },
  { key: "prices", label: "Coin Prices" },
  { key: "ai", label: "AI Insight" },
  { key: "meme", label: "Fun Meme" },
];

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

export default function Onboarding() {
  const nav = useNavigate();

  const [assets, setAssets] = useState<string[]>(["bitcoin", "ethereum"]);
  const [investorType, setInvestorType] = useState<InvestorType>("HODLer");
  const [contentTypes, setContentTypes] = useState<ContentKey[]>(["news", "prices", "ai", "meme"]);
  const [err, setErr] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setErr("");

    if (assets.length === 0) {
      setErr("Please choose at least 1 asset");
      return;
    }
    if (contentTypes.length === 0) {
      setErr("Please choose at least 1 content type");
      return;
    }

    try {
      setSaving(true);
      await saveMyPreferences({ assets, investorType, contentTypes });
      nav("/dashboard");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save preferences";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Onboarding</h1>
      <p className="opacity-70">Answer a few quick questions so we can personalize your dashboard.</p>

      <div className="bg-white rounded-2xl shadow p-5 space-y-3">
        <div className="font-semibold">What crypto assets are you interested in?</div>
        <div className="flex flex-wrap gap-2">
          {ASSETS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAssets((prev) => toggle(prev, a))}
              className={`px-3 py-1 rounded-full border ${
                assets.includes(a) ? "bg-black text-white" : "bg-white"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 space-y-3">
        <div className="font-semibold">What type of investor are you?</div>
        <select
          className="border rounded-xl p-2"
          value={investorType}
          onChange={(e) => setInvestorType(e.target.value as InvestorType)}
        >
          {INVESTOR_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 space-y-3">
        <div className="font-semibold">What kind of content would you like to see?</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {CONTENT.map((c) => (
            <label key={c.key} className="flex items-center gap-2 border rounded-xl p-3">
              <input
                type="checkbox"
                checked={contentTypes.includes(c.key)}
                onChange={() => setContentTypes((prev) => toggle(prev, c.key))}
              />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <button
        onClick={onSave}
        disabled={saving}
        className="bg-black text-white rounded-xl px-4 py-2 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save & Continue"}
      </button>
    </div>
  );
}
