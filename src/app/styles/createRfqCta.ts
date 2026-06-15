import { cn } from '@lib/utils';

const createRfqCtaBase =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden text-white font-semibold ' +
  'bg-gradient-to-r from-brand-purple via-brand-purple-hover to-brand-violet-deep ' +
  'shadow-lg shadow-brand-purple/35 ring-1 ring-white/20 ' +
  'transition-all duration-200 ease-out ' +
  'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-purple/50 hover:brightness-110 ' +
  'active:translate-y-0 active:scale-[0.98] ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-purple';

/** Full-width CTA in desktop sidebar */
export const createRfqCtaSidebarClass = cn(createRfqCtaBase, 'w-full rounded-xl py-3 text-sm');

/** Compact CTA in page headers */
export const createRfqCtaHeaderClass = cn(
  createRfqCtaBase,
  'shrink-0 rounded-lg px-3.5 py-2 text-xs',
);
