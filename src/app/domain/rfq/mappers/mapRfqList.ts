import { type Rfq, type Order } from '@/stores/types';
import { frontendApi } from '@/services/api/exploreApi';
import { guessCategoryIcon } from '@/domain/shared/categoryIcons';
import { mapRfqStatusFromApi } from '@/domain/rfq/status';
import { mapOrderStatusFromApi, guessOrderProgress } from '@/domain/order/status';

export type RfqListResult = { rfqs: Rfq[]; orders: Order[] };

/**
 * ดึงข้อมูล RFQ + Order จาก /frontend/bootstrap (แทน /me/rfq-orders)
 * Bootstrap คืน rfqs[] และ orders[] แยกกัน พร้อม status ที่ map ไว้แล้วบน BE
 * (เช่น 'in_production', 'shipped', 'completed', 'pp' สำหรับ pending_payment)
 */
export async function fetchAndMapRfqList(): Promise<RfqListResult> {
  const bootstrap = await frontendApi.getBootstrap();

  // ── RFQs ──────────────────────────────────────────────────────────────────
  const rfqsRaw = Array.isArray(bootstrap.rfqs)
    ? (bootstrap.rfqs as unknown as Record<string, unknown>[])
    : [];

  const rfqs: Rfq[] = rfqsRaw.map((r) => {
    const category = String(r.category ?? r.category_name ?? '');
    const offerCount = Number(r.offerCount ?? r.offer_count ?? 0);
    // bootstrap.rfqs.status ถูก map ไว้แล้วโดย BE (FrontendRFQ)
    // mapRfqStatusFromApi รับได้ทั้ง raw code (OP/CL/CC) และ frontend string ('pending','offers_received',...)
    const status = mapRfqStatusFromApi(String(r.status ?? ''), { quoteCount: offerCount });
    return {
      id: String(r.id ?? r.rfq_id ?? ''),
      projectName: String(r.projectName ?? r.project_name ?? r.title ?? ''),
      category,
      categoryIcon: guessCategoryIcon(category),
      status,
      offerCount,
      budget: Number(r.budget ?? r.target_price ?? 0),
      quantity: Number(r.quantity ?? 0),
      material: '',
      deadline: '',
      createdAt: String(r.createdAt ?? r.created_at ?? '').split('T')[0],
      description: String(r.description ?? ''),
      imageUrls: Array.isArray(r.images) ? (r.images as string[]) : [],
      offers: [],
    } as Rfq;
  });

  // ── Orders ────────────────────────────────────────────────────────────────
  const ordersRaw = Array.isArray(bootstrap.orders)
    ? (bootstrap.orders as unknown as Record<string, unknown>[])
    : [];

  const orders: Order[] = ordersRaw.map((o) => {
    // bootstrap.orders.status ถูก map ไว้แล้วโดย BE (FrontendOrder):
    //   PR/QC → 'in_production', SH → 'shipped', CP → 'completed', PP → 'pp', ...
    // mapOrderStatusFromApi รับได้ทั้ง raw ('PP') และ pre-mapped ('pp','in_production',...)
    const status = mapOrderStatusFromApi(String(o.status ?? ''));
    return {
      id: String(o.id ?? o.order_id ?? ''),
      rfqId: String(o.rfqId ?? o.rfq_id ?? ''),
      factoryId: String(o.factoryId ?? o.factory_id ?? ''),
      factoryName: String(o.factoryName ?? o.factory_name ?? ''),
      projectName: String(o.projectName ?? o.project_name ?? o.title ?? ''),
      category: String(o.category ?? ''),
      status,
      progress: guessOrderProgress(status),
      totalAmount: Number(o.totalAmount ?? o.total_amount ?? 0),
      depositPaid: Number(o.depositPaid ?? o.deposit_paid ?? 0),
      quantity: Number(o.quantity ?? 0),
      createdAt: String(o.createdAt ?? o.created_at ?? '').split('T')[0],
      estimatedDelivery: String(o.estimatedDelivery ?? o.estimated_delivery ?? ''),
      timeline: [],
    } as Order;
  });

  return { rfqs, orders };
}
