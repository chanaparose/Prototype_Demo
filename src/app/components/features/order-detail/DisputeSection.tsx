import React from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Upload, X, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';
import { disputesApi, type DisputeCategory, type IDisputeResponse } from '@/services/api/ordersApi';
import { mediaApi } from '@/services/api/factoryApi';
import { useOrderDispute } from '@/hooks/useOrderDispute';
import { AppDialog } from '@/components/ui/app-dialog';
import { ModalFooter } from '@/shared/ui/modals/ModalFooter';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { formatDateTime } from '@/utils/formatting/formatDate';

/** order statuses ที่เปิดคำร้องได้ (จ่ายเงินแล้ว/กำลังดำเนินการ/ส่งแล้ว) */
const DISPUTABLE = new Set(['PD', 'PR', 'WF', 'QC', 'SH', 'DL']);

/** คำสั่งซื้อที่เสร็จสมบูรณ์แล้วยังเปิดคำร้องได้ภายในกี่วัน (ต้องตรงกับ BE) */
const CP_DISPUTE_WINDOW_DAYS = 14;

const CATEGORY_LABEL: Record<DisputeCategory, string> = {
  NR: 'ไม่ได้รับสินค้า',
  ND: 'สินค้าไม่ตรงปก',
  OT: 'อื่นๆ',
};

const CATEGORY_OPTIONS: DisputeCategory[] = ['NR', 'ND', 'OT'];

const disputeInputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-purple/30';

type RefundMethod = 'bank' | 'promptpay';

const THAI_BANKS = [
  'กสิกรไทย',
  'ไทยพาณิชย์',
  'กรุงเทพ',
  'กรุงไทย',
  'ทหารไทยธนชาต',
  'กรุงศรีอยุธยา',
  'ออมสิน',
  'ธ.ก.ส.',
  'ซีไอเอ็มบี ไทย',
  'ยูโอบี',
  'แลนด์ แอนด์ เฮ้าส์',
  'อื่นๆ',
];

type Props = {
  orderId: string | number;
  orderStatus: string; // raw API status (PD/PR/...)
  totalAmount: number;
  /** ขั้นตอนการผลิตปัจจุบัน (0-5) — ขอคืนเงินได้เฉพาะ step=0 (ยังไม่เริ่มผลิต) หรือ step>=4 (จัดส่งแล้ว) */
  currentStepId?: number;
  /** วันที่คำสั่งซื้อเสร็จสมบูรณ์ (ISO) — ใช้เช็คหน้าต่างเวลา 14 วันเมื่อ status=CP */
  completedAt?: string | null;
  /** true ถ้าลูกค้ารีวิวคำสั่งซื้อนี้ไปแล้ว — รีวิวแล้วเปิดคำร้องซ้ำไม่ได้ */
  alreadyReviewed?: boolean;
  /** true เมื่อผู้ดูเป็นเจ้าของ order (ลูกค้า) — เฉพาะลูกค้าเปิดคำร้องได้ */
  isCustomer?: boolean;
  onChanged?: () => void;
};

export function DisputeSection({
  orderId,
  orderStatus,
  totalAmount,
  currentStepId,
  completedAt,
  alreadyReviewed,
  isCustomer,
  onChanged,
}: Props) {
  const { dispute, hasActiveDispute, isLoading, refetch } = useOrderDispute(orderId);
  const [modalOpen, setModalOpen] = React.useState(false);

  if (isLoading) return null;

  const status = String(orderStatus ?? '').trim().toUpperCase();
  // ขอคืนเงินได้เฉพาะ step=0 (ยังไม่เริ่มผลิต — ยกเลิกได้ทัน) หรือ step>=4 (จัดส่งแล้ว/ถึงมือลูกค้า
  // — ตรวจสอบสภาพสินค้าได้จริง) ไม่เปิดให้ระหว่างผลิต (step 1-3) เพราะยังไม่มีของให้ตรวจสอบ
  const stepEligible = currentStepId == null || currentStepId === 0 || currentStepId >= 4;
  // CP (เสร็จสมบูรณ์): เปิดคำร้องได้ถ้ายังอยู่ในกรอบ 14 วันหลังเสร็จ และยังไม่เคยรีวิว
  // (ฝั่ง BE เป็นคนตัดสินจริง — เช็คตรงนี้แค่ซ่อน/โชว์ปุ่มให้ตรงกับ UX)
  const daysSinceCompleted = completedAt
    ? (Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24)
    : null;
  const cpEligible =
    status === 'CP' &&
    !alreadyReviewed &&
    daysSinceCompleted != null &&
    daysSinceCompleted <= CP_DISPUTE_WINDOW_DAYS;
  const statusEligible = DISPUTABLE.has(status) || cpEligible;
  const canOpen = isCustomer && statusEligible && stepEligible && !hasActiveDispute;

  // ไม่มีอะไรให้แสดงถ้าไม่มีคำร้องและเปิดไม่ได้
  if (!dispute && !canOpen) return null;

  return (
    <section className='rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3'>
      <div className='flex items-center gap-2'>
        <ShieldAlert size={16} className='text-slate-400' aria-hidden />
        <p className='text-sm font-bold text-brand-navy-ink'>คำร้อง / ขอคืนเงิน</p>
      </div>

      {dispute ? <DisputeStatusCard dispute={dispute} /> : null}

      {/* ขั้นตอนส่งสินค้าคืน — เมื่อเจ้าหน้าที่อนุมัติให้ส่งคืน (RT) */}
      {dispute && dispute.status === 'RT' && isCustomer ? (
        <ReturnShippingForm
          orderId={orderId}
          onSuccess={async () => {
            await refetch();
            await onChanged?.();
          }}
        />
      ) : null}

      {canOpen ? (
        <Button
          variant='unstyled'
          type='button'
          onClick={() => setModalOpen(true)}
          className='w-full rounded-xl border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors'
        >
          {dispute ? 'เปิดคำร้องใหม่' : 'ร้องเรียน / ขอคืนเงิน'}
        </Button>
      ) : null}

      <DisputeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        orderId={orderId}
        totalAmount={totalAmount}
        onSuccess={async () => {
          await refetch();
          await onChanged?.();
        }}
      />
    </section>
  );
}

function DisputeStatusCard({ dispute }: { dispute: IDisputeResponse }) {
  const cat = CATEGORY_LABEL[dispute.category] ?? '-';
  if (dispute.status === 'RF') {
    return (
      <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-3'>
        <p className='flex items-center gap-1.5 text-sm font-semibold text-emerald-700'>
          <CheckCircle2 size={14} /> คืนเงินแล้ว
          {dispute.refund_amount ? ` · ${formatCurrency(Number(dispute.refund_amount))}` : ''}
        </p>
        <p className='mt-1 text-[11px] text-emerald-600'>เหตุผล: {cat}</p>
        {dispute.resolution ? (
          <p className='mt-0.5 text-[11px] text-emerald-600'>หมายเหตุ: {dispute.resolution}</p>
        ) : null}
        {dispute.refund_slip_url ? (
          <a
            href={dispute.refund_slip_url}
            target='_blank'
            rel='noreferrer'
            className='mt-1 inline-block text-[11px] font-medium text-emerald-700 underline'
          >
            ดูสลิปการโอนคืน
          </a>
        ) : null}
      </div>
    );
  }
  if (dispute.status === 'RJ') {
    return (
      <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
        <p className='text-sm font-semibold text-slate-600'>คำร้องถูกปฏิเสธ</p>
        <p className='mt-1 text-[11px] text-slate-500'>เหตุผล: {cat}</p>
        {dispute.resolution ? (
          <p className='mt-0.5 text-[11px] text-slate-500'>หมายเหตุจากเจ้าหน้าที่: {dispute.resolution}</p>
        ) : null}
      </div>
    );
  }
  if (dispute.status === 'RT') {
    return (
      <div className='rounded-xl border border-blue-200 bg-blue-50 p-3'>
        <p className='text-sm font-semibold text-blue-700'>เจ้าหน้าที่อนุมัติแล้ว — กรุณาส่งสินค้าคืน</p>
        <p className='mt-1 text-[11px] text-blue-600'>เหตุผล: {cat}</p>
        {dispute.resolution ? (
          <p className='mt-0.5 text-[11px] text-blue-600'>คำแนะนำ: {dispute.resolution}</p>
        ) : null}
        <p className='mt-0.5 text-[11px] text-blue-600'>ส่งคืนแล้วแนบหลักฐานการจัดส่งด้านล่าง</p>
      </div>
    );
  }
  if (dispute.status === 'RC') {
    return (
      <div className='rounded-xl border border-indigo-200 bg-indigo-50 p-3'>
        <p className='text-sm font-semibold text-indigo-700'>ส่งคืนแล้ว — รอเจ้าหน้าที่ตรวจรับสินค้า</p>
        <p className='mt-1 text-[11px] text-indigo-600'>เหตุผล: {cat}</p>
        {dispute.return_tracking_no ? (
          <p className='mt-0.5 text-[11px] text-indigo-600'>
            เลขพัสดุ {dispute.return_tracking_no}
            {dispute.return_courier ? ` · ${dispute.return_courier}` : ''}
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <div className='rounded-xl border border-amber-200 bg-amber-50 p-3'>
      <p className='text-sm font-semibold text-amber-700'>รอเจ้าหน้าที่ตรวจสอบ</p>
      <p className='mt-1 text-[11px] text-amber-600'>เหตุผล: {cat}</p>
      <p className='mt-0.5 text-[11px] text-amber-600'>ยื่นเมื่อ {formatDateTime(dispute.created_at)}</p>
    </div>
  );
}

/** ฟอร์มแนบหลักฐานการส่งสินค้าคืน (แสดงเมื่อ dispute อยู่สถานะ RT) */
function ReturnShippingForm({
  orderId,
  onSuccess,
}: {
  orderId: string | number;
  onSuccess: () => void | Promise<void>;
}) {
  const [tracking, setTracking] = React.useState('');
  const [courier, setCourier] = React.useState('');
  const [note, setNote] = React.useState('');
  const [images, setImages] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileRef.current) fileRef.current.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(
        files.slice(0, 5 - images.length).map((f) => mediaApi.upload(f).then((r) => r.url)),
      );
      setImages((prev) => [...prev, ...urls].slice(0, 5));
    } catch {
      toast.error('อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (images.length === 0 && !tracking.trim()) {
      toast.error('กรุณาแนบรูปหลักฐานการจัดส่ง หรือกรอกเลขพัสดุ');
      return;
    }
    setSubmitting(true);
    try {
      await disputesApi.submitReturn(orderId, {
        tracking_no: tracking.trim() || undefined,
        courier: courier.trim() || undefined,
        note: note.trim() || undefined,
        image_urls: images,
      });
      toast.success('ส่งหลักฐานการจัดส่งแล้ว — รอเจ้าหน้าที่ตรวจรับ');
      await onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ส่งหลักฐานไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5'>
      <p className='text-xs font-semibold text-slate-600'>แนบหลักฐานการส่งสินค้าคืน</p>
      <div className='grid grid-cols-2 gap-2'>
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder='เลขพัสดุ (tracking)'
          className={disputeInputClass}
        />
        <input
          value={courier}
          onChange={(e) => setCourier(e.target.value)}
          placeholder='ขนส่ง เช่น Kerry, ไปรษณีย์'
          className={disputeInputClass}
        />
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder='หมายเหตุ (ถ้ามี)'
        className={disputeInputClass}
      />
      <div className='flex flex-wrap gap-2'>
        {images.map((url) => (
          <div key={url} className='relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200'>
            <img src={url} alt='' className='h-full w-full object-cover' />
            <button
              type='button'
              onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
              className='absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/50 text-white'
            >
              <X size={9} />
            </button>
          </div>
        ))}
        {images.length < 5 ? (
          <button
            type='button'
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className='flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:border-brand-purple/40'
          >
            {uploading ? <Loader2 size={14} className='animate-spin' /> : <Upload size={14} />}
            <span className='text-[8px]'>บิล/รูป</span>
          </button>
        ) : null}
      </div>
      <input ref={fileRef} type='file' accept='image/*' multiple className='hidden' onChange={handleFiles} />
      <Button
        variant='unstyled'
        type='button'
        disabled={submitting || uploading}
        onClick={submit}
        className='w-full rounded-lg bg-brand-purple px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50'
      >
        {submitting ? 'กำลังส่ง…' : 'ยืนยันส่งหลักฐานการจัดส่ง'}
      </Button>
    </div>
  );
}

function DisputeModal({
  open,
  onClose,
  orderId,
  totalAmount,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string | number;
  totalAmount: number;
  onSuccess: () => void | Promise<void>;
}) {
  const [category, setCategory] = React.useState<DisputeCategory | ''>('');
  const [description, setDescription] = React.useState('');
  const [images, setImages] = React.useState<string[]>([]);
  const [refundMethod, setRefundMethod] = React.useState<RefundMethod>('bank');
  const [bankName, setBankName] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [refundAccountName, setRefundAccountName] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setCategory('');
      setDescription('');
      setImages([]);
      setRefundMethod('bank');
      setBankName('');
      setAccountNumber('');
      setRefundAccountName('');
      setContactEmail('');
      setContactPhone('');
    }
  }, [open]);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileRef.current) fileRef.current.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.slice(0, 5 - images.length).map((f) => mediaApi.upload(f).then((r) => r.url)));
      setImages((prev) => [...prev, ...urls].slice(0, 5));
    } catch {
      toast.error('อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!category) {
      toast.error('กรุณาเลือกเหตุผล');
      return;
    }
    if (description.trim().length < 10) {
      toast.error(
        category === 'OT'
          ? 'กรุณาระบุรายละเอียดเพิ่มเติมอย่างน้อย 10 ตัวอักษร'
          : 'กรุณาอธิบายปัญหาอย่างน้อย 10 ตัวอักษร',
      );
      return;
    }
    if (refundMethod === 'bank' && !bankName) {
      toast.error('กรุณาเลือกธนาคาร');
      return;
    }
    if (!accountNumber.trim() || !refundAccountName.trim()) {
      toast.error('กรุณากรอกเลขบัญชี/พร้อมเพย์และชื่อบัญชีปลายทางสำหรับรับเงินคืน');
      return;
    }
    if (!contactPhone.trim()) {
      toast.error('กรุณากรอกเบอร์โทรติดต่อกลับ');
      return;
    }
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      toast.error('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }
    const refundAccount =
      refundMethod === 'bank'
        ? `ธนาคาร${bankName} ${accountNumber.trim()}`
        : `พร้อมเพย์ ${accountNumber.trim()}`;
    setSubmitting(true);
    try {
      await disputesApi.create(orderId, {
        category,
        description: description.trim(),
        image_urls: images,
        refund_account: refundAccount,
        refund_account_name: refundAccountName.trim(),
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone.trim(),
      });
      toast.success('ส่งคำร้องแล้ว — รอเจ้าหน้าที่ตรวจสอบ');
      await onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ส่งคำร้องไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title='ร้องเรียน / ขอคืนเงิน'
      variant='sheet'
      bodyClassName='p-4 sm:p-5 pb-2'
      footer={
        <ModalFooter
          layout='stack'
          primary={{
            label: `ส่งคำร้อง · ขอคืน ${formatCurrency(totalAmount)}`,
            loadingLabel: 'กำลังส่ง…',
            loading: submitting,
            disabled: submitting || uploading,
            onClick: handleSubmit,
            fullWidth: true,
          }}
        />
      }
    >
      <p className='mb-3 text-xs text-slate-500'>
        เลือกเหตุผลและแนบหลักฐาน เจ้าหน้าที่ Tryly จะตรวจสอบและคืนเงินเต็มจำนวนหากคำร้องถูกต้อง
      </p>

      {/* เหตุผล */}
      <label className='mb-3 block'>
        <span className='mb-1 block text-[11px] text-slate-500'>เหตุผล *</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DisputeCategory | '')}
          className={disputeInputClass}
        >
          <option value='' disabled>
            เลือกเหตุผล
          </option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </label>

      {/* คำอธิบาย */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={
          category === 'OT'
            ? 'ระบุเหตุผลอื่นๆ โดยละเอียด (อย่างน้อย 10 ตัวอักษร)'
            : 'อธิบายปัญหาที่พบ (อย่างน้อย 10 ตัวอักษร)'
        }
        rows={3}
        className='mb-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none'
      />

      {/* หลักฐาน */}
      <p className='mb-1.5 text-xs font-semibold text-slate-600'>แนบรูปหลักฐาน (สูงสุด 5)</p>
      <div className='flex flex-wrap gap-2'>
        {images.map((url) => (
          <div key={url} className='relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200'>
            <img src={url} alt='' className='h-full w-full object-cover' />
            <button
              type='button'
              onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
              className='absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white'
            >
              <X size={11} />
            </button>
          </div>
        ))}
        {images.length < 5 ? (
          <button
            type='button'
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className='flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:border-brand-purple/40 hover:text-brand-purple'
          >
            {uploading ? <Loader2 size={16} className='animate-spin' /> : <Upload size={16} />}
            <span className='text-[9px]'>เพิ่มรูป</span>
          </button>
        ) : null}
      </div>
      <input ref={fileRef} type='file' accept='image/*' multiple className='hidden' onChange={handleFiles} />

      {/* บัญชีปลายทางสำหรับรับเงินคืน + ติดต่อกลับ */}
      <div className='mt-4 space-y-2.5 border-t border-slate-100 pt-3'>
        <p className='text-xs font-semibold text-slate-600'>บัญชีรับเงินคืน & ช่องทางติดต่อกลับ</p>

        <label className='block'>
          <span className='mb-1 block text-[11px] text-slate-500'>ช่องทางรับเงินคืน *</span>
          <select
            value={refundMethod}
            onChange={(e) => setRefundMethod(e.target.value as RefundMethod)}
            className={disputeInputClass}
          >
            <option value='bank'>โอนเข้าบัญชีธนาคาร</option>
            <option value='promptpay'>พร้อมเพย์</option>
          </select>
        </label>

        {refundMethod === 'bank' ? (
          <label className='block'>
            <span className='mb-1 block text-[11px] text-slate-500'>ธนาคาร *</span>
            <select value={bankName} onChange={(e) => setBankName(e.target.value)} className={disputeInputClass}>
              <option value='' disabled>
                เลือกธนาคาร
              </option>
              {THAI_BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className='block'>
          <span className='mb-1 block text-[11px] text-slate-500'>
            {refundMethod === 'bank' ? 'เลขบัญชีธนาคาร *' : 'เบอร์พร้อมเพย์ / เลขบัตรประชาชน *'}
          </span>
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder={refundMethod === 'bank' ? 'เช่น 1234567890' : 'เช่น 0812345678'}
            inputMode='numeric'
            className={disputeInputClass}
          />
        </label>
        <label className='block'>
          <span className='mb-1 block text-[11px] text-slate-500'>ชื่อ-นามสกุล บัญชีปลายทาง *</span>
          <input
            value={refundAccountName}
            onChange={(e) => setRefundAccountName(e.target.value)}
            placeholder='ชื่อเจ้าของบัญชี'
            className={disputeInputClass}
          />
        </label>
        <div className='grid grid-cols-2 gap-2'>
          <label className='block'>
            <span className='mb-1 block text-[11px] text-slate-500'>เบอร์โทรติดต่อกลับ *</span>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder='08xxxxxxxx'
              inputMode='tel'
              className={disputeInputClass}
            />
          </label>
          <label className='block'>
            <span className='mb-1 block text-[11px] text-slate-500'>อีเมล (ถ้ามี)</span>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder='you@email.com'
              inputMode='email'
              className={disputeInputClass}
            />
          </label>
        </div>
      </div>

      <div className='mt-3 flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-400'>
        <AlertTriangle size={12} className='mt-0.5 shrink-0' />
        การเปิดคำร้องจะพักคำสั่งซื้อไว้จนกว่าเจ้าหน้าที่จะตรวจสอบเสร็จ
      </div>
    </AppDialog>
  );
}
