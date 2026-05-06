import React from 'react';
import { Link, useLocation } from 'react-router';
import { ChevronRight, ImageIcon } from 'lucide-react';
import { DeadlineBadge } from './DeadlineBadge';

export type RfqCardModel = {
  id: string;
  title: string;
  requestKind?: 'PR' | 'PS' | 'MS' | string;
  status: string;
  categoryName: string;
  subCategoryName: string;
  budgetPerPiece: number | null;
  quantity: number | null;
  revenueApprox: number | null;
  leadTargetDays: number | null;
  deadlineIso: string | null;
  shippingMethodName: string;
  addressSummary: string;
  thumbUrl: string | null;
  myQuotedPrice: number | null;
  myQuoteStatus: string | null;
  hasMyQuote: boolean;
};

function requestKindLabel(kind?: string): string {
  const k = String(kind ?? '').toUpperCase();
  if (k === 'PS') return 'ขอตัวอย่างสินค้า';
  if (k === 'MS') return 'ขอตัวอย่างวัสดุ';
  return 'ขอราคาผลิต OEM';
}

function formatBaht(n: number): string {
  return `฿${Math.round(n).toLocaleString('th-TH')}`;
}

export function RfqCard({ row }: { row: RfqCardModel }) {
  const location = useLocation();
  const breadcrumb =
    row.categoryName && row.subCategoryName
      ? `${row.categoryName} › ${row.subCategoryName}`
      : row.subCategoryName || row.categoryName || '—';

  const budgetStr =
    row.budgetPerPiece != null && Number.isFinite(row.budgetPerPiece)
      ? `${row.budgetPerPiece.toLocaleString('th-TH')} บ./ชิ้น`
      : '—';
  const qtyStr =
    row.quantity != null && Number.isFinite(row.quantity)
      ? `${row.quantity.toLocaleString('th-TH')} ชิ้น`
      : '—';
  const rev =
    row.revenueApprox != null && Number.isFinite(row.revenueApprox)
      ? `≈ ${formatBaht(row.revenueApprox)}`
      : null;

  const statusLabel = row.hasMyQuote
    ? row.myQuoteStatus === 'PD'
      ? `เสนอแล้ว ${row.myQuotedPrice != null ? `${row.myQuotedPrice.toLocaleString('th-TH')} บ./ชิ้น` : ''} · รอลูกค้าตอบ`
      : row.myQuoteStatus === 'AC'
        ? 'ลูกค้ารับใบเสนอราคาแล้ว'
        : row.myQuoteStatus === 'RJ'
          ? 'ใบเสนอราคาถูกปฏิเสธ'
          : 'เสนอราคาแล้ว'
    : 'ยังไม่ได้เสนอ';

  return (
    <Link
      to={`/factory/rfqs/${row.id}`}
      state={{ from: `${location.pathname}${location.search}` }}
      className="flex gap-3 sm:gap-4 bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 hover:shadow-md transition-shadow min-w-0 text-left"
    >
      <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
        {row.thumbUrl ? (
          <img src={row.thumbUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <ImageIcon className="text-gray-300" size={28} aria-hidden />
        )}
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-gray-400 font-medium">#{row.id}</p>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            {requestKindLabel(row.requestKind)}
          </span>
        </div>
        <p className="font-bold text-gray-900 truncate text-sm sm:text-base">{row.title}</p>
        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{breadcrumb}</p>
        <div className="mt-2 space-y-1 text-xs text-gray-700">
          <p>
            <span className="text-gray-500">💰</span>{' '}
            <span className="font-semibold text-gray-900">
              งบ {budgetStr} × {qtyStr}
            </span>
            {rev ? <span className="text-gray-600"> · {rev}</span> : null}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {row.leadTargetDays != null && row.leadTargetDays > 0 ? (
              <span>
                <span className="text-gray-500">⏱</span> ต้องการ {row.leadTargetDays} วัน
              </span>
            ) : null}
            {row.deadlineIso ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-gray-500">📅</span>
                <DeadlineBadge deadlineIso={row.deadlineIso} />
              </span>
            ) : null}
          </p>
          <p>
            <span className="text-gray-500">🚚</span> {row.shippingMethodName || '—'}
            {row.addressSummary ? (
              <>
                {' '}
                <span className="text-gray-400">·</span> 📍 {row.addressSummary}
              </>
            ) : null}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${
              row.hasMyQuote ? 'bg-violet-100 text-violet-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            สถานะ: {statusLabel}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold shrink-0" style={{ color: '#A238FF' }}>
            {row.hasMyQuote ? 'ดู →' : 'ดูและเสนอราคา →'}
            <ChevronRight size={16} className="text-violet-400" />
          </span>
        </div>
      </div>
    </Link>
  );
}
