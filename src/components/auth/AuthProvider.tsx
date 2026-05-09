"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const sessionVersionRef = useRef(0);

  const login = useCallback(async (payload: LoginRequest) => {
    sessionVersionRef.current += 1;
    setIsLoading(true);
    try {
      const response = await loginRequest(payload);
      setAccessToken(response.accessToken);
      setUser(toAuthUser(response));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const sessionVersion = sessionVersionRef.current;
    setIsLoading(true);

    refreshPromiseRef.current = (async () => {
      try {
        const response = await refreshAccessToken();
        const me = await getMe(response.accessToken);
        if (sessionVersionRef.current !== sessionVersion) {
          return false;
        }
        setAccessToken(response.accessToken);
        setUser(toAuthUser(me));
        return true;
      } catch {
        if (sessionVersionRef.current === sessionVersion) {
          setAccessToken(null);
          setUser(null);
        }
        return false;
      } finally {
        if (sessionVersionRef.current === sessionVersion) {
          setIsLoading(false);
        }
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  const loadMe = useCallback(async () => {
    if (!accessToken) {
      const restored = await refreshSession();
      if (!restored) {
        return null;
      }
    }

    const currentAccessToken = accessToken;
    if (!currentAccessToken) {
      return null;
    }

    setIsLoading(true);
    try {
      const response = await getMe(currentAccessToken);
      setUser(toAuthUser(response));
      return response;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, refreshSession]);

  const logout = useCallback(async () => {
    sessionVersionRef.current += 1;
    setIsLoading(true);
    try {
      await logoutRequest();
    } catch {
      // Client state must be cleared even if the server session is already gone.
    } finally {
      setAccessToken(null);
      setUser(null);
      setIsLoading(false);
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(() => refreshSession());
  }, [refreshSession]);

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
