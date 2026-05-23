import { useEffect, useState, useRef, useCallback } from 'react';
import { favoritesApi } from '@/services/api/userApi';
import { useAuth } from '@/stores/useAuthStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { apiListAsRecords, type ApiRecord } from '@/lib/apiShape';

function extractShowcaseId(row: ApiRecord): string {
  const raw = row.showcase_id ?? row.showcaseId ?? row.id ?? row.favorite_id;
  return String(raw ?? '').trim();
}

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const sessionData = useSessionStore((s) => s.data);
  const sessionLoaded = sessionData !== null;

  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const seededFromSessionRef = useRef(false);

  useEffect(() => {
    if (sessionLoaded && !seededFromSessionRef.current) {
      seededFromSessionRef.current = true;
      const ids = new Set((sessionData?.favorites ?? []).map(String));
      setLikedIds(ids);
    }
  }, [sessionLoaded, sessionData]);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLikedIds(new Set());
      setLoading(false);
      return;
    }
    if (seededFromSessionRef.current) return;

    setLoading(true);
    try {
      const raw = await favoritesApi.list();
      const next = new Set<string>();
      for (const row of apiListAsRecords(raw)) {
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

  useEffect(() => {
    void load();
  }, [load]);

  const isLiked = useCallback(
    (showcaseId: string | number) => likedIds.has(String(showcaseId)),
    [likedIds],
  );

  const toggleFavorite = useCallback(
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

      const apiCall = wasLiked ? favoritesApi.remove(numId) : favoritesApi.add(numId);
      return apiCall
        .then(() => {
          useSessionStore.setState((prev) => {
            if (!prev.data) return prev;
            const old = prev.data.favorites ?? [];
            const updated = wasLiked
              ? old.filter((id) => String(id) !== key)
              : [...old, numId];
            return { ...prev, data: { ...prev.data, favorites: updated } };
          });
          return true;
        })
        .catch(() => {
          setLikedIds((prev) => {
            const next = new Set(prev);
            if (wasLiked) next.add(key);
            else next.delete(key);
            return next;
          });
          return false;
        });
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
