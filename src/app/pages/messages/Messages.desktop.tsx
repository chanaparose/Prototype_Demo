import React from 'react';
import { Search, MessageCircle, MessageSquareDot } from 'lucide-react';
import { conversations } from '../../data/mockData';
import { ChatRoomEmbedded } from '../chat-room';

type MessagesDesktopProps = {
  searchText: string;
  setSearchText: (v: string) => void;
  filtered: typeof conversations;
  totalUnread: number;
  selectedId: string | null;
  setSelectedId: (v: string) => void;
};

export function MessagesDesktop({
  searchText,
  setSearchText,
  filtered,
  totalUnread,
  selectedId,
  setSelectedId,
}: MessagesDesktopProps) {
  return (
    <div className="hidden lg:flex" style={{ height: 'calc(100vh - 0px)' }}>
      {/* Left Panel: Conversation List */}
      <div className="w-80 xl:w-96 border-r border-gray-200 flex flex-col bg-white shrink-0">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-gray-900">ข้อความ</h2>
            {totalUnread > 0 && (
              <span
                className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold"
                style={{ background: '#6C47FF' }}
              >
                {totalUnread}
              </span>
            )}
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-100">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="ค้นหาการสนทนา..."
              className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: '#EDE9FF' }}
              >
                <MessageCircle size={26} style={{ color: '#6C47FF' }} />
              </div>
              <p className="text-gray-700 font-semibold text-sm mb-1">ยังไม่มีข้อความ</p>
              <p className="text-xs text-gray-400">ข้อความจะปรากฏหลังจากส่ง RFQ</p>
            </div>
          ) : (
            <div className="py-2">
              {filtered.map((conv) => {
                const isActive = conv.id === selectedId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors"
                    style={{
                      backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                    }}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conv.factoryAvatar}
                        alt={conv.factoryName}
                        className="w-11 h-11 rounded-xl object-cover"
                      />
                      {conv.hasQuote && (
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center w-[18px] h-[18px]">
                          ฿
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-0.5">
                        <p
                          className="text-sm text-gray-900 truncate"
                          style={{ fontWeight: conv.unread > 0 ? 700 : 600 }}
                        >
                          {conv.factoryName}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                          {conv.time}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mb-0.5 truncate">{conv.rfqName}</p>
                      <div className="flex items-center justify-between">
                        <p
                          className="text-xs truncate"
                          style={{
                            color: conv.unread > 0 ? '#374151' : '#9CA3AF',
                            fontWeight: conv.unread > 0 ? 500 : 400,
                          }}
                        >
                          {conv.lastMessage}
                        </p>
                        {conv.unread > 0 && (
                          <span
                            className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] shrink-0 ml-2 font-bold"
                            style={{ background: '#6C47FF' }}
                          >
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Chat */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedId ? (
          <div className="h-full px-6 py-5">
            <ChatRoomEmbedded conversationId={selectedId} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg, #EDE9FF, #DDD6FE)' }}
            >
              <MessageSquareDot size={36} style={{ color: '#6C47FF' }} />
            </div>
            <h3 className="text-gray-900 font-bold text-lg mb-2">เลือกการสนทนา</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-2">
              เลือกการสนทนาจากรายการทางซ้ายเพื่อเริ่มแชทกับโรงงาน
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

