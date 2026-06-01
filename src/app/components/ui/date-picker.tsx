/**
 * DatePicker — modern Thai calendar popover
 *
 * Features:
 * - Popover calendar, never the native browser input
 * - Thai month names + Buddhist Era year (พ.ศ.)
 * - Click header → month-grid quick-picker, then year ±
 * - Ghost days from adjacent months for context
 * - Today dot + ring, selected filled purple circle
 * - minDate / maxDate guards (past days greyed + unclickable)
 * - "วันนี้" footer shortcut + clear button
 *
 * Usage:
 *   <DatePicker
 *     value="2025-06-15"         // ISO "YYYY-MM-DD" or ""
 *     onChange={v => ...}        // same format or ""
 *     placeholder="เลือกวันที่"
 *     minDate={new Date()}
 *     error={!!errMsg}
 *   />
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addYears,
  subYears,
  isToday,
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
  startOfWeek,
  endOfWeek,
  parseISO,
  getDay,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/* ─── constants ─────────────────────────────────────── */

const MONTH_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
] as const;

const MONTH_TH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
] as const;

const DOW_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'] as const;

/* ─── helpers ───────────────────────────────────────── */

function parseValue(v: string): Date | null {
  if (!v) return null;
  try {
    const d = parseISO(v);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function toISO(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

/** "15 มิถุนายน 2568" — day month beYear */
function formatThai(d: Date): string {
  return `${d.getDate()} ${MONTH_TH[d.getMonth()]} ${d.getFullYear() + 543}`;
}

/* ─── types ─────────────────────────────────────────── */

type Panel = 'days' | 'months';

type DatePickerProps = {
  value?: string;
  onChange?: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: boolean;
  disabled?: boolean;
  className?: string;
};

/* ─── component ─────────────────────────────────────── */

export function DatePicker({
  value = '',
  onChange,
  onBlur,
  placeholder = 'เลือกวันที่',
  minDate,
  maxDate,
  error = false,
  disabled = false,
  className,
}: DatePickerProps) {
  const selected = parseValue(value);

  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>('days');
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selected) return selected;
    if (minDate && isAfter(minDate, new Date())) return minDate;
    return new Date();
  });

  /* sync viewDate when value changes externally */
  useEffect(() => {
    if (selected) setViewDate(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleClose = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setPanel('days');
      onBlur?.();
    }
  }, [onBlur]);

  /* ── disabled check ── */
  const isDisabled = useCallback((d: Date) => {
    if (minDate && isBefore(d, minDate) && !isSameDay(d, minDate)) return true;
    if (maxDate && isAfter(d, maxDate) && !isSameDay(d, maxDate)) return true;
    return false;
  }, [minDate, maxDate]);

  /* ── day grid (includes ghost days from adjacent months) ── */
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  /* ── handlers ── */
  const selectDay = (d: Date) => {
    if (isDisabled(d)) return;
    onChange?.(toISO(d));
    setOpen(false);
    setPanel('days');
  };

  const selectMonth = (monthIdx: number) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIdx, 1));
    setPanel('days');
  };

  /* ── trigger classes ── */
  const triggerCls = cn(
    'group flex w-full items-center gap-2.5 rounded-xl border bg-white/95 px-3.5 py-2.5 text-sm text-left',
    'shadow-[0_1px_3px_rgba(46,34,82,0.06)] transition-all duration-150 outline-none',
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
      : open
        ? 'border-[var(--brand-mauve)] ring-2 ring-[color-mix(in_srgb,var(--brand-mauve)_18%,transparent)]'
        : 'border-[var(--brand-lavender-muted)] hover:border-[color-mix(in_srgb,var(--brand-mauve)_50%,var(--brand-lavender-muted))] hover:shadow-[0_2px_8px_rgba(79,70,229,0.10)]',
    disabled && 'pointer-events-none opacity-50',
    className,
  );

  return (
    <Popover open={open} onOpenChange={handleClose}>
      <PopoverTrigger asChild>
        <button type='button' disabled={disabled} className={triggerCls}>
          <CalendarDays
            size={15}
            className={cn(
              'shrink-0 transition-colors duration-150',
              selected
                ? 'text-[var(--brand-purple)]'
                : 'text-gray-400 group-hover:text-[var(--brand-mauve)]',
            )}
          />
          <span
            className={cn(
              'flex-1 truncate',
              !selected && 'text-xs font-normal text-[var(--neutral-placeholder)]',
            )}
          >
            {selected ? formatThai(selected) : placeholder}
          </span>
          {selected && (
            <button
              type='button'
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange?.('');
              }}
              className='ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors'
              tabIndex={-1}
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className='w-72 p-0 overflow-hidden select-none' align='start'>

        {/* ══════════ DAY PANEL ══════════ */}
        {panel === 'days' && (
          <>
            {/* Header */}
            <div className='relative flex items-center gap-1 border-b border-[var(--brand-lavender-muted)]/50 px-2 py-2.5'
              style={{ background: 'linear-gradient(135deg,color-mix(in srgb,var(--brand-lavender) 70%,white) 0%,white 100%)' }}
            >
              <button
                type='button'
                onClick={() => setViewDate(subMonths(viewDate, 1))}
                className='flex h-7 w-7 items-center justify-center rounded-lg text-[var(--brand-mauve)] hover:bg-white/70 hover:text-[var(--brand-purple)] transition-colors'
              >
                <ChevronLeft size={15} strokeWidth={2.5} />
              </button>

              {/* Month+Year — click to open month picker */}
              <button
                type='button'
                onClick={() => setPanel('months')}
                className='flex-1 text-center text-[13px] font-bold text-[var(--brand-navy)] hover:text-[var(--brand-purple)] transition-colors rounded-lg py-1 hover:bg-white/60'
              >
                {MONTH_TH[viewDate.getMonth()]}
                <span className='ml-1.5 text-[var(--brand-mauve)]'>
                  {viewDate.getFullYear() + 543}
                </span>
              </button>

              <button
                type='button'
                onClick={() => setViewDate(addMonths(viewDate, 1))}
                className='flex h-7 w-7 items-center justify-center rounded-lg text-[var(--brand-mauve)] hover:bg-white/70 hover:text-[var(--brand-purple)] transition-colors'
              >
                <ChevronRight size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* DOW labels */}
            <div className='grid grid-cols-7 px-2 pt-2.5 pb-0.5'>
              {DOW_TH.map((d, i) => (
                <div
                  key={d}
                  className={cn(
                    'text-center text-[10px] font-semibold pb-1',
                    i === 0 ? 'text-red-400' : 'text-[var(--neutral-placeholder)]',
                  )}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className='grid grid-cols-7 gap-y-px px-2 pb-2'>
              {allDays.map((day) => {
                const isCurrentMonth = isSameMonth(day, viewDate);
                const sel = selected ? isSameDay(day, selected) : false;
                const today = isToday(day);
                const dis = isDisabled(day);
                const isSun = getDay(day) === 0;

                return (
                  <button
                    key={toISO(day)}
                    type='button'
                    disabled={dis}
                    onClick={() => selectDay(day)}
                    className={cn(
                      'relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[12.5px] font-medium transition-all duration-100',
                      sel
                        ? 'bg-[var(--brand-purple)] text-white shadow-[0_3px_12px_rgba(79,70,229,0.40)] scale-110 font-bold z-10'
                        : today && isCurrentMonth
                          ? 'ring-2 ring-[var(--brand-mauve)]/60 text-[var(--brand-purple)] font-bold hover:bg-[var(--brand-lavender)]'
                          : dis
                            ? 'text-gray-300 cursor-not-allowed'
                            : isCurrentMonth
                              ? cn(
                                  'hover:bg-[var(--brand-lavender)] hover:text-[var(--brand-purple)] active:scale-90',
                                  isSun ? 'text-red-400' : 'text-[var(--brand-navy)]',
                                )
                              : 'text-gray-300 hover:bg-gray-50',
                    )}
                  >
                    {day.getDate()}
                    {/* today dot */}
                    {today && !sel && isCurrentMonth && (
                      <span className='absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--brand-mauve)]' />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className='flex items-center justify-between border-t border-[var(--brand-lavender-muted)]/50 px-3.5 py-2'>
              <button
                type='button'
                onClick={() => {
                  const today = new Date();
                  if (!isDisabled(today)) {
                    onChange?.(toISO(today));
                    setOpen(false);
                  } else {
                    setViewDate(today);
                  }
                }}
                className='text-[11px] font-semibold text-[var(--brand-mauve)] hover:text-[var(--brand-purple)] transition-colors'
              >
                วันนี้
              </button>
              <span className='text-[10px] text-gray-300'>
                {selected ? formatThai(selected) : '—'}
              </span>
            </div>
          </>
        )}

        {/* ══════════ MONTH PANEL ══════════ */}
        {panel === 'months' && (
          <>
            {/* Header */}
            <div
              className='flex items-center gap-1 border-b border-[var(--brand-lavender-muted)]/50 px-2 py-2.5'
              style={{ background: 'linear-gradient(135deg,color-mix(in srgb,var(--brand-lavender) 70%,white) 0%,white 100%)' }}
            >
              <button
                type='button'
                onClick={() => setViewDate(subYears(viewDate, 1))}
                className='flex h-7 w-7 items-center justify-center rounded-lg text-[var(--brand-mauve)] hover:bg-white/70 hover:text-[var(--brand-purple)] transition-colors'
              >
                <ChevronLeft size={15} strokeWidth={2.5} />
              </button>

              <button
                type='button'
                onClick={() => setPanel('days')}
                className='flex-1 text-center text-[13px] font-bold text-[var(--brand-navy)] hover:text-[var(--brand-purple)] transition-colors rounded-lg py-1 hover:bg-white/60'
              >
                พ.ศ. <span className='text-[var(--brand-mauve)]'>{viewDate.getFullYear() + 543}</span>
              </button>

              <button
                type='button'
                onClick={() => setViewDate(addYears(viewDate, 1))}
                className='flex h-7 w-7 items-center justify-center rounded-lg text-[var(--brand-mauve)] hover:bg-white/70 hover:text-[var(--brand-purple)] transition-colors'
              >
                <ChevronRight size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* 3×4 month grid */}
            <div className='grid grid-cols-3 gap-1.5 p-3'>
              {MONTH_TH_SHORT.map((m, idx) => {
                const isCurrent = idx === viewDate.getMonth();
                const isSelectedMonth =
                  selected &&
                  selected.getMonth() === idx &&
                  selected.getFullYear() === viewDate.getFullYear();

                return (
                  <button
                    key={m}
                    type='button'
                    onClick={() => selectMonth(idx)}
                    className={cn(
                      'rounded-xl py-2.5 text-[12px] font-medium transition-all duration-100',
                      isSelectedMonth
                        ? 'bg-[var(--brand-purple)] text-white shadow-[0_3px_10px_rgba(79,70,229,0.35)] font-bold'
                        : isCurrent
                          ? 'bg-[var(--brand-lavender)] text-[var(--brand-purple)] ring-2 ring-[var(--brand-mauve)]/40 font-bold'
                          : 'text-[var(--brand-navy)] hover:bg-[var(--brand-lavender)] hover:text-[var(--brand-purple)]',
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
