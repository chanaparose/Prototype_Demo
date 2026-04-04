import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  CheckCircle,
  Star,
  Clock,
  Zap,
  Award,
  MessageCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { quotationsApi } from '../../../services/api';

export type OfferItem = {
  id: string;
  factoryName: string;
  factoryId: string;
  price: number;
  leadTime: number;
  responseTime: string;
  rating: number;
  completedOrders: number;
  verified?: boolean;
  recommended?: boolean;
  aiReason?: string;
};

export type OrderForRfq = {
  id: string;
  factoryName: string;
  totalAmount: number;
  quantity: number;
};

type RfqDetailOffersSectionProps = {
  rfqStatus: string;
  offers: OfferItem[];
  isHistoryView: boolean;
  orderForRfq: OrderForRfq | null | undefined;
  selectedOfferId: string | null;
  onSelectOffer: (id: string | null) => void;
  onNavigateToMessages: () => void;
  onOfferAccepted?: (offerId: string) => void;
};

export function RfqDetailOffersSection({
  rfqStatus,
  offers,
  isHistoryView,
  orderForRfq,
  selectedOfferId,
  onSelectOffer,
  onNavigateToMessages,
  onOfferAccepted,
}: RfqDetailOffersSectionProps) {
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const handleAcceptOffer = async (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (acceptingId) return;
    setAcceptingId(offerId);
    try {
      await quotationsApi.updateStatus(offerId, 'AC');
      onOfferAccepted?.(offerId);
    } catch {
      // silently fail; user can retry
    } finally {
      setAcceptingId(null);
    }
  };
  if (isHistoryView && offers.length > 0) {
    return (
      <>
        <div>
          <p className="text-sm text-[#2E2252] mb-3" style={{ fontWeight: 700 }}>
            ประวัติโรงงานที่เคยเสนอราคา
          </p>
          <div className="space-y-3">
            {offers.map((offer) => (
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
                        <p className="text-sm text-[#2E2252]" style={{ fontWeight: 600 }}>
                          {offer.factoryName}
                        </p>
                        {offer.verified && (
                          <CheckCircle size={13} style={{ color: '#7A4B94' }} />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] text-gray-500">{offer.rating}</span>
                        <span className="text-[10px] text-gray-400">
                          ({offer.completedOrders} งาน)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-xl p-2.5">
                    <p className="text-sm text-[#2E2252]" style={{ fontWeight: 700 }}>
                      ฿{(offer.price / 1000).toFixed(0)}K
                    </p>
                    <p className="text-[9px] text-gray-500">ราคารวม</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5">
                    <p className="text-sm text-[#2E2252]" style={{ fontWeight: 700 }}>
                      {offer.leadTime} วัน
                    </p>
                    <p className="text-[9px] text-gray-500">lead time</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5">
                    <p className="text-sm text-[#2E2252]" style={{ fontWeight: 700 }}>
                      {offer.responseTime}
                    </p>
                    <p className="text-[9px] text-gray-500">ตอบกลับ</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {rfqStatus === 'completed' && orderForRfq && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-green-700 mb-2">โรงงานที่เลือก</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg">
                🏭
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#2E2252]">{orderForRfq.factoryName}</p>
                <p className="text-xs text-gray-500">
                  ฿{orderForRfq.totalAmount.toLocaleString('th-TH')} •{' '}
                  {orderForRfq.quantity.toLocaleString('th-TH')} ชิ้น
                </p>
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

        {rfqStatus === 'cancelled' && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
              <XCircle size={24} className="text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">ยกเลิกคำขอโดยลูกค้า</p>
              <p className="text-xs text-slate-500 mt-0.5">
                คำขอนี้ถูกยกเลิกโดยคุณ ไม่มีการส่งคำสั่งซื้อ
              </p>
            </div>
          </div>
        )}

        {rfqStatus === 'expired' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                ไม่มีการส่งคำสั่งในเวลาที่กำหนด
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                หมดระยะเวลาตอบรับใบเสนอราคา คุณสามารถสร้าง RFQ ใหม่ได้
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (isHistoryView && offers.length === 0) {
    return (
      <>
        {rfqStatus === 'cancelled' && (
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
        {rfqStatus === 'expired' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                ไม่มีการส่งคำสั่งในเวลาที่กำหนด
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                หมดระยะเวลารอใบเสนอราคา คุณสามารถสร้าง RFQ ใหม่ได้
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!isHistoryView && offers.length > 0) {
    const recommendedOffers = offers.filter((o) => o.recommended);
    return (
      <>
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #4A267D 100%)' }}
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20 bg-white" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-yellow-300" />
              <span className="text-white text-xs" style={{ fontWeight: 600 }}>
                AI แนะนำ
              </span>
            </div>
            {recommendedOffers.map((offer) => (
              <div key={offer.id}>
                <p className="text-white mb-1" style={{ fontWeight: 700 }}>
                  {offer.factoryName} คุ้มค่าที่สุด
                </p>
                <p className="text-white/80 text-xs">{offer.aiReason}</p>
                <div className="flex gap-3 mt-3">
                  <div className="text-center">
                    <p className="text-white text-sm" style={{ fontWeight: 700 }}>
                      ฿{offer.price.toLocaleString()}
                    </p>
                    <p className="text-white/70 text-[10px]">ราคา</p>
                  </div>
                  <div className="w-px bg-white/30" />
                  <div className="text-center">
                    <p className="text-white text-sm" style={{ fontWeight: 700 }}>
                      {offer.leadTime} วัน
                    </p>
                    <p className="text-white/70 text-[10px]">lead time</p>
                  </div>
                  <div className="w-px bg-white/30" />
                  <div className="text-center">
                    <p className="text-white text-sm" style={{ fontWeight: 700 }}>
                      ★ {offer.rating}
                    </p>
                    <p className="text-white/70 text-[10px]">rating</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm text-[#2E2252] mb-3" style={{ fontWeight: 700 }}>
            เปรียบเทียบใบเสนอราคา
          </p>
          <div className="space-y-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                onClick={() => onSelectOffer(selectedOfferId === offer.id ? null : offer.id)}
                className="bg-white rounded-2xl p-4 shadow-sm border-2 cursor-pointer transition-all"
                style={{
                  borderColor: offer.recommended
                    ? '#7A4B94'
                    : selectedOfferId === offer.id
                      ? '#9D77B2'
                      : 'transparent',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                      style={{ background: '#F8F6FA' }}
                    >
                      🏭
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm text-[#2E2252]" style={{ fontWeight: 600 }}>
                          {offer.factoryName}
                        </p>
                        {offer.verified && (
                          <CheckCircle size={13} style={{ color: '#7A4B94' }} />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] text-gray-500">{offer.rating}</span>
                        <span className="text-[10px] text-gray-400">
                          ({offer.completedOrders} งาน)
                        </span>
                      </div>
                    </div>
                  </div>
                  {offer.recommended && (
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                      style={{
                        background: '#F8F6FA',
                        color: '#7A4B94',
                        fontWeight: 600,
                      }}
                    >
                      <Award size={10} /> แนะนำ
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p
                      className="text-sm text-[#2E2252]"
                      style={{ fontWeight: 700, color: '#7A4B94' }}
                    >
                      ฿{(offer.price / 1000).toFixed(0)}K
                    </p>
                    <p className="text-[9px] text-gray-500">ราคารวม</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-sm text-[#2E2252]" style={{ fontWeight: 700 }}>
                      {offer.leadTime}
                    </p>
                    <p className="text-[9px] text-gray-500">วัน</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-sm text-[#2E2252]" style={{ fontWeight: 700 }}>
                      {offer.responseTime}
                    </p>
                    <p className="text-[9px] text-gray-500">ตอบกลับ</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mb-3">{offer.aiReason}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToMessages();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs border"
                    style={{
                      borderColor: '#7A4B94',
                      color: '#7A4B94',
                      fontWeight: 600,
                    }}
                  >
                    <MessageCircle size={14} /> แชท
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleAcceptOffer(offer.id, e)}
                    disabled={!!acceptingId}
                    className="flex-1 py-2.5 rounded-xl text-xs text-white disabled:opacity-60"
                    style={{ background: '#7A4B94', fontWeight: 600 }}
                  >
                    {acceptingId === offer.id ? 'กำลังส่ง...' : 'เลือกโรงงานนี้'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
        style={{ background: '#F3F4F6' }}
      >
        <Clock size={28} className="text-gray-400" />
      </div>
      <p className="text-sm text-gray-700" style={{ fontWeight: 600 }}>
        กำลังรอใบเสนอราคา
      </p>
      <p className="text-xs text-gray-400 mt-1">
        โรงงานจะตอบกลับภายใน 2-4 ชั่วโมง
      </p>
    </div>
  );
}
