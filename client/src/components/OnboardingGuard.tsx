import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMyPreferences } from "../api/preferences";
import type { ReactNode } from "react";

export default function OnboardingGuard({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "need" | "ok">("loading");

  useEffect(() => {
    (async () => {
      const { preferences } = await getMyPreferences();
      setState(preferences ? "ok" : "need");
    })().catch(() => setState("need"));
  }, []);

  if (state === "loading") return <div className="p-6">Loading...</div>;
  if (state === "need") return <Navigate to="/onboarding" replace />;
  return children;
}
