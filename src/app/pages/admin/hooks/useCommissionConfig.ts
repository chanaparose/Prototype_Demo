import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { platformConfigApi } from '@/services/api/adminApi';
import type { IPlatformConfigResponse } from '@/services/api/types/admin.types';
import { adminKeys } from '@/lib/queryKeys';
import { useAppMutation } from '@/hooks/useAppMutation';

export type CommissionFormState = {
  default_commission_rate: number;
  promo_enabled: boolean;
  promo_commission_rate: number;
  promo_label: string;
  promo_start_at: string;
  promo_end_at: string;
  vat_rate: number;
};

export function fromCommissionConfig(c: IPlatformConfigResponse): CommissionFormState {
  return {
    default_commission_rate: c.default_commission_rate ?? 0,
    promo_enabled: c.promo_commission_rate != null,
    promo_commission_rate: c.promo_commission_rate ?? 0,
    promo_label: c.promo_label ?? '',
    promo_start_at: c.promo_start_at ?? '',
    promo_end_at: c.promo_end_at ?? '',
    vat_rate: c.vat_rate ?? 0,
  };
}

export function useCommissionConfig() {
  const qc = useQueryClient();
  const [form, setForm] = useState<CommissionFormState | null>(null);

  const configQuery = useQuery({
    queryKey: adminKeys.platformCommission(),
    queryFn: async () => {
      const [active, history] = await Promise.all([
        platformConfigApi.getActive(),
        platformConfigApi.history(),
      ]);
      return { active, history };
    },
  });

  const active = configQuery.data?.active ?? null;
  const history = configQuery.data?.history ?? [];

  const saveVersion = useAppMutation({
    mutationFn: (input: { form: CommissionFormState; currencyCode: string }) =>
      platformConfigApi.create({
        default_commission_rate: input.form.default_commission_rate,
        promo_commission_rate: input.form.promo_enabled ? input.form.promo_commission_rate : null,
        promo_label: input.form.promo_enabled ? input.form.promo_label : null,
        promo_start_at: input.form.promo_enabled ? input.form.promo_start_at : null,
        promo_end_at: input.form.promo_enabled ? input.form.promo_end_at : null,
        vat_rate: input.form.vat_rate,
        currency_code: input.currencyCode,
      }),
    onSuccess: (created) => {
      setForm(fromCommissionConfig(created));
      void qc.invalidateQueries({ queryKey: adminKeys.platformCommission() });
    },
  });

  const displayForm = form ?? (active ? fromCommissionConfig(active) : null);

  return {
    active,
    history,
    form: displayForm,
    setForm,
    loading: configQuery.isLoading,
    saveVersion,
  };
}
