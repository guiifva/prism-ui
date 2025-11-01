import { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import AuthTokenModal from "./AuthTokenModal";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, checkAuth } = useAuth();

  if (!isAuthenticated) {
    return <AuthTokenModal onTokenValid={checkAuth} />;
  }

  return <>{children}</>;
}
