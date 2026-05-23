import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api/adminApi';
import type { IAdminRfqListResponse } from '@/services/api/types/admin.types';
import { adminKeys } from '@/lib/queryKeys';
import { parseAdminRfqRows } from '@/domain/admin/mappers/mapAdminRfq';

export { parseAdminRfqRows };

export function useAdminRfqListQuery(params: {
  status?: string;
  search?: string;
  enabled?: boolean;
}) {
  const statusKey = params.status ?? 'all';
  const searchKey = (params.search ?? '').trim();

  return useQuery({
    queryKey: adminKeys.rfqList(statusKey, searchKey),
    queryFn: async () => {
      const raw = await adminApi.listRfqs({
        status: params.status,
        search: searchKey || undefined,
        page: 1,
        page_size: 100,
      });
      return parseAdminRfqRows<IAdminRfqListResponse>(raw);
    },
    enabled: params.enabled !== false,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}

export function useAdminRfqDetailQuery(rfqId: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.rfqDetail(rfqId),
    queryFn: () => adminApi.getRfq(rfqId),
    enabled: enabled && Boolean(rfqId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
