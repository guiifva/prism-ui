import { useState, useRef, useEffect } from "react";
import type { SVGProps } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../theme/ThemeProvider";
import { getTokenFromStorage } from "../utils/auth";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  exp?: number;
  sub?: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  const token = getTokenFromStorage();
  let userInfo: Partial<JWTPayload> = {};

  if (token) {
    try {
      userInfo = jwtDecode<JWTPayload>(token);
    } catch {}
  }

  const displayName = userInfo.name || userInfo.email || userInfo.sub || "Usuário";
  const expiresAt = userInfo.exp ? new Date(userInfo.exp * 1000) : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    window.location.reload();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        aria-label="Menu do usuário"
        aria-expanded={isOpen}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-wine-600 text-sm font-semibold text-white">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <svg
          className={`h-4 w-4 text-slate-600 transition-transform dark:text-slate-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {/* User Info */}
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {displayName}
            </p>
            {expiresAt && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Expira em: {expiresAt.toLocaleString("pt-BR")}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isDark ? (
                <>
                  <SunIcon className="h-4 w-4" />
                  Tema Claro
                </>
              ) : (
                <>
                  <MoonIcon className="h-4 w-4" />
                  Tema Escuro
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-error-700 transition-colors hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
      <path strokeWidth="1.5" strokeLinecap="round" d="M12 2v2m0 16v2m10-10h-2M4 12H2m17.07 7.07-1.42-1.42M6.34 6.34 4.93 4.93m12.72 0 1.41 1.41M6.35 17.66l-1.42 1.42" />
    </svg>
  );
}

function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z"
      />
    </svg>
  );
}
