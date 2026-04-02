import React from 'react';
import { useParams } from 'react-router';
import { useData } from '../contexts/DataContext';
import type { FactoryShowcase, IdeaArticle } from '../contexts/DataContext';
import type { TabId } from '../components/features/factory-profile';
import { conversationsApi, frontendApi } from '../services/api';
import { normShowcase } from './useShowcases';

export function useFactoryProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = React.useState<TabId>('products');
  const [startingConversation, setStartingConversation] = React.useState(false);
  const data = useData();

  const factory = data.factories.find((f) => f.id === id);
  const profile = data.factoryProfiles.find((p) => p.factoryId === id);
  const conversation = data.conversations.find((c) => c.factoryId === id);

  // ─── Load showcases from API (page-level) ─────────────────────
  const [factoryShowcases, setFactoryShowcases] = React.useState<FactoryShowcase[]>([]);
  const [showcasesLoading, setShowcasesLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setShowcasesLoading(true);

    frontendApi.getFactory(id)
      .then((res) => {
        if (cancelled) return;
        const allItems: FactoryShowcase[] = [];
        // products, promotions, ideas from /frontend/factories/:id
        for (const key of ['products', 'promotions', 'ideas'] as const) {
          const arr = res[key];
          if (Array.isArray(arr)) {
            for (const raw of arr) {
              const s = normShowcase(raw as Record<string, unknown>);
              if (s.id && s.title) {
                // Ensure factoryId is set
                if (!s.factoryId) s.factoryId = String(id);
                allItems.push(s);
              }
            }
          }
        }
        setFactoryShowcases(allItems);
      })
      .catch(() => {
        if (!cancelled) setFactoryShowcases([]);
      })
      .finally(() => {
        if (!cancelled) setShowcasesLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  const productItems = React.useMemo(
    () => factoryShowcases.filter((item) => item.contentType === 'product'),
    [factoryShowcases],
  );

  const promotionItems = React.useMemo(
    () => factoryShowcases.filter((item) => item.contentType === 'promotion'),
    [factoryShowcases],
  );

  const articleItems = React.useMemo(() => {
    const showcaseIdeas = factoryShowcases.filter((item) => item.contentType === 'idea');
    // Ideas are also from showcases (content_type = ID), no separate ideaArticles needed
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

  const reviews = React.useMemo(
    () => data.factoryReviews.filter((r) => r.factoryId === id),
    [id, data.factoryReviews],
  );

  const startConversation = React.useCallback(
    async (customerId: number | string): Promise<string | null> => {
      if (!id || startingConversation) return null;
      // If conversation already exists, return its id
      if (conversation) return String(conversation.id);
      setStartingConversation(true);
      try {
        const res = await conversationsApi.create({
          customer_id: Number(customerId),
          factory_id: Number(id),
        }) as Record<string, unknown>;
        return String(res.conversation_id ?? res.id ?? '');
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
    articleItems,
    reviews,
    showcasesLoading,
    startConversation,
    startingConversation,
  };
}

