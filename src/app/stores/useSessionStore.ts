import { create } from 'zustand';
import type { ISessionResponse } from '@/services/api/types/explore.types';

interface SessionState {
  data: ISessionResponse | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
}

interface SessionActions {
  clear: () => void;
  getFavoriteIds: () => Set<string>;
}

export const useSessionStore = create<SessionState & SessionActions>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  clear: () => set({ data: null, isLoading: false, error: null, lastFetchedAt: null }),

  getFavoriteIds: () => {
    const ids = get().data?.favorites ?? [];
    return new Set(ids.map(String));
  },
}));
