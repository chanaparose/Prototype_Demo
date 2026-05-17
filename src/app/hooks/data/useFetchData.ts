import { useState, useEffect, useCallback } from 'react';

interface UseFetchDataState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseFetchDataReturn<T> extends UseFetchDataState<T> {
  refetch: () => Promise<void>;
}

/**
 * Generic hook for fetching data
 * @param fetcher - Async function that returns data
 * @param deps - Dependency array for when to refetch
 */
export function useFetchData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
): UseFetchDataReturn<T> {
  const [state, setState] = useState<UseFetchDataState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const result = await fetcher();
      setState({ data: result, isLoading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        isLoading: false,
        error: err instanceof Error ? err : new Error('Unknown error'),
      });
    }
  }, [fetcher]);

  useEffect(() => {
    refetch();
  }, deps);

  return { ...state, refetch };
}
