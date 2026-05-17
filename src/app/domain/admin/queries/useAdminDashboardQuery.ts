import { useQuery } from '@tanstack/react-query';
import {
  EMPTY_ADMIN_DASHBOARD,
  fetchAdminDashboard,
} from '@/domain/admin/mappers/mapAdminDashboard';
import { adminKeys } from '@/lib/queryKeys';

export function useAdminDashboardQuery() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: fetchAdminDashboard,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: EMPTY_ADMIN_DASHBOARD,
  });
}
