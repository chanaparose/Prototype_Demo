import type { IConversationResponse } from '@/types/api';
import { getCustomerAvatarUrl } from '@/utils/customerAvatar';

export const FACTORY_FALLBACK_AVATAR = '/assets/tryly_vertical_banner_v3_new_concept_0.png';

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
    avatarUrl: getCustomerAvatarUrl(conv.customer_id, 96),
    verified: false,
    counterpartyUserId: conv.customer_id,
    viewerRole,
  };
}
