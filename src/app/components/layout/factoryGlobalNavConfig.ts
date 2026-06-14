import type { LucideIcon } from 'lucide-react';
import {
  MessageCircle,
  LayoutDashboard,
  Images,
  ClipboardList,
  Package,
  Wallet,
  IdCard,
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
    key: 'factory-info',
    label: 'Factory Info',
    icon: IdCard,
    href: '/factory/info',
    activeMatch: 'prefix',
    activePath: '/factory/info',
  },
  {
    key: 'factory-showcases',
    label: 'Showcases',
    icon: Images,
    href: '/factory/showcases?type=PD',
    activeMatch: 'prefix',
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

function normalizePath(path: string): string {
  if (path === '/') return path;
  return path.replace(/\/+$/, '');
}

export function isFactorySidebarNavActive(pathname: string, item: FactorySidebarNavItem): boolean {
  const currentPath = normalizePath(pathname);
  const activePath = normalizePath(item.activePath);

  if (Array.isArray(item.extraActivePaths)) {
    const hit = item.extraActivePaths.some((p) => {
      const extraPath = normalizePath(p);
      return currentPath === extraPath || currentPath.startsWith(`${extraPath}/`);
    });
    if (hit) return true;
  }
  if (item.activeMatch === 'exact') {
    return currentPath === activePath;
  }
  if (item.activeMatch === 'pathname') {
    return currentPath === activePath;
  }
  return currentPath === activePath || currentPath.startsWith(`${activePath}/`);
}
