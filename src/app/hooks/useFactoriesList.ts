import { useMemo, useState } from 'react';
import { useData } from '@/stores/useDataStore';
import { factoriesApi } from '@/services/api/factoryApi';
import { apiListAsRecords } from '@/lib/apiShape';
import { normalizeFactoryRow } from '@/utils/normalizeFactoryRow';
import { useFetchData } from '@/hooks/useFetchData';

export type FactoryFilterState = {
  searchText: string;
  location: string;
  verifiedOnly: boolean;
};

export function useFactoriesList() {
  const data = useData();

  const { data: apiFactories, loading, error } = useFetchData(
    () => factoriesApi.list(),
    (raw) =>
      apiListAsRecords(raw, ['factories'])
        .map((row) => normalizeFactoryRow(row))
        .filter((f) => f.id && f.name),
    [],
  );

  const allFactories = apiFactories ?? data.factories;

  const [filters, setFilters] = useState<FactoryFilterState>({
    searchText: '',
    location: '',
    verifiedOnly: false,
  });

  const uniqueLocations = useMemo(
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

  const filteredFactories = useMemo(() => {
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
    loadError: error,
    usedApiList: apiFactories != null,
  };
}
