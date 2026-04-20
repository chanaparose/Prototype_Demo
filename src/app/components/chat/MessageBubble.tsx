import React from 'react';
import { CreditCard } from 'lucide-react';
import { ImageWithFallback } from '../shared';
import type { ChatReference, ChatReferenceType } from '../../utils/chatContract';
import { ReferenceChip } from './ReferenceChip';

export type RoomMessage = {
  key: string;
  sender_id: number;
  receiver_id: number;
  content: string;
  /** ISO8601 UTC from API (or optimistic). */
  created_at: string;
  /** HH:mm for display */
  display_time: string;
  message_type: 'TX' | 'QT' | 'IM';
  reference_type: '' | ChatReferenceType;
  reference_id: number;
  quoteData?: { price: number; leadTime: number; validUntil: string };
  imageUrl?: string;
  /** optimistic / failed send */
  status?: 'sending' | 'ok' | 'error';
};

type Props = {
  msg: RoomMessage;
  currentUserId: number;
  peerAvatarUrl: string;
};

function parseQuoteData(raw: string | null | undefined): RoomMessage['quoteData'] | undefined {
  if (raw == null || String(raw).trim() === '') return undefined;
  try {
    const q = JSON.parse(String(raw)) as Record<string, unknown>;
    if (!q || typeof q !== 'object') return undefined;
    return {
      price: Number(q.price ?? 0),
      leadTime: Number(q.lead_time ?? q.leadTime ?? 0),
      validUntil: String(q.valid_until ?? q.validUntil ?? ''),
    };
  } catch {
    return undefined;
  }
}

function pickImageUrl(r: Record<string, unknown>, mt: RoomMessage['message_type']): string | undefined {
  if (mt !== 'IM') return undefined;
  const u =
    (typeof r.image_url === 'string' && r.image_url) ||
    (typeof r.imageUrl === 'string' && r.imageUrl) ||
    (typeof r.attachment_url === 'string' && r.attachment_url) ||
    (typeof r.attachmentUrl === 'string' && r.attachmentUrl) ||
    '';
  return u || undefined;
}

export function rowToRoomMessage(r: Record<string, unknown>): RoomMessage | null {
  const message_id = String(r.message_id ?? r.id ?? '');
  const content = String(r.content ?? r.text ?? r.body ?? '');
  const message_type = String(r.message_type ?? r.type ?? 'TX').toUpperCase() as RoomMessage['message_type'];
  const sender_id = Number(r.sender_id ?? r.senderId ?? 0);
  const receiver_id = Number(r.receiver_id ?? r.receiverId ?? 0);
  if (!Number.isFinite(sender_id)) return null;

  const refType = String(r.reference_type ?? '').toUpperCase() as RoomMessage['reference_type'];
  const reference_id = Number(r.reference_id ?? 0);

  const createdAtRaw = String(r.created_at ?? r.sent_at ?? '');
  const d = createdAtRaw ? new Date(createdAtRaw) : null;
  const display_time =
    d && !Number.isNaN(d.getTime())
      ? d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      : '';

  const mt: RoomMessage['message_type'] =
    message_type === 'QT' || message_type === 'IM' ? message_type : 'TX';

  let qd =
    mt === 'QT'
      ? parseQuoteData(
          typeof r.quote_data === 'string' ? r.quote_data : typeof r.quoteData === 'string' ? r.quoteData : null,
        )
      : undefined;
  let effectiveType: RoomMessage['message_type'] = mt;
  if (mt === 'QT' && !qd) {
    effectiveType = 'TX';
    qd = undefined;
  }

  const imageUrl = pickImageUrl(r, effectiveType);

  const hasBody = content.trim() !== '' || effectiveType === 'QT' || (effectiveType === 'IM' && Boolean(imageUrl));

  if (!hasBody) return null;

  return {
    key: message_id || `k-${sender_id}-${createdAtRaw}-${content.slice(0, 6)}`,
    sender_id,
    receiver_id: Number.isFinite(receiver_id) ? receiver_id : 0,
    content: content || (effectiveType === 'QT' ? 'ใบเสนอราคา' : effectiveType === 'IM' ? '' : ''),
    created_at: createdAtRaw,
    display_time,
    message_type: effectiveType,
    reference_type:
      refType === 'PD' || refType === 'PM' || refType === 'ID' || refType === 'RQ' || refType === 'OD'
        ? refType
        : '',
    reference_id: Number.isFinite(reference_id) ? reference_id : 0,
    quoteData: qd,
    imageUrl,
    status: 'ok',
  };
}

export function MessageBubble({ msg, currentUserId, peerAvatarUrl }: Props) {
  const isMine = Number(msg.sender_id) === currentUserId;

  if (msg.message_type === 'QT' && msg.quoteData) {
    const q = msg.quoteData;
    return (
      <div className="flex justify-center">
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
                  ฿{q.price.toLocaleString()}
                </p>
                <p className="text-white/70 text-[9px]">ราคารวม</p>
              </div>
              <div className="flex-1 bg-white/20 rounded-xl p-2.5 text-center">
                <p className="text-white" style={{ fontWeight: 700 }}>
                  {q.leadTime} วัน
                </p>
                <p className="text-white/70 text-[9px]">lead time</p>
              </div>
            </div>
            <p className="text-white/60 text-[10px] text-center">ใช้ได้ถึง {q.validUntil}</p>
            {msg.display_time ? (
              <p className="text-white/40 text-[9px] text-center mt-2">{msg.display_time}</p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (msg.message_type === 'IM' && msg.imageUrl) {
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
        {!isMine && (
          <ImageWithFallback
            src={peerAvatarUrl}
            alt=""
            className="w-7 h-7 rounded-xl object-cover shrink-0 mt-auto bg-gray-100"
          />
        )}
        <div className={`max-w-[70%] min-w-0 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
          <div
            className={`rounded-2xl overflow-hidden ${isMine ? 'rounded-br-md' : 'rounded-bl-md'}`}
            style={{ background: isMine ? '#7A4B94' : '#F3F4F6' }}
          >
            <ImageWithFallback
              src={msg.imageUrl}
              alt=""
              className="max-w-full max-h-64 object-cover block"
            />
            {msg.content.trim() ? (
              <p
                className="text-sm px-4 py-2 whitespace-pre-wrap break-words"
                style={{ color: isMine ? '#fff' : '#1F2937' }}
              >
                {msg.content}
              </p>
            ) : null}
            <p
              className="text-[10px] px-4 pb-2"
              style={{
                color: isMine ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
                textAlign: isMine ? 'right' : 'left',
              }}
            >
              {msg.display_time}
              {msg.status === 'sending' ? <span className="ml-1 opacity-70">…</span> : null}
              {msg.status === 'error' ? <span className="ml-1 text-red-200">!</span> : null}
              {isMine && msg.status === 'ok' ? <span className="ml-1">✓✓</span> : null}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const refChip =
    msg.reference_type &&
    ['PD', 'PM', 'ID', 'RQ', 'OD'].includes(msg.reference_type) &&
    msg.reference_id > 0 ? (
      <ReferenceChip
        reference={{ type: msg.reference_type, id: msg.reference_id }}
        titleFallback={`#${msg.reference_id}`}
      />
    ) : null;

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isMine && (
        <ImageWithFallback
          src={peerAvatarUrl}
          alt=""
          className="w-7 h-7 rounded-xl object-cover shrink-0 mt-auto bg-gray-100"
        />
      )}
      <div className={`max-w-[70%] min-w-0 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl ${isMine ? 'rounded-br-md' : 'rounded-bl-md'}`}
          style={{
            background: isMine ? '#7A4B94' : '#F3F4F6',
          }}
        >
          <p className="text-sm whitespace-pre-wrap break-words" style={{ color: isMine ? '#fff' : '#1F2937' }}>
            {msg.content}
          </p>
          <p
            className="text-[10px] mt-0.5"
            style={{
              color: isMine ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
              textAlign: isMine ? 'right' : 'left',
            }}
          >
            {msg.display_time}
            {msg.status === 'sending' ? <span className="ml-1 opacity-70">…</span> : null}
            {msg.status === 'error' ? <span className="ml-1 text-red-200">!</span> : null}
            {isMine && msg.status === 'ok' ? <span className="ml-1">✓✓</span> : null}
          </p>
        </div>
        {refChip}
      </div>
    </div>
  );
}
