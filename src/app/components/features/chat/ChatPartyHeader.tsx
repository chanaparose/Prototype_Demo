import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { cn } from '@lib/utils';
import type { CounterpartyView } from '@/utils/counterparty';
import { FACTORY_FALLBACK_AVATAR } from '@/utils/counterparty';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

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
  const isHeader = density === 'header';
  const size = compact ? 36 : isHeader ? 40 : 44;
  const frameClass = compact ? 'h-9 w-9' : isHeader ? 'h-10 w-10' : 'h-11 w-11';

  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={onClick}
      className={cn('flex w-full min-w-0 items-center text-left', compact ? 'gap-2.5' : 'gap-3')}
      aria-label='ดูข้อมูลการสนทนา'
    >
      {isHeader ? (
        <Avatar
          src={view.avatarUrl}
          alt={view.title}
          fallbackSrc={FACTORY_FALLBACK_AVATAR}
          fallback={view.title.slice(0, 1)}
          className={cn(frameClass, 'shrink-0 rounded-full')}
          imageClassName='object-cover'
          style={{ width: size, height: size }}
        />
      ) : null}

      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-1'>
          <p
            className={cn(
              'truncate text-gray-900',
              isHeader
                ? 'text-[14px] font-semibold leading-tight'
                : compact
                  ? 'text-[13px] font-semibold'
                  : 'text-sm font-semibold',
            )}
          >
            {view.title}
          </p>
          {view.verified ? (
            <BadgeCheck size={isHeader ? 13 : 14} className='shrink-0 text-brand-purple' />
          ) : null}
        </div>
        {previewLine ? (
          <p
            className={cn(
              'truncate text-[12px] leading-snug',
              previewEmphasis === 'quote'
                ? 'font-medium text-[var(--brand-orange-deep)]'
                : previewEmphasis === 'unread'
                  ? 'font-medium text-[var(--neutral-text)]'
                  : 'text-gray-500',
            )}
          >
            {previewLine}
          </p>
        ) : null}
      </div>
      {trailing}
    </Button>
  );
}
