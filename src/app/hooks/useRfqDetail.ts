/**
 * useRfqDetail — ดึงข้อมูล RFQ + Quotations จาก CRUD endpoint
 *
 * - GET /api/v1/rfqs/:id                → ข้อมูล RFQ
 * - GET /api/v1/rfqs/:id/quotations     → ใบเสนอราคาทั้งหมด
 *
 * Token ถูกแนบอัตโนมัติผ่าน api.ts (Authorization: Bearer <token>)
 */
import React from 'react';
import { useData, type Rfq, type RfqOffer, type Order } from '../contexts/DataContext';
import { rfqsApi, ordersApi, masterApi, categoriesApi } from '../services/api';
import { summarizeRfqAddress } from '../utils/rfqAddressSummary';
import { mapOrderStatusFromApi, guessOrderProgress } from '../utils/orderCustomerStatus';

// ─── Status Code Mapping ───────────────────────────────────────
const mapRfqStatus = (code: string, hasQuotes: boolean): string => {
  switch (code.toUpperCase()) {
    case 'OP': return hasQuotes ? 'offers_received' : 'pending';
    case 'CL': return 'completed';
    case 'CC': return 'cancelled';
    default: return code.toLowerCase();
  }
};

// ─── Category Icon Mapping ─────────────────────────────────────
const CATEGORY_ICON_MAP: Record<string, string> = {
  'อาหารสัตว์': '🐾', 'อาหารเม็ดสัตว์': '🐾', 'อาหารเสริม': '💊',
  'ของเล่นสัตว์เลี้ยง': '🎾', 'เสื้อผ้าสัตว์เลี้ยง': '👕',
  'อุปกรณ์สัตว์เลี้ยง': '🦮', 'บรรจุภัณฑ์': '📦',
  'ขนมสัตว์เลี้ยง': '🍖', 'ที่นอนและบ้าน': '🏠',
  'ตู้ปลาและกรง': '🐟', 'กระเป๋าและรถเข็น': '🧳',
  'ห้องน้ำและทราย': '🚿', 'อุปกรณ์อาบน้ำ': '🧴',
};
const guessCategoryIcon = (name: string) => {
  if (CATEGORY_ICON_MAP[name]) return CATEGORY_ICON_MAP[name];
  for (const [k, v] of Object.entries(CATEGORY_ICON_MAP)) {
    if (name.includes(k) || k.includes(name)) return v;
  }
  return '📋';
};

type RawRfqDetail = {
  images?: unknown[];
  rfq: {
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
};

/** ดึงชื่อประเภทย่อยจาก payload GET /rfqs/:id (รองรับหลายรูปแบบฟิลด์ / root / nested) */
function extractSubCategoryNameFromRfqResponse(
  detailPayload: Record<string, unknown> | null,
  rawRfq: Record<string, unknown>,
): string {
  const fromRfq = String(
    rawRfq.sub_category_name ??
      rawRfq.subCategoryName ??
      rawRfq.SubCategoryName ??
      '',
  ).trim();
  if (fromRfq) return fromRfq;
  if (!detailPayload) return '';
  const fromRoot = String(
    detailPayload.sub_category_name ??
      detailPayload.subCategoryName ??
      '',
  ).trim();
  if (fromRoot) return fromRoot;
  const inner = detailPayload.rfq;
  if (inner && typeof inner === 'object') {
    const o = inner as Record<string, unknown>;
    return String(o.sub_category_name ?? o.subCategoryName ?? '').trim();
  }
  return '';
}

async function resolveSubCategoryNameById(
  rawRfq: Record<string, unknown>,
  currentName: string,
): Promise<string> {
  if (currentName) return currentName;
  const subId = Number(rawRfq.sub_category_id ?? rawRfq.subCategoryId ?? 0);
  const catId = String(rawRfq.category_id ?? '');
  if (!Number.isFinite(subId) || subId <= 0 || !catId) return '';
  try {
    const rawSubs = await categoriesApi.subCategories(catId);
    const rows = (Array.isArray(rawSubs) ? rawSubs : []) as Record<string, unknown>[];
    const row = rows.find((x) => Number(x.sub_category_id ?? x.id) === subId);
    return String(row?.name ?? '').trim();
  } catch {
    return '';
  }
}

type RawQuotation = {
  quote_id: number;
  rfq_id: number;
  factory_id: number;
  price_per_piece: number;
  mold_cost: number;
  lead_time_days: number;
  shipping_method_id: number;
  status: string;
  create_time: string;
  [key: string]: unknown;
};

export function useRfqDetail(rfqId: string | undefined) {
  const dataCtx = useData();

  // Lookup maps from DataContext (loaded via bootstrap)
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

  const [rfq, setRfq] = React.useState<Rfq | null>(null);
  const [relatedOrder, setRelatedOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  /** ข้อมูลเสริมจาก RFQ ดิบ — ใช้ factory detail / spec FACTORY_RFQ_BOARD_UX */
  const [shippingMethodId, setShippingMethodId] = React.useState<number | null>(null);
  const [addressSummary, setAddressSummary] = React.useState('');
  const [targetDays, setTargetDays] = React.useState<number | null>(null);

  // ─── Fetch RFQ detail + quotations ───────────────────────────
  const fetchDetail = React.useCallback(async () => {
    if (!rfqId) {
      setLoading(false);
      setShippingMethodId(null);
      setAddressSummary('');
      setTargetDays(null);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Fetch RFQ detail + quotations in parallel
      const [rfqRes, quotesRes] = await Promise.allSettled([
        rfqsApi.get(rfqId),
        rfqsApi.listQuotations(rfqId),
      ]);

      // Parse RFQ (+ images จาก payload เดียวกัน)
      let rawRfq: RawRfqDetail['rfq'] | null = null;
      let detailPayload: RawRfqDetail | null = null;
      if (rfqRes.status === 'fulfilled' && rfqRes.value) {
        const data = rfqRes.value as RawRfqDetail;
        detailPayload = data;
        rawRfq = data.rfq ?? (data as unknown as RawRfqDetail['rfq']);
      }

      if (!rawRfq || !rawRfq.rfq_id) {
        setError('ไม่พบข้อมูล RFQ นี้');
        setShippingMethodId(null);
        setAddressSummary('');
        setTargetDays(null);
        setLoading(false);
        return;
      }

      // Parse quotations
      let quotes: RawQuotation[] = [];
      if (quotesRes.status === 'fulfilled' && Array.isArray(quotesRes.value)) {
        quotes = quotesRes.value as RawQuotation[];
      }

      // Map to FE type
      const catName = categoryMap.get(String(rawRfq.category_id)) ?? '';
      const budget = Math.round(rawRfq.budget_per_piece * rawRfq.quantity);
      const status = mapRfqStatus(rawRfq.status, quotes.length > 0);
      const createdDate = rawRfq.created_at ? rawRfq.created_at.split('T')[0] : '';

      const rExtra = rawRfq as Record<string, unknown>;
      const deadlineRaw = String(
        rExtra.deadline ?? rExtra.target_date ?? rExtra.delivery_deadline ?? '',
      ).trim();
      const deadline =
        deadlineRaw && deadlineRaw.includes('T') ? deadlineRaw.split('T')[0] : deadlineRaw;

      const payloadRecord =
        detailPayload != null ? (detailPayload as unknown as Record<string, unknown>) : null;
      const rawRecord = rawRfq as unknown as Record<string, unknown>;
      let subCategoryName = extractSubCategoryNameFromRfqResponse(payloadRecord, rawRecord);
      subCategoryName = await resolveSubCategoryNameById(rawRecord, subCategoryName);
      const subCategoryIdNum = Number(rawRecord.sub_category_id ?? rawRecord.subCategoryId ?? 0);
      const subCategoryId =
        Number.isFinite(subCategoryIdNum) && subCategoryIdNum > 0 ? subCategoryIdNum : undefined;

      let shippingMethodName = String(rExtra.shipping_method_name ?? '').trim();
      const shipIdRaw = rExtra.shipping_method_id;
      if (!shippingMethodName && shipIdRaw != null && Number(shipIdRaw) > 0) {
        try {
          const ships = await masterApi.shippingMethods();
          const arr = (Array.isArray(ships) ? ships : []) as Record<string, unknown>[];
          const sid = Number(shipIdRaw);
          const row = arr.find((x) => Number(x.shipping_method_id ?? x.id) === sid);
          if (row) {
            shippingMethodName = String(row.method_name ?? row.name ?? '').trim();
          }
        } catch {
          /* ignore */
        }
      }

      const imageUrls: string[] = [];
      const rfqUrls = rawRfq.image_urls;
      if (Array.isArray(rfqUrls)) {
        for (const u of rfqUrls) {
          if (typeof u === 'string' && u.trim()) imageUrls.push(u.trim());
        }
      }
      if (imageUrls.length === 0 && detailPayload && Array.isArray(detailPayload.images)) {
        for (const img of detailPayload.images) {
          if (typeof img === 'string' && img) imageUrls.push(img);
          else if (img && typeof img === 'object') {
            const o = img as Record<string, unknown>;
            const u = String(o.url ?? o.image_url ?? '').trim();
            if (u) imageUrls.push(u);
          }
        }
      }

      const offers: RfqOffer[] = quotes.map((q) => ({
        id: String(q.quote_id),
        factoryId: String(q.factory_id),
        factoryName: factoryMap.get(String(q.factory_id)) ?? `โรงงาน #${q.factory_id}`,
        price: Math.round(q.price_per_piece * rawRfq!.quantity + (q.mold_cost ?? 0)),
        leadTime: q.lead_time_days,
        rating: 0,
        verified: true,
        recommended: false,
        aiReason: q.mold_cost > 0
          ? `รวมค่าแม่พิมพ์ ฿${q.mold_cost.toLocaleString()}`
          : 'ไม่มีค่าแม่พิมพ์',
        completedOrders: 0,
        responseTime: '',
        // Extra fields for BOQ
        quoteStatus: q.status,
        quotationDetail: {
          quote_id: q.quote_id,
          price_per_piece: q.price_per_piece,
          mold_cost: q.mold_cost,
          lead_time_days: q.lead_time_days,
          shipping_method: String(q.shipping_method_id),
          status: q.status === 'AC' ? 'Accepted' : q.status === 'RJ' ? 'Rejected' : 'Pending',
        },
      }));

      // Mark the best value as recommended
      if (offers.length > 0) {
        // Simple heuristic: lowest total price
        const sorted = [...offers].sort((a, b) => a.price - b.price);
        const bestId = sorted[0].id;
        for (const o of offers) {
          if (o.id === bestId) {
            (o as RfqOffer & { recommended: boolean }).recommended = true;
            (o as RfqOffer & { aiReason: string }).aiReason =
              'ราคาคุ้มค่าที่สุด — ' + (o as RfqOffer & { aiReason: string }).aiReason;
          }
        }
      }

      const mappedRfq: Rfq = {
        id: String(rawRfq.rfq_id),
        projectName: rawRfq.title,
        category: catName,
        categoryIcon: guessCategoryIcon(catName),
        status,
        offerCount: quotes.length,
        budget,
        quantity: rawRfq.quantity,
        material: '',
        deadline: deadline || '',
        createdAt: createdDate,
        description: rawRfq.details ?? '',
        imageUrls,
        offers,
        subCategoryName: subCategoryName || undefined,
        subCategoryId,
        shippingMethodName: shippingMethodName || undefined,
      };

      const shipIdNum = Number(shipIdRaw ?? 0);
      setShippingMethodId(Number.isFinite(shipIdNum) && shipIdNum > 0 ? shipIdNum : null);
      setAddressSummary(summarizeRfqAddress(rawRecord));
      const td = Number(
        rExtra.target_days ??
          rExtra.lead_time_target ??
          rExtra.customer_lead_days ??
          rExtra.delivery_days ??
          0,
      );
      setTargetDays(Number.isFinite(td) && td > 0 ? td : null);

      setRfq(mappedRfq);

      // ── Find related order ──────────────────────────────────
      // Order links via quote_id — check if any accepted quote has an order
      const acceptedQuoteIds = quotes.filter((q) => q.status === 'AC').map((q) => q.quote_id);
      if (acceptedQuoteIds.length > 0) {
        try {
          const rawOrders = (await ordersApi.list()) as Array<Record<string, unknown>> | null;
          if (Array.isArray(rawOrders)) {
            const matchingOrder = rawOrders.find((o) =>
              acceptedQuoteIds.includes(Number(o.quote_id)),
            );
            if (matchingOrder) {
              const oStatus = mapOrderStatusFromApi(String(matchingOrder.status ?? 'PR'));
              setRelatedOrder({
                id: String(matchingOrder.order_id ?? matchingOrder.id ?? ''),
                rfqId: String(rawRfq.rfq_id),
                factoryId: String(matchingOrder.factory_id ?? ''),
                factoryName: factoryMap.get(String(matchingOrder.factory_id)) ?? '',
                projectName: rawRfq.title,
                category: catName,
                status: oStatus,
                progress: guessOrderProgress(oStatus),
                totalAmount: Number(matchingOrder.total_amount ?? 0),
                depositPaid: Number(matchingOrder.deposit_amount ?? 0),
                quantity: rawRfq.quantity,
                createdAt: String(matchingOrder.created_at ?? '').split('T')[0],
                estimatedDelivery: String(matchingOrder.estimated_delivery ?? '').split('T')[0],
                timeline: [],
              });
            }
          }
        } catch { /* no orders found */ }
      }
    } catch (err) {
      console.error('[useRfqDetail] fetchDetail failed:', err);
      setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูล RFQ ได้');
    } finally {
      setLoading(false);
    }
  }, [rfqId, categoryMap, factoryMap]);

  // Initial fetch
  React.useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // ─── Accept offer flow ───────────────────────────────────────
  const acceptOffer = React.useCallback(
    async (quoteId: string): Promise<{ orderId?: string }> => {
      // POST /orders เท่านั้น — BE accept quote + reject siblings + close RFQ + สร้าง order PP (ไม่ PATCH quotation ก่อน)
      let orderId: string | undefined;
      const created = (await ordersApi.create(Number(quoteId))) as Record<string, unknown>;
      const oid = created.order_id ?? created.id;
      if (oid != null) orderId = String(oid);

      await fetchDetail();

      return { orderId };
    },
    [fetchDetail],
  );

  return {
    rfq,
    relatedOrder,
    loading,
    error,
    refetch: fetchDetail,
    acceptOffer,
    shippingMethodId,
    addressSummary,
    targetDays,
  };
}
