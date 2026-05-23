import { useQuery } from '@tanstack/react-query';
import { mapStepTemplatesFromApi } from '@/domain/production/mappers/mapProductionBundle';
import type { IProductionStepTemplate } from '@/domain/production/types/production.model';
import { masterApi } from '@/services/api/masterApi';
import { productionKeys } from '@/lib/queryKeys';

export function useProductionTemplate(factoryTypeId?: string | number) {
  return useQuery({
    queryKey: productionKeys.template(factoryTypeId),
    queryFn: async (): Promise<IProductionStepTemplate[]> => {
      const raw = await masterApi.getProductionSteps(factoryTypeId);
      return mapStepTemplatesFromApi(raw);
    },
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
