import React from 'react';
import { useData } from '../contexts/DataContext';

export type FactoryFilterState = {
  searchText: string;
  location: string;
  verifiedOnly: boolean;
};

export function useFactoriesList() {
  const data = useData();
  const allFactories = data.factories;

  const [filters, setFilters] = React.useState<FactoryFilterState>({
    searchText: '',
    location: '',
    verifiedOnly: false,
  });

  const uniqueLocations = React.useMemo(
    () => Array.from(new Set(allFactories.map((f) => f.location))).sort(),
    [allFactories],
  );

  const setSearchText = (value: string) =>
    setFilters((prev) => ({ ...prev, searchText: value }));

  const setLocation = (value: string) =>
    setFilters((prev) => ({ ...prev, location: value }));

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
        const matchTags = f.tags.some((t) =>
          t.toLowerCase().includes(q),
        );
        if (!matchName && !matchSpec && !matchTags) return false;
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
  };
}

