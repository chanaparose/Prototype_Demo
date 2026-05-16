import { useEffect } from 'react';
import { useAuth } from '../stores';
import { useDataStore } from '../stores';

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
