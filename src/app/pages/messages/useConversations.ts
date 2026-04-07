import { useEffect, useState, useCallback } from 'react';
import { conversationsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ApiConversation, UiConversation, normalizeConversation } from './types';

function rowToApiConversation(r: Record<string, unknown>): ApiConversation | null {
  const conv_id = Number(r.conv_id ?? r.conversation_id ?? r.id);
  if (!Number.isFinite(conv_id)) return null;
  return {
    conv_id,
    customer_id: Number(r.customer_id ?? r.customerId ?? 0),
    factory_id: Number(r.factory_id ?? r.factoryId ?? 0),
    factory_name: r.factory_name != null ? String(r.factory_name) : undefined,
    factory_image:
      r.factory_image != null
        ? String(r.factory_image)
        : r.factory_image_url != null
          ? String(r.factory_image_url)
          : r.factory_avatar != null
            ? String(r.factory_avatar)
            : undefined,
    rfq_id: r.rfq_id != null ? Number(r.rfq_id) : null,
    rfq_title:
      r.rfq_title != null
        ? String(r.rfq_title)
        : r.rfq_name != null
          ? String(r.rfq_name)
          : null,
    last_message:
      r.last_message != null
        ? String(r.last_message)
        : r.lastMessage != null
          ? String(r.lastMessage)
          : undefined,
    last_message_at:
      r.last_message_at != null
        ? String(r.last_message_at)
        : r.lastMessageAt != null
          ? String(r.lastMessageAt)
          : undefined,
    unread_customer: Number(r.unread_customer ?? r.unread_count ?? r.unread ?? 0),
    unread_factory: Number(r.unread_factory ?? r.unread_factory_count ?? 0),
    has_quote: Boolean(r.has_quote ?? r.hasQuote ?? false),
    updated_at: String(r.updated_at ?? r.time ?? r.created_at ?? ''),
  };
}

export function useConversations() {
  const { user } = useAuth();
  const role = (user?.role === 'FT' ? 'FT' : 'CU') as 'CU' | 'FT';

  const [items, setItems] = useState<UiConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await conversationsApi.list();
      const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
      const mapped = arr
        .map(rowToApiConversation)
        .filter((x): x is ApiConversation => x != null)
        .map((r) => normalizeConversation(r, role));
      setItems(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อความไม่สำเร็จ');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, reload: load };
}
