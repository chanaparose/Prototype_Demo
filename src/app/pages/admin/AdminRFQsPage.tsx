import React, { useEffect, useMemo, useState } from 'react';
import {
  Package,
  Calendar,
  Search,
  AlertTriangle,
  Loader2,
  User,
  Factory,
  FileText,
  ImageIcon,
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableContainer,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
  TableSkeletonRows,
} from '@/components/admin/AdminTable';

type RfqStatusTab = 'all' | 'open' | 'matched' | 'closed';
type AdminBadgeVariant = NonNullable<React.ComponentProps<typeof Badge>['variant']>;

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

function toUiStatus(raw: string): 'open' | 'matched' | 'closed' {
  const s = pickScalarString(raw).toUpperCase();
  if (s === 'CL' || s === 'CC') return 'closed';
  if (s === 'MT' || s === 'MATCHED') return 'matched';
  return 'open';
}

const STATUS_META: Record<Exclude<RfqStatusTab, 'all'>, { label: string; variant: AdminBadgeVariant }> = {
  open: { label: 'รอดำเนินการ', variant: 'pending' },
  matched: { label: 'จับคู่แล้ว', variant: 'info' },
  closed: { label: 'ปิด', variant: 'inactive' },
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
    factory_name: pickScalarString(row.factory_name) || undefined,
    budget: pickScalarNumber(row.target_price) ?? 0,
    status: pickScalarString(row.status, 'OP'),
    created_at: pickScalarString(row.created_at),
    title: pickScalarString(row.title, '-'),
    quantity: pickScalarNumber(row.quantity) ?? 0,
    category: pickScalarString(row.category_name, '-'),
    sub_category: pickScalarString(row.sub_category_name, '-'),
  };
}

function collectImageUrls(...sources: unknown[]): string[] {
  const urls: string[] = [];
  for (const source of sources) {
    if (typeof source === 'string' && source.trim()) {
      urls.push(source.trim());
      continue;
    }
    if (!Array.isArray(source)) continue;
    for (const item of source) {
      if (typeof item === 'string' && item.trim()) urls.push(item.trim());
      else if (item && typeof item === 'object') {
        const url = pickScalarString(
          (item as Record<string, unknown>).url,
          (item as Record<string, unknown>).image_url,
        );
        if (url) urls.push(url);
      }
    }
  }
  return [...new Set(urls)];
}

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>{label}</p>
      <div className='mt-1 text-sm text-slate-800'>{children}</div>
    </div>
  );
}

type AdminRfqDetailDialogProps = {
  rfq: AdminRfqView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function AdminRfqDetailDialog({ rfq, open, onOpenChange }: AdminRfqDetailDialogProps) {
  const detailQ = useAdminRfqDetailQuery(rfq?.rfq_id ?? '', open && !!rfq?.rfq_id);
  const detail = detailQ.data ?? null;
  const loading = detailQ.isLoading;
  const error =
    detailQ.error instanceof Error ? detailQ.error.message : detailQ.error ? 'โหลดไม่สำเร็จ' : '';

  const raw = (detail?.rfq ?? detail ?? {}) as Record<string, unknown>;
  const status = toUiStatus(pickScalarString(raw.status, rfq?.status, 'OP'));
  const statusMeta = STATUS_META[status];
  const deliveryDate = pickScalarString(
    raw.required_delivery_date,
    raw.deadline,
    raw.target_date,
    raw.delivery_deadline,
  );
  const leadTimeDays = pickScalarNumber(
    raw.target_lead_time_days,
    raw.target_days,
    raw.lead_time_target,
  );
  const budget =
    pickScalarNumber(raw.target_price, raw.budget_total, raw.total_budget) ?? rfq?.budget ?? 0;
  const budgetPerPiece = pickScalarNumber(raw.budget_per_piece, raw.target_unit_price);
  const quantity = pickScalarNumber(raw.quantity) ?? rfq?.quantity ?? 0;
  const unitName = pickScalarString(raw.unit_name, 'ชิ้น');
  const imageUrls = collectImageUrls(
    raw.image_urls,
    raw.reference_images,
    raw.images,
    detail?.image_urls,
  );
  const quotations = Array.isArray(detail?.quotations)
    ? (detail.quotations as Record<string, unknown>[])
    : Array.isArray(raw.quotations)
      ? (raw.quotations as Record<string, unknown>[])
      : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl gap-0 p-0'>
        <DialogHeader className='border-b border-slate-100 px-6 py-4 text-left'>
          <DialogTitle className='flex flex-wrap items-center gap-2 text-lg'>
            <span className='font-mono text-purple-600'>#{rfq?.rfq_id}</span>
            <Badge variant={statusMeta.variant} size='sm'>
              {statusMeta.label}
            </Badge>
          </DialogTitle>
          <DialogDescription className='text-left text-sm text-slate-600'>
            {pickScalarString(raw.title, rfq?.title, '-')}
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-[min(72vh,640px)] overflow-y-auto px-6 py-5'>
          {loading ? (
            <div className='flex items-center justify-center gap-2 py-16 text-sm text-slate-500'>
              <Loader2 size={16} className='animate-spin text-purple-500' />
              กำลังโหลดรายละเอียด...
            </div>
          ) : error ? (
            <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
              {error}
            </div>
          ) : (
            <div className='space-y-6'>
              <section>
                <h4 className='mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500'>
                  <User size={13} />
                  ผู้ซื้อ
                </h4>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <DetailField label='ชื่อลูกค้า'>
                    {pickScalarString(raw.customer_name, rfq?.buyer_name, '-')}
                  </DetailField>
                  <DetailField label='อีเมล'>
                    {pickScalarString(raw.customer_email, '-')}
                  </DetailField>
                  <DetailField label='User ID'>
                    {pickScalarString(raw.user_id, '-')}
                  </DetailField>
                  <DetailField label='จำนวนข้อเสนอ'>
                    {formatCompactNumber(
                      pickScalarNumber(raw.quotation_count, detail?.quotation_count) ?? 0,
                    )}{' '}
                    รายการ
                  </DetailField>
                </div>
              </section>

              <section>
                <h4 className='mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500'>
                  <Package size={13} />
                  สินค้า / งาน
                </h4>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <DetailField label='ชื่องาน' className='sm:col-span-2'>
                    {pickScalarString(raw.title, rfq?.title, '-')}
                  </DetailField>
                  <DetailField label='จำนวน'>
                    {formatCompactNumber(quantity)} {unitName}
                  </DetailField>
                  <DetailField label='หมวดหมู่'>
                    {pickScalarString(raw.category_name, rfq?.category, '-')}
                    {pickScalarString(raw.sub_category_name, rfq?.sub_category) !== '-' ? (
                      <span className='text-slate-500'>
                        {' '}
                        / {pickScalarString(raw.sub_category_name, rfq?.sub_category)}
                      </span>
                    ) : null}
                  </DetailField>
                  <DetailField label='เกรดวัตถุดิบ'>
                    {pickScalarString(raw.material_grade, '-')}
                  </DetailField>
                  <DetailField label='สเปกบรรจุภัณฑ์'>
                    {pickScalarString(raw.packaging_spec, '-')}
                  </DetailField>
                </div>
              </section>

              <section>
                <h4 className='mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500'>
                  <Calendar size={13} />
                  งบประมาณ & กำหนดส่ง
                </h4>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <DetailField label='งบประมาณรวม'>
                    <span className='text-base font-bold tabular-nums text-slate-900'>
                      ฿{formatCompactNumber(budget)}
                    </span>
                  </DetailField>
                  <DetailField label='ราคาเป้าหมายต่อหน่วย'>
                    {budgetPerPiece != null ? `฿${formatCompactNumber(budgetPerPiece)}` : '-'}
                  </DetailField>
                  <DetailField label='กำหนดส่ง'>
                    {deliveryDate ? formatIsoDate(deliveryDate) : '-'}
                  </DetailField>
                  <DetailField label='Lead time เป้าหมาย'>
                    {leadTimeDays != null ? `${leadTimeDays} วัน` : '-'}
                  </DetailField>
                  <DetailField label='วันที่สร้าง'>
                    {formatIsoDate(pickScalarString(raw.created_at, rfq?.created_at))}
                  </DetailField>
                  <DetailField label='ที่อยู่จัดส่ง'>
                    {pickScalarString(raw.address_summary, raw.shipping_address, '-')}
                  </DetailField>
                </div>
              </section>

              <section>
                <h4 className='mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500'>
                  <FileText size={13} />
                  รายละเอียดเพิ่มเติม
                </h4>
                <p className='whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700'>
                  {pickScalarString(raw.details, raw.description, '-')}
                </p>
              </section>

              {imageUrls.length > 0 ? (
                <section>
                  <h4 className='mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500'>
                    <ImageIcon size={13} />
                    รูปอ้างอิง
                  </h4>
                  <div className='flex flex-wrap gap-2'>
                    {imageUrls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target='_blank'
                        rel='noreferrer'
                        className='h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-50'
                      >
                        <ImageWithFallback
                          src={url}
                          alt=''
                          className='h-full w-full object-cover'
                        />
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}

              {quotations.length > 0 ? (
                <section>
                  <h4 className='mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500'>
                    <Factory size={13} />
                    ข้อเสนอจากโรงงาน ({quotations.length})
                  </h4>
                  <div className='space-y-2'>
                    {quotations.map((quote, idx) => {
                      const quoteId = pickScalarString(quote.quote_id, quote.quotation_id, idx);
                      return (
                        <div
                          key={quoteId}
                          className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2.5'
                        >
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-medium text-slate-800'>
                              {pickScalarString(quote.factory_name, 'โรงงาน')}
                            </p>
                            <p className='text-xs text-slate-400'>
                              Quote #{pickScalarString(quote.quote_id, quote.quotation_id, '-')}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='text-sm font-semibold tabular-nums text-slate-900'>
                              ฿
                              {formatCompactNumber(
                                pickScalarNumber(quote.grand_total, quote.price) ?? 0,
                              )}
                            </p>
                            <p className='text-xs text-slate-400'>
                              {pickScalarString(quote.status, '-')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminRFQsPage() {
  const [statusTab, setStatusTab] = useState<RfqStatusTab>('all');
  const [selectedRfq, setSelectedRfq] = useState<AdminRfqView | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(id);
  }, [search]);

  const listQ = useAdminRfqListQuery({
    search: debouncedSearch,
  });

  const allRows = useMemo(() => (listQ.data ?? []).map(mapRfq), [listQ.data]);
  const rows = useMemo(
    () => (statusTab === 'all' ? allRows : allRows.filter((rfq) => toUiStatus(rfq.status) === statusTab)),
    [allRows, statusTab],
  );
  const loading = listQ.isLoading;
  const error =
    listQ.error instanceof Error
      ? listQ.error.message
      : listQ.error
        ? 'โหลดข้อมูล RFQ ไม่สำเร็จ'
        : '';

  const counts = useMemo(() => {
    const result = { all: allRows.length, open: 0, matched: 0, closed: 0 };
    allRows.forEach((r) => {
      const s = toUiStatus(r.status);
      result[s] += 1;
    });
    return result;
  }, [allRows]);

  const openRfqDetail = (rfq: AdminRfqView) => {
    setSelectedRfq(rfq);
  };

  return (
    <div className='space-y-6 lg:space-y-8'>
      <div>
        <h2 className='text-2xl lg:text-3xl font-bold text-slate-900'>จัดการ RFQ</h2>
      </div>

      <div className='space-y-3'>
        <div className='relative max-w-sm'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
          <Input
            type='text'
            placeholder='ค้นหา RFQ title, ลูกค้า...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500'
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
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-slate-600 border border-purple-100 hover:bg-purple-50 hover:border-purple-200'
                }`}
              >
                {tab.label}
                <Badge
                  variant={active ? 'active' : 'outline'}
                  size='sm'
                  className={active ? '' : 'border-purple-100 bg-white text-purple-600'}
                >
                  {count}
                </Badge>
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

      <AdminTableContainer>
        <AdminTable className='min-w-[700px]'>
          <AdminTableHeader>
            <AdminTableRow>
                <AdminTableHead>
                  RFQ ID
                </AdminTableHead>
                <AdminTableHead>
                  ผู้ซื้อ
                </AdminTableHead>
                <AdminTableHead>
                  โรงงาน
                </AdminTableHead>
                <AdminTableHead>
                  งบประมาณ
                </AdminTableHead>
                <AdminTableHead>
                  สถานะ
                </AdminTableHead>
                <AdminTableHead>
                  วันที่สร้าง
                </AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {loading ? (
                <TableSkeletonRows columns={6} rows={3} />
              ) : rows.length === 0 ? (
                <AdminTableRow>
                  <AdminTableCell colSpan={6} className='py-12 text-center text-sm text-slate-400'>
                    ไม่พบ RFQ ที่ตรงกับเงื่อนไข
                  </AdminTableCell>
                </AdminTableRow>
              ) : (
                rows.map((rfq) => {
                  const status = toUiStatus(rfq.status);
                  const meta = STATUS_META[status];

                  return (
                    <AdminTableRow
                      key={rfq.rfq_id}
                      className='cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50'
                      onClick={() => openRfqDetail(rfq)}
                    >
                      <AdminTableCell className='px-4 py-3'>
                        <span className='font-mono text-xs font-semibold text-purple-600'>
                          #{rfq.rfq_id}
                        </span>
                      </AdminTableCell>
                      <AdminTableCell className='max-w-[180px] truncate px-4 py-3 text-sm text-slate-700'>
                        {rfq.buyer_name}
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3 text-sm text-slate-500'>
                        {rfq.factory_name ?? (
                          <span className='text-xs italic text-slate-300'>ยังไม่จับคู่</span>
                        )}
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3 text-sm font-semibold tabular-nums text-slate-900'>
                        ฿{formatCompactNumber(rfq.budget)}
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3'>
                        <Badge variant={meta.variant} size='sm'>
                          {meta.label}
                        </Badge>
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3 text-xs tabular-nums text-slate-400'>
                        {formatIsoDate(rfq.created_at)}
                      </AdminTableCell>
                    </AdminTableRow>
                  );
                })
              )}
            </AdminTableBody>
          </AdminTable>
      </AdminTableContainer>

      <AdminRfqDetailDialog
        rfq={selectedRfq}
        open={!!selectedRfq}
        onOpenChange={(open) => {
          if (!open) setSelectedRfq(null);
        }}
      />
    </div>
  );
}
