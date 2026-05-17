import React, { useState } from 'react';
import { CheckCircle, Clock, Circle, Camera, Pencil, X, Check, Package, Truck } from 'lucide-react';
import { formatDateTh } from '@/components/features/order-detail/utils';
import { productionUpdatesApi } from '@/services/api/ordersApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image } from '@/components/ui/image';

export type TimelineMilestone = {
  id: string;
  title: string;
  date?: string | null;
  status: string;
  photo?: string | null;
  description?: string | null;
};

type OrderForTimeline = {
  progress: number;
  estimatedDelivery: string;
  status: string;
  timeline?: TimelineMilestone[] | null;
};

type OrderTimelineSectionProps = {
  order: OrderForTimeline;

  leadTimeDays?: number | null;
  /** shipping_days returned by the API (platform constant); falls back to 7 until BE ships the field */
  shippingDays?: number | null;
  onPhotoClick: (photo: string) => void;
};

/** Add calendar days to a YYYY-MM-DD string; returns '' on invalid input. */
function addDays(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function OrderTimelineSection({
  order,
  leadTimeDays,
  shippingDays: shippingDaysProp,
  onPhotoClick,
}: OrderTimelineSectionProps) {
  // Use value from API when available; fall back to 7 until BE ships the field
  const shippingDays = shippingDaysProp ?? 7;
  const timeline = order.timeline ?? [];
  const hasTimeline = timeline.length > 0;
  const [editingId, setEditingId] = useState<string | null>(null);

  // For old orders (pre-fix) estimated_delivery = order_date + lead_time_days only,
  // so we derive receipt_date = estimated_delivery + SHIPPING_DAYS as a fallback display.
  const hasLeadTime = leadTimeDays != null && leadTimeDays > 0;

  // We detect "old" orders by checking if lead_time_days is available and the gap looks wrong,
  // but to keep it simple we always show estimated_delivery as the production ETA

  const receiptDateStr = order.estimatedDelivery; // BE stores production + shipping now
  const productionEtaStr = hasLeadTime
    ? addDays(order.estimatedDelivery, -shippingDays) // strip shipping to show production ETA
    : '';
  const [editNote, setEditNote] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const startEdit = (milestone: TimelineMilestone) => {
    setEditingId(milestone.id);
    setEditNote(milestone.description ?? '');
  };

  const saveEdit = async (milestoneId: string) => {
    if (savingId) return;
    setSavingId(milestoneId);
    try {
      await productionUpdatesApi.patch(milestoneId, { description: editNote });
      setEditingId(null);
    } catch {
      // keep editing open on failure
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='bg-white rounded-2xl p-4 shadow-sm'>
        {!hasTimeline ? (
          <div className='py-6 text-center'>
            <CheckCircle size={32} className='text-green-500 mx-auto mb-2' />
            <p className='text-sm text-gray-600' style={{ fontWeight: 500 }}>
              {order.status === 'completed'
                ? 'คำสั่งซื้อเสร็จสิ้นแล้ว'
                : 'ยังไม่มีรายการติดตามความคืบหน้า'}
            </p>
          </div>
        ) : (
          <div className='space-y-0'>
            {timeline.map((milestone, index) => {
              const isLast = index === timeline.length - 1;
              return (
                <div key={milestone.id} className='flex gap-3'>
                  <div className='flex flex-col items-center'>
                    <div
                      className='w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10'
                      style={{
                        background:
                          milestone.status === 'completed'
                            ? 'var(--brand-purple)'
                            : milestone.status === 'current'
                              ? 'rgba(162,56,255,0.12)'
                              : 'var(--neutral-muted)',
                        border:
                          milestone.status === 'current' ? '2px solid var(--brand-purple)' : 'none',
                      }}
                    >
                      {milestone.status === 'completed' ? (
                        <CheckCircle size={16} className='text-white' />
                      ) : milestone.status === 'current' ? (
                        <div
                          className='w-3 h-3 rounded-full animate-pulse'
                          style={{ background: 'var(--brand-purple)' }}
                        />
                      ) : (
                        <Circle size={16} className='text-gray-300' />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className='w-0.5 flex-1 my-1'
                        style={{
                          background:
                            milestone.status === 'completed'
                              ? 'var(--brand-purple)'
                              : 'var(--neutral-border)',
                          minHeight: milestone.photo ? 120 : 32,
                        }}
                      />
                    )}
                  </div>

                  <div className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <p
                          className='text-sm'
                          style={{
                            fontWeight: 600,
                            color:
                              milestone.status === 'current'
                                ? 'var(--brand-purple)'
                                : milestone.status === 'completed'
                                  ? '#1F2937'
                                  : 'var(--neutral-placeholder)',
                          }}
                        >
                          {milestone.title}
                        </p>
                        {milestone.date && (
                          <div className='flex items-center gap-1 mt-0.5'>
                            <Clock size={10} className='text-gray-400' />
                            <span className='text-[10px] text-gray-400'>{milestone.date}</span>
                          </div>
                        )}
                        {milestone.description && (
                          <p className='text-[11px] text-gray-500 mt-1'>{milestone.description}</p>
                        )}
                      </div>
                      <div className='flex items-center gap-1 ml-2 shrink-0'>
                        {milestone.status === 'current' && (
                          <span
                            className='px-2 py-0.5 rounded-full text-[9px]'
                            style={{
                              background: 'rgba(162,56,255,0.12)',
                              color: 'var(--brand-purple)',
                              fontWeight: 600,
                            }}
                          >
                            ปัจจุบัน
                          </span>
                        )}
                        {editingId === milestone.id ? (
                          <>
                            <Button
                              variant='unstyled'
                              type='button'
                              onClick={() => saveEdit(milestone.id)}
                              disabled={!!savingId}
                              className='p-1 rounded-full bg-green-100 text-green-600 disabled:opacity-50'
                              aria-label='บันทึก'
                            >
                              <Check size={11} />
                            </Button>
                            <Button
                              variant='unstyled'
                              type='button'
                              onClick={() => setEditingId(null)}
                              className='p-1 rounded-full bg-gray-100 text-gray-500'
                              aria-label='ยกเลิก'
                            >
                              <X size={11} />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant='unstyled'
                            type='button'
                            onClick={() => startEdit(milestone)}
                            className='p-1 rounded-full bg-gray-100 text-gray-400 hover:bg-violet-50 hover:text-brand-purple transition-colors'
                            aria-label='แก้ไขบันทึก'
                          >
                            <Pencil size={11} />
                          </Button>
                        )}
                      </div>
                    </div>

                    {editingId === milestone.id && (
                      <Textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder='เพิ่มบันทึก...'
                        rows={2}
                        className='w-full mt-1.5 text-[11px] border border-brand-purple/30 rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-brand-purple resize-none'
                      />
                    )}

                    {milestone.photo && (
                      <Button
                        variant='unstyled'
                        onClick={() => onPhotoClick(milestone.photo!)}
                        className='mt-2 relative overflow-hidden rounded-xl'
                        style={{ width: '100%', height: 100 }}
                      >
                        <Image
                          src={milestone.photo}
                          alt={milestone.title}
                          className='w-full h-full object-cover'
                        />
                        <div className='absolute inset-0 bg-black/10 flex items-end p-2'>
                          <div
                            className='flex items-center gap-1 px-2 py-1 rounded-lg'
                            style={{ background: 'rgba(0,0,0,0.5)' }}
                          >
                            <Camera size={10} className='text-white' />
                            <span className='text-[10px] text-white'>ดูรูป</span>
                          </div>
                        </div>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className='bg-gradient-to-br from-brand-page to-brand-panel-soft border border-[rgba(162,56,255,0.20)] rounded-2xl p-4 space-y-3'>
        <div>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-gray-700 text-sm'>ความคืบหน้าโดยรวม</span>
            <span className='text-brand-purple text-base' style={{ fontWeight: 700 }}>
              {order.progress}%
            </span>
          </div>
          <div className='h-3 bg-white rounded-full overflow-hidden border border-[rgba(162,56,255,0.20)]'>
            <div
              className='h-full rounded-full'
              style={{
                width: `${order.progress}%`,
                background: 'linear-gradient(90deg, var(--brand-purple), #4A267D)',
              }}
            />
          </div>
        </div>

        <div className='border-t border-[rgba(162,56,255,0.12)] pt-3 space-y-2'>
          {hasLeadTime && (
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white border border-[rgba(162,56,255,0.20)] text-gray-600'>
                <Package size={10} className='text-brand-purple' />
                ผลิต {leadTimeDays} วัน
              </span>
              <span className='text-gray-300 text-xs'>+</span>
              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white border border-[rgba(162,56,255,0.20)] text-gray-600'>
                <Truck size={10} className='text-brand-purple' />
                จัดส่ง {shippingDays} วัน
              </span>
              {productionEtaStr && (
                <>
                  <span className='text-gray-300 text-xs hidden sm:inline'>·</span>
                  <span className='text-[11px] text-gray-400 hidden sm:inline'>
                    ผลิตเสร็จ {formatDateTh(productionEtaStr)}
                  </span>
                </>
              )}
            </div>
          )}

          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600'>คาดว่าจะได้รับสินค้า</span>
            <span className='text-sm font-bold' style={{ color: 'var(--brand-purple)' }}>
              {receiptDateStr ? formatDateTh(receiptDateStr) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
