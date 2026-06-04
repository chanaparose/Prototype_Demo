import {
  Boxes,
  CheckCircle2,
  ClipboardList,
  Factory,
  Handshake,
  PackageCheck,
  ScanSearch,
  Truck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { getOrderStatusDisplayMeta } from '@/domain/order/orderStatusDisplay';
import { isPendingPaymentStatus, mapOrderStatusFromApi } from '@/domain/order/status';

type OrderProgressMeta = {
  icon: LucideIcon;
  label: string;
};

const STEP_META: Record<number, OrderProgressMeta> = {
  0: { icon: Handshake, label: 'รอยืนยันรับงาน' },
  1: { icon: Boxes, label: 'จัดเตรียมวัตถุดิบ' },
  2: { icon: Factory, label: 'กำลังผลิต' },
  3: { icon: ScanSearch, label: 'ตรวจสอบคุณภาพ' },
  4: { icon: Truck, label: 'จัดส่งแล้ว' },
  5: { icon: PackageCheck, label: 'รอยืนยันรับสินค้า' },
};

export function getOrderProgressMeta(order: {
  currentStepId?: number;
  status: string;
  progress: number;
}): OrderProgressMeta {
  if (order.status === 'completed' || order.progress >= 100) {
    return { icon: CheckCircle2, label: 'เสร็จสิ้น' };
  }
  if (order.status === 'cancelled' || order.status === 'expired') {
    return { icon: XCircle, label: 'ยกเลิก' };
  }
  const mapped = mapOrderStatusFromApi(order.status);
  if (order.status === 'cancelled_expired' || mapped === 'cancelled_expired') {
    return { icon: XCircle, label: 'ยกเลิก' };
  }
  if (mapped === 'shipped') {
    return { icon: PackageCheck, label: 'จัดส่งแล้ว' };
  }
  if (isPendingPaymentStatus(order.status)) {
    return (
      getOrderStatusDisplayMeta(order.status) ?? {
        icon: ClipboardList,
        label: 'รอชำระมัดจำ',
      }
    );
  }
  const stepMeta = STEP_META[order.currentStepId ?? -1];
  if (stepMeta) return stepMeta;
  return (
    getOrderStatusDisplayMeta(order.status) ?? { icon: ClipboardList, label: 'รอดำเนินการ' }
  );
}
