import React from 'react';
import { Search, MessageCircle, MessageSquareDot, RefreshCw } from 'lucide-react';
import { ChatRoomEmbedded } from '@/pages/chat-room';
import { ChatPartyHeader } from '@/components/features/chat/ChatPartyHeader';
import type { UiConversation } from '@/pages/messages/types';
import { formatConversationTime } from '@/pages/messages/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    <div className='py-2 space-y-0'>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className='flex items-start gap-3 px-4 py-3.5 animate-pulse'>
          <div className='w-11 h-11 rounded-xl bg-gray-200 shrink-0' />
          <div className='flex-1 space-y-2 pt-0.5'>
            <div className='h-3.5 bg-gray-200 rounded w-3/5' />
            <div className='h-3 bg-gray-100 rounded w-2/5' />
            <div className='h-3 bg-gray-100 rounded w-4/5' />
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
  return (
    <div className='hidden lg:flex' style={{ height: 'calc(100vh - 0px)' }}>
      {/* Left Panel: Conversation List */}
      <div className='w-80 xl:w-96 border-r border-gray-200 flex flex-col bg-white shrink-0'>
        {/* Header */}
        <div className='px-5 pt-6 pb-4 border-b border-gray-100'>
          <div className='flex items-center gap-2 mb-4'>
            <h2 className='text-lg font-bold' style={{ color: 'var(--brand-navy)' }}>
              ข้อความ
            </h2>
            {totalUnread > 0 && (
              <span
                className='w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold'
                style={{ background: 'var(--brand-orange-deep)' }}
              >
                {totalUnread}
              </span>
            )}
          </div>
          {/* Search */}
          <div className='flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-100'>
            <Search size={15} className='text-gray-400 shrink-0' />
            <Input
              type='text'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder='ค้นหาการสนทนา...'
              className='flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400'
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className='flex-1 overflow-y-auto'>
          {loading ? (
            <ListSkeleton />
          ) : error ? (
            <div className='flex flex-col items-center justify-center py-10 px-5 text-center gap-3'>
              <p className='text-sm text-gray-600'>{error}</p>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => void onReload()}
                className='inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white'
                style={{ background: 'var(--brand-mauve)' }}
              >
                <RefreshCw size={16} />
                ลองอีกครั้ง
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 px-5 text-center'>
              <div
                className='w-14 h-14 rounded-2xl flex items-center justify-center mb-3'
                style={{ background: 'rgba(122,75,148,0.10)' }}
              >
                <MessageCircle size={26} style={{ color: 'var(--brand-mauve)' }} />
              </div>
              <p className='font-semibold text-sm mb-1' style={{ color: 'var(--brand-navy)' }}>
                ยังไม่มีข้อความ
              </p>
              <p className='text-xs text-gray-400'>ข้อความจะปรากฏหลังจากส่ง RFQ</p>
            </div>
          ) : (
            <div className='py-2'>
              {filtered.map((conv) => {
                const isActive = conv.id === selectedId;
                return (
                  <Button
                    variant='unstyled'
                    key={conv.id}
                    type='button'
                    onClick={() => setSelectedId(conv.id)}
                    className='w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors'
                    style={{
                      backgroundColor: isActive ? 'var(--brand-page)' : 'transparent',
                      borderLeft: isActive
                        ? '3px solid var(--brand-mauve)'
                        : '3px solid transparent',
                    }}
                  >
                    <div className='flex-1 min-w-0'>
                      <ChatPartyHeader
                        view={conv.view}
                        density='row'
                        trailing={
                          <div className='flex flex-col items-end gap-1'>
                            <span className='text-[10px] text-gray-400 shrink-0 ml-2'>
                              {formatConversationTime(conv.lastMessageAt || conv.updatedAt)}
                            </span>
                            {conv.unread > 0 ? (
                              <span className='w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] shrink-0 ml-2 font-bold bg-brand-purple'>
                                {conv.unread}
                              </span>
                            ) : null}
                          </div>
                        }
                      />
                      <p
                        className='text-[10px] mb-0.5 truncate'
                        style={{ color: 'var(--brand-mauve)' }}
                      >
                        {conv.rfqName}
                      </p>
                      <div className='flex items-center justify-between'>
                        <p
                          className='text-xs truncate'
                          style={{
                            color:
                              conv.unread > 0
                                ? 'var(--neutral-text)'
                                : 'var(--neutral-placeholder)',
                            fontWeight: conv.unread > 0 ? 500 : 400,
                          }}
                        >
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Chat */}
      <div className='flex-1 flex flex-col bg-gray-50'>
        {selectedId ? (
          <div className='h-full px-6 py-5'>
            <ChatRoomEmbedded
              conversationId={selectedId}
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
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center flex-1'>
            <div
              className='w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5'
              style={{ background: 'linear-gradient(135deg, var(--brand-navy-deep), #4A267D)' }}
            >
              <MessageSquareDot size={36} style={{ color: '#EBD3FF' }} />
            </div>
            <h3 className='font-bold text-lg mb-2' style={{ color: 'var(--brand-navy)' }}>
              เลือกการสนทนา
            </h3>
            <p className='text-gray-500 text-sm leading-relaxed mb-2'>
              เลือกการสนทนาจากรายการทางซ้ายเพื่อเริ่มแชทกับโรงงาน
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
