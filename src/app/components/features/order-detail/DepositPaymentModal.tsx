import React from 'react';
import { Building2, Copy, Check, Upload, Loader2, ImageIcon, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { bankAccountApi } from '@/services/api/factoryApi';
import { slipApi } from '@/services/api/adminApi';
import { AppDialog } from '@/components/ui/app-dialog';
import { ModalFooter } from '@/shared/ui/modals/ModalFooter';
import {
  ACCENT_ORANGE_DEEP,
  BORDER_WARM,
  CTA_GRADIENT,
  DEEP_PURPLE,
  PEACH_MIST,
} from '@/components/features/rfq-and-orders/constants';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import type { IBankAccountResponse, ISlipInfoResponse } from '@/services/api/types/admin.types';

type Props = {
  open: boolean;
  onClose: () => void;
  orderId: string;
  factoryId: number;
  amount: number;
  onSuccess?: () => void | Promise<void>;
};

function useBankAccount(factoryId: number, open: boolean) {
  return useQuery({
    queryKey: ['factory-bank-account', factoryId],
    queryFn: () => bankAccountApi.getPublicDefault(factoryId),
    enabled: open && factoryId > 0,
    staleTime: 30_000,
  });
}

function useSlipInfo(orderId: string, open: boolean) {
  return useQuery<ISlipInfoResponse>({
    queryKey: ['slip-info', orderId],
    queryFn: () => slipApi.getInfo(Number(orderId)),
    enabled: open && !!orderId,
    staleTime: 5_000,
  });
}

export function DepositPaymentModal({
  open,
  onClose,
  orderId,
  factoryId,
  amount,
  onSuccess,
}: Props) {
  const bank = useBankAccount(factoryId, open);
  const slip = useSlipInfo(orderId, open);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [note, setNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setFile(null);
      setPreview(null);
      setNote('');
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'image/jpeg') {
      toast.error('รองรับเฉพาะไฟล์ .jpg/.jpeg เท่านั้น');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('ไฟล์ขนาดเกิน 5MB');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('คัดลอกแล้ว');
    setTimeout(() => setCopiedField(''), 1500);
  };

  const handleSubmit = async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (note.trim()) formData.append('note', note.trim());
      await slipApi.attach(Number(orderId), formData);
      toast.success('แนบสลิปสำเร็จ รอโรงงานตรวจสอบ');
      await onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'แนบสลิปไม่สำเร็จ';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const slipStatus = slip.data?.slip_status?.trim();
  const alreadySubmitted = slipStatus === 'ST';
  const alreadyApproved = slipStatus === 'AP';
  const canUpload = !alreadySubmitted && !alreadyApproved;

  const bankData = bank.data as IBankAccountResponse | undefined;

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title='ชำระเงิน — โอนผ่านธนาคาร'
      variant='sheet'
      bodyClassName='p-4 sm:p-5 pb-2'
      footer={
        canUpload ? (
          <ModalFooter
            layout='stack'
            primary={{
              label: `ส่งสลิปการโอนเงิน · ${formatCurrency(amount)}`,
              loadingLabel: 'กำลังส่งสลิป…',
              loading: submitting,
              disabled: !file || submitting,
              onClick: handleSubmit,
              style: { background: CTA_GRADIENT },
              fullWidth: true,
            }}
          />
        ) : undefined
      }
    >
      {/* ยอดที่ต้องชำระ */}
      <div
        className='rounded-2xl border p-4 mb-4'
        style={{ borderColor: BORDER_WARM, background: PEACH_MIST }}
      >
        <p className='text-[11px]' style={{ color: ACCENT_ORANGE_DEEP }}>
          ยอดที่ต้องชำระ
        </p>
        <p className='mt-0.5 text-2xl font-semibold tabular-nums' style={{ color: DEEP_PURPLE }}>
          {formatCurrency(amount)}
        </p>
      </div>

      {/* ข้อมูลบัญชีโรงงาน */}
      <div className='rounded-2xl border border-slate-200 bg-white p-4 mb-4 space-y-3'>
        <p className='text-xs font-semibold text-slate-500 flex items-center gap-1.5'>
          <Building2 size={13} />
          ข้อมูลบัญชีสำหรับโอนเงิน
        </p>

        {bank.isPending ? (
          <div className='flex items-center gap-2 py-3'>
            <Loader2 size={14} className='animate-spin text-slate-400' />
            <span className='text-xs text-slate-400'>กำลังโหลดข้อมูลบัญชี…</span>
          </div>
        ) : bank.isError || !bankData ? (
          <div className='flex items-center gap-2 py-3'>
            <AlertTriangle size={14} className='text-amber-500' />
            <span className='text-xs text-amber-600'>โรงงานยังไม่ตั้งค่าบัญชีธนาคาร</span>
          </div>
        ) : (
          <>
            <InfoRow label='ธนาคาร' value={bankData.bank_name} />
            <InfoRowCopy
              label='เลขบัญชี'
              value={bankData.account_number}
              mono
              copied={copiedField === 'num'}
              onCopy={() => handleCopy(bankData.account_number, 'num')}
            />
            <InfoRowCopy
              label='ชื่อบัญชี'
              value={bankData.account_name}
              copied={copiedField === 'name'}
              onCopy={() => handleCopy(bankData.account_name, 'name')}
            />
          </>
        )}
      </div>

      {/* Slip status display */}
      {alreadySubmitted && (
        <div className='rounded-2xl border border-blue-200 bg-blue-50 p-4 mb-4'>
          <p className='text-sm font-semibold text-blue-700'>สลิปถูกส่งแล้ว — รอโรงงานตรวจสอบ</p>
          {slip.data?.slip_url && (
            <img
              src={slip.data.slip_url}
              alt='สลิปที่แนบ'
              className='mt-2 rounded-lg max-h-40 object-contain border border-blue-100'
            />
          )}
        </div>
      )}

      {alreadyApproved && (
        <div className='rounded-2xl border border-emerald-200 bg-emerald-50 p-4 mb-4'>
          <p className='text-sm font-semibold text-emerald-700'>โรงงานยืนยันรับเงินแล้ว</p>
        </div>
      )}

      {slipStatus === 'RJ' && (
        <div className='rounded-2xl border border-red-200 bg-red-50 p-4 mb-4'>
          <p className='text-sm font-semibold text-red-700'>สลิปถูกปฏิเสธ — กรุณาแนบใหม่</p>
          {slip.data?.slip_note && (
            <p className='text-xs text-red-600 mt-1'>{slip.data.slip_note}</p>
          )}
        </div>
      )}

      {/* Upload slip (PE or RJ) */}
      {canUpload && (
        <div className='space-y-3'>
          <p className='text-xs font-semibold text-slate-600'>แนบสลิปการโอนเงิน</p>

          <input
            ref={fileRef}
            type='file'
            accept='image/jpeg,.jpg,.jpeg'
            onChange={handleFileChange}
            className='hidden'
          />

          {preview ? (
            <div className='relative'>
              <img
                src={preview}
                alt='สลิป preview'
                className='rounded-xl border border-slate-200 max-h-48 w-full object-contain bg-slate-50'
              />
              <button
                type='button'
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
                className='absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70'
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => fileRef.current?.click()}
              className='w-full flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-8 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-colors'
            >
              <Upload size={24} />
              <span className='text-xs font-medium'>กดเพื่อเลือกรูปสลิป</span>
              <span className='text-[10px] text-slate-300'>JPG, PNG ไม่เกิน 5MB</span>
            </Button>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='หมายเหตุ (ไม่บังคับ) เช่น โอนเมื่อ 15:30'
            className='w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none'
            rows={2}
          />
        </div>
      )}
    </AppDialog>
  );
}

/* ── Helper sub-components ──────────────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between'>
      <span className='text-xs text-slate-400'>{label}</span>
      <span className='text-sm font-semibold text-slate-800'>{value}</span>
    </div>
  );
}

function InfoRowCopy({
  label,
  value,
  mono,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className='flex items-center justify-between'>
      <span className='text-xs text-slate-400'>{label}</span>
      <span className='flex items-center gap-1.5'>
        <span
          className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono tracking-wide' : ''}`}
        >
          {value}
        </span>
        <button
          type='button'
          onClick={onCopy}
          className='p-1 rounded text-slate-300 hover:text-indigo-600 transition-colors'
          title='คัดลอก'
        >
          {copied ? <Check size={13} className='text-emerald-500' /> : <Copy size={13} />}
        </button>
      </span>
    </div>
  );
}
