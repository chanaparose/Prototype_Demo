import React from 'react';
import { useParams } from 'react-router';
import { useData } from '../contexts/DataContext';
import type { TabId } from '../components/features/factory-profile';

export function useFactoryProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = React.useState<TabId>('products');
  const data = useData();

  const factory = data.factories.find((f) => f.id === id);
  const profile = data.factoryProfiles.find((p) => p.factoryId === id);
  const conversation = data.conversations.find((c) => c.factoryId === id);

  const productItems = React.useMemo(
    () =>
      data.factoryShowcases.filter(
        (item) => item.factoryId === id && item.contentType === 'product',
      ),
    [id, data.factoryShowcases],
  );

  const promotionItems = React.useMemo(
    () =>
      data.factoryShowcases.filter(
        (item) => item.factoryId === id && item.contentType === 'promotion',
      ),
    [id, data.factoryShowcases],
  );

  const articleItems = React.useMemo(() => {
    const showcaseIdeas = data.factoryShowcases.filter(
      (item) => item.factoryId === id && item.contentType === 'idea',
    );
    const ideas = data.ideaArticles.filter((item) => item.factoryId === id);
    return { showcaseIdeas, ideas };
  }, [id, data.factoryShowcases, data.ideaArticles]);

  const reviews = React.useMemo(
    () => data.factoryReviews.filter((r) => r.factoryId === id),
    [id, data.factoryReviews],
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

