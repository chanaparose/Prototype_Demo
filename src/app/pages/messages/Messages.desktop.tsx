import React, { useMemo, useState } from 'react';
import { MessageCircle, MessageSquareDot, RefreshCw } from 'lucide-react';
import { cn } from '@lib/utils';
import { ChatRoomEmbedded } from '@/pages/chat-room';
import { ConversationRow } from '@/pages/messages/ConversationRow';
import type { UiConversation } from '@/pages/messages/types';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MobileSearchField } from '@/components/shared/MobileSearchField';
import { PageHeader } from '@/components/ui/PageHeader';

type MessagesDesktopProps = {
  searchText: string;
  setSearchText: (v: string) => void;
  filtered: UiConversation[];
  totalUnread: number;
  loading: boolean;
  error: string | null;
  onReload: () => void;
  selectedId: string | null;
  setSelectedId: (v: string) => void;
  selectedConversation: UiConversation | null;
};

function ListSkeleton() {
  return (
    <div className='divide-y divide-gray-100'>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className='flex animate-pulse items-center gap-3 px-4 py-3'>
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

export function MessagesDesktop({
  searchText,
  setSearchText,
  filtered,
  totalUnread,
  loading,
  error,
  onReload,
  selectedId,
  setSelectedId,
  selectedConversation,
}: MessagesDesktopProps) {
  const [unreadOnly, setUnreadOnly] = useState(false);

  const visibleConversations = useMemo(() => {
    if (!unreadOnly) return filtered;
    return filtered.filter((c) => c.unread > 0);
  }, [filtered, unreadOnly]);

  return (
    <div className='hidden h-[calc(100dvh)] w-full overflow-hidden bg-white lg:flex'>
      <aside className='flex w-[min(100%,340px)] min-w-[300px] max-w-[380px] shrink-0 flex-col border-r border-gray-100 bg-[var(--neutral-warm-surface)]/40'>
        <header className='shrink-0 border-b border-gray-100 bg-white px-4 pb-3 pt-5'>
          <div className='mb-3 flex items-start justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <PageHeader
                title='ข้อความ'
                subtitle='การสนทนา'
                icon={MessageCircle}
                variant='minimal'
                withBackdrop={false}
                className='pb-0'
              />
            </div>
            {!loading && !error ? (
              <span className='mt-1 shrink-0 rounded-md border border-gray-200 bg-[var(--brand-page)] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-gray-500'>
                {visibleConversations.length} รายการ
              </span>
            ) : null}
          </div>

          <div className='flex items-center gap-2'>
            <MobileSearchField
              className='min-h-9 min-w-0 flex-1 border-gray-200 bg-[var(--brand-page)] py-1.5 text-xs shadow-none'
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
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50',
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
        </header>

        <div className='min-h-0 flex-1 overflow-y-auto'>
          {loading ? (
            <ListSkeleton />
          ) : error ? (
            <div className='flex flex-col items-center justify-center gap-3 px-4 py-14 text-center'>
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
            <DesktopEmptyState unreadOnly={unreadOnly} />
          ) : (
            <div className='divide-y divide-gray-100/90'>
              {visibleConversations.map((conv) => (
                <ConversationRow
                  key={conv.id}
                  conv={conv}
                  layout='panel'
                  isActive={conv.id === selectedId}
                  onClick={() => setSelectedId(conv.id)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className='flex min-w-0 flex-1 flex-col bg-white'>
        {selectedId ? (
          <ChatRoomEmbedded
            conversationId={selectedId}
            embeddedShell='panel'
            preview={
              selectedConversation
                ? {
                    factoryId: String(selectedConversation.conv.factory_id),
                    factoryName: selectedConversation.view.title,
                    factoryImage: selectedConversation.view.avatarUrl,
                    rfqName: selectedConversation.rfqName,
                    hasQuote: selectedConversation.hasQuote,
                  }
                : undefined
            }
          />
        ) : (
          <ChatPlaceholder />
        )}
      </main>
    </div>
  );
}

function ChatPlaceholder() {
  return (
    <div className='relative flex flex-1 flex-col items-center justify-center overflow-hidden px-8'>
      <div
        className='pointer-events-none absolute inset-0 opacity-[0.35]'
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, var(--brand-lavender) 0%, transparent 42%), radial-gradient(circle at 80% 70%, rgba(227,136,68,0.12) 0%, transparent 36%)',
        }}
        aria-hidden
      />
      <EmptyState
        title='เลือกการสนทนา'
        description='เลือกการสนทนาจากรายการทางซ้ายเพื่อเริ่มแชทกับโรงงาน'
        className='relative z-[1] max-w-sm py-10'
        icon={<MessageSquareDot size={28} className='text-[var(--brand-mauve)]' />}
      />
    </div>
  );
}

function DesktopEmptyState({ unreadOnly }: { unreadOnly: boolean }) {
  return (
    <div className='flex flex-col items-center justify-center px-4 py-14'>
      <EmptyState
        title={unreadOnly ? 'ไม่มีข้อความที่ยังไม่อ่าน' : 'ยังไม่มีข้อความ'}
        description={
          unreadOnly
            ? 'ข้อความใหม่จะแสดงเมื่อมีการตอบกลับจากโรงงาน'
            : 'ข้อความจากโรงงานจะปรากฏที่นี่หลังจากที่คุณส่ง RFQ'
        }
        className='py-4'
        icon={<MessageCircle size={26} className='text-[var(--brand-mauve)]' />}
      />
    </div>
  );
}
