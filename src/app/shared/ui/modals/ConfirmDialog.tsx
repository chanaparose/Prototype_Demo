import { useCallback, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AppDialog } from '@/components/ui/app-dialog';
import { Button } from '@/components/ui/button';

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

const DEFAULT_OPTIONS: ConfirmOptions = {
  title: 'ยืนยันการทำรายการ',
  confirmText: 'ยืนยัน',
  cancelText: 'ยกเลิก',
};

export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const close = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    setOptions({ ...DEFAULT_OPTIONS, ...nextOptions });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const ConfirmDialog = useCallback(
    () => (
      <AppDialog
        open={options != null}
        onOpenChange={(open) => {
          if (!open) close(false);
        }}
        title={options?.title}
        variant='center'
        size='sm'
        footer={
          <div className='flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Button type='button' variant='outline' onClick={() => close(false)}>
              {options?.cancelText ?? DEFAULT_OPTIONS.cancelText}
            </Button>
            <Button
              type='button'
              variant={options?.destructive ? 'destructive' : 'default'}
              onClick={() => close(true)}
            >
              {options?.confirmText ?? DEFAULT_OPTIONS.confirmText}
            </Button>
          </div>
        }
      >
        <div className='flex gap-3'>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              options?.destructive ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            <AlertTriangle size={18} />
          </div>
          <p className='min-w-0 text-sm leading-6 text-gray-600'>
            {options?.description ?? 'ต้องการดำเนินการต่อหรือไม่?'}
          </p>
        </div>
      </AppDialog>
    ),
    [close, options],
  );

  return { confirm, ConfirmDialog };
}
