import { useCallback, useRef } from 'react';
import { conversationsApi } from '@/services/api/chatApi';
import { setConversationReadInCache } from '@/domain/chat/chatCache';

export function useMarkAsRead() {
  const calledRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Set<string>>(new Set());
  const activeConvRef = useRef<string | null>(null);

  return useCallback(async (convId: string | number | null, opts?: { force?: boolean }) => {
    if (convId == null) return false;
    const key = String(convId);
    if (inFlightRef.current.has(key)) return false;
    if (opts?.force) {
      calledRef.current.delete(key);
    }
    if (activeConvRef.current !== key) {
      activeConvRef.current = key;
      calledRef.current.delete(key);
    }
    if (calledRef.current.has(key)) return false;
    calledRef.current.add(key);
    inFlightRef.current.add(key);
    setConversationReadInCache(convId);
    try {
      await conversationsApi.markAsRead(convId);
      return true;
    } catch {
      calledRef.current.delete(key);
      return false;
    } finally {
      inFlightRef.current.delete(key);
    }
  }, []);
}
