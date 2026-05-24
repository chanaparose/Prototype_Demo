import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { productionErrorMessage } from '@/components/features/production/productionErrors';
import { Textarea } from '@/components/ui/textarea';
import {
  rejectReasonSchema,
  type RejectReasonFormValues,
} from '@/domain/production/schemas/rejectReason.schema';

type Props = {
  open: boolean;
  stepNameTh: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
};

export function RejectConfirmModal({ open, stepNameTh, onClose, onConfirm }: Props) {
  const form = useForm<RejectReasonFormValues>({
    resolver: zodResolver(rejectReasonSchema),
    defaultValues: { reason: '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) {
      form.reset({ reason: '' });
    }
  }, [open, form]);

  const onSubmit = async (values: RejectReasonFormValues) => {
    try {
      await onConfirm(values.reason.trim());
      form.reset({ reason: '' });
      onClose();
    } catch (e) {
      form.setError('reason', { message: productionErrorMessage(e) });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className='max-w-md gap-0 p-0'>
        <DialogHeader className='border-b border-gray-100 px-5 py-4 text-left'>
          <DialogTitle className='text-base'>ขอตรวจสอบใหม่ — {stepNameTh}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
            className='space-y-4 p-5 pt-4'
          >
            <p className='text-sm text-gray-600'>
              คุณต้องการให้โรงงานตรวจสอบขั้นตอนนี้ใหม่ใช่ไหม?
              <br />
              โปรดระบุเหตุผล (อย่างน้อย 10 ตัวอักษร)
            </p>
            <FormField
              control={form.control}
              name='reason'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      className='w-full min-h-[100px] rounded-xl border border-gray-200 px-3 py-2 text-sm'
                      maxLength={1000}
                      placeholder='เช่น ภาพไม่ชัด — กรุณาถ่ายใหม่'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='gap-2 sm:justify-end border-0 p-0'>
              <Button
                variant='outline'
                type='button'
                onClick={onClose}
                disabled={form.formState.isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button
                type='submit'
                disabled={form.formState.isSubmitting}
                className='text-white disabled:opacity-50'
                style={{ background: 'var(--brand-purple)' }}
              >
                {form.formState.isSubmitting ? 'กำลังส่ง…' : 'ยืนยันการขอตรวจสอบ'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
