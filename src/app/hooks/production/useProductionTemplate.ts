import { useQuery } from '@tanstack/react-query';
import { productionApi } from '@/services/api';
import {
  parseStepTemplates,
  type ProductionStepTemplate,
} from '@/components/features/production/types';

export function useProductionTemplate() {
  return useQuery({
    queryKey: ['production', 'template'] as const,
    queryFn: async (): Promise<ProductionStepTemplate[]> => {
      const raw = await productionApi.listSteps();
      return parseStepTemplates(raw);
    },
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
