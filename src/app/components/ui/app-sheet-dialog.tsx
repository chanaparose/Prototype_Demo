import type { ReactNode } from 'react';
import { X } from 'lucide-react';
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
  titleClassName?: string;
};

export function AppSheetDialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className,
  bodyClassName,
  titleClassName,
}: AppSheetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'fixed bottom-0 left-0 right-0 top-auto flex h-[75dvh] !max-h-[75dvh] w-full max-w-lg translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl border-gray-100 p-0 sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:h-auto sm:!max-h-[90vh] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl',
          className,
        )}
        showCloseButton={false}
      >
        <DialogHeader className='relative shrink-0 border-b border-gray-100 bg-white px-4 py-3 pr-12 text-left'>
          <DialogTitle className={cn('text-sm font-semibold', titleClassName)}>{title}</DialogTitle>
          <button
            type='button'
            aria-label='ปิด'
            onClick={() => onOpenChange(false)}
            className='absolute right-3 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-400 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-200'
          >
            <X size={16} />
          </button>
        </DialogHeader>
        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]',
            bodyClassName ?? 'p-4 sm:p-5',
          )}
        >
          {children}
        </div>
        {footer ? (
          <DialogFooter className='shrink-0 border-t border-gray-100 bg-white px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:p-5 sm:pt-2 sm:justify-stretch'>
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
