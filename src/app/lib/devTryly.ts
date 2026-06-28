import { queryClient } from '@/lib/queryClient';
import type { RfqDetailData } from '@/domain/rfq/mappers/mapRfqDetail';
import type { RfqOffer } from '@/stores/types';

declare global {
  interface Window {
    __tryly?: {
      queryClient: typeof queryClient;
      /** Inject mock offers into the current RFQ detail cache. Open /rfqs/:id first. */
      injectMockOffers: (count?: number, rfqId?: string) => boolean;
      /** Refetch RFQ detail from API (undo mock). */
      resetRfq: (rfqId?: string) => Promise<void>;
    };
  }
}

function rfqIdFromPath(): string | null {
  const match = location.pathname.match(/\/rfqs\/([^/]+)/);
  return match?.[1] ?? null;
}

function makeMockOffer(i: number, qty: number, template?: RfqOffer): RfqOffer {
  const pricePerPiece = 38 + i * 2.5;
  const subtotal = Math.round(pricePerPiece * qty);
  const shipping = 800 + i * 120;
  const packaging = 500;
  const mold = i % 3 === 0 ? 4500 : 0;
  const vat = Math.round((subtotal + shipping + packaging + mold) * 0.07);
  const grandTotal = subtotal + shipping + packaging + mold + vat;
  const materials = ['พลาสติก', 'อลูมิเนียม', 'เหล็ก', 'ไม้'];

  return {
    ...(template ?? {
      id: '',
      factoryId: '',
      factoryName: '',
      price: 0,
      leadTime: 0,
      rating: 0,
      verified: false,
      recommended: false,
      aiReason: '',
      completedOrders: 0,
      responseTime: '',
    }),
    id: String(90000 + i),
    factoryId: String(1000 + i),
    factoryName: `โรงงาน Mock ${i + 1}`,
    price: grandTotal,
    leadTime: 5 + i * 2,
    rating: 4.1 + (i % 4) * 0.15,
    verified: i % 2 === 0,
    recommended: i === 2,
    aiReason: i === 2 ? 'AI แนะนำ — สมดุลราคา/เวลา' : `mock offer #${i + 1}`,
    factoryHighlight: `จุดเด่น: ผลิต ${materials[i % materials.length]} ${3 + i} ปี`,
    completedOrders: 12 + i * 4,
    responseTime: `${1 + i} ชม.`,
    quoteStatus: 'PD',
    quotationDetail: {
      price_per_piece: pricePerPiece,
      moq: qty,
      lead_time_days: 5 + i * 2,
      subtotal,
      shipping_cost: shipping,
      packaging_cost: packaging,
      tooling_mold_cost: mold,
      vat_rate: 7,
      vat_amount: vat,
      grand_total: grandTotal,
      valid_until: '2026-12-31',
      status: 'Pending',
      shipping_method: 'จัดส่งทั่วไป',
      image_urls: [],
    },
  } as RfqOffer & { quotationDetail?: Record<string, unknown> };
}

export function installDevTrylyHelpers(): void {
  if (!import.meta.env.DEV) return;

  window.__tryly = {
    queryClient,

    injectMockOffers(count = 10, rfqId?: string) {
      const id = rfqId ?? rfqIdFromPath();
      if (!id) {
        console.warn('[__tryly] ไม่พบ rfqId — เปิดหน้า /rfqs/:id หรือส่ง id เป็นพารามิเตอร์ที่ 2');
        return false;
      }

      const key = ['rfq', 'detail', id] as const;
      const prev = queryClient.getQueryData<RfqDetailData>(key);
      if (!prev?.rfq) {
        console.warn('[__tryly] ยังไม่มีข้อมูล RFQ ใน cache — รอโหลดเสร็จก่อน');
        return false;
      }

      const qty = prev.rfq.quantity || 1000;
      const template = prev.rfq.offers[0];
      const mockOffers = Array.from({ length: count }, (_, i) => makeMockOffer(i, qty, template));

      queryClient.setQueryData(key, {
        ...prev,
        rfq: {
          ...prev.rfq,
          offers: mockOffers,
          offerCount: mockOffers.length,
          status: 'offers_received',
        },
      });

      console.log(`[__tryly] ✅ injected ${count} mock offers for RFQ ${id}`);
      return true;
    },

    async resetRfq(rfqId?: string) {
      const id = rfqId ?? rfqIdFromPath();
      if (!id) {
        console.warn('[__tryly] ไม่พบ rfqId');
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['rfq', 'detail', id] });
      console.log(`[__tryly] refetching RFQ ${id}`);
    },
  };

  console.info('[__tryly] dev helpers ready — try: __tryly.injectMockOffers(10)');
}
