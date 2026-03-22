import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useExploreData } from '../../hooks/useExploreData';
import { ExploreMobile } from './Explore.mobile';
import { ExploreDesktop } from './Explore.desktop';

export function Explore() {
  const isDesktop = useIsDesktop();
  const {
    searchText,
    setSearchText,
    copiedId,
    setCopiedId,
    activeRFQs,
    recentOrders,
    factories,
    categories,
    ideaArticles,
  } = useExploreData();

  if (isDesktop) {
    return (
      <ExploreDesktop
        searchText={searchText}
        setSearchText={setSearchText}
        copiedId={copiedId}
        setCopiedId={setCopiedId}
        categories={categories as any}
        factories={factories as any}
        activeRFQs={activeRFQs as any}
        recentOrders={recentOrders as any}
        ideaArticles={ideaArticles as any}
      />
    );
  }

  return (
    <ExploreMobile
      searchText={searchText}
      setSearchText={setSearchText}
      categories={categories as any}
      factories={factories as any}
      ideaArticles={ideaArticles as any}
    />
  );
}

