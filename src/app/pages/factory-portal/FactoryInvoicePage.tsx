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
  Printer,
  ChevronRight,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { factoryInvoiceApi } from '@/services/api/factoryApi';
import type {
  ICommissionInvoiceResponse,
  ICommissionInvoiceItemResponse,
  ICurrentPeriodSummary,
} from '@/services/api/types/admin.types';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import {
  FactoryStatusBadge,
  type FactoryStatusTone,
} from '@/pages/factory-portal/components/FactoryStatusBadge';
import { factoryButtonClass, factoryCardClass } from '@/pages/factory-portal/factoryUi';

const STATUS_META: Record<string, { label: string; tone: FactoryStatusTone; icon: React.ElementType }> = {
  DR: { label: 'แบบร่าง', tone: 'neutral', icon: Clock },
  ST: { label: 'รอชำระ', tone: 'warning', icon: Clock },
  PA: { label: 'แนบสลีปแล้ว — รอตรวจสอบ', tone: 'info', icon: FileText },
  VR: { label: 'ตรวจสอบแล้ว', tone: 'success', icon: CheckCircle },
};

const MONTHS_TH = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const MONTHS_SHORT = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// ─── Invoice PDF Preview ───────────────────────────────────────────────────────
type InvoicePreviewProps = {
  invoice: ICommissionInvoiceResponse;
  items: ICommissionInvoiceItemResponse[];
  onClose: () => void;
};

function InvoicePreview({ invoice, items, onClose }: InvoicePreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Invoice #${invoice.invoice_id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Sarabun', sans-serif; font-size: 13px; color: #1e293b; background: #fff; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #7c3aed; }
          .brand { display: flex; flex-direction: column; gap: 2px; }
          .brand-name { font-size: 22px; font-weight: 700; color: #7c3aed; }
          .brand-sub { font-size: 11px; color: #64748b; }
          .inv-meta { text-align: right; }
          .inv-num { font-size: 18px; font-weight: 700; color: #1e293b; }
          .inv-date { font-size: 11px; color: #64748b; margin-top: 4px; }
          .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
          .party-box { background: #f8fafc; border-radius: 8px; padding: 14px; }
          .party-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
          .party-name { font-size: 14px; font-weight: 700; color: #1e293b; }
          .party-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
          .period-banner { background: linear-gradient(135deg, #7c3aed10, #7c3aed05); border: 1px solid #7c3aed30; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
          .period-label { font-size: 11px; color: #7c3aed; font-weight: 600; }
          .period-val { font-size: 14px; font-weight: 700; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f1f5f9; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; padding: 8px 10px; text-align: left; }
          th:last-child, td:last-child { text-align: right; }
          td { padding: 9px 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
          tr:last-child td { border-bottom: none; }
          .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
          .totals-box { min-width: 240px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
          .total-row.grand { border-top: 2px solid #7c3aed; margin-top: 6px; padding-top: 10px; font-size: 15px; font-weight: 700; color: #7c3aed; }
          .footer { text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; background: #fef9c3; color: #854d0e; }
        </style>
      </head>
      <body>${el.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const created = new Date(invoice.created_at);
  const createdStr = `${created.getDate()} ${MONTHS_SHORT[created.getMonth() + 1]} ${created.getFullYear() + 543}`;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'
      onClick={onClose}
    >
      <div
        className='relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className='flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3'>
          <p className='text-sm font-bold text-slate-900'>
            Invoice #{invoice.invoice_id} — {MONTHS_TH[invoice.period_month]} {invoice.period_year}
          </p>
          <div className='flex items-center gap-2'>
            <Button
              variant='unstyled'
              type='button'
              onClick={handlePrint}
              className={factoryButtonClass({ variant: 'primary', size: 'sm' })}
            >
              <Printer size={13} />
              พิมพ์ / บันทึก PDF
            </Button>
            <button type='button' onClick={onClose} className={factoryButtonClass({ variant: 'ghostIcon', size: 'icon' })}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable invoice body */}
        <div className='flex-1 overflow-auto bg-slate-50 p-4'>
          <div
            ref={printRef}
            className='mx-auto w-full max-w-[640px] rounded-lg bg-white p-8 shadow-sm'
            style={{ fontFamily: "'Sarabun', sans-serif" }}
          >
            {/* Header */}
            <div className='mb-8 flex items-start justify-between border-b-2 border-brand-purple pb-5'>
              <div>
                <p className='text-2xl font-bold text-brand-purple'>Tryly</p>
                <p className='text-[11px] text-slate-400'>แพลตฟอร์มจับคู่โรงงาน</p>
              </div>
              <div className='text-right'>
                <p className='text-lg font-bold text-slate-800'>INVOICE</p>
                <p className='mt-1 text-xs text-slate-500'>เลขที่ {invoice.invoice_id.toString().padStart(6, '0')}</p>
                <p className='text-xs text-slate-400'>ออกเมื่อ {createdStr}</p>
              </div>
            </div>

            {/* Parties */}
            <div className='mb-6 grid grid-cols-2 gap-4'>
              <div className='rounded-lg bg-slate-50 p-3.5'>
                <p className='mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400'>ผู้ออกใบแจ้งหนี้</p>
                <p className='text-sm font-bold text-slate-800'>Tryly Co., Ltd.</p>
                <p className='text-xs text-slate-500'>platform@tryly.co.th</p>
              </div>
              <div className='rounded-lg bg-slate-50 p-3.5'>
                <p className='mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400'>เรียกเก็บจาก</p>
                <p className='text-sm font-bold text-slate-800'>{invoice.factory_name}</p>
                <p className='text-xs text-slate-500'>Factory ID: {invoice.factory_id}</p>
              </div>
            </div>

            {/* Period banner */}
            <div className='mb-6 flex items-center justify-between rounded-lg border border-brand-purple/20 bg-brand-lavender/30 px-4 py-3'>
              <div>
                <p className='text-[10px] font-bold uppercase tracking-wide text-brand-purple'>รอบบิล</p>
                <p className='text-sm font-bold text-slate-800'>
                  {MONTHS_TH[invoice.period_month]} {invoice.period_year}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-[10px] text-slate-400'>จำนวน order</p>
                <p className='text-sm font-bold text-slate-800'>{invoice.total_orders} รายการ</p>
              </div>
              <div className='text-right'>
                <p className='text-[10px] text-slate-400'>ยอดขายรวม</p>
                <p className='text-sm font-bold text-slate-800'>{formatCurrencyNoDecimals(invoice.total_amount)}</p>
              </div>
            </div>

            {/* Items table */}
            <table className='mb-5 w-full text-sm'>
              <thead>
                <tr className='bg-slate-100'>
                  <th className='rounded-tl-md px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500'>
                    Order
                  </th>
                  <th className='px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500'>
                    ยอดสั่งซื้อ
                  </th>
                  <th className='px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500'>
                    อัตรา Comm
                  </th>
                  <th className='rounded-tr-md px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500'>
                    ค่า Commission
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-50'>
                {items.map((item) => (
                  <tr key={item.item_id}>
                    <td className='px-3 py-2.5 font-mono text-xs text-slate-600'>#{item.order_id}</td>
                    <td className='px-3 py-2.5 text-right tabular-nums'>{formatCurrency(item.order_amount)}</td>
                    <td className='px-3 py-2.5 text-right tabular-nums text-slate-500'>{item.commission_rate}%</td>
                    <td className='px-3 py-2.5 text-right font-semibold tabular-nums'>{formatCurrency(item.commission_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className='flex justify-end'>
              <div className='min-w-[220px] space-y-1.5'>
                <div className='flex justify-between text-sm text-slate-600'>
                  <span>ค่า Commission</span>
                  <span className='tabular-nums'>{formatCurrency(invoice.commission_amount)}</span>
                </div>
                <div className='flex justify-between text-sm text-slate-600'>
                  <span>VAT 7%</span>
                  <span className='tabular-nums'>{formatCurrency(invoice.vat_amount)}</span>
                </div>
                <div className='mt-2 flex justify-between border-t-2 border-brand-purple pt-2.5 text-base font-bold text-brand-purple'>
                  <span>ยอดชำระรวม</span>
                  <span className='tabular-nums'>{formatCurrency(invoice.grand_total)}</span>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <p className='mt-8 border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400'>
              กรุณาชำระภายในกำหนดและแนบสลีปการโอนผ่านระบบ Tryly • invoice นี้ออกโดยระบบอัตโนมัติ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Current Period Statement ─────────────────────────────────────────────────
function CurrentPeriodSection({ data }: { data: ICurrentPeriodSummary }) {
  const [expanded, setExpanded] = useState(true);
  const monthName = MONTHS_TH[data.month] ?? '';

  if (data.total_orders === 0) return null;

  return (
    <div className='rounded-xl border border-brand-purple/25 bg-gradient-to-br from-brand-lavender/40 to-white'>
      {/* Collapse toggle */}
      <button
        type='button'
        onClick={() => setExpanded((v) => !v)}
        className='flex w-full items-center justify-between px-5 py-4 text-left'
      >
        <div className='flex items-center gap-3'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-brand-purple/10'>
            <TrendingUp size={15} className='text-brand-purple' />
          </div>
          <div>
            <p className='text-sm font-bold text-slate-800'>
              รอบบิลปัจจุบัน — {monthName} {data.year}
            </p>
            <p className='text-[11px] text-slate-500'>
              {data.total_orders} orders · ยังไม่ออก invoice (สิ้นเดือนระบบจะสรุปอัตโนมัติ)
            </p>
          </div>
        </div>
        <ChevronRight
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {expanded && (
        <div className='border-t border-brand-purple/10 px-5 pb-5 pt-4'>
          <div className='flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8'>

            {/* ── Order statement table ─────────────────────────── */}
            <div className='min-w-0 flex-1 overflow-hidden rounded-lg border border-slate-100 bg-white'>
              {/* Table header */}
              <div className='grid grid-cols-[minmax(60px,1fr)_80px_110px_48px_100px_110px] border-b border-slate-100 bg-slate-50 px-4 py-2'>
                {(['Order', 'วันที่', 'ยอดสั่งซื้อ', 'Rate', 'Commission', 'รวม (incl. VAT)'] as const).map((h, i) => (
                  <p key={h} className={`text-[10px] font-bold uppercase tracking-wide text-slate-400 ${i > 1 ? 'text-right' : ''}`}>{h}</p>
                ))}
              </div>

              {/* Rows */}
              {data.orders.map((o, idx) => {
                const d = new Date(o.approved_at);
                const dateStr = `${d.getDate()} ${MONTHS_SHORT[d.getMonth() + 1]}`;
                return (
                  <div
                    key={o.order_id}
                    className={`grid grid-cols-[minmax(60px,1fr)_80px_110px_48px_100px_110px] items-center px-4 py-3 ${idx < data.orders.length - 1 ? 'border-b border-slate-50' : ''}`}
                  >
                    <div className='flex items-center gap-1.5'>
                      <ArrowRight size={11} className='text-slate-300' />
                      <a href={`/factory/orders/${o.order_id}`} className='font-mono text-xs font-semibold text-brand-purple hover:underline'>
                        #{o.order_id}
                      </a>
                    </div>
                    <p className='text-right text-xs text-slate-500'>{dateStr}</p>
                    <p className='text-right tabular-nums text-xs text-slate-700'>{formatCurrency(o.order_amount)}</p>
                    <p className='text-right tabular-nums text-xs text-slate-400'>{o.commission_rate}%</p>
                    <p className='text-right tabular-nums text-xs text-slate-700'>{formatCurrency(o.commission_amount)}</p>
                    <p className='text-right tabular-nums text-xs font-semibold text-slate-900'>{formatCurrency(o.line_total)}</p>
                  </div>
                );
              })}

              {/* Footer total row */}
              <div className='grid grid-cols-[minmax(60px,1fr)_80px_110px_48px_100px_110px] items-center border-t border-slate-200 bg-slate-50 px-4 py-2.5'>
                <p className='text-xs font-bold text-slate-600'>รวม {data.total_orders} orders</p>
                <p />
                <p className='text-right tabular-nums text-xs font-bold text-slate-900'>{formatCurrency(data.total_amount)}</p>
                <p />
                <p className='text-right tabular-nums text-xs font-bold text-slate-900'>{formatCurrency(data.commission_amount)}</p>
                <p className='text-right tabular-nums text-xs font-bold text-brand-purple'>{formatCurrency(data.grand_total)}</p>
              </div>
            </div>

            {/* ── Breakdown summary (right) ─────────────────────── */}
            <div className='shrink-0 rounded-lg border border-brand-purple/20 bg-white p-4 lg:min-w-[220px]'>
              <p className='mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400'>สรุปค่าบริการเดือนนี้</p>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm text-slate-600'>
                  <span>ยอดขายรวม</span>
                  <span className='tabular-nums font-medium'>{formatCurrency(data.total_amount)}</span>
                </div>
                <div className='flex justify-between text-sm text-slate-600'>
                  <span>ค่า Commission</span>
                  <span className='tabular-nums font-medium'>{formatCurrency(data.commission_amount)}</span>
                </div>
                <div className='flex justify-between text-sm text-slate-500'>
                  <span>VAT 7% (จาก commission)</span>
                  <span className='tabular-nums'>{formatCurrency(data.vat_amount)}</span>
                </div>
                <div className='flex justify-between border-t border-brand-purple/30 pt-2.5 text-base font-bold text-brand-purple'>
                  <span>ยอดที่ต้องชำระ</span>
                  <span className='tabular-nums'>{formatCurrency(data.grand_total)}</span>
                </div>
              </div>
              <p className='mt-3 text-[10px] leading-relaxed text-slate-400'>
                Invoice จะออกอัตโนมัติวันที่ 1 ของเดือนถัดไป
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function FactoryInvoicePage() {
  const [invoices, setInvoices] = useState<ICommissionInvoiceResponse[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<ICurrentPeriodSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);

  const [preview, setPreview] = useState<{
    invoice: ICommissionInvoiceResponse;
    items: ICommissionInvoiceItemResponse[];
  } | null>(null);
  const [previewSlip, setPreviewSlip] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const [invoiceRes, periodRes] = await Promise.all([
        factoryInvoiceApi.list(),
        factoryInvoiceApi.getCurrentPeriod(),
      ]);
      setInvoices(invoiceRes.invoices ?? []);
      setCurrentPeriod(periodRes);
    } catch {
      setError('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadInvoices(); }, []);

  const openPreview = async (inv: ICommissionInvoiceResponse) => {
    setLoadingDetail(inv.invoice_id);
    try {
      const res = await factoryInvoiceApi.get(inv.invoice_id);
      setPreview({ invoice: res.invoice, items: res.items ?? [] });
    } catch {
      toast.error('โหลดรายละเอียดไม่สำเร็จ');
    } finally {
      setLoadingDetail(null);
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
      toast.success('แนบสลีปสำเร็จ');
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
        title='สรุปค่าบริการ'
        subtitle='Factory / Invoice ค่า Commission รายเดือน'
        icon={FileText}
        variant='minimal'
      />

      {error && (
        <div className='flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700'>
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      <input ref={fileRef} type='file' accept='image/jpeg,.jpg,.jpeg' onChange={handleFileChange} className='hidden' />

      {/* Current period live statement */}
      {!loading && currentPeriod && <CurrentPeriodSection data={currentPeriod} />}

      {/* Past invoices */}
      {invoices.length > 0 && (
        <div className='flex items-center gap-2 pt-2'>
          <div className='h-px flex-1 bg-slate-100' />
          <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-400'>Invoice ที่ออกแล้ว</p>
          <div className='h-px flex-1 bg-slate-100' />
        </div>
      )}

      {loading ? (
        <div className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className={factoryCardClass({ variant: 'section' })}>
              <div className='mb-2 h-5 w-40 animate-pulse rounded bg-slate-100' />
              <div className='h-4 w-56 animate-pulse rounded bg-slate-100' />
            </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className={factoryCardClass({ variant: 'empty', className: 'p-10' })}>
          <FileText size={36} className='mx-auto mb-3 text-slate-300' />
          <p className='text-sm text-slate-500'>ยังไม่มี invoice — ระบบจะสร้างสรุปให้อัตโนมัติสิ้นเดือน</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {invoices.map((inv) => {
            const st = STATUS_META[inv.status?.trim()] ?? STATUS_META.DR;
            const StatusIcon = st.icon;
            const canAttach = inv.status?.trim() === 'ST';
            const isUp = uploading === inv.invoice_id;
            const isLoadingThis = loadingDetail === inv.invoice_id;

            return (
              <div key={inv.invoice_id} className={factoryCardClass({ variant: 'section' })}>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                  <div className='min-w-0'>
                    {/* Period + Invoice number */}
                    <div className='mb-0.5 flex items-center gap-2'>
                      <p className='text-sm font-bold text-slate-800'>
                        {MONTHS_SHORT[inv.period_month]} {inv.period_year}
                      </p>
                      <span className='text-[11px] font-mono text-slate-400'>#{inv.invoice_id.toString().padStart(6, '0')}</span>
                    </div>
                    <p className='text-xs text-slate-500'>
                      {inv.total_orders} orders · ยอดขาย {formatCurrencyNoDecimals(inv.total_amount)}
                    </p>

                    {/* Amount breakdown */}
                    <div className='mt-3 flex items-center gap-5'>
                      <div>
                        <p className='text-[10px] uppercase tracking-wide text-slate-400'>Commission</p>
                        <p className='text-sm font-bold text-slate-900'>{formatCurrencyNoDecimals(inv.commission_amount)}</p>
                      </div>
                      <div>
                        <p className='text-[10px] uppercase tracking-wide text-slate-400'>VAT 7%</p>
                        <p className='text-sm font-semibold text-slate-700'>{formatCurrencyNoDecimals(inv.vat_amount)}</p>
                      </div>
                      <div>
                        <p className='text-[10px] font-semibold uppercase tracking-wide text-brand-purple'>ยอดชำระ</p>
                        <p className='text-base font-bold text-brand-purple'>{formatCurrencyNoDecimals(inv.grand_total)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end'>
                    <FactoryStatusBadge tone={st.tone} className='gap-1 py-1'>
                      <StatusIcon size={11} aria-hidden />
                      {st.label}
                    </FactoryStatusBadge>

                    {/* View PDF invoice */}
                    <button
                      type='button'
                      disabled={isLoadingThis}
                      onClick={() => openPreview(inv)}
                      className='flex items-center gap-1 text-xs font-semibold text-brand-purple hover:underline disabled:opacity-50'
                    >
                      {isLoadingThis ? <Loader2 size={11} className='animate-spin' /> : <FileText size={11} />}
                      ดู Invoice PDF
                      <ChevronRight size={11} />
                    </button>

                    {canAttach && (
                      <Button
                        variant='unstyled'
                        type='button'
                        disabled={isUp}
                        onClick={() => triggerUpload(inv.invoice_id)}
                        className={factoryButtonClass({ variant: 'primary', size: 'sm' })}
                      >
                        {isUp ? <Loader2 size={12} className='animate-spin' /> : <Upload size={12} />}
                        แนบสลีปค่า Comm
                      </Button>
                    )}

                    {inv.slip_url && (
                      <button
                        type='button'
                        onClick={() => setPreviewSlip(inv.slip_url!)}
                        className='flex items-center gap-1 text-xs font-semibold text-slate-500 hover:underline'
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

      {/* Invoice PDF Preview modal */}
      {preview && (
        <InvoicePreview
          invoice={preview.invoice}
          items={preview.items}
          onClose={() => setPreview(null)}
        />
      )}

      {/* Slip image preview */}
      {previewSlip && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'
          onClick={() => setPreviewSlip(null)}
        >
          <div
            className='relative max-h-[90vh] max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type='button'
              onClick={() => setPreviewSlip(null)}
              className='absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-600 hover:bg-white'
            >
              <X size={16} />
            </button>
            <img src={previewSlip} alt='สลีป' className='max-h-[85vh] max-w-full object-contain' />
          </div>
        </div>
      )}
    </div>
  );
}
