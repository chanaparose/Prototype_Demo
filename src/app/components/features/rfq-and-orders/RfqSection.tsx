import React from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ChevronRight,
  Calendar,
  FileText,
  Plus,
  Layers,
  Clock3,
  FileCheck2,
  OctagonX,
} from 'lucide-react';
import {
  PRIMARY_COLOR,
  PRIMARY_BG,
  PLUM,
  PLUM_SOFT_BG,
  PEACH_MIST,
  ACCENT_ORANGE_DEEP,
  BORDER_WARM,
  MOBILE_PRIMARY_TAB_BAR,
  RFQ_FILTER_THEME,
  CTA_GRADIENT,
  RFQ_STATUS_DISPLAY,
} from './constants';
import type { RfqFilterId } from './constants';
import { formatBudget, formatDate } from './utils';

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
};

type RfqTagCounts = {
  pending: number;
  has_quote: number;
  cancelled_expired: number;
};

type RfqSectionProps = {
  rfqFilter: RfqFilterId;
  setRfqFilter: (id: RfqFilterId) => void;
  filteredRfqs: RfqItem[];
  rfqTagCounts: RfqTagCounts;
};

const RFQ_TABS: { id: RfqFilterId; label: string; icon: typeof Clock3 }[] = [
  { id: 'pending', label: 'รอดำเนินการ', icon: Clock3 },
  { id: 'has_quote', label: 'มีใบเสนอราคา', icon: FileCheck2 },
  { id: 'cancelled_expired', label: 'ยกเลิก/หมดอายุ', icon: OctagonX },
];

export function RfqSection({
  rfqFilter,
  setRfqFilter,
  filteredRfqs,
  rfqTagCounts,
}: RfqSectionProps) {
  const navigate = useNavigate();

  return (
    <>
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

      <div
        className="grid grid-cols-3 mb-3 rounded-xl px-1.5 py-2 border"
        style={{ background: MOBILE_PRIMARY_TAB_BAR, borderColor: BORDER_WARM }}
      >
        {RFQ_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = rfqFilter === tab.id;
          const count = rfqTagCounts[tab.id];
          const th = RFQ_FILTER_THEME[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setRfqFilter(tab.id)}
              className="relative flex flex-col items-center gap-1 py-1"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: isActive ? th.activeBg : 'rgba(255,255,255,0.85)',
                  boxShadow: isActive ? `0 0 0 1px ${BORDER_WARM}` : 'none',
                }}
              >
                <Icon size={16} style={{ color: isActive ? th.activeColor : '#4B5563' }} />
              </div>
              {count > 0 && (
                <span
                  className="absolute top-0 right-[20%] min-w-4 h-4 px-1 rounded-full text-white text-[9px] flex items-center justify-center"
                  style={{
                    background: isActive ? th.activeColor : th.badgeInactive,
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              )}
              <span
                className="text-[11px] text-center leading-tight px-1"
                style={{
                  color: isActive ? th.activeColor : '#374151',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filteredRfqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
              style={{ background: PRIMARY_BG }}
            >
              <FileText size={36} style={{ color: PRIMARY_COLOR }} />
            </div>
            <p className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>
              ยังไม่มีคำขอราคา
            </p>
            <p className="text-sm text-gray-500 max-w-[220px] mb-4">
              สร้างคำขอราคาเพื่อรับใบเสนอราคาจากโรงงาน
            </p>
            <Link
              to="/create-rfq"
              className="py-2.5 px-6 rounded-xl text-white font-bold text-sm shadow-md"
              style={{
                background: CTA_GRADIENT,
                boxShadow: '0 6px 18px rgba(162,56,255,0.3)',
              }}
            >
              สร้างคำขอราคา
            </Link>
          </div>
        ) : (
          filteredRfqs.map((rfq, idx) => {
            const statusCfg = RFQ_STATUS_DISPLAY[rfq.status] ?? {
              label: rfq.status,
              color: '#6B7280',
              bg: '#F3F4F6',
            };
            const iconBgs = [PRIMARY_BG, PEACH_MIST, PLUM_SOFT_BG] as const;
            const iconColors = [PRIMARY_COLOR, ACCENT_ORANGE_DEEP, PLUM] as const;
            const ib = iconBgs[idx % 3];
            const ic = iconColors[idx % 3];
            const catColor = idx % 2 === 0 ? PLUM : PRIMARY_COLOR;
            return (
              <Link key={rfq.id} to={`/rfqs/${rfq.id}`} className="block">
                <div
                  className="rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform border bg-white/90 backdrop-blur-sm hover:bg-white/95"
                  style={{ borderColor: BORDER_WARM }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex gap-3 min-w-0 flex-1">
                      <div
                        className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: ib }}
                      >
                        {rfq.categoryIcon ?? (
                          <Layers size={24} style={{ color: ic }} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[10px] mb-0.5 font-semibold"
                          style={{ color: catColor }}
                        >
                          {rfq.category}
                        </p>
                        <h3 className="text-gray-900 font-bold text-sm leading-tight truncate">
                          {rfq.projectName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {rfq.description?.slice(0, 60)}
                          {(rfq.description?.length ?? 0) > 60 ? '...' : ''}
                        </p>
                      </div>
                    </div>
                    <span
                      className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: statusCfg.bg, color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <FileText size={12} style={{ color: '#9CA3AF' }} />
                        {formatBudget(rfq.budget)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} style={{ color: '#9CA3AF' }} />
                        {formatDate(rfq.createdAt)}
                      </span>
                    </div>
                    <span className="font-semibold" style={{ color: ic }}>
                      {rfq.offerCount} โรงงานตอบ
                    </span>
                  </div>
                  <div
                    className="mt-2 pt-2 flex items-center justify-end gap-2 text-xs"
                    style={{
                      borderTop: `1px solid ${BORDER_WARM}`,
                    }}
                  >
                    <span
                      className="flex items-center gap-1"
                      style={{ color: ic, fontWeight: 600 }}
                    >
                      ดูใบเสนอราคา <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
