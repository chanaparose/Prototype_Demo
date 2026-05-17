import { useQuery } from '@tanstack/react-query';
import { adminApi, type AdminRfqRow } from '@/services/api/adminApi';
import { adminKeys } from '@/lib/queryKeys';

export function parseAdminRfqRows(raw: unknown): AdminRfqRow[] {
  if (Array.isArray(raw)) return raw as AdminRfqRow[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as AdminRfqRow[];
    if (Array.isArray(obj.data)) return obj.data as AdminRfqRow[];
    if (Array.isArray(obj.rows)) return obj.rows as AdminRfqRow[];
  }
  return [];
}

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
      return parseAdminRfqRows(raw);
    },
    enabled: params.enabled !== false,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}

export function useAdminRfqDetailQuery(rfqId: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.rfqDetail(rfqId),
    queryFn: () => adminApi.getRfq(rfqId) as Promise<Record<string, unknown>>,
    enabled: enabled && Boolean(rfqId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
