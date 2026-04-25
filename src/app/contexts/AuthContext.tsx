import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authApi,
  getToken,
  setToken,
  removeToken,
  frontendApi,
  type LoginPayload,
  type RegisterCustomerPayload,
  type RegisterFactoryPayload,
} from '../services/api';

// ─── Types ──────────────────────────────────────────────────────
export type User = {
  id: number | string;
  role: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  avatar: string;
  walletBalance: number;
  pendingBalance: number;
  memberSince: string;
  /** ฝั่งโรงงาน (FT): รหัสโรงงานสำหรับเรียก /factories/:id */
  factory_id?: number | string;
  factoryId?: number | string;
  /** FT: PD = รอตรวจ, AP = อนุมัติ, RJ = ปฏิเสธ — ดู FACTORY_UI_SPEC / FACTORY_ONBOARDING_SPEC */
  verify_status?: string;
  [key: string]: unknown;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthContextType = AuthState & {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterCustomerPayload | RegisterFactoryPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

// ─── Context ────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: getToken(),
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchUser = useCallback(async () => {
    try {
      const data = await frontendApi.getMe();
      setState((prev) => ({
        ...prev,
        user: data as unknown as User,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch {
      // request() already handles 401 (clear token + redirect).
      // For transient/network errors, keep token so session is not lost unexpectedly.
      const token = getToken();
      setState((prev) => ({
        ...prev,
        token,
        isAuthenticated: Boolean(token),
        isLoading: false,
      }));
    }
  }, []);

  // On mount, if token exists, fetch user
  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchUser();
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [fetchUser]);

  const login = async (payload: LoginPayload) => {
    const response = await authApi.login(payload) as Record<string, unknown>;
    console.log('[Auth] login response:', response);

    // API อาจ return { token, user } หรือ shape อื่น
    const token = String(response.token ?? response.access_token ?? '').trim();
    if (!token) {
      throw new Error('เซิร์ฟเวอร์ไม่ได้ส่ง token กลับมา — กรุณาลองใหม่');
    }

    const user = (response.user as Record<string, unknown> | undefined) || {};
    setToken(token);
    setState({
      user: user as unknown as User,
      token,
      isAuthenticated: true,
      isLoading: false,
    });

    // Fetch full user profile from /frontend/me after login
    try {
      const fullUser = await frontendApi.getMe();
      console.log('[Auth] /frontend/me response:', fullUser);
      setState((prev) => ({ ...prev, user: fullUser as unknown as User }));
    } catch (err) {
      console.warn('[Auth] /frontend/me failed, using basic user:', err);
      // keep basic user from login response
    }
  };

  const register = async (payload: RegisterCustomerPayload | RegisterFactoryPayload) => {
    const response = await authApi.register(payload) as Record<string, unknown>;
    console.log('[Auth] register response:', response);

    const token = String(response.token ?? response.access_token ?? '').trim();
    if (!token) {
      throw new Error('เซิร์ฟเวอร์ไม่ได้ส่ง token กลับมา — กรุณาลองใหม่');
    }

    const user = (response.user as Record<string, unknown> | undefined) || {};
    setToken(token);
    setState({
      user: user as unknown as User,
      token,
      isAuthenticated: true,
      isLoading: false,
    });

    try {
      const fullUser = await frontendApi.getMe();
      console.log('[Auth] /frontend/me after register:', fullUser);
      setState((prev) => ({ ...prev, user: fullUser as unknown as User }));
    } catch (err) {
      console.warn('[Auth] /frontend/me failed after register, using basic user:', err);
    }
  };

  const logout = () => {
    removeToken();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
