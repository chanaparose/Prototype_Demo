import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminConfigApi } from '@/services/api/adminApi';
import type {
  IPlatformConfigItemResponse,
  IUpdatePlatformConfigRequest,
} from '@/services/api/types/admin.types';
import { adminKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/apiError';
import { useAppMutation } from '@/hooks/useAppMutation';

export function useAdminConfigPage() {
  const qc = useQueryClient();
  const [actionError, setActionError] = useState('');

  const configsQuery = useQuery({
    queryKey: adminKeys.configList(),
    queryFn: async () => {
      const res = await adminConfigApi.listConfigs();
      return Array.isArray(res.configs) ? res.configs : [];
    },
  });

  const reload = useCallback(
    () => qc.invalidateQueries({ queryKey: adminKeys.configList() }),
    [qc],
  );

  const onMutationError = useCallback((message: string) => setActionError(message), []);
  const clearError = useCallback(() => setActionError(''), []);

  const updateDefault = useAppMutation({
    mutationFn: ({
      configId,
      payload,
    }: {
      configId: number;
      payload: IUpdatePlatformConfigRequest;
    }) => adminConfigApi.updateConfig(configId, payload),
    onMutate: clearError,
    onSuccess: reload,
    onErrorMessage: onMutationError,
    fallbackMessage: 'บันทึก config มาตรฐานไม่สำเร็จ',
  });

  const createConfig = useAppMutation({
    mutationFn: (payload: Parameters<typeof adminConfigApi.createConfig>[0]) =>
      adminConfigApi.createConfig(payload),
    onMutate: clearError,
    onSuccess: reload,
    onErrorMessage: onMutationError,
    fallbackMessage: 'สร้าง config พิเศษไม่สำเร็จ',
  });

  const deleteConfig = useAppMutation({
    mutationFn: (configId: number) => adminConfigApi.deleteConfig(configId),
    onMutate: clearError,
    onSuccess: reload,
    onErrorMessage: onMutationError,
    fallbackMessage: 'ลบ config ไม่สำเร็จ',
  });

  const error = actionError
    ? actionError
    : configsQuery.error
      ? getErrorMessage(configsQuery.error, 'โหลด config packages ไม่สำเร็จ')
      : '';

  return {
    configs: configsQuery.data ?? ([] as IPlatformConfigItemResponse[]),
    loading: configsQuery.isLoading,
    error,
    clearError,
    updateDefault,
    createConfig,
    deleteConfig,
  };
}
