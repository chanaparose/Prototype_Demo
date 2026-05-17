import React from 'react';
import { Link, useLocation } from 'react-router';
import { ChevronRight, ImageIcon, CheckCircle2, Clock4, XCircle, Send } from 'lucide-react';
import { DeadlineBadge } from '@/components/factory/DeadlineBadge';
import { formatCurrency, formatCompactNumber } from '@/utils/formatting';
import { Image } from '@/components/ui/image';

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

type BoqStatusInfo = {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ReactNode;
};

function boqStatusInfo(status: string | null): BoqStatusInfo {
  if (status === 'AC')
    return {
      label: 'ลูกค้ายอมรับใบเสนอราคาแล้ว',
      bg: '#DCFCE7',
      text: '#15803D',
      border: '#86EFAC',
      icon: <CheckCircle2 size={13} />,
    };
  if (status === 'RJ')
    return {
      label: 'ใบเสนอราคาถูกปฏิเสธ',
      bg: 'var(--status-danger-soft)',
      text: 'var(--status-danger-deep)',
      border: '#FCA5A5',
      icon: <XCircle size={13} />,
    };
  return {
    label: 'รอลูกค้าตัดสินใจ',
    bg: 'var(--status-warning-soft)',
    text: '#B45309',
    border: '#FCD34D',
    icon: <Clock4 size={13} />,
  };
}

function requestKindLabel(kind?: string): string {
  const k = String(kind ?? '').toUpperCase();
  if (k === 'PS') return 'ขอตัวอย่างสินค้า';
  if (k === 'MS') return 'ขอตัวอย่างวัสดุ';
  return 'ขอราคาผลิต OEM';
}

function formatBaht(n: number): string {
  return formatCurrency(Math.round(n), 'THB');
}

export function RfqCard({
  row,
  variant = 'board',
}: {
  row: RfqCardModel;
  variant?: 'board' | 'boq';
}) {
  const location = useLocation();
  const breadcrumb =
    row.categoryName && row.subCategoryName
      ? `${row.categoryName} › ${row.subCategoryName}`
      : row.subCategoryName || row.categoryName || '—';

  const budgetStr =
    row.budgetPerPiece != null && Number.isFinite(row.budgetPerPiece)
      ? `${formatCompactNumber(row.budgetPerPiece)} บ./ชิ้น`
      : '—';
  const qtyStr =
    row.quantity != null && Number.isFinite(row.quantity)
      ? `${formatCompactNumber(row.quantity)} ชิ้น`
      : '—';
  const rev =
    row.revenueApprox != null && Number.isFinite(row.revenueApprox)
      ? `≈ ${formatBaht(row.revenueApprox)}`
      : null;

  const statusLabel = row.hasMyQuote
    ? row.myQuoteStatus === 'PD'
      ? `เสนอแล้ว ${row.myQuotedPrice != null ? `${formatCompactNumber(row.myQuotedPrice)} บ./ชิ้น` : ''} · รอลูกค้าตอบ`
      : row.myQuoteStatus === 'AC'
        ? 'ลูกค้ารับใบเสนอราคาแล้ว'
        : row.myQuoteStatus === 'RJ'
          ? 'ใบเสนอราคาถูกปฏิเสธ'
          : 'เสนอราคาแล้ว'
    : 'ยังไม่ได้เสนอ';

  const boqInfo = boqStatusInfo(row.myQuoteStatus);

  if (variant === 'boq') {
    return (
      <Link
        to={`/factory/rfqs/${row.id}`}
        state={{ from: `${location.pathname}${location.search}` }}
        className='flex flex-col bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow min-w-0 text-left'
      >
        <div
          className='flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold border-b'
          style={{ background: boqInfo.bg, color: boqInfo.text, borderColor: boqInfo.border }}
        >
          {boqInfo.icon}
          <span>{boqInfo.label}</span>
          {row.myQuotedPrice != null ? (
            <span
              className='ml-auto flex items-center gap-1 text-[13px] font-bold'
              style={{ color: boqInfo.text }}
            >
              <Send size={11} />
              BOQ: {formatBaht(row.myQuotedPrice)}/ชิ้น
            </span>
          ) : null}
        </div>

        <div className='flex gap-3 sm:gap-4 p-3 sm:p-4'>
          <div className='w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center'>
            {row.thumbUrl ? (
              <Image
                src={row.thumbUrl}
                alt=''
                className='w-full h-full object-cover'
                loading='lazy'
              />
            ) : (
              <ImageIcon className='text-gray-300' size={24} aria-hidden />
            )}
          </div>
          <div className='flex-1 min-w-0 py-0.5'>
            <div className='flex items-center gap-2'>
              <p className='text-[11px] text-gray-400 font-medium'>#{row.id}</p>
              <span className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100'>
                {requestKindLabel(row.requestKind)}
              </span>
            </div>
            <p className='font-bold text-gray-900 truncate text-sm sm:text-base'>{row.title}</p>
            <p className='text-xs text-gray-500 mt-0.5'>{breadcrumb}</p>
            <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-700'>
              <span>
                <span className='text-gray-500'>💰</span>{' '}
                <span className='font-semibold'>
                  งบ {budgetStr} × {qtyStr}
                </span>
                {rev ? <span className='text-gray-500'> · {rev}</span> : null}
              </span>
              {row.deadlineIso ? (
                <span className='inline-flex items-center gap-1'>
                  <span className='text-gray-500'>📅</span>
                  <DeadlineBadge deadlineIso={row.deadlineIso} />
                </span>
              ) : null}
            </div>
            <div className='mt-3 flex items-center justify-end'>
              <span
                className='inline-flex items-center gap-1 text-xs font-semibold'
                style={{ color: 'var(--brand-indigo)' }}
              >
                ดูรายละเอียด BOQ
                <ChevronRight size={15} className='text-indigo-400' />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/factory/rfqs/${row.id}`}
      state={{ from: `${location.pathname}${location.search}` }}
      className='flex gap-3 sm:gap-4 bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 hover:shadow-md transition-shadow min-w-0 text-left'
    >
      <div className='w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center'>
        {row.thumbUrl ? (
          <Image src={row.thumbUrl} alt='' className='w-full h-full object-cover' loading='lazy' />
        ) : (
          <ImageIcon className='text-gray-300' size={28} aria-hidden />
        )}
      </div>
      <div className='flex-1 min-w-0 py-0.5'>
        <div className='flex items-center gap-2'>
          <p className='text-[11px] text-gray-400 font-medium'>#{row.id}</p>
          <span className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100'>
            {requestKindLabel(row.requestKind)}
          </span>
        </div>
        <p className='font-bold text-gray-900 truncate text-sm sm:text-base'>{row.title}</p>
        <p className='text-xs text-gray-600 mt-0.5 line-clamp-2'>{breadcrumb}</p>
        <div className='mt-2 space-y-1 text-xs text-gray-700'>
          <p>
            <span className='text-gray-500'>💰</span>{' '}
            <span className='font-semibold text-gray-900'>
              งบ {budgetStr} × {qtyStr}
            </span>
            {rev ? <span className='text-gray-600'> · {rev}</span> : null}
          </p>
          <p className='flex flex-wrap items-center gap-x-2 gap-y-1'>
            {row.leadTargetDays != null && row.leadTargetDays > 0 ? (
              <span>
                <span className='text-gray-500'>⏱</span> ต้องการ {row.leadTargetDays} วัน
              </span>
            ) : null}
            {row.deadlineIso ? (
              <span className='inline-flex items-center gap-1'>
                <span className='text-gray-500'>📅</span>
                <DeadlineBadge deadlineIso={row.deadlineIso} />
              </span>
            ) : null}
          </p>
          <p>
            <span className='text-gray-500'>🚚</span> {row.shippingMethodName || '—'}
          </p>
        </div>
        <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
          <span
            className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${
              row.hasMyQuote ? 'bg-violet-100 text-violet-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            สถานะ: {statusLabel}
          </span>
          <span
            className='inline-flex items-center gap-1 text-xs font-semibold shrink-0'
            style={{ color: 'var(--brand-purple)' }}
          >
            {row.hasMyQuote ? 'ดู →' : 'ดูและเสนอราคา →'}
            <ChevronRight size={16} className='text-violet-400' />
          </span>
        </div>
      </div>
    </Link>
  );
}
