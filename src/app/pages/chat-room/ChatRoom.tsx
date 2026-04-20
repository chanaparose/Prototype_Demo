import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import {
  ChevronLeft,
  Phone,
  MoreVertical,
  Send,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Conversation } from '../../contexts/DataContext';
import { messagesApi, conversationsApi } from '../../services/api';
import { ImageWithFallback } from '../../components/shared';
import type { ChatReference } from '../../utils/chatContract';
import {
  buildSendPayload,
  getCurrentUserId,
  parseApiConversation,
  resolveReceiverId,
  type ApiConversation,
} from '../../utils/chatContract';
import { MessageBubble, rowToRoomMessage, type RoomMessage } from '../../components/chat/MessageBubble';
import { ReferenceChip } from '../../components/chat/ReferenceChip';
import { sortMessagesByCreatedAt, insertMessageSorted, dedupeByKey } from '../messages/selectors';
import { useMarkAsRead } from '../messages/useMarkAsRead';

export type ChatRoomPreview = {
  factoryId?: string;
  factoryName: string;
  factoryImage: string;
  rfqName: string;
  hasQuote?: boolean;
};

function messagesFromApi(raw: unknown): RoomMessage[] {
  const arr = Array.isArray(raw) ? raw : [];
  const msgs = (arr as Record<string, unknown>[])
    .map(rowToRoomMessage)
    .filter(
      (m): m is RoomMessage =>
        m != null && (m.content.trim() !== '' || m.message_type === 'QT' || m.message_type === 'IM'),
    );
  return sortMessagesByCreatedAt(msgs);
}

function referenceLabel(ref: ChatReference): string {
  const t = ref.title?.trim();
  switch (ref.type) {
    case 'PD':
      return t ? `สินค้า · ${t}` : 'สินค้า';
    case 'PM':
      return t ? `โปรโมชัน · ${t}` : 'โปรโมชัน';
    case 'ID':
      return t ? `ไอเดีย · ${t}` : 'ไอเดีย';
    case 'RQ':
      return t ? `RFQ · ${t}` : 'RFQ';
    case 'OD':
      return t ? `Order · ${t}` : 'Order';
    default:
      return t ?? 'อ้างอิง';
  }
}

function useChatThread(conversationId: string, preview?: ChatRoomPreview) {
  const { refetchConversations } = useData();
  const markAsRead = useMarkAsRead();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [apiConv, setApiConv] = useState<ApiConversation | null>(null);
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
      setApiConv(null);
      return;
    }
    let cancelled = false;
    setMsgLoading(true);
    Promise.all([
      messagesApi.listByConversation(conversationId).catch(() => [] as unknown[]),
      conversationsApi.get(conversationId).catch(() => null as Record<string, unknown> | null),
    ])
      .then(([rawMsgs, rawConv]) => {
        if (cancelled) return;
        setMessages(messagesFromApi(rawMsgs));

        if (rawConv && typeof rawConv === 'object') {
          const r = rawConv as Record<string, unknown>;
          const parsed = parseApiConversation(r);
          if (parsed) setApiConv(parsed);
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
        }

        void markAsRead(conversationId);
        void refetchConversations();
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
  }, [conversationId, markAsRead, refetchConversations]);

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
      messages: [],
    }),
    [conversationId, header],
  );

  return { conv, apiConv, messages, setMessages, msgLoading, refetchConversations };
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

  const { conv, apiConv, messages, setMessages, msgLoading, refetchConversations } = useChatThread(id ?? '', preview);

  if (!id) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">ไม่พบการสนทนา</div>
    );
  }

  return (
    <ChatRoomBody
      conv={conv}
      apiConv={apiConv}
      messages={messages}
      setMessages={setMessages}
      onBack={() => navigate(-1)}
      variant="full"
      msgLoading={msgLoading}
      refetchConversations={refetchConversations}
      seedReference={seedReference}
      clearSeedReference={() => {
        navigate(location.pathname, { replace: true, state: null });
      }}
    />
  );
}

type ChatRoomBodyProps = {
  conv: Conversation;
  apiConv: ApiConversation | null;
  messages: RoomMessage[];
  setMessages: React.Dispatch<React.SetStateAction<RoomMessage[]>>;
  onBack?: () => void;
  variant: 'full' | 'embedded';
  msgLoading?: boolean;
  refetchConversations?: () => Promise<void>;
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
  const { conv, apiConv, messages, setMessages, msgLoading, refetchConversations } = useChatThread(
    conversationId,
    preview,
  );
  return (
    <ChatRoomBody
      conv={conv}
      apiConv={apiConv}
      messages={messages}
      setMessages={setMessages}
      variant="embedded"
      msgLoading={msgLoading}
      refetchConversations={refetchConversations}
    />
  );
}

function ChatRoomBody({
  conv,
  apiConv,
  messages,
  setMessages,
  onBack,
  variant,
  msgLoading,
  refetchConversations,
  seedReference,
  clearSeedReference,
}: ChatRoomBodyProps) {
  const { user } = useAuth();
  const currentUserId = getCurrentUserId(user);
  const [message, setMessage] = useState('');
  const [miniDashOpen, setMiniDashOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingRef, setPendingRef] = useState<ChatReference | null>(seedReference ?? null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seedConsumedRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    seedConsumedRef.current = false;
  }, [conv.id, seedReference?.type, seedReference?.id, seedReference?.title]);

  useEffect(() => {
    if (!seedReference || seedConsumedRef.current) return;
    setPendingRef(seedReference);
    if (!message.trim()) {
      const seedTitle = seedReference.title?.trim() || 'รายการนี้';
      setMessage(`สนใจสอบถามเกี่ยวกับ "${seedTitle}"`);
    }
    clearSeedReference?.();
    seedConsumedRef.current = true;
  }, [seedReference, message, clearSeedReference]);

  const sendWithText = useCallback(
    async (text: string, tempKey: string, attachRef: ChatReference | null) => {
      if (!apiConv || currentUserId == null) return;
      try {
        const res = (await messagesApi.send(
          buildSendPayload({
            conv: apiConv,
            currentUserId,
            content: text,
            reference: attachRef ?? undefined,
            messageType: 'TX',
          }),
        )) as Record<string, unknown>;
        const serverRow = rowToRoomMessage(res);
        if (serverRow && serverRow.key) {
          setMessages((prev) =>
            sortMessagesByCreatedAt(
              dedupeByKey([
                ...prev.filter((m) => m.key !== tempKey && m.key !== serverRow.key),
                { ...serverRow, status: 'ok' as const },
              ]),
            ),
          );
        } else {
          const mid = String(res.message_id ?? res.id ?? tempKey);
          setMessages((prev) =>
            sortMessagesByCreatedAt(
              dedupeByKey(
                prev.map((m) =>
                  m.key === tempKey ? { ...m, key: mid, status: 'ok' as const } : m,
                ),
              ),
            ),
          );
        }
        void refetchConversations?.();
        if (attachRef) setPendingRef(null);
      } catch (e) {
        console.error('[chat.send]', e);
        setMessages((prev) =>
          prev.map((m) => (m.key === tempKey ? { ...m, status: 'error' as const } : m)),
        );
      }
    },
    [apiConv, currentUserId, setMessages, refetchConversations],
  );

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || sending || currentUserId == null) return;
    if (!apiConv) {
      return;
    }
    setSending(true);
    const tempKey = `tmp-${Date.now()}`;
    const now = new Date();
    const attachOnce = pendingRef;
    const optimistic: RoomMessage = {
      key: tempKey,
      sender_id: currentUserId,
      receiver_id: resolveReceiverId(apiConv, currentUserId),
      content: text,
      created_at: now.toISOString(),
      display_time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      message_type: 'TX',
      reference_type: attachOnce?.type ?? '',
      reference_id: attachOnce?.id ?? 0,
      status: 'sending',
    };
    setMessages((prev) => insertMessageSorted(prev, optimistic));
    setMessage('');
    const refToSend = attachOnce ?? null;
    if (attachOnce) setPendingRef(null);
    await sendWithText(text, tempKey, refToSend);
    setSending(false);
  };

  const retrySend = (key: string) => {
    const row = messages.find((m) => m.key === key);
    if (!row || row.status !== 'error' || !apiConv || currentUserId == null) return;
    setMessages((prev) => prev.map((m) => (m.key === key ? { ...m, status: 'sending' as const } : m)));
    void sendWithText(row.content, key, null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const latestQuote = messages.find((m) => m.message_type === 'QT' && m.quoteData);
  const showMiniDash = Boolean(apiConv?.has_quote ?? conv.hasQuote);

  return (
    <div
      className={
        variant === 'full'
          ? 'h-[calc(100vh-4rem)] flex flex-col bg-white'
          : 'h-full flex flex-col bg-white rounded-l-3xl overflow-hidden shadow-sm'
      }
    >
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

        {showMiniDash ? (
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
                  {conv.rfqName || 'RFQ / ใบเสนอราคา'}
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
                  {apiConv?.has_quote ? 'มีใบเสนอราคา' : 'สถานะ'}
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
                    <p className="text-sm" style={{ fontWeight: 700, color: '#E38844' }}>
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
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!apiConv && (
          <p className="text-center text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            กำลังโหลดข้อมูลห้องแชท… รอสักครู่ก่อนส่งข้อความ
          </p>
        )}
        {msgLoading && messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">กำลังโหลดข้อความ…</p>
        )}
        {currentUserId != null &&
          messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showDateSeparator =
              Boolean(msg.created_at) &&
              (!prev ||
                new Date(prev.created_at || 0).toDateString() !== new Date(msg.created_at || 0).toDateString());
            return (
              <React.Fragment key={msg.key}>
                {showDateSeparator ? (
                  <div className="flex justify-center my-3">
                    <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-3 py-1">
                      {new Date(msg.created_at).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                ) : null}
                <div>
                  <MessageBubble msg={msg} currentUserId={currentUserId} peerAvatarUrl={conv.factoryAvatar} />
                  {msg.status === 'error' ? (
                    <div
                      className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'} mt-1`}
                    >
                      <button
                        type="button"
                        onClick={() => retrySend(msg.key)}
                        className="text-[11px] text-red-600 underline"
                      >
                        ส่งใหม่
                      </button>
                    </div>
                  ) : null}
                </div>
              </React.Fragment>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-100">
        {pendingRef ? (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <ReferenceChip reference={pendingRef} />
            <button
              type="button"
              onClick={() => setPendingRef(null)}
              className="text-[11px] text-gray-500 hover:text-gray-700"
            >
              ล้างอ้างอิง
            </button>
          </div>
        ) : null}
        {pendingRef ? (
          <p className="text-[10px] text-gray-500 mb-2">ข้อความถัดไปจะแนบ: {referenceLabel(pendingRef)}</p>
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
              placeholder={apiConv ? 'พิมพ์ข้อความ...' : 'รอโหลดห้องแชท...'}
              disabled={!apiConv}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!message.trim() || sending || !apiConv}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{
              background: message.trim() && !sending && apiConv ? '#E38844' : '#E5E7EB',
            }}
          >
            <Send
              size={17}
              style={{ color: message.trim() && !sending && apiConv ? '#fff' : '#9CA3AF' }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
