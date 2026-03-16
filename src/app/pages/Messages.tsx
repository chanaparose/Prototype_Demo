import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, MessageCircle, MessageSquareDot, Clock, ArrowRight } from 'lucide-react';
import { conversations } from '../data/mockData';
import { ChatRoomEmbedded } from './ChatRoom';

export function Messages() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(
    conversations[0]?.id ?? null
  );

  const filtered = conversations.filter(
    (c) =>
      c.factoryName.toLowerCase().includes(searchText.toLowerCase()) ||
      c.rfqName.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <>
      {/* ─── Mobile Layout (unchanged) ─── */}
      <div className="lg:hidden px-4 pt-5 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">สื่อสาร</p>
            <div className="flex items-center gap-2">
              <h1 className="text-gray-900" style={{ fontWeight: 700 }}>ข้อความ</h1>
              {totalUnread > 0 && (
                <span
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px]"
                  style={{ background: '#6C47FF', fontWeight: 700 }}
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

        {/* Conversation List */}
        {filtered.length === 0 ? (
          <MobileEmptyState />
        ) : (
          <div className="space-y-3">
            {filtered.map((conv) => (
              <ConversationCard
                key={conv.id}
                conv={conv}
                onClick={() => navigate(`/messages/${conv.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Desktop Layout (lg+) ─── */}
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
                        <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center w-[18px] h-[18px]">
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
                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">{conv.time}</span>
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

        {/* Right Panel: ChatRoom (desktop) */}
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
    </>
  );
}

function ConversationCard({
  conv,
  onClick,
}: {
  conv: (typeof conversations)[0];
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 cursor-pointer transition-all active:scale-[0.98]"
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img
            src={conv.factoryAvatar}
            alt={conv.factoryName}
            className="w-12 h-12 rounded-2xl object-cover"
          />
          {conv.hasQuote && (
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white"
              style={{ background: '#22C55E', fontWeight: 700 }}
            >
              ฿
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-0.5">
            <p className="text-sm text-gray-900 truncate" style={{ fontWeight: conv.unread > 0 ? 700 : 600 }}>
              {conv.factoryName}
            </p>
            <span className="text-[10px] text-gray-400 shrink-0 ml-2">{conv.time}</span>
          </div>
          <p className="text-[10px] text-gray-400 mb-1 truncate">{conv.rfqName}</p>
          <div className="flex items-center justify-between">
            <p
              className="text-xs truncate max-w-[180px]"
              style={{ color: conv.unread > 0 ? '#374151' : '#9CA3AF', fontWeight: conv.unread > 0 ? 500 : 400 }}
            >
              {conv.lastMessage}
            </p>
            {conv.unread > 0 && (
              <span
                className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] shrink-0 ml-2"
                style={{ background: '#6C47FF', fontWeight: 700 }}
              >
                {conv.unread}
              </span>
            )}
          </div>
        </div>
      </div>
      {conv.hasQuote && (
        <div
          className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: '#F0FDF4' }}
        >
          <span className="text-sm">💰</span>
          <span className="text-xs" style={{ color: '#16A34A', fontWeight: 600 }}>
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
        style={{ background: '#EDE9FF' }}
      >
        <MessageCircle size={36} style={{ color: '#6C47FF' }} />
      </div>
      <p className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>ยังไม่มีข้อความ</p>
      <p className="text-sm text-gray-500 max-w-[200px]">
        ข้อความจากโรงงานจะปรากฏที่นี่หลังจากที่คุณส่ง RFQ
      </p>
    </div>
  );
}
