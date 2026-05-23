import { useCallback, useRef, useState } from 'react';
import { AppDialog } from '@/components/ui/app-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PromptOptions = {
  title: string;
  label?: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  minLength?: number;
  required?: boolean;
};

const DEFAULT_OPTIONS: PromptOptions = {
  title: 'กรอกข้อมูล',
  confirmText: 'ยืนยัน',
  cancelText: 'ยกเลิก',
  required: true,
};

export function usePromptDialog() {
  const [options, setOptions] = useState<PromptOptions | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const resolverRef = useRef<((value: string | null) => void) | null>(null);

  const close = useCallback((result: string | null) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
    setValue('');
    setError('');
  }, []);

  const prompt = useCallback((nextOptions: PromptOptions) => {
    const merged = { ...DEFAULT_OPTIONS, ...nextOptions };
    setOptions(merged);
    setValue(merged.defaultValue ?? '');
    setError('');
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const submit = useCallback(() => {
    if (!options) return;
    const trimmed = value.trim();
    if (options.required !== false && !trimmed) {
      setError('กรุณากรอกข้อมูล');
      return;
    }
    if (options.minLength && trimmed.length < options.minLength) {
      setError(`กรุณากรอกอย่างน้อย ${options.minLength} ตัวอักษร`);
      return;
    }
    close(trimmed);
  }, [close, options, value]);

  const PromptDialog = useCallback(
    () => (
      <AppDialog
        open={options != null}
        onOpenChange={(open) => {
          if (!open) close(null);
        }}
        title={options?.title}
        variant='center'
        size='sm'
        footer={
          <div className='flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Button type='button' variant='outline' onClick={() => close(null)}>
              {options?.cancelText ?? DEFAULT_OPTIONS.cancelText}
            </Button>
            <Button type='button' onClick={submit}>
              {options?.confirmText ?? DEFAULT_OPTIONS.confirmText}
            </Button>
          </div>
        }
      >
        <div className='space-y-3'>
          {options?.description ? (
            <p className='text-sm leading-6 text-gray-600'>{options.description}</p>
          ) : null}
          <Label className='block space-y-1.5'>
            <span className='text-xs font-semibold text-gray-500'>{options?.label ?? 'รายละเอียด'}</span>
            <Input
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                if (error) setError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submit();
              }}
              placeholder={options?.placeholder}
              autoFocus
            />
          </Label>
          {error ? <p className='text-xs font-medium text-red-600'>{error}</p> : null}
        </div>
      </AppDialog>
    ),
    [close, error, options, submit, value],
  );

  return { prompt, PromptDialog };
}
