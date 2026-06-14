import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { BadgeCheck, MessageCircle, MessageSquareDot, RefreshCw } from 'lucide-react';
import { cn } from '@lib/utils';
import type { UiConversation } from '@/pages/messages/types';
import { formatConversationListTime } from '@/pages/messages/types';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { FACTORY_FALLBACK_AVATAR } from '@/utils/counterparty';
import { MobileSearchField } from '@/components/shared/MobileSearchField';

type MessagesMobileProps = {
  searchText: string;
  setSearchText: (v: string) => void;
  filtered: UiConversation[];
  totalUnread: number;
  loading: boolean;
  error: string | null;
  onReload: () => void;
};

function ListSkeleton() {
  return (
    <div className='overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100'>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className='flex animate-pulse items-center gap-3 px-3.5 py-2.5'>
          <div className='h-10 w-10 shrink-0 rounded-full bg-[var(--brand-lavender)]' />
          <div className='min-w-0 flex-1 space-y-1.5'>
            <div className='flex justify-between gap-2'>
              <div className='h-3 w-28 rounded-full bg-[var(--brand-lavender-muted)]' />
              <div className='h-2.5 w-8 rounded-full bg-[var(--brand-lavender)]' />
            </div>
            <div className='h-2.5 w-[75%] rounded-full bg-[var(--brand-lavender)]' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessagesMobile({
  searchText,
  setSearchText,
  filtered,
  totalUnread,
  loading,
  error,
  onReload,
}: MessagesMobileProps) {
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const visibleConversations = useMemo(() => {
    if (!unreadOnly) return filtered;
    return filtered.filter((c) => c.unread > 0);
  }, [filtered, unreadOnly]);

  return (
    <div className='md:hidden flex min-h-[100dvh] flex-col bg-[var(--brand-page)] pb-20'>
      <div className='border-b border-gray-100 bg-white'>
        <div className='px-4 pt-3 pb-2'>
          <p className='text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-orange-deep)]'>
            การสนทนา
          </p>
          <h1 className='text-lg font-bold leading-tight text-[var(--brand-navy)]'>ข้อความ</h1>
        </div>
        <div className='flex items-center gap-2 px-4 pb-3'>
          <MobileSearchField
            className='min-h-9 min-w-0 flex-1 py-1.5'
            value={searchText}
            onChange={setSearchText}
            placeholder='ค้นหาการสนทนา…'
          />
          <Button
            variant='unstyled'
            type='button'
            onClick={() => setUnreadOnly((v) => !v)}
            aria-label={unreadOnly ? 'แสดงทั้งหมด' : 'กรองเฉพาะยังไม่อ่าน'}
            aria-pressed={unreadOnly}
            title={unreadOnly ? 'แสดงทั้งหมด' : 'เฉพาะยังไม่อ่าน'}
            className={cn(
              'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
              unreadOnly
                ? 'border-brand-purple/35 bg-[var(--brand-page)] text-brand-purple'
                : 'border-gray-200 text-gray-500 active:bg-gray-50',
            )}
          >
            <MessageSquareDot size={17} strokeWidth={2.25} />
            {!unreadOnly && totalUnread > 0 ? (
              <span className='absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--brand-purple)] px-1 text-[9px] font-bold leading-none text-white'>
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      <div className='flex min-h-0 flex-1 flex-col bg-[var(--brand-page)] px-4 pt-3'>
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-3 px-6 py-14 text-center'>
            <p className='text-sm text-[var(--neutral-subtle)]'>{error}</p>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => void onReload()}
              className='inline-flex items-center gap-2 rounded-xl bg-[var(--brand-mauve)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm'
            >
              <RefreshCw size={16} />
              ลองอีกครั้ง
            </Button>
          </div>
        ) : visibleConversations.length === 0 ? (
          <MobileEmptyState unreadOnly={unreadOnly} />
        ) : (
          <div className='overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100'>
            {visibleConversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                onClick={() => navigate(`/chat-room/${conv.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationRow({
  conv,
  onClick,
}: {
  conv: UiConversation;
  onClick: () => void;
}) {
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
        'flex w-full min-h-[58px] items-center gap-3 px-3.5 py-2.5 text-left transition-colors active:bg-gray-50/90',
        hasUnread && 'bg-[var(--brand-page)]/35',
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
                hasUnread ? 'font-bold' : 'font-semibold',
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

function MobileEmptyState({ unreadOnly }: { unreadOnly: boolean }) {
  return (
    <div className='flex min-h-0 flex-1 flex-col items-center justify-center px-4'>
      <EmptyState
        title={unreadOnly ? 'ไม่มีข้อความที่ยังไม่อ่าน' : 'ยังไม่มีข้อความ'}
        description={
          unreadOnly
            ? 'ข้อความใหม่จะแสดงเมื่อมีการตอบกลับจากโรงงาน'
            : 'ข้อความจากโรงงานจะปรากฏที่นี่หลังจากที่คุณส่ง RFQ'
        }
        className='py-10'
        icon={
          <span
            className='flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-lavender)] text-2xl'
            style={{ color: 'var(--brand-mauve)' }}
          >
            <MessageCircle size={26} />
          </span>
        }
      />
    </div>
  );
}
