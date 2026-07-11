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

const EMPTY_FAVORITE_IDS: ReadonlySet<string> = new Set();

export const useSessionStore = create<SessionState & SessionActions>((set, get) => {
  // Memoize by source-array reference so repeated calls (incl. selectors/renders)
  // return a stable Set and don't break referential-equality checks downstream.
  let cachedSource: unknown;
  let cachedIds: Set<string> = new Set();

  return {
    data: null,
    isLoading: false,
    error: null,
    lastFetchedAt: null,

    clear: () => set({ data: null, isLoading: false, error: null, lastFetchedAt: null }),

    getFavoriteIds: () => {
      const favorites = get().data?.favorites;
      if (!favorites) return EMPTY_FAVORITE_IDS as Set<string>;
      if (favorites !== cachedSource) {
        cachedSource = favorites;
        cachedIds = new Set(favorites.map(String));
      }
      return cachedIds;
    },
  };
});
