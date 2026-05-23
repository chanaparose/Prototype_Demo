import { useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import { useData } from '@/stores/useDataStore';
import { type IdeaArticle } from '@/stores/types';
import { type TabId } from '@/components/features/factory-profile/FactoryProfileTabContent';
import { mapConversationToStoreModel } from '@/domain/chat/mappers/mapConversationStore';
import { useConversationsQuery } from '@/domain/chat/queries/useConversationsQuery';
import {
  createFactoryConversation,
  type FactoryProfileDetail,
} from '@/domain/factory/mappers/mapFactoryProfile';
import { useFactoryProfileQuery } from '@/domain/factory/queries/useFactoryProfileQuery';
import { useAuth } from '@/stores/useAuthStore';

export type { FactoryProfileDetail };

export function useFactoryProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabId>('products');
  const [startingConversation, setStartingConversation] = useState(false);
  const data = useData();
  const { isAuthenticated } = useAuth();
  const conversationsQ = useConversationsQuery(Boolean(id) && isAuthenticated);

  const factoryFallback = useMemo(
    () => data.factories.find((f) => String(f.id) === String(id)),
    [data.factories, id],
  );
  const profileFallback = useMemo(
    () => data.factoryProfiles.find((p) => String(p.factoryId) === String(id)),
    [data.factoryProfiles, id],
  );

  const detailQuery = useFactoryProfileQuery(id, {
    factory: factoryFallback,
    profile: profileFallback,
  });

  const detail = detailQuery.data;
  const conversation = useMemo(() => {
    const raw = conversationsQ.data?.find((c) => String(c.factory_id) === String(id));
    return raw ? mapConversationToStoreModel(raw, raw.viewer_role) : undefined;
  }, [conversationsQ.data, id]);

  const factory = detail?.factory ?? factoryFallback ?? null;
  const profile = detail?.profile ?? profileFallback ?? null;
  const reviews =
    detail?.reviews ?? data.factoryReviews.filter((r) => String(r.factoryId) === String(id));
  const factoryShowcases = detail?.showcases ?? [];
  const factoryCategoryNames = detail?.factoryCategoryNames ?? [];
  const factorySubCategoryNames = detail?.factorySubCategoryNames ?? [];
  const factorySubCategoryPairs = detail?.factorySubCategoryPairs ?? [];
  const apiCertificates = detail?.apiCertificates ?? [];

  const productItems = useMemo(
    () => factoryShowcases.filter((item) => item.contentType === 'product'),
    [factoryShowcases],
  );
  const promotionItems = useMemo(
    () => factoryShowcases.filter((item) => item.contentType === 'promotion'),
    [factoryShowcases],
  );
  const materialItems = useMemo(
    () => factoryShowcases.filter((item) => item.contentType === 'material'),
    [factoryShowcases],
  );
  const articleItems = useMemo(() => {
    const showcaseIdeas = factoryShowcases.filter((item) => item.contentType === 'idea');
    const ideas: IdeaArticle[] = showcaseIdeas.map((s) => ({
      id: s.id,
      factoryId: s.factoryId,
      factoryName: s.factoryName,
      title: s.title,
      excerpt: s.excerpt,
      image: s.image,
      tag: s.category,
      publishedAt: s.postedAt,
    }));
    return { showcaseIdeas, ideas };
  }, [factoryShowcases]);

  const startConversation = useCallback(
    async (customerId: number | string): Promise<string | null> => {
      if (!id || startingConversation) return null;
      if (conversation) return String(conversation.id);
      setStartingConversation(true);
      try {
        return await createFactoryConversation(id, customerId);
      } catch {
        return null;
      } finally {
        setStartingConversation(false);
      }
    },
    [id, conversation, startingConversation],
  );

  return {
    id,
    activeTab,
    setActiveTab,
    factory,
    profile,
    conversation,
    productItems,
    promotionItems,
    materialItems,
    articleItems,
    reviews,
    showcasesLoading: detailQuery.isLoading,
    detailLoading: detailQuery.isLoading,
    detailError: detailQuery.error,
    refetchDetail: detailQuery.refetch,
    startConversation,
    startingConversation,
    factoryCategoryNames,
    factorySubCategoryNames,
    factorySubCategoryPairs,
    apiCertificates,
  };
}
