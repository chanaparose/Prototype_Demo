import type { IConversationResponse } from '@/types/api';

const CUSTOMER_AVATAR = '/assets/avatars/customer-default.svg';
export const FACTORY_FALLBACK_AVATAR = '/assets/avatars/factory-fallback.svg';

export interface CounterpartyView {
  title: string;
  subtitle?: string;
  avatarUrl: string;
  verified: boolean;
  counterpartyUserId: number;
  viewerRole: 'CT' | 'FT';
}

export function resolveCounterparty(
  conv: IConversationResponse,
  currentUserId: number,
): CounterpartyView {
  const viewerRole: 'CT' | 'FT' =
    conv.viewer_role ?? (conv.customer_id === currentUserId ? 'CT' : 'FT');

  if (viewerRole === 'CT') {
    return {
      title: conv.factory.factory_name || `โรงงาน #${conv.factory_id}`,
      subtitle: conv.factory.specialization || undefined,
      avatarUrl: conv.factory.image_url || FACTORY_FALLBACK_AVATAR,
      verified: !!conv.factory.is_verified,
      counterpartyUserId: conv.factory_id,
      viewerRole,
    };
  }

  return {
    title: conv.customer.display_name || `ลูกค้า #${conv.customer_id}`,
    subtitle: undefined,
    avatarUrl: CUSTOMER_AVATAR,
    verified: false,
    counterpartyUserId: conv.customer_id,
    viewerRole,
  };
}
