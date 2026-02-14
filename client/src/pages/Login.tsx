import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { setToken } from "../api/http";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    try {
      const { token } = await login({ email, password });
      setToken(token);
      nav("/dashboard");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      setErr(msg);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-3"
      >
        <h1 className="text-2xl font-bold">Login</h1>

        <div>
          <p className="pb-0.5">Email</p>
          <input
            className="w-full border border-gray-300 rounded-xl p-2"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <p className="pb-0.5">Password</p>
          <input
            className="w-full border border-gray-300 rounded-xl p-2"
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {err && <div className="text-red-600 text-sm">{err}</div>}

        <button className="w-full bg-black text-white rounded-xl p-2 mt-2 cursor-pointer">
          Continue
        </button>

        <div className="text-sm text-gray-800">
          Don't have an account?{" "}
          <Link className="underline" to="/signup">
            Signup
          </Link>
        </div>
      </form>
    </div>
  );
}
