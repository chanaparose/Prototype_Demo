import { useState } from 'react';
import { toast } from 'sonner';
import { ApiHttpError } from '@/services/api/httpClient';
import { ordersApi } from '@/services/api/ordersApi';
import { useAppMutation } from '@/hooks/useAppMutation';
import { normalizeReviewImageUrls } from '@/utils/reviewImageUrls';

function handleConfirmReceiptError(error: unknown, setForbidden: (v: boolean) => void) {
  if (error instanceof ApiHttpError) {
    if (error.status === 403) {
      setForbidden(true);
      toast.error('คุณไม่มีสิทธิ์ยืนยันการรับสินค้าสำหรับคำสั่งซื้อนี้');
      return;
    }
    if (error.status === 404) {
      toast.error('ไม่พบคำสั่งซื้อนี้ในระบบ');
      return;
    }
    toast.error(error.message || 'ยืนยันรับสินค้าไม่สำเร็จ');
    return;
  }
  toast.error(error instanceof Error ? error.message : 'ยืนยันรับสินค้าไม่สำเร็จ');
}

function handleCancelOrderError(error: unknown) {
  if (error instanceof ApiHttpError) {
    if (error.status === 400) {
      toast.error(error.message || 'ไม่สามารถยกเลิกคำสั่งซื้อในสถานะนี้ได้');
      return;
    }
    if (error.status === 404) {
      toast.error('ไม่พบคำสั่งซื้อนี้');
      return;
    }
    toast.error(error.message || 'ยกเลิกคำสั่งซื้อไม่สำเร็จ');
    return;
  }
  toast.error(error instanceof Error ? error.message : 'ยกเลิกคำสั่งซื้อไม่สำเร็จ');
}

function handleReviewError(error: unknown) {
  if (error instanceof ApiHttpError) {
    const m = String(error.message ?? '').toLowerCase();
    if (m.includes('review already exists')) {
      toast.error('คุณรีวิวคำสั่งซื้อนี้ไปแล้ว');
      return;
    }
    if (m.includes('order must be completed')) {
      toast.error('สามารถรีวิวได้หลังคำสั่งซื้อเสร็จสมบูรณ์');
      return;
    }
    if (m.includes('rating must be between')) {
      toast.error('กรุณาเลือกคะแนน 1 ถึง 5 ดาว');
      return;
    }
    if (m.includes('comment must be')) {
      toast.error('กรุณาเขียนรีวิว');
      return;
    }
    if (m.includes('image_urls') && m.includes('5')) {
      toast.error('แนบรูปได้ไม่เกิน 5 รูป');
      return;
    }
    toast.error(error.message || 'ส่งรีวิวไม่สำเร็จ');
    return;
  }
  toast.error(error instanceof Error ? error.message : 'ส่งรีวิวไม่สำเร็จ');
}

type SubmitReviewInput = {
  rating: number;
  comment: string;
  imageUrls: string[];
};

export function useOrderDetailCustomerActions(
  orderId: string,
  refetchAll: () => Promise<void>,
) {
  const [receiveForbidden, setReceiveForbidden] = useState(false);

  const confirmReceipt = useAppMutation({
    mutationFn: () =>
      ordersApi.confirmReceipt(orderId, {
        note: 'Customer confirmed receipt from order detail',
        received_at: new Date().toISOString(),
      }),
    onMutate: () => setReceiveForbidden(false),
    onSuccess: async () => {
      toast.success('ยืนยันรับสินค้าแล้ว');
      await refetchAll();
    },
    onError: (error) => handleConfirmReceiptError(error, setReceiveForbidden),
  });

  const cancelOrder = useAppMutation({
    mutationFn: () => ordersApi.cancel(orderId),
    onSuccess: async () => {
      toast.success('ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว');
      await refetchAll();
    },
    onError: handleCancelOrderError,
  });

  const submitReview = useAppMutation({
    mutationFn: ({ rating, comment, imageUrls }: SubmitReviewInput) =>
      ordersApi.createReview(orderId, {
        rating,
        comment,
        image_urls: normalizeReviewImageUrls(imageUrls),
      }),
    onSuccess: async () => {
      toast.success('ส่งรีวิวสำเร็จ');
      await refetchAll();
    },
    onError: handleReviewError,
  });

  return {
    receiveForbidden,
    confirmReceipt,
    cancelOrder,
    submitReview,
  };
}
