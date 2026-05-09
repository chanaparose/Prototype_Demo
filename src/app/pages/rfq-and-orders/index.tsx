/**
 * RfqAndOrders — redesigned page
 *
 * Desktop: 2-column split (RFQ left ~60%, Orders right ~40%), independently scrollable
 * Mobile:  tab switcher at top → single-column
 *
 * RFQ section uses active/history accordion (no old 3-tab system)
 * Order section has urgency signal on pending-payment tab
 */
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
  Clock,
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
  PRIMARY_BG_LIGHT,
  PRIMARY_COLOR,
  PLUM,
  PLUM_SOFT_BG,
  DEEP_PURPLE,
  ACCENT_ORANGE_BG,
  ACCENT_ORANGE_DEEP,
  ACCENT_ORANGE,
  PEACH_MIST,
  BORDER_WARM,
  MOBILE_PRIMARY_TAB_BAR,
  CTA_GRADIENT,
  RFQ_STATUS_DISPLAY,
  ORDER_STATUS_CONFIG,
  ORDER_MOBILE_TAB_THEME,
  PROGRESS_GRADIENT_ACTIVE,
  PROGRESS_COMPLETED,
  type OrderFilterId,
} from '../../components/features/rfq-and-orders/constants';
import { formatBudget, formatDate } from '../../components/features/rfq-and-orders/utils';
import { useRfqAndOrdersState } from '../../hooks/useRfqAndOrdersState';
import type { Rfq, Order } from '../../contexts/DataContext';

// ─── Brand constants (from design brief) ──────────────────────────────────
const GREEN = '#059669';
const GREEN_BG = '#D1FAE5';

// ─── Helpers ───────────────────────────────────────────────────────────────
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

function getTabCount(id: OrderFilterId, c: ReturnType<typeof useRfqAndOrdersState>['orderTagCounts']): number {
  switch (id) {
    case 'pending_payment': return c.pendingPayment;
    case 'in_production': return c.inProduction;
    case 'shipped': return c.shipped;
    case 'completed': return c.completed;
    case 'cancelled_expired': return c.cancelledExpired;
    default: return 0;
  }
}

// ─── Active RFQ card ────────────────────────────────────────────────────────
function ActiveRfqCard({ rfq, idx }: { rfq: Rfq; idx: number }) {
  const { totalOffers, accepted, pending } = getActivityCounts(rfq);
  const remaining = Math.max(totalOffers - accepted, 0);
  const iconBgs = [PRIMARY_BG, PEACH_MIST, PLUM_SOFT_BG] as const;
  const iconColors = [PRIMARY_COLOR, ACCENT_ORANGE_DEEP, PLUM] as const;
  const ib = iconBgs[idx % 3];
  const ic = iconColors[idx % 3];

  const statusCfg = RFQ_STATUS_DISPLAY[rfq.status] ?? { label: rfq.status, color: '#6B7280', bg: '#F3F4F6' };
  const hasNewOffers = pending > 0;

  return (
    <Link to={`/rfqs/${rfq.id}`} className="block group">
      <div
        className="rounded-2xl p-4 border bg-white transition-all group-hover:shadow-md active:scale-[0.99]"
        style={{
          borderColor: hasNewOffers ? ACCENT_ORANGE : BORDER_WARM,
          borderLeftWidth: hasNewOffers ? '3px' : '1px',
          borderLeftColor: hasNewOffers ? ACCENT_ORANGE : BORDER_WARM,
        }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex gap-3 min-w-0 flex-1">
            <div
              className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-lg"
              style={{ background: ib }}
            >
              {rfq.categoryIcon ?? <Layers size={20} style={{ color: ic }} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] mb-0.5 font-semibold" style={{ color: ic }}>
                {rfq.category}
              </p>
              <h3 className="text-gray-900 font-bold text-sm leading-tight truncate">
                {rfq.projectName}
              </h3>
            </div>
          </div>
          <span
            className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: statusCfg.bg, color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* Factory response status — simple & clear */}
        {totalOffers === 0 ? (
          /* ยังไม่มีโรงงานตอบ */
          <div
            className="flex items-center gap-2 py-2 px-3 rounded-xl mb-3"
            style={{ background: '#F5F5F5' }}
          >
            <Factory size={13} className="text-gray-300 shrink-0" />
            <span className="text-xs text-gray-400">ยังไม่มีโรงงานตอบรับ</span>
          </div>
        ) : (
          /* มีโรงงานตอบแล้ว */
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* badge: จำนวนที่ตอบ */}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: '#EDE9FB', color: PLUM }}
            >
              <Factory size={11} />
              {totalOffers} โรงงานตอบแล้ว
            </span>
              
            </div>
            <div className="text-[11px] text-gray-500 flex items-center gap-2">
              <span>ตอบรับแล้ว <span className="font-bold text-emerald-700">{accepted}</span></span>
              <span className="text-gray-300">|</span>
               
              <span>ข้อเสนอคงเหลือ <span className="font-bold text-gray-700">{remaining}</span></span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-2 border-t text-xs"
          style={{ borderColor: BORDER_WARM }}
        >
          <div className="flex items-center gap-3 text-gray-500">
            <span className="flex items-center gap-1">
              <FileText size={11} className="text-gray-300" />
              {formatBudget(rfq.budget)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-gray-300" />
              {formatDate(rfq.createdAt)}
            </span>
          </div>
          <span className="flex items-center gap-0.5 font-semibold" style={{ color: ic }}>
            {totalOffers > 0 ? 'ดูใบเสนอราคา' : 'รายละเอียด'}
            <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── History row (compact) ──────────────────────────────────────────────────
function HistoryRfqRow({ rfq }: { rfq: Rfq }) {
  const statusCfg = RFQ_STATUS_DISPLAY[rfq.status] ?? { label: rfq.status, color: '#6B7280', bg: '#F3F4F6' };
  const totalOffers = (rfq.offers?.length) || rfq.offerCount || 0;

  return (
    <Link to={`/rfqs/${rfq.id}`} className="block group">
      <div
        className="flex items-center justify-between py-3 px-3 rounded-xl border bg-white/80 hover:bg-white transition-all"
        style={{ borderColor: BORDER_WARM }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm" style={{ background: '#F3F4F6' }}>
            {rfq.categoryIcon ?? <FileText size={14} className="text-gray-400" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-700 truncate">{rfq.projectName}</p>
            <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
              <Calendar size={9} />
              {formatDate(rfq.createdAt)}
              {totalOffers > 0 && (
                <>
                  <span className="text-gray-300">·</span>
                  <Factory size={9} />
                  {totalOffers} โรงงาน
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: statusCfg.bg, color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
          <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// ─── RFQ panel (shared between mobile + desktop) ───────────────────────────
function RfqPanel({ rfqs, isMobile, isDesktop }: { rfqs: Rfq[]; isMobile?: boolean; isDesktop?: boolean }) {
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
      {/* FAB (mobile only) */}
      {isMobile && (
        <button
          onClick={() => navigate('/create-rfq')}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-30"
          style={{ background: CTA_GRADIENT, boxShadow: '0 6px 20px rgba(162,56,255,0.35)' }}
        >
          <Plus size={24} className="text-white" />
        </button>
      )}

      {/* Section A header */}
      <div
        className={`flex items-center justify-between mb-3 ${isDesktop ? 'min-h-[56px] rounded-xl border px-3 py-2' : ''}`}
        style={isDesktop ? { borderColor: BORDER_WARM, background: '#F9F8FC' } : undefined}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold" style={{ color: DEEP_PURPLE }}>กำลังดำเนินการ</h3>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: PRIMARY_BG, color: PRIMARY_COLOR }}
          >
            {activeRfqs.length}
          </span>
          {totalPendingReview > 0 && (
            <span
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: PEACH_MIST, color: ACCENT_ORANGE_DEEP }}
            >
              <AlertCircle size={9} />
              {totalPendingReview} รอตอบ
            </span>
          )}
        </div>
      </div>

      {/* Active cards */}
      {activeRfqs.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border mb-4"
          style={{ borderColor: BORDER_WARM, background: '#FDFCFF' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: PRIMARY_BG }}>
            <FileText size={24} style={{ color: PRIMARY_COLOR }} />
          </div>
          <p className="text-gray-700 font-semibold text-sm mb-1">ยังไม่มีคำขอราคาที่ดำเนินการอยู่</p>
          <p className="text-xs text-gray-400 mb-4">สร้างคำขอราคาเพื่อรับใบเสนอราคาจากโรงงาน</p>
          <Link
            to="/create-rfq"
            className="py-2 px-5 rounded-xl text-white font-bold text-sm shadow-md"
            style={{ background: CTA_GRADIENT }}
          >
            สร้างคำขอราคา
          </Link>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {activeRfqs.map((rfq, idx) => (
            <ActiveRfqCard key={rfq.id} rfq={rfq} idx={idx} />
          ))}
        </div>
      )}

      {/* Section B: History accordion */}
      {historyRfqs.length > 0 && (
        <div>
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all"
            style={{
              background: historyOpen ? '#F0EBF8' : '#F9F8FC',
              borderColor: BORDER_WARM,
              color: DEEP_PURPLE,
            }}
          >
            <span className="flex items-center gap-2">
              <History size={14} style={{ color: PLUM }} />
              ประวัติ
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: PLUM_SOFT_BG, color: PLUM }}
              >
                {historyRfqs.length}
              </span>
            </span>
            <ChevronDown
              size={16}
              className="transition-transform duration-200"
              style={{ transform: historyOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: PLUM }}
            />
          </button>

          {historyOpen && (
            <div className="mt-2 space-y-1.5">
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

// ─── Order panel (shared between mobile + desktop) ─────────────────────────
const ORDER_TABS: { id: OrderFilterId; shortLabel: string; fullLabel: string; icon: typeof Package }[] = [
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

function OrderPanel({ orderFilter, setOrderFilter, filteredOrders, orderTagCounts, isDesktop }: OrderPanelProps) {
  const navigate = useNavigate();
  const hasPendingPayment = orderTagCounts.pendingPayment > 0;

  return (
    <div className={isDesktop ? 'px-4 pb-4 pt-2' : ''}>
      {/* Urgency banner */}
      {hasPendingPayment && orderFilter !== 'pending_payment' && (
        <button
          onClick={() => setOrderFilter('pending_payment')}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 text-left border"
          style={{ background: '#FFF7ED', borderColor: ACCENT_ORANGE, color: ACCENT_ORANGE_DEEP }}
        >
          <AlertTriangle size={14} style={{ color: ACCENT_ORANGE, flexShrink: 0 }} />
          <span className="text-xs font-semibold flex-1">
            มี {orderTagCounts.pendingPayment} คำสั่งซื้อรอชำระมัดจำ
          </span>
          <ChevronRight size={13} />
        </button>
      )}

      {/* Tab bar */}
      <div
        className="grid grid-cols-5 rounded-xl px-1 py-[5px] border gap-0.5 w-full mb-3"
        style={{ background: MOBILE_PRIMARY_TAB_BAR, borderColor: BORDER_WARM }}
      >
          {ORDER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = orderFilter === tab.id;
          const th = ORDER_MOBILE_TAB_THEME[tab.id];
          const count = getTabCount(tab.id, orderTagCounts);
          const isPendingTab = tab.id === 'pending_payment';

          return (
            <button
              key={tab.id}
              onClick={() => setOrderFilter(tab.id)}
              className="relative flex flex-col items-center gap-0.5 py-0.5 rounded-lg transition-all"
              style={{
                background: isActive ? 'rgba(255,255,255,0.9)' : 'transparent',
                boxShadow: isActive ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: isActive ? th.activeBg : 'transparent' }}
              >
                <Icon size={14} style={{ color: isActive ? th.activeColor : '#6B7280' }} />
              </div>
              {count > 0 && (
                <span
                  className={`absolute top-0.5 right-[10%] min-w-[14px] h-3.5 px-1 rounded-full text-white text-[8px] flex items-center justify-center font-bold ${isPendingTab && !isActive ? 'animate-pulse' : ''}`}
                  style={{
                    background: isActive ? th.activeColor : isPendingTab ? ACCENT_ORANGE : th.badgeInactive,
                  }}
                >
                  {count}
                </span>
              )}
              <span
                className="text-[9px] text-center leading-tight"
                style={{ color: isActive ? th.activeColor : '#6B7280', fontWeight: isActive ? 700 : 500 }}
              >
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Order cards */}
      {filteredOrders.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border min-h-[258px]"
          style={{ borderColor: BORDER_WARM, background: '#FFFAF5' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: ACCENT_ORANGE_BG }}>
            <Package size={24} style={{ color: ACCENT_ORANGE_DEEP }} />
          </div>
          <p className="text-gray-700 font-semibold text-sm mb-1">ยังไม่มีคำสั่งซื้อ</p>
          <p className="text-xs text-gray-400 max-w-[200px]">
            คำสั่งซื้อจะปรากฏที่นี่หลังจากยืนยันใบเสนอราคา
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const cfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
            const isPendingPayment = order.status === 'pending_payment';

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="rounded-2xl p-4 border bg-white cursor-pointer transition-all active:scale-[0.98] hover:shadow-sm"
                style={{
                  borderColor: isPendingPayment ? ACCENT_ORANGE : BORDER_WARM,
                  borderLeftWidth: isPendingPayment ? '3px' : '1px',
                  borderLeftColor: isPendingPayment ? ACCENT_ORANGE : BORDER_WARM,
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: cfg.bg }}
                    >
                      <Package size={18} style={{ color: cfg.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-gray-400 mb-0.5">#{order.id}</p>
                      <p className="text-sm text-gray-900 font-bold truncate leading-tight">{order.projectName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{order.factoryName}</p>
                    </div>
                  </div>
                  <span
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ml-2"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>ความคืบหน้า</span>
                    <span className="font-bold" style={{ color: cfg.color }}>{order.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${order.progress}%`, background: getProgressBg(order.status) }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {order.estimatedDelivery && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-gray-300" />
                        {order.estimatedDelivery}
                      </span>
                    )}
                    <span className="font-semibold text-gray-700">฿{order.totalAmount.toLocaleString()}</span>
                  </div>
                  {isPendingPayment ? (
                    <span
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold text-white"
                      style={{ background: ACCENT_ORANGE_DEEP }}
                    >
                      <Banknote size={12} />
                      ชำระเงิน
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: cfg.color }}>
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

// ─── Page root ──────────────────────────────────────────────────────────────
export function RfqAndOrders() {
  const {
    primaryTab,
    setPrimaryTab,
    orderFilter,
    setOrderFilter,
    filteredOrders,
    orderTagCounts,
    rfqs,
    orders,
    loading,
    error,
  } = useRfqAndOrdersState({ primaryTab: 'rfq' });

  const hasPendingPayment = orderTagCounts.pendingPayment > 0;

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: PRIMARY_COLOR, borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <p className="text-sm text-red-600 font-semibold mb-2">เกิดข้อผิดพลาด</p>
          <p className="text-xs text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
            style={{ background: PRIMARY_COLOR }}
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          MOBILE LAYOUT (< lg)
      ═══════════════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-full pb-20">
        {/* Page header */}
        <div className="px-4 pt-5 pb-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: '#C4A484' }}>
                คำขอ
              </p>
          <h1 className="text-xl font-bold" style={{ color: DEEP_PURPLE }}>
            คำขอราคา & คำสั่งซื้อ
              </h1>
        </div>

        {/* Primary tab switcher */}
        <div className="px-4 mb-4">
          <div
            className="flex p-1 rounded-2xl border"
            style={{ background: MOBILE_PRIMARY_TAB_BAR, borderColor: BORDER_WARM }}
          >
            <button
              onClick={() => setPrimaryTab('rfq')}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: primaryTab === 'rfq' ? 'rgba(255,255,255,0.95)' : 'transparent',
                color: primaryTab === 'rfq' ? PLUM : '#6B7280',
                boxShadow: primaryTab === 'rfq' ? '0 2px 14px rgba(109,40,217,0.18)' : 'none',
              }}
            >
              คำขอราคา
            </button>
            <button
              onClick={() => setPrimaryTab('orders')}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all relative"
              style={{
                background: primaryTab === 'orders' ? 'rgba(255,255,255,0.95)' : 'transparent',
                color: primaryTab === 'orders' ? ACCENT_ORANGE_DEEP : '#6B7280',
                boxShadow: primaryTab === 'orders' ? '0 2px 14px rgba(242,120,48,0.22)' : 'none',
              }}
            >
              คำสั่งซื้อ
              {hasPendingPayment && primaryTab !== 'orders' && (
                <span
                  className="absolute top-1.5 right-4 w-2 h-2 rounded-full animate-pulse"
                  style={{ background: ACCENT_ORANGE }}
                />
              )}
            </button>
          </div>
          </div>

        <div className="px-4 flex-1">
          {primaryTab === 'rfq' ? (
            <RfqPanel rfqs={rfqs} isMobile />
          ) : (
            <OrderPanel
              orderFilter={orderFilter}
              setOrderFilter={setOrderFilter}
              filteredOrders={filteredOrders}
              orderTagCounts={orderTagCounts}
            />
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP LAYOUT (lg+)
      ═══════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col px-8 py-7 h-full">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold mb-0.5" style={{ color: '#C4A484' }}>
              คำขอและคำสั่งซื้อ
            </p>
            <h1 className="text-2xl font-bold" style={{ color: DEEP_PURPLE }}>
              คำขอราคา &amp; คำสั่งซื้อ
            </h1>
          </div>
            <Link
              to="/create-rfq"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white font-semibold transition-all hover:opacity-90 shadow-md"
              style={{ background: CTA_GRADIENT, boxShadow: '0 6px 20px rgba(162,56,255,0.35)' }}
            >
              <Plus size={16} />
            สร้างคำขอราคา
            </Link>
        </div>

        {/* 2-column grid — equal width */}
        <div className="grid gap-6 flex-1 min-h-0" style={{ gridTemplateColumns: '1fr 1fr' }}>

          {/* ── Left: RFQ panel ── */}
          <div
            className="bg-white rounded-2xl border overflow-hidden flex flex-col"
              style={{ borderColor: BORDER_WARM, borderTop: `3px solid ${PRIMARY_COLOR}` }}
            >
            {/* Sticky panel header */}
              <div
              className="flex items-center justify-between px-5 py-4 border-b shrink-0"
                style={{ borderColor: BORDER_WARM, background: PRIMARY_BG_LIGHT }}
              >
                <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: PRIMARY_BG }}>
                    <FileText size={15} style={{ color: PRIMARY_COLOR }} />
                  </div>
                <h2 className="font-bold" style={{ color: DEEP_PURPLE }}>คำขอราคา</h2>
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: PRIMARY_BG, color: PRIMARY_COLOR }}
                  >
                  {rfqs.filter((r) => r.status !== 'cancelled' && r.status !== 'expired' && r.status !== 'completed').length}
                  </span>
              </div>

              </div>

            {/* Scrollable RFQ content */}
            <div className="overflow-y-auto flex-1 p-4">
              <RfqPanel rfqs={rfqs} isDesktop />
            </div>
            </div>

          {/* ── Right: Orders panel ── */}
            <div
            className="bg-white rounded-2xl border overflow-hidden flex flex-col"
              style={{ borderColor: BORDER_WARM, borderTop: `3px solid ${ACCENT_ORANGE}` }}
            >
            {/* Sticky panel header */}
              <div
              className="flex items-center justify-between px-5 py-4 border-b shrink-0"
                style={{ borderColor: BORDER_WARM, background: ACCENT_ORANGE_BG }}
              >
                <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: ACCENT_ORANGE_BG }}>
                    <Package size={15} style={{ color: ACCENT_ORANGE_DEEP }} />
                  </div>
                <h2 className="font-bold" style={{ color: DEEP_PURPLE }}>คำสั่งซื้อ</h2>
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: ACCENT_ORANGE_BG, color: ACCENT_ORANGE_DEEP }}
                  >
                    {orders.filter((o) => o.status !== 'completed').length}
                  </span>
                </div>
              {hasPendingPayment && (
                        <span
                  className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse"
                  style={{ background: '#FFF3E0', color: ACCENT_ORANGE_DEEP }}
                        >
                  <AlertTriangle size={10} />
                  {orderTagCounts.pendingPayment} รอชำระ
                        </span>
                      )}
              </div>

            {/* Scrollable Orders content */}
            <div className="overflow-y-auto flex-1 p-4">
              <OrderPanel
                orderFilter={orderFilter}
                setOrderFilter={setOrderFilter}
                filteredOrders={filteredOrders}
                orderTagCounts={orderTagCounts}
                isDesktop
              />
              </div>
            </div>
        </div>
      </div>
    </>
  );
}
