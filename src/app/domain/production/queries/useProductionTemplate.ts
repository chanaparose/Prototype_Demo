import { useQuery } from '@tanstack/react-query';
import { mapStepTemplatesFromApi } from '@/domain/production/mappers/mapProductionBundle';
import type { IProductionStepTemplate } from '@/domain/production/types/production.model';
import { masterApi } from '@/services/api/masterApi';

export function useProductionTemplate() {
  return useQuery({
    queryKey: ['production', 'template'] as const,
    queryFn: async (): Promise<IProductionStepTemplate[]> => {
      const raw = await masterApi.getProductionSteps();
      return mapStepTemplatesFromApi(raw);
    },
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
