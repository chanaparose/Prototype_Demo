import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { factoryRfqsApi, quotationsApi } from '@/services/api/rfqApi';
import { conversationsApi, messagesApi } from '@/services/api/chatApi';
import { factoryKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/apiError';
import { useAppMutation } from '@/hooks/useAppMutation';
import { buildSendPayload, getCurrentUserId } from '@/utils/chatContract';
import type { ApiConversation } from '@/utils/chatContract';
import {
  conversationIdFromCreateResponse,
  findExistingConversationId,
} from '@/domain/chat/mappers/mapConversation';
import {
  mapFactoryRfqDetailFromApi,
  quoteIdOf,
  type FactoryRfqDetailData,
  type FactoryRfqQuoteRow,
} from '@/domain/factory/mappers/mapFactoryRfqDetail';
import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';

export type { FactoryRfqDetailData, FactoryRfqQuoteRow };
export { quoteIdOf };

async function ensureConversationId(customerId: number, fid: number): Promise<number> {
  const existing = findExistingConversationId(await conversationsApi.list(), customerId, fid);
  if (existing) return existing;
  const created = await conversationsApi.create({ customer_id: customerId, factory_id: fid });
  return conversationIdFromCreateResponse(created);
}

export function useFactoryRfqDetailPage(rfqId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const [actionError, setActionError] = useState('');

  const detailQuery = useQuery({
    queryKey: factoryKeys.rfqDetail(rfqId ?? ''),
    enabled: Boolean(rfqId),
    queryFn: async () => mapFactoryRfqDetailFromApi(await factoryRfqsApi.getRFQDetail(rfqId!)),
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
