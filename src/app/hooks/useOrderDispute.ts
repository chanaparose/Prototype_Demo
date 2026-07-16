import { useQuery, useQueryClient } from '@tanstack/react-query';
import { disputesApi, type IDisputeResponse } from '@/services/api/ordersApi';

/** สถานะ dispute ที่ยังไม่จบ (มีผลต่อ order — ต้องกันไม่ให้ทำ action อื่นซ้อน) */
export const ACTIVE_DISPUTE_STATUSES = ['OP', 'RT', 'RC'] as const;

export function orderDisputeQueryKey(orderId: string | number | undefined) {
  return ['order-dispute', String(orderId ?? '')] as const;
}

/**
 * แหล่งข้อมูลเดียวสำหรับ dispute ล่าสุดของ order — ใช้ react-query cache ร่วมกัน
 * ระหว่าง DisputeSection กับหน้ารายละเอียด order เพื่อไม่ให้ยิง API ซ้ำ และ
 * เมื่อฝั่งใดฝั่งหนึ่ง refetch แล้ว อีกฝั่งจะเห็นข้อมูลใหม่ทันที (cache เดียวกัน)
 */
export function useOrderDispute(orderId: string | number | undefined, enabled = true) {
  const queryClient = useQueryClient();
  const q = useQuery<IDisputeResponse | null>({
    queryKey: orderDisputeQueryKey(orderId),
    queryFn: async () => {
      try {
        return await disputesApi.getByOrder(orderId as string | number);
      } catch {
        return null; // 404 = ยังไม่มีคำร้อง
      }
    },
    enabled: enabled && orderId != null && String(orderId).length > 0,
    staleTime: 10_000,
  });

  const dispute = q.data ?? null;
  const hasActiveDispute =
    dispute != null && (ACTIVE_DISPUTE_STATUSES as readonly string[]).includes(dispute.status);

  const refetch = async () => {
    await queryClient.invalidateQueries({ queryKey: orderDisputeQueryKey(orderId) });
  };

  return { dispute, hasActiveDispute, isLoading: q.isLoading, refetch };
}
