import React from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight,
  Check,
  Clock,
  CreditCard,
  FileText,
  X,
} from 'lucide-react';
import { cn } from '@lib/utils';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { ChatReference, ChatReferenceType } from '@/utils/chatContract';
import { ReferenceChip } from '@/components/chat/ReferenceChip';
import { normalizeIso } from '@/pages/messages/selectors';
import { formatChatTime } from '@/utils/chatTime';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { Button } from '@/components/ui/button';
import { openImageLightbox } from '@/stores/useLightboxStore';

/** LINE-style: ข้อความที่ส่ง (ฝั่งเรา) */
const SENT_TEXT_BG = 'var(--brand-violet-soft)';
const SENT_TEXT_BORDER = 'color-mix(in srgb, var(--brand-purple) 22%, var(--neutral-border))';
/** LINE-style: ข้อความที่รับ */
const RECV_TEXT_BG = 'var(--surface-orange-wash)';
const RECV_TEXT_BORDER = 'color-mix(in srgb, var(--brand-orange-deep) 28%, var(--neutral-border))';

/** Tiny inline spinner for the "sending" status on optimistic bubbles. */
function SendingSpinner({ color }: { color: string }) {
  return (
    <svg
      width={10}
      height={10}
      viewBox='0 0 24 24'
      fill='none'
      stroke={color}
      strokeWidth={3}
      className='animate-spin shrink-0'
      aria-label='กำลังส่ง'
    >
      <path d='M21 12a9 9 0 1 1-6.219-8.56' strokeLinecap='round' />
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

function pickImageUrl(
  r: Record<string, unknown>,
  mt: RoomMessage['message_type'],
): string | undefined {
  if (mt !== 'IM') return undefined;
  const u =
    (typeof r.image_url === 'string' && r.image_url) ||
    (typeof r.imageUrl === 'string' && r.imageUrl) ||
    (typeof r.attachment_url === 'string' && r.attachment_url) ||
    (typeof r.attachmentUrl === 'string' && r.attachmentUrl) ||
    '';
  return u || undefined;
}

export function formatDisplayTimeFromIso(isoRaw: string): string {
  return formatChatTime(isoRaw);
}

export function rowToRoomMessage(r: Record<string, unknown>): RoomMessage | null {
  const message_id = String(r.message_id ?? r.id ?? '');
  const content = String(r.content ?? r.text ?? r.body ?? '');
  const rawMessageType = String(r.message_type ?? r.type ?? 'TX');
  const message_type =
    rawMessageType === rawMessageType.toUpperCase() ? rawMessageType : rawMessageType.toLowerCase();
  const sender_id = Number(r.sender_id ?? r.senderId ?? 0);
  const receiver_id = Number(r.receiver_id ?? r.receiverId ?? 0);
  if (!Number.isFinite(sender_id)) return null;

  const refType = String(r.reference_type ?? '').toUpperCase() as RoomMessage['reference_type'];
  const reference_id = Number(r.reference_id ?? 0);
  const reference_title = String(
    r.reference_title ?? r.ref_title ?? r.rfq_title ?? r.showcase_title ?? r.order_title ?? '',
  ).trim();

  const createdAtRaw = String(r.created_at ?? r.sent_at ?? '');

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

  let qd =
    mt === 'QT' || mt === 'quotation_card'
      ? parseQuoteData(r.quote_data ?? r.quoteData)
      : undefined;
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
    content:
      content ||
      (mt === 'QT' || mt === 'quotation_card' ? 'ใบเสนอราคา' : mt === 'rfq_card' ? 'คำขอ RFQ' : ''),
    // Store the normalized ISO (ms-precision) so date comparisons and sorting

    created_at: createdAtNorm || createdAtRaw,
    display_time,
    message_type: mt,
    reference_type:
      refType === 'PD' ||
      refType === 'PM' ||
      refType === 'ID' ||
      refType === 'RQ' ||
      refType === 'OD'
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

function PeerAvatar({ url }: { url: string }) {
  return (
    <ImageWithFallback
      src={url}
      alt=''
      className='mt-auto h-7 w-7 shrink-0 rounded-full object-cover bg-gray-100'
    />
  );
}

function MessageTimeMeta({ msg, isMine }: { msg: RoomMessage; isMine: boolean }) {
  return (
    <span className='inline-flex shrink-0 items-center gap-0.5 text-[10px] leading-none text-gray-400'>
      {msg.status === 'sending' ? (
        <SendingSpinner color='var(--neutral-placeholder)' />
      ) : null}
     
      <span>{msg.display_time}</span>
      {msg.status === 'error' ? <span className='text-red-500'>!</span> : null}
      {isMine && msg.status === 'ok' ? (
        <span
          className='ml-0.5 inline-flex items-center text-gray-400'
          aria-label={msg.is_read ? 'read' : 'unread'}
          title={msg.is_read ? 'Read' : 'Unread'}
        >
          <Check className='h-3 w-3' strokeWidth={2.5} />
          {msg.is_read ? <Check className='-ml-1.5 h-3 w-3' strokeWidth={2.5} /> : null}
        </span>
      ) : null}
    </span>
  );
}

function TextBubbleBody({
  msg,
  isMine,
  refChip,
}: {
  msg: RoomMessage;
  isMine: boolean;
  refChip: React.ReactNode;
}) {
  return (
    <div
      className={cn('flex min-w-0 max-w-[78%] flex-col gap-1', isMine ? 'items-end' : 'items-start')}
    >
      <div className={cn('flex items-end gap-1.5', isMine ? 'flex-row-reverse' : 'flex-row')}>
        <div
          className={cn(
            'rounded-2xl border px-3 py-2 text-[13px] leading-[1.4] whitespace-pre-wrap break-words text-[var(--brand-navy)]',
            isMine ? 'rounded-br-sm' : 'rounded-bl-sm',
            msg.status === 'sending' && 'opacity-60',
          )}
          style={{
            background: isMine ? SENT_TEXT_BG : RECV_TEXT_BG,
            borderColor: isMine ? SENT_TEXT_BORDER : RECV_TEXT_BORDER,
          }}
        >
          {msg.content}
        </div>
        <MessageTimeMeta msg={msg} isMine={isMine} />
      </div>
      {refChip}
    </div>
  );
}

function TextChatBubble({
  msg,
  isMine,
  peerAvatarUrl,
  refChip,
}: {
  msg: RoomMessage;
  isMine: boolean;
  peerAvatarUrl: string;
  refChip: React.ReactNode;
}) {
  return (
    <div className={cn('flex gap-2', isMine ? 'justify-end' : 'justify-start')}>
      {!isMine ? <PeerAvatar url={peerAvatarUrl} /> : null}
      <TextBubbleBody msg={msg} isMine={isMine} refChip={refChip} />
    </div>
  );
}

const CHAT_CARD_SHELL =
  'relative w-full max-w-[min(100%,332px)] overflow-hidden rounded-2xl border border-white/70 bg-[linear-gradient(155deg,rgba(255,255,255,0.92),rgba(248,245,255,0.86))] text-left backdrop-blur-xl transition-all';

const QUOTATION_CHAT_CARD_SHELL =
  'relative w-full max-w-[min(100%,332px)] overflow-hidden rounded-2xl border border-orange-200/75 bg-[linear-gradient(155deg,rgba(255,255,255,0.94),rgba(255,247,237,0.92))] text-left backdrop-blur-xl transition-all';

function RfqChatCard({
  rfqId,
  title,
  viewerRole,
  onOpen,
}: {
  rfqId: number;
  title: string;
  viewerRole: 'CT' | 'FT';
  onOpen: () => void;
}) {
  const canOpen = Number.isFinite(rfqId) && rfqId > 0;
  return (
    <div className='flex justify-center px-1'>
      <article
        className={cn(
          CHAT_CARD_SHELL,
          'max-w-[min(100%,304px)] border-violet-200/80',
          canOpen &&
            'hover:-translate-y-0.5 active:scale-[0.995]',
        )}
      >
        <div
          className='pointer-events-none absolute inset-0 rounded-2xl'
          style={{
            border: '1px solid rgba(139,92,246,0.24)',
          }}
        />
        <div className='pointer-events-none absolute left-3 right-3 top-2 h-8 rounded-full bg-white/45 blur-md' />
        <div
          className='relative z-[1] h-[3px] w-full'
          style={{
            background:
              'linear-gradient(90deg, var(--brand-mauve) 0%, var(--brand-purple) 55%, var(--brand-violet-soft) 100%)',
          }}
        />
        <div className='relative z-[1] p-3.5'>
          <div className='mb-2.5 flex items-start gap-2'>
            <span
              className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'
              style={{
                background:
                  'linear-gradient(145deg, color-mix(in srgb, var(--brand-mauve) 24%, white), color-mix(in srgb, var(--brand-purple) 18%, white))',
              }}
            >
              <FileText size={16} className='text-[var(--brand-purple)]' strokeWidth={2.2} />
            </span>
            <div className='min-w-0 flex-1 pt-0.5'>
              <p className='text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--brand-purple)]'>
                คำขอ RFQ
              </p>
              <p className='mt-1 line-clamp-3 text-[13px] font-bold leading-snug text-[var(--brand-navy)]'>
                {title}
              </p>
            </div>
          </div>
          <div className='mb-2.5 rounded-lg border border-violet-100 bg-violet-50/55 px-2 py-1.5'>
            <p className='text-[10px] font-medium text-violet-900 line-clamp-2'>
              เอกสารอ้างอิง: <span className='font-semibold'>{title}</span>
            </p>
          </div>
          <Button
            variant='unstyled'
            type='button'
            disabled={!canOpen}
            onClick={onOpen}
              className={cn(
                'flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white',
                'disabled:cursor-not-allowed disabled:opacity-45',
                canOpen && 'hover:brightness-[1.02] active:scale-[0.995]',
              )}
              style={{
                background:
                  'linear-gradient(135deg, var(--brand-mauve) 0%, var(--brand-purple) 100%)',
              }}
            >
            {viewerRole === 'FT' ? 'สร้างใบเสนอราคา' : 'ดู RFQ'}
            <ArrowRight size={15} strokeWidth={2.5} />
          </Button>
        </div>
      </article>
    </div>
  );
}

function QuotationStatusPill({ status, viewerRole }: { status: string; viewerRole: 'CT' | 'FT' }) {
  const s = status.toLowerCase();
  if (s === 'accepted' || s === 'ac') {
    return (
      <span className='inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800'>
        <Check size={11} strokeWidth={2.5} />
        ยืนยันแล้ว
      </span>
    );
  }
  if (s === 'rejected' || s === 'rj') {
    return (
      <span className='inline-flex items-center gap-1 rounded-full border border-red-200/80 bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-700'>
        <X size={11} strokeWidth={2.5} />
        ปฏิเสธแล้ว
      </span>
    );
  }
  if (s === 'expired') {
    return (
      <span className='rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600'>
        หมดอายุ
      </span>
    );
  }
  return (
    <span className='rounded-full border border-amber-200/90 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-900'>
      {viewerRole === 'FT' ? 'รอลูกค้ายืนยัน' : 'รอตรวจสอบ'}
    </span>
  );
}

function QuotationChatCard({
  quote,
  viewerRole,
  disabled,
  onOpen,
}: {
  quote: NonNullable<RoomMessage['quoteData']>;
  viewerRole: 'CT' | 'FT';
  disabled: boolean;
  onOpen: () => void;
}) {
  const qStatus = String(quote.status ?? 'pending').toLowerCase();

  return (
    <div className='flex justify-center px-1'>
      <article
        className={cn(
          QUOTATION_CHAT_CARD_SHELL,
          'max-w-[min(100%,304px)]',
          !disabled && 'hover:-translate-y-0.5 active:scale-[0.995]',
        )}
      >
        <div
          className='pointer-events-none absolute inset-0 rounded-2xl'
          style={{
            border: '1px solid color-mix(in srgb, var(--brand-orange) 28%, white)',
          }}
        />
        <div className='pointer-events-none absolute left-3 right-3 top-2 h-8 rounded-full bg-orange-100/40 blur-md' />
        <div
          className='relative z-[1] h-[3px] w-full'
          style={{
            background:
              'linear-gradient(90deg, var(--brand-orange-deep) 0%, var(--brand-orange) 55%, #fdba74 100%)',
          }}
        />
        <div className='relative z-[1] p-3.5'>
          <div className='mb-2.5 flex items-start gap-2'>
            <span
              className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'
              style={{
                background:
                  'linear-gradient(145deg, color-mix(in srgb, var(--brand-orange-deep) 22%, white), color-mix(in srgb, var(--brand-orange) 16%, white))',
              }}
            >
              <CreditCard size={16} className='text-[var(--brand-orange-deep)]' strokeWidth={2.2} />
            </span>
            <div className='min-w-0 flex-1 pt-0.5'>
              <p className='text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--brand-orange-deep)]'>
                ใบเสนอราคา
              </p>
              <p className='mt-1 text-[13px] font-bold leading-snug text-[var(--brand-navy)] tabular-nums'>
                {formatCurrency(quote.price, 'THB')}
              </p>
            </div>
            <QuotationStatusPill status={qStatus} viewerRole={viewerRole} />
          </div>

          <div className='mb-2.5 grid grid-cols-2 gap-1.5'>
            <div className='rounded-lg border border-orange-100 bg-orange-50/70 px-2 py-1.5 text-center'>
              <p className='flex items-center justify-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide text-orange-800'>
                <Clock size={10} className='text-[var(--brand-orange-deep)]' />
                Lead time
              </p>
              <p className='mt-0.5 text-[12px] font-bold tabular-nums text-[var(--brand-navy)]'>
                {quote.leadTime} <span className='text-[10px] font-medium text-orange-700'>วัน</span>
              </p>
            </div>
            <div className='rounded-lg border border-orange-100 bg-orange-50/70 px-2 py-1.5 text-center'>
              <p className='text-[9px] font-semibold uppercase tracking-wide text-orange-800'>ใช้ได้ถึง</p>
              <p className='mt-0.5 text-[12px] font-bold text-[var(--brand-navy)]'>
                {quote.validUntil || '-'}
              </p>
            </div>
          </div>

          <Button
            variant='unstyled'
            type='button'
            disabled={disabled}
            onClick={onOpen}
            className={cn(
              'flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white',
              'disabled:cursor-not-allowed disabled:opacity-45',
              !disabled && 'hover:brightness-[1.02] active:scale-[0.995]',
            )}
            style={{
              background:
                'linear-gradient(135deg, var(--brand-orange-deep) 0%, var(--brand-orange) 100%)',
            }}
          >
            ดูรายละเอียด
            <ArrowRight size={15} strokeWidth={2.5} />
          </Button>
        </div>
      </article>
    </div>
  );
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
      <div className='flex justify-center'>
        <span className='text-[11px] text-gray-600 bg-gray-100 px-3 py-1 rounded-full'>
          {msg.content}
        </span>
      </div>
    );
  }

  if (msg.message_type === 'rfq_card') {
    const rfqId = Number(msg.reference_id ?? 0);
    const title = msg.reference_title || msg.content || `RFQ #${rfqId}`;
    return (
      <RfqChatCard
        rfqId={rfqId}
        title={title}
        viewerRole={viewerRole}
        onOpen={() => {
          if (!Number.isFinite(rfqId) || rfqId <= 0) return;
          navigate(viewerRole === 'FT' ? `/factory/rfqs/${rfqId}` : `/rfqs/${rfqId}`);
        }}
      />
    );
  }

  if ((msg.message_type === 'quotation_card' || msg.message_type === 'QT') && msg.quoteData) {
    const q = msg.quoteData;
    const qId = Number(q.quotationId ?? 0);
    const rfqId = Number(q.rfqId ?? msg.reference_id ?? 0);
    const factoryId = Number(q.factoryId ?? 0);
    const canOpen = qId > 0;
    const quotationPath = viewerRole === 'FT' ? `/factory/quotations/${qId}` : `/quotations/${qId}`;

    return (
      <QuotationChatCard
        quote={q}
        viewerRole={viewerRole}
        disabled={viewerRole === 'CT' ? rfqId <= 0 : !canOpen}
        onOpen={() => {
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
      />
    );
  }

  if (msg.message_type === 'IM' && msg.imageUrl) {
    const caption = msg.content.trim();
    return (
      <div className={cn('flex gap-2', isMine ? 'justify-end' : 'justify-start')}>
        {!isMine ? <PeerAvatar url={peerAvatarUrl} /> : null}
        <div
          className={cn(
            'flex min-w-0 max-w-[78%] flex-col gap-1',
            isMine ? 'items-end' : 'items-start',
          )}
        >
          <button
            type='button'
            onClick={() => msg.imageUrl && openImageLightbox(msg.imageUrl)}
            className={cn(
              'overflow-hidden rounded-2xl focus:outline-none active:opacity-80',
              isMine ? 'rounded-br-md' : 'rounded-bl-md',
              msg.status === 'sending' && 'opacity-60',
            )}
            aria-label='ดูรูปขนาดใหญ่'
          >
            <ImageWithFallback
              src={msg.imageUrl}
              alt=''
              className='block max-h-72 w-full max-w-[min(100%,280px)] object-cover'
            />
          </button>
          {caption ? (
            <TextBubbleBody
              msg={{ ...msg, content: caption, message_type: 'TX' }}
              isMine={isMine}
              refChip={null}
            />
          ) : (
            <div
              className={cn(
                'flex items-center gap-1.5 px-0.5',
                isMine ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              <MessageTimeMeta msg={msg} isMine={isMine} />
            </div>
          )}
        </div>
      </div>
    );
  }

  const refChip =
    msg.reference_id > 0 ? (
      <ReferenceChip
        reference={{ type: msg.reference_type, id: msg.reference_id } as ChatReference}
        titleFallback={msg.reference_title}
      />
    ) : null;

  return (
    <TextChatBubble msg={msg} isMine={isMine} peerAvatarUrl={peerAvatarUrl} refChip={refChip} />
  );
}
