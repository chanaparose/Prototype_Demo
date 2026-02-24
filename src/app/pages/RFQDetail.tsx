import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import {
  ChevronLeft, Bell, ChevronDown, ChevronUp, Star, MessageCircle, CheckCircle, Clock,
  Zap, Award, XCircle, AlertCircle
} from 'lucide-react';
import { rfqs, orders } from '../data/mockData';

const HISTORY_STATUSES = ['completed', 'cancelled', 'expired'] as const;
const STATUS_LABEL: Record<string, string> = {
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
  expired: 'หมดอายุ',
};

export function RFQDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [specsOpen, setSpecsOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  const rfq = rfqs.find((r) => r.id === id) || rfqs[0];
  const isHistoryView = HISTORY_STATUSES.includes(rfq.status as (typeof HISTORY_STATUSES)[number]);
  const orderForRfq = orders.find((o) => o.rfqId === rfq.id);

  const statusBadgeStyle = isHistoryView
    ? rfq.status === 'completed'
      ? { background: '#D1FAE5', color: '#059669' }
      : rfq.status === 'cancelled'
      ? { background: '#F1F5F9', color: '#64748B' }
      : { background: '#FEF3C7', color: '#B45309' }
    : { background: '#EDE9FF', color: '#6C47FF' };

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
          <p className="text-[10px] text-gray-400">RFQ Detail</p>
          <h1 className="text-sm text-gray-900 max-w-[200px] truncate" style={{ fontWeight: 700 }}>
            {rfq.projectName}
          </h1>
        </div>
        <button className="relative w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
          <Bell size={20} style={{ color: '#6C47FF' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4">
        {/* RFQ Status Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: '#F3F0FF' }}
              >
                {rfq.categoryIcon}
              </div>
              <div>
                <p className="text-[10px] text-gray-400">{rfq.category}</p>
                <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{rfq.projectName}</p>
              </div>
            </div>
            <span
              className="px-2.5 py-1 rounded-full text-[10px] shrink-0"
              style={{ ...statusBadgeStyle, fontWeight: 600 }}
            >
              {isHistoryView ? (STATUS_LABEL[rfq.status] ?? rfq.status) : `${rfq.offerCount} ใบเสนอราคา`}
            </span>
          </div>
          <div className="flex gap-3 text-xs text-gray-500">
            <span>฿{rfq.budget.toLocaleString()}</span>
            <span>•</span>
            <span>{rfq.quantity.toLocaleString()} ชิ้น</span>
            <span>•</span>
            <span>{rfq.material}</span>
          </div>
        </div>

        {/* Collapsible Specs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setSpecsOpen(!specsOpen)}
            className="w-full flex items-center justify-between p-4"
          >
            <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>สเปคของโครงการ</span>
            {specsOpen ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>
          {specsOpen && (
            <div className="px-4 pb-4 border-t border-gray-50">
              <div className="space-y-2.5 mt-3">
                {[
                  { label: 'ประเภทการผลิต', value: rfq.category },
                  { label: 'จำนวน', value: `${rfq.quantity.toLocaleString()} ชิ้น` },
                  { label: 'วัสดุ', value: rfq.material },
                  { label: 'งบประมาณ', value: `฿${rfq.budget.toLocaleString()}` },
                  { label: 'กำหนดส่ง', value: rfq.deadline },
                  { label: 'วันที่สร้าง', value: rfq.createdAt },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span className="text-xs text-gray-900" style={{ fontWeight: 500 }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              {rfq.description && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">รายละเอียด</p>
                  <p className="text-xs text-gray-700">{rfq.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* History: ประวัติโรงงานที่เคยเสนอราคา + status-specific UI */}
        {isHistoryView && rfq.offers.length > 0 && (
          <>
            <div>
              <p className="text-sm text-gray-900 mb-3" style={{ fontWeight: 700 }}>
                ประวัติโรงงานที่เคยเสนอราคา
              </p>
              <div className="space-y-3">
                {rfq.offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm bg-gray-100">
                          🏭
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                              {offer.factoryName}
                            </p>
                            {offer.verified && <CheckCircle size={13} style={{ color: '#6C47FF' }} />}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] text-gray-500">{offer.rating}</span>
                            <span className="text-[10px] text-gray-400">({offer.completedOrders} งาน)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>฿{(offer.price / 1000).toFixed(0)}K</p>
                        <p className="text-[9px] text-gray-500">ราคารวม</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{offer.leadTime} วัน</p>
                        <p className="text-[9px] text-gray-500">lead time</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{offer.responseTime}</p>
                        <p className="text-[9px] text-gray-500">ตอบกลับ</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* เสร็จสิ้น: โรงงานที่เลือก */}
            {rfq.status === 'completed' && orderForRfq && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-green-700 mb-2">โรงงานที่เลือก</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg">🏭</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{orderForRfq.factoryName}</p>
                    <p className="text-xs text-gray-500">฿{orderForRfq.totalAmount.toLocaleString('th-TH')} • {orderForRfq.quantity.toLocaleString('th-TH')} ชิ้น</p>
                  </div>
                  <Link
                    to={`/orders/${orderForRfq.id}`}
                    className="shrink-0 text-xs font-bold text-green-700 hover:underline"
                  >
                    ดูคำสั่งซื้อ →
                  </Link>
                </div>
              </div>
            )}

            {/* ยกเลิก: แสดงว่ายกเลิกโดยลูกค้า */}
            {rfq.status === 'cancelled' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                  <XCircle size={24} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">ยกเลิกคำขอโดยลูกค้า</p>
                  <p className="text-xs text-slate-500 mt-0.5">คำขอนี้ถูกยกเลิกโดยคุณ ไม่มีการส่งคำสั่งซื้อ</p>
                </div>
              </div>
            )}

            {/* หมดอายุ: ไม่มีการส่งคำสั่งในเวลาที่กำหนด */}
            {rfq.status === 'expired' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertCircle size={24} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">ไม่มีการส่งคำสั่งในเวลาที่กำหนด</p>
                  <p className="text-xs text-amber-700 mt-0.5">หมดระยะเวลาตอบรับใบเสนอราคา คุณสามารถสร้าง RFQ ใหม่ได้</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* History but no offers: แสดงเฉพาะ status message */}
        {isHistoryView && rfq.offers.length === 0 && (
          <>
            {rfq.status === 'cancelled' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                  <XCircle size={24} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">ยกเลิกคำขอโดยลูกค้า</p>
                  <p className="text-xs text-slate-500 mt-0.5">คำขอนี้ถูกยกเลิกโดยคุณ</p>
                </div>
              </div>
            )}
            {rfq.status === 'expired' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertCircle size={24} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">ไม่มีการส่งคำสั่งในเวลาที่กำหนด</p>
                  <p className="text-xs text-amber-700 mt-0.5">หมดระยะเวลารอใบเสนอราคา คุณสามารถสร้าง RFQ ใหม่ได้</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Active RFQ: AI Recommendation + เปรียบเทียบใบเสนอราคา */}
        {!isHistoryView && rfq.offers.length > 0 && (
          <>
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #6C47FF 0%, #8B5CF6 100%)' }}
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20 bg-white" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-yellow-300" />
                  <span className="text-white text-xs" style={{ fontWeight: 600 }}>AI แนะนำ</span>
                </div>
                {rfq.offers
                  .filter((o) => o.recommended)
                  .map((offer) => (
                    <div key={offer.id}>
                      <p className="text-white mb-1" style={{ fontWeight: 700 }}>{offer.factoryName} คุ้มค่าที่สุด</p>
                      <p className="text-white/80 text-xs">{offer.aiReason}</p>
                      <div className="flex gap-3 mt-3">
                        <div className="text-center">
                          <p className="text-white text-sm" style={{ fontWeight: 700 }}>฿{offer.price.toLocaleString()}</p>
                          <p className="text-white/70 text-[10px]">ราคา</p>
                        </div>
                        <div className="w-px bg-white/30" />
                        <div className="text-center">
                          <p className="text-white text-sm" style={{ fontWeight: 700 }}>{offer.leadTime} วัน</p>
                          <p className="text-white/70 text-[10px]">lead time</p>
                        </div>
                        <div className="w-px bg-white/30" />
                        <div className="text-center">
                          <p className="text-white text-sm" style={{ fontWeight: 700 }}>★ {offer.rating}</p>
                          <p className="text-white/70 text-[10px]">rating</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-900 mb-3" style={{ fontWeight: 700 }}>เปรียบเทียบใบเสนอราคา</p>
              <div className="space-y-3">
                {rfq.offers.map((offer) => (
                  <div
                    key={offer.id}
                    onClick={() => setSelectedOffer(selectedOffer === offer.id ? null : offer.id)}
                    className="bg-white rounded-2xl p-4 shadow-sm border-2 cursor-pointer transition-all"
                    style={{
                      borderColor: offer.recommended ? '#6C47FF' : selectedOffer === offer.id ? '#C4B5FD' : 'transparent',
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm" style={{ background: '#F3F0FF' }}>🏭</div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{offer.factoryName}</p>
                            {offer.verified && <CheckCircle size={13} style={{ color: '#6C47FF' }} />}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] text-gray-500">{offer.rating}</span>
                            <span className="text-[10px] text-gray-400">({offer.completedOrders} งาน)</span>
                          </div>
                        </div>
                      </div>
                      {offer.recommended && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ background: '#EDE9FF', color: '#6C47FF', fontWeight: 600 }}>
                          <Award size={10} /> แนะนำ
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-sm text-gray-900" style={{ fontWeight: 700, color: '#6C47FF' }}>฿{(offer.price / 1000).toFixed(0)}K</p>
                        <p className="text-[9px] text-gray-500">ราคารวม</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{offer.leadTime}</p>
                        <p className="text-[9px] text-gray-500">วัน</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{offer.responseTime}</p>
                        <p className="text-[9px] text-gray-500">ตอบกลับ</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-3">{offer.aiReason}</p>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); navigate('/messages/conv1'); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs border" style={{ borderColor: '#6C47FF', color: '#6C47FF', fontWeight: 600 }}>
                        <MessageCircle size={14} /> แชท
                      </button>
                      <button onClick={(e) => e.stopPropagation()} className="flex-1 py-2.5 rounded-xl text-xs text-white" style={{ background: '#6C47FF', fontWeight: 600 }}>
                        เลือกโรงงานนี้
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Active RFQ: No offers */}
        {!isHistoryView && rfq.offers.length === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#F3F4F6' }}>
              <Clock size={28} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-700" style={{ fontWeight: 600 }}>กำลังรอใบเสนอราคา</p>
            <p className="text-xs text-gray-400 mt-1">โรงงานจะตอบกลับภายใน 2-4 ชั่วโมง</p>
          </div>
        )}
      </div>
    </div>
  );
}