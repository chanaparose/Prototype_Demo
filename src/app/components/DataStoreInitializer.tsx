import { useEffect } from 'react';
import { useAuth } from '@/stores/useAuthStore';
import { useDataStore } from '@/stores/useDataStore';
import { useSessionStore } from '@/stores/useSessionStore';

export function DataStoreInitializer() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const refetch = useDataStore((s) => s.refetch);
  const clearSession = useSessionStore((s) => s.clear);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        refetch(); // fetches /frontend/bootstrap and populates both data + session stores
      } else {
        clearSession();
        refetch(); // guest branch of fetchAll resets the data store (currentUser/orders) after logout
      }
    }
  }, [authLoading, isAuthenticated, refetch, clearSession]);

  return null;
}
