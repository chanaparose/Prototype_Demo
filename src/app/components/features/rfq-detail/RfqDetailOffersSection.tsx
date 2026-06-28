import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  CheckCircle,
  Star,
  Clock,
  XCircle,
  AlertCircle,
  History,
  GitCompare,
  ExternalLink,
  Factory,
} from 'lucide-react';
import { ordersApi } from '@/services/api/ordersApi';
import type { Quotation } from '@/components/features/rfq-detail/QuotationBOQCard';
import { RfqOfferDetailSheet } from '@/components/features/rfq-detail/RfqOfferDetailSheet';
import { RfqOffersCompareTable } from '@/components/features/rfq-detail/RfqOffersCompareTable';
import { RfqOffersMobileCompareList } from '@/components/features/rfq-detail/RfqOffersMobileCompareList';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';

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
  factoryHighlight?: string;
  /** PD | AC | RJ จากตาราง quotations */
  quoteStatus?: string;
  /** order_id ที่สร้างแล้วเมื่อ quoteStatus = 'AC' */
  orderId?: string;
  /** รายละเอียด BOQ จาก API — รวมกับค่าที่คำนวณจากราคา/จำนวน RFQ */
  quotationDetail?: Partial<Quotation>;
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
  /** แชทกับโรงงานของ offer นี้ (ลูกค้า) — ส่ง RFQ reference ตาม spec */
  onChatWithOffer?: (offer: OfferItem) => void;
  /** หลัง POST /orders (BE accept quote + สร้าง order PP) — ไม่ PATCH quotation ก่อน */
  onOfferFlowComplete?: (result: { quoteId: string; orderId?: string }) => void;
  /** จำนวนจาก RFQ — ใช้ประมาณราคาต่อหน่วยใน BOQ เมื่อ API ไม่ส่ง price_per_piece */
  rfqQuantity?: number;
  rfqUnitName?: string;
  /** quoteId → history entries pre-fetched from bundle endpoint */
  quoteHistories?: Record<
    string,
    import('@/services/api/types/rfq.types').IQuotationHistoryEntry[]
  >;
};

export function RfqDetailOffersSection({
  rfqStatus,
  offers,
  isHistoryView,
  orderForRfq,
  selectedOfferId,
  onSelectOffer,
  onChatWithOffer,
  onOfferFlowComplete,
  rfqQuantity = 0,
  rfqUnitName,
  quoteHistories,
}: RfqDetailOffersSectionProps) {
  const isRequestClosed =
    rfqStatus === 'completed' || rfqStatus === 'cancelled' || rfqStatus === 'expired' || rfqStatus === 'closed';
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [detailSheetOfferId, setDetailSheetOfferId] = useState<string | null>(null);
  /** orderId ล่าสุดที่เพิ่ง accept สำเร็จ — แสดง toast 5 วินาที */
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!successOrderId) return;
    const t = setTimeout(() => setSuccessOrderId(null), 5000);
    return () => clearTimeout(t);
  }, [successOrderId]);

  const handleAcceptOffer = async (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (acceptingId) return;
    setAcceptingId(offerId);
    setFlowError(null);
    try {
      const created = await ordersApi.create(Number(offerId));
      const orderId =
        created.order_id != null && Number.isFinite(created.order_id)
          ? String(created.order_id)
          : undefined;
      if (orderId) setSuccessOrderId(orderId);
      setDetailSheetOfferId(null);
      onSelectOffer(null);
      onOfferFlowComplete?.({ quoteId: offerId, orderId });
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : 'ไม่สามารถยอมรับข้อเสนอได้');
    } finally {
      setAcceptingId(null);
    }
  };
  if (isHistoryView && offers.length > 0) {
    return (
      <>
        <div>
          <div className='mb-4 lg:mb-8 lg:mt-2 flex items-start gap-3 lg:gap-4'>
            <div
              className='mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border'
              style={{
                background:
                  'linear-gradient(145deg, rgba(162,56,255,0.14) 0%, rgba(124,58,237,0.07) 100%)',
                borderColor: 'rgba(162,56,255,0.25)',
                boxShadow: '0 2px 8px rgba(162,56,255,0.08)',
              }}
              aria-hidden
            >
              <History size={19} strokeWidth={2} style={{ color: 'var(--brand-violet)' }} />
            </div>
            <div className='min-w-0 flex-1 border-b border-gray-100/90 pb-3'>
              <div
                className='mb-1.5 h-1 w-11 rounded-full'
                style={{
                  background:
                    'linear-gradient(90deg, var(--brand-purple) 0%, var(--brand-orange) 100%)',
                }}
              />
              <h3 className='text-base font-bold tracking-tight text-brand-navy'>
                ประวัติโรงงานที่เคยเสนอราคา
              </h3>
              <p className='mt-0.5 text-[11px] leading-relaxed text-gray-500'>
                โรงงานที่เคยส่งใบเสนอราคามาใน RFQ นี้
              </p>
            </div>
          </div>
          <div className='grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4'>
            {offers.map((offer) => (
              <div
                key={offer.id}
                className='bg-white rounded-lg p-4 border border-gray-200'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex items-center gap-2'>
                    <div className='w-9 h-9 rounded-xl flex items-center justify-center text-sm bg-gray-100'>
                      <Factory size={17} className='text-gray-500' />
                    </div>
                    <div>
                      <div className='flex items-center gap-1.5'>
                        <p className='text-sm text-brand-navy' style={{ fontWeight: 600 }}>
                          {offer.factoryName}
                        </p>
                        {offer.verified && (
                          <CheckCircle size={13} style={{ color: 'var(--brand-mauve)' }} />
                        )}
                      </div>
                      <div className='flex items-center gap-1'>
                        <Star size={10} className='text-yellow-400 fill-yellow-400' />
                        <span className='text-[10px] text-gray-500'>{offer.rating}</span>
                        <span className='text-[10px] text-gray-400'>
                          ({offer.completedOrders} งาน)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='grid grid-cols-3 gap-2 text-center'>
                  <div className='bg-gray-50 rounded-xl p-2.5'>
                    <p className='text-sm text-brand-navy' style={{ fontWeight: 700 }}>
                      ฿{(offer.price / 1000).toFixed(0)}K
                    </p>
                    <p className='text-[9px] text-gray-500'>ราคารวม</p>
                  </div>
                  <div className='bg-gray-50 rounded-xl p-2.5'>
                    <p className='text-sm text-brand-navy' style={{ fontWeight: 700 }}>
                      {offer.leadTime} วัน
                    </p>
                    <p className='text-[9px] text-gray-500'>lead time</p>
                  </div>
                  <div className='bg-gray-50 rounded-xl p-2.5'>
                    <p className='text-sm text-brand-navy' style={{ fontWeight: 700 }}>
                      {offer.responseTime}
                    </p>
                    <p className='text-[9px] text-gray-500'>ตอบกลับ</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {rfqStatus === 'completed' && orderForRfq && (
          <div className='bg-green-50 border border-green-100 rounded-lg p-4'>
            <p className='text-xs font-bold text-green-700 mb-2'>โรงงานที่เลือก</p>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg'>
                <Factory size={18} className='text-green-700' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-bold text-brand-navy'>{orderForRfq.factoryName}</p>
                <p className='text-xs text-gray-500'>
                  {formatCurrency(orderForRfq.totalAmount)} •{' '}
                  {formatCompactNumber(orderForRfq.quantity)} {rfqUnitName || 'หน่วย'}
                </p>
              </div>
              <Link
                to={`/orders/${orderForRfq.id}`}
                className='shrink-0 text-xs font-bold text-green-700 hover:underline'
              >
                ดูคำสั่งซื้อ →
              </Link>
            </div>
          </div>
        )}

        {rfqStatus === 'cancelled' && (
          <div className='bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0'>
              <XCircle size={24} className='text-slate-500' />
            </div>
            <div>
              <p className='text-sm font-bold text-slate-800'>ยกเลิกคำขอโดยลูกค้า</p>
              <p className='text-xs text-slate-500 mt-0.5'>
                คำขอนี้ถูกยกเลิกโดยคุณ ไม่มีการส่งคำสั่งซื้อ
              </p>
            </div>
          </div>
        )}

        {rfqStatus === 'closed' && (
          <div className='bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0'>
              <XCircle size={24} className='text-slate-500' />
            </div>
            <div>
              <p className='text-sm font-bold text-slate-800'>ปิดรับคำขอแล้ว</p>
              <p className='text-xs text-slate-500 mt-0.5'>
                คำขอนี้ถูกปิดรับแล้ว ไม่สามารถรับใบเสนอราคาเพิ่มเติมได้
              </p>
            </div>
          </div>
        )}

        {rfqStatus === 'expired' && (
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0'>
              <AlertCircle size={24} className='text-amber-600' />
            </div>
            <div>
              <p className='text-sm font-bold text-amber-900'>หมดอายุ</p>
              <p className='text-xs text-amber-700 mt-0.5'>
                หมดระยะเวลาตอบรับใบเสนอราคา คุณสามารถสร้างคำขอราคาใหม่ได้
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
          <div className='bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0'>
              <XCircle size={24} className='text-slate-500' />
            </div>
            <div>
              <p className='text-sm font-bold text-slate-800'>ยกเลิกคำขอโดยลูกค้า</p>
              <p className='text-xs text-slate-500 mt-0.5'>คำขอนี้ถูกยกเลิกโดยคุณ</p>
            </div>
          </div>
        )}
        {rfqStatus === 'closed' && (
          <div className='bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0'>
              <XCircle size={24} className='text-slate-500' />
            </div>
            <div>
              <p className='text-sm font-bold text-slate-800'>ปิดรับคำขอแล้ว</p>
              <p className='text-xs text-slate-500 mt-0.5'>คำขอนี้ถูกปิดรับแล้ว</p>
            </div>
          </div>
        )}
        {rfqStatus === 'expired' && (
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0'>
              <AlertCircle size={24} className='text-amber-600' />
            </div>
            <div>
              <p className='text-sm font-bold text-amber-900'>หมดอายุ</p>
              <p className='text-xs text-amber-700 mt-0.5'>
                หมดระยะเวลารอใบเสนอราคา คุณสามารถสร้างคำขอราคาใหม่ได้
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!isHistoryView && offers.length > 0) {
    return (
      <>
        <div data-tour='offers-compare'>
          <div className='mb-3 lg:mb-4 lg:mt-1 flex items-start gap-2.5 lg:gap-3'>
            <div
              className='mt-0.5 flex h-8 w-8 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-lg border'
              style={{
                background:
                  'linear-gradient(145deg, rgba(242,138,46,0.16) 0%, rgba(162,56,255,0.08) 100%)',
                borderColor: 'rgba(242,138,46,0.28)',
                boxShadow: '0 2px 8px rgba(242,138,46,0.1)',
              }}
              aria-hidden
            >
              <GitCompare size={19} strokeWidth={2} style={{ color: '#C2410C' }} />
            </div>
            <div className='min-w-0 flex-1 border-b border-gray-100/90 pb-2 lg:pb-2.5'>
              <div
                className='mb-1 h-0.5 w-9 rounded-full lg:mb-1.5 lg:h-1 lg:w-11'
                style={{
                  background:
                    'linear-gradient(90deg, var(--brand-orange) 0%, var(--brand-purple) 100%)',
                }}
              />
              <h3 className='text-sm lg:text-[15px] font-bold tracking-tight text-brand-navy'>
                เปรียบเทียบใบเสนอราคา
              </h3>
              <p className='mt-0.5 text-[10px] lg:text-[11px] leading-relaxed text-gray-500 hidden sm:block'>
                เลือกดูรายละเอียดและยอมรับข้อเสนอที่เหมาะสม
              </p>
            </div>
          </div>

          {successOrderId && (
            <div className='flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 mb-3'>
              <div className='flex items-center gap-2'>
                <CheckCircle size={15} className='text-emerald-600 shrink-0' />
                <p className='text-xs font-semibold text-emerald-800'>สร้างคำสั่งซื้อสำเร็จ!</p>
              </div>
              <Link
                to={`/orders/${successOrderId}`}
                className='shrink-0 text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1'
              >
                ดูคำสั่งซื้อ <ExternalLink size={11} />
              </Link>
            </div>
          )}
          {flowError && (
            <p className='text-xs text-red-600 mb-2 px-1' role='alert'>
              {flowError}
            </p>
          )}

          <div className='hidden lg:block'>
            <RfqOffersCompareTable
              offers={offers}
              rfqQuantity={rfqQuantity}
              rfqUnitName={rfqUnitName}
              rfqStatus={rfqStatus}
              selectedOfferId={selectedOfferId}
              onSelectOffer={onSelectOffer}
              onChatWithOffer={onChatWithOffer}
              onAcceptOffer={handleAcceptOffer}
              acceptingId={acceptingId}
              isRequestClosed={isRequestClosed}
              quoteHistories={quoteHistories}
            />
          </div>

          <div className='lg:hidden'>
            <RfqOffersMobileCompareList
              offers={offers}
              rfqQuantity={rfqQuantity}
              rfqUnitName={rfqUnitName}
              onRowPress={(offer) => {
                setDetailSheetOfferId(offer.id);
                onSelectOffer(offer.id);
              }}
            />
            <RfqOfferDetailSheet
              offer={offers.find((o) => o.id === detailSheetOfferId) ?? null}
              open={detailSheetOfferId != null}
              onOpenChange={(open) => {
                if (!open) {
                  setDetailSheetOfferId(null);
                  onSelectOffer(null);
                }
              }}
              rfqQuantity={rfqQuantity}
              rfqUnitName={rfqUnitName}
              rfqStatus={rfqStatus}
              isRequestClosed={isRequestClosed}
              acceptingId={acceptingId}
              onChatWithOffer={onChatWithOffer}
              onAcceptOffer={handleAcceptOffer}
              quoteHistories={quoteHistories}
            />
          </div>
        </div>
      </>
    );
  }

  const isClosed = rfqStatus === 'closed';

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-8 text-center mt-3'>
      <div
        className='w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-3'
        style={{ background: isClosed ? 'var(--neutral-slate-muted)' : 'var(--neutral-muted)' }}
      >
        {isClosed ? (
          <XCircle size={28} className='text-slate-400' />
        ) : (
          <Clock size={28} className='text-gray-400' />
        )}
      </div>
      <p className='text-sm text-gray-700' style={{ fontWeight: 600 }}>
        {isClosed ? 'คำขอราคานี้ถูกปิดแล้ว' : 'กำลังรอใบเสนอราคา'}
      </p>
      <p className='text-xs text-gray-400 mt-1'>
        {isClosed
          ? 'ไม่สามารถรับใบเสนอราคาใหม่ได้อีกต่อไป'
          : 'โรงงานจะตอบกลับภายใน 2-4 ชั่วโมง'}
      </p>
    </div>
  );
}
