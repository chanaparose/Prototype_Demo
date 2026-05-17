import type { NavigateFunction } from 'react-router';
import { conversationsApi, messagesApi } from '@/services/api/chatApi';
import {
  buildSendPayload,
  chatRoomPath,
  getCurrentUserId,
  mergeConversationFromCreate,
  parseApiConversation,
  type ApiConversation,
  type ChatReference,
} from '@/utils/chatContract';
import { type User } from '@/stores/types';

type Row = Record<string, unknown>;

export async function findOrCreateConversation(
  customerUserId: number,
  factoryEntityId: number,
): Promise<ApiConversation | null> {
  if (!Number.isFinite(customerUserId) || customerUserId <= 0) return null;
  if (!Number.isFinite(factoryEntityId) || factoryEntityId <= 0) return null;
  const convsRaw = await conversationsApi.list();
  const convs = (Array.isArray(convsRaw) ? convsRaw : []) as Row[];
  const existing = convs.find((c) => {
    const cf = Number(c.factory_id ?? c.factoryId ?? 0);
    const cc = Number(c.customer_id ?? c.customerId ?? 0);
    return cf === factoryEntityId && cc === customerUserId;
  });
  if (existing) return parseApiConversation(existing as Row);
  const res = (await conversationsApi.create({
    customer_id: customerUserId,
    factory_id: factoryEntityId,
  })) as Row;
  let conv = mergeConversationFromCreate(res, customerUserId, factoryEntityId);
  if (!conv.conv_id) {
    const rawAgain = await conversationsApi.list();
    const again = (Array.isArray(rawAgain) ? rawAgain : []) as Row[];
    const found = again.find((c) => {
      const cf = Number(c.factory_id ?? c.factoryId ?? 0);
      const cc = Number(c.customer_id ?? c.customerId ?? 0);
      return cf === factoryEntityId && cc === customerUserId;
    });
    if (found) {
      const p = parseApiConversation(found as Row);
      if (p) conv = p;
    }
  }
  return conv.conv_id > 0 ? conv : null;
}

export type OpenChatSessionOptions = {
  customerUserId: number;
  factoryEntityId: number;

  firstMessage?: { content: string; reference?: ChatReference | null };

  pendingReference?: ChatReference | null;
};

export async function openChatSession(
  navigate: NavigateFunction,
  user: User | null,
  params: OpenChatSessionOptions,
): Promise<string | null> {
  const currentUserId = getCurrentUserId(user);
  if (currentUserId == null) return null;
  const { customerUserId, factoryEntityId, firstMessage, pendingReference } = params;
  if (!Number.isFinite(customerUserId) || customerUserId <= 0) return null;
  if (!Number.isFinite(factoryEntityId) || factoryEntityId <= 0) return null;

  const conv = await findOrCreateConversation(customerUserId, factoryEntityId);
  if (!conv || !conv.conv_id) return null;

  const fm = firstMessage?.content?.trim();
  if (fm) {
    await messagesApi.send(conv.conv_id, {
      body: fm,
      ...buildSendPayload({
        conv,
        currentUserId,
        content: fm,
        reference: firstMessage.reference ?? undefined,
        messageType: 'TX',
      }),
    });
    navigate(chatRoomPath(conv.conv_id));
    return String(conv.conv_id);
  }

  navigate(chatRoomPath(conv.conv_id), {
    state: pendingReference ? { reference: pendingReference } : null,
  });
  return String(conv.conv_id);
}
