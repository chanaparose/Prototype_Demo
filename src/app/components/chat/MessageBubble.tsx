import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Check, CreditCard, FileText, X } from 'lucide-react';
import { ImageWithFallback } from '../shared';
import type { ChatReference, ChatReferenceType } from '../../utils/chatContract';
import { ReferenceChip } from './ReferenceChip';
import { normalizeIso } from '../../pages/messages/selectors';
import { formatChatTime } from '../../utils/chatTime';

/** Tiny inline spinner for the "sending" status on optimistic bubbles. */
function SendingSpinner({ color }: { color: string }) {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={3}
      className="animate-spin shrink-0"
      aria-label="กำลังส่ง"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
    </svg>
  );
}

export type RoomMessage = {
  key: string;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  display_time: string;
  message_type: 'TX' | 'QT' | 'IM' | 'rfq_card' | 'quotation_card' | 'system';
  reference_type: '' | ChatReferenceType;
  reference_id: number;
  reference_title?: string;
  quoteData?: {
    quotationId?: number;
    rfqId?: number;
    factoryId?: number;
    price: number;
    leadTime: number;
    validUntil: string;
    status?: 'pending' | 'accepted' | 'rejected' | 'expired' | string;
  };
  imageUrl?: string;
  is_read?: boolean;
  status?: 'sending' | 'ok' | 'error';
};

type Props = {
  msg: RoomMessage;
  currentUserId: number;
  peerAvatarUrl: string;
  viewerRole: 'CT' | 'FT';
  quotationLoadingId?: number | null;
  onAcceptQuotation?: (quotationId: number) => void;
  onRejectQuotation?: (quotationId: number) => void;
};

function parseQuoteData(raw: unknown): RoomMessage['quoteData'] | undefined {
  if (raw == null) return undefined;
  let q: Record<string, unknown> | null = null;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return undefined;
    try {
      q = JSON.parse(s) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  } else if (typeof raw === 'object') {
    q = raw as Record<string, unknown>;
  }
  if (!q) return undefined;

  const quotationId = Number(q.quotation_id ?? q.quotationId ?? q.quote_id ?? q.quoteId ?? 0);
  const rfqId = Number(q.rfq_id ?? q.rfqId ?? q.request_id ?? q.requestId ?? 0);
  const factoryId = Number(q.factory_id ?? q.factoryId ?? 0);
  return {
    quotationId: Number.isFinite(quotationId) && quotationId > 0 ? quotationId : undefined,
    rfqId: Number.isFinite(rfqId) && rfqId > 0 ? rfqId : undefined,
    factoryId: Number.isFinite(factoryId) && factoryId > 0 ? factoryId : undefined,
    price: Number(q.price ?? q.total ?? 0),
    leadTime: Number(q.lead_time ?? q.leadTime ?? q.lead_time_days ?? 0),
    validUntil: String(q.valid_until ?? q.validUntil ?? ''),
    status: String(q.status ?? 'pending').toLowerCase(),
  };
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

/**
 * Format a chat timestamp as `HH:mm` in Bangkok time.
 * Delegates to {@link formatChatTime} which handles the BE bug where
 * Bangkok wall-clock timestamps are stamped with `Z` (see chatTime.ts).
 */
export function formatDisplayTimeFromIso(isoRaw: string): string {
  return formatChatTime(isoRaw);
}

export function rowToRoomMessage(r: Record<string, unknown>): RoomMessage | null {
  const message_id = String(r.message_id ?? r.id ?? '');
  const content = String(r.content ?? r.text ?? r.body ?? '');
  const rawMessageType = String(r.message_type ?? r.type ?? 'TX');
  const message_type = rawMessageType === rawMessageType.toUpperCase() ? rawMessageType : rawMessageType.toLowerCase();
  const sender_id = Number(r.sender_id ?? r.senderId ?? 0);
  const receiver_id = Number(r.receiver_id ?? r.receiverId ?? 0);
  if (!Number.isFinite(sender_id)) return null;

  const refType = String(r.reference_type ?? '').toUpperCase() as RoomMessage['reference_type'];
  const reference_id = Number(r.reference_id ?? 0);
  const reference_title = String(
    r.reference_title ??
      r.ref_title ??
      r.rfq_title ??
      r.showcase_title ??
      r.order_title ??
      '',
  ).trim();

  const createdAtRaw = String(r.created_at ?? r.sent_at ?? '');
  // normalizeIso strips Go nanoseconds (>3 fractional digits) and guards
  // against Go zero time "0001-01-01…" — both cause NaN in Safari.
  const createdAtNorm = normalizeIso(createdAtRaw);
  const display_time = formatDisplayTimeFromIso(createdAtNorm || createdAtRaw);

  let mt: RoomMessage['message_type'];
  if (
    message_type === 'QT' ||
    message_type === 'IM' ||
    message_type === 'TX' ||
    message_type === 'rfq_card' ||
    message_type === 'quotation_card' ||
    message_type === 'system'
  ) {
    mt = message_type;
  } else {
    mt = 'TX';
  }

  let qd = mt === 'QT' || mt === 'quotation_card' ? parseQuoteData(r.quote_data ?? r.quoteData) : undefined;
  if ((mt === 'QT' || mt === 'quotation_card') && !qd) {
    qd = parseQuoteData((r as Record<string, unknown>).quote);
  }

  const imageUrl = pickImageUrl(r, mt);
  const hasBody =
    content.trim() !== '' ||
    mt === 'QT' ||
    mt === 'quotation_card' ||
    mt === 'rfq_card' ||
    mt === 'system' ||
    (mt === 'IM' && Boolean(imageUrl));

  if (!hasBody) return null;

  return {
    key: message_id || `k-${sender_id}-${createdAtNorm || createdAtRaw}-${content.slice(0, 6)}`,
    sender_id,
    receiver_id: Number.isFinite(receiver_id) ? receiver_id : 0,
    content: content || (mt === 'QT' || mt === 'quotation_card' ? 'ใบเสนอราคา' : mt === 'rfq_card' ? 'คำขอ RFQ' : ''),
    // Store the normalized ISO (ms-precision) so date comparisons and sorting
    // work correctly in all browsers (Safari rejects >3 fractional digits).
    created_at: createdAtNorm || createdAtRaw,
    display_time,
    message_type: mt,
    reference_type:
      refType === 'PD' || refType === 'PM' || refType === 'ID' || refType === 'RQ' || refType === 'OD'
        ? refType
        : '',
    reference_id: Number.isFinite(reference_id) ? reference_id : 0,
    reference_title: reference_title || undefined,
    quoteData: qd,
    imageUrl,
    is_read: Boolean(r.is_read ?? false),
    status: 'ok',
  };
}

export function MessageBubble({
  msg,
  currentUserId,
  peerAvatarUrl,
  viewerRole,
  quotationLoadingId,
  onAcceptQuotation,
  onRejectQuotation,
}: Props) {
  const navigate = useNavigate();
  const isMine = Number(msg.sender_id) === currentUserId;

  if (msg.message_type === 'system') {
    return (
      <div className="flex justify-center">
        <span className="text-[11px] text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{msg.content}</span>
      </div>
    );
  }

  if (msg.message_type === 'rfq_card') {
    const rfqId = Number(msg.reference_id ?? 0);
    return (
      <div className="flex justify-center">
        <div className="bg-white border-l-4 border-[#7A4B94] rounded-2xl p-4 shadow-sm max-w-[320px] w-full">
          <p className="text-[10px] font-semibold text-[#7A4B94] uppercase tracking-wide mb-1">คำขอ RFQ</p>
          <p className="text-sm font-bold text-gray-900">{msg.content || `RFQ #${rfqId}`}</p>
          <div className="border-t border-gray-100 my-3" />
          <button
            type="button"
            className="text-sm font-semibold text-[#7A4B94] flex items-center gap-1 hover:underline"
            onClick={() => {
              if (!Number.isFinite(rfqId) || rfqId <= 0) return;
              navigate(viewerRole === 'FT' ? `/factory/rfqs/${rfqId}` : `/rfqs/${rfqId}`);
            }}
          >
            {viewerRole === 'FT' ? 'สร้างใบเสนอราคา' : 'ดู RFQ'} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  if ((msg.message_type === 'quotation_card' || msg.message_type === 'QT') && msg.quoteData) {
    const q = msg.quoteData;
    const qId = Number(q.quotationId ?? msg.reference_id ?? 0);
    const rfqId =
      Number(
        (msg.reference_type === 'RQ' ? msg.reference_id : 0) ??
          q.rfqId ??
          0,
      ) || Number(q.rfqId ?? 0);
    const factoryId = Number(q.factoryId ?? 0);
    const qStatus = String(q.status ?? 'pending').toLowerCase();
    const canOpen = qId > 0;
    const quotationPath = viewerRole === 'FT' ? `/factory/quotations/${qId}` : `/quotations/${qId}`;

    const statusPill = (() => {
      if (qStatus === 'accepted' || qStatus === 'ac') {
        return (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-50 inline-flex items-center gap-1">
            <Check size={12} /> ยืนยันแล้ว
          </span>
        );
      }
      if (qStatus === 'rejected' || qStatus === 'rj') {
        return (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-red-400/20 text-red-50 inline-flex items-center gap-1">
            <X size={12} /> ปฏิเสธแล้ว
          </span>
        );
      }
      if (qStatus === 'expired') {
        return (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/15 text-white/80">
            หมดอายุ
          </span>
        );
      }
      // pending / pd
      return (
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/20 text-white">
          {viewerRole === 'FT' ? 'รอลูกค้ายืนยัน' : 'รอตรวจสอบ'}
        </span>
      );
    })();

    return (
      <div className="flex justify-center">
        <button
          type="button"
          disabled={viewerRole === 'CT' ? rfqId <= 0 : !canOpen}
          onClick={() => {
            if (viewerRole === 'CT' && rfqId > 0) {
              const qs = new URLSearchParams();
              if (qId > 0) qs.set('quote_id', String(qId));
              if (factoryId > 0) qs.set('factory_id', String(factoryId));
              const suffix = qs.toString();
              navigate(`/rfqs/${rfqId}${suffix ? `?${suffix}` : ''}`);
              return;
            }
            if (canOpen) navigate(quotationPath);
          }}
          className="w-full max-w-[320px] rounded-2xl overflow-hidden shadow-sm text-left disabled:cursor-default enabled:hover:shadow-md enabled:active:scale-[0.99] transition-all"
          style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)' }}
          aria-label="ดูรายละเอียดใบเสนอราคา"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-yellow-300" />
                <span className="text-white text-xs" style={{ fontWeight: 700 }}>ใบเสนอราคาทางการ</span>
              </div>
              {statusPill}
            </div>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-white/20 rounded-xl p-2.5 text-center">
                <p className="text-white" style={{ fontWeight: 700 }}>฿{q.price.toLocaleString('th-TH')}</p>
                <p className="text-white/70 text-[9px]">ราคารวม</p>
              </div>
              <div className="flex-1 bg-white/20 rounded-xl p-2.5 text-center">
                <p className="text-white" style={{ fontWeight: 700 }}>{q.leadTime} วัน</p>
                <p className="text-white/70 text-[9px]">lead time</p>
              </div>
            </div>
            <p className="text-white/60 text-[10px] text-center">ใช้ได้ถึง {q.validUntil || '-'}</p>
            {canOpen ? (
              <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-white/90 font-semibold">
                <span>ดูรายละเอียด</span>
                <ArrowRight size={12} />
              </div>
            ) : null}
            {msg.display_time ? (
              <p className="text-white/40 text-[9px] text-center mt-2">{msg.display_time}</p>
            ) : null}
          </div>
        </button>
      </div>
    );
  }

  if (msg.message_type === 'IM' && msg.imageUrl) {
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
        {!isMine && (
          <ImageWithFallback src={peerAvatarUrl} alt="" className="w-7 h-7 rounded-xl object-cover shrink-0 mt-auto bg-gray-100" />
        )}
        <div className={`max-w-[70%] min-w-0 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
          <div
            className={`rounded-2xl overflow-hidden ${isMine ? 'rounded-br-md' : 'rounded-bl-md'} ${msg.status === 'sending' ? 'opacity-60' : ''}`}
            style={{ background: isMine ? '#7A4B94' : '#F3F4F6' }}
          >
            <ImageWithFallback src={msg.imageUrl} alt="" className="max-w-full max-h-64 object-cover block" />
            {msg.content.trim() ? (
              <p className="text-sm px-4 py-2 whitespace-pre-wrap break-words" style={{ color: isMine ? '#fff' : '#1F2937' }}>
                {msg.content}
              </p>
            ) : null}
            <p className="text-[10px] px-4 pb-2 flex items-center gap-1" style={{ color: isMine ? 'rgba(255,255,255,0.5)' : '#9CA3AF', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              {msg.status === 'sending' ? (
                <SendingSpinner color={isMine ? '#fff' : '#9CA3AF'} />
              ) : null}
              <span>{msg.display_time}</span>
              {msg.status === 'error' ? <span className="ml-1 text-red-200">!</span> : null}
              {isMine && msg.status === 'ok' && msg.is_read ? <span className="ml-1">อ่านแล้ว</span> : null}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const refChip =
    msg.reference_type && ['PD', 'PM', 'ID', 'RQ', 'OD'].includes(msg.reference_type) && msg.reference_id > 0 ? (
      <ReferenceChip
        reference={{ type: msg.reference_type, id: msg.reference_id, title: msg.reference_title || undefined } as ChatReference}
        titleFallback={msg.reference_title || undefined}
      />
    ) : null;

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isMine && (
        <ImageWithFallback src={peerAvatarUrl} alt="" className="w-7 h-7 rounded-xl object-cover shrink-0 mt-auto bg-gray-100" />
      )}
      <div className={`max-w-[70%] min-w-0 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl ${isMine ? 'rounded-br-md' : 'rounded-bl-md'} ${msg.status === 'sending' ? 'opacity-60' : ''}`}
          style={{ background: isMine ? '#7A4B94' : '#F3F4F6' }}
        >
          <p className="text-sm whitespace-pre-wrap break-words" style={{ color: isMine ? '#fff' : '#1F2937' }}>{msg.content}</p>
          <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: isMine ? 'rgba(255,255,255,0.5)' : '#9CA3AF', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
            {msg.status === 'sending' ? (
              <SendingSpinner color={isMine ? '#fff' : '#9CA3AF'} />
            ) : null}
            <span>{msg.display_time}</span>
            {msg.status === 'error' ? <span className="ml-1 text-red-200">!</span> : null}
            {isMine && msg.status === 'ok' && msg.is_read ? <span className="ml-1">อ่านแล้ว</span> : null}
          </p>
        </div>
        {refChip}
      </div>
    </div>
  );
}
