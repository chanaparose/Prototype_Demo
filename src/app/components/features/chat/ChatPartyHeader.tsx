import React from 'react';
import { BadgeCheck } from 'lucide-react';
import type { CounterpartyView } from '@/utils/counterparty';
import { FACTORY_FALLBACK_AVATAR } from '@/utils/counterparty';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

interface Props {
  view: CounterpartyView;
  density?: 'row' | 'header';
  /** ข้อความล่าสุด (แทน view.subtitle เช่น specialization) */
  previewLine?: string;
  previewEmphasis?: 'muted' | 'unread' | 'quote';
  trailing?: React.ReactNode;
  onClick?: () => void;
}

export function ChatPartyHeader({
  view,
  density = 'row',
  previewLine,
  previewEmphasis = 'muted',
  trailing,
  onClick,
}: Props) {
  const size = density === 'header' ? 40 : 44;
  const frameClass = density === 'header' ? 'h-10 w-10' : 'h-11 w-11';
  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={onClick}
      className='w-full flex items-center gap-3 text-left'
      aria-label='ดูข้อมูลการสนทนา'
    >
      <Avatar
        src={view.avatarUrl}
        alt={view.title}
        fallbackSrc={FACTORY_FALLBACK_AVATAR}
        fallback={view.title.slice(0, 1)}
        className={`${frameClass} shrink-0`}
        imageClassName='object-cover'
        style={{ width: size, height: size }}
      />
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-1'>
          <p className='truncate text-sm text-gray-900' style={{ fontWeight: 600 }}>
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
