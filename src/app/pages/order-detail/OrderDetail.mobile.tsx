import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, MessageCircle, Star, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { openChatSession } from '../../utils/openChatSession';
import { getCurrentUserId } from '../../utils/chatContract';
import { ApiHttpError, ordersApi } from '../../services/api';
import {
  OrderSummaryCard,
  OrderOverviewSection,
  OrderPhotoGallery,
  OrderActionBanner,
  DepositPaymentModal,
  RfqReferenceCard,
  OrderBOQCard,
  formatDateTh,
} from '../../components/features/order-detail';
import { ReviewImageAttachments } from '../../components/features/reviews/ReviewImageAttachments';
import { normalizeReviewImageUrls } from '../../utils/reviewImageUrls';
import { OrderProductionTab } from '../../components/features/production/OrderProductionTab';
import { useOrderDetail } from './OrderDetailContext';

type OrderReviewState = {
  order_id: number;
  factory_id: number;
  factory_name?: string;
  eligible: boolean;
  already_reviewed: boolean;
  reason?: string;
  review?: {
    review_id: number;
    rating: number;
    comment: string;
    image_urls?: string[];
    created_at?: string;
    updated_at?: string;
  } | null;
};

function OrderDetailMobileBody() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const data = useData();
  const {
    mappedOrder: order,
    apiStatus,
    uiMode,
    nextAction,
    paymentSchedule,
    statusLabelTh,
    lockContextMerged,
    rfqSummary,
    rfq,
    quotation,
    refetchAll,
  } = useOrderDetail();

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'production'>('overview');
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [confirmingReceive, setConfirmingReceive] = useState(false);
  const [receiveForbidden, setReceiveForbidden] = useState(false);
  const [reviewState, setReviewState] = useState<OrderReviewState | null>(null);
  const [reviewStateLoading, setReviewStateLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImageUrls, setReviewImageUrls] = useState<string[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  // UI rule: show cancel button only when status is PP
  const canShowCancelButton = apiStatus === 'PP';

  const depositAmount =
    nextAction?.amount ??
    paymentSchedule.find((s) => s.stage === 'FULL_PAYMENT' || s.stage === 'DEPOSIT')?.amount ??
    order.totalAmount ??
    lockContextMerged.deposit_amount ??
    0;

  const openDepositModal = () => {
    if (depositAmount <= 0) return;
    setDepositModalOpen(true);
  };

  const relatedRfq = data.rfqs.find((r) => r.id === order.rfqId);
  const relatedFactory = data.factories.find((f) => f.id === order.factoryId);
  const rfqOffers = relatedRfq?.offers ?? [];

  const openOrderChat = () => {
    const my = getCurrentUserId(user);
    const fid = Number(order.factoryId);
    const oid = Number(order.id);
    if (my == null || !Number.isFinite(fid) || fid <= 0 || !Number.isFinite(oid) || oid <= 0) return;
    const ref = { type: 'OD' as const, id: oid, title: order.projectName };
    void openChatSession(navigate, user, {
      customerUserId: my,
      factoryEntityId: fid,
      firstMessage: {
        content: `สอบถามเกี่ยวกับคำสั่งซื้อ: ${order.projectName}`,
        reference: ref,
      },
    });
  };

  const showFloatingAction = order.status === 'shipped' || order.status === 'completed';

  const loadReviewState = React.useCallback(async () => {
    setReviewStateLoading(true);
    try {
      const raw = (await ordersApi.getReviewState(order.id)) as Record<string, unknown>;
      setReviewState({
        order_id: Number(raw.order_id ?? order.id),
        factory_id: Number(raw.factory_id ?? order.factoryId ?? 0),
        factory_name: String(raw.factory_name ?? order.factoryName ?? ''),
        eligible: Boolean(raw.eligible),
        already_reviewed: Boolean(raw.already_reviewed),
        reason: String(raw.reason ?? '').trim() || undefined,
        review:
          raw.review && typeof raw.review === 'object'
            ? ({
                review_id: Number((raw.review as Record<string, unknown>).review_id ?? 0),
                rating: Number((raw.review as Record<string, unknown>).rating ?? 0),
                comment: String((raw.review as Record<string, unknown>).comment ?? ''),
                image_urls: normalizeReviewImageUrls(
                  (raw.review as Record<string, unknown>).image_urls,
                ),
                created_at: String((raw.review as Record<string, unknown>).created_at ?? ''),
                updated_at: String((raw.review as Record<string, unknown>).updated_at ?? ''),
              } as OrderReviewState['review'])
            : null,
      });
    } catch {
      setReviewState(null);
    } finally {
      setReviewStateLoading(false);
    }
  }, [order.status, order.id, order.factoryId, order.factoryName]);

  React.useEffect(() => {
    void loadReviewState();
  }, [loadReviewState]);

  const onConfirmReceive = async () => {
    if (confirmingReceive) return;
    if (order.status !== 'shipped') return;
    setReceiveForbidden(false);
    const ok = window.confirm('ยืนยันว่าได้รับสินค้าเรียบร้อยแล้ว?');
    if (!ok) return;
    setConfirmingReceive(true);
    try {
      await ordersApi.confirmReceipt(order.id, {
        note: 'Customer confirmed receipt from order detail',
        received_at: new Date().toISOString(),
      });
      toast.success('ยืนยันรับสินค้าแล้ว');
      await refetchAll();
    } catch (e) {
      if (e instanceof ApiHttpError) {
        if (e.status === 403) {
          setReceiveForbidden(true);
          toast.error('คุณไม่มีสิทธิ์ยืนยันการรับสินค้าสำหรับคำสั่งซื้อนี้');
        } else if (e.status === 404) {
          toast.error('ไม่พบคำสั่งซื้อนี้ในระบบ');
        } else {
          // 409/422 and other business errors: backend message is already normalized in ApiHttpError.
          toast.error(e.message || 'ยืนยันรับสินค้าไม่สำเร็จ');
        }
      } else {
        const message = e instanceof Error ? e.message : 'ยืนยันรับสินค้าไม่สำเร็จ';
        toast.error(message);
      }
    } finally {
      setConfirmingReceive(false);
    }
  };

  const onCancelOrder = async () => {
    if (cancellingOrder) return;
    setCancellingOrder(true);
    try {
      await ordersApi.cancel(order.id);
      toast.success('ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว');
      setCancelModalOpen(false);
      await refetchAll();
    } catch (e) {
      if (e instanceof ApiHttpError) {
        if (e.status === 400) toast.error(e.message || 'ไม่สามารถยกเลิกคำสั่งซื้อในสถานะนี้ได้');
        else if (e.status === 404) toast.error('ไม่พบคำสั่งซื้อนี้');
        else toast.error(e.message || 'ยกเลิกคำสั่งซื้อไม่สำเร็จ');
      } else {
        toast.error(e instanceof Error ? e.message : 'ยกเลิกคำสั่งซื้อไม่สำเร็จ');
      }
    } finally {
      setCancellingOrder(false);
    }
  };

  const onOpenReview = () => {
    if (order.status !== 'completed') {
      toast.error('สามารถรีวิวได้หลังคำสั่งซื้อเสร็จสมบูรณ์');
      return;
    }
    if (reviewState?.reason === 'order_not_completed') {
      toast.error('สามารถรีวิวได้หลังคำสั่งซื้อเสร็จสมบูรณ์');
      return;
    }
    if (reviewState?.already_reviewed) {
      setReviewModalOpen(true);
      return;
    }
    if (reviewState && !reviewState.eligible) {
      toast.error('ยังไม่สามารถรีวิวคำสั่งซื้อนี้ได้');
      return;
    }
    setReviewImageUrls([]);
    setReviewModalOpen(true);
  };

  const onSubmitReview = async () => {
    if (reviewSubmitting) return;
    if (order.status !== 'completed') {
      toast.error('สามารถรีวิวได้หลังคำสั่งซื้อเสร็จสมบูรณ์');
      return;
    }
    if (!Number.isFinite(reviewRating) || reviewRating < 1 || reviewRating > 5) {
      toast.error('กรุณาเลือกคะแนน 1 ถึง 5 ดาว');
      return;
    }
    const comment = reviewComment.trim();
    if (!comment) {
      toast.error('กรุณาเขียนรีวิว');
      return;
    }
    if (comment.length > 1000) {
      toast.error('คอมเมนต์ยาวเกิน 1000 ตัวอักษร');
      return;
    }
    setReviewSubmitting(true);
    try {
      const image_urls = normalizeReviewImageUrls(reviewImageUrls);
      await ordersApi.createReview(order.id, { rating: reviewRating, comment, image_urls });
      toast.success('ส่งรีวิวสำเร็จ');
      setReviewModalOpen(false);
      setReviewComment('');
      setReviewImageUrls([]);
      await Promise.all([loadReviewState(), refetchAll()]);
    } catch (e) {
      if (e instanceof ApiHttpError) {
        const m = String(e.message ?? '').toLowerCase();
        if (m.includes('review already exists')) toast.error('คุณรีวิวคำสั่งซื้อนี้ไปแล้ว');
        else if (m.includes('order must be completed')) toast.error('สามารถรีวิวได้หลังคำสั่งซื้อเสร็จสมบูรณ์');
        else if (m.includes('rating must be between')) toast.error('กรุณาเลือกคะแนน 1 ถึง 5 ดาว');
        else if (m.includes('comment must be')) toast.error('กรุณาเขียนรีวิว');
        else if (m.includes('image_urls') && m.includes('5')) toast.error('แนบรูปได้ไม่เกิน 5 รูป');
        else toast.error(e.message || 'ส่งรีวิวไม่สำเร็จ');
      } else {
        toast.error(e instanceof Error ? e.message : 'ส่งรีวิวไม่สำเร็จ');
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="hidden lg:block px-0 pt-1 pb-3">
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ChevronLeft size={16} />
          กลับไปรายการคำสั่งซื้อ
        </button>
        <h1 className="text-xl text-gray-900" style={{ fontWeight: 700 }}>
          {rfq?.title ?? order.projectName}
        </h1>
        <p className="text-xs text-gray-500">
          คำสั่งซื้อ #{order.id} · สร้างเมื่อ {formatDateTh(order.createdAt)}
        </p>
      </header>

      <div className="flex lg:hidden items-center justify-between px-4 pt-5 pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center"
        >
          <ChevronLeft size={22} className="text-gray-700" />
        </button>
        <div className="text-center min-w-0 flex-1 px-2">
          <h1
            className="text-sm text-gray-900 max-w-[240px] truncate mx-auto"
            style={{ fontWeight: 700 }}
            title={rfq?.title ?? order.projectName}
          >
            {rfq?.title ?? order.projectName}
          </h1>
          <p className="text-[10px] text-gray-400">คำสั่งซื้อ #{order.id}</p>
        </div>
        <button
          type="button"
          onClick={() => openOrderChat()}
          className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center"
        >
          <MessageCircle size={20} style={{ color: '#A238FF' }} />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {receiveForbidden ? (
          <div className="px-4 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
            >
              กลับไปรายการคำสั่งซื้อ
            </button>
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          <OrderSummaryCard
            order={order}
            rfqSummary={rfqSummary}
            relatedFactory={relatedFactory}
            statusLabelTh={statusLabelTh}
          />

          {uiMode.showActionBanner && (nextAction != null || paymentSchedule.length > 0) ? (
            <OrderActionBanner
              nextAction={nextAction}
              paymentSchedule={paymentSchedule}
              variant={uiMode.lockReason === 'DEPOSIT_EXPIRED' ? 'deposit_expired' : 'pending_deposit'}
              fallbackCtaUrl={lockContextMerged.payment_url}
              onPayDeposit={uiMode.lockReason === 'PENDING_DEPOSIT' ? openDepositModal : undefined}
            />
          ) : null}

          <div className="flex border-b border-gray-100 bg-white -mx-4 px-0">
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className={`flex-1 py-3 border-b-2 transition-colors ${
                activeSection === 'overview'
                  ? 'border-[#A238FF] text-[#A238FF]'
                  : 'border-transparent text-gray-400'
              }`}
              style={{ fontSize: 14 }}
            >
              ภาพรวม
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('production')}
              className={`flex-1 py-3 border-b-2 transition-colors ${
                activeSection === 'production'
                  ? 'border-[#A238FF] text-[#A238FF]'
                  : 'border-transparent text-gray-400'
              }`}
              style={{ fontSize: 14 }}
            >
              การผลิต
            </button>
          </div>

          {activeSection === 'overview' && (
            <>
              <OrderBOQCard
                rfqId={rfq?.rfq_id ?? 0}
                quoteId={quotation?.quote_id ?? 0}
                factoryId={order.factoryId}
                factoryName={order.factoryName}
              />
              {rfq ? <RfqReferenceCard rfq={rfq} variant="accordion" quotation={quotation} /> : null}
              <OrderOverviewSection
                order={{
                  totalAmount: order.totalAmount,
                  depositPaid: order.depositPaid,
                  factoryId: order.factoryId,
                  factoryName: order.factoryName,
                }}
                relatedRfq={relatedRfq ?? undefined}
                rfqOffers={rfqOffers}
              />

              {canShowCancelButton ? (
                <div className="pt-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setCancelModalOpen(true)}
                    className="w-full py-3 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    style={{ borderColor: '#FCA5A5', color: '#DC2626', backgroundColor: '#FFF5F5' }}
                  >
                    <X size={16} />
                    ยกเลิกคำสั่งซื้อ
                  </button>
                </div>
              ) : null}
            </>
          )}

          {activeSection === 'production' && (
            <OrderProductionTab
              orderId={order.id}
              onPhotoClick={setSelectedPhoto}
              onRequestOverviewTab={() => setActiveSection('overview')}
              onPayDeposit={uiMode.lockReason === 'PENDING_DEPOSIT' ? openDepositModal : undefined}
              onContactFactory={openOrderChat}
            />
          )}
        </div>

        {showFloatingAction && (
          <div className="shrink-0 px-4 pt-3 pb-6 bg-gradient-to-t from-white/90 to-transparent">
            <button
              type="button"
              onClick={() => {
                if (order.status === 'shipped') {
                  void onConfirmReceive();
                } else if (order.status === 'completed') {
                  onOpenReview();
                }
              }}
              disabled={order.status === 'shipped' ? confirmingReceive : false}
              className="w-full py-4 rounded-2xl text-white text-sm shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #2D1B4E, #4A267D)',
                fontWeight: 700,
                opacity: order.status === 'shipped' && confirmingReceive ? 0.7 : 1,
              }}
            >
              {order.status === 'shipped'
                ? confirmingReceive
                  ? 'กำลังยืนยันการรับสินค้า...'
                  : '✓ ยืนยันการรับสินค้า'
                : reviewState?.already_reviewed
                  ? '✓ คุณรีวิวรายการนี้แล้ว'
                  : '⭐ ให้คะแนนและรีวิว'}
            </button>
          </div>
        )}
      </div>

      <OrderPhotoGallery photoUrl={selectedPhoto} onClose={() => setSelectedPhoto(null)} />

      <DepositPaymentModal
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        orderId={order.id}
        amount={depositAmount}
        onSuccess={refetchAll}
      />

      {cancelModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="px-5 pt-6 pb-2 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900">ยืนยันการยกเลิกคำสั่งซื้อ?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                คำสั่งซื้อ <span className="font-semibold text-gray-700">#{order.id}</span> จะถูกยกเลิก
                <br />การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="px-5 pt-3 pb-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancellingOrder}
                className="py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 disabled:opacity-50"
              >
                ไม่ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void onCancelOrder()}
                disabled={cancellingOrder}
                className="py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-1.5"
                style={{ background: cancellingOrder ? '#F87171' : '#DC2626' }}
              >
                {cancellingOrder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังยกเลิก...
                  </>
                ) : (
                  'ยืนยันยกเลิก'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reviewModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-100 shadow-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900">
                {reviewState?.already_reviewed ? 'รีวิวของคุณ' : 'ให้คะแนนและรีวิว'}
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            {reviewStateLoading ? (
              <p className="text-sm text-gray-500 py-4">กำลังโหลด...</p>
            ) : reviewState?.already_reviewed && reviewState.review ? (
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={18}
                      className={
                        s <= Number(reviewState.review?.rating ?? 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {reviewState.review.comment}
                </p>
                <ReviewImageAttachments
                  urls={normalizeReviewImageUrls(reviewState.review.image_urls)}
                  onPreviewUrl={(u) => setSelectedPhoto(u)}
                />
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
                >
                  ปิด
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="p-0.5"
                      aria-label={`${s} ดาว`}
                    >
                      <Star
                        size={20}
                        className={s <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="แบ่งปันประสบการณ์ของคุณ"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <ReviewImageAttachments
                  urls={reviewImageUrls}
                  onChange={setReviewImageUrls}
                  onUploadError={(msg) => toast.error(msg)}
                />
                <button
                  type="button"
                  onClick={() => void onSubmitReview()}
                  disabled={reviewSubmitting}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: '#6C47FF' }}
                >
                  {reviewSubmitting ? 'กำลังส่งรีวิว...' : 'ส่งรีวิว'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function OrderDetailMobile() {
  return <OrderDetailMobileBody />;
}
