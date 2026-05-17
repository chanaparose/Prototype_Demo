import { useCallback, useRef } from 'react';
import { conversationsApi } from '@/services/api';

export function useMarkAsRead() {
  const calledRef = useRef<Set<string>>(new Set());
  const activeConvRef = useRef<string | null>(null);

  return useCallback(async (convId: string | number | null, opts?: { force?: boolean }) => {
    if (convId == null) return;
    const key = String(convId);
    if (opts?.force) {
      calledRef.current.delete(key);
    }
    if (activeConvRef.current !== key) {
      activeConvRef.current = key;
      calledRef.current.delete(key);
    }
    if (calledRef.current.has(key)) return;
    calledRef.current.add(key);
    try {
      await conversationsApi.markAsRead(convId);
    } catch {
      calledRef.current.delete(key);
    }
  }, []);
}
