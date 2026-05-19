import { useEffect } from 'react';
import { useAuth } from '@/stores/useAuthStore';
import { useDataStore } from '@/stores/useDataStore';
import { useSessionStore } from '@/stores/useSessionStore';

export function DataStoreInitializer() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { refetch } = useDataStore();
  const { clear: clearSession } = useSessionStore();

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        refetch(); // fetches /frontend/bootstrap and populates both data + session stores
      } else {
        clearSession();
      }
    }
  }, [authLoading, isAuthenticated, refetch, clearSession]);

  return null;
}
