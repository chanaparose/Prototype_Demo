import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api/adminApi';
import type { IAdminOrderListResponse } from '@/services/api/types/admin.types';
import { apiListAsRecords } from '@/lib/apiShape';
import { adminKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/apiError';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

export type OrderStatusTab = 'all' | 'pending' | 'processing' | 'completed' | 'cancelled';

export interface AdminOrderView {
  order_id: string;
  buyer: string;
  factory: string;
  total_amount: number;
  commission_amount: number;
  vat_amount: number;
  status: string;
  created_at: string;
}

const STATUS_TABS: { key: OrderStatusTab; apiStatus?: string }[] = [
  { key: 'all' },
  { key: 'pending', apiStatus: 'OP' },
  { key: 'processing', apiStatus: 'PR' },
  { key: 'completed', apiStatus: 'CM' },
  { key: 'cancelled', apiStatus: 'CL' },
];

function mapOrder(row: IAdminOrderListResponse): AdminOrderView {
  return {
    order_id: pickScalarString(row.order_id),
    buyer: pickScalarString(row.customer_name, '-'),
    factory: pickScalarString(row.factory_name, '-'),
    total_amount: pickScalarNumber(row.total_amount) ?? 0,
    commission_amount: pickScalarNumber(row.platform_commission_amount) ?? 0,
    vat_amount: pickScalarNumber(row.vat_amount) ?? 0,
    status: pickScalarString(row.status, 'OP'),
    created_at: pickScalarString(row.created_at),
  };
}

export function useAdminOrdersPage(
  statusTab: OrderStatusTab,
  search: string,
  dateFrom: string,
  dateTo: string,
) {
  const filters = { statusTab, search, dateFrom, dateTo };
  const apiStatus = STATUS_TABS.find((t) => t.key === statusTab)?.apiStatus;

  const listQuery = useQuery({
    queryKey: adminKeys.ordersList(filters),
    queryFn: async () => {
      const raw = await adminApi.listOrders({
        status: apiStatus,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: search.trim() || undefined,
        page: 1,
        page_size: 200,
      });
      return apiListAsRecords(raw, ['items', 'rows']).map((row) =>
        mapOrder(row as IAdminOrderListResponse),
      );
    },
  });

  const error = listQuery.error
    ? getErrorMessage(listQuery.error, 'โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ')
    : '';

  return {
    rows: listQuery.data ?? [],
    loading: listQuery.isLoading,
    error,
  };
}
