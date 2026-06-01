import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@lib/utils';
import { useDisclosure } from '@/hooks/ui/useDisclosure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type SearchableSelectOption = {
  value: string;
  label: string;
};

export type SearchableSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  listClassName?: string;
  onBlur?: () => void;
  'aria-invalid'?: boolean;
};

function normalizeForSearch(text: string): string {
  return text.trim().toLocaleLowerCase('th-TH');
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = '— เลือก —',
  searchPlaceholder = 'พิมพ์เพื่อค้นหา…',
  emptyMessage = 'ไม่พบรายการ',
  disabled,
  loading,
  className,
  listClassName,
  onBlur,
  'aria-invalid': ariaInvalid,
}: SearchableSelectProps) {
  const listId = useId();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    if (!q) return options;
    return options.filter((o) => normalizeForSearch(o.label).includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onDocPointer = (ev: MouseEvent) => {
      if (!boxRef.current?.contains(ev.target as Node)) {
        onClose();
        onBlur?.();
      }
    };
    document.addEventListener('mousedown', onDocPointer);
    return () => document.removeEventListener('mousedown', onDocPointer);
  }, [isOpen, onBlur, onClose]);

  const handleSelect = (next: string) => {
    onValueChange(next);
    onClose();
    onBlur?.();
  };

  const displayLabel = loading
    ? 'กำลังโหลด...'
    : selected?.label || placeholder;

  return (
    <div ref={boxRef} className='relative w-full'>
      <Button
        variant='unstyled'
        type='button'
        disabled={disabled || loading}
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        aria-controls={listId}
        aria-invalid={ariaInvalid}
        onClick={() => {
          if (disabled || loading) return;
          if (isOpen) onClose();
          else onOpen();
        }}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm shadow-[0_1px_2px_rgba(46,34,82,0.04)] transition-all',
          'disabled:cursor-not-allowed disabled:opacity-60',
          selected ? 'text-[var(--brand-navy)]' : 'text-[var(--neutral-placeholder)] font-normal',
          className,
        )}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            selected
              ? 'text-sm font-medium text-[var(--brand-navy)]'
              : 'text-xs font-normal text-[var(--neutral-placeholder)]',
          )}
        >
          {displayLabel}
        </span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-[var(--brand-mauve)] transition-transform', isOpen && 'rotate-180')}
        />
      </Button>

      {isOpen ? (
        <div
          className={cn(
            'absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-[var(--brand-lavender-muted)] bg-white shadow-[0_12px_32px_rgba(46,34,82,0.14)]',
            listClassName,
          )}
        >
          <div className='border-b border-[var(--brand-lavender-muted)]/80 p-2'>
            <div className='relative'>
              <Search
                size={14}
                className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neutral-placeholder)]'
              />
              <Input
                ref={searchRef}
                type='search'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className='h-9 w-full rounded-lg border-[var(--brand-lavender-muted)] bg-[var(--brand-page)]/50 pl-9 pr-3 text-sm'
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    onClose();
                    onBlur?.();
                  }
                }}
              />
            </div>
          </div>

          <ul
            id={listId}
            role='listbox'
            className='max-h-56 overflow-y-auto p-1'
          >
            {filtered.length === 0 ? (
              <li className='px-3 py-2.5 text-center text-xs text-[var(--neutral-subtle)]'>
                {emptyMessage}
              </li>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value} role='option' aria-selected={isSelected}>
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                        isSelected
                          ? 'bg-[var(--brand-lavender)] font-semibold text-[var(--brand-purple)]'
                          : 'text-[var(--brand-navy)] hover:bg-[var(--brand-page)]',
                      )}
                    >
                      <span className='min-w-0 truncate'>{opt.label}</span>
                      {isSelected ? <Check size={14} className='shrink-0' /> : null}
                    </Button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
