import { create } from 'zustand';
import {
  fetchCurrentUserAction,
  loginAction,
  registerAction,
} from '@/domain/auth/api/authActions';
import { getToken, setToken, removeToken } from '@/services/api/tokenManager';
import type {
  ILoginRequest,
  IRegisterCustomerRequest,
  IRegisterFactoryRequest,
} from '@/services/api/types/auth.types';
import type { IUser } from '@/domain/auth/types/user.model';
import type { IAuthSession } from '@/domain/auth/types/auth.model';
import { isTourActive, subscribeTourActive, TOUR_GUEST_USER } from '@/utils/tourMocks';

export interface IAuthState {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface IAuthActions {
  login: (request: ILoginRequest) => Promise<IAuthSession>;
  register: (request: IRegisterCustomerRequest | IRegisterFactoryRequest) => Promise<IAuthSession>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<IAuthState & IAuthActions>((set) => {
  const fetchUser = async () => {
    try {
      const user = await fetchCurrentUserAction();
      set({
        user,
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

  const token = getToken();
  if (token) {
    fetchUser();
  } else {
    try {
      if (
        sessionStorage.getItem('auth_token_expired') === '1' &&
        window.location.pathname !== '/login'
      ) {
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

    login: async (request: ILoginRequest) => {
      const session = await loginAction(request);
      setToken(session.token);
      set({
        user: session.user,
        token: session.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return session;
    },

    register: async (request: IRegisterCustomerRequest | IRegisterFactoryRequest) => {
      const session = await registerAction(request);
      setToken(session.token);
      set({
        user: session.user,
        token: session.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return session;
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
      user: TOUR_GUEST_USER as unknown as IUser,
      isAuthenticated: true,
    };
  }

  return state;
}
