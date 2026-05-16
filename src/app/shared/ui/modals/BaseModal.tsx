import React from 'react';
import { X } from 'lucide-react';

type BaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  placement?: 'center' | 'right' | 'bottom';
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdropClick?: boolean;
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
};

const contentClasses = {
  center: 'rounded-2xl shadow-2xl max-h-[90vh] w-full overflow-auto',
  right: 'rounded-l-2xl lg:rounded-2xl shadow-2xl h-full lg:h-auto lg:max-h-[90vh] w-full overflow-auto',
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
}: BaseModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />
      <div className={`fixed z-50 ${placementStyles[placement]}`}>
        <div
          className={`bg-white ${contentClasses[placement]} ${sizeStyles[size]}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              {title && <h2 className="text-sm font-semibold text-gray-900">{title}</h2>}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-auto w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-4 py-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
