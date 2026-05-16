import { create } from 'zustand';
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
import { isTourActive, subscribeTourActive, TOUR_GUEST_USER } from '../utils/tourMocks';
import type { User } from './types';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthActions {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterCustomerPayload | RegisterFactoryPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => {
  const fetchUser = async () => {
    try {
      const data = await frontendApi.getMe();
      set({
        user: data as unknown as User,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      const token = getToken();
      set({
        token,
        isAuthenticated: Boolean(token),
        isLoading: false,
      });
    }
  };

  // Initialize auth on store creation
  const token = getToken();
  if (token) {
    fetchUser();
  } else {
    try {
      if (sessionStorage.getItem('auth_token_expired') === '1' && window.location.pathname !== '/login') {
        sessionStorage.removeItem('auth_token_expired');
        window.location.href = '/login';
      }
    } catch {
      // ignore storage availability issues
    }
    set({ isLoading: false });
  }

  return {
    user: null,
    token,
    isLoading: Boolean(token),
    isAuthenticated: Boolean(token),

    setLoading: (loading) => set({ isLoading: loading }),

    login: async (payload: LoginPayload) => {
      const response = (await authApi.login(payload)) as Record<string, unknown>;
      console.log('[Auth] login response:', response);

      const tokenStr = String(response.token ?? response.access_token ?? '').trim();
      if (!tokenStr) {
        throw new Error('เซิร์ฟเวอร์ไม่ได้ส่ง token กลับมา — กรุณาลองใหม่');
      }

      const user = (response.user as Record<string, unknown> | undefined) || {};
      setToken(tokenStr);
      set({
        user: user as unknown as User,
        token: tokenStr,
        isAuthenticated: true,
        isLoading: false,
      });

      try {
        const fullUser = await frontendApi.getMe();
        console.log('[Auth] /frontend/me response:', fullUser);
        set({ user: fullUser as unknown as User });
      } catch (err) {
        console.warn('[Auth] /frontend/me failed, using basic user:', err);
      }
    },

    register: async (payload: RegisterCustomerPayload | RegisterFactoryPayload) => {
      const response = (await authApi.register(payload)) as Record<string, unknown>;
      console.log('[Auth] register response:', response);

      const tokenStr = String(response.token ?? response.access_token ?? '').trim();
      if (!tokenStr) {
        throw new Error('เซิร์ฟเวอร์ไม่ได้ส่ง token กลับมา — กรุณาลองใหม่');
      }

      const user = (response.user as Record<string, unknown> | undefined) || {};
      setToken(tokenStr);
      set({
        user: user as unknown as User,
        token: tokenStr,
        isAuthenticated: true,
        isLoading: false,
      });

      try {
        const fullUser = await frontendApi.getMe();
        console.log('[Auth] /frontend/me after register:', fullUser);
        set({ user: fullUser as unknown as User });
      } catch (err) {
        console.warn('[Auth] /frontend/me failed after register, using basic user:', err);
      }
    },

    logout: () => {
      removeToken();
      set({ user: null, token: null, isLoading: false, isAuthenticated: false });
    },

    refreshUser: async () => {
      await fetchUser();
    },
  };
});

export function useAuth() {
  const state = useAuthStore();
  const tourOn = isTourActive();

  if (tourOn && !state.user) {
    return {
      ...state,
      user: TOUR_GUEST_USER as unknown as User,
      isAuthenticated: true,
    };
  }

  return state;
}
