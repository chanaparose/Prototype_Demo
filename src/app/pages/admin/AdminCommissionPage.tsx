import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
  AlertTriangle,
  Image,
  X,
  Receipt,
  RefreshCw,
  Clock,
  MailCheck,
} from 'lucide-react';
import { adminCommissionApi } from '@/services/api/adminApi';
import type {
  ICommissionInvoiceResponse,
  ICommissionInvoiceItemResponse,
  ICommissionSummaryResponse,
} from '@/services/api/types/admin.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';

type InvoiceStatusMeta = {
  label: string;
  variant: NonNullable<React.ComponentProps<typeof Badge>['variant']>;
};

const INVOICE_STATUS: Record<string, InvoiceStatusMeta> = {
  DR: { label: 'รอส่ง', variant: 'inactive' },
  ST: { label: 'รอโรงงานชำระ', variant: 'info' },
  PA: { label: 'รอ Admin ยืนยันสลีป', variant: 'pending' },
  VR: { label: 'ชำระครบแล้ว', variant: 'success' },
};

const MONTHS_TH = [
  '',
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

function formatEmailSentAt(raw?: string | null): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][d.getMonth() + 1]} ${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// ─── Detail + Verify Modal ────────────────────────────────────────────────────
type DetailModalProps = {
  invoice: ICommissionInvoiceResponse;
  items: ICommissionInvoiceItemResponse[];
  actionLoading: boolean;
  onVerify: (action: 'approve' | 'reject') => void;
  onClose: () => void;
};

function DetailModal({ invoice, items, actionLoading, onVerify, onClose }: DetailModalProps) {
  const [showSlip, setShowSlip] = useState(false);
  const st = INVOICE_STATUS[invoice.status?.trim()] ?? INVOICE_STATUS.DR;

  return (
    <div
      className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-slate-100'>
          <div>
            <h3 className='text-base font-bold text-slate-900'>
              Invoice #{invoice.invoice_id} — {invoice.factory_name}
            </h3>
            <p className='text-xs text-slate-500'>
              {MONTHS_TH[invoice.period_month]} {invoice.period_year}
              {' · '}
              <Badge variant={st.variant} size='sm'>
                {st.label}
              </Badge>
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='ปิดหน้าต่างรายละเอียด invoice'
            title='ปิดหน้าต่างรายละเอียด invoice'
            className='p-1.5 rounded-full hover:bg-slate-100'
          >
            <X size={16} />
          </button>
        </div>

        <div className='px-6 py-4 space-y-4'>
          {/* Summary cards */}
          <div className='grid grid-cols-3 gap-3'>
            <div className='text-center p-3 bg-slate-50 rounded-lg'>
              <p className='text-[10px] text-slate-400 uppercase'>Orders</p>
              <p className='text-lg font-bold'>{invoice.total_orders}</p>
            </div>
            <div className='text-center p-3 bg-slate-50 rounded-lg'>
              <p className='text-[10px] text-slate-400 uppercase'>Commission</p>
              <p className='text-lg font-bold'>
                {formatCurrencyNoDecimals(invoice.commission_amount)}
              </p>
            </div>
            <div className='text-center p-3 bg-indigo-50 rounded-lg'>
              <p className='text-[10px] text-indigo-500 uppercase'>Grand Total</p>
              <p className='text-lg font-bold text-indigo-700'>
                {formatCurrencyNoDecimals(invoice.grand_total)}
              </p>
            </div>
          </div>

          {/* Order breakdown */}
          <table className='w-full text-sm'>
            <thead className='border-b border-slate-100'>
              <tr>
                <th className='text-left text-xs font-semibold text-slate-500 pb-2'>Order</th>
                <th className='text-right text-xs font-semibold text-slate-500 pb-2'>
                  ยอดสั่งซื้อ
                </th>
                <th className='text-right text-xs font-semibold text-slate-500 pb-2'>Rate</th>
                <th className='text-right text-xs font-semibold text-slate-500 pb-2'>Commission</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-50'>
              {items.map((item) => (
                <tr key={item.item_id}>
                  <td className='py-2 text-indigo-600 font-mono text-xs'>#{item.order_id}</td>
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

          {/* Slip + Verify section — only when PA */}
          {invoice.status?.trim() === 'PA' && (
            <div className='rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3'>
              <p className='text-sm font-bold text-amber-800'>โรงงานแนบสลีปแล้ว — รอการยืนยัน</p>

              {invoice.slip_url && (
                <div>
                  {showSlip ? (
                    <div className='relative'>
                      <img
                        src={invoice.slip_url}
                        alt='สลีปค่า commission'
                        className='rounded-lg max-h-64 object-contain border border-amber-200'
                      />
                      <button
                        type='button'
                        onClick={() => setShowSlip(false)}
                        aria-label='ปิดรูปสลีป'
                        title='ปิดรูปสลีป'
                        className='absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60'
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type='button'
                      onClick={() => setShowSlip(true)}
                      className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors'
                    >
                      <Image size={13} />
                      ดูสลีปที่โรงงานแนบ
                    </button>
                  )}
                </div>
              )}

              <div className='flex gap-2 pt-1'>
                <button
                  type='button'
                  disabled={actionLoading}
                  onClick={() => onVerify('approve')}
                  className='flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50'
                >
                  {actionLoading ? (
                    <Loader2 size={13} className='animate-spin' />
                  ) : (
                    <CheckCircle size={13} />
                  )}
                  ยืนยัน — โรงงานโอนเงินมาแล้ว
                </button>
                <button
                  type='button'
                  disabled={actionLoading}
                  onClick={() => onVerify('reject')}
                  className='flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50'
                >
                  <XCircle size={13} />
                  ปฏิเสธ (ให้แนบสลีปใหม่)
                </button>
              </div>
            </div>
          )}

          {/* email sent info */}
          {invoice.email_sent_at && (
            <p className='text-xs text-slate-400 flex items-center gap-1'>
              <MailCheck size={12} />
              ส่ง email แจ้งโรงงานเมื่อ {formatEmailSentAt(invoice.email_sent_at)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function AdminCommissionPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<ICommissionSummaryResponse | null>(null);
  const [invoices, setInvoices] = useState<ICommissionInvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [detailInvoice, setDetailInvoice] = useState<ICommissionInvoiceResponse | null>(null);
  const [detailItems, setDetailItems] = useState<ICommissionInvoiceItemResponse[]>([]);
  const isSelectedCurrentPeriod = month === now.getMonth() + 1 && year === now.getFullYear();
  const showManualGenerate = !loading && (invoices.length === 0 || isSelectedCurrentPeriod);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, listRes] = await Promise.all([
        adminCommissionApi.summary({ month, year }),
        adminCommissionApi.list({ month, year }),
      ]);
      setSummary(summaryRes);
      setInvoices(listRes.invoices ?? []);
    } catch {
      setError('โหลดข้อมูล commission ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [month, year]);

  const handleGenerate = async () => {
    setError('');
    setActionLoading(-1);
    try {
      const res = await adminCommissionApi.generate(month, year);
      if (res.created > 0) {
        await loadData();
      } else {
        setError('ไม่มี order ที่ต้องสร้าง invoice ในเดือนนี้');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'สร้าง invoice ไม่สำเร็จ');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSend = async (invoiceId: number) => {
    setActionLoading(invoiceId);
    try {
      await adminCommissionApi.send(invoiceId);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ส่ง invoice ไม่สำเร็จ');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResend = async (invoiceId: number) => {
    setActionLoading(invoiceId);
    try {
      await adminCommissionApi.resend(invoiceId);
      await loadData();
      // refresh detail modal if open
      if (detailInvoice?.invoice_id === invoiceId) {
        const res = await adminCommissionApi.get(invoiceId);
        setDetailInvoice(res.invoice);
        setDetailItems(res.items ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ส่ง email ซ้ำไม่สำเร็จ');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (invoiceId: number, action: 'approve' | 'reject') => {
    setActionLoading(invoiceId);
    try {
      await adminCommissionApi.verify(invoiceId, action);
      await loadData();
      setDetailInvoice(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setActionLoading(null);
    }
  };

  const openDetail = async (inv: ICommissionInvoiceResponse) => {
    try {
      const res = await adminCommissionApi.get(inv.invoice_id);
      setDetailInvoice(res.invoice);
      setDetailItems(res.items ?? []);
    } catch {
      setError('โหลดรายละเอียด invoice ไม่สำเร็จ');
    }
  };

  return (
    <div className='space-y-6 lg:space-y-8'>
      <div>
        <p className='text-xs text-slate-400 font-medium'>Admin / Commission</p>
        <h2 className='text-xl font-bold text-slate-900 mt-1'>สรุปค่า Commission</h2>
        <p className='text-xs text-slate-400 mt-0.5 flex items-center gap-1'>
          <Clock size={11} />
          ระบบสร้าง Invoice และส่ง Email โรงงานอัตโนมัติวันที่ 1 ของทุกเดือน
        </p>
      </div>

      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 flex items-center gap-2'>
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* Month/Year selector */}
      <div className='flex flex-wrap items-center gap-3'>
        <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
          <SelectTrigger aria-label='เลือกเดือน' className='w-40 rounded-lg'>
            <SelectValue placeholder='เลือกเดือน' />
          </SelectTrigger>
          <SelectContent>
            {MONTHS_TH.map((m, i) =>
              i > 0 ? (
                <SelectItem key={i} value={String(i)}>
                  {m}
                </SelectItem>
              ) : null,
            )}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
          <SelectTrigger aria-label='เลือกปี' className='w-28 rounded-lg'>
            <SelectValue placeholder='เลือกปี' />
          </SelectTrigger>
          <SelectContent>
            {[2025, 2026, 2027].map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showManualGenerate && (
          <div className='flex items-center gap-2'>
            <Button
              variant='unstyled'
              type='button'
              onClick={handleGenerate}
              disabled={actionLoading === -1}
              className='flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60'
            >
              {actionLoading === -1 ? (
                <Loader2 size={13} className='animate-spin' />
              ) : (
                <Receipt size={13} />
              )}
              สร้าง Invoice (Manual)
            </Button>
            <span className='text-xs text-slate-400'>
              {invoices.length === 0
                ? 'CRON ยังไม่ได้รันสำหรับเดือนนี้'
                : 'สร้าง invoice เพิ่มสำหรับรายการที่ยังตกหล่น'}
            </span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      {summary && !loading && (
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4'>
          {[
            { label: 'Invoice ทั้งหมด', value: summary.total_invoices, fmt: false },
            { label: 'Commission รวม', value: summary.total_commission, fmt: true },
            { label: 'VAT รวม', value: summary.total_vat, fmt: true },
            { label: 'Grand Total', value: summary.total_grand, fmt: true },
          ].map((item) => (
            <div key={item.label} className='bg-white rounded-xl border border-slate-200 p-4'>
              <p className='text-[10px] text-slate-400 uppercase font-semibold tracking-wide'>
                {item.label}
              </p>
              <p className='text-lg font-bold text-slate-900 mt-1'>
                {item.fmt ? formatCurrencyNoDecimals(item.value) : item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Status breakdown */}
      {summary && !loading && (
        <div className='flex flex-wrap gap-2'>
          {Object.entries(INVOICE_STATUS).map(([key, meta]) => {
            const count =
              key === 'DR'
                ? summary.draft_count
                : key === 'ST'
                  ? summary.sent_count
                  : key === 'PA'
                    ? summary.paid_count
                    : summary.verified_count;
            return (
              <Badge key={key} variant={meta.variant} size='md'>
                {meta.label}: {count}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Invoice table */}
      <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 border-b border-slate-200'>
              <tr>
                <th className='px-4 py-3 text-left text-xs font-semibold text-slate-500'>โรงงาน</th>
                <th className='px-4 py-3 text-right text-xs font-semibold text-slate-500'>
                  Orders
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-slate-500'>
                  ยอดขาย
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-slate-500'>
                  Commission
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-slate-500'>
                  Grand Total
                </th>
                <th className='px-4 py-3 text-center text-xs font-semibold text-slate-500'>
                  สถานะ
                </th>
                <th className='px-4 py-3 text-center text-xs font-semibold text-slate-500'>
                  Email
                </th>
                <th className='px-4 py-3 text-center text-xs font-semibold text-slate-500'>
                  ดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-50'>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className='px-4 py-3'>
                        <div className='h-4 bg-slate-100 rounded animate-pulse' />
                      </td>
                    ))}
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className='px-4 py-10 text-center text-sm text-slate-400'>
                    ยังไม่มี invoice ในเดือน {MONTHS_TH[month]} {year}
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const st = INVOICE_STATUS[inv.status?.trim()] ?? INVOICE_STATUS.DR;
                  const isActioning = actionLoading === inv.invoice_id;
                  const status = inv.status?.trim();
                  const emailSentLabel = formatEmailSentAt(inv.email_sent_at);

                  return (
                    <tr key={inv.invoice_id} className='hover:bg-slate-50 transition-colors'>
                      <td className='px-4 py-3'>
                        <button
                          type='button'
                          onClick={() => openDetail(inv)}
                          className='text-purple-600 font-semibold hover:underline text-left'
                        >
                          {inv.factory_name || `Factory #${inv.factory_id}`}
                        </button>
                      </td>
                      <td className='px-4 py-3 text-right tabular-nums'>{inv.total_orders}</td>
                      <td className='px-4 py-3 text-left tabular-nums'>
                        {formatCurrencyNoDecimals(inv.total_amount)}
                      </td>
                      <td className='px-4 py-3 text-left tabular-nums font-semibold'>
                        {formatCurrencyNoDecimals(inv.commission_amount)}
                      </td>
                      <td className='px-4 py-3 text-left tabular-nums font-bold'>
                        {formatCurrencyNoDecimals(inv.grand_total)}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <Badge variant={st.variant} size='sm'>
                          {st.label}
                        </Badge>
                      </td>
                      {/* Email column */}
                      <td className='px-4 py-3 text-center'>
                        {emailSentLabel ? (
                          <span className='text-[11px] text-slate-400 flex items-center justify-center gap-1'>
                            <MailCheck size={11} className='text-emerald-500' />
                            {emailSentLabel}
                          </span>
                        ) : (
                          <span className='text-[11px] text-slate-300'>—</span>
                        )}
                      </td>
                      {/* Action column */}
                      <td className='px-4 py-3 text-center'>
                        <div className='flex items-center justify-center gap-1'>
                          {status === 'DR' && (
                            <span className='text-xs text-slate-400'>รอ CRON ส่ง</span>
                          )}
                          {(status === 'ST' || status === 'PA') && (
                            <button
                              type='button'
                              disabled={isActioning}
                              onClick={() => handleResend(inv.invoice_id)}
                              className='flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100 transition-colors disabled:opacity-50'
                              title='ส่ง email ซ้ำให้โรงงาน'
                            >
                              {isActioning ? (
                                <Loader2 size={11} className='animate-spin' />
                              ) : (
                                <RefreshCw size={11} />
                              )}
                              Resend
                            </button>
                          )}
                          {status === 'PA' && (
                            <button
                              type='button'
                              onClick={() => openDetail(inv)}
                              className='flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100 transition-colors'
                            >
                              <FileText size={11} />
                              ดูสลีป + ยืนยัน
                            </button>
                          )}
                          {status === 'VR' && (
                            <span className='text-xs text-emerald-600 font-semibold'>
                              ✓ ปิดแล้ว
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail + Verify Modal */}
      {detailInvoice && (
        <DetailModal
          invoice={detailInvoice}
          items={detailItems}
          actionLoading={actionLoading === detailInvoice.invoice_id}
          onVerify={(action) => handleVerify(detailInvoice.invoice_id, action)}
          onClose={() => setDetailInvoice(null)}
        />
      )}
    </div>
  );
}
