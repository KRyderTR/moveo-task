import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api/auth";
import { setToken } from "../api/http";

export default function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    try {
      const { token } = await signup({ name, email, password });
      setToken(token);
      nav("/onboarding"); // משתמש חדש → onboarding
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Signup failed";
      setErr(msg);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-3">
        <h1 className="text-2xl font-bold">Signup</h1>

        <input
          className="w-full border rounded-xl p-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full border rounded-xl p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border rounded-xl p-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {err && <div className="text-red-600 text-sm">{err}</div>}

        <button className="w-full bg-black text-white rounded-xl p-2">Create account</button>

        <div className="text-sm">
          Have an account? <Link className="underline" to="/login">Login</Link>
        </div>
      </form>
    </div>
  );
}
