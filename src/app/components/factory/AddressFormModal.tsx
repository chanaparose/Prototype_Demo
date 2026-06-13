import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppDialog } from '@/components/ui/app-dialog';
import { FormField } from '@/shared/ui/forms/FormField';
import { ModalFooter } from '@/shared/ui/modals/ModalFooter';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { LbiAddressPicker } from '@/components/common/LbiAddressPicker';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toFormErrors } from '@/lib/apiError';
import {
  addressFormSchema,
  addressFormValuesFromRow,
  defaultAddressFormValues,
  toAddressFormPayload,
  type AddressFormPayload,
  type AddressFormValues,
} from '@/domain/factory/schemas/addressForm.schema';

type Row = Record<string, unknown>;

export type { AddressFormPayload };

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: Row | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (payload: AddressFormPayload, editingId?: string | number) => Promise<void>;
};

export function AddressFormModal({ open, mode, initial, saving, onClose, onSubmit }: Props) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: defaultAddressFormValues,
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
    reset(initial ? addressFormValuesFromRow(initial) : defaultAddressFormValues);
  }, [open, initial, reset]);

  const rootError = errors.root?.message;
  const fieldError =
    errors.province_id?.message ||
    errors.district_id?.message ||
    errors.sub_district_id?.message ||
    errors.zip_code?.message ||
    errors.address_detail?.message;

  const onValid = async (values: AddressFormValues) => {
    const editingId = initial?.address_id ?? initial?.id;
    try {
      await onSubmit(toAddressFormPayload(values), editingId as string | number | undefined);
    } catch (err) {
      const { root, fields } = toFormErrors(err);
      if (root) setError('root', { message: root });
      if (fields) {
        for (const [key, message] of Object.entries(fields)) {
          const k = key as keyof AddressFormValues;
          if (k in defaultAddressFormValues) {
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
      title={mode === 'create' ? 'เพิ่มที่อยู่' : 'แก้ไขที่อยู่'}
      variant='sheet'
      footer={
        <ModalFooter
          layout='flex'
          accent='purple'
          primary={{
            label: mode === 'create' ? 'เพิ่มที่อยู่' : 'บันทึก',
            loadingLabel: 'กำลังบันทึก...',
            loading: saving,
            disabled: saving,
            onClick: () => void handleSubmit(onValid)(),
            className: 'flex-1',
          }}
          secondary={{
            label: 'ยกเลิก',
            onClick: onClose,
            disabled: saving,
            tone: 'muted',
            className: 'flex-1',
          }}
        />
      }
    >
      {rootError || fieldError ? (
        <ErrorAlert className='mb-4'>{rootError ?? fieldError}</ErrorAlert>
      ) : null}

      <FormField label='ประเภทที่อยู่' required className='w-full mb-4'>
        <Controller
          control={control}
          name='address_type'
          render={({ field }) => (
            <Select value={field.value} onValueChange={(v) => field.onChange(v as 'B' | 'S')}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='B'>ที่อยู่กำกับภาษี</SelectItem>
                <SelectItem value='S'>ที่อยู่จัดส่ง</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <div className='grid gap-3 sm:grid-cols-2 mb-4'>
        <Controller
          control={control}
          name='province_id'
          render={({ field: provinceField }) => (
            <Controller
              control={control}
              name='district_id'
              render={({ field: districtField }) => (
                <Controller
                  control={control}
                  name='sub_district_id'
                  render={({ field: subField }) => (
                    <LbiAddressPicker
                      value={{
                        provinceId: provinceField.value,
                        districtId: districtField.value,
                        subDistrictId: subField.value,
                      }}
                      onChange={(next) => {
                        provinceField.onChange(next.provinceId);
                        districtField.onChange(next.districtId);
                        subField.onChange(next.subDistrictId);
                      }}
                      onZipCodeAutoFill={(zip) => {
                        if (/^\d{5}$/.test(zip))
                          setValue('zip_code', zip, { shouldValidate: true });
                      }}
                      disabled={saving}
                    />
                  )}
                />
              )}
            />
          )}
        />
        <FormField
          label='รหัสไปรษณีย์'
          required
          error={errors.zip_code?.message}
        >
          <Input
            className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm'
            inputMode='numeric'
            maxLength={5}
            placeholder='10110'
            {...register('zip_code', {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
              },
            })}
          />
        </FormField>
      </div>

      <FormField
        label='ที่อยู่'
        required
        className='w-full mb-4'
        error={errors.address_detail?.message}
      >
        <Textarea
          className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[80px]'
          placeholder='บ้านเลขที่ หมู่ ซอย ถนน'
          {...register('address_detail')}
        />
      </FormField>

      <Label className='inline-flex items-center gap-2 text-xs font-normal text-gray-700'>
        <Controller
          control={control}
          name='is_default'
          render={({ field }) => (
            <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
          )}
        />
        ตั้งเป็นค่าเริ่มต้น
      </Label>
    </AppDialog>
  );
}
