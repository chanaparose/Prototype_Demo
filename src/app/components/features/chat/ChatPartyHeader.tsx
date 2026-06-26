import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { cn } from '@lib/utils';
import type { CounterpartyView } from '@/utils/counterparty';
import { FACTORY_FALLBACK_AVATAR } from '@/utils/counterparty';
import { Button } from '@/components/ui/button';


interface Props {
  view: CounterpartyView;
  density?: 'row' | 'header';
  /** แถบหัวแชทบนมือถือ — avatar และ gap เล็กลง */
  compact?: boolean;
  /** ข้อความล่าสุด (แทน view.subtitle เช่น specialization) */
  previewLine?: string;
  previewEmphasis?: 'muted' | 'unread' | 'quote';
  trailing?: React.ReactNode;
  onClick?: () => void;
}

export function ChatPartyHeader({
  view,
  density = 'row',
  compact = false,
  previewLine,
  previewEmphasis = 'muted',
  trailing,
  onClick,
}: Props) {
  const size = compact ? 32 : density === 'header' ? 40 : 44;
  const frameClass = compact ? 'h-8 w-8' : density === 'header' ? 'h-10 w-10' : 'h-11 w-11';
  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={onClick}
      className={cn('flex w-full items-center text-left', compact ? 'gap-2' : 'gap-3')}
      aria-label='ดูข้อมูลการสนทนา'
    >
       
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-1'>
          <p
            className={cn(
              'truncate text-gray-900',
              density === 'header'
                ? compact
                  ? 'text-[16px] font-semibold leading-snug text-brand-navy-ink'
                  : 'text-sm font-semibold text-brand-navy-ink sm:text-base'
                : compact
                  ? 'text-[13px] font-semibold'
                  : 'text-sm font-semibold',
            )}
          >
            {view.title}
          </p>
          {view.verified ? <BadgeCheck size={14} className='text-brand-purple' /> : null}
        </div>
        {previewLine ? (
          <p
            className={`truncate text-xs leading-snug ${
              previewEmphasis === 'quote'
                ? 'font-medium text-[var(--brand-orange-deep)]'
                : previewEmphasis === 'unread'
                  ? 'font-medium text-[var(--neutral-text)]'
                  : 'text-gray-500'
            }`}
          >
            {previewLine}
          </p>
        ) : null}
      </div>
      {trailing}
    </Button>
  );
}
