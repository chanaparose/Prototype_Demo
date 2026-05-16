import React from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ChevronRight,
  Calendar,
  FileText,
  Plus,
  Layers,
  Factory,
  CheckCircle2,
  History,
  AlertCircle,
} from 'lucide-react';
import {
  PRIMARY_COLOR,
  PRIMARY_BG,
  PLUM,
  PLUM_SOFT_BG,
  PEACH_MIST,
  ACCENT_ORANGE_DEEP,
  ACCENT_ORANGE,
  BORDER_WARM,
  CTA_GRADIENT,
  RFQ_STATUS_DISPLAY,
  DEEP_PURPLE,
} from './constants';
import { formatBudget, formatDate } from './utils';
import { CollapsibleCard } from '../../../shared/ui';

// Brand colors per brief
const GREEN = '#059669';
const GREEN_BG = '#D1FAE5';

export type RfqItem = {
  id: string;
  projectName: string;
  category: string;
  categoryIcon?: React.ReactNode;
  status: string;
  offerCount: number;
  budget: number;
  createdAt: string;
  description?: string;
  offers?: Array<{
    id: string;
    factoryId?: string;
    factoryName?: string;
    quoteStatus?: string; // 'PD' | 'AC' | 'RJ'
    orderId?: string;
  }>;
};

type RfqTagCounts = {
  pending: number;
  has_quote: number;
  cancelled_expired: number;
};

type RfqSectionProps = {
  rfqFilter: string;
  setRfqFilter: (id: string) => void;
  filteredRfqs: RfqItem[];
  rfqTagCounts: RfqTagCounts;
  /** Full list of all RFQs (for computing active vs history split) */
  allRfqs?: RfqItem[];
};

// ─── Activity counts computed from offers ─────────────────────────────────
function getActivityCounts(rfq: RfqItem) {
  const offers = rfq.offers ?? [];
  const totalOffers = offers.length || rfq.offerCount || 0;
  const accepted = offers.filter((o) => o.quoteStatus === 'AC').length;
  const pending = offers.filter((o) => o.quoteStatus === 'PD').length;
  return { totalOffers, accepted, pending };
}

// ─── Single RFQ card (active section) ─────────────────────────────────────
function ActiveRfqCard({ rfq, idx }: { rfq: RfqItem; idx: number }) {
  const { totalOffers, accepted, pending } = getActivityCounts(rfq);
  const remaining = Math.max(totalOffers - accepted, 0);
  const iconBgs = [PRIMARY_BG, PEACH_MIST, PLUM_SOFT_BG] as const;
  const iconColors = [PRIMARY_COLOR, ACCENT_ORANGE_DEEP, PLUM] as const;
  const ib = iconBgs[idx % 3];
  const ic = iconColors[idx % 3];

  const statusCfg = RFQ_STATUS_DISPLAY[rfq.status] ?? {
    label: rfq.status,
    color: '#6B7280',
    bg: '#F3F4F6',
  };

  const hasNewOffers = pending > 0;
  const hasAccepted = accepted > 0;

  return (
    <Link key={rfq.id} to={`/rfqs/${rfq.id}`} className="block group">
      <div
        className="rounded-2xl p-4 border bg-white transition-all active:scale-[0.99] group-hover:shadow-md"
        style={{
          borderColor: hasNewOffers ? ACCENT_ORANGE : BORDER_WARM,
          borderLeftWidth: hasNewOffers ? '3px' : '1px',
          borderLeftColor: hasNewOffers ? ACCENT_ORANGE : BORDER_WARM,
        }}
      >
        {/* Top row: icon + name + status badge */}
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

        {/* Activity indicator row */}
        <div className="py-2 px-3 rounded-xl mb-3" style={{ background: '#F9F7FD' }}>
          <div className="flex items-center gap-3 flex-wrap">
          {/* Total offers */}
          <span
            className="flex items-center gap-1.5 text-xs"
            style={{ color: totalOffers > 0 ? PLUM : '#9CA3AF' }}
          >
            <Factory size={12} />
            <span className="font-semibold">{totalOffers}</span>
            <span>โรงงานตอบแล้ว</span>
          </span>

          </div>
          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-2">
            <span>ตอบรับแล้ว <span className="font-bold text-emerald-700">{accepted}</span></span>
            <span className="text-gray-300">|</span>
            <span>ข้อเสนอคงเหลือ <span className="font-bold text-gray-700">{remaining}</span></span>
          </div>
        </div>

        {/* Link to orders if any accepted */}
        {hasAccepted && (
          <div className="mb-2">
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: GREEN }}
            >
              <CheckCircle2 size={11} />
              ดูคำสั่งซื้อ {accepted} รายการ
              <ChevronRight size={12} />
            </span>
          </div>
        )}

        {/* Bottom row: budget + date + cta */}
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

// ─── History (compact) row ──────────────────────────────────────────────────
function HistoryRfqRow({ rfq }: { rfq: RfqItem }) {
  const statusCfg = RFQ_STATUS_DISPLAY[rfq.status] ?? {
    label: rfq.status,
    color: '#6B7280',
    bg: '#F3F4F6',
  };
  const totalOffers = (rfq.offers?.length) || rfq.offerCount || 0;

  return (
    <Link to={`/rfqs/${rfq.id}`} className="block group">
      <div
        className="flex items-center justify-between py-3 px-3 rounded-xl border bg-white/80 hover:bg-white transition-all"
        style={{ borderColor: BORDER_WARM }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm"
            style={{ background: '#F3F4F6' }}
          >
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

// ─── Main RfqSection component ─────────────────────────────────────────────
export function RfqSection({
  filteredRfqs,
  rfqTagCounts,
  allRfqs,
}: RfqSectionProps) {
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = React.useState(false);

  // Split from allRfqs if available, otherwise from filteredRfqs
  const source = allRfqs ?? filteredRfqs;

  const activeRfqs = source.filter(
    (r) => r.status !== 'cancelled' && r.status !== 'expired' && r.status !== 'completed',
  );
  const historyRfqs = source.filter(
    (r) => r.status === 'cancelled' || r.status === 'expired' || r.status === 'completed',
  );

  // Count new offers (pending review)
  const totalPendingReview = activeRfqs.reduce((sum, rfq) => {
    const pend = (rfq.offers ?? []).filter((o) => o.quoteStatus === 'PD').length;
    return sum + pend;
  }, 0);

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => navigate('/create-rfq')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-30"
        style={{
          background: CTA_GRADIENT,
          boxShadow: '0 6px 20px rgba(162,56,255,0.35)',
        }}
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* ─── Section A: Active ─────────────────────────────────── */}
      <div className="mb-4">
        <div
          className="flex items-center justify-between mb-3 min-h-[56px] rounded-xl border px-3 py-2"
          style={{ borderColor: BORDER_WARM, background: '#F9F8FC' }}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold" style={{ color: DEEP_PURPLE }}>
              กำลังดำเนินการ
            </h3>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: PRIMARY_BG, color: PRIMARY_COLOR }}
            >
              {activeRfqs.length}
            </span>
            {totalPendingReview > 0 && (
              <span
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse"
                style={{ background: PEACH_MIST, color: ACCENT_ORANGE_DEEP }}
              >
                <AlertCircle size={9} />
                {totalPendingReview} รอตอบ
              </span>
            )}
          </div>
        </div>

        {activeRfqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center rounded-2xl border" style={{ borderColor: BORDER_WARM, background: '#FDFCFF' }}>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: PRIMARY_BG }}
            >
              <FileText size={28} style={{ color: PRIMARY_COLOR }} />
            </div>
            <p className="text-gray-700 font-semibold text-sm mb-1">ยังไม่มีคำขอราคาที่ดำเนินการอยู่</p>
            <p className="text-xs text-gray-400 mb-4">สร้างคำขอราคาเพื่อรับใบเสนอราคาจากโรงงาน</p>
            <Link
              to="/create-rfq"
              className="py-2.5 px-6 rounded-xl text-white font-bold text-sm shadow-md"
              style={{ background: CTA_GRADIENT, boxShadow: '0 6px 18px rgba(162,56,255,0.3)' }}
            >
              สร้างคำขอราคา
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRfqs.map((rfq, idx) => (
              <ActiveRfqCard key={rfq.id} rfq={rfq} idx={idx} />
            ))}
          </div>
        )}
      </div>

      {/* ─── Section B: History accordion ──────────────────────── */}
      {historyRfqs.length > 0 && (
        <CollapsibleCard
          defaultOpen={historyOpen}
          onOpenChange={setHistoryOpen}
          header={
            <div className="flex items-center gap-2">
              <History size={14} style={{ color: PLUM }} />
              <span style={{ color: DEEP_PURPLE }}>ประวัติ</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: PLUM_SOFT_BG, color: PLUM }}
              >
                {historyRfqs.length}
              </span>
            </div>
          }
          className="rounded-xl border"
          headerClassName="text-sm font-semibold py-2.5 px-3"
          style={{ borderColor: BORDER_WARM, background: '#F9F8FC' }}
        >
          <div className="mt-2 space-y-1.5">
            {historyRfqs.map((rfq) => (
              <HistoryRfqRow key={rfq.id} rfq={rfq} />
            ))}
          </div>
        </CollapsibleCard>
      )}
    </>
  );
}
