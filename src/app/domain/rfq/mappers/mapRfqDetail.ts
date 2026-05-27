import { type Rfq, type RfqOffer, type Order } from '@/stores/types';
import { rfqsApi } from '@/services/api/rfqApi';
import type { IQuotationHistoryEntry } from '@/services/api/types/rfq.types';
import { ordersApi } from '@/services/api/ordersApi';
import { masterApi, categoriesApi } from '@/services/api/masterApi';
import { guessCategoryIcon } from '@/domain/shared/categoryIcons';
import { mapRfqStatusFromApi } from '@/domain/rfq/status';
import { mapOrderStatusFromApi, guessOrderProgressFromStep } from '@/domain/order/status';
import { summarizeRfqAddress } from '@/utils/rfqAddressSummary';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

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
        const u = pickScalarString(o.url, o.image_url, o.public_url);
        if (u) out.push(u);
      }
    }
    return out;
  }
  if (typeof input === 'object') {
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
  return pickScalarNumber(...candidates);
}

function firstNonEmptyString(...candidates: unknown[]): string {
  return pickScalarString(...candidates);
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
    return input.map((x) => pickScalarString(x)).filter(Boolean);
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
  const fromRfq = pickScalarString(
    rawRfq.sub_category_name,
    rawRfq.subCategoryName,
    rawRfq.SubCategoryName,
  );
  if (fromRfq) return fromRfq;
  if (!detailPayload) return '';
  const fromRoot = pickScalarString(detailPayload.sub_category_name, detailPayload.subCategoryName);
  if (fromRoot) return fromRoot;
  const inner = detailPayload.rfq;
  if (inner && typeof inner === 'object') {
    const o = inner as Record<string, unknown>;
    return pickScalarString(o.sub_category_name, o.subCategoryName);
  }
  return '';
}

async function resolveSubCategoryNameById(
  rawRfq: Record<string, unknown>,
  currentName: string,
): Promise<string> {
  if (currentName) return currentName;
  const subId = Number(rawRfq.sub_category_id ?? rawRfq.subCategoryId ?? 0);
  const catId = pickScalarString(rawRfq.category_id);
  if (!Number.isFinite(subId) || subId <= 0 || !catId) return '';
  try {
    const rawSubs = await categoriesApi.subCategories(catId);
    const rows = Array.isArray(rawSubs) ? rawSubs : [];
    const row = rows.find((x) => Number(x.sub_category_id ?? x.id) === subId);
    return pickScalarString(row?.name, row?.sub_category_name);
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

export type RfqDetailData = {
  rfq: Rfq | null;
  relatedOrder: Order | null;
  /** quoteId → orderId สำหรับ multi-factory: แต่ละ AC quote มี order ของตัวเอง */
  quoteOrderMap: Record<string, string>;
  /** quoteId → history entries — pre-fetched from bundle endpoint */
  quoteHistories: Record<string, IQuotationHistoryEntry[]>;
  shippingMethodId: number | null;
  addressSummary: string;
  targetDays: number | null;
};

export const EMPTY_RFQ_DETAIL: RfqDetailData = {
  rfq: null,
  relatedOrder: null,
  quoteOrderMap: {},
  quoteHistories: {},
  shippingMethodId: null,
  addressSummary: '',
  targetDays: null,
};

export async function fetchAndMapRfqDetail(
  rfqId: string,
  categoryMap: Map<string, string>,
  factoryMap: Map<string, string>,
): Promise<RfqDetailData> {
  // Single bundle call — replaces GET /rfqs/:id + GET /rfqs/:id/quotations + N×GET /quotations/:id/history
  const bundle = await rfqsApi.getDetail(rfqId);
  const bundleObj = bundle as unknown as Record<string, unknown>;

  let rawRfq: RawRfqDetail['rfq'] | null = null;
  let detailPayload: RawRfqDetail | null = null;
  if (bundleObj.rfq) {
    const data = { rfq: bundleObj.rfq } as unknown as RawRfqDetail;
    detailPayload = data;
    rawRfq = data.rfq ?? (bundleObj.rfq as unknown as RawRfqDetail['rfq']);
  }

  if (!rawRfq || !rawRfq.rfq_id) {
    throw new Error('ไม่พบข้อมูล RFQ นี้');
  }

  // Parse quotations
  let quotes: RawQuotation[] = [];
  const rawQuotes = bundleObj.quotations;
  if (Array.isArray(rawQuotes)) {
    quotes = rawQuotes as RawQuotation[];
  }

  // Pre-fetched histories keyed by quote_id string
  const quoteHistories: Record<string, IQuotationHistoryEntry[]> =
    (bundleObj.quote_histories as Record<string, IQuotationHistoryEntry[]> | undefined) ?? {};

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
  const rawCategoryId = pickScalarString(rawRfq.category_id);
  const catName = categoryMap.get(rawCategoryId) ?? '';
  const hasAcceptedQuote = quotes.some((q) => pickScalarString(q.status).toUpperCase() === 'AC');
  const status = mapRfqStatusFromApi(rawRfq.status, {
    quoteCount: quotes.length,
    hasAcceptedQuote,
  });
  const createdDate = rawRfq.created_at ? rawRfq.created_at.split('T')[0] : '';

  const deadlineRaw = pickScalarString(
    rExtra.deadline,
    rExtra.target_date,
    rExtra.delivery_deadline,
  );
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

  let shippingMethodName = pickScalarString(rExtra.shipping_method_name);
  const shipIdRaw = rExtra.shipping_method_id;
  if (!shippingMethodName && shipIdRaw != null && Number(shipIdRaw) > 0) {
    try {
      const ships = await masterApi.getShippingMethods();
      const sid = Number(shipIdRaw);
      const row = (Array.isArray(ships) ? ships : []).find(
        (x) => Number(x.shipping_method_id ?? x.id) === sid,
      );
      if (row) {
        shippingMethodName = pickScalarString(row.method_name, row.name_th, row.name);
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
        factoryName: pickScalarString(q.factory_name) || factoryMap.get(pickScalarString(q.factory_id)) || `โรงงาน #${q.factory_id}`,
        price: Math.round(grandTotal),
        leadTime: q.lead_time_days,
        rating: 0,
        verified: true,
        recommended: false,
        aiReason: `เสนอราคาเมื่อ ${q.create_time ? new Date(pickScalarString(q.create_time)).toLocaleDateString('th-TH') : '-'}`,
        factoryHighlight: pickScalarString(q.factory_highlight),
        completedOrders: 0,
        responseTime: '',

        quoteStatus: q.status,
        quotationDetail: {
          quote_id: q.quote_id,
          factory_name: pickScalarString(q.factory_name) || factoryMap.get(pickScalarString(q.factory_id)) || `โรงงาน #${q.factory_id}`,
          price_per_piece: q.price_per_piece,
          mold_cost: toolingMoldCost,
          moq: qty > 0 ? qty : undefined,
          lead_time_days: q.lead_time_days,
          shipping_method:
            shippingMethodName || `วิธีจัดส่ง #${pickScalarString(q.shipping_method_id, '-')}`,
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
            q.valid_until != null && pickScalarString(q.valid_until)
              ? pickScalarString(q.valid_until)
              : '',
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
    certificationsRequired: certificationsRequired.length > 0 ? certificationsRequired : undefined,
  };

  const shipIdNum = pickScalarNumber(shipIdRaw) ?? 0;
  const shippingMethodId = Number.isFinite(shipIdNum) && shipIdNum > 0 ? shipIdNum : null;
  const addressSummary = deliveryAddress;
  const td = Number(
    rExtra.target_days ??
      rExtra.lead_time_target ??
      rExtra.customer_lead_days ??
      rExtra.delivery_days ??
      0,
  );
  const targetDays = Number.isFinite(td) && td > 0 ? td : null;

  // Build quoteId → orderId map จาก AC quotes ทั้งหมด
  const acceptedQuoteIds = quotes.filter((q) => q.status === 'AC').map((q) => q.quote_id);
  const quoteOrderMap: Record<string, string> = {};
  let relatedOrder: Order | null = null;
  if (acceptedQuoteIds.length > 0) {
    try {
      const rawOrders = await ordersApi.list();
      for (const o of rawOrders) {
        if (acceptedQuoteIds.includes(o.quote_id)) {
          quoteOrderMap[String(o.quote_id)] = String(o.order_id);
        }
      }
      const matchingOrder = rawOrders.find((o) => acceptedQuoteIds.includes(o.quote_id));
      if (matchingOrder) {
        const oStatus = mapOrderStatusFromApi(pickScalarString(matchingOrder.status) || 'PR');
        relatedOrder = {
          id: String(matchingOrder.order_id),
          rfqId: String(rawRfq.rfq_id),
          factoryId: String(matchingOrder.factory_id),
          factoryName: factoryMap.get(pickScalarString(matchingOrder.factory_id)) ?? '',
          projectName: rawRfq.title,
          category: catName,
          status: oStatus,
          progress: guessOrderProgressFromStep(undefined, oStatus),
          totalAmount: matchingOrder.total_amount,
          depositPaid: matchingOrder.deposit_amount,
          quantity: rawRfq.quantity,
          createdAt: matchingOrder.created_at.split('T')[0],
          estimatedDelivery: pickScalarString(matchingOrder.estimated_delivery).split('T')[0],
          timeline: [],
        };
      }
    } catch {
      /* no orders found */
    }
  }

  for (const offer of offers) {
    if ((offer.quoteStatus ?? '').toUpperCase() === 'AC') {
      (offer as RfqOffer & { orderId?: string }).orderId = quoteOrderMap[offer.id];
    }
  }

  return {
    rfq: mappedRfq,
    relatedOrder,
    quoteOrderMap,
    quoteHistories,
    shippingMethodId,
    addressSummary,
    targetDays,
  };
}
