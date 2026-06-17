import { useEffect, useMemo, useState } from 'react';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { getHubCategoryIds } from '@/components/features/explore/exploreHubFilter';
import type { IHubResponse } from '@/services/api/types/master.types';

export function useExploreHubSelection(activeScope: HubScope) {
  const hubsQ = useLbiHubsQuery();
  const hubs = useMemo(
    () => (hubsQ.data ?? []).filter((hub) => hub.scope === activeScope),
    [activeScope, hubsQ.data],
  );
  const [selectedHubId, setSelectedHubId] = useState<number | null>(null);

  const selectedHub = useMemo<IHubResponse | null>(
    () => hubs.find((hub) => hub.hub_id === selectedHubId) ?? hubs[0] ?? null,
    [hubs, selectedHubId],
  );

  const categoryIds = useMemo(() => getHubCategoryIds(selectedHub), [selectedHub]);

  useEffect(() => {
    if (!hubs.length) {
      setSelectedHubId(null);
      return;
    }
    if (!selectedHubId || !hubs.some((hub) => hub.hub_id === selectedHubId)) {
      setSelectedHubId(hubs[0].hub_id);
    }
  }, [hubs, selectedHubId]);

  return {
    hubs,
    selectedHub,
    selectedHubId: selectedHub?.hub_id ?? null,
    setSelectedHubId,
    categoryIds,
    isLoading: hubsQ.isLoading,
  };
}
