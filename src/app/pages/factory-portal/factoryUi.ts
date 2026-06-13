import { cn } from '@lib/utils';

type FactoryButtonVariant = 'primary' | 'secondary' | 'toolbar' | 'ghostIcon' | 'dangerIcon' | 'success' | 'danger' | 'dangerOutline' | 'upload' | 'submit';
type FactoryButtonSize = 'sm' | 'md' | 'icon';

const buttonBase =
  'inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const buttonVariantClass: Record<FactoryButtonVariant, string> = {
  primary: 'bg-brand-purple text-white hover:bg-brand-violet-deep',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-none hover:bg-[var(--brand-page)]',
  toolbar:
    'border border-slate-200 bg-white text-slate-700 shadow-none hover:bg-[var(--brand-page)]',
  ghostIcon:
    'border border-slate-200 bg-white text-slate-500 shadow-none hover:border-brand-purple/30 hover:bg-brand-lavender hover:text-brand-purple',
  dangerIcon:
    'border border-red-100 bg-white text-red-500 shadow-none hover:border-red-200 hover:bg-red-50 hover:text-red-600',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  dangerOutline: 'border border-red-200 bg-white text-red-600 shadow-none hover:bg-red-50',
  upload: 'border border-dashed border-gray-300 bg-white text-gray-500 hover:border-violet-400 hover:text-violet-600',
  submit: 'bg-brand-purple text-white hover:bg-brand-violet-deep',
};

const buttonSizeClass: Record<FactoryButtonSize, string> = {
  sm: 'min-h-8 gap-1.5 px-3 py-1.5 text-xs',
  md: 'min-h-9 gap-1.5 px-3 py-2 text-sm',
  icon: 'h-8 w-8 p-0',
};

export function factoryButtonClass({
  variant = 'secondary',
  size = 'md',
  className,
}: {
  variant?: FactoryButtonVariant;
  size?: FactoryButtonSize;
  className?: string;
} = {}) {
  return cn(buttonBase, buttonVariantClass[variant], buttonSizeClass[size], className);
}

type FactoryCardVariant = 'section' | 'list' | 'shell' | 'empty';

const cardClass: Record<FactoryCardVariant, string> = {
  section: 'rounded-lg border border-slate-200 bg-white p-4 sm:p-5',
  list: 'rounded-lg border border-slate-200 bg-white px-4 py-3.5',
  shell: 'overflow-hidden rounded-lg border border-slate-200 bg-white',
  empty: 'rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center',
};

export function factoryCardClass({
  variant = 'section',
  className,
}: {
  variant?: FactoryCardVariant;
  className?: string;
} = {}) {
  return cn(cardClass[variant], className);
}

type FactoryBadgeVariant = 'status' | 'count' | 'meta' | 'verified' | 'danger' | 'warning';

const badgeClass: Record<FactoryBadgeVariant, string> = {
  status:
    'inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-normal text-emerald-800',
  count:
    'inline-flex items-center justify-center rounded-full bg-brand-violet-soft px-2 py-0.5 text-[10px] font-semibold text-brand-purple',
  meta: 'inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600',
  verified:
    'inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700',
  danger:
    'inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700',
  warning:
    'inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700',
};

export function factoryBadgeClass({
  variant = 'meta',
  className,
}: {
  variant?: FactoryBadgeVariant;
  className?: string;
} = {}) {
  return cn(badgeClass[variant], className);
}

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50';

export function factoryInputClass({ className }: { className?: string } = {}) {
  return cn(inputClass, className);
}

type FactoryBoxVariant = 'violet' | 'amber' | 'emerald' | 'neutral';

const boxClass: Record<FactoryBoxVariant, string> = {
  violet: 'rounded-lg border border-violet-100 bg-violet-50/50',
  amber: 'rounded-lg border border-amber-100 bg-amber-50',
  emerald: 'rounded-lg border border-emerald-100 bg-emerald-50',
  neutral: 'rounded-lg border border-gray-100 bg-gray-50',
};

export function factoryBoxClass({
  variant = 'neutral',
  className,
}: {
  variant?: FactoryBoxVariant;
  className?: string;
} = {}) {
  return cn(boxClass[variant], className);
}
