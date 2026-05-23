import { useEffect, useState } from 'react';

interface UseFetchDataOptions<TRaw, TMapped> {
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: TMapped) => void;
}

interface UseFetchDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetchData<TRaw, TMapped>(
  fetchFn: () => Promise<TRaw>,
  mapFn: (raw: TRaw) => TMapped,
  dependencies: React.DependencyList,
  options: UseFetchDataOptions<TRaw, TMapped> = {},
): UseFetchDataResult<TMapped> {
  const { enabled = true, onError, onSuccess } = options;
  const [data, setData] = useState<TMapped | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchFn()
      .then((raw) => {
        if (cancelled) return;
        const mapped = mapFn(raw);
        setData(mapped);
        onSuccess?.(mapped);
      })
      .catch((err) => {
        if (!cancelled) {
          const errorMsg = err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ';
          setError(errorMsg);
          setData(null);
          onError?.(err instanceof Error ? err : new Error(errorMsg));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return { data, loading, error };
}
