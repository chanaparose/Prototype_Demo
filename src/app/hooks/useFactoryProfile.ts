import React from 'react';
import { useParams } from 'react-router';
import {
  conversations,
  factories,
  factoryProfiles,
  factoryReviews,
  factoryShowcases,
  ideaArticles,
} from '../data/mockData';
import type { TabId } from '../components/features/factory-profile';

export function useFactoryProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = React.useState<TabId>('products');

  const factory = factories.find((f) => f.id === id);
  const profile = factoryProfiles.find((p) => p.factoryId === id);
  const conversation = conversations.find((c) => c.factoryId === id);

  const productItems = React.useMemo(
    () =>
      factoryShowcases.filter(
        (item) => item.factoryId === id && item.contentType === 'product',
      ),
    [id],
  );

  const promotionItems = React.useMemo(
    () =>
      factoryShowcases.filter(
        (item) => item.factoryId === id && item.contentType === 'promotion',
      ),
    [id],
  );

  const articleItems = React.useMemo(() => {
    const showcaseIdeas = factoryShowcases.filter(
      (item) => item.factoryId === id && item.contentType === 'idea',
    );
    const ideas = ideaArticles.filter((item) => item.factoryId === id);
    return { showcaseIdeas, ideas };
  }, [id]);

  const reviews = React.useMemo(
    () => factoryReviews.filter((r) => r.factoryId === id),
    [id],
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
  };
}

