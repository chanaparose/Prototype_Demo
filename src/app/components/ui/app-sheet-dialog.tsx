import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@lib/utils';

type AppSheetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function AppSheetDialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className,
  bodyClassName,
}: AppSheetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'fixed bottom-0 left-0 right-0 top-auto max-h-[90vh] w-full max-w-lg translate-x-0 translate-y-0 gap-0 rounded-t-2xl border-gray-100 p-0 sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl',
          className,
        )}
      >
        <DialogHeader className='border-b border-gray-100 px-4 py-3 text-left'>
          <DialogTitle className='text-sm font-semibold'>{title}</DialogTitle>
        </DialogHeader>
        <div className={cn('overflow-y-auto', bodyClassName ?? 'p-4 sm:p-5')}>
          {children}
        </div>
        {footer ? (
          <DialogFooter className='border-t border-gray-100 p-4 sm:p-5 pt-2 sm:justify-stretch'>
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
