import { useCallback, useEffect, useState } from 'react';
import type { IExploreCategory } from '@/domain/explore/types/explore.model';
import { fetchExploreCategoriesListOnly } from '@/utils/exploreCategoriesFromApi';
import { runAsyncAction } from '@/utils/asyncAction';

export type ExploreCategoriesApiState = {
  merged: IExploreCategory[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

type Options = { enabled?: boolean };

export function useExploreCategoriesFromApi(options?: Options): ExploreCategoriesApiState {
  const enabled = options?.enabled !== false;
  const [merged, setMerged] = useState<IExploreCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    await runAsyncAction(
      async () => {
        const result = await fetchExploreCategoriesListOnly();
        setMerged(result.merged);
        if (result.bothFailed && result.firstError) {
          setError(result.firstError.message);
        } else {
          setError(null);
        }
      },
      {
        onStart: () => {
          setLoading(true);
          setError(null);
        },
        onSettled: () => setLoading(false),
        onError: (message) => {
          setError(message);
          setMerged([]);
        },
        fallbackMessage: 'ไม่สามารถโหลดหมวดหมู่ได้',
      },
    );
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
