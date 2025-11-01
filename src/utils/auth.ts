import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  exp?: number;
  iat?: number;
  [key: string]: any;
}

const REQUESTER_TOKEN_HEADER = "x-requester-token";

export function validateJWT(token: string): { valid: boolean; error?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Token não fornecido" };
  }

  // Verifica formato básico de JWT (3 partes separadas por ponto)
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Formato de token inválido" };
  }

  try {
    const decoded = jwtDecode<JWTPayload>(token);

    // Verifica se o token expirou
    if (decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        return { valid: false, error: "Token expirado" };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Token malformado ou inválido" };
  }
}

/**
 * Obtém o token de todas as fontes possíveis, na ordem de prioridade.
 * Esta função é a ÚNICA fonte da verdade para obter o token.
 */
export function getTokenFromStorage(): string | null {
  // 1. Check URL parameters
  try {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get(REQUESTER_TOKEN_HEADER) || params.get("token");
    if (urlToken) {
      console.log('[Auth] Token encontrado via URL parameter');
      try {
        sessionStorage.setItem(REQUESTER_TOKEN_HEADER, urlToken);
      } catch {}
      return urlToken;
    }
  } catch {}

  // 2. Check window global variable
  try {
    const w: any = window as any;
    if (w && typeof w.__REQUESTER_TOKEN__ === "string" && w.__REQUESTER_TOKEN__) {
      console.log('[Auth] Token encontrado via window.__REQUESTER_TOKEN__');
      return w.__REQUESTER_TOKEN__ as string;
    }
  } catch {}

  // 3. Check sessionStorage
  try {
    const s = sessionStorage.getItem(REQUESTER_TOKEN_HEADER);
    if (s) {
      console.log('[Auth] Token encontrado via sessionStorage');
      return s;
    }
  } catch {}

  // 4. Check localStorage
  try {
    const l = localStorage.getItem(REQUESTER_TOKEN_HEADER);
    if (l) {
      console.log('[Auth] Token encontrado via localStorage');
      return l;
    }
  } catch {}

  // 5. Check cookies
  try {
    const match = document.cookie.match(
      new RegExp("(?:^|; )" + REQUESTER_TOKEN_HEADER + "=([^;]*)")
    );
    if (match) {
      console.log('[Auth] Token encontrado via cookies');
      return decodeURIComponent(match[1]);
    }
  } catch {}

  // 6. Fallback to environment variable (for local development)
  try {
    const envToken = import.meta.env.VITE_REQUESTER_TOKEN;
    if (envToken && envToken !== "your-token-here") {
      console.log('[Auth] Token encontrado via VITE_REQUESTER_TOKEN (.env)');
      return envToken;
    }
  } catch {}

  console.log('[Auth] ⚠️ Nenhum token encontrado em nenhuma fonte');
  return null;
}

export function setTokenInStorage(token: string): void {
  const REQUESTER_TOKEN_HEADER = "x-requester-token";
  try {
    localStorage.setItem(REQUESTER_TOKEN_HEADER, token);
    sessionStorage.setItem(REQUESTER_TOKEN_HEADER, token);
  } catch (e) {
    console.error("Failed to save token:", e);
  }
}

export function clearTokenFromStorage(): void {
  const REQUESTER_TOKEN_HEADER = "x-requester-token";
  try {
    localStorage.removeItem(REQUESTER_TOKEN_HEADER);
    sessionStorage.removeItem(REQUESTER_TOKEN_HEADER);
  } catch {}
}

/**
 * Extrai o email do token JWT.
 * Retorna o email se disponível, caso contrário retorna "system@ifoodpago.com.br" como fallback.
 */
export function getEmailFromToken(): string {
  const token = getTokenFromStorage();
  if (!token) {
    console.warn('[Auth] Token não encontrado, usando email padrão');
    return "system@ifoodpago.com.br";
  }

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const email = decoded.email || decoded.sub;
    if (email && typeof email === 'string') {
      console.log('[Auth] Email extraído do token:', email);
      return email;
    }
    console.warn('[Auth] Email não encontrado no token, usando email padrão');
    return "system@ifoodpago.com.br";
  } catch (error) {
    console.warn('[Auth] Erro ao decodificar token, usando email padrão:', error);
    return "system@ifoodpago.com.br";
  }
}
