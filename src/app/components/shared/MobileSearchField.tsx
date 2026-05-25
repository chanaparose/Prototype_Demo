import { Search, X } from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type MobileSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  'data-tour'?: string;
};

export function MobileSearchField({
  value,
  onChange,
  placeholder = 'ค้นหา…',
  className,
  'data-tour': dataTour,
}: MobileSearchFieldProps) {
  return (
    <div
      data-tour={dataTour}
      className={cn(
        'group flex min-h-11 items-center gap-2.5 rounded-2xl border border-[color-mix(in_srgb,var(--brand-purple)_14%,var(--neutral-border))]',
        'bg-white px-3 shadow-[0_1px_3px_rgba(46,34,82,0.06)]',
        'transition-[border-color,box-shadow] duration-200',
        'focus-within:border-[color-mix(in_srgb,var(--brand-purple)_38%,var(--neutral-border))]',
        'focus-within:shadow-[0_2px_14px_rgba(162,56,255,0.14)]',
        'focus-within:ring-[3px] focus-within:ring-[rgba(162,56,255,0.1)]',
        className,
      )}
    >
      <span
        aria-hidden
        className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-lavender-chip)] text-[var(--brand-purple)] transition-colors group-focus-within:bg-[var(--brand-violet-soft)]'
      >
        <Search size={16} strokeWidth={2.25} />
      </span>
      <Input
        type='search'
        enterKeyHint='search'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='h-auto min-h-0 flex-1 border-0 bg-transparent p-0 text-[15px] leading-snug text-[var(--brand-navy)] shadow-none ring-0 placeholder:text-[var(--neutral-placeholder)] focus-visible:border-transparent focus-visible:ring-0'
      />
      {value.trim() ? (
        <Button
          variant='unstyled'
          type='button'
          onClick={() => onChange('')}
          aria-label='ล้างข้อความค้นหา'
          className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--neutral-muted)] text-[var(--neutral-subtle)] transition-colors hover:bg-[var(--brand-violet-soft)] hover:text-[var(--brand-purple)]'
        >
          <X size={14} strokeWidth={2.25} />
        </Button>
      ) : null}
    </div>
  );
}
