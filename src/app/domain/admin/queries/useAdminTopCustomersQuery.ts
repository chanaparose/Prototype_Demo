import { useQuery } from '@tanstack/react-query';
import { adminCustomerApi } from '@/services/api/adminApi';
import type { IAdminTopCustomerResponse } from '@/services/api/types/admin.types';
import { adminKeys } from '@/lib/queryKeys';

export async function fetchAdminTopCustomers(limit = 5): Promise<IAdminTopCustomerResponse[]> {
  const res = await adminCustomerApi.topCustomers(limit);
  const data = res as unknown as { top_customers?: IAdminTopCustomerResponse[] };
  return data.top_customers ?? [];
}

export function useAdminTopCustomersQuery(limit = 5) {
  return useQuery({
    queryKey: adminKeys.topCustomers(limit),
    queryFn: () => fetchAdminTopCustomers(limit),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
