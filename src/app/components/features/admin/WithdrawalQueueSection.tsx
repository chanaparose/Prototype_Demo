import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { adminWithdrawalApi } from '@/services/api/adminApi';
import { mediaApi } from '@/services/api/factoryApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';

type InvoiceStatusMeta = {
  label: string;
  variant: NonNullable<React.ComponentProps<typeof Badge>['variant']>;
};

type WithdrawalRow = Record<string, unknown>;

const WITHDRAWAL_STATUS: Record<string, InvoiceStatusMeta> = {
  PE: { label: 'รอตรวจสอบ', variant: 'pending' },
  AP: { label: 'อนุมัติแล้ว — รอโอน', variant: 'info' },
  CP: { label: 'โอนแล้ว', variant: 'success' },
  RJ: { label: 'ปฏิเสธ', variant: 'error' },
};

export function WithdrawalQueueSection() {
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState<number | null>(null);
  const [completeTarget, setCompleteTarget] = useState<WithdrawalRow | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const raw = (await adminWithdrawalApi.list()) as Record<string, unknown>;
      const items = Array.isArray(raw.items)
        ? raw.items
        : Array.isArray(raw.data)
          ? raw.data
          : Array.isArray(raw)
            ? (raw as unknown as WithdrawalRow[])
            : [];
      setRows(items as WithdrawalRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดคำขอถอนเงินไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const patch = async (
    requestId: number,
    data: { status: 'AP' | 'RJ' | 'CP'; comments?: string; slip_url?: string },
  ) => {
    setActingId(requestId);
    setError('');
    try {
      await adminWithdrawalApi.patch(requestId, data);
      await load();
      setCompleteTarget(null);
      setSlipFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setActingId(null);
    }
  };

  const handleComplete = async () => {
    if (!completeTarget || !slipFile || uploading) return;
    const requestId = Number(completeTarget.request_id);
    setUploading(true);
    setError('');
    try {
      const up = await mediaApi.upload(slipFile);
      const url = String(up?.url ?? '').trim();
      if (!url) throw new Error('อัปโหลดสลิปไม่สำเร็จ');
      await patch(requestId, { status: 'CP', slip_url: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปโหลดสลิปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='space-y-4'>
      {error ? (
        <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 flex items-center gap-2'>
          <AlertTriangle size={14} />
          {error}
        </div>
      ) : null}

      <div className='overflow-x-auto rounded-xl border border-slate-200 bg-white'>
        <table className='w-full min-w-[820px] text-sm'>
          <thead>
            <tr className='border-b border-slate-100 text-left text-xs font-semibold text-slate-500'>
              <th className='px-4 py-3'>คำขอ</th>
              <th className='px-4 py-3'>โรงงาน</th>
              <th className='px-4 py-3'>บัญชีปลายทาง</th>
              <th className='px-4 py-3 text-right'>จำนวน</th>
              <th className='px-4 py-3'>สถานะ</th>
              <th className='px-4 py-3'>จัดการ</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {loading ? (
              <tr>
                <td colSpan={6} className='px-4 py-10 text-center text-slate-400'>
                  <Loader2 size={16} className='mx-auto animate-spin' />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className='px-4 py-10 text-center text-sm text-slate-400'>
                  ยังไม่มีคำขอถอนเงิน
                </td>
              </tr>
            ) : (
              rows.map((w) => {
                const requestId = Number(w.request_id);
                const st = String(w.status ?? '').trim().toUpperCase();
                const meta = WITHDRAWAL_STATUS[st] ?? { label: st || '-', variant: 'inactive' as const };
                const slipUrl = String(w.slip_url ?? '');
                const acting = actingId === requestId;
                return (
                  <tr key={requestId} className='hover:bg-slate-50'>
                    <td className='px-4 py-3 font-mono text-xs font-semibold text-purple-600'>
                      #{requestId}
                      <p className='mt-0.5 font-sans text-[11px] font-normal text-slate-400'>
                        {String(w.created_at ?? '').slice(0, 10)}
                      </p>
                    </td>
                    <td className='px-4 py-3 text-slate-700'>{String(w.factory_name ?? '-')}</td>
                    <td className='px-4 py-3 text-slate-600'>
                      {String(w.bank_name ?? '')} · {String(w.bank_account_no ?? '')}
                      <p className='text-[11px] text-slate-400'>{String(w.account_name ?? '')}</p>
                    </td>
                    <td className='px-4 py-3 text-right font-semibold tabular-nums text-slate-900'>
                      {formatCurrencyNoDecimals(Number(w.amount ?? 0))}
                    </td>
                    <td className='px-4 py-3'>
                      <Badge variant={meta.variant} size='sm'>{meta.label}</Badge>
                      {slipUrl ? (
                        <a
                          href={slipUrl}
                          target='_blank'
                          rel='noreferrer'
                          className='ml-2 text-[11px] text-purple-600 underline'
                        >
                          สลิป
                        </a>
                      ) : null}
                    </td>
                    <td className='px-4 py-3'>
                      {st === 'PE' || st === 'AP' ? (
                        <div className='flex flex-wrap gap-1.5'>
                          {st === 'PE' ? (
                            <Button
                              variant='unstyled'
                              type='button'
                              disabled={acting}
                              onClick={() => void patch(requestId, { status: 'AP' })}
                              className='rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50'
                            >
                              อนุมัติ
                            </Button>
                          ) : null}
                          <Button
                            variant='unstyled'
                            type='button'
                            disabled={acting}
                            onClick={() => {
                              setCompleteTarget(w);
                              setSlipFile(null);
                            }}
                            className='rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700'
                          >
                            โอนแล้ว + แนบสลิป
                          </Button>
                          <Button
                            variant='unstyled'
                            type='button'
                            disabled={acting}
                            onClick={() => {
                              const reason = window.prompt('เหตุผลที่ปฏิเสธคำขอถอนเงิน?');
                              if (reason == null) return;
                              void patch(requestId, { status: 'RJ', comments: reason.trim() || undefined });
                            }}
                            className='rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50'
                          >
                            ปฏิเสธ
                          </Button>
                        </div>
                      ) : (
                        <span className='text-xs text-slate-300'>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {completeTarget != null ? (
        <div className='fixed inset-0 z-[80] flex items-center justify-center p-4'>
          <button
            type='button'
            aria-label='ปิด'
            className='absolute inset-0 bg-black/50'
            onClick={() => setCompleteTarget(null)}
          />
          <div className='relative w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-2xl'>
            <div className='flex items-center justify-between'>
              <h3 className='text-base font-bold text-slate-900'>
                ยืนยันโอนเงิน #{String(completeTarget.request_id)}
              </h3>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setCompleteTarget(null)}
                className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-50'
              >
                <X size={18} />
              </Button>
            </div>
            <p className='text-sm text-slate-600'>
              {String(completeTarget.bank_name ?? '')} · {String(completeTarget.bank_account_no ?? '')}
              <br />
              จำนวน{' '}
              <span className='font-bold text-slate-900'>
                {formatCurrencyNoDecimals(Number(completeTarget.amount ?? 0))}
              </span>
            </p>
            <div>
              <p className='mb-1.5 text-xs font-semibold text-slate-600'>แนบสลิปโอนเงิน (บังคับ)</p>
              <input
                type='file'
                accept='image/*'
                onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
                className='w-full text-xs text-slate-600'
              />
            </div>
            <div className='flex gap-2'>
              <Button
                variant='unstyled'
                type='button'
                disabled={uploading}
                onClick={() => setCompleteTarget(null)}
                className='flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50'
              >
                ยกเลิก
              </Button>
              <Button
                variant='unstyled'
                type='button'
                disabled={!slipFile || uploading}
                onClick={() => void handleComplete()}
                className='flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50'
              >
                {uploading ? 'กำลังอัปโหลด…' : 'ยืนยันโอนแล้ว'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
