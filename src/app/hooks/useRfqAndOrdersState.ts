/**
 * useRfqAndOrdersState — ดึงข้อมูลจาก CRUD endpoint ตรงๆ
 *
 * - Tab "RFQ ของฉัน"   → GET /api/v1/rfqs/       (auth: Bearer token)
 * - Tab "คำสั่งซื้อ"    → GET /api/v1/orders      (auth: Bearer token)
 *
 * Token ถูกแนบอัตโนมัติผ่าน api.ts wrapper (Authorization: Bearer <token>)
 * ข้อมูล category name / factory name ดึงจาก DataContext (bootstrap) สำหรับ enrich
 */
import React from 'react';
import { useData, type Rfq, type Order } from '../contexts/DataContext';
import { rfqsApi, ordersApi } from '../services/api';
import { getRfqFilterId } from '../components/features/rfq-and-orders';
import type { RfqFilterId, OrderFilterId } from '../components/features/rfq-and-orders';

type PrimaryTab = 'rfq' | 'orders';

type InitialState = {
  primaryTab?: PrimaryTab;
  rfqFilter?: RfqFilterId;
  orderFilter?: OrderFilterId;
};

// ─── Status Code Mapping ───────────────────────────────────────
// RFQ: OP=Open, CL=Closed, CC=Cancelled
const mapRfqStatus = (code: string, hasQuotes: boolean): string => {
  switch (code.toUpperCase()) {
    case 'OP':
      return hasQuotes ? 'offers_received' : 'pending';
    case 'CL':
      return 'completed';
    case 'CC':
      return 'cancelled';
    default:
      return code.toLowerCase();
  }
};

// Order: PR=Production, QC=QualityCheck, SH=Shipped, CP=Completed
const mapOrderStatus = (code: string): string => {
  switch (code.toUpperCase()) {
    case 'PR':
    case 'QC':
      return 'in_production';
    case 'SH':
      return 'shipped';
    case 'CP':
      return 'completed';
    default:
      return code.toLowerCase();
  }
};

// ─── Category Icon Mapping ─────────────────────────────────────
const CATEGORY_ICON_MAP: Record<string, string> = {
  'อาหารสัตว์': '🐾', 'อาหารเม็ดสัตว์': '🐾',
  'อาหารเสริม': '💊',
  'ของเล่นสัตว์เลี้ยง': '🎾',
  'เสื้อผ้าสัตว์เลี้ยง': '👕',
  'อุปกรณ์สัตว์เลี้ยง': '🦮',
  'บรรจุภัณฑ์': '📦', 'ผลิตภัณฑ์บำรุง': '✨',
  'ขนมสัตว์เลี้ยง': '🍖',
  'ที่นอนและบ้าน': '🏠',
  'ตู้ปลาและกรง': '🐟',
  'กระเป๋าและรถเข็น': '🧳',
  'ห้องน้ำและทราย': '🚿',
  'อุปกรณ์อาบน้ำ': '🧴',
};
const guessCategoryIcon = (name: string) => {
  if (CATEGORY_ICON_MAP[name]) return CATEGORY_ICON_MAP[name];
  for (const [k, v] of Object.entries(CATEGORY_ICON_MAP)) {
    if (name.includes(k) || k.includes(name)) return v;
  }
  return '📋';
};

// ─── Progress from status ──────────────────────────────────────
const guessProgress = (status: string): number => {
  switch (status) {
    case 'in_production': return 35;
    case 'shipped': return 85;
    case 'completed': return 100;
    default: return 0;
  }
};

// ─── Raw API types ─────────────────────────────────────────────
type RawRfq = {
  rfq_id: number;
  user_id: number;
  category_id: number;
  title: string;
  quantity: number;
  unit_id: number;
  budget_per_piece: number;
  details: string;
  address_id: number;
  status: string;
  created_at: string;
  [key: string]: unknown;
};

type RawOrder = {
  order_id: number;
  quote_id: number;
  user_id: number;
  factory_id: number;
  total_amount: number;
  deposit_amount: number;
  status: string;
  estimated_delivery?: string;
  created_at: string;
  [key: string]: unknown;
};

type RawQuotation = {
  quote_id: number;
  rfq_id: number;
  factory_id: number;
  price_per_piece: number;
  mold_cost: number;
  lead_time_days: number;
  shipping_method_id: number;
  status: string;
  [key: string]: unknown;
};

export function useRfqAndOrdersState(initial?: InitialState) {
  // DataContext ใช้สำหรับ lookup category name / factory name
  const dataCtx = useData();
  const categoryMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const c of dataCtx.categories) m.set(String(c.id), c.name);
    return m;
  }, [dataCtx.categories]);
  const factoryMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const f of dataCtx.factories) m.set(String(f.id), f.name);
    return m;
  }, [dataCtx.factories]);

  // ─── Local state ─────────────────────────────────────────────
  const [primaryTab, setPrimaryTab] = React.useState<PrimaryTab>(
    initial?.primaryTab ?? 'rfq',
  );
  const [rfqFilter, setRfqFilter] = React.useState<RfqFilterId>(
    initial?.rfqFilter ?? 'pending',
  );
  const [orderFilter, setOrderFilter] = React.useState<OrderFilterId>(
    initial?.orderFilter ?? 'in_production',
  );

  // ─── CRUD data ───────────────────────────────────────────────
  const [rfqs, setRfqs] = React.useState<Rfq[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // ─── Fetch RFQs from GET /rfqs/ + quotations per RFQ ────────
  const fetchRfqs = React.useCallback(async () => {
    try {
      const rawList = (await rfqsApi.list()) as RawRfq[] | null;
      if (!Array.isArray(rawList)) { setRfqs([]); return; }

      // Fetch quotations per RFQ in parallel (for offer count + status mapping)
      const withQuotes = await Promise.all(
        rawList.map(async (r) => {
          let quotes: RawQuotation[] = [];
          try {
            const q = await rfqsApi.listQuotations(r.rfq_id);
            if (Array.isArray(q)) quotes = q as RawQuotation[];
          } catch { /* no quotes */ }
          return { raw: r, quotes };
        }),
      );

      const mapped: Rfq[] = withQuotes.map(({ raw, quotes }) => {
        const catName = categoryMap.get(String(raw.category_id)) ?? '';
        const budget = Math.round(raw.budget_per_piece * raw.quantity);
        const status = mapRfqStatus(raw.status, quotes.length > 0);
        const createdDate = raw.created_at
          ? raw.created_at.split('T')[0]
          : '';

        return {
          id: String(raw.rfq_id),
          projectName: raw.title,
          category: catName,
          categoryIcon: guessCategoryIcon(catName),
          status,
          offerCount: quotes.length,
          budget,
          quantity: raw.quantity,
          material: '',
          deadline: '',
          createdAt: createdDate,
          description: raw.details ?? '',
          offers: quotes.map((q) => ({
            id: String(q.quote_id),
            factoryId: String(q.factory_id),
            factoryName: factoryMap.get(String(q.factory_id)) ?? `โรงงาน #${q.factory_id}`,
            price: Math.round(q.price_per_piece * raw.quantity + (q.mold_cost ?? 0)),
            leadTime: q.lead_time_days,
            rating: 0,
            verified: true,
            recommended: false,
            aiReason: '',
            completedOrders: 0,
            responseTime: '',
          })),
        };
      });

      setRfqs(mapped);
    } catch (err) {
      console.error('[useRfqAndOrdersState] fetchRfqs failed:', err);
      setError(err instanceof Error ? err.message : 'ไม่สามารถโหลด RFQ ได้');
    }
  }, [categoryMap, factoryMap]);

  // ─── Fetch Orders from GET /orders ───────────────────────────
  const fetchOrders = React.useCallback(async () => {
    try {
      const rawList = (await ordersApi.list()) as RawOrder[] | null;
      if (!Array.isArray(rawList)) { setOrders([]); return; }

      // We need project name from rfqs. If rfqs is already loaded, use it.
      // Also build a quote_id → rfq_id mapping from rfqs' offers
      const mapped: Order[] = rawList.map((raw) => {
        const status = mapOrderStatus(raw.status);
        const fName = factoryMap.get(String(raw.factory_id)) ?? `โรงงาน #${raw.factory_id}`;
        const deliveryDate = raw.estimated_delivery
          ? String(raw.estimated_delivery).split('T')[0]
          : '';
        const createdDate = raw.created_at
          ? raw.created_at.split('T')[0]
          : '';

        // Try to find related RFQ for project name
        // Orders store quote_id, not rfq_id directly — we look for matching rfq via offers
        let projectName = '';
        let category = '';
        let rfqId = '';
        let quantity = 0;
        for (const rfq of rfqs) {
          const matchOffer = rfq.offers.find(
            (o) => String(o.id) === String(raw.quote_id),
          );
          if (matchOffer) {
            projectName = rfq.projectName;
            category = rfq.category;
            rfqId = rfq.id;
            quantity = rfq.quantity;
            break;
          }
        }

        return {
          id: String(raw.order_id),
          rfqId,
          factoryId: String(raw.factory_id),
          factoryName: fName,
          projectName: projectName || `คำสั่งซื้อ #${raw.order_id}`,
          category,
          status,
          progress: guessProgress(status),
          totalAmount: raw.total_amount ?? 0,
          depositPaid: raw.deposit_amount ?? 0,
          quantity,
          createdAt: createdDate,
          estimatedDelivery: deliveryDate,
          timeline: [],
        };
      });

      setOrders(mapped);
    } catch (err) {
      console.error('[useRfqAndOrdersState] fetchOrders failed:', err);
      setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดคำสั่งซื้อได้');
    }
  }, [factoryMap, rfqs]);

  // ─── Initial fetch ───────────────────────────────────────────
  const isMounted = React.useRef(false);

  React.useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;
    setLoading(true);
    fetchRfqs().finally(() => setLoading(false));
  }, [fetchRfqs]);

  // Fetch orders after rfqs are loaded (need rfqs for project name lookup)
  React.useEffect(() => {
    if (rfqs.length > 0 || !loading) {
      fetchOrders();
    }
  }, [rfqs, loading, fetchOrders]);

  // ─── Derived data ────────────────────────────────────────────
  const filteredRfqs = React.useMemo(() => {
    return rfqs.filter((r) => {
      if (r.status === 'completed') return false;
      if (rfqFilter === 'cancelled_expired') {
        return r.status === 'cancelled' || r.status === 'expired';
      }
      const fid = getRfqFilterId(r.status);
      return fid === rfqFilter;
    });
  }, [rfqFilter, rfqs]);

  const filteredOrders = React.useMemo(
    () => orders.filter((o) => o.status === orderFilter),
    [orderFilter, orders],
  );

  const rfqTagCounts = React.useMemo(
    () => ({
      pending: rfqs.filter((r) => r.status === 'pending').length,
      has_quote: rfqs.filter(
        (r) => r.status === 'offers_received' || r.status === 'reviewing',
      ).length,
      cancelled_expired: rfqs.filter(
        (r) => r.status === 'cancelled' || r.status === 'expired',
      ).length,
    }),
    [rfqs],
  );

  const orderTagCounts = React.useMemo(
    () => ({
      inProduction: orders.filter((o) => o.status === 'in_production').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      completed: orders.filter((o) => o.status === 'completed').length,
    }),
    [orders],
  );

  return {
    primaryTab,
    setPrimaryTab,
    rfqFilter,
    setRfqFilter,
    orderFilter,
    setOrderFilter,
    filteredRfqs,
    filteredOrders,
    rfqTagCounts,
    orderTagCounts,
    rfqs,
    orders,
    loading,
    error,
    /** Force-refresh ทั้ง RFQ + Order จาก CRUD endpoint */
    refetch: async () => {
      setLoading(true);
      await fetchRfqs();
      await fetchOrders();
      setLoading(false);
    },
  };
}
