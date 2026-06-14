import * as React from 'react';

import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';

type ModalFooterAccent = 'success' | 'teal' | 'purple';

type ModalFooterLayout = 'flex' | 'grid' | 'grid-compact' | 'stack';

type ModalFooterAction = {
  label: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
};

type ModalFooterPrimaryAction = ModalFooterAction & {
  loading?: boolean;
  loadingLabel?: React.ReactNode;
  accent?: ModalFooterAccent;
  /** Override gradient (e.g. CTA_GRADIENT) */
  style?: React.CSSProperties;
  fullWidth?: boolean;
};

type ModalFooterSecondaryAction = ModalFooterAction & {
  tone?: 'outline' | 'muted';
};

type ModalFooterProps = {
  layout?: ModalFooterLayout;
  className?: string;
  /** Default accent for primary when not set on `primary.accent` */
  accent?: ModalFooterAccent;
  leading?: React.ReactNode;
  primary: ModalFooterPrimaryAction;
  /** Second action in grid layouts (outline style) */
  alternatePrimary?: ModalFooterSecondaryAction;
  secondary?: ModalFooterSecondaryAction;
};

const ACCENT_GRADIENT: Record<ModalFooterAccent, string> = {
  success: 'linear-gradient(135deg, var(--status-success) 0%, #10B981 100%)',
  teal: 'linear-gradient(135deg, var(--brand-teal) 0%, #14B8A6 100%)',
  purple: 'linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-violet) 100%)',
};

const LAYOUT_CLASS: Record<ModalFooterLayout, string> = {
  flex: 'flex gap-2 w-full',
  grid: 'grid grid-cols-1 sm:grid-cols-2 gap-2 w-full',
  'grid-compact': 'grid grid-cols-[1fr_auto] gap-2 w-full',
  stack: 'w-full space-y-2',
};

const PRIMARY_CLASS = 'w-full py-3 rounded-lg text-white text-sm font-normal disabled:opacity-60';

const OUTLINE_SECONDARY_CLASS =
  'w-full py-3 rounded-lg border border-gray-200 text-sm font-normal text-gray-700 disabled:opacity-50 disabled:opacity-60';

const MUTED_SECONDARY_CLASS =
  'px-4 py-3 rounded-lg border border-gray-200 text-sm font-normal text-gray-700 disabled:opacity-50';

function renderPrimary({
  label,
  onClick,
  disabled,
  type = 'button',
  className,
  loading,
  loadingLabel,
  accent = 'success',
  style,
  fullWidth,
}: ModalFooterPrimaryAction) {
  return (
    <Button
      variant='unstyled'
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(PRIMARY_CLASS, fullWidth && 'w-full', className)}
      style={style ?? { background: ACCENT_GRADIENT[accent] }}
    >
      {loading && loadingLabel != null ? loadingLabel : label}
    </Button>
  );
}

function renderSecondary({
  label,
  onClick,
  disabled,
  type = 'button',
  className,
  tone = 'outline',
}: ModalFooterSecondaryAction) {
  if (tone === 'muted') {
    return (
      <Button
        variant='unstyled'
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={cn(MUTED_SECONDARY_CLASS, className)}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button
      variant='outline'
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(OUTLINE_SECONDARY_CLASS, className)}
    >
      {label}
    </Button>
  );
}

function ModalFooter({
  layout = 'grid',
  className,
  accent,
  leading,
  primary,
  alternatePrimary,
  secondary,
}: ModalFooterProps) {
  return (
    <div data-slot='modal-footer' className={cn(LAYOUT_CLASS[layout], className)}>
      {leading}
      {renderPrimary({ accent, ...primary })}
      {alternatePrimary ? renderSecondary({ tone: 'outline', ...alternatePrimary }) : null}
      {secondary ? renderSecondary(secondary) : null}
    </div>
  );
}

export { ModalFooter };
export type {
  ModalFooterAccent,
  ModalFooterAction,
  ModalFooterLayout,
  ModalFooterPrimaryAction,
  ModalFooterProps,
  ModalFooterSecondaryAction,
};
