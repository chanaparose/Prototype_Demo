import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import {
  ChevronLeft,
  MoreVertical,
  Send,
  Paperclip,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import { type Conversation } from '@/stores/types';
import { mapConversationToStoreModel } from '@/domain/chat/mappers/mapConversationStore';
import { useConversationsQuery } from '@/domain/chat/queries/useConversationsQuery';
import { messagesApi } from '@/services/api/chatApi';
import { ordersApi } from '@/services/api/ordersApi';
import { quotationsApi } from '@/services/api/rfqApi';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { ChatReference } from '@/utils/chatContract';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import {
  buildSendPayload,
  getCurrentUserId,
  resolveReceiverId,
  type ApiConversation,
} from '@/utils/chatContract';
import {
  MessageBubble,
  rowToRoomMessage,
  formatDisplayTimeFromIso,
  type RoomMessage,
} from '@/components/chat/MessageBubble';
import { RFQPicker } from '@/components/chat/RFQPicker';
import { labelFor, ReferenceChip } from '@/components/chat/ReferenceChip';
import {
  dedupeByKey,
  insertMessageSorted,
  normalizeIso,
  sortMessagesByCreatedAt,
} from '@/pages/messages/selectors';
import {
  chatNowIso,
  bangkokDateKey as bangkokDateKeyUtil,
  formatChatDateLabel,
} from '@/utils/chatTime';
import {
  messagesFromApi,
  useChatRoomSession,
  type ChatRoomPreview,
} from '@/pages/chat-room/useChatRoomSession';
import { resolveCounterparty, FACTORY_FALLBACK_AVATAR } from '@/utils/counterparty';
import { ChatPartyHeader } from '@/components/features/chat/ChatPartyHeader';
import type { IConversationResponse } from '@/types/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mediaApi } from '@/services/api/factoryApi';

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

const bangkokDateKey = bangkokDateKeyUtil;
const formatBangkokDateLabel = formatChatDateLabel;

export function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const conversationsQ = useConversationsQuery(Boolean(id) && isAuthenticated);
  const seedReference = (location.state as { reference?: ChatReference } | null)?.reference ?? null;
  const fromCtx = React.useMemo(() => {
    const raw = id ? conversationsQ.data?.find((c) => String(c.conv_id) === id) : undefined;
    return raw ? mapConversationToStoreModel(raw, raw.viewer_role) : undefined;
  }, [conversationsQ.data, id]);
  const preview: ChatRoomPreview | undefined = fromCtx
    ? {
        factoryId: fromCtx.factoryId,
        factoryName: fromCtx.factoryName,
        factoryImage: fromCtx.factoryAvatar,
        rfqName: fromCtx.rfqName,
        hasQuote: fromCtx.hasQuote,
      }
    : undefined;

  const { conv, apiConv, messages, setMessages, msgLoading, refetchConversations } =
    useChatRoomSession(id ?? '', preview);

  if (!id) {
    return <div className='p-8 text-center text-gray-500 text-sm'>ไม่พบการสนทนา</div>;
  }

  return (
    <ChatRoomBody
      conv={conv}
      apiConv={apiConv}
      messages={messages}
      setMessages={setMessages}
      onBack={() => navigate(-1)}
      variant='full'
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
}: Readonly<{
  conversationId: string;
  preview?: ChatRoomPreview;
}>) {
  const { conv, apiConv, messages, setMessages, msgLoading, refetchConversations } =
    useChatRoomSession(conversationId, preview);
  return (
    <ChatRoomBody
      conv={conv}
      apiConv={apiConv}
      messages={messages}
      setMessages={setMessages}
      variant='embedded'
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
}: Readonly<ChatRoomBodyProps>) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = getCurrentUserId(user);
  const [message, setMessage] = useState('');
  const [miniDashOpen, setMiniDashOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingRef, setPendingRef] = useState<ChatReference | null>(seedReference ?? null);
  const [showRFQPicker, setShowRFQPicker] = useState(false);
  const [quotationLoadingId, setQuotationLoadingId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const seedConsumedRef = useRef(false);
  const prevMessagesCountRef = useRef(0);
  const justSentRef = useRef(false);
  const [unseenNewCount, setUnseenNewCount] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollContainerRef.current;
    if (!el) {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
      return;
    }
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  // Track whether user is reading at the bottom (within 80px)
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distanceFromBottom < 80;
    setIsNearBottom(near);
    if (near) setUnseenNewCount(0);
  }, []);

  // Initial mount: snap to bottom (no animation), reset counters.
  useEffect(() => {
    scrollToBottom(false);
    prevMessagesCountRef.current = messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.id]);

  useEffect(() => {
    const prevCount = prevMessagesCountRef.current;
    const curCount = messages.length;
    prevMessagesCountRef.current = curCount;
    if (curCount === 0) return;

    const grew = curCount > prevCount;

    if (justSentRef.current) {
      // I just sent a message — always pin to bottom.
      justSentRef.current = false;
      scrollToBottom(false);
      setUnseenNewCount(0);
      return;
    }

    if (grew) {
      if (isNearBottom) {
        scrollToBottom(true);
      } else {
        setUnseenNewCount((n) => n + (curCount - prevCount));
      }
    }
  }, [messages, isNearBottom, scrollToBottom]);

  useEffect(() => {
    seedConsumedRef.current = false;
  }, [conv.id, seedReference?.type, seedReference?.id, seedReference?.title]);

  useEffect(() => {
    if (!seedReference || seedConsumedRef.current) return;
    setPendingRef(seedReference);
    if (!message.trim()) {
      setMessage(`สนใจสอบถามเกี่ยวกับ "${labelFor(seedReference)}"`);
    }
    clearSeedReference?.();
    seedConsumedRef.current = true;
  }, [seedReference, message, clearSeedReference]);

  const sendWithText = useCallback(
    async (text: string, tempKey: string, attachRef: ChatReference | null) => {
      if (!apiConv || currentUserId == null) return;
      try {
        const res = (await messagesApi.send(
          apiConv.conv_id,
          buildSendPayload({
            conv: apiConv,
            currentUserId,
            content: text,
            reference: attachRef ?? undefined,
            messageType: 'TX',
          }),
        )) as unknown as Record<string, unknown>;
        const serverRow = rowToRoomMessage(res);
        if (serverRow && serverRow.key) {
          setMessages((prev) => {
            const optimistic = prev.find((m) => m.key === tempKey);
            const mergedServerRow: RoomMessage = {
              ...serverRow,
              reference_title: serverRow.reference_title ?? optimistic?.reference_title,
              status: 'ok' as const,
            };
            return sortMessagesByCreatedAt(
              dedupeByKey([
                ...prev.filter((m) => m.key !== tempKey && m.key !== serverRow.key),
                mergedServerRow,
              ]),
            );
          });
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
      } catch {
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
    justSentRef.current = true;
    const tempKey = `tmp-${Date.now()}`;
    const nowIso = chatNowIso();
    const attachOnce = pendingRef;
    const optimistic: RoomMessage = {
      key: tempKey,
      sender_id: currentUserId,
      receiver_id: resolveReceiverId(apiConv, currentUserId),
      content: text,
      created_at: nowIso,
      display_time: formatDisplayTimeFromIso(nowIso),
      message_type: 'TX',
      reference_type: attachOnce?.type ?? '',
      reference_id: attachOnce?.id ?? 0,
      reference_title: attachOnce?.title ?? undefined,
      is_read: false,
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
    setMessages((prev) =>
      prev.map((m) => (m.key === key ? { ...m, status: 'sending' as const } : m)),
    );
    void sendWithText(row.content, key, null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !apiConv || currentUserId == null) return;
    e.target.value = '';

    setUploadingImage(true);
    const tempKey = `tmp-img-${Date.now()}`;
    const nowIso = chatNowIso();
    const localUrl = URL.createObjectURL(file);
    const optimistic: RoomMessage = {
      key: tempKey,
      sender_id: currentUserId,
      receiver_id: resolveReceiverId(apiConv, currentUserId),
      content: '',
      created_at: nowIso,
      display_time: formatDisplayTimeFromIso(nowIso),
      message_type: 'IM',
      reference_type: '',
      reference_id: 0,
      is_read: false,
      status: 'sending',
      imageUrl: localUrl,
    };
    setMessages((prev) => insertMessageSorted(prev, optimistic));

    try {
      const uploaded = await mediaApi.upload(file);
      const imageUrl = String(uploaded?.url ?? '');
      if (!imageUrl) throw new Error('ไม่ได้รับ URL รูปภาพ');

      const res = (await messagesApi.send(apiConv.conv_id, {
        content: '',
        receiver_id: resolveReceiverId(apiConv, currentUserId),
        message_type: 'IM',
        attachment_url: imageUrl,
      })) as unknown as Record<string, unknown>;

      const serverRow = rowToRoomMessage(res);
      setMessages((prev) => {
        const withImage = serverRow ? { ...serverRow, imageUrl, status: 'ok' as const } : null;
        const filtered = prev.filter((m) => m.key !== tempKey && m.key !== serverRow?.key);
        return withImage
          ? sortMessagesByCreatedAt(dedupeByKey([...filtered, withImage]))
          : sortMessagesByCreatedAt(
              dedupeByKey(
                prev.map((m) =>
                  m.key === tempKey
                    ? { ...m, key: String(res.message_id ?? tempKey), status: 'ok' as const }
                    : m,
                ),
              ),
            );
      });
      URL.revokeObjectURL(localUrl);
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.key === tempKey ? { ...m, status: 'error' as const } : m)),
      );
      toast.error(err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const latestQuote = messages.find(
    (m) => (m.message_type === 'QT' || m.message_type === 'quotation_card') && m.quoteData,
  );
  const isBuyer = user?.role === 'CT';
  const showMiniDash = Boolean(apiConv?.has_quote ?? conv.hasQuote);
  const counterpartyView = useMemo(() => {
    if (!apiConv || currentUserId == null) return null;
    const normalized: IConversationResponse = {
      conv_id: apiConv.conv_id,
      customer_id: apiConv.customer_id,
      factory_id: apiConv.factory_id,
      last_message: apiConv.last_message ?? '',
      unread_customer: apiConv.unread_customer,
      unread_factory: apiConv.unread_factory,
      has_quote: apiConv.has_quote,
      updated_at: apiConv.updated_at,
      viewer_role: apiConv.customer_id === currentUserId ? 'CT' : 'FT',
      customer: {
        user_id: apiConv.customer_id,
        first_name: '',
        last_name: '',
        display_name: apiConv.customer_name ?? '',
      },
      factory: {
        user_id: apiConv.factory_id,
        factory_name: apiConv.factory_name ?? conv.factoryName,
        image_url: apiConv.factory_image ?? conv.factoryAvatar ?? '',
        is_verified: false,
        specialization: '',
      },
    };
    return resolveCounterparty(normalized, currentUserId);
  }, [apiConv, currentUserId, conv.factoryName, conv.factoryAvatar]);

  const refreshThread = useCallback(async () => {
    if (!apiConv) return;
    const rawMsgs = await messagesApi.list(apiConv.conv_id);
    setMessages(messagesFromApi(rawMsgs));
    await refetchConversations?.();
  }, [apiConv, refetchConversations, setMessages]);

  const handleAcceptQuotation = useCallback(
    async (quotationId: number) => {
      setQuotationLoadingId(quotationId);
      try {
        const res = await ordersApi.acceptQuote(quotationId);
        const orderId = Number(res.order_id ?? 0);
        await refreshThread();
        if (Number.isFinite(orderId) && orderId > 0) navigate(`/orders/${orderId}`);
        else toast.success('ยืนยันใบเสนอราคาแล้ว');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'ยืนยันใบเสนอราคาไม่สำเร็จ');
      } finally {
        setQuotationLoadingId(null);
      }
    },
    [navigate, refreshThread],
  );

  const handleRejectQuotation = useCallback(
    async (quotationId: number) => {
      setQuotationLoadingId(quotationId);
      try {
        await quotationsApi.update(quotationId, { status: 'RJ' });
        await refreshThread();
        toast.success('ปฏิเสธใบเสนอราคาแล้ว');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'ปฏิเสธใบเสนอราคาไม่สำเร็จ');
      } finally {
        setQuotationLoadingId(null);
      }
    },
    [refreshThread],
  );

  return (
    <div
      className={
        variant === 'full'
          ? 'h-[calc(100vh-4rem)] flex flex-col bg-white'
          : 'h-full flex flex-col bg-white rounded-l-3xl overflow-hidden shadow-sm'
      }
    >
      <div className='px-4 pt-5 pb-3 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm'>
        <div className='flex items-center justify-between mb-3'>
          {variant === 'full' ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={onBack}
              aria-label='กลับไป'
              className='w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center'
            >
              <ChevronLeft size={22} className='text-gray-700' />
            </Button>
          ) : (
            <div />
          )}
          <div className='min-w-[220px]'>
            {counterpartyView ? (
              <ChatPartyHeader
                view={{
                  ...counterpartyView,
                  avatarUrl: counterpartyView.avatarUrl || FACTORY_FALLBACK_AVATAR,
                }}
                density='header'
              />
            ) : (
              <div className='flex items-center gap-2.5'>
                <ImageWithFallback
                  src={conv.factoryAvatar}
                  alt={conv.factoryName}
                  className='w-8 h-8 rounded-xl object-cover bg-gray-100'
                />
                <p className='text-sm font-bold text-brand-navy'>
                  {conv.factoryName || 'การสนทนา'}
                </p>
              </div>
            )}
          </div>
          <div className='flex gap-2'>
            <Button
              variant='unstyled'
              type='button'
              aria-label='เมนูเพิ่มเติม'
              className='w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center'
            >
              <MoreVertical size={17} className='text-gray-600' />
            </Button>
          </div>
        </div>

        {showMiniDash ? (
          <div className='rounded-2xl overflow-hidden transition-all duration-300 bg-brand-page'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setMiniDashOpen(!miniDashOpen)}
              className='w-full flex items-center justify-between px-3 py-2.5'
            >
              <div className='flex items-center gap-2'>
                <span className='text-sm'>📋</span>
                <span className='text-xs truncate max-w-[200px] font-semibold text-brand-navy'>
                  {conv.rfqName || 'RFQ / ใบเสนอราคา'}
                </span>
              </div>
              <div className='flex items-center gap-2 shrink-0'>
                <span className='px-2 py-0.5 rounded-full bg-brand-navy/[0.08] text-[9px] font-semibold text-brand-navy'>
                  {apiConv?.has_quote ? 'มีใบเสนอราคา' : 'สถานะ'}
                </span>
                {miniDashOpen ? (
                  <ChevronUp size={14} className='text-gray-400' />
                ) : (
                  <ChevronDown size={14} className='text-gray-400' />
                )}
              </div>
            </Button>

            {miniDashOpen && latestQuote?.quoteData && (
              <div className='px-3 pb-3 border-t border-brand-mauve/15'>
                <div className='flex gap-3 mt-2.5'>
                  <div className='flex-1 bg-white rounded-xl p-2.5 text-center'>
                    <p className='text-sm font-bold text-brand-orange-deep'>
                      {formatCurrency(latestQuote.quoteData.price)}
                    </p>
                    <p className='text-[9px] text-gray-500'>ราคา</p>
                  </div>
                  <div className='flex-1 bg-white rounded-xl p-2.5 text-center'>
                    <p className='text-sm font-bold text-brand-navy'>
                      {latestQuote.quoteData.leadTime} วัน
                    </p>
                    <p className='text-[9px] text-gray-500'>lead time</p>
                  </div>
                  <div className='flex-1 bg-white rounded-xl p-2.5 text-center'>
                    <p className='text-sm font-bold text-brand-navy'>
                      {latestQuote.quoteData.validUntil}
                    </p>
                    <p className='text-[9px] text-gray-500'>ใช้ได้ถึง</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className='flex-1 overflow-y-auto px-4 py-4 space-y-3 relative'
      >
        {!apiConv && (
          <p className='text-center text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2'>
            กำลังโหลดข้อมูลห้องแชท… รอสักครู่ก่อนส่งข้อความ
          </p>
        )}
        {msgLoading && messages.length === 0 && (
          <p className='text-center text-sm text-gray-400 py-8'>กำลังโหลดข้อความ…</p>
        )}
        {currentUserId != null &&
          messages.map((msg, i) => {
            const prev = messages[i - 1];
            const prevDateKey = prev ? bangkokDateKey(prev.created_at || '') : '';
            const curDateKey = bangkokDateKey(msg.created_at || '');
            const showDateSeparator = Boolean(curDateKey) && (!prev || prevDateKey !== curDateKey);
            return (
              <React.Fragment key={msg.key}>
                {showDateSeparator ? (
                  <div className='flex justify-center my-3'>
                    <span className='text-[10px] text-gray-400 bg-gray-100 rounded-full px-3 py-1'>
                      {formatBangkokDateLabel(msg.created_at)}
                    </span>
                  </div>
                ) : null}
                <div>
                  <MessageBubble
                    msg={msg}
                    currentUserId={currentUserId}
                    peerAvatarUrl={conv.factoryAvatar}
                    viewerRole={isBuyer ? 'CT' : 'FT'}
                    quotationLoadingId={quotationLoadingId}
                    onAcceptQuotation={handleAcceptQuotation}
                    onRejectQuotation={handleRejectQuotation}
                  />
                  {msg.status === 'error' ? (
                    <div
                      className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'} mt-1`}
                    >
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={() => retrySend(msg.key)}
                        className='text-[11px] text-red-600 underline'
                      >
                        ส่งใหม่
                      </Button>
                    </div>
                  ) : null}
                </div>
              </React.Fragment>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      {!isNearBottom && unseenNewCount > 0 ? (
        <div className='relative'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => {
              scrollToBottom(true);
              setUnseenNewCount(0);
            }}
            className='absolute -top-12 right-4 z-10 flex items-center gap-1.5 rounded-full bg-brand-mauve text-white text-xs font-semibold px-3 py-1.5 shadow-lg hover:opacity-90 transition-opacity'
          >
            <ChevronDown size={14} />↓ {unseenNewCount} ข้อความใหม่
          </Button>
        </div>
      ) : null}

      <div className='px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-100'>
        {pendingRef ? (
          <div className='mb-2 flex flex-wrap items-center gap-2'>
            <ReferenceChip reference={pendingRef} />
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setPendingRef(null)}
              className='text-[11px] text-gray-500 hover:text-gray-700'
            >
              ล้างอ้างอิง
            </Button>
          </div>
        ) : null}
        {pendingRef ? (
          <p className='text-[10px] text-gray-500 mb-2'>
            ข้อความถัดไปจะแนบ: {referenceLabel(pendingRef)}
          </p>
        ) : null}
        <div className='flex items-end gap-2'>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={(e) => void handleImageUpload(e)}
          />
          <Button
            variant='unstyled'
            type='button'
            aria-label='แนบรูปภาพ'
            disabled={!apiConv || uploadingImage}
            onClick={() => fileInputRef.current?.click()}
            className='w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50'
          >
            {uploadingImage ? (
              <span className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
            ) : (
              <Paperclip size={18} className='text-gray-500' />
            )}
          </Button>
          <div className='flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-2'>
            <Input
              type='text'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={apiConv ? 'พิมพ์ข้อความ...' : 'รอโหลดห้องแชท...'}
              disabled={!apiConv}
              className='flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none'
            />
          </div>
          {isBuyer ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setShowRFQPicker(true)}
              disabled={!apiConv}
              className='h-10 rounded-xl px-2.5 text-xs font-medium border border-brand-mauve/30 text-brand-mauve hover:bg-brand-mauve/5 shrink-0 disabled:opacity-50'
            >
              <span className='inline-flex items-center gap-1'>
                <FileText size={14} /> แนบ RFQ
              </span>
            </Button>
          ) : null}
          <Button
            variant='unstyled'
            type='button'
            aria-label='ส่งข้อความ'
            onClick={() => void sendMessage()}
            disabled={!message.trim() || sending || !apiConv}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              message.trim() && !sending && apiConv ? 'bg-brand-orange-deep' : 'bg-neutral-border'
            }`}
          >
            <Send
              size={17}
              className={message.trim() && !sending && apiConv ? 'text-white' : 'text-gray-400'}
            />
          </Button>
        </div>
      </div>

      {showRFQPicker && apiConv ? (
        <RFQPicker
          conversationId={apiConv.conv_id}
          receiverId={currentUserId != null ? resolveReceiverId(apiConv, currentUserId) : 0}
          onCancel={() => setShowRFQPicker(false)}
          onSelect={(sharedMessage) => {
            if (sharedMessage) {
              // Ensure created_at is always a valid ms-precision ISO string.
              // The share-rfq API returns Go RFC3339Nano (nanoseconds) which
              // Safari's Date parser cannot handle; also guard against Go zero
              // time "0001-01-01…". Fall back to a local optimistic UTC stamp.
              const ca = String(sharedMessage.created_at ?? '');
              const caNorm = normalizeIso(ca);
              const isInvalid = !caNorm || Number.isNaN(new Date(caNorm).getTime());
              const enriched: Record<string, unknown> = isInvalid
                ? { ...sharedMessage, created_at: chatNowIso() }
                : sharedMessage;
              const row = rowToRoomMessage(enriched);
              if (row)
                setMessages((prev) =>
                  prev.some((m) => m.key === row.key) ? prev : insertMessageSorted(prev, row),
                );
            }
            setShowRFQPicker(false);
            void refreshThread();
          }}
        />
      ) : null}
    </div>
  );
}
