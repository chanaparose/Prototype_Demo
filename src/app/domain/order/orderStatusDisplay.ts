import {
  Ban,
  Check,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  ScanSearch,
  Settings,
  type LucideIcon,
} from 'lucide-react';

import { mapOrderStatusFromApi } from '@/domain/order/status';

export type OrderStatusDisplayMeta = {
  label: string;
  icon: LucideIcon;
};

/** ข้อความสถานะตามรหัส API (สอดคล้อง FactoryOrderCard STATUS_CONFIG) */
export const ORDER_API_STATUS_DISPLAY: Record<string, OrderStatusDisplayMeta> = {
  WS: { label: 'รอแนบสลีป', icon: Clock3 },
  WA: { label: 'รอยืนยันสลีป', icon: ScanSearch },
  PP: { label: 'รอชำระมัดจำ', icon: Clock3 },
  PE: { label: 'หมดกำหนดชำระ', icon: Ban },
  PD: { label: 'ชำระมัดจำแล้ว', icon: CircleDollarSign },
  PR: { label: 'กำลังผลิต', icon: Settings },
  QC: { label: 'ตรวจสอบคุณภาพ', icon: ScanSearch },
  SH: { label: 'จัดส่งแล้ว', icon: PackageCheck },
  CP: { label: 'เสร็จสิ้น', icon: Check },
  CN: { label: 'ยกเลิก', icon: Ban },
  CC: { label: 'ยกเลิก', icon: Ban },
  CL: { label: 'ยกเลิก', icon: Ban },
  waiting_slip: { label: 'รอแนบสลีป', icon: Clock3 },
  waiting_approval: { label: 'รอยืนยันสลีป', icon: ScanSearch },
  pending_payment: { label: 'รอชำระมัดจำ', icon: Clock3 },
  in_production: { label: 'กำลังผลิต', icon: Settings },
  shipped: { label: 'จัดส่งแล้ว', icon: PackageCheck },
  completed: { label: 'เสร็จสิ้น', icon: Check },
  cancelled_expired: { label: 'ยกเลิก', icon: Ban },
};

export function getOrderStatusDisplayMeta(status: string): OrderStatusDisplayMeta | null {
  const raw = String(status ?? '').trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (ORDER_API_STATUS_DISPLAY[upper]) return ORDER_API_STATUS_DISPLAY[upper];
  const mapped = mapOrderStatusFromApi(raw);
  return ORDER_API_STATUS_DISPLAY[mapped] ?? null;
}
