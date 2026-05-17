import { useEffect, useState, useCallback } from 'react';
import { conversationsApi } from '@/services/api/chatApi';
import { useAuth } from '@/stores/useAuthStore';
import type { ConversationDTO } from '@/types/api';
import { getCurrentUserId } from '@/utils/chatContract';
import { resolveCounterparty } from '@/utils/counterparty';
import { unreadForViewer, UiConversation } from '@/pages/messages/types';
import { sortConversations } from '@/pages/messages/selectors';

function rowToConversation(r: Record<string, unknown>): ConversationDTO | null {
  const conv_id = Number(r.conv_id ?? r.conversation_id ?? r.id);
  if (!Number.isFinite(conv_id)) return null;
  const customerId = Number(r.customer_id ?? r.customerId ?? 0);
  const factoryId = Number(r.factory_id ?? r.factoryId ?? 0);
  const customerObj = (r.customer && typeof r.customer === 'object' ? r.customer : {}) as Record<
    string,
    unknown
  >;
  const factoryObj = (r.factory && typeof r.factory === 'object' ? r.factory : {}) as Record<
    string,
    unknown
  >;
  return {
    conv_id,
    customer_id: Number.isFinite(customerId) ? customerId : 0,
    factory_id: Number.isFinite(factoryId) ? factoryId : 0,
    last_message: String(r.last_message ?? r.lastMessage ?? ''),
    unread_customer: Number(r.unread_customer ?? r.unread_count ?? r.unread ?? 0),
    unread_factory: Number(r.unread_factory ?? r.unread_factory_count ?? 0),
    has_quote: Boolean(r.has_quote ?? r.hasQuote ?? false),
    updated_at: String(r.updated_at ?? r.time ?? ''),
    viewer_role: r.viewer_role === 'FT' ? 'FT' : r.viewer_role === 'CT' ? 'CT' : undefined,
    customer: {
      user_id: Number(customerObj.user_id ?? customerId ?? 0),
      first_name: String(customerObj.first_name ?? ''),
      last_name: String(customerObj.last_name ?? ''),
      display_name: String(customerObj.display_name ?? r.customer_name ?? ''),
    },
    factory: {
      user_id: Number(factoryObj.user_id ?? factoryId ?? 0),
      factory_name: String(factoryObj.factory_name ?? r.factory_name ?? ''),
      image_url: String(factoryObj.image_url ?? r.factory_image ?? r.factory_image_url ?? ''),
      is_verified: factoryObj.is_verified === true,
      specialization: String(factoryObj.specialization ?? ''),
    },
  };
}

export function useConversations() {
  const { user, isAuthenticated } = useAuth();
  const currentUserId = getCurrentUserId(user);

  const [items, setItems] = useState<UiConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated || currentUserId == null) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await conversationsApi.list();
      const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
      const mapped = sortConversations(
        arr
          .map(rowToConversation)
          .filter((x): x is ConversationDTO => x != null)
          .map((conv) => {
            const view = resolveCounterparty(conv, currentUserId);
            return {
              id: String(conv.conv_id),
              conv,
              view,
              rfqName: '',
              lastMessage: conv.last_message ?? '',
              lastMessageAt: conv.updated_at ?? '',
              updatedAt: conv.updated_at ?? '',
              unread: unreadForViewer(conv, view.viewerRole),
              hasQuote: Boolean(conv.has_quote),
            };
          }),
      );
      setItems(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อความไม่สำเร็จ');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, reload: load };
}
