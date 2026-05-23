import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  History,
  GitCompare,
  ExternalLink,
} from 'lucide-react';
import { ordersApi } from '@/services/api/ordersApi';
import { getOrderIdFromCreateResult } from '@/domain/order/mappers/mapOrderCreateResult';
import type { Quotation } from '@/components/features/rfq-detail/QuotationBOQCard';
import {
  QuotationBOQDetailsPanel,
  quotationFromOfferSource,
} from '@/components/features/rfq-detail/QuotationBOQCard';
import { QuotationHistoryPanel } from '@/components/features/rfq-detail/QuotationHistoryPanel';
import { Button } from '@/components/ui/button';
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
  /** จำนวนชิ้นจาก RFQ — ใช้ประมาณราคา/ชิ้นใน BOQ เมื่อ API ไม่ส่ง price_per_piece */
  rfqQuantity?: number;
  /** quoteId → history entries pre-fetched from bundle endpoint */
  quoteHistories?: Record<string, import('@/services/api/types/rfq.types').IQuotationHistoryEntry[]>;
};

function formatTHB(n: number): string {
  return formatCurrency(n);
}

function asNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

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
  quoteHistories,
}: RfqDetailOffersSectionProps) {
  const isRequestClosed =
    rfqStatus === 'completed' || rfqStatus === 'cancelled' || rfqStatus === 'expired';
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [expandedBoqOfferId, setExpandedBoqOfferId] = useState<string | null>(null);
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
      const orderId = getOrderIdFromCreateResult(await ordersApi.create(Number(offerId)));
      if (orderId) setSuccessOrderId(orderId);
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
              className='mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm'
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
          <div className='space-y-3'>
            {offers.map((offer) => (
              <div
                key={offer.id}
                className='bg-white rounded-2xl p-4 shadow-sm border border-gray-100'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex items-center gap-2'>
                    <div className='w-9 h-9 rounded-xl flex items-center justify-center text-sm bg-gray-100'>
                      🏭
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
          <div className='bg-green-50 border border-green-100 rounded-2xl p-4'>
            <p className='text-xs font-bold text-green-700 mb-2'>โรงงานที่เลือก</p>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg'>
                🏭
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-bold text-brand-navy'>{orderForRfq.factoryName}</p>
                <p className='text-xs text-gray-500'>
                  {formatCurrency(orderForRfq.totalAmount)} •{' '}
                  {formatCompactNumber(orderForRfq.quantity)} ชิ้น
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
          <div className='bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3'>
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

        {rfqStatus === 'expired' && (
          <div className='bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0'>
              <AlertCircle size={24} className='text-amber-600' />
            </div>
            <div>
              <p className='text-sm font-bold text-amber-900'>ไม่มีการส่งคำสั่งในเวลาที่กำหนด</p>
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
          <div className='bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0'>
              <XCircle size={24} className='text-slate-500' />
            </div>
            <div>
              <p className='text-sm font-bold text-slate-800'>ยกเลิกคำขอโดยลูกค้า</p>
              <p className='text-xs text-slate-500 mt-0.5'>คำขอนี้ถูกยกเลิกโดยคุณ</p>
            </div>
          </div>
        )}
        {rfqStatus === 'expired' && (
          <div className='bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0'>
              <AlertCircle size={24} className='text-amber-600' />
            </div>
            <div>
              <p className='text-sm font-bold text-amber-900'>ไม่มีการส่งคำสั่งในเวลาที่กำหนด</p>
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
    const recommendedOffers = offers.filter((o) => o.recommended);
    return (
      <>
        <div
          className='rounded-2xl p-4 relative overflow-hidden'
          style={{ background: 'linear-gradient(135deg, var(--brand-navy-deep) 0%, #4A267D 100%)' }}
        >
          <div className='absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20 bg-white' />
          <div className='relative z-10'>
            <div className='flex items-center gap-2 mb-2'>
              <Zap size={16} className='text-yellow-300' />
              <span className='text-white text-xs' style={{ fontWeight: 600 }}>
                AI แนะนำ
              </span>
            </div>
            {recommendedOffers.map((offer) => (
              <div key={offer.id}>
                <p className='text-white mb-1' style={{ fontWeight: 700 }}>
                  {offer.factoryName} คุ้มค่าที่สุด
                </p>
                <p className='text-white/80 text-xs'>{offer.aiReason}</p>
                <div className='flex gap-3 mt-3'>
                  <div className='text-center'>
                    <p className='text-white text-sm' style={{ fontWeight: 700 }}>
                      {formatCurrency(offer.price)}
                    </p>
                    <p className='text-white/70 text-[10px]'>ราคา</p>
                  </div>
                  <div className='w-px bg-white/30' />
                  <div className='text-center'>
                    <p className='text-white text-sm' style={{ fontWeight: 700 }}>
                      {offer.leadTime} วัน
                    </p>
                    <p className='text-white/70 text-[10px]'>lead time</p>
                  </div>
                  <div className='w-px bg-white/30' />
                  <div className='text-center'>
                    <p className='text-white text-sm' style={{ fontWeight: 700 }}>
                      ★ {offer.rating}
                    </p>
                    <p className='text-white/70 text-[10px]'>rating</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className='mb-4 lg:mb-8 lg:mt-2 flex items-start gap-3 lg:gap-4'>
            <div
              className='mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm'
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
            <div className='min-w-0 flex-1 border-b border-gray-100/90 pb-3'>
              <div
                className='mb-1.5 h-1 w-11 rounded-full'
                style={{
                  background:
                    'linear-gradient(90deg, var(--brand-orange) 0%, var(--brand-purple) 100%)',
                }}
              />
              <h3 className='text-base font-bold tracking-tight text-brand-navy'>
                เปรียบเทียบใบเสนอราคา
              </h3>
              <p className='mt-0.5 text-[11px] leading-relaxed text-gray-500'>
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
          <div className='space-y-3'>
            {offers.map((offer) => {
              const qSt = (offer.quoteStatus ?? 'PD').toUpperCase();
              const isAccepted = qSt === 'AC';
              const isRejected = qSt === 'RJ';
              const isExpired =
                qSt === 'EX' ||
                (() => {
                  // ตรวจ valid_until จาก API — ถ้าผ่านแล้วและยังไม่ AC ให้ถือว่าหมดอายุ
                  if (isAccepted) return false;
                  const vu = offer.quotationDetail?.valid_until;
                  if (!vu) return false;
                  const d = new Date(vu);
                  return !Number.isNaN(d.getTime()) && d < new Date();
                })();
              const boqOpen = expandedBoqOfferId === offer.id || selectedOfferId === offer.id;
              const boq = quotationFromOfferSource(offer, rfqQuantity);
              const qd = (offer.quotationDetail ?? {}) as Partial<Quotation> &
                Record<string, unknown>;
              const shippingCost = asNumber(qd.shipping_cost);
              const packagingCost = asNumber(qd.packaging_cost);
              const toolingMoldCost = asNumber(
                qd.tooling_mold_cost ?? qd.mold_cost ?? boq.mold_cost,
              );
              const discountAmount = asNumber(qd.discount_amount);
              const subtotal =
                asNumber(qd.subtotal) > 0
                  ? asNumber(qd.subtotal)
                  : Math.max(0, boq.price_per_piece * (rfqQuantity > 0 ? rfqQuantity : boq.moq));
              const vatRate = asNumber(qd.vat_rate);
              const vatAmount = asNumber(qd.vat_amount);
              const grandTotal =
                asNumber(qd.grand_total) > 0
                  ? asNumber(qd.grand_total)
                  : Math.max(
                      0,
                      subtotal -
                        discountAmount +
                        shippingCost +
                        packagingCost +
                        toolingMoldCost +
                        vatAmount,
                    );
              const validityDays = Math.max(0, asNumber(qd.validity_days));
              return (
                <div
                  key={offer.id}
                  role='button'
                  tabIndex={0}
                  aria-expanded={boqOpen}
                  onClick={() => {
                    if (boqOpen) {
                      setExpandedBoqOfferId(null);
                      onSelectOffer(null);
                    } else {
                      setExpandedBoqOfferId(offer.id);
                      onSelectOffer(offer.id);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (boqOpen) {
                        setExpandedBoqOfferId(null);
                        onSelectOffer(null);
                      } else {
                        setExpandedBoqOfferId(offer.id);
                        onSelectOffer(offer.id);
                      }
                    }
                  }}
                  className='bg-white rounded-2xl p-4 shadow-sm border-2 cursor-pointer transition-all'
                  style={{
                    borderColor: offer.recommended
                      ? 'var(--brand-mauve)'
                      : selectedOfferId === offer.id
                        ? '#9D77B2'
                        : 'transparent',
                  }}
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex items-center gap-2'>
                      <div
                        className='w-9 h-9 rounded-xl flex items-center justify-center text-sm'
                        style={{ background: 'var(--brand-page)' }}
                      >
                        🏭
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
                    <div className='flex shrink-0 items-center gap-1.5'>
                      {offer.recommended && (
                        <span
                          className='flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]'
                          style={{
                            background: 'var(--brand-page)',
                            color: 'var(--brand-mauve)',
                            fontWeight: 600,
                          }}
                        >
                          <Award size={10} /> แนะนำ
                        </span>
                      )}
                      <ChevronDown
                        size={20}
                        className={`text-gray-400 transition-transform duration-300 ${boqOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </div>
                  </div>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2'>
                    <div className='bg-gray-50 rounded-xl p-2.5 text-center'>
                      <p
                        className='text-sm text-brand-navy'
                        style={{ fontWeight: 700, color: 'var(--brand-mauve)' }}
                      >
                        {formatTHB(boq.price_per_piece)}
                      </p>
                      <p className='text-[9px] text-gray-500'>ราคาต่อชิ้น</p>
                    </div>
                    <div className='bg-gray-50 rounded-xl p-2.5 text-center'>
                      <p className='text-sm text-brand-navy' style={{ fontWeight: 700 }}>
                        {boq.lead_time_days}
                      </p>
                      <p className='text-[9px] text-gray-500'>Lead time (วัน)</p>
                    </div>
                    <div className='bg-gray-50 rounded-xl p-2.5 text-center'>
                      <p
                        className='text-sm text-brand-navy'
                        style={{ fontWeight: 700, color: 'var(--brand-mauve)' }}
                      >
                        {formatTHB(grandTotal)}
                      </p>
                      <p className='text-[9px] text-gray-500'>ราคารวมเสนอ</p>
                    </div>
                    <div className='bg-gray-50 rounded-xl p-2.5 text-center'>
                      <p className='text-sm text-brand-navy' style={{ fontWeight: 700 }}>
                        {validityDays > 0 ? `${validityDays}` : '-'}
                      </p>
                      <p className='text-[9px] text-gray-500'>อายุใบเสนอราคา (วัน)</p>
                    </div>
                  </div>
                  <div className='rounded-xl border border-gray-100 bg-gray-50/40 px-3 py-2 mb-3'>
                    <div className='flex items-center justify-between text-[11px] text-gray-600'>
                      <span>ค่าสินค้ารวม</span>
                      <span className='font-semibold text-brand-navy'>{formatTHB(subtotal)}</span>
                    </div>
                    {shippingCost > 0 ? (
                      <div className='flex items-center justify-between text-[11px] text-gray-600 mt-1'>
                        <span>ค่าขนส่ง</span>
                        <span className='font-semibold text-brand-navy'>
                          {formatTHB(shippingCost)}
                        </span>
                      </div>
                    ) : null}
                    {packagingCost > 0 ? (
                      <div className='flex items-center justify-between text-[11px] text-gray-600 mt-1'>
                        <span>ค่าบรรจุภัณฑ์</span>
                        <span className='font-semibold text-brand-navy'>
                          {formatTHB(packagingCost)}
                        </span>
                      </div>
                    ) : null}
                    {toolingMoldCost > 0 ? (
                      <div className='flex items-center justify-between text-[11px] text-gray-600 mt-1'>
                        <span>ค่าแม่พิมพ์</span>
                        <span className='font-semibold text-brand-navy'>
                          {formatTHB(toolingMoldCost)}
                        </span>
                      </div>
                    ) : null}
                    {discountAmount > 0 ? (
                      <div className='flex items-center justify-between text-[11px] text-gray-600 mt-1'>
                        <span>ส่วนลด</span>
                        <span className='font-semibold text-emerald-700'>
                          -{formatTHB(discountAmount)}
                        </span>
                      </div>
                    ) : null}
                    <div className='flex items-center justify-between text-[11px] text-gray-600 mt-1'>
                      <span>VAT {vatRate > 0 ? `${vatRate}%` : ''}</span>
                      <span className='font-semibold text-brand-navy'>{formatTHB(vatAmount)}</span>
                    </div>
                    <div className='border-t border-gray-200 mt-2 pt-2 flex items-center justify-between text-[12px]'>
                      <span className='font-semibold text-brand-navy'>รวมทั้งหมด</span>
                      <span className='font-bold text-brand-mauve'>{formatTHB(grandTotal)}</span>
                    </div>
                  </div>
                  {offer.factoryHighlight ? (
                    <div className='rounded-lg border border-violet-100 bg-violet-50/70 px-2.5 py-2 mb-2'>
                      <p className='text-[10px] font-semibold text-violet-700 mb-0.5'>
                        จุดเด่นจากโรงงาน
                      </p>
                      <p className='text-[11px] text-violet-900 leading-relaxed'>
                        {offer.factoryHighlight}
                      </p>
                    </div>
                  ) : null}
                  <p className='text-[10px] text-gray-500 mb-3'>
                    {boq.valid_until ? `ใบเสนอราคาถึง ${boq.valid_until}` : offer.aiReason}
                  </p>
                  {isAccepted && (
                    <div className='flex items-center justify-between mb-2'>
                      <span className='inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700'>
                        <CheckCircle size={11} className='shrink-0' />
                        ยอมรับข้อเสนอแล้ว
                      </span>
                      {offer.orderId && (
                        <Link
                          to={`/orders/${offer.orderId}`}
                          onClick={(e) => e.stopPropagation()}
                          className='flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 hover:underline shrink-0'
                        >
                          ดูคำสั่งซื้อ <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  )}
                  {isRejected && (
                    <p className='text-[10px] font-semibold mb-2 text-slate-500'>
                      ไม่ได้รับการเลือก
                    </p>
                  )}
                  {isExpired && (
                    <p className='text-[10px] font-semibold mb-2 text-orange-500'>
                      ⏰ ใบเสนอราคาหมดอายุแล้ว
                    </p>
                  )}
                  <p className='text-[10px] text-gray-400 mb-2'>แตะการ์ดเพื่อดูรายละเอียด BOQ</p>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${boqOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className='overflow-hidden min-h-0'>
                      <QuotationBOQDetailsPanel
                        quotation={boq}
                        className='-mx-4 border-gray-100 px-4 pb-3 pt-2'
                      />
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className='mb-3'>
                    <QuotationHistoryPanel
                      quotationId={offer.id}
                      preloadedHistory={quoteHistories?.[offer.id]}
                    />
                  </div>
                  <div className='flex gap-2'>
                    {onChatWithOffer ? (
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation();
                          onChatWithOffer(offer);
                        }}
                        className='flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs border'
                        style={{
                          borderColor: 'var(--brand-mauve)',
                          color: 'var(--brand-mauve)',
                          fontWeight: 600,
                        }}
                      >
                        <MessageCircle size={14} /> แชท
                      </Button>
                    ) : null}
                    {isAccepted ? (
                      /* AC: แสดง link ไป order แทนปุ่ม */
                      offer.orderId ? (
                        <Link
                          to={`/orders/${offer.orderId}`}
                          onClick={(e) => e.stopPropagation()}
                          className='flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-700 border-2 border-emerald-200 bg-emerald-50'
                        >
                          <ExternalLink size={13} />
                          ดูคำสั่งซื้อ
                        </Link>
                      ) : (
                        <Button
                          variant='unstyled'
                          type='button'
                          disabled
                          className='flex-1 py-2.5 rounded-xl text-xs text-white disabled:opacity-60'
                          style={{ background: 'var(--status-success)', fontWeight: 600 }}
                        >
                          ยอมรับแล้ว ✓
                        </Button>
                      )
                    ) : isExpired ? (
                      <Button
                        variant='unstyled'
                        type='button'
                        disabled
                        className='flex-1 py-2.5 rounded-xl text-xs text-white disabled:opacity-70'
                        style={{ background: '#EA580C', fontWeight: 600 }}
                      >
                        ใบเสนอราคาหมดอายุ
                      </Button>
                    ) : isRequestClosed ? (
                      <Button
                        variant='unstyled'
                        type='button'
                        disabled
                        className='flex-1 py-2.5 rounded-xl text-xs text-white disabled:opacity-70'
                        style={{ background: '#94A3B8', fontWeight: 600 }}
                      >
                        {rfqStatus === 'cancelled'
                          ? 'ยกเลิกคำขอแล้ว'
                          : rfqStatus === 'expired'
                            ? 'หมดระยะเวลารับใบเสนอราคา'
                            : 'ปิดคำขอแล้ว'}
                      </Button>
                    ) : (
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={(e) => handleAcceptOffer(offer.id, e)}
                        disabled={!!acceptingId || isRejected}
                        className='flex-1 py-2.5 rounded-xl text-xs text-white disabled:opacity-60'
                        style={{
                          background: isRejected ? '#94A3B8' : 'var(--brand-mauve)',
                          fontWeight: 600,
                        }}
                      >
                        {acceptingId === offer.id
                          ? 'กำลังส่ง...'
                          : isRejected
                            ? 'ไม่ได้รับการเลือก'
                            : 'ยอมรับข้อเสนอ'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className='bg-white rounded-2xl p-8 shadow-sm text-center'>
      <div
        className='w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3'
        style={{ background: 'var(--neutral-muted)' }}
      >
        <Clock size={28} className='text-gray-400' />
      </div>
      <p className='text-sm text-gray-700' style={{ fontWeight: 600 }}>
        กำลังรอใบเสนอราคา
      </p>
      <p className='text-xs text-gray-400 mt-1'>โรงงานจะตอบกลับภายใน 2-4 ชั่วโมง</p>
    </div>
  );
}
