import React from 'react';
import { favoritesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type FavoriteRow = Record<string, unknown>;

function extractShowcaseId(row: FavoriteRow): string {
  const raw = row.showcase_id ?? row.showcaseId ?? row.id ?? row.favorite_id;
  const s = String(raw ?? '').trim();
  return s;
}

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const [likedIds, setLikedIds] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!isAuthenticated) {
      setLikedIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const raw = await favoritesApi.list();
      const arr = (Array.isArray(raw) ? raw : []) as FavoriteRow[];
      const next = new Set<string>();
      for (const row of arr) {
        const id = extractShowcaseId(row);
        if (id) next.add(id);
      }
      setLikedIds(next);
    } catch {
      setLikedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const isLiked = React.useCallback(
    (showcaseId: string | number) => likedIds.has(String(showcaseId)),
    [likedIds],
  );

  const toggleFavorite = React.useCallback(
    async (showcaseId: string | number) => {
      if (!isAuthenticated) return false;
      const key = String(showcaseId);
      const numId = Number(showcaseId);
      if (!key || !Number.isFinite(numId) || numId <= 0) return false;
      const wasLiked = likedIds.has(key);

      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(key);
        else next.add(key);
        return next;
      });

      try {
        if (wasLiked) await favoritesApi.remove(numId);
        else await favoritesApi.add(numId);
        return true;
      } catch {
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(key);
          else next.delete(key);
          return next;
        });
        return false;
      }
    },
    [isAuthenticated, likedIds],
  );

  return {
    likedIds,
    loading,
    isLiked,
    toggleFavorite,
    reload: load,
  };
}
