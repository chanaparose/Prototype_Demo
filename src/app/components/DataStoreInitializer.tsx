import { useEffect } from 'react';
import { useAuth } from '@/stores/useAuthStore';
import { useDataStore } from '@/stores/useDataStore';

export function DataStoreInitializer() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { refetch } = useDataStore();

  useEffect(() => {
    if (!authLoading) {
      refetch();
    }
  }, [authLoading, refetch]);

  return null;
}
