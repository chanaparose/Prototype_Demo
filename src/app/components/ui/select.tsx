import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@lib/utils';

/** จำนวนตัวเลือกขั้นต่ำที่จะแสดงช่องค้นหาใน dropdown อัตโนมัติ */
const SEARCHABLE_ITEM_THRESHOLD = 8;

/** ดึงข้อความจาก children ของ SelectItem (รองรับ nested elements) */
function extractNodeText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractNodeText).join(' ');
  if (React.isValidElement(node)) {
    return extractNodeText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

function countSelectItems(children: React.ReactNode): number {
  let count = 0;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const slot = (child.props as { 'data-slot'?: string })['data-slot'];
    if (child.type === SelectItem || slot === 'select-item') {
      count += 1;
    } else {
      count += countSelectItems((child.props as { children?: React.ReactNode }).children);
    }
  });
  return count;
}

/** กรอง SelectItem ตามคำค้น — เก็บ element อื่น (group/label/separator) ไว้ตามโครงสร้างเดิม */
function filterSelectChildren(children: React.ReactNode, query: string): React.ReactNode {
  if (!query.trim()) return children;
  const q = query.trim().toLowerCase();
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === SelectItem) {
      const text = extractNodeText((child.props as { children?: React.ReactNode }).children);
      return text.toLowerCase().includes(q) ? child : null;
    }
    const inner = (child.props as { children?: React.ReactNode }).children;
    if (inner != null && countSelectItems(inner) > 0) {
      const filtered = filterSelectChildren(inner, query);
      if (countSelectItems(filtered) === 0) return null;
      return React.cloneElement(child as React.ReactElement<{ children?: React.ReactNode }>, {
        children: filtered,
      });
    }
    return child;
  });
}

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot='select' {...props} />;
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot='select-group' {...props} />;
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot='select-value' {...props} />;
}

function SelectTrigger({
  className,
  leadingIcon,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  leadingIcon?: React.ReactNode;
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot='select-trigger'
      className={cn(
        'relative flex h-9 min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white py-2 text-sm font-normal transition-all outline-none',
        leadingIcon ? 'pl-9 pr-3' : 'px-3',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[placeholder]:text-xs data-[placeholder]:font-normal data-[placeholder]:text-neutral-placeholder',
        '[&_[data-slot=select-value]]:data-[placeholder]:text-xs [&_[data-slot=select-value]]:data-[placeholder]:font-normal [&_[data-slot=select-value]]:font-normal',
        'w-full *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        'focus-visible:border-brand-purple/60 focus-visible:ring-[3px] focus-visible:ring-brand-purple/20',
        'aria-invalid:border-status-danger aria-invalid:ring-status-danger/20',
        className,
      )}
      {...props}
    >
      {leadingIcon ? (
        <span className='pointer-events-none absolute left-3 top-1/2 z-10 flex size-4 -translate-y-1/2 items-center justify-center text-gray-400 [&_svg]:size-4'>
          {leadingIcon}
        </span>
      ) : null}
      {children}
      <ChevronDownIcon className='size-4 shrink-0 text-gray-400' aria-hidden />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  align = 'start',
  style,
  searchable,
  searchPlaceholder = 'พิมพ์เพื่อค้นหา...',
  side = 'bottom',
  avoidCollisions = false,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  /** บังคับเปิด/ปิดช่องค้นหา — ไม่ระบุ = เปิดอัตโนมัติเมื่อมีตัวเลือกตั้งแต่ 8 รายการ */
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = React.useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const itemCount = React.useMemo(() => countSelectItems(children), [children]);
  const showSearch = searchable ?? itemCount >= SEARCHABLE_ITEM_THRESHOLD;

  // Radix Select ยึด focus ไว้ที่ item ตอนเปิด (จังหวะไม่แน่นอน อาจมาทีหลังเรา) —
  // ช่วง 500ms แรกหลังช่องค้นหา mount ถ้า focus ตกอยู่บน item ให้ดึงกลับมาที่ช่องค้นหา
  // เพื่อให้ผู้ใช้เปิด dropdown แล้วพิมพ์ได้ทันที (หลังจากนั้นถือว่าผู้ใช้ตั้งใจย้ายเอง)
  // หมายเหตุ: ใช้ callback ref เพราะ SelectContent (wrapper) mount ค้างไว้ตลอด —
  // ตัว input เพิ่งจะ mount จริงตอน dropdown เปิด (Radix render content ผ่าน portal)
  const stealTimersRef = React.useRef<{ interval?: ReturnType<typeof setInterval>; stop?: ReturnType<typeof setTimeout> }>({});
  const searchInputCallbackRef = React.useCallback((el: HTMLInputElement | null) => {
    searchInputRef.current = el;
    clearInterval(stealTimersRef.current.interval);
    clearTimeout(stealTimersRef.current.stop);
    if (!el) {
      // dropdown ปิด (input ถูก unmount) — ล้างคำค้นไม่ให้ค้างไปกรองรอบถัดไป
      setQuery('');
      return;
    }
    const interval = setInterval(() => {
      if (document.activeElement === el) return;
      const active = document.activeElement;
      const shouldSteal =
        active instanceof HTMLElement &&
        (active.getAttribute('data-slot') === 'select-item' ||
          active.closest('[data-slot="select-content"]') != null ||
          active === document.body);
      if (shouldSteal) el.focus({ preventScroll: true });
    }, 50);
    const stop = setTimeout(() => clearInterval(interval), 500);
    stealTimersRef.current = { interval, stop };
  }, []);
  const filteredChildren = React.useMemo(
    () => (showSearch ? filterSelectChildren(children, query) : children),
    [children, query, showSearch],
  );
  const noResults = showSearch && query.trim() !== '' && countSelectItems(filteredChildren) === 0;

  const popperWidthStyle =
    position === 'popper'
      ? {
          width: 'var(--radix-select-trigger-width)',
          minWidth: 'var(--radix-select-trigger-width)',
        }
      : undefined;

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot='select-content'
        className={cn(
          'relative z-50 max-h-[var(--radix-select-content-available-height)] min-w-32 overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-900 shadow-lg data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          position === 'popper' &&
            'w-[var(--radix-select-trigger-width)] data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        align={align}
        side={side}
        avoidCollisions={avoidCollisions}
        style={{ ...popperWidthStyle, ...style }}
        {...props}
      >
        {showSearch ? (
          <div className='sticky top-0 z-10 border-b border-gray-100 bg-white p-1.5'>
            <div className='relative'>
              <SearchIcon className='pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-gray-400' />
              <input
                ref={searchInputCallbackRef}
                type='text'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className='h-7 w-full rounded-md border border-gray-200 bg-gray-50/60 pl-7 pr-2 text-xs text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-purple/50 focus:bg-white'
                // กัน Radix typeahead ขโมยตัวอักษรที่พิมพ์ — แต่ปล่อย Escape (ปิด dropdown)
                // และลูกศรขึ้น/ลง (ย้าย focus ไปเลือก item ด้วยคีย์บอร์ด) ให้ Radix จัดการต่อ
                onKeyDown={(e) => {
                  if (e.key === 'Escape' || e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Tab') return;
                  e.stopPropagation();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                autoComplete='off'
              />
            </div>
          </div>
        ) : null}
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn('bg-white p-1', position === 'popper' && 'w-full scroll-my-1')}
        >
          {filteredChildren}
          {noResults ? (
            <div className='px-2 py-3 text-center text-xs text-gray-400'>
              ไม่พบตัวเลือกที่ตรงกับ "{query}"
            </div>
          ) : null}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot='select-label'
      className={cn('px-2 py-1.5 text-xs text-gray-500', className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot='select-item'
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg py-1.5 pr-8 pl-2 text-sm outline-none hover:bg-gray-100 focus:bg-brand-page focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2',
        className,
      )}
      {...props}
    >
      <span
        data-slot='select-item-indicator'
        className='absolute right-2 flex size-3.5 items-center justify-center'
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className='size-4' />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot='select-separator'
      className={cn('pointer-events-none -mx-1 my-1 h-px bg-gray-100', className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot='select-scroll-up-button'
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronUpIcon className='size-4' />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot='select-scroll-down-button'
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronDownIcon className='size-4' />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
