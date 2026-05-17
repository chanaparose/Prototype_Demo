import { useRelatedShowcasesQuery } from '@/domain/showcase/queries/useRelatedShowcasesQuery';

export function useRelatedShowcases(ids: number[]) {
  const q = useRelatedShowcasesQuery(ids);
  return {
    items: q.data ?? [],
    loading: q.isLoading,
    refetch: q.refetch,
  };
}
