import React, { useState } from 'react';
import { ArrowLeft, Send, FileText, CheckCheck, MoreVertical, Paperclip, BellDot } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Factory } from '../../data/mockData';
import type { ChatConversation } from '../../data/mockData';

function formatTime(at: string) {
  return at.slice(11, 16);
}

interface ChatRoomScreenProps {
  onBack: () => void;
  conversation: ChatConversation;
  factory: Factory;
}

export function ChatRoomScreen({ onBack, conversation, factory }: ChatRoomScreenProps) {
  const [message, setMessage] = useState('');
  const { quotation } = conversation;

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      {/* Header แบบทันสมัย: glassmorphism + มุมโค้ง */}
      <div className="relative sticky top-0 z-20 overflow-hidden rounded-b-2xl shadow-lg shadow-slate-900/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D2E5F] via-[#3E3F7F] to-[#4F4F9F]" />
        <div className="absolute top-[-15%] left-[-5%] w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-25%] right-[-5%] w-40 h-40 bg-[#4F4F9F]/40 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
        <div className="relative z-10 pt-7 pb-5 px-4 flex items-center justify-between max-w-screen-md mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 -ml-1 rounded-xl text-white/95 hover:bg-white/15 active:bg-white/20 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0 mx-2">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-white/25 shadow-lg">
                <img src={factory.image} alt={factory.name} className="w-full h-full object-cover" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-[#2D2E5F]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-base truncate tracking-tight">{factory.name}</h1>
              <p className="text-emerald-300/90 text-[11px] font-medium tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                กำลังใช้งาน
              </p>
            </div>
          </div>
          <button className="p-2.5 rounded-xl text-white/90 hover:bg-white/15 active:bg-white/20 transition-all duration-200">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-28 max-w-screen-md mx-auto w-full">
        <div className="flex justify-center">
          <span className="text-[11px] font-bold text-white bg-slate-800/20 px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm backdrop-blur-sm">
            วันนี้
          </span>
        </div>

        {conversation.messages.map((msg) => {
          const isMe = msg.sender === 'customer';
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && <span className="text-[11px] text-slate-500 font-medium mb-1 ml-1">{factory.name}</span>}
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
                  isMe
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm shadow-indigo-500/20'
                    : 'bg-white text-slate-800 rounded-tl-sm shadow-slate-200/60'
                }`}
              >
                <p className="text-[15px] leading-relaxed">{msg.text}</p>
              </div>
              <div className={`flex items-center gap-1 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                <span className="text-[10px] text-slate-400 font-medium">{formatTime(msg.at)}</span>
                {isMe && <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />}
              </div>
            </div>
          );
        })}

        {/* Quotation Bubble */}
        {quotation && (
          <div className="flex flex-col items-start mt-2">
            <span className="text-[11px] text-indigo-600 font-bold mb-1 ml-1 flex items-center gap-1">
              <BellDot className="w-3 h-3" /> ระบบแจ้งเตือน
            </span>
            <div className="w-full max-w-[85%] sm:max-w-[75%] bg-white rounded-2xl rounded-tl-sm shadow-lg shadow-slate-200/60 overflow-hidden border border-slate-100">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3.5 flex items-center justify-between border-b border-indigo-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] text-indigo-900">ใบเสนอราคา</h3>
                    <p className="text-[11px] text-indigo-600/70 font-medium uppercase">#{quotation.id}</p>
                  </div>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border border-amber-200 font-bold px-2.5 py-1">
                  รอชำระ
                </Badge>
              </div>

              <div className="p-4 space-y-3 bg-white">
                {quotation.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p className="font-semibold text-[15px] text-slate-800">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.quantity > 1 && (
                          <span className="text-[12px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                            {item.quantity} x ฿{item.unitPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="font-bold text-[15px] text-slate-800 shrink-0">
                      ฿{item.total.toLocaleString()}
                    </p>
                  </div>
                ))}

                <div className="border-t border-dashed border-slate-200 pt-3 mt-2 flex justify-between items-center bg-slate-50/50 -mx-4 px-4 pb-1">
                  <span className="text-[13px] font-bold text-slate-500">ยอดรวมสุทธิ</span>
                  <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                    ฿{quotation.subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <Button className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30 h-12 text-[15px] font-bold transition-all active:scale-[0.98]">
                  ชำระมัดจำ ฿{quotation.depositAmount.toLocaleString()}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] border-t border-slate-100 p-3 pb-safe z-20">
        <div className="max-w-screen-md mx-auto flex items-end gap-2">
          <button className="p-3 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full shrink-0 transition-colors mb-0.5">
            <Paperclip className="w-6 h-6" />
          </button>
          <div className="flex-1 bg-[#F4F6F9] rounded-[20px] relative border border-slate-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <textarea
              placeholder="พิมพ์ข้อความ..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-transparent border-0 focus:ring-0 resize-none py-3.5 px-4 text-[15px] text-slate-800 placeholder:text-slate-400 max-h-32 min-h-[48px]"
              rows={1}
            />
          </div>
          <Button
            size="icon"
            className={`rounded-full shrink-0 w-12 h-12 mb-0.5 transition-all shadow-md ${
              message.trim()
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 hover:opacity-90 text-white shadow-indigo-500/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Send className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
