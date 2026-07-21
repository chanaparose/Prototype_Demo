import type { LucideIcon } from 'lucide-react';
import {
  MessageCircle,
  LayoutDashboard,
  Images,
  ClipboardList,
  Package,
  Receipt,
  IdCard,
  Star,
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
  /** ซ่อนเมื่อ config_payment เป็น escrow mode (เช่น tab สรุปค่าบริการ) */
  hideInEscrow?: boolean;
  /** แสดงเฉพาะ escrow mode (เช่น กระเป๋าเงิน/ถอนเงิน) */
  escrowOnly?: boolean;
};

export type FactorySidebarNavGroup = {
  /** ไม่ใส่ label สำหรับเมนูระดับบน เช่น แดชบอร์ด */
  label?: string;
  items: FactorySidebarNavItem[];
};

/** กรองเมนูตาม payment mode — ใช้ทั้ง DesktopSidebar และ MobileBottomNav */
export function filterFactoryNavByPaymentMode(
  items: FactorySidebarNavItem[],
  isEscrow: boolean,
): FactorySidebarNavItem[] {
  return items.filter((item) => {
    if (item.hideInEscrow && isEscrow) return false;
    if (item.escrowOnly && !isEscrow) return false;
    return true;
  });
}

export const FACTORY_SIDEBAR_NAV_GROUPS: FactorySidebarNavGroup[] = [
  {
    items: [
      {
        key: 'factory-dash',
        label: 'แดชบอร์ด',
        icon: LayoutDashboard,
        href: '/factory',
        activeMatch: 'exact',
        activePath: '/factory',
      },
    ],
  },
  {
    label: 'หน้าร้านโรงงาน',
    items: [
      {
        key: 'factory-info',
        label: 'ข้อมูลโรงงาน',
        icon: IdCard,
        href: '/factory/info',
        activeMatch: 'prefix',
        activePath: '/factory/info',
      },
      {
        key: 'factory-showcases',
        label: 'สินค้าและผลงาน',
        icon: Images,
        href: '/factory/showcases?type=PD',
        activeMatch: 'prefix',
        activePath: '/factory/showcases',
        requiresApproval: true,
      },
      {
        key: 'factory-reviews',
        label: 'รีวิว',
        icon: Star,
        href: '/factory/reviews',
        activeMatch: 'prefix',
        activePath: '/factory/reviews',
        requiresApproval: true,
      },
    ],
  },
  {
    label: 'งานขาย',
    items: [
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
    ],
  },
  {
    items: [
      {
        key: 'factory-invoices',
        label: 'สรุปค่าบริการ',
        icon: Receipt,
        href: '/factory/invoices',
        activeMatch: 'prefix',
        activePath: '/factory/invoices',
        requiresApproval: true,
        hideInEscrow: true,
      },
      {
        key: 'factory-wallet',
        label: 'กระเป๋าเงิน',
        icon: Wallet,
        href: '/factory/wallet',
        activeMatch: 'prefix',
        activePath: '/factory/wallet',
        requiresApproval: true,
        escrowOnly: true,
      },
    ],
  },
  {
    items: [
      {
        key: 'messages',
        label: 'ข้อความ',
        icon: MessageCircle,
        href: '/messages',
        badge: 'unread-messages',
        activeMatch: 'prefix',
        activePath: '/messages',
      },
    ],
  },
];

/** Flat list kept for consumers that do not render grouped navigation. */
export const FACTORY_SIDEBAR_NAV: FactorySidebarNavItem[] =
  FACTORY_SIDEBAR_NAV_GROUPS.flatMap((group) => group.items);

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
