import { createContext, useContext, useEffect, useState } from "react";
import { clearToken, loadToken, setToken, setUnauthorizedHandler } from "./api";

type AuthState = {
  token: string | null;
  ready: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTok] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadToken().then((t) => {
      setTok(t);
      setReady(true);
    });
    // Any 401 from the API drops us back to login.
    setUnauthorizedHandler(() => setTok(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const value: AuthState = {
    token,
    ready,
    signIn: async (t) => {
      await setToken(t);
      setTok(t);
    },
    signOut: async () => {
      await clearToken();
      setTok(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
