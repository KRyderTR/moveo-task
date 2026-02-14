import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken } from "../api/http";
import { FiUser } from "react-icons/fi";

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
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function logout() {
    clearToken();
    nav("/login", { replace: true });
  }

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative z-20 flex items-end justify-between mb-6 border-b-2 border-b-gray-100 pb-3">
      <div>
        <h1 className="text-3xl font-bold">Daily Dashboard</h1>
        <div className="text-sm opacity-70 mt-1">{dateKey}</div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="text-2xl p-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
          type="button"
        >
          <FiUser />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl p-4 space-y-2 z-50">
            <div className="font-medium">{name}</div>
            <div className="text-xs opacity-60 break-all">{email}</div>

            <div className="border-t border-gray-200 pt-2">
              <button
                onClick={logout}
                className="text-sm text-red-500 font-semibold w-full text-left hover:underline cursor-pointer"
                type="button"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
