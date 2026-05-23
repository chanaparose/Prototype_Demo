import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminApi,
  adminConfigApi,
  adminFactoryConfigApi,
} from '@/services/api/adminApi';
import {
  EMPTY_ADMIN_FACTORY_DETAIL,
  mapAdminFactoryDetail,
} from '@/domain/admin/mappers/mapAdminFactoryDetail';
import { adminKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/apiError';
import { useAppMutation } from '@/hooks/useAppMutation';
import { pickScalarNumber } from '@/utils/pickScalarString';

export function useAdminFactoryDetailPage(routeId: string | undefined) {
  const qc = useQueryClient();
  const factoryId = pickScalarNumber(routeId) ?? 0;

  const [actionError, setActionError] = useState('');

  const clearError = useCallback(() => setActionError(''), []);

  const detailQuery = useQuery({
    queryKey: adminKeys.factoryDetail(routeId ?? ''),
    queryFn: async () => {
      const raw = await adminApi.getFactory(routeId!);
      return mapAdminFactoryDetail(raw);
    },
    enabled: Boolean(routeId),
  });

  const configQuery = useQuery({
    queryKey: adminKeys.factoryConfig(factoryId),
    queryFn: async () => {
      const [current, listRes] = await Promise.all([
        adminFactoryConfigApi.getFactoryConfig(factoryId),
        adminConfigApi.listConfigs(),
      ]);
      return {
        current,
        list: (listRes.configs ?? []).slice().sort((a, b) => a.config_id - b.config_id),
      };
    },
    enabled: factoryId > 0,
  });

  const reloadDetail = useCallback(
    () => qc.invalidateQueries({ queryKey: adminKeys.factoryDetail(routeId ?? '') }),
    [qc, routeId],
  );

  const reloadConfig = useCallback(
    () => qc.invalidateQueries({ queryKey: adminKeys.factoryConfig(factoryId) }),
    [qc, factoryId],
  );

  const onMutationError = useCallback((message: string) => setActionError(message), []);

  const approve = useAppMutation({
    mutationFn: () => adminApi.approveFactory(factoryId),
    onMutate: clearError,
    onSuccess: reloadDetail,
    onErrorMessage: onMutationError,
    fallbackMessage: 'อนุมัติโรงงานไม่สำเร็จ',
  });

  const reject = useAppMutation({
    mutationFn: (reason: string) => adminApi.rejectFactory(factoryId, reason),
    onMutate: clearError,
    onSuccess: reloadDetail,
    onErrorMessage: onMutationError,
    fallbackMessage: 'ปฏิเสธโรงงานไม่สำเร็จ',
  });

  const suspendToggle = useAppMutation({
    mutationFn: async () => {
      const status = detailQuery.data?.approval_status;
      if (status === 'suspended') {
        await adminApi.unsuspendFactory(factoryId);
      } else {
        await adminApi.suspendFactory(factoryId, 'ระงับโดยผู้ดูแลระบบ');
      }
    },
    onMutate: clearError,
    onSuccess: reloadDetail,
    onErrorMessage: onMutationError,
    fallbackMessage: 'อัปเดตสถานะระงับไม่สำเร็จ',
  });

  const toggleVerification = useAppMutation({
    mutationFn: () =>
      adminApi.updateFactoryVerification(factoryId, !detailQuery.data?.is_verified),
    onMutate: clearError,
    onSuccess: reloadDetail,
    onErrorMessage: onMutationError,
    fallbackMessage: 'อัปเดตสถานะยืนยันไม่สำเร็จ',
  });

  const assignConfig = useAppMutation({
    mutationFn: (input: { config_id: number; note: string }) =>
      adminFactoryConfigApi.assignConfig(factoryId, input),
    onMutate: clearError,
    onSuccess: () => void reloadConfig(),
    onErrorMessage: onMutationError,
    fallbackMessage: 'บันทึก config โรงงานไม่สำเร็จ',
  });

  const factory = detailQuery.data ?? EMPTY_ADMIN_FACTORY_DETAIL;

  const error = useMemo(() => {
    if (actionError) return actionError;
    if (detailQuery.error) {
      return getErrorMessage(detailQuery.error, 'โหลดรายละเอียดโรงงานไม่สำเร็จ');
    }
    if (configQuery.error) {
      return getErrorMessage(configQuery.error, 'โหลด config ของโรงงานไม่สำเร็จ');
    }
    return '';
  }, [actionError, detailQuery.error, configQuery.error]);

  const isActionBusy =
    approve.isPending ||
    reject.isPending ||
    suspendToggle.isPending ||
    toggleVerification.isPending;

  return {
    factory,
    factoryId,
    loading: detailQuery.isLoading,
    error,
    clearError,
    config: {
      current: configQuery.data?.current ?? null,
      list: configQuery.data?.list ?? [],
      loading: configQuery.isLoading,
    },
    actions: {
      isBusy: isActionBusy,
      approve: () => approve.mutate(),
      reject: (reason: string) => reject.mutate(reason),
      toggleSuspend: () => suspendToggle.mutate(),
      toggleVerification: () => toggleVerification.mutate(),
      assignConfig: assignConfig.mutateAsync,
      isAssigningConfig: assignConfig.isPending,
    },
  };
}
