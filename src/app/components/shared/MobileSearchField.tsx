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
        'group flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2',
        'shadow-sm transition-all duration-200',
        'focus-within:border-brand-purple focus-within:shadow-md focus-within:ring-2 focus-within:ring-purple-100',
        className,
      )}
    >
      <span
        aria-hidden
        className='flex h-5 w-5 shrink-0 items-center justify-center text-gray-400 transition-colors group-focus-within:text-brand-purple'
      >
        <Search size={16} strokeWidth={2.25} />
      </span>
      <Input
        type='search'
        enterKeyHint='search'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='h-auto min-h-0 flex-1 border-0 bg-transparent p-0 text-sm leading-snug text-gray-700 shadow-none ring-0 placeholder:text-gray-400 focus-visible:border-transparent focus-visible:ring-0'
      />
      {value.trim() ? (
        <Button
          variant='unstyled'
          type='button'
          onClick={() => onChange('')}
          aria-label='ล้างข้อความค้นหา'
          className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
        >
          <X size={14} strokeWidth={2.25} />
        </Button>
      ) : null}
    </div>
  );
}
