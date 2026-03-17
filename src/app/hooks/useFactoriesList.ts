import React from 'react';
import { factories as allFactories } from '../data/mockData';

export type FactoryFilterState = {
  searchText: string;
  location: string;
  verifiedOnly: boolean;
};

const uniqueLocations = Array.from(
  new Set(allFactories.map((f) => f.location)),
).sort();

export function useFactoriesList() {
  const [filters, setFilters] = React.useState<FactoryFilterState>({
    searchText: '',
    location: '',
    verifiedOnly: false,
  });

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
  }, [filters]);

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

