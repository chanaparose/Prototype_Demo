import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import {
  ChevronLeft,
  Phone,
  MoreVertical,
  Send,
  Paperclip,
  ChevronDown,
  ChevronUp,
  CreditCard,
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Conversation, Message } from '../../contexts/DataContext';
import { messagesApi, conversationsApi } from '../../services/api';
import { ImageWithFallback } from '../../components/shared';
import type { ChatReference } from '../../hooks/useStartChatWithFactory';

export type ChatRoomPreview = {
  factoryId?: string;
  factoryName: string;
  factoryImage: string;
  rfqName: string;
  hasQuote?: boolean;
};

function normApiMessage(r: Record<string, unknown>): Message {
  const id = String(r.message_id ?? r.id ?? '');
  const content = String(r.content ?? r.text ?? r.body ?? '');
  const msgType = String(r.message_type ?? r.type ?? 'TX').toUpperCase();
  const senderRole = String(r.sender_role ?? r.sender_type ?? '').toUpperCase();
  const sender: 'factory' | 'user' =
    senderRole === 'FT' || senderRole === 'FACTORY' || senderRole === 'F' ? 'factory' : 'user';
  const timeRaw = r.created_at ?? r.sent_at ?? r.time ?? '';
  let time = '';
  if (timeRaw) {
    const d = new Date(String(timeRaw));
    time = Number.isNaN(d.getTime())
      ? String(timeRaw)
      : d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }
  if (msgType === 'QT') {
    let quoteData: Message['quoteData'];
    try {
      const qd = r.quote_data ?? r.quoteData;
      const q = (typeof qd === 'string' ? JSON.parse(qd) : qd) as Record<string, unknown>;
      if (q && typeof q === 'object') {
        quoteData = {
          price: Number(q.price ?? 0),
          leadTime: Number(q.lead_time ?? q.leadTime ?? 0),
          validUntil: String(q.valid_until ?? q.validUntil ?? ''),
        };
      }
    } catch {
      /* optional quote payload */
    }
    return {
      id: id || `qt-${content.slice(0, 8)}-${time}`,
      sender,
      text: content || 'ใบเสนอราคา',
      time,
      type: 'quote',
      quoteData,
    };
  }
  return {
    id: id || `tx-${content.slice(0, 8)}-${time}`,
    sender,
    text: content,
    time,
    type: 'text',
  };
}

function messagesFromApi(raw: unknown): Message[] {
  const arr = Array.isArray(raw) ? raw : [];
  return (arr as Record<string, unknown>[]).map(normApiMessage).filter((m) => m.text || m.type === 'quote');
}

function useChatThread(conversationId: string, preview?: ChatRoomPreview) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [header, setHeader] = useState({
    factoryId: preview?.factoryId ?? '',
    factoryName: preview?.factoryName ?? '',
    factoryAvatar: preview?.factoryImage ?? '',
    rfqName: preview?.rfqName ?? '',
    hasQuote: Boolean(preview?.hasQuote),
  });

  useEffect(() => {
    setHeader({
      factoryId: preview?.factoryId ?? '',
      factoryName: preview?.factoryName ?? '',
      factoryAvatar: preview?.factoryImage ?? '',
      rfqName: preview?.rfqName ?? '',
      hasQuote: Boolean(preview?.hasQuote),
    });
  }, [preview?.factoryId, preview?.factoryName, preview?.factoryImage, preview?.rfqName, preview?.hasQuote]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setMsgLoading(false);
      return;
    }
    let cancelled = false;
    setMsgLoading(true);
    messagesApi
      .listByConversation(conversationId)
      .then((raw) => {
        if (!cancelled) setMessages(messagesFromApi(raw));
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setMsgLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    conversationsApi
      .get(conversationId)
      .then((row) => {
        if (cancelled || !row || typeof row !== 'object') return;
        const r = row as Record<string, unknown>;
        setHeader((h) => ({
          factoryId:
            r.factory_id != null && String(r.factory_id).trim()
              ? String(r.factory_id)
              : r.factoryId != null && String(r.factoryId).trim()
                ? String(r.factoryId)
                : h.factoryId,
          factoryName:
            r.factory_name != null && String(r.factory_name).trim()
              ? String(r.factory_name)
              : h.factoryName,
          factoryAvatar:
            r.factory_image != null && String(r.factory_image).trim()
              ? String(r.factory_image)
              : r.factory_image_url != null && String(r.factory_image_url).trim()
                ? String(r.factory_image_url)
                : r.factory_avatar != null && String(r.factory_avatar).trim()
                  ? String(r.factory_avatar)
                  : h.factoryAvatar,
          rfqName:
            r.rfq_title != null && String(r.rfq_title).trim()
              ? String(r.rfq_title)
              : r.rfq_name != null && String(r.rfq_name).trim()
                ? String(r.rfq_name)
                : h.rfqName,
          hasQuote: Boolean(r.has_quote ?? r.hasQuote ?? h.hasQuote),
        }));
      })
      .catch(() => {
        /* keep preview / list header */
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const conv: Conversation = useMemo(
    () => ({
      id: conversationId,
      factoryId: header.factoryId || '',
      rfqId: '',
      factoryName: header.factoryName,
      factoryAvatar: header.factoryAvatar,
      rfqName: header.rfqName,
      lastMessage: '',
      time: '',
      unread: 0,
      hasQuote: header.hasQuote,
      messages,
    }),
    [conversationId, header, messages],
  );

  return { conv, msgLoading };
}

export function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const data = useData();
  const seedReference = (location.state as { reference?: ChatReference } | null)?.reference ?? null;
  const fromCtx = id ? data.conversations.find((c) => c.id === id) : undefined;
  const preview: ChatRoomPreview | undefined = fromCtx
    ? {
        factoryId: fromCtx.factoryId,
        factoryName: fromCtx.factoryName,
        factoryImage: fromCtx.factoryAvatar,
        rfqName: fromCtx.rfqName,
        hasQuote: fromCtx.hasQuote,
      }
    : undefined;

  const { conv, msgLoading } = useChatThread(id ?? '', preview);

  if (!id) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">ไม่พบการสนทนา</div>
    );
  }

  return (
    <ChatRoomBody
      conv={conv}
      onBack={() => navigate(-1)}
      variant="full"
      msgLoading={msgLoading}
      seedReference={seedReference}
      clearSeedReference={() => {
        navigate(location.pathname, { replace: true, state: null });
      }}
    />
  );
}

type ChatRoomBodyProps = {
  conv: Conversation;
  onBack?: () => void;
  variant: 'full' | 'embedded';
  msgLoading?: boolean;
  seedReference?: ChatReference | null;
  clearSeedReference?: () => void;
};

export function ChatRoomEmbedded({
  conversationId,
  preview,
}: {
  conversationId: string;
  preview?: ChatRoomPreview;
}) {
  const { conv, msgLoading } = useChatThread(conversationId, preview);
  return (
    <ChatRoomBody conv={conv} variant="embedded" msgLoading={msgLoading} />
  );
}

function ChatRoomBody({
  conv,
  onBack,
  variant,
  msgLoading,
  seedReference,
  clearSeedReference,
}: ChatRoomBodyProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [miniDashOpen, setMiniDashOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState<ChatReference | null>(seedReference ?? null);
  const [messages, setMessages] = useState<Message[]>(() => conv.messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seedConsumedRef = useRef(false);

  useEffect(() => {
    setMessages(conv.messages);
  }, [conv.id, conv.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    seedConsumedRef.current = false;
  }, [conv.id, seedReference?.type, seedReference?.id, seedReference?.title]);

  useEffect(() => {
    if (!seedReference || seedConsumedRef.current) return;
    setReference(seedReference);
    if (!message.trim()) {
      const seedTitle = seedReference.title?.trim() || 'รายการนี้';
      setMessage(`สนใจสอบถามเกี่ยวกับ \"${seedTitle}\"`);
    }
    clearSeedReference?.();
    seedConsumedRef.current = true;
  }, [seedReference, message, clearSeedReference]);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);

    const activeReference = reference ?? {
      type: 'FT' as const,
      id: String(conv.factoryId || conv.id),
      title: conv.factoryName,
    };

    const receiverId = Number(conv.factoryId);
    const convId = Number(conv.id);
    const hasApiPayload =
      Number.isFinite(receiverId) &&
      receiverId > 0 &&
      Number.isFinite(convId) &&
      convId > 0 &&
      activeReference.id.trim() !== '';

    if (hasApiPayload) {
      try {
        await messagesApi.send({
          reference_type: activeReference.type,
          reference_id: activeReference.id,
          receiver_id: receiverId,
          conv_id: convId,
          content: text,
          message_type: 'TX',
        });
      } catch (e) {
        console.error('[chat.send]', e);
      }
    }

    const newMsg: Message = {
      id: `m${Date.now()}`,
      sender: user?.role === 'FT' ? 'factory' : 'user',
      text,
      time: new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      type: 'text' as const,
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage('');
    setReference(null);
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const latestQuote = messages.find((m) => m.type === 'quote');

  return (
    <div
      className={
        variant === 'full'
          ? 'h-[calc(100vh-4rem)] flex flex-col bg-white'
          : 'h-full flex flex-col bg-white rounded-l-3xl overflow-hidden shadow-sm'
      }
    >
      {/* Header */}
      <div className="px-4 pt-5 pb-3 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          {variant === 'full' ? (
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
            >
              <ChevronLeft size={22} className="text-gray-700" />
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2.5">
            <ImageWithFallback
              src={conv.factoryAvatar}
              alt={conv.factoryName}
              className="w-8 h-8 rounded-xl object-cover bg-gray-100"
            />
            <div className="text-center">
              <p className="text-sm" style={{ fontWeight: 700, color: '#2E2252' }}>
                {conv.factoryName || 'การสนทนา'}
              </p>
              <div className="flex items-center gap-1 justify-center">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <p className="text-[10px] text-green-500">Online</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <Phone size={17} className="text-gray-600" />
            </button>
            <button type="button" className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <MoreVertical size={17} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Mini Dashboard */}
        <div
          className="rounded-2xl overflow-hidden transition-all duration-300"
          style={{ background: '#F8F6FA' }}
        >
          <button
            type="button"
            onClick={() => setMiniDashOpen(!miniDashOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <span
                className="text-xs truncate max-w-[200px]"
                style={{ fontWeight: 600, color: '#2E2252' }}
              >
                {conv.rfqName || 'RFQ'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="px-2 py-0.5 rounded-full text-[9px]"
                style={{
                  background: 'rgba(46,34,82,0.08)',
                  color: '#2E2252',
                  fontWeight: 600,
                }}
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

          {miniDashOpen && latestQuote?.quoteData && (
            <div className="px-3 pb-3 border-t" style={{ borderColor: 'rgba(122,75,148,0.15)' }}>
              <div className="flex gap-3 mt-2.5">
                <div className="flex-1 bg-white rounded-xl p-2.5 text-center">
                  <p
                    className="text-sm"
                    style={{ fontWeight: 700, color: '#E38844' }}
                  >
                    ฿{latestQuote.quoteData.price.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-gray-500">ราคา</p>
                </div>
                <div className="flex-1 bg-white rounded-xl p-2.5 text-center">
                  <p className="text-sm" style={{ fontWeight: 700, color: '#2E2252' }}>
                    {latestQuote.quoteData.leadTime} วัน
                  </p>
                  <p className="text-[9px] text-gray-500">lead time</p>
                </div>
                <div className="flex-1 bg-white rounded-xl p-2.5 text-center">
                  <p className="text-sm" style={{ fontWeight: 700, color: '#2E2252' }}>
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
        {msgLoading && messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">กำลังโหลดข้อความ…</p>
        )}
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
                      type="button"
                      className="w-full py-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(255,255,255,0.95)',
                        color: '#6C47FF',
                        fontWeight: 700,
                      }}
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
                <ImageWithFallback
                  src={conv.factoryAvatar}
                  alt=""
                  className="w-7 h-7 rounded-xl object-cover shrink-0 mt-auto bg-gray-100"
                />
              )}
              <div
                className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                  isUser ? 'rounded-br-md' : 'rounded-bl-md'
                }`}
                style={{
                  background: isUser ? '#7A4B94' : '#F3F4F6',
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
                  style={{
                    color: isUser ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
                    textAlign: isUser ? 'right' : 'left',
                  }}
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
        {reference ? (
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800">
              {reference.type}
              {reference.title ? ` · ${reference.title}` : ''}
            </span>
            <button
              type="button"
              onClick={() => setReference(null)}
              className="text-[11px] text-gray-500 hover:text-gray-700"
            >
              ล้างอ้างอิง
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <button type="button" className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
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
            type="button"
            onClick={() => void sendMessage()}
            disabled={!message.trim() || sending}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{
              background: message.trim() && !sending ? '#E38844' : '#E5E7EB',
            }}
          >
            <Send
              size={17}
              style={{ color: message.trim() && !sending ? '#fff' : '#9CA3AF' }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
