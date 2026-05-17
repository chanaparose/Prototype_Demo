import type { LucideIcon } from 'lucide-react';
import {
  MessageCircle,
  LayoutDashboard,
  Building2,
  Images,
  ClipboardList,
  Package,
  Wallet,
} from 'lucide-react';

export type FactorySidebarNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: 'unread-messages';
  activeMatch: 'exact' | 'prefix' | 'pathname';
  activePath: string;
  /** เส้นทางเพิ่มเติมที่ถือว่า active ในเมนูเดียวกัน */
  extraActivePaths?: string[];
  /** ต้องอนุมัติ (AP) ก่อนเข้าได้ */
  requiresApproval?: boolean;
};

export const FACTORY_SIDEBAR_NAV: FactorySidebarNavItem[] = [
  {
    key: 'factory-dash',
    label: 'แดชบอร์ด',
    icon: LayoutDashboard,
    href: '/factory',
    activeMatch: 'exact',
    activePath: '/factory',
  },
  {
    key: 'factory-profile',
    label: 'ข้อมูลโรงงาน',
    icon: Building2,
    href: '/factory/profile',
    activeMatch: 'prefix',
    activePath: '/factory/profile',
  },
  {
    key: 'factory-showcases',
    label: 'Showcases',
    icon: Images,
    href: '/factory/showcases?type=PD',
    activeMatch: 'pathname',
    activePath: '/factory/showcases',
    requiresApproval: true,
  },
  {
    key: 'factory-rfqs',
    label: 'RFQ & ใบเสนอราคา',
    icon: ClipboardList,
    href: '/factory/rfqs',
    activeMatch: 'prefix',
    activePath: '/factory/rfqs',
    extraActivePaths: ['/factory/quotations'],
    requiresApproval: true,
  },
  {
    key: 'factory-orders',
    label: 'ออเดอร์',
    icon: Package,
    href: '/factory/orders',
    activeMatch: 'prefix',
    activePath: '/factory/orders',
    requiresApproval: true,
  },
  {
    key: 'factory-wallet',
    label: 'กระเป๋าเงิน',
    icon: Wallet,
    href: '/factory/wallet',
    activeMatch: 'prefix',
    activePath: '/factory/wallet',
  },
  {
    key: 'messages',
    label: 'ข้อความ',
    icon: MessageCircle,
    href: '/messages',
    badge: 'unread-messages',
    activeMatch: 'prefix',
    activePath: '/messages',
  },
];

export function isFactorySidebarNavActive(pathname: string, item: FactorySidebarNavItem): boolean {
  if (Array.isArray(item.extraActivePaths)) {
    const hit = item.extraActivePaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (hit) return true;
  }
  if (item.activeMatch === 'exact') {
    return pathname === item.activePath;
  }
  if (item.activeMatch === 'pathname') {
    return pathname === item.activePath;
  }
  return pathname === item.activePath || pathname.startsWith(`${item.activePath}/`);
}
