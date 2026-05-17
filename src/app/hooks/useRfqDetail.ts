/**
 * useRfqDetail — ดึงข้อมูล RFQ + Quotations จาก CRUD endpoint
 *
 * - GET /api/v1/rfqs/:id                → ข้อมูล RFQ
 * - GET /api/v1/rfqs/:id/quotations     → ใบเสนอราคาทั้งหมด
 *
 * Token ถูกแนบอัตโนมัติผ่าน api.ts (Authorization: Bearer <token>)
 */
import React from 'react';
import { useData, type Rfq, type RfqOffer, type Order } from '@/stores';
import { rfqsApi, ordersApi, masterApi, categoriesApi } from '@/services/api';
import { summarizeRfqAddress } from '@/utils/rfqAddressSummary';
import { mapOrderStatusFromApi, guessOrderProgress } from '@/utils/orderCustomerStatus';

// ─── Status Code Mapping ───────────────────────────────────────
// hasAccepted = มี quotation status AC อย่างน้อย 1 ใบ (แสดงว่า order ถูกสร้างแล้ว)
const mapRfqStatus = (code: string, hasQuotes: boolean, hasAccepted: boolean): string => {
  switch (code.toUpperCase()) {
    case 'OP':
      return hasQuotes ? 'offers_received' : 'pending';
    case 'CL':
      return hasAccepted ? 'completed' : 'expired';
    case 'CC':
      return 'cancelled';
    default:
      return code.toLowerCase();
  }
};

// ─── Category Icon Mapping ─────────────────────────────────────
const CATEGORY_ICON_MAP: Record<string, string> = {
  อาหารสัตว์: '🐾',
  อาหารเม็ดสัตว์: '🐾',
  อาหารเสริม: '💊',
  ของเล่นสัตว์เลี้ยง: '🎾',
  เสื้อผ้าสัตว์เลี้ยง: '👕',
  อุปกรณ์สัตว์เลี้ยง: '🦮',
  บรรจุภัณฑ์: '📦',
  ขนมสัตว์เลี้ยง: '🍖',
  ที่นอนและบ้าน: '🏠',
  ตู้ปลาและกรง: '🐟',
  กระเป๋าและรถเข็น: '🧳',
  ห้องน้ำและทราย: '🚿',
  อุปกรณ์อาบน้ำ: '🧴',
};
const guessCategoryIcon = (name: string) => {
  if (CATEGORY_ICON_MAP[name]) return CATEGORY_ICON_MAP[name];
  for (const [k, v] of Object.entries(CATEGORY_ICON_MAP)) {
    if (name.includes(k) || k.includes(name)) return v;
  }
  return '📋';
};

function collectUrlsFromUnknown(input: unknown): string[] {
  if (input == null) return [];
  // JSON text support
  if (typeof input === 'string') {
    const raw = input.trim();
    if (!raw) return [];
    if (raw.startsWith('[') || raw.startsWith('{')) {
      try {
        return collectUrlsFromUnknown(JSON.parse(raw));
      } catch {
        return [];
      }
    }
    return [];
  }
  if (Array.isArray(input)) {
    const out: string[] = [];
    for (const item of input) {
      if (typeof item === 'string') {
        const u = item.trim();
        if (u) out.push(u);
        continue;
      }
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        const u = String(o.url ?? o.image_url ?? o.public_url ?? '').trim();
        if (u) out.push(u);
      }
    }
    return out;
  }
  if (typeof input === 'object') {
    // sometimes BE may wrap as { images: [...] } or { reference_images: [...] }
    const o = input as Record<string, unknown>;
    return [
      ...collectUrlsFromUnknown(o.images),
      ...collectUrlsFromUnknown(o.image_urls),
      ...collectUrlsFromUnknown(o.reference_images),
    ];
  }
  return [];
}

function numberOrNull(...candidates: unknown[]): number | null {
  for (const candidate of candidates) {
    if (candidate == null) continue;
    const n = Number(candidate);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function firstNonEmptyString(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const s = String(candidate ?? '').trim();
    if (s) return s;
  }
  return '';
}

function collectStringArrayFromUnknown(input: unknown): string[] {
  if (input == null) return [];
  if (typeof input === 'string') {
    const raw = input.trim();
    if (!raw) return [];
    if (raw.startsWith('[') || raw.startsWith('{')) {
      try {
        return collectStringArrayFromUnknown(JSON.parse(raw));
      } catch {
        return [raw];
      }
    }
    return [raw];
  }
  if (Array.isArray(input)) {
    return input.map((x) => String(x ?? '').trim()).filter(Boolean);
  }
  if (typeof input === 'object') {
    const o = input as Record<string, unknown>;
    return [
      ...collectStringArrayFromUnknown(o.items),
      ...collectStringArrayFromUnknown(o.values),
      ...collectStringArrayFromUnknown(o.certifications_required),
    ];
  }
  return [];
}

function formatDimensionSpec(input: unknown): string {
  if (!input) return '';
  if (typeof input === 'string') return input.trim();
  if (typeof input === 'object') {
    const o = input as Record<string, unknown>;
    const l = numberOrNull(o.L, o.l, o.length);
    const w = numberOrNull(o.W, o.w, o.width);
    const h = numberOrNull(o.H, o.h, o.height);
    const u = firstNonEmptyString(o.unit, 'mm');
    if (l != null && w != null && h != null) return `${l} x ${w} x ${h} ${u}`;
  }
  return '';
}

type RawRfqDetail = {
  images?: unknown[];
  rfq: {
    rfq_id: number;
    user_id: number;
    category_id: number;
    title: string;
    quantity: number;
    unit?: string;
    budget_per_piece?: number; // backward compatibility
    target_price?: number;
    details?: string;
    description?: string;
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
    rawRfq.sub_category_name ?? rawRfq.subCategoryName ?? rawRfq.SubCategoryName ?? '',
  ).trim();
  if (fromRfq) return fromRfq;
  if (!detailPayload) return '';
  const fromRoot = String(
    detailPayload.sub_category_name ?? detailPayload.subCategoryName ?? '',
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
  validity_days?: number;
  image_urls?: unknown;
  shipping_cost?: number;
  packaging_cost?: number;
  tooling_mold_cost?: number;
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
  /** quoteId → orderId สำหรับ multi-factory: แต่ละ AC quote มี order ของตัวเอง */
  const [quoteOrderMap, setQuoteOrderMap] = React.useState<Record<string, string>>({});
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
        const data = rfqRes.value as unknown as RawRfqDetail;
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
      if (quotesRes.status === 'fulfilled') {
        const raw = quotesRes.value as unknown;
        if (Array.isArray(raw)) {
          quotes = raw as RawQuotation[];
        } else if (raw && typeof raw === 'object') {
          const obj = raw as Record<string, unknown>;
          const nested = obj.quotations ?? obj.data ?? obj.items ?? obj.results;
          if (Array.isArray(nested)) {
            quotes = nested as RawQuotation[];
          }
        }
      }

      // Map to FE type
      const rExtra = rawRfq as Record<string, unknown>;
      const quantity = Math.max(0, Math.round(numberOrNull(rawRfq.quantity, rExtra.qty) ?? 0));
      const budgetPerPiece = numberOrNull(rawRfq.budget_per_piece, rExtra.budgetPerPiece);
      const budgetTotalExplicit = numberOrNull(
        rExtra.total_budget,
        rExtra.target_total_budget,
        rExtra.budget_total,
        rExtra.target_price, // FE currently uses this field for "งบประมาณรวม"
      );
      const budgetFallback = budgetPerPiece != null ? budgetPerPiece * quantity : 0;
      const budget = Math.max(0, Math.round(budgetTotalExplicit ?? budgetFallback ?? 0));
      const catName = categoryMap.get(String(rawRfq.category_id)) ?? '';
      const hasAcceptedQuote = quotes.some((q) => String(q.status ?? '').toUpperCase() === 'AC');
      const status = mapRfqStatus(rawRfq.status, quotes.length > 0, hasAcceptedQuote);
      const createdDate = rawRfq.created_at ? rawRfq.created_at.split('T')[0] : '';

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

      const imageUrls = Array.from(
        new Set(
          [
            ...collectUrlsFromUnknown(rawRecord.reference_images),
            ...collectUrlsFromUnknown(rawRecord.image_urls),
            ...collectUrlsFromUnknown(rawRecord.images),
            ...collectUrlsFromUnknown(payloadRecord?.reference_images),
            ...collectUrlsFromUnknown(payloadRecord?.image_urls),
            ...collectUrlsFromUnknown(payloadRecord?.images),
            ...collectUrlsFromUnknown(payloadRecord?.rfq),
          ].filter((u) => typeof u === 'string' && u.trim() !== ''),
        ),
      ).slice(0, 5);

      const materialGrade = firstNonEmptyString(rExtra.material_grade, rExtra.materialGrade);
      const tolerance = firstNonEmptyString(rExtra.tolerance);
      const colorFinish = firstNonEmptyString(rExtra.color_finish, rExtra.colorFinish);
      const dimensionSpec = formatDimensionSpec(rExtra.dimension_spec ?? rExtra.dimensionSpec);
      const weightTargetG = numberOrNull(rExtra.weight_target_g, rExtra.weightTargetG);
      const packagingSpec = firstNonEmptyString(rExtra.packaging_spec, rExtra.packagingSpec);
      const targetLeadTimeDaysRaw = numberOrNull(
        rExtra.target_lead_time_days,
        rExtra.target_days,
        rExtra.lead_time_target,
        rExtra.customer_lead_days,
        rExtra.delivery_days,
      );
      const targetLeadTimeDays =
        targetLeadTimeDaysRaw != null && targetLeadTimeDaysRaw > 0
          ? Math.round(targetLeadTimeDaysRaw)
          : undefined;
      const requiredDeliveryDate = firstNonEmptyString(
        rExtra.required_delivery_date,
        rExtra.requiredDeliveryDate,
        rExtra.target_date,
        rExtra.delivery_deadline,
      );
      const normalizedRequiredDeliveryDate =
        requiredDeliveryDate && requiredDeliveryDate.includes('T')
          ? requiredDeliveryDate.split('T')[0]
          : requiredDeliveryDate;
      const description = firstNonEmptyString(rExtra.details, rExtra.description);
      const certificationsRequired = Array.from(
        new Set(
          collectStringArrayFromUnknown(
            rExtra.certifications_required ?? rExtra.certificationsRequired,
          ),
        ),
      );
      const sampleRequired = Boolean(rExtra.sample_required ?? rExtra.sampleRequired);
      const sampleQtyRaw = numberOrNull(rExtra.sample_qty, rExtra.sampleQty);
      const sampleQty =
        sampleQtyRaw != null && sampleQtyRaw > 0 ? Math.round(sampleQtyRaw) : undefined;
      const inspectionType = firstNonEmptyString(rExtra.inspection_type, rExtra.inspectionType);
      const deliveryAddress = summarizeRfqAddress(rawRecord);

      const offers: RfqOffer[] = quotes.map((q) => ({
        ...(() => {
          const qty = Math.max(0, Number(rawRfq!.quantity ?? 0));
          const pricePerPiece = Number(q.price_per_piece ?? 0);
          const subtotalRaw = Number(q.subtotal ?? 0);
          const subtotal = subtotalRaw > 0 ? subtotalRaw : Math.max(0, pricePerPiece * qty);
          const shippingCost = Number(q.shipping_cost ?? 0);
          const packagingCost = Number(q.packaging_cost ?? 0);
          const toolingMoldCost = Number(q.tooling_mold_cost ?? q.mold_cost ?? 0);
          const discountAmount = Number(q.discount_amount ?? 0);
          const vatRate = Number(q.vat_rate ?? 0);
          const vatAmountRaw = Number(q.vat_amount ?? 0);
          const vatAmount =
            vatAmountRaw > 0
              ? vatAmountRaw
              : Math.max(
                  0,
                  ((subtotal - discountAmount + shippingCost + packagingCost + toolingMoldCost) *
                    vatRate) /
                    100,
                );
          const computedGrandTotal = Math.max(
            0,
            subtotal - discountAmount + shippingCost + packagingCost + toolingMoldCost + vatAmount,
          );
          const grandTotal =
            Number(q.grand_total ?? 0) > 0 ? Number(q.grand_total ?? 0) : computedGrandTotal;
          const platformCommissionRate = Number(q.platform_commission_rate ?? 0);
          const platformCommissionAmountRaw = Number(q.platform_commission_amount ?? 0);
          const platformCommissionAmount =
            platformCommissionAmountRaw > 0
              ? platformCommissionAmountRaw
              : Math.max(0, (grandTotal * platformCommissionRate) / 100);
          const factoryNet =
            Number(q.factory_net_receivable ?? 0) > 0
              ? Number(q.factory_net_receivable ?? 0)
              : Math.max(0, grandTotal - platformCommissionAmount);

          return {
            id: String(q.quote_id),
            factoryId: String(q.factory_id),
            factoryName: factoryMap.get(String(q.factory_id)) ?? `โรงงาน #${q.factory_id}`,
            price: Math.round(grandTotal),
            leadTime: q.lead_time_days,
            rating: 0,
            verified: true,
            recommended: false,
            aiReason: `เสนอราคาเมื่อ ${q.create_time ? new Date(String(q.create_time)).toLocaleDateString('th-TH') : '-'}`,
            factoryHighlight: String(q.factory_highlight ?? '').trim(),
            completedOrders: 0,
            responseTime: '',
            // Extra fields for BOQ
            quoteStatus: q.status,
            quotationDetail: {
              quote_id: q.quote_id,
              factory_name: factoryMap.get(String(q.factory_id)) ?? `โรงงาน #${q.factory_id}`,
              price_per_piece: q.price_per_piece,
              mold_cost: toolingMoldCost,
              moq: qty > 0 ? qty : undefined,
              lead_time_days: q.lead_time_days,
              shipping_method:
                shippingMethodName || `วิธีจัดส่ง #${String(q.shipping_method_id ?? '-')}`,
              image_urls: collectUrlsFromUnknown(q.image_urls),
              sample_cost: 0,
              status:
                q.status === 'AC'
                  ? 'Accepted'
                  : q.status === 'RJ'
                    ? 'Rejected'
                    : q.status === 'EX'
                      ? 'Expired'
                      : 'Pending',
              valid_until:
                q.valid_until != null && String(q.valid_until).trim() ? String(q.valid_until) : '',
              validity_days: Number.isFinite(Number(q.validity_days)) ? Number(q.validity_days) : 0,
              subtotal,
              discount_amount: discountAmount,
              shipping_cost: shippingCost,
              packaging_cost: packagingCost,
              tooling_mold_cost: toolingMoldCost,
              vat_rate: vatRate,
              vat_amount: vatAmount,
              grand_total: grandTotal,
              platform_commission_rate: platformCommissionRate,
              platform_commission_amount: platformCommissionAmount,
              factory_net_receivable: factoryNet,
              certifications: [],
            },
          };
        })(),
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
        quantity,
        material: materialGrade || '',
        deadline: deadline || '',
        createdAt: createdDate,
        description,
        imageUrls,
        offers,
        subCategoryName: subCategoryName || undefined,
        subCategoryId,
        shippingMethodName: shippingMethodName || undefined,
        deliveryAddress: deliveryAddress || undefined,
        materialGrade: materialGrade || undefined,
        tolerance: tolerance || undefined,
        colorFinish: colorFinish || undefined,
        dimensionSpec: dimensionSpec || undefined,
        weightTargetG: weightTargetG != null && weightTargetG > 0 ? weightTargetG : undefined,
        packagingSpec: packagingSpec || undefined,
        targetLeadTimeDays,
        requiredDeliveryDate: normalizedRequiredDeliveryDate || undefined,
        certificationsRequired:
          certificationsRequired.length > 0 ? certificationsRequired : undefined,
        sampleRequired,
        sampleQty,
        inspectionType: inspectionType || undefined,
      };

      const shipIdNum = Number(shipIdRaw ?? 0);
      setShippingMethodId(Number.isFinite(shipIdNum) && shipIdNum > 0 ? shipIdNum : null);
      setAddressSummary(deliveryAddress);
      const td = Number(
        rExtra.target_days ??
          rExtra.lead_time_target ??
          rExtra.customer_lead_days ??
          rExtra.delivery_days ??
          0,
      );
      setTargetDays(Number.isFinite(td) && td > 0 ? td : null);

      setRfq(mappedRfq);

      // ── Find related orders (multi-factory) ──────────────────
      // Build quoteId → orderId map จาก AC quotes ทั้งหมด
      const acceptedQuoteIds = quotes.filter((q) => q.status === 'AC').map((q) => q.quote_id);
      const newQuoteOrderMap: Record<string, string> = {};
      if (acceptedQuoteIds.length > 0) {
        try {
          const rawOrders = (await ordersApi.list()) as Array<Record<string, unknown>> | null;
          if (Array.isArray(rawOrders)) {
            // Build full quoteId → orderId map (รองรับหลายโรงงาน)
            for (const o of rawOrders) {
              const oqid = Number(o.quote_id);
              if (acceptedQuoteIds.includes(oqid)) {
                const oid = String(o.order_id ?? o.id ?? '');
                if (oid) newQuoteOrderMap[String(oqid)] = oid;
              }
            }
            // compat: set relatedOrder = first matching order
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
        } catch {
          /* no orders found */
        }
      }
      setQuoteOrderMap(newQuoteOrderMap);

      // Inject orderId ลง offers เพื่อให้ card แสดง "ดูคำสั่งซื้อ" ได้
      for (const offer of offers) {
        if ((offer.quoteStatus ?? '').toUpperCase() === 'AC') {
          (offer as RfqOffer & { orderId?: string }).orderId = newQuoteOrderMap[offer.id];
        }
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
      // POST /orders — BE accept quote + create order PP
      // Multi-factory: ไม่ reject siblings ไม่ปิด RFQ
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
    quoteOrderMap,
    loading,
    error,
    refetch: fetchDetail,
    acceptOffer,
    shippingMethodId,
    addressSummary,
    targetDays,
  };
}
