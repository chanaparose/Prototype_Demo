import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { disputesApi } from '@/services/api/ordersApi';
import { mediaApi } from '@/services/api/factoryApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatting/formatCurrency';

type Row = Record<string, unknown>;

const STATUS_META: Record<string, { label: string; variant: 'pending' | 'success' | 'error' | 'inactive' | 'info' }> = {
  OP: { label: 'รอตรวจสอบ', variant: 'pending' },
  RT: { label: 'รอลูกค้าส่งคืน', variant: 'info' },
  RC: { label: 'รอตรวจรับสินค้าคืน', variant: 'pending' },
  RF: { label: 'คืนเงินแล้ว', variant: 'success' },
  RJ: { label: 'ปฏิเสธ', variant: 'error' },
};

const ACTIONABLE = new Set(['OP', 'RT', 'RC']);

const CATEGORY_LABEL: Record<string, string> = {
  NR: 'ไม่ได้รับสินค้า',
  ND: 'สินค้าไม่ตรงปก',
  OT: 'อื่นๆ',
};

/** ข้อความตัวอย่างแจ้งลูกค้าตอนขอให้ส่งสินค้าคืน — admin กดปุ่ม "ใช้ข้อความตัวอย่าง" แล้วแก้ที่อยู่โรงงานเองได้ */
const RETURN_REASON_TEMPLATE =
  'กรุณาส่งคืนสินค้ามาที่โรงงานตามที่อยู่: [ระบุที่อยู่โรงงานที่นี่] พร้อมแนบหลักฐานการจัดส่ง (รูปใบเสร็จ/ใบปะหน้าพัสดุ) ' +
  'เราจะมีการโอนเงินคืนให้เมื่อทางลูกค้าจัดส่งสินค้าคืนเสร็จเรียบร้อยแล้วค่ะ';

export function DisputeQueueSection() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const raw = await disputesApi.adminList();
      const items = Array.isArray(raw.data) ? raw.data : Array.isArray(raw) ? (raw as Row[]) : [];
      setRows(items as Row[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดคำร้องไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className='space-y-4'>
      {error ? (
        <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 flex items-center gap-2'>
          <AlertTriangle size={14} />
          {error}
        </div>
      ) : null}

      <div className='overflow-x-auto rounded-xl border border-slate-200 bg-white'>
        <table className='w-full min-w-[860px] text-sm'>
          <thead>
            <tr className='border-b border-slate-100 text-left text-xs font-semibold text-slate-500'>
              <th className='px-4 py-3'>คำร้อง</th>
              <th className='px-4 py-3'>ลูกค้า / โรงงาน</th>
              <th className='px-4 py-3'>เหตุผล</th>
              <th className='px-4 py-3 text-right'>ยอดคืน</th>
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
                  ยังไม่มีคำร้อง
                </td>
              </tr>
            ) : (
              rows.map((d) => {
                const id = Number(d.dispute_id);
                const st = String(d.status ?? '').trim().toUpperCase();
                const meta = STATUS_META[st] ?? { label: st || '-', variant: 'inactive' as const };
                return (
                  <tr key={id} className='hover:bg-slate-50'>
                    <td className='px-4 py-3 font-mono text-xs font-semibold text-purple-600'>
                      #{id}
                      <p className='mt-0.5 font-sans text-[11px] font-normal text-slate-400'>
                        Order #{String(d.order_id ?? '')} · {String(d.created_at ?? '').slice(0, 10)}
                      </p>
                    </td>
                    <td className='px-4 py-3 text-slate-700'>
                      {String(d.customer_name ?? '-')}
                      <p className='text-[11px] text-slate-400'>{String(d.factory_name ?? '')}</p>
                    </td>
                    <td className='px-4 py-3 text-slate-600'>
                      {CATEGORY_LABEL[String(d.category ?? '')] ?? '-'}
                      <p className='max-w-[220px] truncate text-[11px] text-slate-400'>
                        {String(d.reason ?? '')}
                      </p>
                    </td>
                    <td className='px-4 py-3 text-right font-semibold tabular-nums text-slate-900'>
                      {formatCurrency(Number(d.order_amount ?? 0))}
                    </td>
                    <td className='px-4 py-3'>
                      <Badge variant={meta.variant} size='sm'>
                        {meta.label}
                      </Badge>
                    </td>
                    <td className='px-4 py-3'>
                      {ACTIONABLE.has(st) ? (
                        <Button
                          variant='unstyled'
                          type='button'
                          onClick={() => setTarget(d)}
                          className='rounded-lg border border-purple-200 px-2.5 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-50'
                        >
                          {st === 'RC' ? 'ตรวจรับ + คืนเงิน' : st === 'RT' ? 'ดูสถานะ' : 'ตรวจสอบ'}
                        </Button>
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

      {target != null ? (
        <ResolveModal
          dispute={target}
          onClose={() => setTarget(null)}
          onDone={async () => {
            setTarget(null);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}

function ResolveModal({
  dispute,
  onClose,
  onDone,
}: {
  dispute: Row;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const disputeId = Number(dispute.dispute_id);
  const status = String(dispute.status ?? '').trim().toUpperCase();
  const amount = Number(dispute.order_amount ?? 0);
  const evidence = Array.isArray(dispute.evidence_urls) ? (dispute.evidence_urls as string[]) : [];
  const returnEvidence = Array.isArray(dispute.return_evidence_urls)
    ? (dispute.return_evidence_urls as string[])
    : [];
  // เลือกวิธีดำเนินการ — มีผลเฉพาะตอน status=OP (RC ตรวจรับแล้วมีแค่คืนเงิน/ปฏิเสธ)
  const [actionMode, setActionMode] = useState<'return' | 'refund' | 'reject'>('return');
  const [resolution, setResolution] = useState('');
  const [slipUrl, setSlipUrl] = useState('');
  const [refundFull, setRefundFull] = useState(true);
  const [partialAmount, setPartialAmount] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const slipRef = useRef<HTMLInputElement>(null);

  // RC (ลูกค้าส่งคืนมาแล้ว) ไม่มีทางเลือก "ให้ส่งคืน" อีก — เริ่มที่โหมดคืนเงินเสมอ
  useEffect(() => {
    if (status === 'RC' && actionMode === 'return') setActionMode('refund');
  }, [status, actionMode]);

  const uploadSlip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (slipRef.current) slipRef.current.value = '';
    if (!f) return;
    setUploading(true);
    setError('');
    try {
      const r = await mediaApi.upload(f);
      setSlipUrl(String(r.url ?? ''));
    } catch {
      setError('อัปโหลดสลิปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const act = async (action: 'request_return' | 'refund' | 'reject') => {
    if (busy) return;
    let refundAmount = 0;
    if (action === 'refund') {
      if (!slipUrl) {
        setError('กรุณาแนบสลิปการโอนเงินคืนก่อน');
        return;
      }
      if (!refundFull) {
        refundAmount = Number(partialAmount);
        if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > amount) {
          setError(`ยอดคืนบางส่วนต้องมากกว่า 0 และไม่เกิน ${formatCurrency(amount)}`);
          return;
        }
      }
    }
    if (action === 'reject' && resolution.trim().length < 5) {
      setError('กรุณาระบุเหตุผลการปฏิเสธ (อย่างน้อย 5 ตัวอักษร)');
      return;
    }
    if (action === 'request_return' && resolution.trim().length < 10) {
      setError('กรุณาระบุคำแนะนำ/ที่อยู่สำหรับให้ลูกค้าส่งสินค้าคืน (อย่างน้อย 10 ตัวอักษร)');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await disputesApi.resolve(disputeId, {
        action,
        resolution: resolution.trim() || undefined,
        refund_amount: action === 'refund' && !refundFull ? refundAmount : undefined,
        refund_slip_url: action === 'refund' ? slipUrl : undefined,
      });
      await onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='fixed inset-0 z-[80] flex items-center justify-center p-4'>
      <button type='button' aria-label='ปิด' className='absolute inset-0 bg-black/50' onClick={onClose} />
      <div className='relative max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl'>
        <div className='flex items-center justify-between'>
          <h3 className='text-base font-bold text-slate-900'>
            ตรวจสอบคำร้อง #{disputeId} · Order #{String(dispute.order_id ?? '')}
          </h3>
          <Button variant='unstyled' type='button' onClick={onClose} className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-50'>
            <X size={18} />
          </Button>
        </div>

        <div className='rounded-xl bg-slate-50 p-3 text-sm'>
          <p className='text-slate-700'>
            <span className='text-slate-400'>ลูกค้า:</span> {String(dispute.customer_name ?? '-')}
          </p>
          <p className='text-slate-700'>
            <span className='text-slate-400'>เหตุผล:</span> {CATEGORY_LABEL[String(dispute.category ?? '')] ?? '-'}
          </p>
          <p className='mt-1 text-[13px] leading-relaxed text-slate-600'>{String(dispute.reason ?? '')}</p>
          <p className='mt-1 font-semibold text-slate-900'>ยอดคืนเต็มจำนวน: {formatCurrency(amount)}</p>
        </div>

        {/* บัญชีปลายทาง + ติดต่อกลับ — โอนเงินคืนตามนี้ */}
        <div className='rounded-xl border border-brand-purple/20 bg-brand-lavender/40 p-3 text-sm'>
          <p className='mb-1 text-xs font-semibold text-brand-violet-deep'>บัญชีรับเงินคืน</p>
          <p className='font-mono font-semibold text-slate-900'>{String(dispute.refund_account ?? '-')}</p>
          <p className='text-slate-600'>{String(dispute.refund_account_name ?? '-')}</p>
          <div className='mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-slate-500'>
            {dispute.contact_phone ? <span>โทร {String(dispute.contact_phone)}</span> : null}
            {dispute.contact_email ? <span>{String(dispute.contact_email)}</span> : null}
          </div>
        </div>

        {evidence.length > 0 ? (
          <div>
            <p className='mb-1.5 text-xs font-semibold text-slate-600'>หลักฐานจากลูกค้า</p>
            <div className='flex flex-wrap gap-2'>
              {evidence.map((u) => (
                <a key={u} href={u} target='_blank' rel='noreferrer' className='h-16 w-16 overflow-hidden rounded-lg border border-slate-200'>
                  <img src={u} alt='' className='h-full w-full object-cover' />
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {/* หลักฐานการส่งคืน (เมื่อลูกค้าส่งแล้ว — RC) */}
        {status === 'RC' ? (
          <div className='rounded-xl border border-indigo-200 bg-indigo-50/60 p-3'>
            <p className='mb-1 text-xs font-semibold text-indigo-700'>หลักฐานการส่งสินค้าคืน</p>
            {dispute.return_tracking_no ? (
              <p className='text-[12px] text-slate-600'>
                เลขพัสดุ <span className='font-mono font-semibold'>{String(dispute.return_tracking_no)}</span>
                {dispute.return_courier ? ` · ${String(dispute.return_courier)}` : ''}
              </p>
            ) : null}
            {dispute.return_note ? (
              <p className='text-[12px] text-slate-500'>หมายเหตุ: {String(dispute.return_note)}</p>
            ) : null}
            {returnEvidence.length > 0 ? (
              <div className='mt-1.5 flex flex-wrap gap-2'>
                {returnEvidence.map((u) => (
                  <a key={u} href={u} target='_blank' rel='noreferrer' className='h-14 w-14 overflow-hidden rounded-lg border border-indigo-200'>
                    <img src={u} alt='' className='h-full w-full object-cover' />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {status === 'RT' ? (
          <div className='rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700'>
            อนุมัติให้ส่งคืนแล้ว — กำลังรอลูกค้าส่งสินค้าคืนและแนบหลักฐานการจัดส่ง
            (ยังปฏิเสธคำร้องนี้ได้ถ้าจำเป็น)
          </div>
        ) : null}

        {/* เลือกวิธีดำเนินการ — เฉพาะ OP (คำร้องใหม่) เลือกได้ทั้ง 3 ทาง, RC (ตรวจรับแล้ว) เลือกได้แค่คืนเงิน/ปฏิเสธ */}
        {status === 'OP' || status === 'RC' ? (
          <div className='space-y-2'>
            <p className='text-xs font-semibold text-slate-600'>เลือกวิธีดำเนินการ</p>
            <div className='grid grid-cols-1 gap-1.5 sm:grid-cols-3'>
              {status === 'OP' ? (
                <button
                  type='button'
                  onClick={() => setActionMode('return')}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                    actionMode === 'return'
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  ให้ลูกค้าส่งคืนก่อน
                </button>
              ) : null}
              <button
                type='button'
                onClick={() => setActionMode('refund')}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  actionMode === 'refund'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                {status === 'RC' ? 'ตรวจรับ + คืนเงิน' : 'คืนเงินทันที'}
              </button>
              <button
                type='button'
                onClick={() => setActionMode('reject')}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  actionMode === 'reject'
                    ? 'border-red-300 bg-red-50 text-red-600'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                ปฏิเสธคำร้อง
              </button>
            </div>
          </div>
        ) : null}

        {/* Case 1: ให้ลูกค้าส่งคืนก่อน — ต้องกรอกคำแนะนำ/ที่อยู่ให้ลูกค้า */}
        {status === 'OP' && actionMode === 'return' ? (
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-semibold text-slate-600'>คำแนะนำสำหรับลูกค้า (บังคับ)</p>
              <button
                type='button'
                onClick={() => setResolution(RETURN_REASON_TEMPLATE)}
                className='text-[11px] font-medium text-brand-purple underline'
              >
                ใช้ข้อความตัวอย่าง
              </button>
            </div>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder='เช่น กรุณาส่งคืนสินค้ามาที่โรงงานตามที่อยู่ ... พร้อมแนบหลักฐานการจัดส่ง เราจะโอนเงินคืนให้เมื่อได้รับสินค้าคืนแล้ว'
              rows={4}
              className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none'
            />
            <p className='text-[11px] text-slate-400'>
              ข้อความนี้จะแสดงให้ลูกค้าเห็นทันที พร้อมฟอร์มให้แนบเลขพัสดุ/รูปหลักฐานการจัดส่งกลับมา
            </p>
          </div>
        ) : null}

        {/* Case 2: คืนเงิน (ทันทีจาก OP หรือหลังตรวจรับจาก RC) — เลือกยอดเต็ม/บางส่วน + แนบสลิป */}
        {(status === 'OP' && actionMode === 'refund') || (status === 'RC' && actionMode === 'refund') ? (
          <div className='space-y-3'>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder='หมายเหตุ (ถ้ามี)'
              rows={2}
              className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none'
            />
            <div className='space-y-2'>
              <p className='text-xs font-semibold text-slate-600'>ยอดที่จะคืน</p>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => setRefundFull(true)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                    refundFull ? 'border-brand-purple bg-brand-lavender/60 text-brand-violet-deep' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  เต็มจำนวน · {formatCurrency(amount)}
                </button>
                <button
                  type='button'
                  onClick={() => setRefundFull(false)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                    !refundFull ? 'border-brand-purple bg-brand-lavender/60 text-brand-violet-deep' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  บางส่วน (เช่น สินค้าชำรุดบางชิ้น)
                </button>
              </div>
              {!refundFull ? (
                <input
                  type='number'
                  min={1}
                  max={amount}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder={`มูลค่าที่คืน (บาท) ≤ ${amount}`}
                  className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30'
                />
              ) : null}
            </div>

            <div>
              <p className='mb-1.5 text-xs font-semibold text-slate-600'>สลิปการโอนเงินคืน (บังคับ)</p>
              {slipUrl ? (
                <div className='flex items-center gap-2'>
                  <a href={slipUrl} target='_blank' rel='noreferrer' className='text-xs text-purple-600 underline'>
                    ดูสลิปที่แนบ
                  </a>
                  <button type='button' onClick={() => setSlipUrl('')} className='text-xs text-slate-400 hover:text-red-500'>
                    ลบ
                  </button>
                </div>
              ) : (
                <Button
                  variant='unstyled'
                  type='button'
                  disabled={uploading}
                  onClick={() => slipRef.current?.click()}
                  className='rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50'
                >
                  {uploading ? 'กำลังอัปโหลด…' : 'แนบสลิปโอนคืน'}
                </Button>
              )}
              <input ref={slipRef} type='file' accept='image/*' className='hidden' onChange={uploadSlip} />
            </div>
          </div>
        ) : null}

        {/* Case 3: ปฏิเสธคำร้อง */}
        {(status === 'OP' || status === 'RT' || status === 'RC') && actionMode === 'reject' ? (
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder='กรุณาระบุเหตุผลการปฏิเสธ (อย่างน้อย 5 ตัวอักษร)'
            rows={2}
            className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none'
          />
        ) : null}

        {/* RT ยังเลือกได้แค่ปฏิเสธ (รอลูกค้าส่งคืนอยู่) — โชว์ปุ่มปฏิเสธตรงๆ ไม่ต้องมี segmented control */}
        {status === 'RT' && actionMode !== 'reject' ? (
          <Button
            variant='unstyled'
            type='button'
            onClick={() => setActionMode('reject')}
            className='w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50'
          >
            ปฏิเสธคำร้องนี้
          </Button>
        ) : null}

        {error ? <p className='text-xs text-red-600'>{error}</p> : null}

        <div className='flex gap-2 pt-1'>
          {status === 'RT' && actionMode === 'reject' ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setActionMode('return')}
              className='rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50'
            >
              ย้อนกลับ
            </Button>
          ) : null}
          {actionMode === 'return' && status === 'OP' ? (
            <Button
              variant='unstyled'
              type='button'
              disabled={busy}
              onClick={() => act('request_return')}
              className='flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50'
            >
              {busy ? 'กำลังดำเนินการ…' : 'ส่งคำขอให้ลูกค้าส่งคืน'}
            </Button>
          ) : null}
          {actionMode === 'refund' ? (
            <Button
              variant='unstyled'
              type='button'
              disabled={busy || !slipUrl}
              onClick={() => act('refund')}
              className='flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50'
            >
              {busy ? 'กำลังดำเนินการ…' : 'ยืนยันคืนเงิน'}
            </Button>
          ) : null}
          {actionMode === 'reject' ? (
            <Button
              variant='unstyled'
              type='button'
              disabled={busy}
              onClick={() => act('reject')}
              className='flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50'
            >
              {busy ? 'กำลังดำเนินการ…' : 'ยืนยันปฏิเสธคำร้อง'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
