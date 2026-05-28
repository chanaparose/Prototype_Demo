import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  ImageIcon,
} from 'lucide-react';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting/formatCurrency';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type RfqCardModel = {
  id: string;
  title: string;
  requestKind?: 'PR' | 'PS' | 'MS' | 'MR' | string;
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
  isTargeted?: boolean;
};

export type RfqTableRow = RfqCardModel & { createdAtMs?: number };

type StatusPill = { label: string; className: string };

function requestKindLabel(kind?: string): string {
  const k = String(kind ?? '').toUpperCase();
  if (k === 'PS') return 'ตัวอย่างสินค้า';
  if (k === 'MS') return 'ตัวอย่างวัสดุ';
  if (k === 'MR') return 'สั่งวัตถุดิบ';
  return 'OEM';
}

function formatBaht(n: number): string {
  return formatCurrency(Math.round(n), 'THB');
}

function categoryLabel(row: RfqCardModel): string {
  if (row.categoryName && row.subCategoryName) {
    return `${row.categoryName} › ${row.subCategoryName}`;
  }
  return row.subCategoryName || row.categoryName || '—';
}

function priceLabel(row: RfqCardModel): string {
  if (row.revenueApprox != null && Number.isFinite(row.revenueApprox)) {
    return formatBaht(row.revenueApprox);
  }
  const budget =
    row.budgetPerPiece != null && Number.isFinite(row.budgetPerPiece)
      ? `${formatCompactNumber(row.budgetPerPiece)} บ./ชิ้น`
      : null;
  const qty =
    row.quantity != null && Number.isFinite(row.quantity)
      ? `${formatCompactNumber(row.quantity)} ชิ้น`
      : null;
  if (budget && qty) return `${budget} × ${qty}`;
  if (budget) return budget;
  return '—';
}

function formatCreatedAt(ms?: number): string {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return '—';
  return new Date(ms).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function boardStatusPill(row: RfqCardModel): StatusPill {
  if (row.hasMyQuote) {
    if (row.myQuoteStatus === 'AC') {
      return { label: 'ลูกค้ารับแล้ว', className: 'bg-emerald-50 text-emerald-700' };
    }
    if (row.myQuoteStatus === 'RJ') {
      return { label: 'ถูกปฏิเสธ', className: 'bg-rose-50 text-rose-600' };
    }
    return { label: 'รอลูกค้าตอบ', className: 'bg-amber-50 text-amber-700' };
  }
  if (row.status === 'OP') {
    return { label: 'รอเสนอราคา', className: 'bg-amber-50 text-amber-700' };
  }
  if (row.status === 'CL') {
    return { label: 'ปิดรับแล้ว', className: 'bg-slate-100 text-slate-600' };
  }
  if (row.status === 'CC') {
    return { label: 'ยกเลิก', className: 'bg-rose-50 text-rose-600' };
  }
  return { label: row.status || '—', className: 'bg-slate-100 text-slate-600' };
}

function boqStatusPill(row: RfqCardModel): StatusPill {
  if (row.myQuoteStatus === 'AC') {
    return { label: 'ลูกค้ารับแล้ว', className: 'bg-emerald-50 text-emerald-700' };
  }
  if (row.myQuoteStatus === 'RJ') {
    return { label: 'ถูกปฏิเสธ', className: 'bg-rose-50 text-rose-600' };
  }
  return { label: 'รอลูกค้าตอบ', className: 'bg-amber-50 text-amber-700' };
}

function SortableHead({ children }: { children: React.ReactNode }) {
  return (
    <TableHead>
      <span className='inline-flex items-center gap-1.5'>
        {children}
        <ArrowUpDown className='h-3 w-3 text-slate-400' aria-hidden />
      </span>
    </TableHead>
  );
}

function RfqTablePagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
    return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  }, [page, totalPages]);

  if (total === 0) return null;

  return (
    <div className='flex flex-col gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
      <p className='text-sm text-slate-600'>
        แสดง <span className='font-semibold text-slate-900'>{start}</span> ถึง{' '}
        <span className='font-semibold text-slate-900'>{end}</span> จาก{' '}
        <span className='font-semibold text-slate-900'>{total}</span> รายการ
      </p>
      <div className='flex items-center gap-1'>
        <Button
          variant='unstyled'
          type='button'
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className='flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'
          aria-label='หน้าก่อน'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>
        {pageNumbers.map((p) => (
          <Button
            key={p}
            variant='unstyled'
            type='button'
            onClick={() => onPageChange(p)}
            className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors ${
              p === page
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        ))}
        <Button
          variant='unstyled'
          type='button'
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className='flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'
          aria-label='หน้าถัดไป'
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

function RfqTableRowLink({
  row,
  variant,
  from,
}: {
  row: RfqTableRow;
  variant: 'board' | 'boq';
  from: string;
}) {
  const pill = variant === 'boq' ? boqStatusPill(row) : boardStatusPill(row);

  return (
    <TableRow>
      <TableCell className='min-w-[220px]'>
        <Link
          to={`/factory/rfqs/${row.id}`}
          state={{ from }}
          className='flex items-center gap-3 min-w-0 group'
        >
          <div className='h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center'>
            {row.thumbUrl ? (
              <Image
                src={row.thumbUrl}
                alt=''
                className='h-full w-full object-cover'
                loading='lazy'
              />
            ) : (
              <ImageIcon className='text-slate-300' size={20} aria-hidden />
            )}
          </div>
          <div className='min-w-0'>
            <p className='truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-700'>
              {row.title}
            </p>
            <div className='mt-0.5 flex flex-wrap items-center gap-1.5'>
              <span className='text-[11px] text-slate-400'>#{row.id}</span>
              {row.isTargeted ? (
                <span className='inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700'>
                  <Crosshair size={9} />
                  ส่งตรง
                </span>
              ) : null}
            </div>
          </div>
        </Link>
      </TableCell>
      <TableCell className='min-w-[140px] text-sm text-slate-700'>{categoryLabel(row)}</TableCell>
      <TableCell className='min-w-[100px] text-sm text-slate-700'>
        {requestKindLabel(row.requestKind)}
      </TableCell>
      <TableCell className='min-w-[120px] text-sm font-medium text-slate-900 tabular-nums'>
        {priceLabel(row)}
      </TableCell>
      <TableCell className='min-w-[120px]'>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${pill.className}`}
        >
          {pill.label}
        </span>
        {variant === 'boq' && row.myQuotedPrice != null ? (
          <p className='mt-1 text-[11px] text-slate-500 tabular-nums'>
            BOQ {formatBaht(row.myQuotedPrice)}/ชิ้น
          </p>
        ) : null}
      </TableCell>
      <TableCell className='min-w-[110px] text-sm text-slate-600 whitespace-nowrap'>
        {formatCreatedAt(row.createdAtMs)}
      </TableCell>
    </TableRow>
  );
}

/** @deprecated Use RfqTable — kept as alias */
export const RfqCard = RfqTable;

export function RfqTable({
  rows,
  variant = 'board',
  pageSize = 7,
  seamless = false,
}: {
  rows: RfqTableRow[];
  variant?: 'board' | 'boq';
  pageSize?: number;
  /** When true, removes the outer card border — use inside an existing card container */
  seamless?: boolean;
}) {
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;
  const [page, setPage] = useState(1);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [rows, variant, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const inner = (
    <>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent dark:hover:bg-transparent'>
              <SortableHead>RFQ</SortableHead>
              <SortableHead>หมวดหมู่</SortableHead>
              <SortableHead>ประเภท</SortableHead>
              <SortableHead>งบประมาณ</SortableHead>
              <SortableHead>สถานะ</SortableHead>
              <SortableHead>วันที่สร้าง</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <RfqTableRowLink key={row.id} row={row} variant={variant} from={from} />
            ))}
          </TableBody>
        </Table>
      </div>
      <RfqTablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </>
  );

  if (seamless) {
    return <div className='overflow-hidden'>{inner}</div>;
  }

  return (
    <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white'>{inner}</div>
  );
}
