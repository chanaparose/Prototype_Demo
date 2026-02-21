import React, { useState } from 'react';
import { ChevronLeft, MessageCircle, ArrowLeft, Send, FileText } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { mockChatConversations, mockFactories } from '../../data/mockData';

interface ChatInboxScreenProps {
  onBack: () => void;
}

function getFactory(factoryId: string) {
  return mockFactories.find((f) => f.id === factoryId);
}

function formatTime(at: string) {
  return at.slice(11, 16);
}

export function ChatInboxScreen({ onBack }: ChatInboxScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const selected = selectedId
    ? mockChatConversations.find((c) => c.id === selectedId)
    : null;
  const factory = selected ? getFactory(selected.factoryId) : null;

  if (selected && factory) {
    const { quotation } = selected;
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header อิงตาม ChatBOQScreen */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-white"
              aria-label="กลับ"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-semibold truncate">{factory.name}</h1>
              <p className="text-blue-100 text-xs">ออนไลน์</p>
            </div>
          </div>
        </div>

        {/* Chat Messages อิงตาม ChatBOQScreen */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          {selected.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  msg.sender === 'customer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender === 'customer' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(msg.at)}
                </p>
              </div>
            </div>
          ))}

          {/* Quotation Bubble อิงตาม ChatBOQScreen */}
          {quotation && (
            <>
              <div className="flex justify-start">
                <Card className="w-full max-w-md border-2 border-green-200 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-green-700">ใบเสนอราคา #{quotation.id}</h3>
                    </div>
                    <div className="space-y-2 mb-4">
                      {quotation.items.map((item, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{index + 1}. {item.name}</p>
                              {item.note && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {item.note}
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium">฿{item.total.toLocaleString()}</p>
                          </div>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-600 mt-1">
                              {item.quantity} ชิ้น × ฿{item.unitPrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-3 mb-4">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>ยอดสุทธิ:</span>
                        <span className="text-green-600">฿{quotation.subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-blue-900">เงื่อนไข</p>
                      <p className="text-sm text-blue-700">
                        มัดจำ {quotation.depositPercent}% (฿{quotation.depositAmount.toLocaleString()}) ก่อนเริ่มผลิต
                      </p>
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      ชำระมัดจำ {quotation.depositPercent}% (฿{quotation.depositAmount.toLocaleString()})
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl px-4 py-2 bg-white border border-gray-200">
                  <p className="text-sm">ราคานี้รวมแพ็กเกจจิ้งแล้วนะครับ ถ้ามีข้อสงสัยเพิ่มเติมสอบถามได้เลยครับ</p>
                  <p className="text-xs text-gray-500 mt-1">{formatTime(selected.lastAt)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Input Area อิงตาม ChatBOQScreen */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="flex gap-2 max-w-screen-xl mx-auto">
            <Input
              placeholder="พิมพ์ข้อความ..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button size="icon" className="bg-blue-600">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalUnread = mockChatConversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1 -ml-1 rounded-lg hover:bg-gray-100"
          aria-label="กลับ"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#4F4F9F]" />
          <h1 className="font-semibold text-gray-900">กล่องข้อความ</h1>
        </div>
      </header>

      <ul className="divide-y divide-gray-100">
        {mockChatConversations.map((conv) => {
          const f = getFactory(conv.factoryId);
          if (!f) return null;
          return (
            <li key={conv.id}>
              <button
                type="button"
                onClick={() => setSelectedId(conv.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                  <img src={f.image} alt="" className="w-full h-full object-cover" />
                  {conv.unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 truncate">{f.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{conv.lastAt.slice(0, 10)}</span>
                  </div>
                  <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {conv.lastMessage}
                  </p>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180 shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>

      {totalUnread === 0 && mockChatConversations.length === 0 && (
        <div className="px-4 py-12 text-center text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>ยังไม่มีข้อความ</p>
        </div>
      )}
    </div>
  );
}
