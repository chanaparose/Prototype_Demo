import type { Factory, RfqOffer, Rfq, Conversation } from './types';
import { normalizeFactoryRow } from '../utils/normalizeFactoryRow';
import { mapOrderStatusFromApi, guessOrderProgress } from '../utils/orderCustomerStatus';

export { normalizeFactoryRow, mapOrderStatusFromApi, guessOrderProgress };

const CATEGORY_ICON_MAP: Record<string, string> = {
  'อาหารสัตว์': '🐾',
  'อาหารเม็ดสัตว์': '🐾',
  'อาหารเสริม': '💊',
  'ของเล่นสัตว์เลี้ยง': '🎾',
  'เสื้อผ้าสัตว์เลี้ยง': '👕',
  'เสื้อผ้า/สิ่งทอ': '👕',
  'อุปกรณ์สัตว์เลี้ยง': '🦮',
  'สายจูง อุปกรณ์': '🦮',
  'บรรจุภัณฑ์': '📦',
  'แพ็กเกจจิ้ง': '📦',
  'เครื่องสำอาง': '✨',
  'อุปกรณ์อาบน้ำ': '🧴',
  'เฟอร์นิเจอร์': '🏠',
  'ที่นอนและบ้าน': '🏠',
  'พลาสติก': '🔩',
  'ขนมสัตว์เลี้ยง': '🍖',
  'ตู้ปลาและกรง': '🐟',
  'กระเป๋าและรถเข็น': '🧳',
  'ห้องน้ำและทราย': '🚿',
};

export function guessCategoryIcon(catName: string): string {
  if (!catName) return '📋';
  if (CATEGORY_ICON_MAP[catName]) return CATEGORY_ICON_MAP[catName];
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (catName.includes(key) || key.includes(catName)) return icon;
  }
  return '📋';
}

export function mapConversationRowsFromApi(rawConvs: Record<string, unknown>[]): Conversation[] {
  return rawConvs
    .map((r) => ({
      id: String(r.conversation_id ?? r.id ?? ''),
      factoryId: String(r.factory_id ?? r.factoryId ?? ''),
      rfqId: String(r.rfq_id ?? r.rfqId ?? ''),
      factoryName: String(r.factory_name ?? r.factoryName ?? ''),
      factoryAvatar: String(r.factory_avatar ?? r.factoryAvatar ?? ''),
      rfqName: String(r.rfq_name ?? r.rfqName ?? ''),
      lastMessage: String(r.last_message ?? r.lastMessage ?? ''),
      time: String(r.updated_at ?? r.time ?? ''),
      unread: Number(r.unread_count ?? r.unread ?? 0),
      hasQuote: Boolean(r.has_quote ?? r.hasQuote ?? false),
      messages: [],
    }))
    .filter((c) => c.id);
}

function mergeFrontendRfqPayload(api: Record<string, unknown>): Record<string, unknown> {
  const rfqPart =
    api.rfq && typeof api.rfq === 'object' && !Array.isArray(api.rfq)
      ? (api.rfq as Record<string, unknown>)
      : api;
  const rawList =
    (Array.isArray(api.quotations) && api.quotations) ||
    (Array.isArray(api.offers) && api.offers) ||
    (Array.isArray(rfqPart.quotations) && rfqPart.quotations) ||
    (Array.isArray(rfqPart.offers) && rfqPart.offers) ||
    [];
  return { ...rfqPart, offers: rawList };
}

function mapApiRfqStatus(rawStatus: string, offerCount: number): string {
  const u = String(rawStatus || '').toUpperCase();
  if (u === 'CL') return 'completed';
  if (u === 'CC') return 'cancelled';
  if (u === 'EX' || u === 'EXPIRED') return 'expired';
  if (u === 'OP' || u === 'OPEN' || u === '') {
    return offerCount > 0 ? 'offers_received' : 'pending';
  }
  const lower = String(rawStatus).toLowerCase();
  const known = ['pending', 'offers_received', 'reviewing', 'completed', 'cancelled', 'expired'];
  if (known.includes(lower)) return lower;
  return lower || 'pending';
}

function mapRowToRfqOffer(
  q: Record<string, unknown>,
  quantity: number,
  factories: Factory[],
): RfqOffer | null {
  const id = String(q.quote_id ?? q.quotation_id ?? q.quoteId ?? q.id ?? '');
  if (!id) return null;
  const fid = String(q.factory_id ?? q.factoryId ?? '');
  const factory = factories.find((f) => f.id === fid);
  const explicitPrice = Number(q.price ?? q.total_price ?? 0);
  const pricePerPiece = Number(q.price_per_piece ?? 0);
  const mold = Number(q.mold_cost ?? 0);
  const price =
    explicitPrice > 0 ? explicitPrice : pricePerPiece * quantity + mold;
  const st = String(q.status ?? 'PD').toUpperCase();
  return {
    id,
    factoryId: fid,
    factoryName: String(q.factory_name ?? q.factoryName ?? factory?.name ?? 'โรงงาน'),
    price,
    leadTime: Number(q.lead_time_days ?? q.leadTime ?? 0),
    rating: Number(q.rating ?? factory?.rating ?? 0),
    verified: Boolean(q.verified ?? factory?.verified ?? false),
    recommended: false,
    aiReason: String(q.ai_reason ?? q.aiReason ?? q.notes ?? ''),
    completedOrders: Number(q.completed_orders ?? factory?.completedOrders ?? 0),
    responseTime: String(q.response_time ?? q.responseTime ?? '—'),
    quoteStatus: st,
  };
}

function applyRecommendedFlags(offers: RfqOffer[]): RfqOffer[] {
  const pending = offers.filter((o) => !o.quoteStatus || o.quoteStatus === 'PD');
  if (pending.length === 0) return offers.map((o) => ({ ...o, recommended: false }));
  const prices = pending.map((o) => o.price).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  return offers.map((o) => {
    const isP = !o.quoteStatus || o.quoteStatus === 'PD';
    return {
      ...o,
      recommended: isP && minPrice > 0 && o.price === minPrice,
    };
  });
}

function parseRfqImageList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      const s = item.trim();
      if (s) out.push(s);
      continue;
    }
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const o = item as Record<string, unknown>;
      const u = o.image_url ?? o.imageUrl ?? o.url ?? o.src ?? o.public_url ?? o.publicUrl;
      if (typeof u === 'string' && u.trim()) out.push(u.trim());
    }
  }
  return out;
}

function extractRfqImageUrls(apiRoot: Record<string, unknown>, row: Record<string, unknown>): string[] {
  const nested =
    apiRoot.rfq && typeof apiRoot.rfq === 'object' && !Array.isArray(apiRoot.rfq)
      ? (apiRoot.rfq as Record<string, unknown>)
      : null;
  for (const src of [
    row.reference_images,
    nested?.reference_images,
    apiRoot.reference_images,
    row.image_urls,
    nested?.image_urls,
    apiRoot.image_urls,
    row.images,
    apiRoot.images,
    nested?.images,
  ]) {
    const urls = parseRfqImageList(src);
    if (urls.length > 0) return urls;
  }
  return [];
}

export function normalizeRfqRecord(
  r: Record<string, unknown>,
  factories: Factory[],
  guessIcon: (catName: string) => string = guessCategoryIcon,
): Rfq {
  const row = mergeFrontendRfqPayload(r);
  const imageUrls = extractRfqImageUrls(r, row);
  const cat = String(row.category ?? row.category_name ?? '');
  const qty = Number(row.quantity ?? 0);
  const rawOffers = row.offers ?? row.quotations ?? [];
  const rows = Array.isArray(rawOffers) ? (rawOffers as Record<string, unknown>[]) : [];
  let offers = rows
    .map((q) => mapRowToRfqOffer(q, qty, factories))
    .filter((o): o is RfqOffer => o != null);
  offers = applyRecommendedFlags(offers);
  const offerCount = Number(row.offer_count ?? row.offerCount ?? offers.length);
  const effCount = Math.max(offerCount, offers.length);
  const status = mapApiRfqStatus(String(row.status ?? ''), effCount);
  const totalBudget = Number(
    row.target_price ?? row.budget_total ?? row.total_budget ?? row.budget ?? 0,
  );
  const budgetPerPiece = Number(row.budget_per_piece ?? 0);
  const budget =
    (Number.isFinite(totalBudget) && totalBudget > 0 ? totalBudget : 0) ||
    (budgetPerPiece > 0 && qty > 0 ? budgetPerPiece * qty : 0);
  return {
    id: String(row.rfq_id ?? row.id ?? ''),
    projectName: String(row.projectName ?? row.title ?? row.project_name ?? ''),
    category: cat,
    categoryIcon: String(row.categoryIcon ?? row.category_icon ?? '') || guessIcon(cat),
    status,
    offerCount: effCount,
    budget,
    quantity: qty,
    material: String(row.material ?? ''),
    deadline: String(row.deadline ?? ''),
    createdAt: String(row.createdAt ?? row.created_at ?? ''),
    description: String(row.description ?? row.details ?? ''),
    imageUrls,
    offers,
  };
}
