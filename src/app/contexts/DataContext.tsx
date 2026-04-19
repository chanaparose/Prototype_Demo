/**
 * DataContext — Global data store fetched from API
 *
 * Data is loaded after authentication from various /frontend/* endpoints.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  frontendApi,
  categoriesApi,
  showcasesApi,
  notificationsApi,
  conversationsApi,
  rfqsApi,
} from '../services/api';
import { normalizeFactoryRow } from '../utils/normalizeFactoryRow';
import { mapOrderStatusFromApi, guessOrderProgress } from '../utils/orderCustomerStatus';

// ─── Types ──────────────────────────────────────────────────────
export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type Factory = {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  specialization: string;
  tags: string[];
  minOrder: number;
  leadTime: string;
  image: string;
  verified: boolean;
  completedOrders: number;
  priceRange: string;
  /** จาก GET /factories — ชื่อประเภทโรงงาน */
  factoryTypeName?: string;
};

export type FactoryProfile = {
  factoryId: string;
  address: string;
  acceptedProductTypes: string[];
  certificates: string[];
};

export type FactoryReview = {
  id: string;
  factoryId: string;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
};

export type IdeaArticle = {
  id: string;
  factoryId: string;
  factoryName: string;
  title: string;
  excerpt: string;
  image: string;
  tag: string;
  publishedAt: string;
};

export type ShowcaseSectionItem = {
  item_id: number;
  title: string | null;
  description: string;
  icon_name: string | null;
  sort_order: number;
};

export type ShowcaseSection = {
  section_id: number;
  section_type: 'highlight' | 'checklist';
  section_title: string;
  sort_order: number;
  items: ShowcaseSectionItem[];
};

/** จาก GET /showcases/:id — gallery (ดิบจาก API) */
export type ShowcaseImageRow = Record<string, unknown>;

/** จาก GET /showcases/:id — specs PD */
export type ShowcaseSpecRow = {
  spec_key: string;
  spec_value: string;
  sort_order?: number;
};

export type FactoryShowcase = {
  id: string;
  factoryId: string;
  factoryName: string;
  title: string;
  excerpt: string;
  description?: string;
  image: string;
  contentType: 'product' | 'promotion' | 'idea';
  category: string;
  /** จาก API `category_id` — ใช้กรองกับ dropdown / ?category_id= */
  categoryId?: string;
  /** จาก API เมื่อ BE รองรับ — กรองหมวดย่อย (optional) */
  sub_category_id?: number;
  sub_category_name?: string | null;
  postedAt: string;
  likes: number;
  minOrder: number;
  leadTime: string;
  priceRange?: string;
  tags: string[];
  factoryImageUrl?: string;
  factoryRating?: number;
  factoryVerified?: boolean;
  sections?: ShowcaseSection[];
  images?: ShowcaseImageRow[];
  specs?: ShowcaseSpecRow[];
};

export type RfqOffer = {
  id: string;
  factoryId: string;
  factoryName: string;
  price: number;
  leadTime: number;
  rating: number;
  verified: boolean;
  recommended: boolean;
  aiReason: string;
  completedOrders: number;
  responseTime: string;
  /** จาก quotations.status: PD | AC | RJ */
  quoteStatus?: string;
};

export type Rfq = {
  id: string;
  projectName: string;
  category: string;
  categoryIcon: string;
  status: string;
  offerCount: number;
  budget: number;
  quantity: number;
  material: string;
  deadline: string;
  createdAt: string;
  description: string;
  /** URL รูปแนบจาก GET /frontend/rfqs/:id (หรือ bootstrap ถ้ามี) */
  imageUrls: string[];
  offers: RfqOffer[];
  /** จาก rfqs.sub_category_name (join) */
  subCategoryName?: string;
  /** จาก rfqs.sub_category_id เมื่อมี id แต่ชื่อยังว่าง */
  subCategoryId?: number;
  /** จาก rfqs.shipping_method_name หรือ master */
  shippingMethodName?: string;
};

export type OrderTimeline = {
  id: string;
  title: string;
  date: string;
  status: string;
  photo: string | null;
  description: string;
};

export type Order = {
  id: string;
  rfqId: string;
  factoryId: string;
  factoryName: string;
  projectName: string;
  category: string;
  status: string;
  progress: number;
  totalAmount: number;
  depositPaid: number;
  quantity: number;
  createdAt: string;
  estimatedDelivery: string;
  timeline: OrderTimeline[];
};

export type Message = {
  id: string;
  sender: 'factory' | 'user';
  text: string;
  time: string;
  type: 'text' | 'quote';
  quoteData?: { price: number; leadTime: number; validUntil: string };
};

export type Conversation = {
  id: string;
  factoryId: string;
  rfqId: string;
  factoryName: string;
  factoryAvatar: string;
  rfqName: string;
  lastMessage: string;
  time: string;
  unread: number;
  hasQuote: boolean;
  messages: Message[];
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  linkTo: string;
  avatar: string;
  rfqId?: string;
  orderId?: string;
  conversationId?: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  nameEn?: string;
  avatar: string;
  company: string;
  email: string;
  phone: string;
  walletBalance: number;
  pendingBalance: number;
  memberSince: string;
};

// ─── RFQ / quotation mapping (API: rfqs.status OP|CL|CC, quotations.status PD|AC|RJ) ───
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

/** รูปจาก root `{ images }` หรือใน `rfq` / merged row (ตาม API_SPEC /rfqs/:id) */
function extractRfqImageUrls(apiRoot: Record<string, unknown>, row: Record<string, unknown>): string[] {
  const nested =
    apiRoot.rfq && typeof apiRoot.rfq === 'object' && !Array.isArray(apiRoot.rfq)
      ? (apiRoot.rfq as Record<string, unknown>)
      : null;
  for (const src of [row.images, apiRoot.images, nested?.images]) {
    const urls = parseRfqImageList(src);
    if (urls.length > 0) return urls;
  }
  return [];
}

/** แปลงแถว RFQ จาก bootstrap / GET /frontend/rfqs/:id → Rfq */
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
  const budgetPerPiece = Number(row.budget_per_piece ?? 0);
  const budget =
    Number(row.budget ?? row.total_budget ?? 0) ||
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

// ─── Data Store ─────────────────────────────────────────────────
type DataState = {
  currentUser: CurrentUser | null;
  categories: Category[];
  factories: Factory[];
  factoryProfiles: FactoryProfile[];
  factoryReviews: FactoryReview[];
  ideaArticles: IdeaArticle[];
  factoryShowcases: FactoryShowcase[];
  rfqs: Rfq[];
  orders: Order[];
  conversations: Conversation[];
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
};

type DataContextType = DataState & {
  refetch: () => Promise<void>;
  refetchRfqs: () => Promise<void>;
  refetchRfq: (id: string) => Promise<void>;
  refetchOrders: () => Promise<void>;
  refetchMessages: () => Promise<void>;
  refetchFactory: (id: string) => Promise<void>;
};

const INITIAL_STATE: DataState = {
  currentUser: null,
  categories: [],
  factories: [],
  factoryProfiles: [],
  factoryReviews: [],
  ideaArticles: [],
  factoryShowcases: [],
  rfqs: [],
  orders: [],
  conversations: [],
  notifications: [],
  isLoading: true,
  error: null,
};

const DataContext = createContext<DataContextType | null>(null);

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────
export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<DataState>(INITIAL_STATE);

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) {
      setState(INITIAL_STATE);
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const normOrder = (r: Record<string, unknown>, rfqList?: Rfq[]): Order => {
      const rfqId = String(r.rfqId ?? r.rfq_id ?? '');
      const status = mapOrderStatusFromApi(String(r.status ?? 'PR'));
      // Try to derive category from linked RFQ
      const linkedRfq = rfqList?.find((q) => q.id === rfqId);
      return {
        id: String(r.order_id ?? r.id ?? ''),
        rfqId,
        factoryId: String(r.factoryId ?? r.factory_id ?? ''),
        factoryName: String(r.factoryName ?? r.factory_name ?? ''),
        projectName: String(r.projectName ?? r.project_name ?? r.title ?? ''),
        category: String(r.category ?? '') || (linkedRfq?.category ?? ''),
        status,
        progress:
          Number(r.progress ?? 0) > 0
            ? Number(r.progress ?? 0)
            : guessOrderProgress(status),
        totalAmount: Number(r.totalAmount ?? r.total_amount ?? 0),
        depositPaid: Number(r.depositPaid ?? r.deposit_paid ?? r.deposit_amount ?? 0),
        quantity: Number(r.quantity ?? 0) || (linkedRfq?.quantity ?? 0),
        createdAt: String(r.createdAt ?? r.created_at ?? ''),
        estimatedDelivery: String(r.estimatedDelivery ?? r.estimated_delivery ?? ''),
        timeline: Array.isArray(r.timeline) ? r.timeline as OrderTimeline[] : [],
      };
    };

    try {
      // ── เรียกเฉพาะ core data (ไม่รวม showcases — แต่ละหน้าโหลดเอง) ──
      const [bootstrapRes, notifRes, convsRes] = await Promise.allSettled([
        frontendApi.getBootstrap(),   // user, categories, factories, rfqs, orders
        notificationsApi.list(),      // notifications
        conversationsApi.list(),      // conversations
      ]);

      const boot = bootstrapRes.status === 'fulfilled' ? bootstrapRes.value : null;
      const rawNotifs = notifRes.status === 'fulfilled'
        ? (Array.isArray(notifRes.value) ? notifRes.value : []) as Record<string, unknown>[]
        : [];
      const rawConvs = convsRes.status === 'fulfilled'
        ? (Array.isArray(convsRes.value) ? convsRes.value : []) as Record<string, unknown>[]
        : [];

      // ── แปลง notifications ────────────────────────────────────────────
      const mappedNotifs: Notification[] = rawNotifs.map((r) => ({
        id: String(r.notification_id ?? r.id ?? ''),
        type: String(r.type ?? ''),
        title: String(r.title ?? ''),
        message: String(r.message ?? r.body ?? ''),
        time: String(r.created_at ?? r.time ?? ''),
        read: Boolean(r.is_read ?? r.read ?? false),
        linkTo: String(r.link_to ?? r.linkTo ?? ''),
        avatar: String(r.avatar ?? ''),
        rfqId: r.rfq_id ? String(r.rfq_id) : undefined,
        orderId: r.order_id ? String(r.order_id) : undefined,
        conversationId: r.conversation_id ? String(r.conversation_id) : undefined,
      })).filter((n) => n.id);

      // ── แปลง conversations ────────────────────────────────────────────
      const mappedConvs: Conversation[] = rawConvs.map((r) => ({
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
      })).filter((c) => c.id);

      console.info('[DataContext] bootstrap:', bootstrapRes.status, '| notifs:', rawNotifs.length, '| convs:', rawConvs.length);

      // โรงงานจาก bootstrap เท่านั้น — ไม่ fallback เป็น mock เมื่อ bootstrap สำเร็จ (รวมกรณี array ว่าง)
      const factoryList: Factory[] = (() => {
        const raw = boot?.factories;
        if (!Array.isArray(raw)) return [];
        return (raw as Record<string, unknown>[])
          .map((row) => normalizeFactoryRow(row))
          .filter((f) => f.id && f.name);
      })();
      const mappedRfqs: Rfq[] = (() => {
        const raw = boot?.rfqs;
        if (Array.isArray(raw) && raw.length > 0) {
          return (raw as Record<string, unknown>[])
            .map((row) => normalizeRfqRecord(row, factoryList, guessCategoryIcon))
            .filter((r) => r.id);
        }
        return [];
      })();
      const mappedOrders: Order[] = (() => {
        const raw = boot?.orders;
        if (Array.isArray(raw) && raw.length > 0) {
          return (raw as Record<string, unknown>[])
            .map((o) => normOrder(o, mappedRfqs))
            .filter((o) => o.id);
        }
        return [];
      })();

      setState({
        currentUser: boot?.currentUser
          ? (() => {
              const u = boot.currentUser;
              return {
                id: String(u.id ?? ''),
                name: String(u.name ?? ''),
                nameEn: u.nameEn ? String(u.nameEn) : undefined,
                avatar: String(u.avatar ?? ''),
                company: String(u.company ?? ''),
                email: String(u.email ?? ''),
                phone: String(u.phone ?? ''),
                walletBalance: Number(u.walletBalance ?? 0),
                pendingBalance: Number(u.pendingBalance ?? 0),
                memberSince: String(u.memberSince ?? ''),
              } as CurrentUser;
            })()
          : null,
        categories: (() => {
          const raw = boot?.categories;
          if (Array.isArray(raw) && raw.length > 0) {
            return (raw as Record<string, unknown>[]).map((c) => {
              const name = String(c.name ?? '');
              return {
                id: String(c.id ?? c.category_id ?? ''),
                name,
                icon: String(c.icon ?? '') || guessCategoryIcon(name),
                color: String(c.color ?? '#7C3AED'),
              } as Category;
            });
          }
          return [];
        })(),
        factories: factoryList,
        factoryProfiles: [],
        factoryReviews: [],
        // showcases/ideas → ไม่โหลดที่นี่ แต่ละหน้าโหลดเอง (explore, factory-ideas)
        ideaArticles: [],
        factoryShowcases: [],
        rfqs: mappedRfqs,
        orders: mappedOrders,
        conversations: mappedConvs,
        notifications: mappedNotifs,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('DataContext fetchAll failed:', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: String(err),
      }));
    }
  }, [isAuthenticated]);

  // Initial fetch หลัง auth พร้อม
  useEffect(() => {
    if (!authLoading) {
      fetchAll();
    }
  }, [authLoading, fetchAll]);

  // Refetch เมื่อ user กลับมาที่ tab (visibility change) — หยุด stale data
  const lastFetchRef = useRef<number>(0);
  useEffect(() => {
    if (!isAuthenticated) return;
    const STALE_MS = 60_000; // refetch ถ้าข้อมูลเก่ากว่า 1 นาที
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastFetchRef.current > STALE_MS) {
          lastFetchRef.current = now;
          fetchAll();
        }
      }
    };
    const onOnline = () => fetchAll();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [isAuthenticated, fetchAll]);

  // Granular refetch methods for updating specific slices
  // ── Re-use the same smart normalizers from fetchAll ──

  const refetchRfqs = async () => {
    try {
      const data = await frontendApi.getBootstrap();
      const raw = data.rfqs;
      if (Array.isArray(raw) && raw.length > 0) {
        setState((prev) => {
          const mapped = (raw as Record<string, unknown>[])
            .map((row) => normalizeRfqRecord(row, prev.factories, guessCategoryIcon))
            .filter((r) => r.id);
          return { ...prev, rfqs: mapped };
        });
      }
    } catch (err) {
      console.error('Failed to refetch RFQs:', err);
    }
  };

  const refetchRfq = useCallback(async (id: string) => {
    try {
      const payload = (await frontendApi.getRfq(id)) as Record<string, unknown>;
      let quotes: unknown[] = [];
      try {
        const raw = await rfqsApi.listQuotations(id);
        if (Array.isArray(raw)) quotes = raw;
        else if (raw && typeof raw === 'object') {
          const o = raw as Record<string, unknown>;
          if (Array.isArray(o.data)) quotes = o.data;
          else if (Array.isArray(o.quotations)) quotes = o.quotations;
        }
      } catch {
        /* บาง environment อาจยังไม่เปิด endpoint นี้ — ใช้แค่ payload จาก /frontend/rfqs */
      }
      const merged: Record<string, unknown> =
        quotes.length > 0 ? { ...payload, quotations: quotes } : payload;
      setState((prev) => {
        const mapped = normalizeRfqRecord(merged, prev.factories, guessCategoryIcon);
        if (!mapped.id) return prev;
        const exists = prev.rfqs.some((r) => r.id === mapped.id);
        return {
          ...prev,
          rfqs: exists
            ? prev.rfqs.map((r) => (r.id === mapped.id ? mapped : r))
            : [mapped, ...prev.rfqs],
        };
      });
    } catch (err) {
      console.error('Failed to refetch RFQ:', err);
    }
  }, []);

  const refetchOrders = async () => {
    try {
      const data = await frontendApi.getBootstrap();
      const rawOrders = data.orders;
      const rawRfqs = data.rfqs;
      if (Array.isArray(rawOrders) && rawOrders.length > 0) {
        setState((prev) => {
          const rfqList: Rfq[] = Array.isArray(rawRfqs)
            ? (rawRfqs as Record<string, unknown>[]).map((r) =>
                normalizeRfqRecord(r, prev.factories, guessCategoryIcon),
              )
            : [];
          const gp = (s: string, v: number) =>
            v > 0 ? v : s === 'in_production' ? 35 : s === 'shipped' ? 85 : s === 'completed' ? 100 : 0;
          const mapO = (r: Record<string, unknown>): Order => {
            const rfqId = String(r.rfqId ?? r.rfq_id ?? '');
            const status = String(r.status ?? 'in_production');
            const linked = rfqList.find((q) => q.id === rfqId);
            return {
              id: String(r.order_id ?? r.id ?? ''),
              rfqId,
              factoryId: String(r.factoryId ?? r.factory_id ?? ''),
              factoryName: String(r.factoryName ?? r.factory_name ?? ''),
              projectName: String(r.projectName ?? r.project_name ?? r.title ?? ''),
              category: String(r.category ?? '') || (linked?.category ?? ''),
              status,
              progress: gp(status, Number(r.progress ?? 0)),
              totalAmount: Number(r.totalAmount ?? r.total_amount ?? 0),
              depositPaid: Number(r.depositPaid ?? r.deposit_paid ?? r.deposit_amount ?? 0),
              quantity: Number(r.quantity ?? 0) || (linked?.quantity ?? 0),
              createdAt: String(r.createdAt ?? r.created_at ?? ''),
              estimatedDelivery: String(r.estimatedDelivery ?? r.estimated_delivery ?? ''),
              timeline: Array.isArray(r.timeline) ? (r.timeline as OrderTimeline[]) : [],
            };
          };
          const mapped = (rawOrders as Record<string, unknown>[]).map(mapO).filter((o) => o.id);
          return { ...prev, orders: mapped };
        });
      }
    } catch (err) {
      console.error('Failed to refetch orders:', err);
    }
  };

  const refetchMessages = async () => {
    try {
      const threads = await frontendApi.getMessageThreads();
      setState((prev) => ({
        ...prev,
        conversations: (threads as Conversation[]) ?? prev.conversations,
      }));
    } catch (err) {
      console.error('Failed to refetch messages:', err);
    }
  };

  const refetchFactory = async (id: string) => {
    try {
      const data = await frontendApi.getFactory(id);
      // Update factory in list if it exists
      setState((prev) => {
        const factories = prev.factories.map((f) =>
          f.id === id ? { ...f, ...(data.factory as Factory) } : f,
        );
        return { ...prev, factories };
      });
    } catch (err) {
      console.error('Failed to refetch factory:', err);
    }
  };

  return (
    <DataContext.Provider
      value={{
        ...state,
        refetch: fetchAll,
        refetchRfqs,
        refetchRfq,
        refetchOrders,
        refetchMessages,
        refetchFactory,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
