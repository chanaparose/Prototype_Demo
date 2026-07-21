import { useQuery } from '@tanstack/react-query';
import { adminApi, adminWithdrawalApi } from '@/services/api/adminApi';
import { disputesApi } from '@/services/api/ordersApi';
import { usePaymentConfig } from '@/hooks/usePaymentConfig';
import { inferAdminOrderStatusTab } from '@/domain/admin/adminOrderStatus';
import { pickScalarString } from '@/utils/pickScalarString';

/** Pull an array out of the common {items}/{data}/{rows}/[] response shapes. */
function toArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    for (const key of ['items', 'data', 'rows']) {
      if (Array.isArray(o[key])) return o[key] as Record<string, unknown>[];
    }
  }
  return [];
}

export type AdminPendingCounts = {
  /** Orders awaiting superadmin slip verification (status WA, escrow mode only). */
  slips: number;
  /** Refund requests awaiting review (dispute status OP). */
  disputes: number;
  /** Withdrawal requests awaiting review (status PE). */
  withdrawals: number;
};

const REFETCH_MS = 60_000;
const STALE_MS = 30_000;

/**
 * Counts of items sitting in a queue that need a superadmin's attention.
 * Feeds the badge numbers on the admin sidebar so nothing waits unnoticed.
 * Each query is gated by the viewer's role rank (and escrow mode for slips)
 * so lower-rank admins don't fire SA-only endpoints.
 */
export function useAdminPendingCounts(roleRank: number): AdminPendingCounts {
  const { isEscrow } = usePaymentConfig();

  const slipsQ = useQuery({
    queryKey: ['admin-pending', 'slips'],
    queryFn: () => adminApi.listOrders({ status: 'WA', page: 1, page_size: 100 }),
    enabled: isEscrow && roleRank >= 3,
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
    refetchOnWindowFocus: true,
  });

  const disputesQ = useQuery({
    queryKey: ['admin-pending', 'disputes'],
    queryFn: () => disputesApi.adminList('OP'),
    enabled: roleRank >= 3,
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
    refetchOnWindowFocus: true,
  });

  const withdrawalsQ = useQuery({
    queryKey: ['admin-pending', 'withdrawals'],
    queryFn: () => adminWithdrawalApi.list({ status: 'PE', page: 1, page_size: 100 }),
    enabled: roleRank >= 2,
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
    refetchOnWindowFocus: true,
  });

  // Count client-side against the real status so a backend that ignores the
  // status filter can't inflate the badge.
  const slips = toArray(slipsQ.data).filter(
    (r) => inferAdminOrderStatusTab(pickScalarString(r.status)) === 'verify_slip',
  ).length;
  const disputes = toArray(disputesQ.data).filter(
    (r) => pickScalarString(r.status).toUpperCase() === 'OP',
  ).length;
  const withdrawals = toArray(withdrawalsQ.data).filter(
    (r) => pickScalarString(r.status).toUpperCase() === 'PE',
  ).length;

  return { slips, disputes, withdrawals };
}
