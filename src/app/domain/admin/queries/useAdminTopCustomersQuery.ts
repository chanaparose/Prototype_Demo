import { useQuery } from '@tanstack/react-query';
import { adminCustomerApi, type AdminTopCustomer } from '@/services/api/adminApi';
import { adminKeys } from '@/lib/queryKeys';

export async function fetchAdminTopCustomers(limit = 5): Promise<AdminTopCustomer[]> {
  const res = await adminCustomerApi.topCustomers(limit);
  const data = res as unknown as { top_customers?: AdminTopCustomer[] };
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
