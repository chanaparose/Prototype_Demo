import React from 'react';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';
type MessagesMobileProps = {
  searchText: string;
  setSearchText: (v: string) => void;
  filtered: any[];
  totalUnread: number;
};

export function MessagesMobile({
  searchText,
  setSearchText,
  filtered,
  totalUnread,
}: MessagesMobileProps) {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">สื่อสาร</p>
          <div className="flex items-center gap-2">
            <h1 className="text-gray-900" style={{ fontWeight: 700 }}>
              ข้อความ
            </h1>
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
  );
}

function ConversationCard({
  conv,
  onClick,
}: {
  conv: any;
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
          <p className="text-[10px] text-gray-400 mb-1 truncate">{conv.rfqName}</p>
          <div className="flex items-center justify-between">
            <p
              className="text-xs truncate max-w-[180px]"
              style={{
                color: conv.unread > 0 ? '#374151' : '#9CA3AF',
                fontWeight: conv.unread > 0 ? 500 : 400,
              }}
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
        {/* icon is handled by parent before split; keep simple */}
        <span className="text-3xl" style={{ color: '#6C47FF' }}>
          💬
        </span>
      </div>
      <p className="text-gray-900 mb-1" style={{ fontWeight: 600 }}>
        ยังไม่มีข้อความ
      </p>
      <p className="text-sm text-gray-500 max-w-[200px]">
        ข้อความจากโรงงานจะปรากฏที่นี่หลังจากที่คุณส่ง RFQ
      </p>
    </div>
  );
}

