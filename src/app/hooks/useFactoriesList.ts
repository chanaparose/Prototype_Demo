import React, { useEffect } from 'react';
import { useData } from '@/stores/useDataStore';
import { type Factory } from '@/stores/types';
import { factoriesApi } from '@/services/api/factoryApi';
import { normalizeFactoryRow } from '@/utils/normalizeFactoryRow';

export type FactoryFilterState = {
  searchText: string;
  location: string;
  verifiedOnly: boolean;
};

export function useFactoriesList() {
  const data = useData();
  const [apiFactories, setApiFactories] = React.useState<Factory[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    factoriesApi
      .list()
      .then((raw) => {
        if (cancelled) return;
        const arr = (Array.isArray(raw) ? raw : []) as unknown as Record<string, unknown>[];
        const mapped = arr.map((row) => normalizeFactoryRow(row)).filter((f) => f.id && f.name);
        setApiFactories(mapped);
      })
      .catch((err) => {
        if (!cancelled) {
          setApiFactories(null);
          setLoadError(err instanceof Error ? err.message : 'โหลดรายการโรงงานไม่สำเร็จ');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allFactories = apiFactories ?? data.factories;

  const [filters, setFilters] = React.useState<FactoryFilterState>({
    searchText: '',
    location: '',
    verifiedOnly: false,
  });

  const uniqueLocations = React.useMemo(
    () =>
      Array.from(new Set(allFactories.map((f) => f.location)))
        .filter(Boolean)
        .sort(),
    [allFactories],
  );

  const setSearchText = (value: string) => setFilters((prev) => ({ ...prev, searchText: value }));

  const setLocation = (value: string) => setFilters((prev) => ({ ...prev, location: value }));

  const setVerifiedOnly = (value: boolean) =>
    setFilters((prev) => ({ ...prev, verifiedOnly: value }));

  const filteredFactories = React.useMemo(() => {
    return allFactories.filter((f) => {
      if (filters.location && f.location !== filters.location) return false;
      if (filters.verifiedOnly && !f.verified) return false;
      if (filters.searchText) {
        const q = filters.searchText.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q);
        const matchSpec = f.specialization.toLowerCase().includes(q);
        const matchType = (f.factoryTypeName ?? '').toLowerCase().includes(q);
        const matchTags = f.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchSpec && !matchType && !matchTags) return false;
      }
      return true;
    });
  }, [filters, allFactories]);

  return {
    factories: filteredFactories,
    allFactories,
    locations: uniqueLocations,
    filters,
    setSearchText,
    setLocation,
    setVerifiedOnly,
    loading,
    loadError,
    usedApiList: apiFactories != null,
  };
}
