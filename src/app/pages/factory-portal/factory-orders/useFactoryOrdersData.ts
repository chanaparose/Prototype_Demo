import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/stores/useAuthStore';
import { ordersApi } from '@/services/api/ordersApi';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { pickScalarString } from '@/utils/pickScalarString';
import type {
  FactoryOrderRow,
  OrderStatusCode,
  ProductionSummaryRow,
} from '@/pages/factory-portal/factory-orders/types';

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

const VALID_STATUS: OrderStatusCode[] = [
  'PP',
  'PE',
  'PD',
  'PR',
  'QC',
  'SH',
  'CP',
  'CN',
  'CC',
  'CL',
];

function toProductionSummary(raw: unknown): ProductionSummaryRow | null {
  if (!isObj(raw)) return null;
  const st = pickScalarString(raw.current_update_status).toUpperCase();
  return {
    current_step_code:
      raw.current_step_code != null ? pickScalarString(raw.current_step_code) : null,
    current_step_name_th:
      raw.current_step_name_th != null ? pickScalarString(raw.current_step_name_th) : null,
    current_step_id: Number.isFinite(Number(raw.current_step_id))
      ? Number(raw.current_step_id)
      : null,
    current_update_status: ['PD', 'IP', 'CD', 'RJ'].includes(st)
      ? (st as 'PD' | 'IP' | 'CD' | 'RJ')
      : null,
    completed_count: Number(raw.completed_count ?? 0),
    total_count: Number(raw.total_count ?? 0),
    last_updated_at: raw.last_updated_at != null ? pickScalarString(raw.last_updated_at) : null,
    has_rejected: raw.has_rejected === true,
  };
}

function normalizeRow(raw: Record<string, unknown>): FactoryOrderRow | null {
  const row = isObj(raw.order) ? (raw.order as Record<string, unknown>) : raw;
  const status = pickScalarString(row.status).toUpperCase();
  if (!VALID_STATUS.includes(status as OrderStatusCode)) return null;
  const rfqObj = isObj(row.rfq)
    ? row.rfq
    : row.rfq_title != null
      ? {
          rfq_id: row.rfq_id ?? 0,
          title: row.rfq_title,
          quantity: row.rfq_quantity ?? 0,
          unit_name: row.unit_name ?? 'ชิ้น',
        }
      : null;
  const customerObj = isObj(row.customer)
    ? row.customer
    : row.user_id != null
      ? { user_id: row.user_id, display_name: '' }
      : null;
  return {
    order_id: Number(row.order_id ?? row.id ?? 0),
    status: status as OrderStatusCode,
    total_amount: Number(row.total_amount ?? 0),
    deposit_amount: Number(row.deposit_amount ?? 0),
    estimated_delivery: row.estimated_delivery
      ? pickScalarString(row.estimated_delivery).split('T')[0]
      : null,
    created_at: pickScalarString(row.created_at),
    updated_at: pickScalarString(row.updated_at),
    factory_id: Number(row.factory_id ?? 0),
    customer: customerObj
      ? {
          user_id: Number(customerObj.user_id ?? 0),
          display_name: pickScalarString(customerObj.display_name),
        }
      : null,
    rfq: rfqObj
      ? {
          rfq_id: Number(rfqObj.rfq_id ?? 0),
          title: pickScalarString(rfqObj.title),
          quantity: Number(rfqObj.quantity ?? 0),
          unit_name: pickScalarString(rfqObj.unit_name, 'ชิ้น'),
        }
      : null,
    production_summary: toProductionSummary(row.production_summary),
  };
}

export function useFactoryOrdersData() {
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  return useQuery({
    queryKey: ['factory', 'orders', fid],
    queryFn: async () => {
      const raw = await ordersApi.list();
      const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
      return arr
        .map(normalizeRow)
        .filter((r): r is FactoryOrderRow => r != null)
        .filter((r) => (fid ? r.factory_id === fid : true));
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}
