import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showcasesApi } from '@/services/api/factoryApi';
import {
  mapFactoryShowcaseList,
  type FactoryShowcaseListItem,
} from '@/domain/showcase/mappers/mapFactoryShowcaseListItem';
import { showcaseKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/apiError';
import { useAppMutation } from '@/hooks/useAppMutation';
import { COMMON_COPY } from '@/constants/uiText';

export function useFactoryShowcasesPage(factoryId: number | null) {
  const qc = useQueryClient();
  const [actionError, setActionError] = useState('');

  const listQuery = useQuery({
    queryKey: showcaseKeys.factoryList(factoryId ?? ''),
    enabled: factoryId != null,
    queryFn: async () => {
      const raw = await showcasesApi.listByFactory(factoryId!);
      return mapFactoryShowcaseList(raw);
    },
  });

  const deleteShowcase = useAppMutation({
    mutationFn: (showcaseId: string) => showcasesApi.delete(showcaseId),
    onMutate: () => setActionError(''),
    onSuccess: (_data, showcaseId) => {
      qc.setQueryData<FactoryShowcaseListItem[]>(
        showcaseKeys.factoryList(factoryId ?? ''),
        (prev) => prev?.filter((row) => row.id !== showcaseId) ?? [],
      );
    },
    onErrorMessage: setActionError,
    fallbackMessage: COMMON_COPY.deleteFailed,
  });

  const error = actionError
    ? actionError
    : listQuery.error
      ? getErrorMessage(listQuery.error, COMMON_COPY.loadFailed)
      : '';

  return {
    rows: listQuery.data ?? [],
    loading: listQuery.isLoading,
    error,
    deleteShowcase,
  };
}
