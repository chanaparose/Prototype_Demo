import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronLeft, Phone, MoreVertical, Send, Paperclip, ChevronDown, ChevronUp,
  CreditCard
} from 'lucide-react';
import { conversations } from '../data/mockData';

type Message = {
  id: string;
  sender: 'factory' | 'user';
  text: string;
  time: string;
  type: 'text' | 'quote';
  quoteData?: { price: number; leadTime: number; validUntil: string };
};

export function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const conv = conversations.find((c) => c.id === id) || conversations[0];
  
  const [message, setMessage] = useState('');
  const [miniDashOpen, setMiniDashOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>(conv.messages as Message[]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = conversations.find((c) => c.id === id) || conversations[0];
    setMessages(c.messages as Message[]);
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      sender: 'user' as const,
      text: message,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      type: 'text' as const,
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const latestQuote = conv.messages.find((m) => m.type === 'quote');

  return (
    <div
      className="max-w-[430px] mx-auto h-screen flex flex-col"
      style={{
        background: 'linear-gradient(145deg, rgba(236,253,245,0.5) 0%, #fff 30%, #fff 65%, rgba(237,233,254,0.4) 100%)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-5 pb-3 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <ChevronLeft size={22} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2.5">
            <img
              src={conv.factoryAvatar}
              alt={conv.factoryName}
              className="w-8 h-8 rounded-xl object-cover"
            />
            <div className="text-center">
              <p className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{conv.factoryName}</p>
              <div className="flex items-center gap-1 justify-center">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <p className="text-[10px] text-green-500">Online</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <Phone size={17} className="text-gray-600" />
            </button>
            <button className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <MoreVertical size={17} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Mini Dashboard */}
        <div
          className="rounded-2xl overflow-hidden transition-all duration-300"
          style={{ background: '#F8F5FF' }}
        >
          <button
            onClick={() => setMiniDashOpen(!miniDashOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <span className="text-xs text-gray-700" style={{ fontWeight: 600 }}>
                {conv.rfqName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-full text-[9px]"
                style={{ background: '#EDE9FF', color: '#6C47FF', fontWeight: 600 }}
              >
                RFQ Active
              </span>
              {miniDashOpen ? (
                <ChevronUp size={14} className="text-gray-400" />
              ) : (
                <ChevronDown size={14} className="text-gray-400" />
              )}
            </div>
          </button>

          {miniDashOpen && latestQuote && latestQuote.quoteData && (
            <div className="px-3 pb-3 border-t border-purple-100">
              <div className="flex gap-3 mt-2.5">
                <div className="flex-1 bg-white rounded-xl p-2.5 text-center">
                  <p className="text-sm" style={{ fontWeight: 700, color: '#6C47FF' }}>
                    ฿{latestQuote.quoteData.price.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-gray-500">ราคา</p>
                </div>
                <div className="flex-1 bg-white rounded-xl p-2.5 text-center">
                  <p className="text-sm" style={{ fontWeight: 700 }}>
                    {latestQuote.quoteData.leadTime} วัน
                  </p>
                  <p className="text-[9px] text-gray-500">lead time</p>
                </div>
                <div className="flex-1 bg-white rounded-xl p-2.5 text-center">
                  <p className="text-sm" style={{ fontWeight: 700 }}>
                    {latestQuote.quoteData.validUntil}
                  </p>
                  <p className="text-[9px] text-gray-500">ใช้ได้ถึง</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          if (msg.type === 'quote' && msg.quoteData) {
            return (
              <div key={msg.id} className="flex justify-center">
                <div
                  className="w-full max-w-[320px] rounded-2xl overflow-hidden shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)' }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard size={16} className="text-yellow-300" />
                      <span className="text-white text-xs" style={{ fontWeight: 700 }}>
                        ใบเสนอราคาทางการ
                      </span>
                    </div>
                    <div className="flex gap-3 mb-4">
                      <div className="flex-1 bg-white/20 rounded-xl p-2.5 text-center">
                        <p className="text-white" style={{ fontWeight: 700 }}>
                          ฿{msg.quoteData.price.toLocaleString()}
                        </p>
                        <p className="text-white/70 text-[9px]">ราคารวม</p>
                      </div>
                      <div className="flex-1 bg-white/20 rounded-xl p-2.5 text-center">
                        <p className="text-white" style={{ fontWeight: 700 }}>
                          {msg.quoteData.leadTime} วัน
                        </p>
                        <p className="text-white/70 text-[9px]">lead time</p>
                      </div>
                    </div>
                    <button
                      className="w-full py-3 rounded-xl text-sm"
                      style={{ background: 'rgba(255,255,255,0.95)', color: '#6C47FF', fontWeight: 700 }}
                    >
                      💳 ชำระมัดจำ 50%
                    </button>
                    <p className="text-white/60 text-[10px] text-center mt-2">
                      ใช้ได้ถึง {msg.quoteData.validUntil}
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}
            >
              {!isUser && (
                <img
                  src={conv.factoryAvatar}
                  alt=""
                  className="w-7 h-7 rounded-xl object-cover shrink-0 mt-auto"
                />
              )}
              <div
                className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                  isUser ? 'rounded-br-md' : 'rounded-bl-md'
                }`}
                style={{
                  background: isUser ? '#6C47FF' : '#F3F4F6',
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: isUser ? '#fff' : '#1F2937' }}
                >
                  {msg.text}
                </p>
                <p
                  className="text-[10px] mt-0.5"
                  style={{ color: isUser ? 'rgba(255,255,255,0.6)' : '#9CA3AF', textAlign: isUser ? 'right' : 'left' }}
                >
                  {msg.time}
                  {isUser && <span className="ml-1">✓✓</span>}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-100">
        <div className="flex items-end gap-2">
          <button className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
            <Paperclip size={18} className="text-gray-500" />
          </button>
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{
              background: message.trim() ? '#6C47FF' : '#E5E7EB',
            }}
          >
            <Send size={17} style={{ color: message.trim() ? '#fff' : '#9CA3AF' }} />
          </button>
        </div>
      </div>
    </div>
  );
}