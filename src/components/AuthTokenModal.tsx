import { useState, useEffect } from "react";
import type { SVGProps } from "react";
import { validateJWT, getTokenFromStorage, setTokenInStorage } from "../utils/auth";
import { useTheme } from "../theme/ThemeProvider";

interface AuthTokenModalProps {
  onTokenValid: () => void;
}

export default function AuthTokenModal({ onTokenValid }: AuthTokenModalProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    // Verifica se já existe um token válido
    const existingToken = getTokenFromStorage();
    if (existingToken) {
      const validation = validateJWT(existingToken);
      if (validation.valid) {
        onTokenValid();
      } else {
        setError(validation.error || "Token inválido");
      }
    }
  }, [onTokenValid]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError("Por favor, insira um token");
      return;
    }

    const validation = validateJWT(trimmedToken);
    if (!validation.valid) {
      setError(validation.error || "Token inválido");
      return;
    }

    // Token válido, salva e notifica
    setTokenInStorage(trimmedToken);
    onTokenValid();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                🔐 Autenticação Necessária
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Configure o token JWT para acessar a aplicação
              </p>
            </div>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
              title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="token-input" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Token JWT (x-requester-token)
            </label>
            <textarea
              id="token-input"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setError(null);
              }}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              rows={4}
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100 font-mono ${
                error ? "border-error-500 dark:border-error-500" : "border-slate-200"
              }`}
              aria-invalid={!!error}
              aria-describedby={error ? "token-error" : undefined}
            />
            {error && (
              <p id="token-error" className="mt-2 text-sm text-error-700 dark:text-error-400">
                ⚠️ {error}
              </p>
            )}
          </div>

          {/* Instructions Toggle */}
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-sm text-wine-600 hover:text-wine-700 dark:text-wine-400 dark:hover:text-wine-300 font-medium"
          >
            {showInstructions ? "▼ Ocultar instruções" : "▶ Como obter o token?"}
          </button>

          {showInstructions && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
                Instruções para configurar o token:
              </h3>
              <ol className="space-y-2 text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li>Obtenha um token JWT válido do serviço de autenticação</li>
                <li>Cole o token completo no campo acima</li>
                <li>O token será validado automaticamente</li>
                <li>O token ficará salvo no seu navegador</li>
              </ol>
              <div className="mt-3 rounded-lg border-l-4 border-info-500 bg-info-50 p-3 dark:bg-info-900/20">
                <p className="text-xs text-info-700 dark:text-info-300">
                  <strong>Dica:</strong> Você também pode passar o token via URL usando o parâmetro{" "}
                  <code className="rounded bg-info-100 px-1 py-0.5 dark:bg-info-800">
                    ?x-requester-token=SEU_TOKEN
                  </code>
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-wine-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              Validar e Continuar
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Seus dados de autenticação são armazenados apenas localmente no navegador
          </p>
        </div>
      </div>
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
