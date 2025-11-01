import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { validateJWT, getTokenFromStorage, clearTokenFromStorage } from "../utils/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  tokenError: string | null;
  checkAuth: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = (
  import.meta.env.VITE_FORCE_PROXY === '1' || import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_BASE_URL || 'https://ifp-banners-manager.aws.cluster-01.k8s.movilepay-sandbox.dc-ifood.com')
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  async function checkAuth() {
    console.log('[AuthContext] Verificando autenticação...');

    const token = getTokenFromStorage();
    console.log('[AuthContext] Token local encontrado:', token ? `${token.substring(0, 20)}...` : 'NENHUM');

    // Se existe token local, valida JWT
    if (token) {
      const validation = validateJWT(token);
      console.log('[AuthContext] Validação JWT local:', validation);

      if (validation.valid) {
        console.log('[AuthContext] ✅ Token local válido - acesso permitido');
        setIsAuthenticated(true);
        setTokenError(null);
        setIsChecking(false);
        return;
      } else {
        console.log('[AuthContext] ⚠️ Token local inválido:', validation.error);
      }
    }

    // Se não tem token local ou é inválido, verifica se há token sendo injetado
    // por extensão/interceptor fazendo uma requisição de teste e capturando o header
    console.log('[AuthContext] Verificando se token está sendo injetado por extensão/interceptor...');

    try {
      // Cria um interceptor temporário para capturar o header da requisição
      const originalFetch = window.fetch;
      let capturedToken: string | null = null;

      window.fetch = async function(...args) {
        const [, options] = args;

        // Captura o header se estiver presente
        if (options?.headers) {
          const headers = new Headers(options.headers);
          const tokenFromHeader = headers.get('x-requester-token');
          if (tokenFromHeader) {
            capturedToken = tokenFromHeader;
            console.log('[AuthContext] Token capturado do header da requisição:', tokenFromHeader.substring(0, 20) + '...');
          }
        }

        return originalFetch.apply(this, args);
      };

      // Faz requisição de teste
      const response = await fetch(`${API_BASE_URL}/v1/destination-screens?page=1&size=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Restaura o fetch original
      window.fetch = originalFetch;

      console.log('[AuthContext] Status da requisição de teste:', response.status);

      // Se capturou token do header, valida como JWT
      if (capturedToken) {
        console.log('[AuthContext] Validando token capturado do header...');
        const validation = validateJWT(capturedToken);
        console.log('[AuthContext] Resultado da validação:', validation);

        if (validation.valid) {
          console.log('[AuthContext] ✅ Token do header é um JWT válido - acesso permitido');
          setIsAuthenticated(true);
          setTokenError(null);
        } else {
          console.log('[AuthContext] ❌ Token do header é inválido:', validation.error);
          setIsAuthenticated(false);
          setTokenError(`Token inválido: ${validation.error}`);
        }
      } else if (response.status === 401 || response.status === 403) {
        // Token ausente ou inválido
        console.log('[AuthContext] ❌ Requisição não autorizada (401/403) - token ausente ou inválido');
        setIsAuthenticated(false);
        setTokenError("Token não autorizado. Configure o header x-requester-token com um JWT válido");
      } else if (response.ok) {
        // API retornou 200 mas não conseguimos capturar o token
        // Isso pode significar que:
        // 1. O token está sendo adicionado por proxy/interceptor após o fetch
        // 2. A API não está validando tokens (problema de segurança!)
        console.warn('[AuthContext] ⚠️ ALERTA DE SEGURANÇA: API retornou 200 sem token válido!');
        console.warn('[AuthContext] ⚠️ Isso indica que a API não está validando o header x-requester-token');
        console.warn('[AuthContext] ⚠️ BLOQUEANDO acesso por segurança - configure um token JWT válido');
        setIsAuthenticated(false);
        setTokenError("Configuração de segurança: Token JWT obrigatório no header x-requester-token");
      } else {
        console.log('[AuthContext] ⚠️ Erro na requisição:', response.status);
        setIsAuthenticated(false);
        setTokenError(`Erro ao verificar autenticação: ${response.status}`);
      }
    } catch (error) {
      console.log('[AuthContext] ❌ Erro ao testar requisição:', error);
      console.log('[AuthContext] ❌ BLOQUEANDO acesso - não foi possível validar token');
      setIsAuthenticated(false);
      setTokenError("Erro ao validar autenticação. Configure o token JWT no header x-requester-token");
    }

    setIsChecking(false);
  }

  function logout() {
    clearTokenFromStorage();
    setIsAuthenticated(false);
    setTokenError("Token removido");
  }

  useEffect(() => {
    checkAuth();
  }, []);

  // Verifica o token periodicamente (a cada 5 minutos)
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        checkAuth();
      }, 5 * 60 * 1000); // 5 minutos

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-wine-600 border-t-transparent"></div>
          <p className="text-sm text-slate-600 dark:text-slate-300">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, tokenError, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
