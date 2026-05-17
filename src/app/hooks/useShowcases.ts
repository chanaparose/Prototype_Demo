import {
  mapShowcaseFromApi,
  showcaseQueryTypeFromTab,
  type ShowcaseApiType,
} from '@/domain/showcase/mappers/mapShowcase';
import { useShowcasesQuery } from '@/domain/showcase/queries/useShowcasesQuery';

export type { ShowcaseApiType };
export { mapShowcaseFromApi, showcaseQueryTypeFromTab };

export function useShowcases(options?: { type?: ShowcaseApiType }) {
  const q = useShowcasesQuery(options?.type);
  return {
    showcases: q.data ?? [],
    loading: q.isLoading,
    error: q.error instanceof Error ? q.error.message : q.error ? 'โหลดข้อมูลไม่สำเร็จ' : null,
    refetch: q.refetch,
  };
}
