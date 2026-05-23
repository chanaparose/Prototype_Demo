import { normalizeIso } from '@/pages/messages/selectors';
import { sortMessagesByCreatedAt } from '@/pages/messages/selectors';
import { chatNowIso, formatChatTime } from '@/utils/chatTime';
import { apiListAsRecords, asRecord, type ApiRecord } from '@/lib/apiShape';
import { pickScalarString } from '@/utils/pickScalarString';
import type { ChatReferenceType } from '@/utils/chatContract';

export type RoomMessageQuoteData = {
  quotationId?: number;
  rfqId?: number;
  factoryId?: number;
  price: number;
  leadTime: number;
  validUntil: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'expired' | string;
};

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
  quoteData?: RoomMessageQuoteData;
  imageUrl?: string;
  is_read?: boolean;
  status?: 'sending' | 'ok' | 'error';
};

export function formatDisplayTimeFromIso(isoRaw: string): string {
  return formatChatTime(isoRaw);
}

export function parseQuoteDataFromApi(raw: unknown): RoomMessageQuoteData | undefined {
  if (raw == null) return undefined;
  let q: ApiRecord | null = null;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return undefined;
    try {
      q = asRecord(JSON.parse(s));
    } catch {
      return undefined;
    }
  } else if (typeof raw === 'object') {
    q = asRecord(raw);
  }
  if (!q || Object.keys(q).length === 0) return undefined;

  const quotationId = Number(q.quotation_id ?? q.quotationId ?? q.quote_id ?? q.quoteId ?? 0);
  const rfqId = Number(q.rfq_id ?? q.rfqId ?? q.request_id ?? q.requestId ?? 0);
  const factoryId = Number(q.factory_id ?? q.factoryId ?? 0);
  return {
    quotationId: Number.isFinite(quotationId) && quotationId > 0 ? quotationId : undefined,
    rfqId: Number.isFinite(rfqId) && rfqId > 0 ? rfqId : undefined,
    factoryId: Number.isFinite(factoryId) && factoryId > 0 ? factoryId : undefined,
    price: Number(q.price ?? q.total ?? 0),
    leadTime: Number(q.lead_time ?? q.leadTime ?? q.lead_time_days ?? 0),
    validUntil: pickScalarString(q.valid_until, q.validUntil),
    status: pickScalarString(q.status, 'pending').toLowerCase(),
  };
}

function pickImageUrl(row: ApiRecord, mt: RoomMessage['message_type']): string | undefined {
  if (mt !== 'IM') return undefined;
  const u = pickScalarString(row.image_url, row.imageUrl, row.attachment_url, row.attachmentUrl);
  return u || undefined;
}

export function mapChatMessageRow(raw: unknown): RoomMessage | null {
  const r = asRecord(raw);
  const message_id = pickScalarString(r.message_id, r.id);
  const content = pickScalarString(r.content, r.text, r.body);
  const rawMessageType = pickScalarString(r.message_type, r.type, 'TX');
  const message_type =
    rawMessageType === rawMessageType.toUpperCase() ? rawMessageType : rawMessageType.toLowerCase();
  const sender_id = Number(r.sender_id ?? r.senderId ?? 0);
  const receiver_id = Number(r.receiver_id ?? r.receiverId ?? 0);
  if (!Number.isFinite(sender_id)) return null;

  const refType = pickScalarString(r.reference_type).toUpperCase() as RoomMessage['reference_type'];
  const reference_id = Number(r.reference_id ?? 0);
  const reference_title = pickScalarString(
    r.reference_title,
    r.ref_title,
    r.rfq_title,
    r.showcase_title,
    r.order_title,
  );

  const createdAtRaw = pickScalarString(r.created_at, r.sent_at);
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
      ? parseQuoteDataFromApi(r.quote_data ?? r.quoteData)
      : undefined;
  if ((mt === 'QT' || mt === 'quotation_card') && !qd) {
    qd = parseQuoteDataFromApi(r.quote);
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

export const rowToRoomMessage = mapChatMessageRow;

export function messagesFromApiList(raw: unknown): RoomMessage[] {
  return sortMessagesByCreatedAt(
    apiListAsRecords(raw)
      .map(mapChatMessageRow)
      .filter((m): m is RoomMessage => m != null),
  );
}

/** Normalize shared RFQ card payload before mapping to a room message. */
export function normalizeSharedChatMessageRow(raw: unknown): ApiRecord {
  const row = asRecord(raw);
  const ca = pickScalarString(row.created_at);
  const caNorm = normalizeIso(ca);
  const isInvalid = !caNorm || Number.isNaN(new Date(caNorm).getTime());
  if (isInvalid) {
    return { ...row, created_at: chatNowIso() };
  }
  return row;
}

/** @deprecated Prefer messagesFromApiList */
export const messagesFromApi = messagesFromApiList;
