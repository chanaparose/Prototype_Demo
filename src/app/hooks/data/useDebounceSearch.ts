import { useState, useEffect, useCallback } from 'react';

interface UseDebounceSearchReturn<T> {
  searchQuery: string;
  debouncedQuery: string;
  results: T[];
  isLoading: boolean;
  error: Error | null;
  setSearchQuery: (query: string) => void;
}

/**
 * Search hook with debouncing
 * @param searcher - Function that takes search query and returns results
 * @param debounceDelay - Delay in ms (default: 300)
 */
export function useDebounceSearch<T>(
  searcher: (query: string) => Promise<T[]>,
  debounceDelay = 300,
): UseDebounceSearchReturn<T> {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceDelay]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const searchResults = await searcher(debouncedQuery);
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Search failed'));
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, searcher]);

  return {
    searchQuery,
    debouncedQuery,
    results,
    isLoading,
    error,
    setSearchQuery,
  };
}
