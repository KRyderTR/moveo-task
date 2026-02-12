import { useEffect, useState } from "react";

export default function App() {
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    (async () => {
      const base = import.meta.env.VITE_API_BASE;
      const res = await fetch(`${base}/health`);
      const data = await res.json();
      setMsg(data.ok ? "✅ Connected to backend!" : "❌ Not connected");
    })().catch(() => setMsg("❌ Not connected"));
  }, []);

  return (
    <div style={{ padding: 22 }}>
      <h1>Moveo Task</h1>
      <p>{msg}</p>
    </div>
  );
}
