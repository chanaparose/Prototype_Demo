import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { mockChatConversations, mockFactories } from '../../data/mockData';
import type { Factory } from '../../data/mockData';

interface ChatInboxListScreenProps {
  onBack: () => void;
  onSelectConversation: (conversationId: string) => void;
}

function getFactory(factoryId: string): Factory | undefined {
  return mockFactories.find((f) => f.id === factoryId);
}

export function ChatInboxListScreen({ onBack, onSelectConversation }: ChatInboxListScreenProps) {
  return (
    <div className="pb-24 bg-white min-h-screen">
      {/* Header: ความสูงและ padding น้อย ไม่มีขอบมน */}
      <div className="relative pt-0 pb-3 px-4 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D2E5F] via-[#3E3F7F] to-[#4F4F9F]" />
        <div className="absolute top-[-15%] left-[-5%] w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-25%] right-[-5%] w-40 h-40 bg-[#4F4F9F]/40 rounded-full blur-3xl" />
        <div className="relative z-10 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-1 text-white/95 hover:bg-white/15 active:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center gap-3">
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">กล่องข้อความ</h1>
                <p className="text-white/60 text-xs mt-0.5">จัดการการสนทนากับโรงงาน</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation List */}
      <div className="px-2">
        {mockChatConversations.map((conv) => {
          const f = getFactory(conv.factoryId);
          if (!f) return null;
          const isUnread = conv.unreadCount > 0;

          return (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelectConversation(conv.id)}
              className={`w-full text-left px-3 py-3.5 mb-1 flex items-center gap-4 rounded-2xl transition-all ${
                isUnread ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'bg-white hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-full overflow-hidden shrink-0 shadow-sm ${
                    isUnread ? 'ring-2 ring-indigo-200 ring-offset-2' : 'border border-slate-100'
                  }`}
                >
                  <img src={f.image} alt={f.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full z-10 shadow-sm" />
              </div>

              <div className="flex-1 min-w-0 py-0.5 border-b border-slate-100 pb-4">
                <div className="flex justify-between items-center mb-1">
                  <h3
                    className={`text-[16px] truncate pr-2 ${
                      isUnread ? 'font-bold text-indigo-950' : 'font-semibold text-slate-800'
                    }`}
                  >
                    {f.name}
                  </h3>
                  <span
                    className={`text-[11px] font-medium shrink-0 ${
                      isUnread ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  >
                    {conv.lastAt.slice(11, 16)}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-3">
                  <p
                    className={`text-[13.5px] truncate ${
                      isUnread ? 'text-slate-700 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {conv.lastMessage}
                  </p>

                  {isUnread && (
                    <span className="shrink-0 w-5 h-5 bg-gradient-to-br from-rose-400 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-pink-500/30">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
