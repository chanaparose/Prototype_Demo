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
  layout?: 'card' | 'panel' | 'list';
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
    : conv.lastMessageType === 'IM'
      ? '🖼 รูปภาพ'
      : conv.lastMessage?.trim() || conv.rfqName || '—';

  const isList = layout === 'list';

  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 text-left transition-colors',
        isList
          ? 'min-h-[68px] px-4 py-3 active:bg-black/[0.04] hover:bg-black/[0.02]'
          : 'min-h-[58px] px-3.5 py-2.5',
        !isList &&
          (layout === 'panel' && isActive
            ? 'bg-white shadow-[inset_3px_0_0_0_var(--brand-purple)]'
            : layout === 'panel' && !isActive
              ? 'hover:bg-white/70'
              : isActive
                ? 'bg-[var(--brand-page)] shadow-[inset_3px_0_0_0_var(--brand-purple)]'
                : hasUnread
                  ? 'bg-[var(--brand-page)]/35 hover:bg-[var(--brand-page)]/55'
                  : 'hover:bg-gray-50/80'),
        !isList && layout === 'panel' && hasUnread && !isActive && 'bg-[var(--brand-page)]/50',
      )}
    >
      <Avatar
        src={conv.view.avatarUrl}
        alt={conv.view.title}
        fallbackSrc={FACTORY_FALLBACK_AVATAR}
        fallback={conv.view.title.slice(0, 1)}
        className={cn(
          'shrink-0 rounded-full',
          isList ? 'h-12 w-12' : 'h-10 w-10',
        )}
        imageClassName='object-cover'
      />

      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex min-w-0 items-center gap-1'>
            <p
              className={cn(
                'truncate leading-tight text-[var(--brand-navy)]',
                isList ? 'text-[14px]' : 'text-[13px]',
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
                'shrink-0 tabular-nums leading-none',
                isList ? 'text-[11px]' : 'text-[11px]',
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
              'min-w-0 flex-1 truncate leading-tight',
              isList ? 'text-[13px]' : 'text-[12px]',
              conv.hasQuote
                ? 'font-medium text-[var(--brand-orange-deep)]'
                : hasUnread
                  ? 'font-medium text-gray-700'
                  : 'text-gray-500',
            )}
          >
            {preview}
          </p>
          {hasUnread ? (
            <span
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full bg-[var(--brand-purple)] font-bold leading-none text-white',
                isList
                  ? 'h-5 min-w-[20px] px-1.5 text-[11px]'
                  : 'h-[18px] min-w-[18px] px-1 text-[10px]',
              )}
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
