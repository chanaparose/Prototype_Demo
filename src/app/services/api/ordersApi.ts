import { httpClient } from '@/services/api/httpClient';
import type {
  IOrderCreateRequest,
  IOrderDetailResponse,
  IOrderUpdateRequest,
} from '@/services/api/types/order.types';
import type {
  IProductionUpdateRequest,
  IProductionUpdatesBundleResponse,
} from '@/services/api/types/production.types';

export const ordersApi = {
  list: () => httpClient.get<IOrderDetailResponse[]>('/orders'),

  get: (id: string | number) => httpClient.get<IOrderDetailResponse>(`/orders/${id}`),

  create: (quoteId: string | number) =>
    httpClient.post<IOrderDetailResponse>('/orders', {
      quote_id: Number(quoteId),
    } satisfies IOrderCreateRequest),

  update: (id: string | number, data: IOrderUpdateRequest) =>
    httpClient.patch<IOrderDetailResponse>(`/orders/${id}`, data),

  delete: (id: string | number) => httpClient.delete<void>(`/orders/${id}`),

  getMyOrders: () =>
    httpClient.get<{
      orders: IOrderDetailResponse[];
      total: number;
    }>('/orders/me'),

  getByQuoteId: (quoteId: string | number) =>
    httpClient.get<IOrderDetailResponse | null>(`/orders/quote/${quoteId}`),

  acceptQuote: (quoteId: string | number) =>
    httpClient.post<IOrderDetailResponse>(`/orders/accept-quote/${quoteId}`, {}),

  getProductionUpdatesBundle: (orderId: string | number) =>
    httpClient.get<IProductionUpdatesBundleResponse>(`/orders/${orderId}/production-updates`),

  postProductionUpdate: (
    orderId: string | number,
    data: IProductionUpdateRequest,
    headers?: Record<string, string>,
  ) => httpClient.post<unknown>(`/orders/${orderId}/production-updates`, data, headers),

  /** Complete shipping step (step_id=4) with tracking number */
  ship: (
    orderId: string | number,
    data: { tracking_number: string; note?: string; courier?: string },
  ) =>
    httpClient.post<unknown>(`/orders/${orderId}/production-updates`, {
      step_id: 4,
      status: 'CD',
      description: data.note,
      image_urls: [] as string[],
      tracking_no: data.tracking_number,
      ...(data.courier ? { courier: data.courier } : {}),
    } satisfies IProductionUpdateRequest),

  /** GET /orders/:id/payments — list payment transactions for this order */
  listPayments: (orderId: string | number) =>
    httpClient.get<Record<string, unknown>[]>(`/orders/${orderId}/payments`),

  /** POST /orders/:id/payments — pay deposit or full payment */
  createPayment: (
    orderId: string | number,
    data: {
      type: string;
      amount: number;
      payment_method: string;
      idempotency_key?: string;
    },
  ) => httpClient.post<Record<string, unknown>>(`/orders/${orderId}/payments`, data),

  /** POST /orders/:id/confirm-receipt — customer confirms goods received */
  confirmReceipt: (orderId: string | number, data: { note?: string; received_at?: string }) =>
    httpClient.post<Record<string, unknown>>(`/orders/${orderId}/confirm-receipt`, data),

  /** PATCH /orders/:id/cancel — cancel an order */
  cancel: (
    orderId: string | number,
    data: { reason: string } = { reason: 'ยกเลิกโดยลูกค้า' },
  ) => httpClient.patch<{ message: string }>(`/orders/${orderId}/cancel`, data),

  /** GET /orders/:id/review — check if review is eligible */
  getReviewState: (orderId: string | number) =>
    httpClient.get<Record<string, unknown>>(`/orders/${orderId}/review`),

  /** POST /orders/:id/review — submit a review */
  createReview: (
    orderId: string | number,
    data: { rating: number; comment: string; image_urls?: string[] },
  ) => httpClient.post<Record<string, unknown>>(`/orders/${orderId}/review`, data),
};

/** ─── Disputes / refund tickets ─────────────────────────────────────────── */
export type DisputeCategory = 'NR' | 'ND' | 'OT'; // NR=ไม่ได้รับสินค้า, ND=สินค้าไม่ตรงปก, OT=อื่นๆ

export type DisputeStatus = 'OP' | 'RT' | 'RC' | 'RF' | 'RJ';

export interface IDisputeResponse {
  dispute_id: number;
  order_id: number;
  category: DisputeCategory;
  reason: string;
  evidence_urls: string[];
  status: DisputeStatus; // รอตรวจสอบ / รอส่งคืน / รอตรวจรับ / คืนเงินแล้ว / ปฏิเสธ
  resolution?: string | null;
  refund_amount?: string | null;
  refund_slip_url?: string | null;
  refund_account?: string | null;
  refund_account_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  return_tracking_no?: string | null;
  return_courier?: string | null;
  return_note?: string | null;
  return_evidence_urls?: string[];
  return_requested_at?: string | null;
  return_submitted_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export const disputesApi = {
  /** ลูกค้าเปิด ticket ร้องเรียน/ขอคืนเงินบน order ตัวเอง */
  create: (
    orderId: string | number,
    data: {
      category: DisputeCategory;
      description: string;
      image_urls: string[];
      refund_account: string;
      refund_account_name: string;
      contact_email?: string;
      contact_phone: string;
    },
  ) => httpClient.post<IDisputeResponse>(`/orders/${orderId}/disputes`, data),

  /** ดู ticket ล่าสุดของ order (404 = ยังไม่มี) */
  getByOrder: (orderId: string | number) =>
    httpClient.get<IDisputeResponse>(`/orders/${orderId}/disputes`),

  /** ลูกค้าแนบหลักฐานการส่งสินค้าคืน (RT → RC) */
  submitReturn: (
    orderId: string | number,
    data: { tracking_no?: string; courier?: string; note?: string; image_urls: string[] },
  ) => httpClient.post<IDisputeResponse>(`/orders/${orderId}/disputes/return`, data),

  /** superadmin: รายการ ticket ทั้งหมด */
  adminList: (status?: string) =>
    httpClient.get<{ data: Record<string, unknown>[]; pagination?: Record<string, unknown> }>(
      `/admin/disputes${status ? `?status=${status}` : ''}`,
    ),

  /** superadmin: ตัดสิน ticket — request_return / refund (เต็ม/บางส่วน+สลิป) / reject */
  resolve: (
    disputeId: string | number,
    data: {
      action: 'request_return' | 'refund' | 'reject';
      resolution?: string;
      refund_amount?: number;
      refund_slip_url?: string;
    },
  ) => httpClient.patch<IDisputeResponse>(`/admin/disputes/${disputeId}`, data),
};

export const productionUpdatesApi = {
  list: (orderId: string | number) =>
    httpClient.get<unknown[]>(`/orders/${orderId}/production-updates`),

  create: (orderId: string | number, data: Record<string, unknown>) =>
    httpClient.post(`/orders/${orderId}/production-updates`, data),

  patch: (updateId: string | number, data: Record<string, unknown>) =>
    httpClient.patch(`/production-updates/${updateId}`, data),

  reject: (updateId: string | number, data: Record<string, unknown>) =>
    httpClient.post(`/production-updates/${updateId}/reject`, data),
};

export const productionApi = {
  getSteps: (orderId: string | number) =>
    httpClient.get<unknown[]>(`/orders/${orderId}/production-steps`),

  updateStep: (orderId: string | number, stepId: string | number, data: Record<string, unknown>) =>
    httpClient.patch(`/orders/${orderId}/production-steps/${stepId}`, data),
};
