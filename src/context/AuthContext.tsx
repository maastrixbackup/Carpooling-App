import { logger } from "@/lib/logger";
import {
  clearAuthTokens,
  getAccessToken,
  saveAuthTokens,
} from "@/lib/storage";
import { loginApi, logoutApi, meApi, signupApi } from "@/services/auth.service";
import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  full_name?: string;
  name?: string;
  email: string;
  phone?: string;
  role?: string;
  is_verified?: boolean;
  verification_status?: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type SignupPayload = {
  name: string;
  phone: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function extractTokens(response: any) {
  return {
    accessToken:
      response?.data?.access_token ||
      response?.data?.session?.access_token ||
      null,
    refreshToken:
      response?.data?.refresh_token ||
      response?.data?.session?.refresh_token ||
      null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const isAuthenticated = !!user;

  const bootstrap = async () => {
    try {
      const token = await getAccessToken();

      if (!token) {
        setUser(null);
        return;
      }

      const response = await meApi();
      setUser(response.data.user);
    } catch {
      await clearAuthTokens();
      queryClient.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const login = async (payload: LoginPayload) => {
    const response = await loginApi(payload);

    logger.auth("LOGIN SUCCESS", response);

    const { accessToken, refreshToken } = extractTokens(response);

    await saveAuthTokens({
      accessToken,
      refreshToken,
    });

    setUser(response.data.user);
  };

  const signup = async (payload: SignupPayload) => {
    const response = await signupApi(payload);

    const { accessToken, refreshToken } = extractTokens(response);

    await saveAuthTokens({
      accessToken,
      refreshToken,
    });

    setUser(response.data.user);
  };

  const logout = async () => {
    try {
      queryClient.cancelQueries();
      queryClient.clear();
      setUser(null);
      await logoutApi().catch(() => { });
      await clearAuthTokens();
    } catch {
      await clearAuthTokens();
      setUser(null);
      queryClient.clear();
    }
  };

  const refreshUser = async () => {
    const response = await meApi();
    setUser(response.data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}