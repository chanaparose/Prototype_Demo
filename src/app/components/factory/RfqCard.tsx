import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
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
  unitName: string | null;
  myQuotedPrice: number | null;
  myQuoteStatus: string | null;
  hasMyQuote: boolean;
  isTargeted?: boolean;
};

export type RfqTableRow = RfqCardModel & { createdAtMs?: number };

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
  const unit = row.unitName || 'ชิ้น';
  const budget =
    row.budgetPerPiece != null && Number.isFinite(row.budgetPerPiece)
      ? `${formatCompactNumber(row.budgetPerPiece)} บ./${unit}`
      : null;
  const qty =
    row.quantity != null && Number.isFinite(row.quantity)
      ? `${formatCompactNumber(row.quantity)} ${unit}`
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

function SortableHead({ children }: { children: React.ReactNode }) {
  return (
    <TableHead className='py-2 text-[10px]'>
      <span className='inline-flex items-center gap-1'>
        {children}
        <ArrowUpDown className='h-2.5 w-2.5 text-slate-400' aria-hidden />
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
    <div className='flex flex-col gap-2 border-t border-slate-100 bg-white px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between'>
      <p className='text-xs text-slate-600'>
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
          className='flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'
          aria-label='หน้าก่อน'
        >
          <ChevronLeft className='h-3.5 w-3.5' />
        </Button>
        {pageNumbers.map((p) => (
          <Button
            key={p}
            variant='unstyled'
            type='button'
            onClick={() => onPageChange(p)}
            className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-semibold transition-colors ${
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
          className='flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'
          aria-label='หน้าถัดไป'
        >
          <ChevronRight className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  );
}

function RfqTableRowLink({
  row,
  from,
}: {
  row: RfqTableRow;
  from: string;
}) {
  const navigate = useNavigate();
  const detailPath = `/factory/rfqs/${row.id}`;

  const goToDetail = () => navigate(detailPath, { state: { from } });

  return (
    <TableRow
      className='cursor-pointer'
      onClick={goToDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToDetail();
        }
      }}
      tabIndex={0}
      role='link'
      aria-label={`${row.title} #${row.id}`}
    >
      <TableCell className='min-w-[220px] py-2.5 text-xs'>
        <div className='flex min-w-0 items-center gap-2.5 group'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100'>
            {row.thumbUrl ? (
              <Image
                src={row.thumbUrl}
                alt=''
                className='h-full w-full object-cover'
                loading='lazy'
              />
            ) : (
              <ImageIcon className='text-slate-300' size={16} aria-hidden />
            )}
          </div>
          <div className='min-w-0'>
            <p className='truncate text-xs font-semibold text-slate-900 group-hover:text-indigo-700'>
              {row.title}
            </p>
            <div className='mt-0.5 flex flex-wrap items-center gap-1'>
              <span className='text-[10px] text-slate-400'>#{row.id}</span>
              {row.isTargeted ? (
                <span className='inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1 py-0.5 text-[9px] font-semibold text-amber-700'>
                  <Crosshair size={9} />
                  ส่งตรง
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className='min-w-[140px] py-2.5 text-xs text-slate-700'>{categoryLabel(row)}</TableCell>
      <TableCell className='min-w-[100px] py-2.5 text-xs text-slate-700'>
        {requestKindLabel(row.requestKind)}
      </TableCell>
      <TableCell className='min-w-[120px] py-2.5 text-xs font-medium text-slate-900 tabular-nums'>
        {priceLabel(row)}
      </TableCell>
      <TableCell className='min-w-[120px] py-2.5 text-xs font-medium text-slate-900 tabular-nums'>
        {row.quantity != null && Number.isFinite(row.quantity)
          ? `${formatCompactNumber(row.quantity)} ${row.unitName || 'ชิ้น'}`
          : '—'}
      </TableCell>
      <TableCell className='min-w-[110px] py-2.5 text-xs text-slate-600 whitespace-nowrap'>
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
              <SortableHead>จำนวน</SortableHead>
              <SortableHead>วันที่สร้าง</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <RfqTableRowLink key={row.id} row={row} from={from} />
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
