import React from 'react';
import { useNavigate } from 'react-router';
import { Search, RefreshCw } from 'lucide-react';
import { ChatPartyHeader } from '../../components/features/chat/ChatPartyHeader';
import type { UiConversation } from './types';
import { formatConversationTime } from './types';

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
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-4 border border-gray-50 animate-pulse flex gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-4/5" />
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
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: '#7A4B94' }}>สื่อสาร</p>
          <div className="flex items-center gap-2">
            <h1 style={{ fontWeight: 700, color: '#2E2252' }}>
              ข้อความ
            </h1>
            {totalUnread > 0 && (
              <span
                className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px]"
                style={{ background: '#E38844', fontWeight: 700 }}
              >
                {totalUnread}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 mb-5">
        <Search size={18} className="text-gray-400 shrink-0" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="ค้นหาการสนทนา..."
          className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <p className="text-sm text-gray-600 px-4">{error}</p>
          <button
            type="button"
            onClick={() => void onReload()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#7A4B94' }}
          >
            <RefreshCw size={16} />
            ลองอีกครั้ง
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <MobileEmptyState />
      ) : (
        <div className="space-y-3">
          {filtered.map((conv) => (
            <ConversationCard
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

function ConversationCard({
  conv,
  onClick,
}: {
  conv: UiConversation;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 cursor-pointer transition-all active:scale-[0.98]"
    >
      <div className="space-y-1.5">
        <ChatPartyHeader
          view={conv.view}
          density="row"
          trailing={
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-gray-400">
                {formatConversationTime(conv.lastMessageAt || conv.updatedAt)}
              </span>
              {conv.unread > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-[#A238FF] text-white text-[10px]">
                  {conv.unread}
                </span>
              ) : null}
            </div>
          }
        />
        <div className="pl-[56px]">
          <p className="text-[10px] mb-1 truncate" style={{ color: '#7A4B94' }}>{conv.rfqName}</p>
          <p className="text-xs truncate max-w-[220px]" style={{ color: conv.unread > 0 ? '#374151' : '#9CA3AF' }}>
            {conv.lastMessage}
          </p>
        </div>
      </div>
      {conv.hasQuote && (
        <div
          className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: '#FFF4E8' }}
        >
          <span className="text-sm">💰</span>
          <span className="text-xs" style={{ color: '#E38844', fontWeight: 600 }}>
            มีใบเสนอราคาใหม่ — กดเพื่อดู
          </span>
        </div>
      )}
    </div>
  );
}

function MobileEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
        style={{ background: 'linear-gradient(135deg, #F8F6FA, rgba(122,75,148,0.12))' }}
      >
        <span className="text-3xl" style={{ color: '#7A4B94' }}>
          💬
        </span>
      </div>
      <p className="mb-1" style={{ fontWeight: 600, color: '#2E2252' }}>
        ยังไม่มีข้อความ
      </p>
      <p className="text-sm text-gray-500 max-w-[200px]">
        ข้อความจากโรงงานจะปรากฏที่นี่หลังจากที่คุณส่ง RFQ
      </p>
    </div>
  );
}
