import type { LucideIcon } from 'lucide-react';
import {
  MessageCircle,
  LayoutDashboard,
  Building2,
  Images,
  ClipboardList,
  Package,
  FileText,
} from 'lucide-react';

/**
 * เมนู sidebar สำหรับบัญชีโรงงาน (FT)
 * — ไม่มีหน้าแรก / แนะนำโรงงาน; รายการพอร์ทัลอยู่ที่นี่แทนแถบแท็บใน FactoryPortalLayout
 * — กระเป๋าเงินไม่อยู่ในรายการนี้: เข้าจาก Wallet Summary (sidebar) / แถบ header & เมนูมือถือ
 */
export type FactorySidebarNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  /** ส่งให้ navigate() — รองรับ query เช่น โชว์เคส */
  href: string;
  badge?: 'unread-messages';
  /** วิธีเทียบ active กับ location.pathname */
  activeMatch: 'exact' | 'prefix' | 'pathname';
  /** สำหรับ activeMatch === 'exact' | 'pathname' */
  activePath: string;
};

export const FACTORY_SIDEBAR_NAV: FactorySidebarNavItem[] = [
  {
    key: 'messages',
    label: 'ข้อความ',
    icon: MessageCircle,
    href: '/messages',
    badge: 'unread-messages',
    activeMatch: 'prefix',
    activePath: '/messages',
  },
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
    label: 'โปรไฟล์',
    icon: Building2,
    href: '/factory/profile',
    activeMatch: 'prefix',
    activePath: '/factory/profile',
  },
  {
    key: 'factory-showcases',
    label: 'โชว์เคส',
    icon: Images,
    href: '/factory/showcases?type=PD',
    activeMatch: 'pathname',
    activePath: '/factory/showcases',
  },
  {
    key: 'factory-rfqs',
    label: 'กระดาน RFQ',
    icon: ClipboardList,
    href: '/factory/rfqs',
    activeMatch: 'prefix',
    activePath: '/factory/rfqs',
  },
  {
    key: 'factory-quotations',
    label: 'ใบเสนอราคา',
    icon: FileText,
    href: '/factory/quotations',
    activeMatch: 'prefix',
    activePath: '/factory/quotations',
  },
  {
    key: 'factory-orders',
    label: 'ออเดอร์',
    icon: Package,
    href: '/factory/orders',
    activeMatch: 'prefix',
    activePath: '/factory/orders',
  },
];

export function isFactorySidebarNavActive(
  pathname: string,
  item: FactorySidebarNavItem,
): boolean {
  if (item.activeMatch === 'exact') {
    return pathname === item.activePath;
  }
  if (item.activeMatch === 'pathname') {
    return pathname === item.activePath;
  }
  return pathname === item.activePath || pathname.startsWith(`${item.activePath}/`);
}

