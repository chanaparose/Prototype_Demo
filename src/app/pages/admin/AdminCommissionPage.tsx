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
} from 'lucide-react';
import { adminCommissionApi } from '@/services/api/adminApi';
import type {
  ICommissionInvoiceResponse,
  ICommissionInvoiceItemResponse,
  ICommissionSummaryResponse,
} from '@/services/api/types/admin.types';
import { Button } from '@/components/ui/button';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  DR: { label: 'แบบร่าง', cls: 'bg-slate-100 text-slate-600' },
  ST: { label: 'ส่งแล้ว', cls: 'bg-blue-100 text-blue-700' },
  PA: { label: 'โรงงานแนบสลีป', cls: 'bg-amber-100 text-amber-700' },
  VR: { label: 'ตรวจสอบแล้ว', cls: 'bg-emerald-100 text-emerald-700' },
};

const MONTHS_TH = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export function AdminCommissionPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<ICommissionSummaryResponse | null>(null);
  const [invoices, setInvoices] = useState<ICommissionInvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Detail modal
  const [detailInvoice, setDetailInvoice] = useState<ICommissionInvoiceResponse | null>(null);
  const [detailItems, setDetailItems] = useState<ICommissionInvoiceItemResponse[]>([]);
  const [previewSlip, setPreviewSlip] = useState<string | null>(null);

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
    <div className='space-y-6'>
      <div>
        <p className='text-xs text-slate-400 font-medium'>Admin / Commission</p>
        <h2 className='text-xl font-bold text-slate-900 mt-1'>สรุปค่า Commission</h2>
      </div>

      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 flex items-center gap-2'>
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* Month/Year selector + generate button */}
      <div className='flex flex-wrap items-center gap-3'>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className='border border-slate-200 rounded-lg px-3 py-2 text-sm'
        >
          {MONTHS_TH.map((m, i) => i > 0 && (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className='border border-slate-200 rounded-lg px-3 py-2 text-sm'
        >
          {[2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <Button
          variant='unstyled'
          type='button'
          onClick={handleGenerate}
          disabled={actionLoading === -1}
          className='flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60'
        >
          {actionLoading === -1 ? <Loader2 size={13} className='animate-spin' /> : <Receipt size={13} />}
          สร้าง Invoice เดือนนี้
        </Button>
      </div>

      {/* Summary cards */}
      {summary && !loading && (
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          {[
            { label: 'Invoice ทั้งหมด', value: summary.total_invoices, fmt: false },
            { label: 'Commission รวม', value: summary.total_commission, fmt: true },
            { label: 'VAT รวม', value: summary.total_vat, fmt: true },
            { label: 'Grand Total', value: summary.total_grand, fmt: true },
          ].map((item) => (
            <div key={item.label} className='bg-white rounded-xl border border-slate-200 shadow-sm p-4'>
              <p className='text-[10px] text-slate-400 uppercase font-semibold tracking-wide'>{item.label}</p>
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
            const count = key === 'DR' ? summary.draft_count
              : key === 'ST' ? summary.sent_count
              : key === 'PA' ? summary.paid_count
              : summary.verified_count;
            return (
              <span key={key} className={`px-3 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>
                {meta.label}: {count}
              </span>
            );
          })}
        </div>
      )}

      {/* Invoice table */}
      <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 border-b border-slate-200'>
              <tr>
                <th className='px-4 py-3 text-left text-xs font-semibold text-slate-500'>โรงงาน</th>
                <th className='px-4 py-3 text-right text-xs font-semibold text-slate-500'>Orders</th>
                <th className='px-4 py-3 text-right text-xs font-semibold text-slate-500'>ยอดขาย</th>
                <th className='px-4 py-3 text-right text-xs font-semibold text-slate-500'>Commission</th>
                <th className='px-4 py-3 text-right text-xs font-semibold text-slate-500'>Grand Total</th>
                <th className='px-4 py-3 text-center text-xs font-semibold text-slate-500'>สถานะ</th>
                <th className='px-4 py-3 text-center text-xs font-semibold text-slate-500'>ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-50'>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className='px-4 py-3'>
                        <div className='h-4 bg-slate-100 rounded animate-pulse' />
                      </td>
                    ))}
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-4 py-10 text-center text-sm text-slate-400'>
                    ยังไม่มี invoice ในเดือน {MONTHS_TH[month]} {year}
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const st = INVOICE_STATUS[inv.status?.trim()] ?? INVOICE_STATUS.DR;
                  const isActioning = actionLoading === inv.invoice_id;
                  return (
                    <tr key={inv.invoice_id} className='hover:bg-slate-50 transition-colors'>
                      <td className='px-4 py-3'>
                        <button
                          type='button'
                          onClick={() => openDetail(inv)}
                          className='text-indigo-600 font-semibold hover:underline text-left'
                        >
                          {inv.factory_name || `Factory #${inv.factory_id}`}
                        </button>
                      </td>
                      <td className='px-4 py-3 text-right tabular-nums'>{inv.total_orders}</td>
                      <td className='px-4 py-3 text-right tabular-nums'>{formatCurrencyNoDecimals(inv.total_amount)}</td>
                      <td className='px-4 py-3 text-right tabular-nums font-semibold'>{formatCurrencyNoDecimals(inv.commission_amount)}</td>
                      <td className='px-4 py-3 text-right tabular-nums font-bold'>{formatCurrencyNoDecimals(inv.grand_total)}</td>
                      <td className='px-4 py-3 text-center'>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <div className='flex items-center justify-center gap-1'>
                          {inv.status?.trim() === 'DR' && (
                            <button
                              type='button'
                              disabled={isActioning}
                              onClick={() => handleSend(inv.invoice_id)}
                              className='flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors disabled:opacity-50'
                            >
                              {isActioning ? <Loader2 size={11} className='animate-spin' /> : <Send size={11} />}
                              ส่ง
                            </button>
                          )}
                          {inv.status?.trim() === 'PA' && (
                            <>
                              {inv.slip_url && (
                                <button
                                  type='button'
                                  onClick={() => setPreviewSlip(inv.slip_url!)}
                                  className='flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-slate-50 text-slate-600 rounded hover:bg-slate-100 transition-colors'
                                >
                                  <Image size={11} />
                                  ดูสลีป
                                </button>
                              )}
                              <button
                                type='button'
                                disabled={isActioning}
                                onClick={() => handleVerify(inv.invoice_id, 'approve')}
                                className='flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition-colors disabled:opacity-50'
                              >
                                {isActioning ? <Loader2 size={11} className='animate-spin' /> : <CheckCircle size={11} />}
                                อนุมัติ
                              </button>
                              <button
                                type='button'
                                disabled={isActioning}
                                onClick={() => handleVerify(inv.invoice_id, 'reject')}
                                className='flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors disabled:opacity-50'
                              >
                                <XCircle size={11} />
                              </button>
                            </>
                          )}
                          {inv.status?.trim() === 'VR' && (
                            <span className='text-xs text-emerald-600 font-semibold'>✓</span>
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

      {/* Invoice detail modal */}
      {detailInvoice && (
        <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4' onClick={() => setDetailInvoice(null)}>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-auto' onClick={(e) => e.stopPropagation()}>
            <div className='flex items-center justify-between px-6 py-4 border-b border-slate-100'>
              <div>
                <h3 className='text-base font-bold text-slate-900'>
                  Invoice #{detailInvoice.invoice_id} — {detailInvoice.factory_name}
                </h3>
                <p className='text-xs text-slate-500'>
                  {MONTHS_TH[detailInvoice.period_month]} {detailInvoice.period_year}
                </p>
              </div>
              <button type='button' onClick={() => setDetailInvoice(null)} className='p-1.5 rounded-full hover:bg-slate-100'>
                <X size={16} />
              </button>
            </div>
            <div className='px-6 py-4 space-y-4'>
              <div className='grid grid-cols-3 gap-3'>
                <div className='text-center p-3 bg-slate-50 rounded-lg'>
                  <p className='text-[10px] text-slate-400 uppercase'>Orders</p>
                  <p className='text-lg font-bold'>{detailInvoice.total_orders}</p>
                </div>
                <div className='text-center p-3 bg-slate-50 rounded-lg'>
                  <p className='text-[10px] text-slate-400 uppercase'>Commission</p>
                  <p className='text-lg font-bold'>{formatCurrencyNoDecimals(detailInvoice.commission_amount)}</p>
                </div>
                <div className='text-center p-3 bg-indigo-50 rounded-lg'>
                  <p className='text-[10px] text-indigo-500 uppercase'>Grand Total</p>
                  <p className='text-lg font-bold text-indigo-700'>{formatCurrencyNoDecimals(detailInvoice.grand_total)}</p>
                </div>
              </div>

              <table className='w-full text-sm'>
                <thead className='border-b border-slate-100'>
                  <tr>
                    <th className='text-left text-xs font-semibold text-slate-500 pb-2'>Order</th>
                    <th className='text-right text-xs font-semibold text-slate-500 pb-2'>ยอดสั่งซื้อ</th>
                    <th className='text-right text-xs font-semibold text-slate-500 pb-2'>Rate</th>
                    <th className='text-right text-xs font-semibold text-slate-500 pb-2'>Commission</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-50'>
                  {detailItems.map((item) => (
                    <tr key={item.item_id}>
                      <td className='py-2 text-indigo-600 font-mono text-xs'>#{item.order_id}</td>
                      <td className='py-2 text-right tabular-nums'>{formatCurrencyNoDecimals(item.order_amount)}</td>
                      <td className='py-2 text-right tabular-nums'>{item.commission_rate}%</td>
                      <td className='py-2 text-right tabular-nums font-semibold'>{formatCurrencyNoDecimals(item.commission_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Slip preview modal */}
      {previewSlip && (
        <div className='fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4' onClick={() => setPreviewSlip(null)}>
          <div className='relative max-w-3xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl' onClick={(e) => e.stopPropagation()}>
            <button
              type='button'
              onClick={() => setPreviewSlip(null)}
              className='absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70'
            >
              <X size={16} />
            </button>
            <img src={previewSlip} alt='สลีปค่า commission' className='max-w-full max-h-[85vh] object-contain' />
          </div>
        </div>
      )}
    </div>
  );
}
