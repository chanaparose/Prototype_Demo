import { useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/services/api/ordersApi';
import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { factoryKeys } from '@/lib/queryKeys';
import { useAppMutation } from '@/hooks/useAppMutation';

export type ShipOrderInput = {
  orderId: number;
  tracking: string;
  note?: string;
};

export function useFactoryOrdersMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);

  const invalidateOrders = () =>
    qc.invalidateQueries({ queryKey: factoryKeys.orders(fid) });

  const shipOrder = useAppMutation({
    mutationFn: ({ orderId, tracking, note }: ShipOrderInput) =>
      ordersApi.ship(orderId, {
        tracking_number: tracking.trim(),
        note: note?.trim() || undefined,
      }),
    onSuccess: invalidateOrders,
    fallbackMessage: 'บันทึกจัดส่งไม่สำเร็จ',
  });

  return { shipOrder };
}
