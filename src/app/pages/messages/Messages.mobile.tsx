import React from 'react';
import { useNavigate } from 'react-router';
import { BadgeCheck, RefreshCw, Search } from 'lucide-react';
import { cn } from '@lib/utils';
import type { UiConversation } from '@/pages/messages/types';
import { formatConversationListTime } from '@/pages/messages/types';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { FACTORY_FALLBACK_AVATAR } from '@/utils/counterparty';

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
    <div className='space-y-0 px-4'>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className='flex animate-pulse items-center gap-3.5 py-3'>
          <div className='h-12 w-12 shrink-0 rounded-full bg-[var(--brand-lavender)]' />
          <div className='flex-1 space-y-1.5'>
            <div className='flex justify-between gap-2'>
              <div className='h-3.5 w-24 rounded-full bg-[var(--brand-lavender-muted)]' />
              <div className='h-3 w-8 rounded-full bg-[var(--brand-lavender)]' />
            </div>
            <div className='h-3 w-[70%] rounded-full bg-[var(--brand-lavender)]' />
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

  return (
    <div
      className={cn(
        'md:hidden flex flex-col pb-20',
        'min-h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-bottom,0px))]',
        'bg-[linear-gradient(180deg,var(--brand-lavender)_0%,var(--brand-page)_42%,var(--neutral-white)_100%)]',
      )}
    >
      {/* ── Header ── */}
      <div className='px-4 pt-5 pb-2 flex items-center justify-between'>
        {/* Left: placeholder (avatar / back button) */}
        <div className='w-9' />

        {/* Center: title */}
        <h1 className='text-[17px] font-bold text-[var(--brand-navy-deep)]'>ข้อความ</h1>

        {/* Right: unread badge pill */}
        <div className='w-9 flex justify-end'>
          {totalUnread > 0 ? (
            <span className='flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[var(--brand-mauve)] px-1.5 text-[11px] font-bold text-white'>
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className='px-4 pb-3'>
        <label className='flex items-center gap-2 rounded-full bg-[var(--brand-lavender-muted)]/60 px-4 py-2.5 border border-[var(--brand-lavender-muted)]'>
          <Search size={15} className='shrink-0 text-[var(--neutral-placeholder)]' />
          <input
            type='search'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder='ค้นหา'
            className='flex-1 bg-transparent text-sm text-[var(--brand-navy)] placeholder:text-[var(--neutral-placeholder)] outline-none'
          />
        </label>
      </div>

      {/* ── List ── */}
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <div className='flex flex-col items-center justify-center gap-3 px-6 py-14 text-center'>
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
      ) : filtered.length === 0 ? (
        <MobileEmptyState />
      ) : (
        <div className='px-4 divide-y divide-[var(--brand-lavender-muted)]/50'>
          {filtered.map((conv) => (
            <ConversationRow
              key={conv.id}
              conv={conv}
              onClick={() => navigate(`/chat-room/${conv.id}`)}
            />
          ))}
        </div>
      )}
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
      className='flex w-full items-center gap-3.5 py-3 text-left transition-opacity active:opacity-70'
    >
      {/* Avatar */}
      <div className='relative shrink-0'>
        <Avatar
          src={conv.view.avatarUrl}
          alt={conv.view.title}
          fallbackSrc={FACTORY_FALLBACK_AVATAR}
          fallback={conv.view.title.slice(0, 1)}
          className='h-12 w-12 rounded-full'
          imageClassName='object-cover'
        />
        {/* Unread dot on avatar */}
        {hasUnread ? (
          <span className='absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[var(--brand-purple)] ring-2 ring-white' />
        ) : null}
      </div>

      {/* Text content */}
      <div className='min-w-0 flex-1'>
        {/* Row 1: name + timestamp */}
        <div className='flex items-baseline justify-between gap-2'>
          <div className='flex min-w-0 items-center gap-1'>
            <p
              className={cn(
                'truncate text-[14.5px] leading-tight text-[var(--brand-navy)]',
                hasUnread ? 'font-bold' : 'font-semibold',
              )}
            >
              {conv.view.title}
            </p>
            {conv.view.verified ? (
              <BadgeCheck size={13} className='shrink-0 text-[var(--brand-purple)]' />
            ) : null}
          </div>
          {time ? (
            <span
              className={cn(
                'shrink-0 text-[12px] tabular-nums leading-none',
                hasUnread ? 'text-[var(--brand-purple)] font-semibold' : 'text-[var(--neutral-placeholder)]',
              )}
            >
              {time}
            </span>
          ) : null}
        </div>

        {/* Row 2: preview + unread count */}
        <div className='mt-0.5 flex items-center justify-between gap-2'>
          <p
            className={cn(
              'min-w-0 flex-1 truncate text-[13px] leading-tight',
              conv.hasQuote
                ? 'font-medium text-[var(--brand-orange-deep)]'
                : hasUnread
                  ? 'font-medium text-[var(--brand-navy)]/80'
                  : 'text-[var(--neutral-placeholder)]',
            )}
          >
            {preview}
          </p>
          {hasUnread ? (
            <span
              className='flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[var(--brand-purple)] px-1.5 text-[10px] font-bold leading-none text-white'
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

function MobileEmptyState() {
  return (
    <EmptyState
      title='ยังไม่มีข้อความ'
      description='ข้อความจากโรงงานจะปรากฏที่นี่หลังจากที่คุณส่ง RFQ'
      className='py-16'
      icon={
        <span
          className='flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-lavender)] text-2xl'
          style={{ color: 'var(--brand-mauve)' }}
        >
          💬
        </span>
      }
    />
  );
}
