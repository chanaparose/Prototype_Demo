import React, { useCallback, useEffect, useState } from 'react';
import type { ExploreCategoryItem } from '../utils/exploreCategoriesFromApi';
import { fetchExploreCategoriesMerged } from '../utils/exploreCategoriesFromApi';

export type ExploreCategoriesApiState = {
  merged: ExploreCategoryItem[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

type Options = { enabled?: boolean };

/** โหลดหมวด Explore — ใช้ร่วม desktop + mobile; ตั้ง enabled: false รอจนกว่าจะเปิด (เช่น โหมด manualApi) */
export function useExploreCategoriesFromApi(options?: Options): ExploreCategoriesApiState {
  const enabled = options?.enabled !== false;
  const [merged, setMerged] = useState<ExploreCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchExploreCategoriesMerged();
      setMerged(result.merged);
      if (result.bothFailed && result.firstError) {
        setError(result.firstError.message);
      } else {
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ไม่สามารถโหลดหมวดหมู่ได้');
      setMerged([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setMerged([]);
      setError(null);
      return;
    }
    void reload();
  }, [enabled, reload]);

  return { merged, loading, error, reload };
}
