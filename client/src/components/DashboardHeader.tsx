import { useNavigate } from "react-router-dom";
import { clearToken } from "../api/http";

export default function DashboardHeader({
  dateKey,
  name,
  email,
}: {
  dateKey: string;
  name: string;
  email: string;
}) {
  const nav = useNavigate();

  function logout() {
    clearToken();
    nav("/login", { replace: true });
  }

  return (
    <div className="flex items-end justify-between">
      <div>
        <h1 className="text-3xl font-bold">Daily Dashboard</h1>
        <div className="text-sm opacity-70">{dateKey}</div>
      </div>

      <div className="text-right">
        <div className="font-medium">{name}</div>
        <div className="text-xs opacity-60">{email}</div>
        <button
          onClick={logout}
          className="text-sm text-red-600 hover:underline mt-1"
          type="button"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
