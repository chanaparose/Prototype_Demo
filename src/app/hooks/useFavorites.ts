import React from 'react';
import { favoritesApi } from '@/services/api/userApi';
import { useAuth } from '@/stores/useAuthStore';
import { useSessionStore } from '@/stores/useSessionStore';

type FavoriteRow = Record<string, unknown>;

function extractShowcaseId(row: FavoriteRow): string {
  const raw = row.showcase_id ?? row.showcaseId ?? row.id ?? row.favorite_id;
  const s = String(raw ?? '').trim();
  return s;
}

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const sessionData = useSessionStore((s) => s.data);
  const sessionLoaded = sessionData !== null;

  const [likedIds, setLikedIds] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(false);
  const seededFromSessionRef = React.useRef(false);

  // Seed from session when it becomes available (no extra API call needed)
  React.useEffect(() => {
    if (sessionLoaded && !seededFromSessionRef.current) {
      seededFromSessionRef.current = true;
      const ids = new Set((sessionData?.favorites ?? []).map(String));
      setLikedIds(ids);
    }
  }, [sessionLoaded, sessionData]);

  const load = React.useCallback(async () => {
    if (!isAuthenticated) {
      setLikedIds(new Set());
      setLoading(false);
      return;
    }
    // If session already seeded favorites, skip the separate API call
    if (seededFromSessionRef.current) return;

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

        // Sync back to session store so favorites persist across page navigations
        useSessionStore.setState((prev) => {
          if (!prev.data) return prev;
          const old = prev.data.favorites ?? [];
          const updated = wasLiked
            ? old.filter((id) => String(id) !== key)
            : [...old, numId];
          return { ...prev, data: { ...prev.data, favorites: updated } };
        });

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
