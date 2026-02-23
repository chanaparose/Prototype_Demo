import React from 'react';
import { ArrowLeft, Send, FileText } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { mockChatConversations, mockFactories } from '../../data/mockData';

/** แปลง "2026-02-21 10:32" -> "10:32" */
function formatTime(at: string) {
  const parts = at.split(' ');
  return parts.length >= 2 ? parts[1].slice(0, 5) : at;
}

interface ChatBOQScreenProps {
  onBack: () => void;
  orderId: string;
  factoryName: string;
}

export function ChatBOQScreen({ onBack, orderId, factoryName }: ChatBOQScreenProps) {
  const [message, setMessage] = useState('');

  const { conversation, quotation } = useMemo(() => {
    const factory = mockFactories.find((f) => f.name === factoryName);
    const factoryId = factory?.id ?? '1';
    const conv = mockChatConversations.find((c) => c.factoryId === factoryId);
    return {
      conversation: conv ?? mockChatConversations[0],
      quotation: conv?.quotation,
    };
  }, [factoryName]);

  const chatMessages = conversation.messages;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-semibold">{factoryName}</h1>
            <p className="text-blue-100 text-xs">ออนไลน์</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {chatMessages.map((msg) => (
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

        {/* Quotation Bubble - แสดงเมื่อมี quotation จาก mockData */}
        {quotation && (
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
        )}

        {quotation && (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl px-4 py-2 bg-white border border-gray-200">
              <p className="text-sm">
                ราคานี้รวมแพ็กเกจจิ้งแล้วนะครับ ถ้ามีข้อสงสัยเพิ่มเติมสอบถามได้เลยครับ
              </p>
              <p className="text-xs text-gray-500 mt-1">{formatTime(conversation.lastAt)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
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
