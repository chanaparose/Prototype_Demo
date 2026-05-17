import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  placement?: 'center' | 'right' | 'bottom';
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdropClick?: boolean;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  overlayClassName?: string;
  zIndexClassName?: string;
};

const placementStyles = {
  center: 'inset-0 flex items-center justify-center',
  right: 'inset-y-0 right-0 lg:inset-0 lg:flex lg:items-center lg:justify-end',
  bottom: 'bottom-0 left-0 right-0 lg:inset-0 lg:flex lg:items-end lg:justify-center',
};

const sizeStyles = {
  sm: 'lg:max-w-sm',
  md: 'lg:max-w-md',
  lg: 'lg:max-w-lg',
  xl: 'lg:max-w-5xl',
  full: 'lg:max-w-[min(96vw,1200px)]',
};

const contentClasses = {
  center: 'rounded-2xl shadow-2xl max-h-[90vh] w-full overflow-auto',
  right:
    'rounded-l-2xl lg:rounded-2xl shadow-2xl h-full lg:h-auto lg:max-h-[90vh] w-full overflow-auto',
  bottom: 'rounded-t-2xl lg:rounded-2xl shadow-2xl max-h-[90vh] w-full lg:w-auto overflow-auto',
};

export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  placement = 'center',
  showCloseButton = true,
  size = 'md',
  closeOnBackdropClick = true,
  className = '',
  bodyClassName = 'px-4 py-4',
  headerClassName = '',
  footerClassName = '',
  overlayClassName = 'bg-black/40',
  zIndexClassName = 'z-50',
}: BaseModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 ${overlayClassName} ${zIndexClassName}`}
        onClick={closeOnBackdropClick ? onClose : undefined}
      />
      <div className={`fixed ${zIndexClassName} ${placementStyles[placement]}`}>
        <div
          className={`bg-white ${contentClasses[placement]} ${sizeStyles[size]} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div
              className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 ${headerClassName}`}
            >
              {title && <h2 className='text-sm font-semibold text-gray-900'>{title}</h2>}
              {showCloseButton && (
                <Button
                  onClick={onClose}
                  variant='ghost'
                  size='icon-sm'
                  className='ml-auto'
                  aria-label='Close'
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={bodyClassName}>{children}</div>

          {/* Footer */}
          {footer && (
            <div className={`px-4 py-3 border-t border-gray-100 flex gap-2 ${footerClassName}`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
