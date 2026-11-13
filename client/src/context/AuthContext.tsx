import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi, type RegisterInput } from "@/services/auth";
import { TOKEN_KEY } from "@/services/api";
import type { Role, SessionUser } from "@/types";

export interface AuthState {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (input: RegisterInput) => Promise<SessionUser>;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthState | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const homeFor = (role?: Role) => (role === "ORGANISATION" ? "/org" : role === "ADMIN" ? "/admin" : "/seeker");

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !!localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authApi
      .me()
      .then((u) => !cancelled && setUser({ id: u._id, name: u.name, email: u.email, role: u.role }))
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const start = useCallback(
    (t: string, u: SessionUser) => {
      localStorage.setItem(TOKEN_KEY, t);
      qc.clear();
      setUser(u);
      setLoading(false);
      setToken(t);
      return u;
    },
    [qc]
  );

  const login = useCallback(async (email: string, password: string) => {
    const r = await authApi.login(email, password);
    return start(r.token, r.user);
  }, [start]);

  const register = useCallback(async (input: RegisterInput) => {
    const r = await authApi.register(input);
    return start(r.token, r.user);
  }, [start]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network error on logout
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      qc.clear();
    }
  }, [qc]);


  const value = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
