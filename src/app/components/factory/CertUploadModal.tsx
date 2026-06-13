import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { AppDialog } from '@/components/ui/app-dialog';
import { FormField } from '@/shared/ui/forms/FormField';
import { ModalFooter } from '@/shared/ui/modals/ModalFooter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toFormErrors } from '@/lib/apiError';
import {
  certFormSchema,
  certFormValuesFromRow,
  toCertSubmitValue,
  validateCertFormForSubmit,
  type CertFormInput,
  type CertFormSubmitValue,
  type CertFormValues,
} from '@/domain/factory/schemas/certForm.schema';

type CertTypeOption = {
  id: number;
  label: string;
};

export type { CertFormSubmitValue };

type Props = {
  readonly open: boolean;
  readonly mode: 'create' | 'edit';
  readonly certTypes: readonly CertTypeOption[];
  readonly initial?: Record<string, unknown> | null;
  readonly submitting?: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (value: CertFormSubmitValue, keepOpen: boolean) => Promise<void>;
};

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

  const form = useForm<CertFormInput, unknown, CertFormValues>({
    resolver: zodResolver(certFormSchema),
    defaultValues: certFormValuesFromRow(null, fallbackCertId),
    mode: 'onSubmit',
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!open) return;
    reset(certFormValuesFromRow(initial, fallbackCertId));
  }, [open, initial, fallbackCertId, reset]);

  const rootError = errors.root?.message;
  const fieldError = errors.cert_id?.message || errors.expire_date?.message || errors.file?.message;

  const selectedFile = form.watch('file');
  let fileHelperText: string | undefined;
  if (selectedFile) {
    fileHelperText = selectedFile.name;
  } else if (mode === 'edit') {
    fileHelperText = 'อัปโหลดใหม่หากต้องการแทนไฟล์เดิม';
  }

  const runSubmit = async (values: CertFormValues, keepOpen: boolean) => {
    const fileErr = validateCertFormForSubmit(values, mode);
    if (fileErr) {
      setError('file', { message: fileErr });
      return;
    }

    try {
      await onSubmit(toCertSubmitValue(values), keepOpen);
      if (mode === 'create' && keepOpen) {
        reset(certFormValuesFromRow(null, fallbackCertId));
      }
    } catch (err) {
      const { root, fields } = toFormErrors(err);
      if (root) setError('root', { message: root });
      if (fields) {
        for (const [key, message] of Object.entries(fields)) {
          const k = key as keyof CertFormInput;
          if (k === 'cert_id' || k === 'cert_number' || k === 'expire_date' || k === 'file') {
            setError(k, { message });
          }
        }
      }
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title={mode === 'create' ? 'เพิ่มใบรับรอง' : 'แก้ไขใบรับรอง'}
      variant='sheet'
      size='lg'
      dismissible={!submitting}
      className='max-h-[min(90vh,100dvh)]'
      bodyClassName='p-4 sm:p-5 pb-6 space-y-4'
      footerClassName='p-4 sm:p-5 pt-2 flex gap-2'
      footer={
        mode === 'create' ? (
          <ModalFooter
            layout='flex'
            accent='success'
            primary={{
              label: 'บันทึก',
              loadingLabel: 'กำลังบันทึก...',
              loading: submitting,
              disabled: submitting,
              onClick: () => void handleSubmit((v) => runSubmit(v, false))(),
              fullWidth: true,
            }}
            alternatePrimary={{
              label: 'บันทึกและเพิ่มใบรับรองถัดไป',
              disabled: submitting,
              onClick: () => void handleSubmit((v) => runSubmit(v, true))(),
              className: 'flex-1',
            }}
          />
        ) : (
          <ModalFooter
            layout='flex'
            accent='success'
            primary={{
              label: 'บันทึก',
              loadingLabel: 'กำลังบันทึก...',
              loading: submitting,
              disabled: submitting,
              onClick: () => void handleSubmit((v) => runSubmit(v, false))(),
              fullWidth: true,
            }}
            secondary={{
              label: 'ยกเลิก',
              onClick: onClose,
              disabled: submitting,
              tone: 'outline',
              className: 'flex-1',
            }}
          />
        )
      }
    >
      {rootError || fieldError ? <ErrorAlert>{rootError ?? fieldError}</ErrorAlert> : null}

      <FormField label='ประเภทใบรับรอง *' error={errors.cert_id?.message}>
        <Controller
          control={control}
          name='cert_id'
          render={({ field }) => (
            <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
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
          )}
        />
      </FormField>

      <FormField label='เลขที่เอกสาร (ถ้ามี)' error={errors.cert_number?.message}>
        <Input
          {...register('cert_number')}
        />
      </FormField>

      <FormField label='วันหมดอายุ *' error={errors.expire_date?.message}>
        <Input
          type='date'
          {...register('expire_date')}
        />
      </FormField>

      <FormField
        label='ไฟล์เอกสาร'
        required={mode === 'create'}
        error={errors.file?.message}
        helperText={fileHelperText}
      >
        <Input
          type='file'
          accept='image/*,.pdf'
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setValue('file', f, { shouldValidate: true });
          }}
        />
      </FormField>
    </AppDialog>
  );
}
