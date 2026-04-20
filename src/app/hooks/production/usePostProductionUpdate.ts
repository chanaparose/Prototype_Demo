import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../services/api';
import type { ProductionUpdatesBundle } from '../../components/features/production/types';

type PostBody = {
  step_id: number;
  status: 'IP' | 'CD';
  description?: string;
  image_urls: string[];
  confirm_payment_trigger?: boolean;
};

function applyOptimistic(old: ProductionUpdatesBundle, body: PostBody): ProductionUpdatesBundle {
  const updates = old.updates.map((u) =>
    u.step_id === body.step_id
      ? {
          ...u,
          status: body.status,
          description: body.description ?? u.description,
          image_urls: body.image_urls.length ? body.image_urls : (u.image_urls ?? []),
        }
      : u,
  );
  return { ...old, updates };
}

export function usePostProductionUpdate(orderId: string | undefined) {
  const qc = useQueryClient();
  const key = ['order', orderId, 'production-updates'] as const;

  return useMutation({
    mutationFn: async ({
      body,
      confirmHeader,
    }: {
      body: PostBody;
      confirmHeader?: boolean;
    }) => {
      const headers =
        confirmHeader && body.status === 'CD' && body.confirm_payment_trigger
          ? { 'X-Confirm-Payment-Trigger': 'true' }
          : undefined;
      return ordersApi.postProductionUpdate(orderId!, body, headers);
    },
    onMutate: async ({ body }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<ProductionUpdatesBundle>(key);
      if (prev) qc.setQueryData(key, applyOptimistic(prev, body));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ['order', orderId] });
    },
    retry: 3,
  });
}
