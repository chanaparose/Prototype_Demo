import type { ReactNode, Ref } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@lib/utils';

type AppDialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

type AppDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'sheet' | 'center';
  size?: AppDialogSize;
  showCloseButton?: boolean;
  dismissible?: boolean;
  className?: string;
  bodyClassName?: string;
  bodyRef?: Ref<HTMLDivElement>;
  headerClassName?: string;
  footerClassName?: string;
  overlayClassName?: string;
};

const sizeClass: Record<AppDialogSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-5xl',
  full: 'sm:max-w-[min(96vw,1200px)]',
};

export function AppDialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  variant = 'sheet',
  size = 'md',
  showCloseButton = true,
  dismissible = true,
  className,
  bodyClassName,
  bodyRef,
  headerClassName,
  footerClassName,
  overlayClassName,
}: AppDialogProps) {
  const showHeader = Boolean(title) || showCloseButton;
  const isSheet = variant === 'sheet';

  const handleOpenChange = (next: boolean) => {
    if (!next && !dismissible) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName={overlayClassName}
        className={cn(
          'flex flex-col gap-0 overflow-hidden border-gray-100 p-0 max-h-[calc(100dvh-5rem)]',
          isSheet
            ? cn(
                'fixed bottom-0 left-0 right-0 top-auto w-full translate-x-0 translate-y-0 rounded-t-2xl',
                'max-h-[calc(100dvh-5rem)] sm:max-h-[90vh]',
                'sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl',
                sizeClass[size],
              )
            : cn('sm:rounded-2xl', sizeClass[size]),
          className,
        )}
        onInteractOutside={(e) => {
          if (!dismissible) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!dismissible) e.preventDefault();
        }}
      >
        {showHeader ? (
          <DialogHeader
            className={cn(
              'flex shrink-0 flex-row items-center justify-between border-b border-gray-100 bg-white px-4 py-3 text-left',
              headerClassName,
            )}
          >
            {title ? (
              <DialogTitle className='text-sm font-semibold text-gray-900'>{title}</DialogTitle>
            ) : (
              <span className='sr-only'>Dialog</span>
            )}
            {showCloseButton ? (
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                className='ml-auto shrink-0'
                aria-label='Close'
                onClick={() => onOpenChange(false)}
              >
                <X size={16} />
              </Button>
            ) : null}
          </DialogHeader>
        ) : null}

        <div
          ref={bodyRef}
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]',
            bodyClassName ?? 'p-4 sm:p-5',
          )}
        >
          {children}
        </div>

        {footer ? (
          <DialogFooter
            className={cn(
              'shrink-0 border-t border-gray-100 bg-white px-4 pt-3 sm:justify-stretch',
              isSheet
                ? 'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]'
                : 'pb-3',
              footerClassName,
            )}
          >
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
