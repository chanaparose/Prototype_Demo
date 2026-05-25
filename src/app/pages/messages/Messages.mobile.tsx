import React from 'react';
import { useNavigate } from 'react-router';
import { BadgeCheck, RefreshCw } from 'lucide-react';
import { cn } from '@lib/utils';
import type { UiConversation } from '@/pages/messages/types';
import { formatConversationListTime } from '@/pages/messages/types';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MobileSearchField } from '@/components/shared/MobileSearchField';
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
    <div className='space-y-2 px-4'>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className='flex animate-pulse items-center gap-2.5 rounded-2xl border border-white/70 bg-white/85 px-3 py-2.5 shadow-[0_2px_14px_rgba(46,34,82,0.06)]'
        >
          <div className='h-11 w-11 shrink-0 rounded-full bg-[var(--brand-lavender)]' />
          <div className='flex-1 space-y-1.5'>
            <div className='flex justify-between gap-2'>
              <div className='h-3.5 w-24 rounded-full bg-[var(--brand-lavender-muted)]' />
              <div className='h-3 w-9 rounded-full bg-[var(--brand-lavender)]' />
            </div>
            <div className='h-3 w-[85%] rounded-full bg-[var(--brand-lavender)]' />
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
    <div className='md:hidden flex min-h-full flex-col pb-20 bg-[linear-gradient(180deg,var(--brand-lavender)_0%,var(--brand-page)_45%,var(--neutral-white)_100%)]'>
      <div className='px-4 pt-5 pb-3'>
        <p className='text-[10px] uppercase tracking-wider font-semibold mb-0.5 text-[#C4A484]'>
          สื่อสาร
        </p>
        <h1 className='inline-flex items-center gap-2 text-xl font-bold text-brand-navy-deep'>
          ข้อความ
          {totalUnread > 0 ? (
            <span className='inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange-deep px-1.5 text-[10px] font-bold leading-none text-white'>
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          ) : null}
        </h1>
      </div>

      <div className='px-4 flex gap-2.5 items-stretch mb-4'>
        <MobileSearchField
          className='flex-1 min-w-0'
          value={searchText}
          onChange={setSearchText}
          placeholder='ค้นหาการสนทนา…'
        />
      </div>

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
        <div className='space-y-2 px-4'>
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
      className='flex w-full items-center gap-2.5 rounded-2xl border border-white/75 bg-white/92 px-3 py-2.5 text-left shadow-[0_3px_14px_rgba(46,34,82,0.06)] transition-all hover:border-[var(--brand-violet-soft)] hover:shadow-[0_6px_18px_rgba(46,34,82,0.1)] active:scale-[0.995]'
    >
      <div className='relative shrink-0'>
        <Avatar
          src={conv.view.avatarUrl}
          alt={conv.view.title}
          fallbackSrc={FACTORY_FALLBACK_AVATAR}
          fallback={conv.view.title.slice(0, 1)}
          className='h-11 w-11 rounded-full ring-1 ring-white'
          imageClassName='object-cover'
        />
      </div>

      <div className='min-h-[44px] min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex min-w-0 items-center gap-0.5'>
            <p
              className={cn(
                'truncate text-[14px] leading-tight text-[var(--brand-navy)]',
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
            <span className='shrink-0 text-[11px] tabular-nums leading-none text-[#9BB5C0]'>
              {time}
            </span>
          ) : null}
        </div>

        <div className='mt-0.5 flex items-center justify-between gap-2'>
          <p
            className={cn(
              'min-w-0 flex-1 truncate text-[12px] leading-tight',
              conv.hasQuote
                ? 'font-medium text-[var(--brand-orange-deep)]'
                : hasUnread
                  ? 'text-[#5F7A88]'
                  : 'text-[#8BAFBC]',
            )}
          >
            {preview}
          </p>
          {hasUnread ? (
            <span
              className='flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--brand-violet-soft)] px-1 text-[10px] font-bold leading-none text-[var(--brand-purple)]'
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
