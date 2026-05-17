import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollReturn<T> {
  items: T[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  observerTarget: React.RefObject<HTMLDivElement>;
  refetch: () => Promise<void>;
}

/**
 * Infinite scroll hook with intersection observer
 * @param fetcher - Function that takes page number and returns { items, hasMore }
 * @param pageSize - Items per page (default: 20)
 */
export function useInfiniteScroll<T>(
  fetcher: (page: number) => Promise<{ items: T[]; hasMore: boolean }>,
  pageSize = 20,
): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher(page);
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more'));
    } finally {
      setIsLoading(false);
    }
  }, [page, fetcher]);

  useEffect(() => {
    if (!observerTarget.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  useEffect(() => {
    if (page === 1) return;
    refetch();
  }, [page]);

  return {
    items,
    isLoading,
    error,
    hasMore,
    observerTarget,
    refetch,
  };
}
