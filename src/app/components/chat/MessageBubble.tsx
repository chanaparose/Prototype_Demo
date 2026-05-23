import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Check, CreditCard, X } from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { ChatReference } from '@/utils/chatContract';
import { ReferenceChip } from '@/components/chat/ReferenceChip';
import {
  formatDisplayTimeFromIso,
  mapChatMessageRow,
  type RoomMessage,
} from '@/domain/chat/mappers/mapChatMessage';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { Button } from '@/components/ui/button';

export type { RoomMessage };
export { formatDisplayTimeFromIso, mapChatMessageRow as rowToRoomMessage };

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

type Props = {
  msg: RoomMessage;
  currentUserId: number;
  peerAvatarUrl: string;
  viewerRole: 'CT' | 'FT';
  quotationLoadingId?: number | null;
  onAcceptQuotation?: (quotationId: number) => void;
  onRejectQuotation?: (quotationId: number) => void;
};

export function MessageBubble({
  msg,
  currentUserId,
  peerAvatarUrl,
  viewerRole,
}: Readonly<Props>) {
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
    return (
      <div className='flex justify-center'>
        <div className='bg-white border-l-4 border-brand-mauve rounded-2xl p-4 shadow-sm max-w-[320px] w-full'>
          <p className='text-[10px] font-semibold text-brand-mauve uppercase tracking-wide mb-1'>
            คำขอ RFQ
          </p>
          <p className='text-sm font-bold text-gray-900'>{msg.reference_title || msg.content || `RFQ #${rfqId}`}</p>
          <div className='border-t border-gray-100 my-3' />
          <Button
            variant='unstyled'
            type='button'
            className='text-sm font-semibold text-brand-mauve flex items-center gap-1 hover:underline'
            onClick={() => {
              if (!Number.isFinite(rfqId) || rfqId <= 0) return;
              navigate(viewerRole === 'FT' ? `/factory/rfqs/${rfqId}` : `/rfqs/${rfqId}`);
            }}
          >
            {viewerRole === 'FT' ? 'สร้างใบเสนอราคา' : 'ดู RFQ'} <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    );
  }

  if ((msg.message_type === 'quotation_card' || msg.message_type === 'QT') && msg.quoteData) {
    const q = msg.quoteData;
    // For message_type 'QT', reference_id is always the RFQ id — derive navigation
    // targets from message_type alone, not from reference_type.
    const qId = Number(q.quotationId ?? 0);
    const rfqId = Number(q.rfqId ?? msg.reference_id ?? 0);
    const factoryId = Number(q.factoryId ?? 0);
    const qStatus = String(q.status ?? 'pending').toLowerCase();
    const canOpen = qId > 0;
    const quotationPath = viewerRole === 'FT' ? `/factory/quotations/${qId}` : `/quotations/${qId}`;

    const statusPill = (() => {
      if (qStatus === 'accepted' || qStatus === 'ac') {
        return (
          <span className='text-[11px] px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-50 inline-flex items-center gap-1'>
            <Check size={12} /> ยืนยันแล้ว
          </span>
        );
      }
      if (qStatus === 'rejected' || qStatus === 'rj') {
        return (
          <span className='text-[11px] px-2.5 py-1 rounded-full bg-red-400/20 text-red-50 inline-flex items-center gap-1'>
            <X size={12} /> ปฏิเสธแล้ว
          </span>
        );
      }
      if (qStatus === 'expired') {
        return (
          <span className='text-[11px] px-2.5 py-1 rounded-full bg-white/15 text-white/80'>
            หมดอายุ
          </span>
        );
      }
      // pending / pd
      return (
        <span className='text-[11px] px-2.5 py-1 rounded-full bg-white/20 text-white'>
          {viewerRole === 'FT' ? 'รอลูกค้ายืนยัน' : 'รอตรวจสอบ'}
        </span>
      );
    })();

    return (
      <div className='flex justify-center'>
        <Button
          variant='unstyled'
          type='button'
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
          className='w-full max-w-[320px] rounded-2xl overflow-hidden shadow-sm text-left disabled:cursor-default enabled:hover:shadow-md enabled:active:scale-[0.99] transition-all'
          style={{ background: 'linear-gradient(135deg, var(--brand-royal), #8B5CF6)' }}
          aria-label='ดูรายละเอียดใบเสนอราคา'
        >
          <div className='p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-2'>
                <CreditCard size={16} className='text-yellow-300' />
                <span className='text-white text-xs' style={{ fontWeight: 700 }}>
                  ใบเสนอราคาทางการ
                </span>
              </div>
              {statusPill}
            </div>
            <div className='flex gap-3 mb-4'>
              <div className='flex-1 bg-white/20 rounded-xl p-2.5 text-center'>
                <p className='text-white' style={{ fontWeight: 700 }}>
                  {formatCurrency(q.price, 'THB')}
                </p>
                <p className='text-white/70 text-[9px]'>ราคารวม</p>
              </div>
              <div className='flex-1 bg-white/20 rounded-xl p-2.5 text-center'>
                <p className='text-white' style={{ fontWeight: 700 }}>
                  {q.leadTime} วัน
                </p>
                <p className='text-white/70 text-[9px]'>lead time</p>
              </div>
            </div>
            <p className='text-white/60 text-[10px] text-center'>ใช้ได้ถึง {q.validUntil || '-'}</p>
            {canOpen ? (
              <div className='mt-3 flex items-center justify-center gap-1 text-[11px] text-white/90 font-semibold'>
                <span>ดูรายละเอียด</span>
                <ArrowRight size={12} />
              </div>
            ) : null}
            {msg.display_time ? (
              <p className='text-white/40 text-[9px] text-center mt-2'>{msg.display_time}</p>
            ) : null}
          </div>
        </Button>
      </div>
    );
  }

  if (msg.message_type === 'IM' && msg.imageUrl) {
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
        {!isMine && (
          <ImageWithFallback
            src={peerAvatarUrl}
            alt=''
            className='w-7 h-7 rounded-xl object-cover shrink-0 mt-auto bg-gray-100'
          />
        )}
        <div
          className={`max-w-[70%] min-w-0 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}
        >
          <div
            className={`rounded-2xl overflow-hidden ${isMine ? 'rounded-br-md' : 'rounded-bl-md'} ${msg.status === 'sending' ? 'opacity-60' : ''}`}
            style={{ background: isMine ? 'var(--brand-mauve)' : 'var(--neutral-muted)' }}
          >
            <ImageWithFallback
              src={msg.imageUrl}
              alt=''
              className='max-w-full max-h-64 object-cover block'
            />
            {msg.content.trim() ? (
              <p
                className='text-sm px-4 py-2 whitespace-pre-wrap break-words'
                style={{ color: isMine ? 'var(--neutral-white)' : '#1F2937' }}
              >
                {msg.content}
              </p>
            ) : null}
            <p
              className='text-[10px] px-4 pb-2 flex items-center gap-1'
              style={{
                color: isMine ? 'rgba(255,255,255,0.5)' : 'var(--neutral-placeholder)',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.status === 'sending' ? (
                <SendingSpinner
                  color={isMine ? 'var(--neutral-white)' : 'var(--neutral-placeholder)'}
                />
              ) : null}
              <span>{msg.display_time}</span>
              {msg.status === 'error' ? <span className='ml-1 text-red-200'>!</span> : null}
              {isMine && msg.status === 'ok' ? (
                <span
                  className='ml-1 inline-flex items-center'
                  aria-label={msg.is_read ? 'read' : 'unread'}
                  title={msg.is_read ? 'Read' : 'Unread'}
                >
                  <Check className='w-3 h-3' strokeWidth={2.5} />
                  {msg.is_read ? <Check className='w-3 h-3 -ml-1.5' strokeWidth={2.5} /> : null}
                </span>
              ) : null}
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
        reference={{ type: msg.reference_type, id: msg.reference_id } as ChatReference}
        titleFallback={msg.reference_title}
      />
    ) : null;

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isMine && (
        <ImageWithFallback
          src={peerAvatarUrl}
          alt=''
          className='w-7 h-7 rounded-xl object-cover shrink-0 mt-auto bg-gray-100'
        />
      )}
      <div className={`max-w-[70%] min-w-0 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl ${isMine ? 'rounded-br-md' : 'rounded-bl-md'} ${msg.status === 'sending' ? 'opacity-60' : ''}`}
          style={{ background: isMine ? 'var(--brand-mauve)' : 'var(--neutral-muted)' }}
        >
          <p
            className='text-sm whitespace-pre-wrap break-words'
            style={{ color: isMine ? 'var(--neutral-white)' : '#1F2937' }}
          >
            {msg.content}
          </p>
          <p
            className='text-[10px] mt-0.5 flex items-center gap-1'
            style={{
              color: isMine ? 'rgba(255,255,255,0.5)' : 'var(--neutral-placeholder)',
              justifyContent: isMine ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.status === 'sending' ? (
              <SendingSpinner
                color={isMine ? 'var(--neutral-white)' : 'var(--neutral-placeholder)'}
              />
            ) : null}
            <span>{msg.display_time}</span>
            {msg.status === 'error' ? <span className='ml-1 text-red-200'>!</span> : null}
            {isMine && msg.status === 'ok' ? (
              <span
                className='ml-1 inline-flex items-center'
                aria-label={msg.is_read ? 'read' : 'unread'}
                title={msg.is_read ? 'Read' : 'Unread'}
              >
                <Check className='w-3 h-3' strokeWidth={2.5} />
                {msg.is_read ? <Check className='w-3 h-3 -ml-1.5' strokeWidth={2.5} /> : null}
              </span>
            ) : null}
          </p>
        </div>
        {refChip}
      </div>
    </div>
  );
}
