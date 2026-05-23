import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/stores/useAuthStore';
import { useData } from '@/stores/useDataStore';
import { useFavorites } from '@/hooks/useFavorites';
import { useStartChatWithFactory } from '@/hooks/useStartChatWithFactory';
import { useProductDetailShowcase } from '@/hooks/useProductDetailShowcase';
import { usePromotionDetailShowcase, useIdeaDetailShowcase } from '@/hooks/useShowcaseDetailPage';
import type { FactoryShowcase, Factory } from '@/stores/types';
import type { ReviewsData } from '@/domain/showcase/mappers/mapShowcaseDetail';

type DetailPageType = 'product' | 'promotion' | 'idea';

interface UseDetailPageLogicResult {
  // Item data
  item: FactoryShowcase | null;
  factory: Factory | null;
  reviews: ReviewsData | null;
  relatedProducts: FactoryShowcase[];

  // State
  loading: boolean;
  error: string | null;
  resolvedId: string;

  // User info
  user: unknown;
  isSelfFactory: boolean;
  canChat: boolean;
  isLiked: boolean;

  // Actions
  handleBack: () => void;
  toggleFavorite: () => void;
  handleStartChat: () => void;
  startChat: (factoryId: string, meta: any) => Promise<void>;
  starting: boolean;

  // Additional info
  isIdea?: boolean;
  isMaterial?: boolean;
}

/**
 * Generic hook for detail pages (Product, Idea, Promotion)
 * Handles all common logic: loading, favorites, chat, factory info, reviews
 */
export function useDetailPageLogic(pageType: DetailPageType): UseDetailPageLogicResult {
  const navigate = useNavigate();
  const { user } = useAuth();
  const data = useData();
  const { isLiked: checkIsLiked, toggleFavorite } = useFavorites();
  const { startChat, starting } = useStartChatWithFactory();

  // Get the appropriate hook based on page type
  const getDetailHook = () => {
    if (pageType === 'product') return useProductDetailShowcase();
    if (pageType === 'promotion') return usePromotionDetailShowcase();
    return useIdeaDetailShowcase();
  };

  const detailHook = getDetailHook();
  const { item, loading, error, factory, reviews, resolvedId, relatedProducts } = detailHook as any;

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleToggleFavorite = useCallback(() => {
    if (item?.id) {
      void toggleFavorite(item.id);
    }
  }, [item?.id, toggleFavorite]);

  const isSelfFactory = String(user?.id ?? '') === String(item?.factoryId ?? '');
  const canChat = !isSelfFactory && String(item?.factoryId ?? '').trim() !== '';
  const isLiked = item ? checkIsLiked(item.id) : false;

  const handleStartChat = useCallback(() => {
    if (!item || !resolvedId) return;
    void startChat(item.factoryId, {
      type: pageType === 'product' ? 'PD' : pageType === 'promotion' ? 'PM' : 'ID',
      id: Number(resolvedId),
      title: item.title,
    });
  }, [item, resolvedId, pageType, startChat]);

  return {
    // Item data
    item,
    factory,
    reviews,
    relatedProducts: relatedProducts ?? [],

    // State
    loading,
    error,
    resolvedId,

    // User info
    user,
    isSelfFactory,
    canChat,
    isLiked,

    // Actions
    handleBack,
    toggleFavorite: handleToggleFavorite,
    handleStartChat,
    startChat,
    starting,

    // Additional info
    isIdea: (item as any)?.isIdea,
    isMaterial: (item as any)?.isMaterial,
  };
}
