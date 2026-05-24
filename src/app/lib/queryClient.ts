import { QueryClient } from '@tanstack/react-query';
import { ApiHttpError } from '@/services/api/httpClient';

/**
 * Retry policy:
 * - Server/client errors (4xx, 5xx) → ไม่ retry เลย เพราะเรียกซ้ำก็ได้ error เดิม
 * - Network errors (fetch failed, timeout, abort) → retry 1 ครั้ง
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiHttpError) return false;
  return failureCount < 1;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
  },
});
