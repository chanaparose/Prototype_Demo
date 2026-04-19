import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, MessageCircle } from 'lucide-react';
import { useData, type Order } from '../../contexts/DataContext';
import { ordersApi } from '../../services/api';
import { mapOrderStatusFromApi, guessOrderProgress } from '../../utils/orderCustomerStatus';
import {
  OrderSummaryCard,
  OrderOverviewSection,
  OrderTimelineSection,
  OrderPhotoGallery,
  OrderPendingPaymentSection,
} from '../../components/features/order-detail';

function mapApiOrderToOrder(
  row: Record<string, unknown>,
  factories: { id: string; name: string }[],
): Order {
  const fid = String(row.factory_id ?? '');
  const st = mapOrderStatusFromApi(String(row.status ?? ''));
  const fName = factories.find((f) => f.id === fid)?.name ?? `โรงงาน #${fid}`;
  return {
    id: String(row.order_id ?? row.id ?? ''),
    rfqId: String(row.rfq_id ?? ''),
    factoryId: fid,
    factoryName: fName,
    projectName: String(row.project_name ?? row.title ?? `คำสั่งซื้อ #${row.order_id ?? row.id}`),
    category: '',
    status: st,
    progress: guessOrderProgress(st),
    totalAmount: Number(row.total_amount ?? 0),
    depositPaid: Number(row.deposit_amount ?? 0),
    quantity: Number(row.quantity ?? 0),
    createdAt: String(row.created_at ?? '').split('T')[0] ?? '',
    estimatedDelivery: String(row.estimated_delivery ?? '').split('T')[0] ?? '',
    timeline: [],
  };
}

export function OrderDetailMobile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const data = useData();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'timeline'>('overview');
  const [remoteOrder, setRemoteOrder] = useState<Order | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(true);
  const [remoteFailed, setRemoteFailed] = useState(false);

  const orderFromCtx = id ? data.orders.find((o) => o.id === id) : undefined;
  const order = remoteOrder ?? orderFromCtx;

  const fetchRemote = useCallback(async () => {
    if (!id) return;
    setRemoteLoading(true);
    setRemoteFailed(false);
    try {
      const row = (await ordersApi.get(id)) as Record<string, unknown>;
      setRemoteOrder(mapApiOrderToOrder(row, data.factories));
    } catch {
      setRemoteOrder(null);
      setRemoteFailed(true);
    } finally {
      setRemoteLoading(false);
    }
  }, [id, data.factories]);

  useEffect(() => {
    void fetchRemote();
  }, [fetchRemote]);

  const relatedRfq = order ? data.rfqs.find((r) => r.id === order.rfqId) : undefined;
  const relatedFactory = order
    ? data.factories.find((f) => f.id === order.factoryId)
    : undefined;
  const conversation = order
    ? data.conversations.find((c) => c.factoryId === order.factoryId)
    : undefined;

  if (!id) {
    return null;
  }

  if (!order) {
    if (remoteLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div
            className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin mb-3"
            style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-gray-500">กำลังโหลดคำสั่งซื้อ…</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-sm text-gray-500 mb-4 text-center">
          {remoteFailed ? 'ไม่พบคำสั่งซื้อจากระบบ' : 'ไม่พบคำสั่งซื้อ'}
        </p>
        <button
          onClick={() => navigate('/orders')}
          className="px-6 py-3 rounded-xl text-white font-semibold"
          style={{ background: '#A238FF' }}
        >
          กลับไปรายการคำสั่งซื้อ
        </button>
      </div>
    );
  }

  const showFloatingAction = order.status === 'shipped' || order.status === 'completed';
  const rfqOffers = relatedRfq?.offers ?? [];
  const showDepositPayment = order.status === 'pending_payment';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center"
        >
          <ChevronLeft size={22} className="text-gray-700" />
        </button>
        <div className="text-center">
          <p className="text-[10px] text-gray-400">คำสั่งซื้อ #{order.id}</p>
          <h1
            className="text-sm text-gray-900 max-w-[200px] truncate mx-auto"
            style={{ fontWeight: 700 }}
          >
            {order.projectName}
          </h1>
        </div>
        <button
          onClick={() =>
            navigate(conversation ? `/messages/${conversation.id}` : '/messages')
          }
          className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center"
        >
          <MessageCircle size={20} style={{ color: '#A238FF' }} />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {showDepositPayment ? (
            <OrderPendingPaymentSection
              orderId={order.id}
              depositAmount={order.depositPaid}
              totalAmount={order.totalAmount}
              onVerified={() => void fetchRemote()}
            />
          ) : null}

          <OrderSummaryCard order={order} relatedFactory={relatedFactory} />

          <div className="flex border-b border-gray-100 bg-white">
            <button
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
              onClick={() => setActiveSection('timeline')}
              className={`flex-1 py-3 border-b-2 transition-colors ${
                activeSection === 'timeline'
                  ? 'border-[#A238FF] text-[#A238FF]'
                  : 'border-transparent text-gray-400'
              }`}
              style={{ fontSize: 14 }}
            >
              ความคืบหน้า
            </button>
          </div>

          {activeSection === 'overview' && (
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
          )}

          {activeSection === 'timeline' && (
            <OrderTimelineSection
              order={{
                progress: order.progress,
                estimatedDelivery: order.estimatedDelivery,
                status: order.status,
                timeline: order.timeline ?? [],
              }}
              onPhotoClick={setSelectedPhoto}
            />
          )}
        </div>

        {showFloatingAction && (
          <div className="shrink-0 px-4 pt-3 pb-6 bg-gradient-to-t from-white/90 to-transparent">
            <button
              type="button"
              className="w-full py-4 rounded-2xl text-white text-sm shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #2D1B4E, #4A267D)',
                fontWeight: 700,
              }}
            >
              {order.status === 'shipped'
                ? '✓ ยืนยันการรับสินค้า'
                : '⭐ ให้คะแนนและรีวิว'}
            </button>
          </div>
        )}
      </div>

      <OrderPhotoGallery photoUrl={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </div>
  );
}
