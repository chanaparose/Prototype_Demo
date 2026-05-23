import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, MessageCircle, Star, X, AlertTriangle, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '@/stores/useDataStore';
import { useAuth } from '@/stores/useAuthStore';
import { openChatSession } from '@/utils/openChatSession';
import { getCurrentUserId } from '@/utils/chatContract';
import { ApiHttpError } from '@/services/api/httpClient';
import { ordersApi } from '@/services/api/ordersApi';
import { Button } from '@/components/ui/button';
import { OrderSummaryCard } from '@/components/features/order-detail/OrderSummaryCard';
import { OrderOverviewSection } from '@/components/features/order-detail/OrderOverviewSection';
import { OrderPhotoGallery } from '@/components/features/order-detail/OrderPhotoGallery';
import { OrderActionBanner } from '@/components/features/order-detail/OrderActionBanner';
import { DepositPaymentModal } from '@/components/features/order-detail/DepositPaymentModal';
import { RfqReferenceCard } from '@/components/features/order-detail/RfqReferenceCard';
import { OrderBOQCard } from '@/components/features/order-detail/OrderBOQCard';
import { formatDateTh } from '@/components/features/order-detail/utils';
import { ReviewImageAttachments } from '@/components/features/reviews/ReviewImageAttachments';
import { normalizeReviewImageUrls } from '@/utils/reviewImageUrls';
import { OrderProductionTab } from '@/components/features/production/OrderProductionTab';
import { useRfqDetailQuery } from '@/domain/rfq/queries/useRfqDetailQuery';
import { useOrderDetail } from '@/pages/order-detail/OrderDetailContext';
import { AppDialog } from '@/components/ui/app-dialog';
import { Textarea } from '@/components/ui/textarea';

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
    production,
    reviewState,
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
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImageUrls, setReviewImageUrls] = useState<string[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const canShowCancelButton = apiStatus === 'PP';

  // Show acceptance banner when production step 5 = IP (step 4 CD → awaiting customer confirmation)
  const step5IsIP = useMemo(
    () =>
      production.updates?.some(
        (u) => Number(u.step_id) === 5 && String(u.status).toUpperCase() === 'IP',
      ) ?? false,
    [production.updates],
  );
  const showAcceptDeliveryBanner =
    step5IsIP && order.status !== 'completed' && order.status !== 'shipped';

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

  const { data: rfqDetail } = useRfqDetailQuery(order.rfqId || undefined);
  const relatedRfq = rfqDetail?.rfq ?? undefined;
  const relatedFactory = data.factories.find((f) => f.id === order.factoryId);
  const rfqOffers = relatedRfq?.offers ?? [];

  const openOrderChat = () => {
    const my = getCurrentUserId(user);
    const fid = Number(order.factoryId);
    const oid = Number(order.id);
    if (my == null || !Number.isFinite(fid) || fid <= 0 || !Number.isFinite(oid) || oid <= 0)
      return;
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

  // Floating action: show for shipped/completed, but NOT for step-5-IP (that uses the inline banner)
  const showFloatingAction =
    (order.status === 'shipped' && !showAcceptDeliveryBanner) || order.status === 'completed';

  const onConfirmReceive = async () => {
    if (confirmingReceive) return;
    setReceiveForbidden(false);
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
      await refetchAll();
    } catch (e) {
      if (e instanceof ApiHttpError) {
        const m = String(e.message ?? '').toLowerCase();
        if (m.includes('review already exists')) toast.error('คุณรีวิวคำสั่งซื้อนี้ไปแล้ว');
        else if (m.includes('order must be completed'))
          toast.error('สามารถรีวิวได้หลังคำสั่งซื้อเสร็จสมบูรณ์');
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
    <div className='min-h-screen flex flex-col bg-white'>
      <header className='hidden lg:block px-0 pt-1 pb-3'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate('/orders')}
          className='mb-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50'
        >
          <ChevronLeft size={16} />
          กลับไปรายการคำสั่งซื้อ
        </Button>
        <h1 className='text-xl text-gray-900' style={{ fontWeight: 700 }}>
          {rfq?.title ?? order.projectName}
        </h1>
        <p className='text-xs text-gray-500'>
          คำสั่งซื้อ #{order.id} · สร้างเมื่อ {formatDateTh(order.createdAt)}
        </p>
      </header>

      <div className='flex lg:hidden items-center justify-between px-4 pt-5 pb-4'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center'
        >
          <ChevronLeft size={22} className='text-gray-700' />
        </Button>
        <div className='text-center min-w-0 flex-1 px-2'>
          <h1
            className='text-sm text-gray-900 max-w-[240px] truncate mx-auto'
            style={{ fontWeight: 700 }}
            title={rfq?.title ?? order.projectName}
          >
            {rfq?.title ?? order.projectName}
          </h1>
          <p className='text-[10px] text-gray-400'>คำสั่งซื้อ #{order.id}</p>
        </div>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => openOrderChat()}
          className='w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center'
        >
          <MessageCircle size={20} style={{ color: 'var(--brand-purple)' }} />
        </Button>
      </div>

      <div className='flex-1 flex flex-col min-h-0'>
        {receiveForbidden ? (
          <div className='px-4 pt-2'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate(-1)}
              className='w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700'
            >
              กลับไปรายการคำสั่งซื้อ
            </Button>
          </div>
        ) : null}
        <div className='flex-1 overflow-y-auto px-4 pb-4 space-y-4'>
          <OrderSummaryCard
            order={order}
            rfqSummary={rfqSummary}
            relatedFactory={relatedFactory}
            statusLabelTh={statusLabelTh}
          />

          {/* PP — รอชำระเงิน */}
          {uiMode.lockReason === 'PENDING_DEPOSIT' &&
          uiMode.showActionBanner &&
          (nextAction != null || paymentSchedule.length > 0) ? (
            <OrderActionBanner
              nextAction={nextAction}
              paymentSchedule={paymentSchedule}
              variant='pending_deposit'
              fallbackCtaUrl={lockContextMerged.payment_url}
              onPayDeposit={openDepositModal}
            />
          ) : null}

          {/* PE — หมดกำหนดชำระแล้ว ทำอะไรไม่ได้ */}
          {uiMode.lockReason === 'DEPOSIT_EXPIRED' ? (
            <div className='rounded-2xl border border-red-200 bg-red-50 px-4 py-4 space-y-2'>
              <div className='flex items-center gap-2'>
                <AlertTriangle size={16} className='text-red-500 shrink-0' />
                <span className='text-sm font-bold text-red-700'>คำสั่งซื้อหมดอายุ</span>
              </div>
              {(lockContextMerged.expired_at ?? lockContextMerged.deposit_due_date) ? (
                <p className='text-xs text-red-700 leading-relaxed'>
                  ครบกำหนดชำระ{' '}
                  {formatDateTh(
                    lockContextMerged.expired_at ?? lockContextMerged.deposit_due_date ?? '',
                  )}
                </p>
              ) : null}
              <p className='text-xs text-red-600 leading-relaxed'>
                เกินกำหนดชำระเงินแล้ว คำสั่งซื้อนี้ถูกระงับและไม่สามารถดำเนินการต่อได้
              </p>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate('/orders')}
                className='w-full mt-1 py-2.5 rounded-xl border border-red-200 text-xs font-semibold text-red-600 bg-white'
              >
                กลับไปหน้าใบเสนอราคา
              </Button>
            </div>
          ) : null}

          {/* ยืนยันรับสินค้า — แสดงเมื่อ step 5 = IP (โรงงานส่งแล้ว รอลูกค้ายืนยัน) */}
          {showAcceptDeliveryBanner ? (
            <div className='rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4 space-y-3'>
              <div className='flex items-start gap-3'>
                <div className='w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 mt-0.5'>
                  <PackageCheck size={18} style={{ color: 'var(--brand-purple)' }} />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-bold text-violet-900'>สินค้าอยู่ระหว่างการจัดส่ง</p>
                  <p className='text-xs text-violet-700 mt-1 leading-relaxed'>
                    กรุณาตรวจสอบสินค้าและกดยืนยันรับสินค้า เพื่อโอนเงินให้โรงงาน
                  </p>
                </div>
              </div>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => void onConfirmReceive()}
                disabled={confirmingReceive}
                className='w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2'
                style={{ background: confirmingReceive ? '#7C3AED99' : 'var(--brand-purple)' }}
              >
                {confirmingReceive ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin' />
                    กำลังยืนยัน...
                  </>
                ) : (
                  <>
                    <PackageCheck size={16} />
                    ยืนยันรับสินค้า
                  </>
                )}
              </Button>
            </div>
          ) : null}

          <div className='flex border-b border-gray-100 bg-white -mx-4 px-0'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setActiveSection('overview')}
              className={`flex-1 py-3 border-b-2 transition-colors ${
                activeSection === 'overview'
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-transparent text-gray-400'
              }`}
              style={{ fontSize: 14 }}
            >
              ภาพรวม
            </Button>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setActiveSection('production')}
              className={`flex-1 py-3 border-b-2 transition-colors ${
                activeSection === 'production'
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-transparent text-gray-400'
              }`}
              style={{ fontSize: 14 }}
            >
              การผลิต
            </Button>
          </div>

          {activeSection === 'overview' && (
            <>
              {quotation ? (
                <OrderBOQCard quotation={quotation} factoryName={order.factoryName} />
              ) : null}
              {rfq ? (
                <RfqReferenceCard rfq={rfq} variant='accordion' quotation={quotation} />
              ) : null}
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
                <div className='pt-2 pb-1'>
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => setCancelModalOpen(true)}
                    className='w-full py-3 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors'
                    style={{
                      borderColor: '#FCA5A5',
                      color: 'var(--status-danger-deep)',
                      backgroundColor: 'var(--surface-rose-tint)',
                    }}
                  >
                    <X size={16} />
                    ยกเลิกคำสั่งซื้อ
                  </Button>
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
          <div className='shrink-0 px-4 pt-3 pb-6 bg-gradient-to-t from-white/90 to-transparent'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => {
                if (order.status === 'shipped') {
                  void onConfirmReceive();
                } else if (order.status === 'completed') {
                  onOpenReview();
                }
              }}
              disabled={order.status === 'shipped' ? confirmingReceive : false}
              className='w-full py-4 rounded-2xl text-white text-sm shadow-xl'
              style={{
                background: 'linear-gradient(135deg, var(--brand-navy-deep), #4A267D)',
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
            </Button>
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

      <AppDialog
        open={cancelModalOpen}
        onOpenChange={(v) => {
          if (v) return;
          if (!cancellingOrder) setCancelModalOpen(false);
        }}
        showCloseButton={false}
        variant='sheet'
        size='sm'
        dismissible={!cancellingOrder}
        className='max-w-sm overflow-hidden'
        bodyClassName='p-0'
        overlayClassName='bg-black/50'
      >
        <div className='px-5 pt-6 pb-2 text-center space-y-3'>
          <div className='w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto'>
            <AlertTriangle size={24} className='text-red-500' />
          </div>
          <h3 className='text-base font-bold text-gray-900'>ยืนยันการยกเลิกคำสั่งซื้อ?</h3>
          <p className='text-sm text-gray-500 leading-relaxed'>
            คำสั่งซื้อ <span className='font-semibold text-gray-700'>#{order.id}</span> จะถูกยกเลิก
            <br />
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </p>
        </div>
        <div className='px-5 pt-3 pb-6 grid grid-cols-2 gap-2'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => setCancelModalOpen(false)}
            disabled={cancellingOrder}
            className='py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 disabled:opacity-50'
          >
            ไม่ยกเลิก
          </Button>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => void onCancelOrder()}
            disabled={cancellingOrder}
            className='py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-1.5'
            style={{ background: cancellingOrder ? '#F87171' : 'var(--status-danger-deep)' }}
          >
            {cancellingOrder ? (
              <>
                <div className='w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin' />
                กำลังยกเลิก...
              </>
            ) : (
              'ยืนยันยกเลิก'
            )}
          </Button>
        </div>
      </AppDialog>

      <AppDialog
        open={reviewModalOpen}
        onOpenChange={(v) => {
          if (!v) setReviewModalOpen(false);
        }}
        title={reviewState?.already_reviewed ? 'รีวิวของคุณ' : 'ให้คะแนนและรีวิว'}
        variant='sheet'
        size='md'
        className='max-w-md border border-gray-100'
        bodyClassName='p-4'
      >
        <div className='flex items-center justify-between mb-2'>
          <span className='sr-only'>
            {reviewState?.already_reviewed ? 'รีวิวของคุณ' : 'ให้คะแนนและรีวิว'}
          </span>
        </div>

        {reviewState?.already_reviewed && reviewState.review ? (
          <div className='space-y-3'>
            <div className='flex items-center gap-1'>
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
            <p className='text-sm text-gray-700 whitespace-pre-wrap'>
              {reviewState.review.comment}
            </p>
            <ReviewImageAttachments
              urls={normalizeReviewImageUrls(reviewState.review.image_urls)}
              onPreviewUrl={(u) => setSelectedPhoto(u)}
            />
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setReviewModalOpen(false)}
              className='w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700'
            >
              ปิด
            </Button>
          </div>
        ) : (
          <div className='space-y-3'>
            <div className='flex items-center gap-1'>
              {[1, 2, 3, 4, 5].map((s) => (
                <Button
                  variant='unstyled'
                  key={s}
                  type='button'
                  onClick={() => setReviewRating(s)}
                  className='p-0.5'
                  aria-label={`${s} ดาว`}
                >
                  <Star
                    size={20}
                    className={
                      s <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                    }
                  />
                </Button>
              ))}
            </div>
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder='แบ่งปันประสบการณ์ของคุณ'
              className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300'
            />
            <ReviewImageAttachments
              urls={reviewImageUrls}
              onChange={setReviewImageUrls}
              onUploadError={(msg) => toast.error(msg)}
            />
            <Button
              variant='unstyled'
              type='button'
              onClick={() => void onSubmitReview()}
              disabled={reviewSubmitting}
              className='w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60'
              style={{ background: 'var(--brand-royal)' }}
            >
              {reviewSubmitting ? 'กำลังส่งรีวิว...' : 'ส่งรีวิว'}
            </Button>
          </div>
        )}
      </AppDialog>
    </div>
  );
}

export function OrderDetailMobile() {
  return <OrderDetailMobileBody />;
}
