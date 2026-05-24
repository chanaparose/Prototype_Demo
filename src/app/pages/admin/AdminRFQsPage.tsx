import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  DollarSign,
  Search,
  AlertTriangle,
} from 'lucide-react';
import type { IAdminRfqListResponse } from '@/services/api/types/admin.types';
import { formatIsoDate } from '@/utils/formatting/formatDate';
import { formatCompactNumber } from '@/utils/formatting/formatCurrency';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import {
  useAdminRfqDetailQuery,
  useAdminRfqListQuery,
} from '@/domain/admin/queries/useAdminRfqQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeletonRows,
} from '@/components/ui/table';

type RfqStatusTab = 'all' | 'open' | 'matched' | 'closed';

interface AdminRfqView {
  rfq_id: string;
  buyer_name: string;
  factory_name?: string;
  budget: number;
  status: string;
  created_at: string;
  title: string;
  quantity: number;
  category: string;
  sub_category: string;
}

function toApiStatus(tab: RfqStatusTab): string | undefined {
  if (tab === 'open') return 'OP';
  if (tab === 'matched') return 'MT';
  if (tab === 'closed') return 'CL';
  return undefined;
}

function toUiStatus(raw: string): 'open' | 'matched' | 'closed' {
  const s = pickScalarString(raw).toUpperCase();
  if (s === 'CL' || s === 'CC') return 'closed';
  if (s === 'MT' || s === 'MATCHED') return 'matched';
  return 'open';
}

const STATUS_META = {
  open: { label: 'รอดำเนินการ', cls: 'bg-amber-100 text-amber-700' },
  matched: { label: 'จับคู่แล้ว', cls: 'bg-blue-100 text-blue-700' },
  closed: { label: 'ปิด', cls: 'bg-slate-100 text-slate-500' },
};

const STATUS_TABS: { key: RfqStatusTab; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'open', label: 'รอดำเนินการ' },
  { key: 'matched', label: 'จับคู่แล้ว' },
  { key: 'closed', label: 'ปิด' },
];

function mapRfq(row: IAdminRfqListResponse): AdminRfqView {
  return {
    rfq_id: pickScalarString(row.rfq_id),
    buyer_name: pickScalarString(row.customer_name, '-'),
    factory_name: undefined,
    budget: pickScalarNumber(row.target_price) ?? 0,
    status: pickScalarString(row.status, 'OP'),
    created_at: pickScalarString(row.created_at),
    title: pickScalarString(row.title, '-'),
    quantity: pickScalarNumber(row.quantity) ?? 0,
    category: pickScalarString(row.category_name, '-'),
    sub_category: pickScalarString(row.sub_category_name, '-'),
  };
}

function RfqDetailPanel({ rfqId }: { rfqId: string }) {
  const detailQ = useAdminRfqDetailQuery(rfqId);
  const detail = detailQ.data ?? null;
  const loading = detailQ.isLoading;
  const error =
    detailQ.error instanceof Error ? detailQ.error.message : detailQ.error ? 'โหลดไม่สำเร็จ' : '';

  const rfq = (detail?.rfq ?? detail ?? {}) as Record<string, unknown>;
  const deliveryDate = pickScalarString(rfq.required_delivery_date, rfq.deadline);

  return (
    <TableRow>
      <TableCell colSpan={6} className='bg-indigo-50/50 px-6 py-4 border-b border-indigo-100'>
        {loading ? (
          <div className='text-sm text-slate-500'>กำลังโหลดรายละเอียด...</div>
        ) : error ? (
          <div className='text-sm text-red-600'>{error}</div>
        ) : (
          <>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <div className='flex items-start gap-2'>
                <Package size={14} className='text-indigo-500 mt-0.5 shrink-0' />
                <div>
                  <p className='text-[10px] text-slate-400 uppercase font-semibold'>สินค้า</p>
                  <p className='text-sm text-slate-900 font-medium'>
                    {pickScalarString(rfq.title, '-')}
                  </p>
                  <p className='text-xs text-slate-500 mt-0.5'>
                    จำนวน: {formatCompactNumber(pickScalarNumber(rfq.quantity) ?? 0)} ชิ้น
                  </p>
                  <p className='text-xs text-slate-500'>
                    หมวดหมู่: {pickScalarString(rfq.category_name, '-')} /{' '}
                    {pickScalarString(rfq.sub_category_name, '-')}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <Calendar size={14} className='text-indigo-500 mt-0.5 shrink-0' />
                <div>
                  <p className='text-[10px] text-slate-400 uppercase font-semibold'>กำหนดส่ง</p>
                  <p className='text-sm text-slate-900 font-medium'>
                    {deliveryDate ? formatIsoDate(deliveryDate) : '-'}
                  </p>
                  <p className='text-xs text-slate-400 mt-0.5'>
                    สร้างเมื่อ {formatIsoDate(rfq.created_at as string)}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <DollarSign size={14} className='text-indigo-500 mt-0.5 shrink-0' />
                <div>
                  <p className='text-[10px] text-slate-400 uppercase font-semibold'>งบประมาณ</p>
                  <p className='text-sm text-slate-900 font-bold'>
                    ฿{formatCompactNumber(pickScalarNumber(rfq.target_price) ?? 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className='mt-3 pt-3 border-t border-indigo-100'>
              <p className='text-[10px] text-slate-400 uppercase font-semibold mb-1'>หมายเหตุ</p>
              <p className='text-sm text-slate-700 whitespace-pre-wrap'>
                {pickScalarString(rfq.details, rfq.description, '-')}
              </p>
            </div>
          </>
        )}
      </TableCell>
    </TableRow>
  );
}

export function AdminRFQsPage() {
  const [statusTab, setStatusTab] = useState<RfqStatusTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(id);
  }, [search]);

  const listQ = useAdminRfqListQuery({
    status: toApiStatus(statusTab),
    search: debouncedSearch,
  });

  const rows = useMemo(() => (listQ.data ?? []).map(mapRfq), [listQ.data]);
  const loading = listQ.isLoading;
  const error =
    listQ.error instanceof Error
      ? listQ.error.message
      : listQ.error
        ? 'โหลดข้อมูล RFQ ไม่สำเร็จ'
        : '';

  const counts = useMemo(() => {
    const result = { all: rows.length, open: 0, matched: 0, closed: 0 };
    rows.forEach((r) => {
      const s = toUiStatus(r.status);
      result[s] += 1;
    });
    return result;
  }, [rows]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className='space-y-6'>
      <div>
        <p className='text-xs text-slate-400 font-medium'>Admin / RFQ</p>
        <h2 className='text-2xl font-bold text-slate-900 mt-1'>จัดการ RFQ</h2>
      </div>

      <div className='bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3'>
        <div className='relative'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
          <Input
            type='text'
            placeholder='ค้นหา RFQ title, ลูกค้า...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'
          />
        </div>

        <div className='flex gap-1 flex-wrap'>
          {STATUS_TABS.map((tab) => {
            const active = statusTab === tab.key;
            const count = counts[tab.key] ?? 0;
            return (
              <Button
                variant='unstyled'
                key={tab.key}
                type='button'
                onClick={() => setStatusTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                >
                  {count}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2'>
          <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
          <span>{error}</span>
        </div>
      ) : null}

      <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table className='w-full text-sm min-w-[700px]'>
            <TableHeader>
              <TableRow className='bg-slate-50 border-b border-slate-200'>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  RFQ ID
                </TableHead>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  ผู้ซื้อ
                </TableHead>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  โรงงาน
                </TableHead>
                <TableHead className='text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  งบประมาณ
                </TableHead>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  สถานะ
                </TableHead>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  วันที่สร้าง
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeletonRows columns={6} rows={3} />
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='py-12 text-center text-sm text-slate-400'>
                    ไม่พบ RFQ ที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((rfq) => {
                  const status = toUiStatus(rfq.status);
                  const meta = STATUS_META[status];
                  const isExpanded = expandedId === rfq.rfq_id;

                  return (
                    <React.Fragment key={rfq.rfq_id}>
                      <TableRow
                        className={`hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                        onClick={() => toggleExpand(rfq.rfq_id)}
                      >
                        <TableCell className='px-4 py-3'>
                          <div className='flex items-center gap-2'>
                            {isExpanded ? (
                              <ChevronUp size={13} className='text-indigo-500 shrink-0' />
                            ) : (
                              <ChevronDown size={13} className='text-slate-400 shrink-0' />
                            )}
                            <span className='font-mono text-xs text-indigo-600 font-semibold'>
                              #{rfq.rfq_id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='px-4 py-3 text-sm text-slate-700 max-w-[180px] truncate'>
                          {rfq.buyer_name}
                        </TableCell>
                        <TableCell className='px-4 py-3 text-sm text-slate-500'>
                          {rfq.factory_name ?? (
                            <span className='text-slate-300 italic text-xs'>ยังไม่จับคู่</span>
                          )}
                        </TableCell>
                        <TableCell className='px-4 py-3 text-sm text-slate-900 font-semibold text-right tabular-nums'>
                          ฿{formatCompactNumber(rfq.budget)}
                        </TableCell>
                        <TableCell className='px-4 py-3'>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}
                          >
                            {meta.label}
                          </span>
                        </TableCell>
                        <TableCell className='px-4 py-3 text-xs text-slate-400 tabular-nums'>
                          {formatIsoDate(rfq.created_at)}
                        </TableCell>
                      </TableRow>
                      {isExpanded ? <RfqDetailPanel rfqId={rfq.rfq_id} /> : null}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
