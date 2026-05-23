import { useEffect, useMemo, useState } from 'react';
import { runAsyncAction } from '@/utils/asyncAction';
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
import { applyFormErrorsFromApi } from '@/lib/apiError';
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

const CERT_FORM_FIELDS = ['root', 'cert_id', 'cert_number', 'expire_date', 'file'] as const;

export function CertUploadModal({
  open,
  mode,
  certTypes,
  initial,
  submitting: submittingProp,
  onClose,
  onSubmit,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const isSubmitting = submittingProp ?? submitting;
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
  const fieldError =
    errors.cert_id?.message ||
    errors.expire_date?.message ||
    errors.file?.message;

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

    await runAsyncAction(
      async () => {
        await onSubmit(toCertSubmitValue(values), keepOpen);
        if (mode === 'create' && keepOpen) {
          reset(certFormValuesFromRow(null, fallbackCertId));
        }
      },
      {
        onStart: () => setSubmitting(true),
        onSettled: () => setSubmitting(false),
        onError: (_message, err) => applyFormErrorsFromApi(err, setError, CERT_FORM_FIELDS),
      },
    );
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
      dismissible={!isSubmitting}
      className='max-h-[min(90vh,100dvh)]'
      bodyClassName='p-4 sm:p-5 pb-6 space-y-4'
      footerClassName='p-4 sm:p-5 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2'
      footer={
        <ModalFooter
          layout='grid'
          accent='success'
          primary={{
            label: 'บันทึก',
            loadingLabel: 'กำลังบันทึก...',
            loading: isSubmitting,
            disabled: isSubmitting,
            onClick: () => void handleSubmit((v) => runSubmit(v, false))(),
          }}
          alternatePrimary={
            mode === 'create'
              ? {
                  label: 'บันทึกและเพิ่มใบรับรองถัดไป',
                  disabled: isSubmitting,
                  onClick: () => void handleSubmit((v) => runSubmit(v, true))(),
                }
              : undefined
          }
          secondary={
            mode === 'edit'
              ? { label: 'ยกเลิก', onClick: onClose, disabled: isSubmitting }
              : undefined
          }
        />
      }
    >
      {rootError || fieldError ? (
        <ErrorAlert>{rootError ?? fieldError}</ErrorAlert>
      ) : null}

      <FormField label='ประเภทใบรับรอง' required error={errors.cert_id?.message}>
        <Controller
          control={control}
          name='cert_id'
          render={({ field }) => (
            <Select
              value={String(field.value)}
              onValueChange={(v) => field.onChange(Number(v))}
            >
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
          className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
          {...register('cert_number')}
        />
      </FormField>

      <FormField label='วันหมดอายุ' required error={errors.expire_date?.message}>
        <Input
          type='date'
          className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
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
          className='text-sm block w-full'
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setValue('file', f, { shouldValidate: true });
          }}
        />
      </FormField>
    </AppDialog>
  );
}
