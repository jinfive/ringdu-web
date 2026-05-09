"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  refreshAccessToken,
} from "@/lib/api";
import type { AuthUser, LoginRequest, MeResponse } from "@/types/auth";

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  refreshSession: () => Promise<boolean>;
  loadMe: () => Promise<MeResponse | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(async (payload: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await loginRequest(payload);
      setAccessToken(response.accessToken);
      setUser(toAuthUser(response));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMe = useCallback(async () => {
    if (!accessToken) {
      return null;
    }

    setIsLoading(true);
    try {
      const response = await getMe(accessToken);
      setUser(toAuthUser(response));
      return response;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await refreshAccessToken();
      setAccessToken(response.accessToken);
      const me = await getMe(response.accessToken);
      setUser(toAuthUser(me));
      return true;
    } catch {
      setAccessToken(null);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutRequest();
    } finally {
      setAccessToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const response = await refreshAccessToken();
        const me = await getMe(response.accessToken);
        if (!isMounted) {
          return;
        }
        setAccessToken(response.accessToken);
        setUser(toAuthUser(me));
      } catch {
        if (!isMounted) {
          return;
        }
        setAccessToken(null);
        setUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      isLoading,
      login,
      refreshSession,
      loadMe,
      logout,
    }),
    [accessToken, user, isLoading, login, refreshSession, loadMe, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

function toAuthUser(user: AuthUser): AuthUser {
  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
