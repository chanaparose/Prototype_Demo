import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, MessageCircle } from 'lucide-react';
import { orders, rfqs, factories, conversations } from '../../data/mockData';
import {
  OrderSummaryCard,
  OrderOverviewSection,
  OrderTimelineSection,
  OrderPhotoGallery,
} from '../../components/features/order-detail';

export function OrderDetailMobile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'timeline'>(
    'overview',
  );

  const order = id ? orders.find((o) => o.id === id) : undefined;
  const relatedRfq = order ? rfqs.find((r) => r.id === order.rfqId) : undefined;
  const relatedFactory = order
    ? factories.find((f) => f.id === order.factoryId)
    : undefined;
  const conversation = order
    ? conversations.find((c) => c.factoryId === order.factoryId)
    : undefined;

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-500 mb-4">ไม่พบคำสั่งซื้อ</p>
        <button
          onClick={() => navigate('/orders')}
          className="px-6 py-3 rounded-xl text-white font-semibold"
          style={{ background: '#6C47FF' }}
        >
          กลับไปรายการคำสั่งซื้อ
        </button>
      </div>
    );
  }

  const showFloatingAction =
    order.status === 'shipped' || order.status === 'completed';
  const rfqOffers = relatedRfq?.offers ?? [];

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
          <MessageCircle size={20} style={{ color: '#6C47FF' }} />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          <OrderSummaryCard order={order} relatedFactory={relatedFactory} />

          <div className="flex border-b border-gray-100 bg-white">
            <button
              onClick={() => setActiveSection('overview')}
              className={`flex-1 py-3 border-b-2 transition-colors ${
                activeSection === 'overview'
                  ? 'border-[#6C47FF] text-[#6C47FF]'
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
                  ? 'border-[#6C47FF] text-[#6C47FF]'
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
                background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)',
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

      <OrderPhotoGallery
        photoUrl={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </div>
  );
}

