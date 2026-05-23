import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/stores/useAuthStore';
import { useFavorites } from '@/hooks/useFavorites';
import { useStartChatWithFactory } from '@/hooks/useStartChatWithFactory';
import { useShowcaseDetailPage } from '@/hooks/useShowcaseDetailPage';
import type { FactoryShowcase, Factory } from '@/stores/types';
import type { ReviewsData } from '@/domain/showcase/mappers/mapShowcaseDetail';
import type { ChatReference } from '@/utils/chatContract';

type DetailPageType = 'product' | 'promotion' | 'idea';

interface UseDetailPageLogicResult {
  item: FactoryShowcase | null;
  factory: Factory | null;
  reviews: ReviewsData | null;
  relatedProducts: FactoryShowcase[];

  loading: boolean;
  error: string | null;
  resolvedId: string;

  user: unknown;
  isSelfFactory: boolean;
  canChat: boolean;
  isLiked: boolean;

  handleBack: () => void;
  toggleFavorite: () => void;
  handleStartChat: () => void;
  startChat: (factoryId: string | number, reference?: ChatReference | null) => Promise<'ok' | null>;
  starting: boolean;

  isIdea?: boolean;
  isMaterial?: boolean;
}

function chatReferenceType(pageType: DetailPageType): 'PD' | 'PM' | 'ID' {
  if (pageType === 'promotion') return 'PM';
  if (pageType === 'idea') return 'ID';
  return 'PD';
}

/**
 * Generic hook for detail pages (Product, Idea, Promotion)
 * Handles all common logic: loading, favorites, chat, factory info, reviews
 */
export function useDetailPageLogic(pageType: DetailPageType): UseDetailPageLogicResult {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLiked: checkIsLiked, toggleFavorite } = useFavorites();
  const { startChat, starting } = useStartChatWithFactory();

  const { item, loading, error, factory, reviews, resolvedId, relatedProducts } =
    useShowcaseDetailPage(pageType);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleToggleFavorite = useCallback(() => {
    if (item?.id) {
      toggleFavorite(item.id).catch(() => undefined);
    }
  }, [item?.id, toggleFavorite]);

  const isSelfFactory = String(user?.id ?? '') === String(item?.factoryId ?? '');
  const canChat = !isSelfFactory && String(item?.factoryId ?? '').trim() !== '';
  const isLiked = item ? checkIsLiked(item.id) : false;

  const handleStartChat = useCallback(() => {
    if (!item || !resolvedId) return;
    startChat(item.factoryId, {
      type: chatReferenceType(pageType),
      id: Number(resolvedId),
      title: item.title,
    }).catch(() => undefined);
  }, [item, resolvedId, pageType, startChat]);

  return {
    item,
    factory,
    reviews,
    relatedProducts: relatedProducts ?? [],

    loading,
    error,
    resolvedId,

    user,
    isSelfFactory,
    canChat,
    isLiked,

    handleBack,
    toggleFavorite: handleToggleFavorite,
    handleStartChat,
    startChat,
    starting,

    isIdea: item?.contentType === 'idea',
    isMaterial: item?.contentType === 'material',
  };
}
