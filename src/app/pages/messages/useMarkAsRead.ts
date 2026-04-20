import { useCallback, useRef } from 'react';
import { conversationsApi } from '../../services/api';

/**
 * Idempotent mark-as-read per conversation while it stays active.
 * When the user switches to another conversation and back, mark-as-read runs again.
 */
export function useMarkAsRead() {
  const calledRef = useRef<Set<string>>(new Set());
  const activeConvRef = useRef<string | null>(null);

  return useCallback(async (convId: string | number | null) => {
    if (convId == null) return;
    const key = String(convId);
    if (activeConvRef.current !== key) {
      activeConvRef.current = key;
      calledRef.current.delete(key);
    }
    if (calledRef.current.has(key)) return;
    calledRef.current.add(key);
    try {
      await conversationsApi.markAsRead(convId);
    } catch (e) {
      calledRef.current.delete(key);
      console.warn('[mark-as-read] failed', e);
    }
  }, []);
}
