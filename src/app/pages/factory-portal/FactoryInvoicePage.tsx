import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Image,
} from 'lucide-react';
import { factoryInvoiceApi } from '@/services/api/factoryApi';
import type {
  ICommissionInvoiceResponse,
  ICommissionInvoiceItemResponse,
} from '@/services/api/types/admin.types';
import { Button } from '@/components/ui/button';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import {
  FactoryStatusBadge,
  type FactoryStatusTone,
} from '@/pages/factory-portal/components/FactoryStatusBadge';
import { factoryButtonClass, factoryCardClass } from '@/pages/factory-portal/factoryUi';

const STATUS_META: Record<
  string,
  { label: string; tone: FactoryStatusTone; icon: React.ElementType }
> = {
  DR: { label: 'แบบร่าง', tone: 'neutral', icon: Clock },
  ST: { label: 'รอชำระ', tone: 'warning', icon: Clock },
  PA: { label: 'แนบสลีปแล้ว — รอตรวจสอบ', tone: 'info', icon: FileText },
  VR: { label: 'ตรวจสอบแล้ว', tone: 'success', icon: CheckCircle },
};

const MONTHS_TH = [
  '',
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export function FactoryInvoicePage() {
  const [invoices, setInvoices] = useState<ICommissionInvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);

  // Detail
  const [detailInvoice, setDetailInvoice] = useState<ICommissionInvoiceResponse | null>(null);
  const [detailItems, setDetailItems] = useState<ICommissionInvoiceItemResponse[]>([]);
  const [previewSlip, setPreviewSlip] = useState<string | null>(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await factoryInvoiceApi.list();
      setInvoices(res.invoices ?? []);
    } catch {
      setError('โหลดข้อมูล invoice ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvoices();
  }, []);

  const openDetail = async (inv: ICommissionInvoiceResponse) => {
    try {
      const res = await factoryInvoiceApi.get(inv.invoice_id);
      setDetailInvoice(res.invoice);
      setDetailItems(res.items ?? []);
    } catch {
      setError('โหลดรายละเอียดไม่สำเร็จ');
    }
  };

  const triggerUpload = (invoiceId: number) => {
    setUploadTargetId(invoiceId);
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    if (file.type !== 'image/jpeg') {
      toast.error('รองรับเฉพาะไฟล์ .jpg/.jpeg เท่านั้น');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setUploading(uploadTargetId);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await factoryInvoiceApi.attachSlip(uploadTargetId, formData);
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'แนบสลีปไม่สำเร็จ');
    } finally {
      setUploading(null);
      setUploadTargetId(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className='space-y-6'>
      <FactoryPageHeader
        title='Invoice ค่า Commission'
        subtitle='Factory / Invoices · สรุปค่า commission รายเดือน'
        icon={FileText}
        variant='minimal'
      />

      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 flex items-center gap-2'>
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      <input
        ref={fileRef}
        type='file'
        accept='image/jpeg,.jpg,.jpeg'
        onChange={handleFileChange}
        className='hidden'
      />

      {loading ? (
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className={factoryCardClass({ variant: 'section' })}>
              <div className='h-5 w-40 bg-slate-100 rounded animate-pulse mb-2' />
              <div className='h-4 w-56 bg-slate-100 rounded animate-pulse' />
            </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className={factoryCardClass({ variant: 'empty', className: 'p-10' })}>
          <FileText size={36} className='mx-auto text-slate-300 mb-3' />
          <p className='text-sm text-slate-500'>ยังไม่มี invoice</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {invoices.map((inv) => {
            const st = STATUS_META[inv.status?.trim()] ?? STATUS_META.DR;
            const StatusIcon = st.icon;
            const canAttach = inv.status?.trim() === 'ST';
            const isUp = uploading === inv.invoice_id;
            return (
              <div key={inv.invoice_id} className={factoryCardClass({ variant: 'section' })}>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                  <div className='min-w-0'>
                    <button
                      type='button'
                      onClick={() => openDetail(inv)}
                      className='text-sm font-bold text-brand-purple hover:underline'
                    >
                      {MONTHS_TH[inv.period_month]} {inv.period_year} — Invoice #{inv.invoice_id}
                    </button>
                    <p className='text-xs text-slate-500 mt-0.5'>
                      {inv.total_orders} orders • ยอดขาย{' '}
                      {formatCurrencyNoDecimals(inv.total_amount)}
                    </p>
                    <div className='flex items-center gap-4 mt-2'>
                      <div>
                        <p className='text-[10px] text-slate-400 uppercase'>Commission</p>
                        <p className='text-sm font-bold text-slate-900'>
                          {formatCurrencyNoDecimals(inv.commission_amount)}
                        </p>
                      </div>
                      <div>
                        <p className='text-[10px] text-slate-400 uppercase'>VAT</p>
                        <p className='text-sm font-semibold text-slate-700'>
                          {formatCurrencyNoDecimals(inv.vat_amount)}
                        </p>
                      </div>
                      <div>
                        <p className='text-[10px] text-brand-purple uppercase font-semibold'>
                          ยอดชำระ
                        </p>
                        <p className='text-sm font-bold text-brand-purple'>
                          {formatCurrencyNoDecimals(inv.grand_total)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className='flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end'>
                    <FactoryStatusBadge tone={st.tone} className='gap-1 py-1'>
                      <StatusIcon size={11} aria-hidden />
                      {st.label}
                    </FactoryStatusBadge>
                    {canAttach && (
                      <Button
                        variant='unstyled'
                        type='button'
                        disabled={isUp}
                        onClick={() => triggerUpload(inv.invoice_id)}
                        className={factoryButtonClass({ variant: 'primary', size: 'sm' })}
                      >
                        {isUp ? (
                          <Loader2 size={12} className='animate-spin' />
                        ) : (
                          <Upload size={12} />
                        )}
                        แนบสลีปค่า Comm
                      </Button>
                    )}
                    {inv.slip_url && (
                      <button
                        type='button'
                        onClick={() => setPreviewSlip(inv.slip_url!)}
                        className='flex items-center gap-1 text-xs font-semibold text-brand-purple hover:underline'
                      >
                        <Image size={11} />
                        ดูสลีปที่แนบ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detailInvoice && (
        <div
          className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'
          onClick={() => setDetailInvoice(null)}
        >
          <div
            className='max-h-[80vh] w-full max-w-lg overflow-auto rounded-lg border border-slate-200 bg-white'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between px-6 py-4 border-b border-slate-100'>
              <h3 className='text-base font-bold text-slate-900'>
                Invoice #{detailInvoice.invoice_id} — {MONTHS_TH[detailInvoice.period_month]}{' '}
                {detailInvoice.period_year}
              </h3>
              <button
                type='button'
                onClick={() => setDetailInvoice(null)}
                className={factoryButtonClass({ variant: 'ghostIcon', size: 'icon' })}
              >
                <X size={16} />
              </button>
            </div>
            <div className='px-6 py-4 space-y-3'>
              <div className='grid grid-cols-3 gap-2 text-center'>
                <div className='p-2 bg-[var(--brand-page)] rounded-lg'>
                  <p className='text-[10px] text-slate-400'>Commission</p>
                  <p className='font-bold'>
                    {formatCurrencyNoDecimals(detailInvoice.commission_amount)}
                  </p>
                </div>
                <div className='p-2 bg-[var(--brand-page)] rounded-lg'>
                  <p className='text-[10px] text-slate-400'>VAT</p>
                  <p className='font-bold'>{formatCurrencyNoDecimals(detailInvoice.vat_amount)}</p>
                </div>
                <div className='p-2 bg-brand-lavender rounded-lg'>
                  <p className='text-[10px] text-brand-purple'>ยอดชำระ</p>
                  <p className='font-bold text-brand-purple'>
                    {formatCurrencyNoDecimals(detailInvoice.grand_total)}
                  </p>
                </div>
              </div>
              <table className='w-full text-sm'>
                <thead className='border-b border-slate-100'>
                  <tr>
                    <th className='text-left text-xs font-semibold text-slate-500 pb-2'>Order</th>
                    <th className='text-right text-xs font-semibold text-slate-500 pb-2'>ยอด</th>
                    <th className='text-right text-xs font-semibold text-slate-500 pb-2'>Rate</th>
                    <th className='text-right text-xs font-semibold text-slate-500 pb-2'>Comm</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-50'>
                  {detailItems.map((item) => (
                    <tr key={item.item_id}>
                      <td className='py-2 text-xs font-mono text-slate-600'>#{item.order_id}</td>
                      <td className='py-2 text-right tabular-nums'>
                        {formatCurrencyNoDecimals(item.order_amount)}
                      </td>
                      <td className='py-2 text-right tabular-nums'>{item.commission_rate}%</td>
                      <td className='py-2 text-right tabular-nums font-semibold'>
                        {formatCurrencyNoDecimals(item.commission_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Slip preview */}
      {previewSlip && (
        <div
          className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4'
          onClick={() => setPreviewSlip(null)}
        >
          <div
            className='relative max-h-[90vh] max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type='button'
              onClick={() => setPreviewSlip(null)}
              className='absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-600 transition-colors hover:bg-white'
            >
              <X size={16} />
            </button>
            <img src={previewSlip} alt='สลีป' className='max-w-full max-h-[85vh] object-contain' />
          </div>
        </div>
      )}
    </div>
  );
}
