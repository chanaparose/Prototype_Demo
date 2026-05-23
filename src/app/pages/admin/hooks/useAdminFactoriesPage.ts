import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api/adminApi';
import {
  extractAdminFactoryRows,
  mapAdminFactory,
} from '@/domain/admin/mappers/mapAdminFactory';
import type { FactoryApprovalStatus } from '@/domain/admin/types/adminFactory.model';
import { adminKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/apiError';
import { useAppMutation } from '@/hooks/useAppMutation';

const STATUS_TABS: { key: 'all' | FactoryApprovalStatus; apiStatus?: string }[] = [
  { key: 'all' },
  { key: 'pending', apiStatus: 'PE' },
  { key: 'approved', apiStatus: 'AP' },
  { key: 'rejected', apiStatus: 'RJ' },
  { key: 'suspended', apiStatus: 'SU' },
];

export type FactoryListAction = {
  type: 'approve' | 'reject';
  factoryId: number;
  reason?: string;
};

export function useAdminFactoriesPage(
  statusTab: 'all' | FactoryApprovalStatus,
  search: string,
) {
  const qc = useQueryClient();
  const [actionError, setActionError] = useState('');

  const apiStatus = STATUS_TABS.find((t) => t.key === statusTab)?.apiStatus;

  const listQuery = useQuery({
    queryKey: adminKeys.factoriesList(statusTab, search),
    queryFn: async () => {
      const raw = await adminApi.listFactories({
        approval_status: apiStatus,
        search: search.trim() || undefined,
        page: 1,
        page_size: 100,
      });
      return extractAdminFactoryRows(raw).map(mapAdminFactory);
    },
  });

  const reload = useCallback(
    () => qc.invalidateQueries({ queryKey: adminKeys.factoriesList(statusTab, search) }),
    [qc, statusTab, search],
  );

  const updateStatus = useAppMutation({
    mutationFn: ({ type, factoryId, reason }: FactoryListAction) =>
      type === 'approve'
        ? adminApi.approveFactory(factoryId)
        : adminApi.rejectFactory(factoryId, reason?.trim() ?? ''),
    onMutate: () => setActionError(''),
    onSuccess: reload,
    onErrorMessage: setActionError,
    fallbackMessage: 'อัปเดตสถานะโรงงานไม่สำเร็จ',
  });

  const error = actionError
    ? actionError
    : listQuery.error
      ? getErrorMessage(listQuery.error, 'โหลดข้อมูลโรงงานไม่สำเร็จ')
      : '';

  return {
    factories: listQuery.data ?? [],
    loading: listQuery.isLoading,
    error,
    updateStatus,
  };
}
