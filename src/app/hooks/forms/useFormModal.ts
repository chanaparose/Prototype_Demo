import { useCallback, useState } from 'react';
import { useForm, type FieldValues, type SubmitHandler, type UseFormProps } from 'react-hook-form';

type UseFormModalOptions<TValues extends FieldValues> = UseFormProps<TValues> & {
  onSubmit?: SubmitHandler<TValues> | ((values: TValues) => Promise<void>);
  resetOnClose?: boolean;
};

export function useFormModal<TValues extends FieldValues = FieldValues>({
  onSubmit,
  resetOnClose = true,
  ...formOptions
}: UseFormModalOptions<TValues> = {}) {
  const form = useForm<TValues>(formOptions);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onOpen = useCallback(() => {
    setError('');
    setOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setOpen(false);
    setError('');
    if (resetOnClose) {
      form.reset();
    }
  }, [form, resetOnClose]);

  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        onOpen();
      } else {
        onClose();
      }
    },
    [onClose, onOpen],
  );

  const submit = form.handleSubmit(async (values) => {
    if (!onSubmit) return;
    setIsLoading(true);
    setError('');
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  });

  return {
    ...form,
    form,
    open,
    setOpen,
    onOpen,
    onClose,
    onOpenChange,
    onSubmit: submit,
    isLoading,
    error,
    setError,
  };
}
