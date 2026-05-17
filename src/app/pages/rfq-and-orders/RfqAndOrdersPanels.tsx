import React from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Plus,
  FileText,
  Package,
  Calendar,
  ChevronRight,
  Factory,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  History,
  Layers,
  Banknote,
  Truck,
  OctagonX,
} from 'lucide-react';
import {
  PRIMARY_BG,
  PRIMARY_COLOR,
  PLUM,
  PLUM_SOFT_BG,
  DEEP_PURPLE,
  ACCENT_ORANGE_DEEP,
  ACCENT_ORANGE,
  PEACH_MIST,
  BORDER_WARM,
  RFQ_STATUS_DISPLAY,
  ORDER_STATUS_CONFIG,
  ORDER_MOBILE_TAB_THEME,
  PROGRESS_GRADIENT_ACTIVE,
  PROGRESS_COMPLETED,
  type OrderFilterId,
} from '@/components/features/rfq-and-orders/constants';
import { formatBudget, formatDate } from '@/components/features/rfq-and-orders/utils';
import { useRfqAndOrdersState } from '@/hooks/useRfqAndOrdersState';
import type { Rfq, Order } from '@/stores';
import { Button } from '@/components/ui/button';

function getActivityCounts(rfq: Rfq) {
  const offers = rfq.offers ?? [];
  const totalOffers = offers.length || rfq.offerCount || 0;
  const accepted = offers.filter((o) => o.quoteStatus === 'AC').length;
  const pending = offers.filter((o) => o.quoteStatus === 'PD').length;
  return { totalOffers, accepted, pending };
}

function getProgressBg(status: string): string {
  if (status === 'completed') return PROGRESS_COMPLETED;
  if (status === 'shipped') return ACCENT_ORANGE;
  if (status === 'pending_payment') return ACCENT_ORANGE_DEEP;
  return PROGRESS_GRADIENT_ACTIVE;
}

function getTabCount(
  id: OrderFilterId,
  c: ReturnType<typeof useRfqAndOrdersState>['orderTagCounts'],
): number {
  switch (id) {
    case 'pending_payment':
      return c.pendingPayment;
    case 'in_production':
      return c.inProduction;
    case 'shipped':
      return c.shipped;
    case 'completed':
      return c.completed;
    case 'cancelled_expired':
      return c.cancelledExpired;
    default:
      return 0;
  }
}

function ActiveRfqCard({ rfq, idx }: { rfq: Rfq; idx: number }) {
  const { totalOffers, accepted, pending } = getActivityCounts(rfq);
  const remaining = Math.max(totalOffers - accepted, 0);
  const iconBgs = [PRIMARY_BG, PEACH_MIST, PLUM_SOFT_BG] as const;
  const iconColors = [PRIMARY_COLOR, ACCENT_ORANGE_DEEP, PLUM] as const;
  const ib = iconBgs[idx % 3];
  const ic = iconColors[idx % 3];

  const statusCfg = RFQ_STATUS_DISPLAY[rfq.status] ?? {
    label: rfq.status,
    color: 'var(--neutral-subtle)',
    bg: 'var(--neutral-muted)',
  };
  const hasNewOffers = pending > 0;

  return (
    <Link to={`/rfqs/${rfq.id}`} className='block group'>
      <div
        className='rounded-2xl p-4 border bg-white transition-all group-hover:shadow-md active:scale-[0.99]'
        style={{
          borderColor: hasNewOffers ? ACCENT_ORANGE : BORDER_WARM,
          borderLeftWidth: hasNewOffers ? '3px' : '1px',
          borderLeftColor: hasNewOffers ? ACCENT_ORANGE : BORDER_WARM,
        }}
      >
        <div className='flex items-start justify-between gap-2 mb-3'>
          <div className='flex gap-3 min-w-0 flex-1'>
            <div
              className='w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-lg'
              style={{ background: ib }}
            >
              {rfq.categoryIcon ?? <Layers size={20} style={{ color: ic }} />}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-[10px] mb-0.5 font-semibold' style={{ color: ic }}>
                {rfq.category}
              </p>
              <h3 className='text-gray-900 font-bold text-sm leading-tight truncate'>
                {rfq.projectName}
              </h3>
            </div>
          </div>
          <span
            className='shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full'
            style={{ background: statusCfg.bg, color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>

        {totalOffers === 0 ? (
          <div className='mb-3 flex items-center gap-2 rounded-xl bg-[var(--neutral-warm-surface)] px-3 py-2'>
            <Factory size={13} className='text-gray-300 shrink-0' />
            <span className='text-xs text-gray-400'>ยังไม่มีโรงงานตอบรับ</span>
          </div>
        ) : (
          <div className='mb-3'>
            <div className='flex items-center gap-2 mb-2 flex-wrap'>
              <span className='inline-flex items-center gap-1.5 rounded-full bg-[#EDE9FB] px-2.5 py-1 text-xs font-bold text-[var(--brand-violet-deep)]'>
                <Factory size={11} />
                {totalOffers} โรงงานตอบแล้ว
              </span>
            </div>
            <div className='text-[11px] text-gray-500 flex items-center gap-2'>
              <span>
                ตอบรับแล้ว <span className='font-bold text-emerald-700'>{accepted}</span>
              </span>
              <span className='text-gray-300'>|</span>

              <span>
                ข้อเสนอคงเหลือ <span className='font-bold text-gray-700'>{remaining}</span>
              </span>
            </div>
          </div>
        )}

        <div className='flex items-center justify-between border-t border-[rgba(196,164,132,0.4)] pt-2 text-xs'>
          <div className='flex items-center gap-3 text-gray-500'>
            <span className='flex items-center gap-1'>
              <FileText size={11} className='text-gray-300' />
              {formatBudget(rfq.budget)}
            </span>
            <span className='flex items-center gap-1'>
              <Calendar size={11} className='text-gray-300' />
              {formatDate(rfq.createdAt)}
            </span>
          </div>
          <span className='flex items-center gap-0.5 font-semibold' style={{ color: ic }}>
            {totalOffers > 0 ? 'ดูใบเสนอราคา' : 'รายละเอียด'}
            <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function HistoryRfqRow({ rfq }: { rfq: Rfq }) {
  const statusCfg = RFQ_STATUS_DISPLAY[rfq.status] ?? {
    label: rfq.status,
    color: 'var(--neutral-subtle)',
    bg: 'var(--neutral-muted)',
  };
  const totalOffers = rfq.offers?.length || rfq.offerCount || 0;

  return (
    <Link to={`/rfqs/${rfq.id}`} className='block group'>
      <div className='flex items-center justify-between rounded-xl border border-[rgba(196,164,132,0.4)] bg-white/80 px-3 py-3 transition-all hover:bg-white'>
        <div className='flex items-center gap-2.5 min-w-0 flex-1'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--neutral-muted)] text-sm'>
            {rfq.categoryIcon ?? <FileText size={14} className='text-gray-400' />}
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-gray-700 truncate'>{rfq.projectName}</p>
            <p className='text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5'>
              <Calendar size={9} />
              {formatDate(rfq.createdAt)}
              {totalOffers > 0 && (
                <>
                  <span className='text-gray-300'>·</span>
                  <Factory size={9} />
                  {totalOffers} โรงงาน
                </>
              )}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2 shrink-0 ml-2'>
          <span
            className='text-[10px] font-bold px-2 py-0.5 rounded-full'
            style={{ background: statusCfg.bg, color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
          <ChevronRight
            size={13}
            className='text-gray-300 group-hover:text-gray-500 transition-colors'
          />
        </div>
      </div>
    </Link>
  );
}

export function RfqPanel({
  rfqs,
  isMobile,
  isDesktop,
}: {
  rfqs: Rfq[];
  isMobile?: boolean;
  isDesktop?: boolean;
}) {
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const activeRfqs = rfqs.filter(
    (r) => r.status !== 'cancelled' && r.status !== 'expired' && r.status !== 'completed',
  );
  const historyRfqs = rfqs.filter(
    (r) => r.status === 'cancelled' || r.status === 'expired' || r.status === 'completed',
  );

  const totalPendingReview = activeRfqs.reduce((sum, rfq) => {
    return sum + (rfq.offers ?? []).filter((o) => o.quoteStatus === 'PD').length;
  }, 0);

  return (
    <div className={isMobile ? '' : 'px-4 pb-4 pt-2'}>
      {isMobile && (
        <Button
          variant='unstyled'
          onClick={() => navigate('/create-rfq')}
          className='fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1A0F2E_0%,#4A267D_45%,var(--brand-purple)_100%)] shadow-[0_6px_20px_rgba(162,56,255,0.35)] transition-transform active:scale-95'
        >
          <Plus size={24} className='text-white' />
        </Button>
      )}

      <div
        className={`mb-3 flex items-center justify-between ${isDesktop ? 'min-h-[56px] rounded-xl border border-[rgba(196,164,132,0.4)] bg-[#F9F8FC] px-3 py-2' : ''}`}
      >
        <div className='flex items-center gap-2 flex-wrap'>
          <h3 className='text-sm font-bold text-[var(--brand-navy-deep)]'>กำลังดำเนินการ</h3>
          <span className='rounded-full bg-[var(--brand-lavender)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand-purple)]'>
            {activeRfqs.length}
          </span>
          {totalPendingReview > 0 && (
            <span className='flex items-center gap-1 rounded-full bg-[var(--surface-peach-mist)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand-orange-vivid)]'>
              <AlertCircle size={9} />
              {totalPendingReview} รอตอบ
            </span>
          )}
        </div>
      </div>

      {activeRfqs.length === 0 ? (
        <div className='mb-4 flex flex-col items-center justify-center rounded-2xl border border-[rgba(196,164,132,0.4)] bg-[#FDFCFF] py-12 text-center'>
          <div className='mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-lavender)]'>
            <FileText size={24} className='text-[var(--brand-purple)]' />
          </div>
          <p className='text-gray-700 font-semibold text-sm mb-1'>
            ยังไม่มีคำขอราคาที่ดำเนินการอยู่
          </p>
          <p className='text-xs text-gray-400 mb-4'>สร้างคำขอราคาเพื่อรับใบเสนอราคาจากโรงงาน</p>
          <Link
            to='/create-rfq'
            className='rounded-xl bg-[linear-gradient(135deg,#1A0F2E_0%,#4A267D_45%,var(--brand-purple)_100%)] px-5 py-2 text-sm font-bold text-white shadow-md'
          >
            สร้างคำขอราคา
          </Link>
        </div>
      ) : (
        <div className='space-y-3 mb-4'>
          {activeRfqs.map((rfq, idx) => (
            <ActiveRfqCard key={rfq.id} rfq={rfq} idx={idx} />
          ))}
        </div>
      )}

      {historyRfqs.length > 0 && (
        <div>
          <Button
            variant='unstyled'
            onClick={() => setHistoryOpen((v) => !v)}
            className='w-full flex items-center justify-between py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all'
            style={{
              background: historyOpen ? '#F0EBF8' : '#F9F8FC',
              borderColor: BORDER_WARM,
              color: DEEP_PURPLE,
            }}
          >
            <span className='flex items-center gap-2'>
              <History size={14} className='text-[var(--brand-violet-deep)]' />
              ประวัติใบขอราคา
              <span className='rounded-full bg-[var(--brand-violet-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--brand-violet-deep)]'>
                {historyRfqs.length}
              </span>
            </span>
            <ChevronDown
              size={16}
              className={`text-[var(--brand-violet-deep)] transition-transform duration-200 ${
                historyOpen ? 'rotate-180' : ''
              }`}
            />
          </Button>

          {historyOpen && (
            <div className='mt-2 space-y-1.5'>
              {historyRfqs.map((rfq) => (
                <HistoryRfqRow key={rfq.id} rfq={rfq} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ORDER_TABS: {
  id: OrderFilterId;
  shortLabel: string;
  fullLabel: string;
  icon: typeof Package;
}[] = [
  { id: 'pending_payment', shortLabel: 'รอชำระ', fullLabel: 'รอชำระมัดจำ', icon: Banknote },
  { id: 'in_production', shortLabel: 'กำลังผลิต', fullLabel: 'กำลังผลิต', icon: Package },
  { id: 'shipped', shortLabel: 'จัดส่ง', fullLabel: 'จัดส่งแล้ว', icon: Truck },
  { id: 'completed', shortLabel: 'เสร็จ', fullLabel: 'เสร็จสิ้น', icon: CheckCircle2 },
  { id: 'cancelled_expired', shortLabel: 'ยกเลิก', fullLabel: 'ยกเลิก/หมดอายุ', icon: OctagonX },
];

type OrderPanelProps = {
  orderFilter: OrderFilterId;
  setOrderFilter: (id: OrderFilterId) => void;
  filteredOrders: Order[];
  orderTagCounts: ReturnType<typeof useRfqAndOrdersState>['orderTagCounts'];
  isDesktop?: boolean;
};

export function OrderPanel({
  orderFilter,
  setOrderFilter,
  filteredOrders,
  orderTagCounts,
  isDesktop,
}: OrderPanelProps) {
  const navigate = useNavigate();
  const hasPendingPayment = orderTagCounts.pendingPayment > 0;

  return (
    <div className={isDesktop ? 'px-4 pb-4 pt-2' : ''}>
      {hasPendingPayment && orderFilter !== 'pending_payment' && (
        <Button
          variant='unstyled'
          onClick={() => setOrderFilter('pending_payment')}
          className='mb-3 flex w-full items-center gap-2 rounded-xl border border-[var(--brand-orange)] bg-[var(--surface-orange-pale)] px-3 py-2.5 text-left text-[var(--brand-orange-vivid)]'
        >
          <AlertTriangle size={14} className='shrink-0 text-[var(--brand-orange)]' />
          <span className='text-xs font-semibold flex-1'>
            มี {orderTagCounts.pendingPayment} คำสั่งซื้อรอชำระมัดจำ
          </span>
          <ChevronRight size={13} />
        </Button>
      )}

      <div className='mb-3 grid w-full grid-cols-5 gap-0.5 rounded-xl border border-[rgba(196,164,132,0.4)] bg-[linear-gradient(135deg,var(--brand-lavender)_0%,var(--surface-cream-warm)_48%,var(--surface-cream-orange)_100%)] px-1 py-[5px]'>
        {ORDER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = orderFilter === tab.id;
          const th = ORDER_MOBILE_TAB_THEME[tab.id];
          const count = getTabCount(tab.id, orderTagCounts);
          const isPendingTab = tab.id === 'pending_payment';

          return (
            <Button
              variant='unstyled'
              key={tab.id}
              onClick={() => setOrderFilter(tab.id)}
              className={`relative flex flex-col items-center gap-0.5 rounded-lg py-0.5 transition-all ${
                isActive ? 'bg-white/90 shadow-[0_1px_6px_rgba(0,0,0,0.08)]' : ''
              }`}
            >
              <div
                className='w-7 h-7 rounded-full flex items-center justify-center'
                style={{ background: isActive ? th.activeBg : 'transparent' }}
              >
                <Icon
                  size={14}
                  style={{ color: isActive ? th.activeColor : 'var(--neutral-subtle)' }}
                />
              </div>
              {count > 0 && (
                <span
                  className={`absolute top-0.5 right-[10%] min-w-[14px] h-3.5 px-1 rounded-full text-white text-[8px] flex items-center justify-center font-bold ${isPendingTab && !isActive ? 'animate-pulse' : ''}`}
                  style={{
                    background: isActive
                      ? th.activeColor
                      : isPendingTab
                        ? ACCENT_ORANGE
                        : th.badgeInactive,
                  }}
                >
                  {count}
                </span>
              )}
              <span
                className='text-[9px] text-center leading-tight'
                style={{
                  color: isActive ? th.activeColor : 'var(--neutral-subtle)',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {tab.shortLabel}
              </span>
            </Button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div className='flex min-h-[258px] flex-col items-center justify-center rounded-2xl border border-[rgba(196,164,132,0.4)] bg-[var(--surface-orange-wash)] py-12 text-center'>
          <div className='mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-peach)]'>
            <Package size={24} className='text-[var(--brand-orange-vivid)]' />
          </div>
          <p className='text-gray-700 font-semibold text-sm mb-1'>ยังไม่มีคำสั่งซื้อ</p>
          <p className='text-xs text-gray-400 max-w-[200px]'>
            คำสั่งซื้อจะปรากฏที่นี่หลังจากยืนยันใบเสนอราคา
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {filteredOrders.map((order) => {
            const cfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
            const isPendingPayment = order.status === 'pending_payment';

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className='rounded-2xl p-4 border bg-white cursor-pointer transition-all active:scale-[0.98] hover:shadow-sm'
                style={{
                  borderColor: isPendingPayment ? ACCENT_ORANGE : BORDER_WARM,
                  borderLeftWidth: isPendingPayment ? '3px' : '1px',
                  borderLeftColor: isPendingPayment ? ACCENT_ORANGE : BORDER_WARM,
                }}
              >
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                    <div
                      className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0'
                      style={{ background: cfg.bg }}
                    >
                      <Package size={18} style={{ color: cfg.color }} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-[10px] text-gray-400 mb-0.5'>#{order.id}</p>
                      <p className='text-sm text-gray-900 font-bold truncate leading-tight'>
                        {order.projectName}
                      </p>
                      <p className='text-[11px] text-gray-500 truncate'>{order.factoryName}</p>
                    </div>
                  </div>
                  <span
                    className='flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ml-2'
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <span className='w-1.5 h-1.5 rounded-full' style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>
                </div>

                <div className='mb-3'>
                  <div className='flex justify-between text-[10px] text-gray-400 mb-1'>
                    <span>ความคืบหน้า</span>
                    <span className='font-bold' style={{ color: cfg.color }}>
                      {order.progress}%
                    </span>
                  </div>
                  <div className='h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className='h-full rounded-full transition-all duration-700'
                      style={{
                        width: `${order.progress}%`,
                        background: getProgressBg(order.status),
                      }}
                    />
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3 text-xs text-gray-500'>
                    {order.estimatedDelivery && (
                      <span className='flex items-center gap-1'>
                        <Calendar size={11} className='text-gray-300' />
                        {order.estimatedDelivery}
                      </span>
                    )}
                    <span className='font-semibold text-gray-700'>
                      ฿{order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  {isPendingPayment ? (
                    <span className='flex items-center gap-1 rounded-lg bg-[var(--brand-orange-vivid)] px-3 py-1 text-[11px] font-bold text-white'>
                      <Banknote size={12} />
                      ชำระเงิน
                    </span>
                  ) : (
                    <span
                      className='flex items-center gap-0.5 text-xs font-semibold'
                      style={{ color: cfg.color }}
                    >
                      ดูรายละเอียด
                      <ChevronRight size={13} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
