import React from 'react';
import { Link } from 'react-router';
import { FileText } from 'lucide-react';
import { formatDateTh } from './utils';

export type OrderForOverview = {
  totalAmount: number;
  depositPaid: number;
  factoryId: string;
  factoryName: string;
};

export type RfqForOverview = {
  category: string;
  categoryIcon?: string | React.ReactNode;
  projectName: string;
  description?: string;
  budget: number;
  quantity: number;
  material: string;
  deadline: string;
};

export type OfferForOverview = {
  id: string;
  factoryId: string;
  factoryName: string;
  rating: number;
  responseTime: string;
  price: number;
  leadTime: number;
  recommended?: boolean;
  verified?: boolean;
};

type OrderOverviewSectionProps = {
  order: OrderForOverview;
  relatedRfq: RfqForOverview | null | undefined;
  rfqOffers: OfferForOverview[];
};

export function OrderOverviewSection({
  order,
  relatedRfq,
  rfqOffers,
}: OrderOverviewSectionProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>
          สถานะการชำระเงิน
        </p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">ชำระมัดจำ 50%</span>
          <span className="text-xs" style={{ color: '#22C55E', fontWeight: 600 }}>
            ✓ ชำระแล้ว ฿{order.depositPaid.toLocaleString('th-TH')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">ยอดคงเหลือ</span>
          <span className="text-xs text-gray-900" style={{ fontWeight: 600 }}>
            ฿{(order.totalAmount - order.depositPaid).toLocaleString('th-TH')}
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

      {relatedRfq && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-gray-900 mb-3" style={{ fontWeight: 600 }}>
            RFQ ที่เกี่ยวข้อง
          </p>
          <div className="rounded-xl border border-gray-100 p-3 bg-[#F8F6FA]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-[#F8F6FA]">
                {relatedRfq.categoryIcon ?? '📋'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">{relatedRfq.category}</p>
                <p className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>
                  {relatedRfq.projectName}
                </p>
              </div>
              <FileText size={18} className="text-[#A238FF] shrink-0" />
            </div>

            <p className="text-xs text-gray-600 mb-3">{relatedRfq.description}</p>

            <div className="mb-3 rounded-lg bg-white border border-gray-100 px-2.5 py-2">
              <p className="text-[10px] text-gray-500 mb-0.5">โรงงานที่เลือก</p>
              <Link
                to={`/factories/${order.factoryId}`}
                className="text-xs text-[#A238FF] hover:underline"
                style={{ fontWeight: 600 }}
              >
                {order.factoryName}
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2">
                <p className="text-[10px] text-gray-500">งบประมาณ RFQ</p>
                <p className="text-xs text-gray-900" style={{ fontWeight: 600 }}>
                  ฿{relatedRfq.budget.toLocaleString('th-TH')}
                </p>
              </div>
              <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2">
                <p className="text-[10px] text-gray-500">จำนวน</p>
                <p className="text-xs text-gray-900" style={{ fontWeight: 600 }}>
                  {relatedRfq.quantity.toLocaleString('th-TH')} ชิ้น
                </p>
              </div>
              <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2">
                <p className="text-[10px] text-gray-500">วัสดุ</p>
                <p className="text-xs text-gray-900 truncate" style={{ fontWeight: 600 }}>
                  {relatedRfq.material}
                </p>
              </div>
              <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2">
                <p className="text-[10px] text-gray-500">กำหนดส่ง RFQ</p>
                <p className="text-xs text-gray-900" style={{ fontWeight: 600 }}>
                  {formatDateTh(relatedRfq.deadline)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {relatedRfq && rfqOffers.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
              โรงงานที่เคยเสนอราคา
            </p>
            <span className="text-xs text-gray-500">{rfqOffers.length} โรงงาน</span>
          </div>

          <div className="space-y-2.5">
            {rfqOffers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl border border-gray-100 bg-[#F8F6FA] px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/factories/${offer.factoryId}`}
                      className="text-sm text-[#A238FF] hover:underline truncate block"
                      style={{ fontWeight: 600 }}
                    >
                      {offer.factoryName}
                    </Link>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      เรตติ้ง {offer.rating} • ตอบกลับ {offer.responseTime}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                      ฿{offer.price.toLocaleString('th-TH')}
                    </p>
                    <p className="text-[11px] text-gray-500">Lead time {offer.leadTime} วัน</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {offer.factoryId === order.factoryId && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px]"
                      style={{ background: 'rgba(162,56,255,0.12)', color: '#A238FF', fontWeight: 600 }}
                    >
                      โรงงานที่เลือก
                    </span>
                  )}
                  {offer.recommended && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px]"
                      style={{ background: '#ECFDF5', color: '#059669', fontWeight: 600 }}
                    >
                      แนะนำโดย AI
                    </span>
                  )}
                  {offer.verified && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px]"
                      style={{ background: '#EEF2FF', color: '#4F46E5', fontWeight: 600 }}
                    >
                      Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
