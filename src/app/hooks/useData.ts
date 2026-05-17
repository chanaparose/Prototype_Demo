import { useDataStore } from '@/stores/useDataStore';

export function useData() {
  return useDataStore();
}
