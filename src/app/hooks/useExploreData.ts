import React from 'react';
import { useData } from '../contexts/DataContext';

export function useExploreData() {
  const data = useData();
  const [searchText, setSearchText] = React.useState('');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const activeRFQs = React.useMemo(
    () => data.rfqs.filter((r) => r.status !== 'completed'),
    [data.rfqs],
  );

  const recentOrders = React.useMemo(
    () => data.orders.filter((o) => o.status !== 'completed').slice(0, 2),
    [data.orders],
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
    currentUser: data.currentUser,
    factories: data.factories,
    rfqs: data.rfqs,
    orders: data.orders,
    categories: data.categories,
    ideaArticles: data.ideaArticles,

    // loading state
    isLoading: data.isLoading,
  };
}

