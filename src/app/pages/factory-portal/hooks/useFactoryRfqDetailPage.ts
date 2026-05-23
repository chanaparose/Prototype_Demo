import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { factoryRfqsApi, quotationsApi } from '@/services/api/rfqApi';
import { conversationsApi, messagesApi } from '@/services/api/chatApi';
import { factoryKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/apiError';
import { useAppMutation } from '@/hooks/useAppMutation';
import { buildSendPayload, getCurrentUserId } from '@/utils/chatContract';
import type { ApiConversation } from '@/utils/chatContract';
import type { IQuotationResponse } from '@/services/api/types/rfq.types';
import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';

export type FactoryRfqQuoteRow = IQuotationResponse & {
  factoryId?: number | string;
  id?: number | string;
  mold_cost?: number | string;
  image_urls?: unknown;
};

export type FactoryRfqDetailData = {
  rfqTitle: string;
  rfqBody: Record<string, unknown>;
  quotes: FactoryRfqQuoteRow[];
  subCategoryName: string;
  commissionConfig: { vat_rate: number; commission_rate: number } | null;
};

function quoteIdOf(q: FactoryRfqQuoteRow): string {
  return String(q.quote_id ?? q.id ?? '');
}

async function findExistingConvId(
  customerId: number,
  fid: number,
): Promise<number | null> {
  const convsRaw = await conversationsApi.list();
  const convs = (() => {
    if (Array.isArray(convsRaw)) return convsRaw as unknown as Array<Record<string, unknown>>;
    if (convsRaw && typeof convsRaw === 'object') {
      const root = convsRaw as Record<string, unknown>;
      for (const key of ['conversations', 'data', 'items', 'results']) {
        const value = root[key];
        if (Array.isArray(value)) return value as Array<Record<string, unknown>>;
      }
    }
    return [] as Array<Record<string, unknown>>;
  })();

  const customerIdOf = (c: Record<string, unknown>): number =>
    Number(
      c.customer_id ??
        c.customerId ??
        (c.customer as Record<string, unknown> | undefined)?.user_id ??
        0,
    );
  const factoryIdOf = (c: Record<string, unknown>): number =>
    Number(
      c.factory_id ??
        c.factoryId ??
        (c.factory as Record<string, unknown> | undefined)?.user_id ??
        0,
    );

  let hit = convs.find((c) => customerIdOf(c) === customerId && factoryIdOf(c) === fid);
  if (!hit && customerId > 0) {
    hit = convs.find((c) => customerIdOf(c) === customerId);
  }
  const convId = Number(hit?.conv_id ?? hit?.conversation_id ?? hit?.id ?? 0);
  return Number.isFinite(convId) && convId > 0 ? convId : null;
}

async function ensureConversationId(customerId: number, fid: number): Promise<number> {
  const existing = await findExistingConvId(customerId, fid);
  if (existing) return existing;

  const created = await conversationsApi.create({ customer_id: customerId, factory_id: fid });
  const root = (created && typeof created === 'object' ? created : {}) as Record<string, unknown>;
  const row = (root.data && typeof root.data === 'object' ? root.data : null) as Record<
    string,
    unknown
  > | null;
  const convId = Number(
    root.conv_id ??
      root.conversation_id ??
      root.id ??
      row?.conv_id ??
      row?.conversation_id ??
      row?.id ??
      0,
  );
  if (!Number.isFinite(convId) || convId <= 0) {
    throw new Error('สร้างห้องแชทไม่สำเร็จ (ไม่พบ conv_id)');
  }
  return convId;
}

export function useFactoryRfqDetailPage(rfqId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const [actionError, setActionError] = useState('');

  const detailQuery = useQuery({
    queryKey: factoryKeys.rfqDetail(rfqId ?? ''),
    enabled: Boolean(rfqId),
    queryFn: async (): Promise<FactoryRfqDetailData> => {
      const detail = await factoryRfqsApi.getRFQDetail(rfqId!);
      const rfq = (detail.rfq ?? {}) as Record<string, unknown>;
      return {
        rfqTitle: String(rfq.title ?? ''),
        rfqBody: rfq,
        quotes: Array.isArray(detail.quotations)
          ? (detail.quotations as unknown as FactoryRfqQuoteRow[])
          : [],
        subCategoryName: String(rfq.sub_category_name ?? '').trim(),
        commissionConfig: detail.commission_config ?? null,
      };
    },
  });

  const reload = () =>
    qc.invalidateQueries({ queryKey: factoryKeys.rfqDetail(rfqId ?? '') });

  const cancelQuote = useAppMutation({
    mutationFn: (quoteId: string) => quotationsApi.delete(quoteId),
    onMutate: () => setActionError(''),
    onSuccess: reload,
    onErrorMessage: setActionError,
    fallbackMessage: 'ยกเลิกใบเสนอราคาไม่สำเร็จ',
  });

  const dismissRfq = useAppMutation({
    mutationFn: () => factoryRfqsApi.dismiss(rfqId!),
    onMutate: () => setActionError(''),
    onErrorMessage: setActionError,
    fallbackMessage: 'ซ่อน RFQ ไม่สำเร็จ',
  });

  const undismissRfq = useAppMutation({
    mutationFn: () => factoryRfqsApi.undismiss(rfqId!),
    onMutate: () => setActionError(''),
    onSuccess: reload,
    onErrorMessage: setActionError,
    fallbackMessage: 'คืน RFQ ไม่สำเร็จ',
  });

  const openChat = useAppMutation({
    mutationFn: async (input: { customerId: number; rfqTitle: string }) => {
      if (fid == null) throw new Error('ไม่พบข้อมูลโรงงาน');
      return ensureConversationId(input.customerId, fid);
    },
    onMutate: () => setActionError(''),
    onErrorMessage: setActionError,
    fallbackMessage: 'เปิดแชทไม่สำเร็จ',
  });

  const sendQuoteInChat = useAppMutation({
    mutationFn: async (input: {
      customerId: number;
      rfqTitle: string;
      quoteData: string;
    }) => {
      if (fid == null) throw new Error('ไม่พบข้อมูลโรงงาน');
      const uid = getCurrentUserId(user);
      if (uid == null) throw new Error('ไม่พบบัญชีผู้ใช้');
      const convId = await ensureConversationId(input.customerId, fid);
      const apiConv: ApiConversation = {
        conv_id: convId,
        customer_id: input.customerId,
        factory_id: fid,
        unread_customer: 0,
        unread_factory: 0,
        has_quote: false,
        updated_at: new Date().toISOString(),
      };
      await messagesApi.send(
        convId,
        buildSendPayload({
          conv: apiConv,
          currentUserId: uid,
          content: 'ใบเสนอราคา',
          messageType: 'QT',
          reference: { type: 'RQ', id: Number(rfqId), title: input.rfqTitle || `RFQ #${rfqId}` },
          quoteData: input.quoteData,
        }),
      );
      return convId;
    },
    onMutate: () => setActionError(''),
    onErrorMessage: setActionError,
    fallbackMessage: 'ส่งใบเสนอราคาในแชทไม่สำเร็จ',
  });

  const data = detailQuery.data;
  const error = actionError
    ? actionError
    : detailQuery.error
      ? getErrorMessage(detailQuery.error, 'โหลดไม่สำเร็จ')
      : '';

  return {
    loading: detailQuery.isLoading,
    error,
    setError: setActionError,
    rfqTitle: data?.rfqTitle ?? '',
    rfqBody: data?.rfqBody ?? {},
    quotes: data?.quotes ?? [],
    subCategoryName: data?.subCategoryName ?? '',
    commissionConfig: data?.commissionConfig ?? null,
    reload,
    cancelQuote,
    dismissRfq,
    undismissRfq,
    openChat,
    sendQuoteInChat,
    quoteIdOf,
  };
}
