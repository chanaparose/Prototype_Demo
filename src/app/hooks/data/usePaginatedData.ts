import { useState, useCallback, useEffect } from 'react';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface UsePaginatedDataReturn<T> extends PaginationState {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setLimit: (limit: number) => void;
  refetch: () => Promise<void>;
}

/**
 * Manage paginated data fetching
 * @param fetcher - Function that takes (page, limit) and returns { items, total }
 * @param initialPage - Starting page (default: 1)
 * @param initialLimit - Items per page (default: 20)
 */
export function usePaginatedData<T>(
  fetcher: (page: number, limit: number) => Promise<{ items: T[]; total: number }>,
  initialPage = 1,
  initialLimit = 20,
): UsePaginatedDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const hasMore = page * limit < total;

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher(page, limit);
      setData(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, fetcher]);

  useEffect(() => {
    refetch();
  }, [page, limit]);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const nextPage = useCallback(() => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore]);

  const previousPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  return {
    data,
    page,
    limit,
    total,
    hasMore,
    isLoading,
    error,
    goToPage,
    nextPage,
    previousPage,
    setLimit,
    refetch,
  };
}
