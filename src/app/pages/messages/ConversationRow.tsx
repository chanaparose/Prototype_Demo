import { BadgeCheck } from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { FACTORY_FALLBACK_AVATAR } from '@/utils/counterparty';
import type { UiConversation } from '@/pages/messages/types';
import { formatConversationListTime } from '@/pages/messages/types';

type ConversationRowProps = {
  conv: UiConversation;
  onClick: () => void;
  isActive?: boolean;
  layout?: 'card' | 'panel';
};

export function ConversationRow({
  conv,
  onClick,
  isActive = false,
  layout = 'card',
}: ConversationRowProps) {
  const time = formatConversationListTime(conv.lastMessageAt || conv.updatedAt);
  const hasUnread = conv.unread > 0;

  const preview = conv.hasQuote
    ? 'มีใบเสนอราคาใหม่'
    : conv.lastMessage?.trim() || conv.rfqName || '—';

  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={onClick}
      className={cn(
        'flex w-full min-h-[58px] items-center gap-3 px-3.5 py-2.5 text-left transition-colors',
        layout === 'panel' && isActive
          ? 'bg-white shadow-[inset_3px_0_0_0_var(--brand-purple)]'
          : layout === 'panel' && !isActive
            ? 'hover:bg-white/70'
            : isActive
              ? 'bg-[var(--brand-page)] shadow-[inset_3px_0_0_0_var(--brand-purple)]'
              : hasUnread
                ? 'bg-[var(--brand-page)]/35 hover:bg-[var(--brand-page)]/55'
                : 'hover:bg-gray-50/80',
        layout === 'panel' && hasUnread && !isActive && 'bg-[var(--brand-page)]/50',
      )}
    >
      <Avatar
        src={conv.view.avatarUrl}
        alt={conv.view.title}
        fallbackSrc={FACTORY_FALLBACK_AVATAR}
        fallback={conv.view.title.slice(0, 1)}
        className='h-10 w-10 shrink-0 rounded-full'
        imageClassName='object-cover'
      />

      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex min-w-0 items-center gap-1'>
            <p
              className={cn(
                'truncate text-[13px] leading-tight text-[var(--brand-navy)]',
                hasUnread || isActive ? 'font-bold' : 'font-semibold',
              )}
            >
              {conv.view.title}
            </p>
            {conv.view.verified ? (
              <BadgeCheck size={12} className='shrink-0 text-[var(--brand-purple)]' />
            ) : null}
          </div>
          {time ? (
            <span
              className={cn(
                'shrink-0 text-[11px] tabular-nums leading-none',
                hasUnread ? 'font-semibold text-[var(--brand-purple)]' : 'text-gray-400',
              )}
            >
              {time}
            </span>
          ) : null}
        </div>

        <div className='mt-0.5 flex items-center gap-2'>
          <p
            className={cn(
              'min-w-0 flex-1 truncate text-[12px] leading-tight',
              conv.hasQuote
                ? 'font-medium text-[var(--brand-orange-deep)]'
                : hasUnread
                  ? 'font-medium text-gray-600'
                  : 'text-gray-400',
            )}
          >
            {preview}
          </p>
          {hasUnread ? (
            <span
              className='flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--brand-purple)] px-1 text-[10px] font-bold leading-none text-white'
              aria-label={`${conv.unread} ข้อความใหม่`}
            >
              {conv.unread > 99 ? '99+' : conv.unread}
            </span>
          ) : null}
        </div>
      </div>
    </Button>
  );
}
