import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/services/api/ordersApi';
import {
  parseLockContextFromApi,
  parseStepTemplates,
  parseUpdateRow,
  type ProductionUpdatesBundle,
} from '@/components/features/production/types';

export function useOrderProductionUpdates(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId, 'production-updates'] as const,
    queryFn: async (): Promise<ProductionUpdatesBundle> => {
      const b = await ordersApi.getProductionUpdatesBundle(orderId!);
      const template_preview = Array.isArray(b.template_preview)
        ? parseStepTemplates({ steps: b.template_preview })
        : undefined;
      return {
        order_id: b.order_id,
        order_status: b.order_status,
        updates: b.updates.map((r) => parseUpdateRow(r as Record<string, unknown>)),
        production_locked: b.production_locked,
        lock_reason: b.lock_reason,
        lock_context: parseLockContextFromApi(b.lock_context),
        template_preview,
      };
    },
    enabled: Boolean(orderId),
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
