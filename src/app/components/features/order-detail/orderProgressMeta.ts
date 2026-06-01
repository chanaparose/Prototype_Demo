import {
  Boxes,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Factory,
  Handshake,
  PackageCheck,
  ScanSearch,
  Truck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

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
  if (order.status === 'pending_payment') {
    return { icon: CreditCard, label: 'รอชำระมัดจำ' };
  }
  return STEP_META[order.currentStepId ?? -1] ?? { icon: ClipboardList, label: 'รอดำเนินการ' };
}
