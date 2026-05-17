import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BaseModal } from '@/shared/ui/modals/BaseModal';
import { productionErrorMessage } from '@/components/features/production/productionErrors';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  open: boolean;
  stepNameTh: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
};

export function RejectConfirmModal({ open, stepNameTh, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    const t = reason.trim();
    if (t.length < 10) {
      setErr('กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await onConfirm(t);
      setReason('');
      onClose();
    } catch (e) {
      setErr(productionErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <BaseModal
      isOpen={open}
      onClose={onClose}
      title={`ขอตรวจสอบใหม่ — ${stepNameTh}`}
      placement='bottom'
      size='md'
      zIndexClassName='z-[80]'
      overlayClassName='bg-black/50'
      bodyClassName='p-5 pt-0 space-y-4'
    >
      <p className='text-sm text-gray-600'>
        คุณต้องการให้โรงงานตรวจสอบขั้นตอนนี้ใหม่ใช่ไหม?
        <br />
        โปรดระบุเหตุผล (อย่างน้อย 10 ตัวอักษร)
      </p>
      <Textarea
        className='w-full min-h-[100px] rounded-xl border border-gray-200 px-3 py-2 text-sm'
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={1000}
        placeholder='เช่น ภาพไม่ชัด — กรุณาถ่ายใหม่'
      />
      {err ? <p className='text-xs text-red-600'>{err}</p> : null}
      <div className='flex gap-2 justify-end'>
        <Button variant='outline' type='button' onClick={onClose} disabled={busy}>
          ยกเลิก
        </Button>
        <Button
          type='button'
          onClick={() => void submit()}
          disabled={busy}
          className='text-white disabled:opacity-50'
          style={{ background: 'var(--brand-purple)' }}
        >
          {busy ? 'กำลังส่ง…' : 'ยืนยันการขอตรวจสอบ'}
        </Button>
      </div>
    </BaseModal>
  );
}
