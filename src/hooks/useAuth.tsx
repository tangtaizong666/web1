/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchCurrentUser,
  login,
  logout,
  register,
  type AuthPayload,
  type AuthUser,
} from '../lib/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  loginUser: (payload: AuthPayload) => Promise<void>;
  registerUser: (payload: AuthPayload) => Promise<void>;
  logoutUser: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    try {
      const result = await fetchCurrentUser();
      setUser(result.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      async loginUser(payload) {
        const result = await login(payload);
        setUser(result.user);
      },
      async registerUser(payload) {
        const result = await register(payload);
        setUser(result.user);
      },
      async logoutUser() {
        await logout();
        setUser(null);
      },
      refresh,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
