import React from 'react';
import {
  currentUser,
  factories,
  rfqs,
  orders,
  categories,
  ideaArticles,
} from '../data/mockData';

export function useExploreData() {
  const [searchText, setSearchText] = React.useState('');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const activeRFQs = React.useMemo(
    () => rfqs.filter((r) => r.status !== 'completed'),
    [],
  );

  const recentOrders = React.useMemo(
    () => orders.filter((o) => o.status !== 'completed').slice(0, 2),
    [],
  );

  return {
    // state
    searchText,
    setSearchText,
    copiedId,
    setCopiedId,

    // derived data
    activeRFQs,
    recentOrders,

    // raw data
    currentUser,
    factories,
    rfqs,
    orders,
    categories,
    ideaArticles,
  };
}

