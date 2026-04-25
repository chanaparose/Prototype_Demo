import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, MessageCircle } from 'lucide-react';
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
} from '../../components/features/order-detail';
import { OrderProductionTab } from '../../components/features/production/OrderProductionTab';
import { useOrderDetail } from './OrderDetailContext';

function OrderDetailMobileBody() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const data = useData();
  const {
    mappedOrder: order,
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
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
            </>
          )}

          {activeSection === 'production' && (
            <OrderProductionTab
              orderId={order.id}
              onPhotoClick={setSelectedPhoto}
              onRequestOverviewTab={() => setActiveSection('overview')}
              onPayDeposit={uiMode.lockReason === 'PENDING_DEPOSIT' ? openDepositModal : undefined}
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
    </div>
  );
}

export function OrderDetailMobile() {
  return <OrderDetailMobileBody />;
}
