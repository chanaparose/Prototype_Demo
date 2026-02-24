import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronLeft, MessageCircle, CheckCircle, Clock, Circle, Camera, X
} from 'lucide-react';
import { orders } from '../data/mockData';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const order = orders.find((o) => o.id === id) || orders[0];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    in_production: { label: 'กำลังผลิต', color: '#3B82F6', bg: '#DBEAFE' },
    shipped: { label: 'จัดส่งแล้ว', color: '#F59E0B', bg: '#FEF3C7' },
    completed: { label: 'เสร็จสิ้น', color: '#22C55E', bg: '#DCFCE7' },
  };

  const cfg = statusConfig[order.status] || statusConfig.in_production;

  const showFloatingAction = order.status === 'shipped' || order.status === 'completed';

  return (
    <div
      className="max-w-[430px] mx-auto min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(145deg, rgba(236,253,245,0.5) 0%, #fff 30%, #fff 65%, rgba(237,233,254,0.4) 100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center"
        >
          <ChevronLeft size={22} className="text-gray-700" />
        </button>
        <div className="text-center">
          <p className="text-[10px] text-gray-400">Order #{order.id}</p>
          <h1 className="text-sm text-gray-900 max-w-[200px] truncate" style={{ fontWeight: 700 }}>
            {order.projectName}
          </h1>
        </div>
        <button
          onClick={() => navigate('/messages/conv1')}
          className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center"
        >
          <MessageCircle size={20} style={{ color: '#6C47FF' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4">
        {/* Order Summary Card */}
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)' }}
        >
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-20 bg-white" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white/80 text-[10px]">{order.factoryName}</p>
                <p className="text-white" style={{ fontWeight: 700 }}>{order.projectName}</p>
              </div>
              <span
                className="px-2.5 py-1 rounded-full text-[10px]"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
              >
                {cfg.label}
              </span>
            </div>
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-xs text-white/80">
                <span>ความคืบหน้า</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>{order.progress}%</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${order.progress}%` }}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-white text-sm" style={{ fontWeight: 700 }}>
                  ฿{order.totalAmount.toLocaleString()}
                </p>
                <p className="text-white/70 text-[10px]">มูลค่ารวม</p>
              </div>
              <div className="w-px bg-white/30" />
              <div>
                <p className="text-white text-sm" style={{ fontWeight: 700 }}>
                  {order.quantity.toLocaleString()} ชิ้น
                </p>
                <p className="text-white/70 text-[10px]">จำนวน</p>
              </div>
              <div className="w-px bg-white/30" />
              <div>
                <p className="text-white text-sm" style={{ fontWeight: 700 }}>
                  {order.estimatedDelivery}
                </p>
                <p className="text-white/70 text-[10px]">กำหนดส่ง</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>สถานะการชำระเงิน</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">ชำระมัดจำ 50%</span>
            <span className="text-xs" style={{ color: '#22C55E', fontWeight: 600 }}>
              ✓ ชำระแล้ว ฿{order.depositPaid.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">ยอดคงเหลือ</span>
            <span className="text-xs text-gray-900" style={{ fontWeight: 600 }}>
              ฿{(order.totalAmount - order.depositPaid).toLocaleString()}
            </span>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(order.depositPaid / order.totalAmount) * 100}%`,
                background: '#22C55E',
              }}
            />
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="text-sm text-gray-900 mb-3" style={{ fontWeight: 700 }}>
            ติดตามความคืบหน้า
          </p>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="space-y-0">
              {order.timeline.map((milestone, index) => {
                const isLast = index === order.timeline.length - 1;
                return (
                  <div key={milestone.id} className="flex gap-3">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10"
                        style={{
                          background:
                            milestone.status === 'completed'
                              ? '#6C47FF'
                              : milestone.status === 'current'
                              ? '#EDE9FF'
                              : '#F3F4F6',
                          border:
                            milestone.status === 'current'
                              ? '2px solid #6C47FF'
                              : 'none',
                        }}
                      >
                        {milestone.status === 'completed' ? (
                          <CheckCircle size={16} className="text-white" />
                        ) : milestone.status === 'current' ? (
                          <div
                            className="w-3 h-3 rounded-full animate-pulse"
                            style={{ background: '#6C47FF' }}
                          />
                        ) : (
                          <Circle size={16} className="text-gray-300" />
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className="w-0.5 flex-1 my-1"
                          style={{
                            background:
                              milestone.status === 'completed' ? '#6C47FF' : '#E5E7EB',
                            minHeight: milestone.photo ? 120 : 32,
                          }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p
                            className="text-sm"
                            style={{
                              fontWeight: 600,
                              color:
                                milestone.status === 'current'
                                  ? '#6C47FF'
                                  : milestone.status === 'completed'
                                  ? '#1F2937'
                                  : '#9CA3AF',
                            }}
                          >
                            {milestone.title}
                          </p>
                          {milestone.date && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock size={10} className="text-gray-400" />
                              <span className="text-[10px] text-gray-400">{milestone.date}</span>
                            </div>
                          )}
                          {milestone.description && (
                            <p className="text-[11px] text-gray-500 mt-1">{milestone.description}</p>
                          )}
                        </div>
                        {milestone.status === 'current' && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] ml-2"
                            style={{ background: '#EDE9FF', color: '#6C47FF', fontWeight: 600 }}
                          >
                            ปัจจุบัน
                          </span>
                        )}
                      </div>

                      {/* Milestone Photo */}
                      {milestone.photo && (
                        <button
                          onClick={() => setSelectedPhoto(milestone.photo!)}
                          className="mt-2 relative overflow-hidden rounded-xl"
                          style={{ width: '100%', height: 100 }}
                        >
                          <img
                            src={milestone.photo}
                            alt={milestone.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/10 flex items-end p-2">
                            <div
                              className="flex items-center gap-1 px-2 py-1 rounded-lg"
                              style={{ background: 'rgba(0,0,0,0.5)' }}
                            >
                              <Camera size={10} className="text-white" />
                              <span className="text-[10px] text-white">ดูรูป</span>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      {showFloatingAction && (
        <div className="absolute bottom-6 left-4 right-4">
          <button
            className="w-full py-4 rounded-2xl text-white text-sm shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)',
              fontWeight: 700,
            }}
          >
            {order.status === 'shipped' ? '✓ ยืนยันการรับสินค้า' : '⭐ ให้คะแนนและรีวิว'}
          </button>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={20} className="text-white" />
          </button>
          <img
            src={selectedPhoto}
            alt="milestone"
            className="max-w-full max-h-[80vh] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
