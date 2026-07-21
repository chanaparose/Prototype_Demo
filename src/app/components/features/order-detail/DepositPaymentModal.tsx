import React from 'react';
import {
  Building2,
  Copy,
  Check,
  Upload,
  Loader2,
  AlertTriangle,
  X,
  CheckCircle2,
  XCircle,
  Clock3,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { bankAccountApi } from '@/services/api/factoryApi';
import { slipApi } from '@/services/api/adminApi';
import { usePaymentConfig } from '@/hooks/usePaymentConfig';
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
import { PromptPayQR } from '@/components/features/order-detail/PromptPayQR';
import type { IBankAccountResponse, ISlipInfoResponse } from '@/services/api/types/admin.types';

type Props = {
  open: boolean;
  onClose: () => void;
  orderId: string;
  factoryId: number;
  amount: number;
  onSuccess?: () => void | Promise<void>;
};

type PaymentStep = 'upload' | 'checking' | 'result';

function useBankAccount(factoryId: number, open: boolean, enabled: boolean) {
  return useQuery({
    queryKey: ['factory-bank-account', factoryId],
    queryFn: () => bankAccountApi.getPublicDefault(factoryId),
    enabled: enabled && open && factoryId > 0,
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
  const { isEscrow, trylyBank } = usePaymentConfig();
  // escrow mode: ลูกค้าโอนเข้าบัญชี Tryly — ไม่ต้องโหลดบัญชีโรงงาน
  const bank = useBankAccount(factoryId, open, !isEscrow);
  const slip = useSlipInfo(orderId, open);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [note, setNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState('');
  const [step, setStep] = React.useState<PaymentStep>('upload');
  /** ผลตรวจสลิปอัตโนมัติจากการ attach ล่าสุด (step 3 — result screen) */
  const [verifyResult, setVerifyResult] = React.useState<{
    outcome: 'approved' | 'rejected' | 'pending';
    reasons: string[];
  } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      setFile(null);
      setPreview(null);
      setNote('');
      setVerifyResult(null);
      setStep('upload');
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('รองรับเฉพาะไฟล์รูปภาพเท่านั้น');
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
    setVerifyResult(null);
    setStep('checking');
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (note.trim()) formData.append('note', note.trim());
      const res = await slipApi.attach(Number(orderId), formData);
      await slip.refetch();
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';

      if (!isEscrow) {
        setVerifyResult({
          outcome: 'pending',
          reasons: ['ส่งสลิปเรียบร้อยแล้ว รอโรงงานตรวจสอบ'],
        });
        setStep('result');
        toast.success('แนบสลิปสำเร็จ รอโรงงานตรวจสอบ');
        await onSuccess?.();
        return;
      }

      // escrow: แสดงผลตรวจอัตโนมัติ (step 3) — ไม่ปิด modal ให้ผู้ใช้เห็นผลก่อน
      const outcome = res.verify_outcome ?? 'pending';
      const reasons = res.verify_reasons ?? [];
      setVerifyResult({ outcome, reasons });
      setStep('result');
      if (outcome === 'approved') {
        toast.success('ตรวจสอบสลิปสำเร็จ — ยืนยันการชำระเงินแล้ว');
        await onSuccess?.();
      } else if (outcome === 'rejected') {
        toast.error('ตรวจสอบสลิปไม่ผ่าน — กรุณาแนบสลิปใหม่');
      } else {
        toast.success('ส่งสลิปแล้ว — รอเจ้าหน้าที่ตรวจสอบ');
        await onSuccess?.();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'แนบสลิปไม่สำเร็จ';
      setVerifyResult({ outcome: 'rejected', reasons: [msg] });
      setStep('result');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetToUploadStep = () => {
    setStep('upload');
    setVerifyResult(null);
    setSubmitting(false);
    setFile(null);
    setPreview(null);
    setNote('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const slipStatus = slip.data?.slip_status?.trim();
  const alreadySubmitted = slipStatus === 'ST';
  const alreadyApproved = slipStatus === 'AP';
  const canUpload = !alreadySubmitted && !alreadyApproved;

  const bankData = bank.data as IBankAccountResponse | undefined;
  const showUploadStep = step === 'upload';
  const showCheckingStep = step === 'checking';
  const showResultStep = step === 'result' && verifyResult;
  const resultIsRejected = verifyResult?.outcome === 'rejected';
  const compactStep = step !== 'upload';

  React.useLayoutEffect(() => {
    if (!compactStep) return;
    // Sheet stays bottom-anchored; reset scroll so step content + footer are both in view.
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step, compactStep]);

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title='ชำระเงิน — โอนผ่านธนาคาร'
      variant='sheet'
      bodyRef={bodyRef}
      bodyClassName='p-4 pb-2 sm:p-5 sm:pb-2'
      footer={
        showUploadStep && canUpload ? (
          <ModalFooter
            layout='stack'
            primary={{
              label: `ส่งสลิปการโอนเงิน · ${formatCurrency(amount)}`,
              loadingLabel: 'กำลังส่งสลิป…',
              loading: false,
              disabled: !file || submitting,
              onClick: handleSubmit,
              style: { background: CTA_GRADIENT },
              fullWidth: true,
            }}
          />
        ) : showCheckingStep ? (
          <div className='w-full py-0.5' aria-hidden>
            <div className='h-12' />
          </div>
        ) : showResultStep ? (
          <ModalFooter
            layout={resultIsRejected ? 'stack' : 'grid'}
            primary={{
              label: resultIsRejected ? 'กลับไปแนบสลิปใหม่' : 'รับทราบ',
              onClick: resultIsRejected ? resetToUploadStep : onClose,
              style: resultIsRejected ? { background: CTA_GRADIENT } : undefined,
              accent: resultIsRejected ? undefined : 'purple',
              fullWidth: true,
            }}
            secondary={
              resultIsRejected
                ? {
                    label: 'ปิด',
                    onClick: onClose,
                  }
                : undefined
            }
          />
        ) : undefined
      }
    >
      <div className='min-h-0'>
        <StepIndicator step={step} />

        {showCheckingStep ? (
          <div className='flex min-h-[18rem] items-center justify-center py-2'>
            <CheckingSlipStep />
          </div>
        ) : showResultStep ? (
          <div className='flex min-h-[18rem] items-center justify-center py-2'>
            <SlipResultStep
              result={verifyResult}
              isEscrow={isEscrow}
              onRetry={resetToUploadStep}
            />
          </div>
        ) : (
          <>
            {/* ข้อมูลบัญชีสำหรับโอนเงิน — escrow: บัญชี Tryly / direct-pay: บัญชีโรงงาน */}
            <div className='rounded-2xl border border-slate-200 bg-white p-4 mb-4 space-y-3'>
              <p className='text-xs font-semibold text-slate-500 flex items-center gap-1.5'>
                <Building2 size={13} />
                ข้อมูลบัญชีสำหรับโอนเงิน
              </p>

              {isEscrow ? (
                !trylyBank.accountNumber ? (
                  <div className='flex items-center gap-2 py-3'>
                    <AlertTriangle size={14} className='text-amber-500' />
                    <span className='text-xs text-amber-600'>
                      ระบบยังไม่ตั้งค่าบัญชีรับชำระ — กรุณาติดต่อเจ้าหน้าที่
                    </span>
                  </div>
                ) : (
                  <>
                    {trylyBank.promptPay ? (
                      <>
                        <PromptPayQR
                          promptPayId={trylyBank.promptPay}
                          amount={amount}
                          accountName={trylyBank.accountName}
                        />
                        <details className='group'>
                          <summary className='cursor-pointer list-none text-[11px] font-medium text-slate-400 hover:text-slate-600 [&::-webkit-details-marker]:hidden'>
                            หรือโอนด้วยเลขบัญชีธนาคาร
                          </summary>
                          <div className='mt-3 space-y-3'>
                            <InfoRow label='ธนาคาร' value={trylyBank.bankName} />
                            <InfoRowCopy
                              label='เลขบัญชี'
                              value={trylyBank.accountNumber}
                              mono
                              copied={copiedField === 'num'}
                              onCopy={() => handleCopy(trylyBank.accountNumber, 'num')}
                            />
                            <InfoRowCopy
                              label='ชื่อบัญชี'
                              value={trylyBank.accountName}
                              copied={copiedField === 'name'}
                              onCopy={() => handleCopy(trylyBank.accountName, 'name')}
                            />
                          </div>
                        </details>
                      </>
                    ) : (
                      <>
                        <InfoRow label='ธนาคาร' value={trylyBank.bankName} />
                        <InfoRowCopy
                          label='เลขบัญชี'
                          value={trylyBank.accountNumber}
                          mono
                          copied={copiedField === 'num'}
                          onCopy={() => handleCopy(trylyBank.accountNumber, 'num')}
                        />
                        <InfoRowCopy
                          label='ชื่อบัญชี'
                          value={trylyBank.accountName}
                          copied={copiedField === 'name'}
                          onCopy={() => handleCopy(trylyBank.accountName, 'name')}
                        />
                      </>
                    )}
                    <p className='text-[11px] text-slate-400 leading-relaxed pt-1'>
                      ชำระผ่านบัญชีกลาง Tryly —
                      ระบบจะถือเงินไว้ให้และโอนให้โรงงานเมื่อคุณยืนยันรับสินค้า
                    </p>
                  </>
                )
              ) : bank.isPending ? (
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
            {alreadySubmitted && !verifyResult && (
              <div className='rounded-2xl border border-blue-200 bg-blue-50 p-4 mb-4'>
                <p className='text-sm font-semibold text-blue-700'>
                  {isEscrow
                    ? 'สลิปถูกส่งแล้ว — รอเจ้าหน้าที่ Tryly ตรวจสอบ'
                    : 'สลิปถูกส่งแล้ว — รอโรงงานตรวจสอบ'}
                </p>
                {slip.data?.slip_url && (
                  <img
                    src={slip.data.slip_url}
                    alt='สลิปที่แนบ'
                    className='mt-2 rounded-lg max-h-40 object-contain border border-blue-100'
                  />
                )}
              </div>
            )}

            {alreadyApproved && !verifyResult && (
              <div className='rounded-2xl border border-emerald-200 bg-emerald-50 p-4 mb-4'>
                <p className='text-sm font-semibold text-emerald-700'>
                  {isEscrow
                    ? 'ยืนยันการชำระเงินแล้ว — ระบบถือเงินไว้จนกว่าจะรับสินค้า'
                    : 'โรงงานยืนยันรับเงินแล้ว'}
                </p>
              </div>
            )}

            {slipStatus === 'RJ' && !verifyResult && (
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
                  accept='image/*'
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
          </>
        )}
      </div>
    </AppDialog>
  );
}

/* ── Helper sub-components ──────────────────────────────────────────── */

function StepIndicator({ step }: { step: PaymentStep }) {
  const steps: Array<{ id: PaymentStep; label: string }> = [
    { id: 'upload', label: 'แนบสลิป' },
    { id: 'checking', label: 'ตรวจสอบ' },
    { id: 'result', label: 'ผลลัพธ์' },
  ];
  const activeIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className='mb-4 rounded-2xl border border-slate-200 bg-white px-3 py-3'>
      <div className='grid grid-cols-3 gap-2'>
        {steps.map((item, index) => {
          const isActive = item.id === step;
          const isDone = index < activeIndex;
          return (
            <div key={item.id} className='flex items-center gap-2 min-w-0'>
              <span
                className={[
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400',
                ].join(' ')}
              >
                {isDone ? <Check size={13} /> : index + 1}
              </span>
              <span
                className={[
                  'truncate text-[11px] font-semibold',
                  isActive ? 'text-indigo-700' : isDone ? 'text-emerald-700' : 'text-slate-400',
                ].join(' ')}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckingSlipStep() {
  return (
    <div className='rounded-3xl border border-indigo-100 bg-gradient-to-b from-indigo-50 to-white p-6 text-center shadow-sm'>
      <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-indigo-100'>
        <Loader2 size={38} className='animate-spin text-slate-500' />
      </div>
      <p className='mt-5 text-base font-bold text-slate-900'>กำลังตรวจสอบสลิป</p>
      <p className='mx-auto mt-2 max-w-[280px] text-xs leading-relaxed text-slate-500'>
        ระบบกำลังตรวจยอดเงิน บัญชีผู้รับ เวลาโอน และความถูกต้องของสลิป กรุณารอสักครู่
      </p>
      <div className='mt-5 grid grid-cols-3 gap-2 text-[10px] font-semibold text-slate-500'>
        <div className='rounded-xl bg-white px-2 py-2 ring-1 ring-slate-100'>ยอดเงิน</div>
        <div className='rounded-xl bg-white px-2 py-2 ring-1 ring-slate-100'>บัญชีผู้รับ</div>
        <div className='rounded-xl bg-white px-2 py-2 ring-1 ring-slate-100'>เวลาทำรายการ</div>
      </div>
    </div>
  );
}

function SlipResultStep({
  result,
  isEscrow,
}: {
  result: { outcome: 'approved' | 'rejected' | 'pending'; reasons: string[] };
  isEscrow: boolean;
  onRetry?: () => void;
}) {
  if (result.outcome === 'approved') {
    return (
      <div className='rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-6 text-center shadow-sm'>
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700'>
          <CheckCircle2 size={34} />
        </div>
        <p className='mt-4 text-base font-bold text-emerald-800'>ตรวจสอบสลิปสำเร็จ</p>
        <p className='mt-2 text-xs leading-relaxed text-emerald-700'>
          {isEscrow
            ? 'ระบบยืนยันการชำระเงินแล้ว และจะถือเงินไว้จนกว่าคุณจะยืนยันรับสินค้า'
            : 'ระบบบันทึกสลิปเรียบร้อยแล้ว'}
        </p>
      </div>
    );
  }

  if (result.outcome === 'rejected') {
    return (
      <div className='rounded-3xl border border-red-100 bg-gradient-to-b from-red-50 to-white p-6 shadow-sm'>
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700'>
          <XCircle size={34} />
        </div>
        <div className='text-center'>
          <p className='mt-4 text-base font-bold text-red-800'>ตรวจสอบสลิปไม่ผ่าน</p>
          <p className='mt-2 text-xs leading-relaxed text-red-600'>
            กรุณากลับไปแนบสลิปใหม่อีกครั้ง
          </p>
        </div>
        {result.reasons.length > 0 ? (
          <div className='mt-4 rounded-2xl border border-red-100 bg-white p-3'>
            <p className='text-[11px] font-bold text-red-700'>เหตุผลที่ไม่ผ่าน</p>
            <ul className='mt-2 space-y-1.5'>
              {result.reasons.map((reason, index) => (
                <li
                  key={`${reason}-${index}`}
                  className='flex items-start gap-1.5 text-xs text-red-600'
                >
                  <span className='mt-0.5 shrink-0'>•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className='rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-6 text-center shadow-sm'>
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700'>
        <Clock3 size={34} />
      </div>
      <p className='mt-4 text-base font-bold text-blue-800'>ส่งสลิปแล้ว</p>
      <p className='mt-2 text-xs leading-relaxed text-blue-600'>
        {result.reasons[0] ??
          (isEscrow ? 'รอเจ้าหน้าที่ Tryly ตรวจสอบเพิ่มเติม' : 'รอโรงงานตรวจสอบสลิป')}
      </p>
    </div>
  );
}

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
