import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { MessageCircle, MessageSquareDot, RefreshCw } from 'lucide-react';
import { cn } from '@lib/utils';
import type { UiConversation } from '@/pages/messages/types';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ConversationRow } from '@/pages/messages/ConversationRow';
import { MobileSearchField } from '@/components/shared/MobileSearchField';
import { factoryIdeasChromeGradientClass, factoryIdeasContentSurfaceClass } from '@/components/features/factory-ideas/factoryIdeasTheme';
import { PageHeader } from '@/components/ui/PageHeader';

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
    <div className='-mx-4 divide-y divide-gray-100 border-y border-gray-100 bg-white'>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className='flex animate-pulse items-center gap-3 px-4 py-3'>
          <div className='h-12 w-12 shrink-0 rounded-full bg-gray-100' />
          <div className='min-w-0 flex-1 space-y-2'>
            <div className='flex justify-between gap-2'>
              <div className='h-3.5 w-28 rounded-full bg-gray-100' />
              <div className='h-3 w-10 rounded-full bg-gray-100' />
            </div>
            <div className='h-3 w-[70%] rounded-full bg-gray-100' />
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
    <div className={`md:hidden flex min-h-[100dvh] flex-col pb-20 ${factoryIdeasContentSurfaceClass}`}>
      <div className={factoryIdeasChromeGradientClass}>
        <PageHeader
          title='ข้อความ'
          subtitle='การสนทนา'
          icon={MessageCircle}
          variant='minimal'
          withBackdrop
          className='px-4 pb-3 pt-3'
        />
        <div className='flex items-center gap-2 border-slate-200 bg-white px-4 pb-3'>
          <MobileSearchField
            className='min-h-9 min-w-0 flex-1 py-1.5'
            value={searchText}
            onChange={setSearchText}
            placeholder='ค้นหาการสนทนา…'
            noShadow
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

      <div className={`flex min-h-0 flex-1 flex-col px-4 pt-3 ${factoryIdeasContentSurfaceClass}`}>
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
          <div className='-mx-4 divide-y divide-gray-100 border-y border-gray-100 bg-white'>
            {visibleConversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                layout='list'
                onClick={() => navigate(`/chat-room/${conv.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
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
