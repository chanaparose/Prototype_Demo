import React, { useEffect, useMemo, useState } from 'react';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { BaseModal, FormField, ModalFooter } from '@/shared/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type CertTypeOption = {
  id: number;
  label: string;
};

export type CertFormSubmitValue = {
  cert_id: number;
  cert_number?: string;
  expire_date: string;
  file: File | null;
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  certTypes: CertTypeOption[];
  initial?: Record<string, unknown> | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (value: CertFormSubmitValue, keepOpen: boolean) => Promise<void>;
};

function toDateInputValue(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function isFutureOrToday(raw: string): boolean {
  const d = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d >= now;
}

export function CertUploadModal({
  open,
  mode,
  certTypes,
  initial,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const fallbackCertId = useMemo(() => certTypes[0]?.id ?? 1, [certTypes]);
  const [certId, setCertId] = useState(String(fallbackCertId));
  const [certNumber, setCertNumber] = useState('');
  const [expireDate, setExpireDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const rawCertId = Number(initial?.certificate_id ?? initial?.cert_id ?? fallbackCertId);
    setCertId(String(Number.isFinite(rawCertId) && rawCertId > 0 ? rawCertId : fallbackCertId));
    setCertNumber(String(initial?.cert_number ?? '').trim());
    setExpireDate(toDateInputValue(initial?.expire_date));
    setFile(null);
    setError('');
  }, [open, initial, fallbackCertId]);

  if (!open) return null;

  const validate = (requireFile: boolean): string | null => {
    const idNum = Number(certId);
    if (!Number.isFinite(idNum) || idNum <= 0) return 'กรุณาเลือกประเภทใบรับรอง';
    if (!expireDate) return 'กรุณาเลือกวันหมดอายุ';
    if (!isFutureOrToday(expireDate)) return 'วันหมดอายุต้องเป็นวันนี้หรืออนาคต';
    if (requireFile && !file) return 'กรุณาอัปโหลดไฟล์เอกสาร';
    return null;
  };

  const submit = async (keepOpen: boolean) => {
    const requireFile = mode === 'create';
    const err = validate(requireFile);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    await onSubmit(
      {
        cert_id: Number(certId),
        cert_number: certNumber.trim() || undefined,
        expire_date: expireDate,
        file,
      },
      keepOpen,
    );
    if (mode === 'create' && keepOpen) {
      setCertNumber('');
      setExpireDate('');
      setFile(null);
      setCertId(String(fallbackCertId));
    }
  };

  return (
    <BaseModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'เพิ่มใบรับรอง' : 'แก้ไขใบรับรอง'}
      placement='bottom'
      size='lg'
      className='sm:rounded-2xl max-w-lg max-h-[min(90vh,100dvh)]'
      bodyClassName='p-4 sm:p-5 pb-6 space-y-4'
      closeOnBackdropClick={!submitting}
      footerClassName='p-4 sm:p-5 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2'
      footer={
        <ModalFooter
          layout='grid'
          accent='success'
          primary={{
            label: 'บันทึก',
            loadingLabel: 'กำลังบันทึก...',
            loading: submitting,
            disabled: submitting,
            onClick: () => void submit(false),
          }}
          alternatePrimary={
            mode === 'create'
              ? {
                  label: 'บันทึกและเพิ่มใบรับรองถัดไป',
                  disabled: submitting,
                  onClick: () => void submit(true),
                }
              : undefined
          }
          secondary={
            mode === 'edit'
              ? { label: 'ยกเลิก', onClick: onClose, disabled: submitting }
              : undefined
          }
        />
      }
    >
      {error ? <ErrorAlert>{error}</ErrorAlert> : null}

      <FormField label='ประเภทใบรับรอง' required>
        <Select value={certId} onValueChange={setCertId}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='เลือกประเภทใบรับรอง' />
          </SelectTrigger>
          <SelectContent>
            {certTypes.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label='เลขที่เอกสาร (ถ้ามี)'>
        <Input
          className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
          value={certNumber}
          onChange={(e) => setCertNumber(e.target.value)}
        />
      </FormField>

      <FormField label='วันหมดอายุ' required>
        <Input
          type='date'
          className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
          value={expireDate}
          onChange={(e) => setExpireDate(e.target.value)}
        />
      </FormField>

      <FormField
        label='ไฟล์เอกสาร'
        required={mode === 'create'}
        helperText={
          file
            ? file.name
            : mode === 'edit'
              ? 'อัปโหลดใหม่หากต้องการแทนไฟล์เดิม'
              : undefined
        }
      >
        <Input
          type='file'
          accept='image/*,.pdf'
          className='text-sm block w-full'
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </FormField>
    </BaseModal>
  );
}
