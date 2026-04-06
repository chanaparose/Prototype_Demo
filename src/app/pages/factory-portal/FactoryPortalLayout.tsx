import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Building2,
  Images,
  ClipboardList,
  Package,
  Wallet,
} from 'lucide-react';

type TabItem = {
  key: string;
  to: string | { pathname: string; search: string };
  end?: boolean;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  /** ถ้ากำหนด: active เมื่อ pathname ตรง (ใช้กับโชว์เคสหลาย ?type=) */
  activePath?: string;
};

const tabs: TabItem[] = [
  { key: 'dash', to: '/factory', end: true, label: 'แดชบอร์ด', icon: LayoutDashboard },
  { key: 'profile', to: '/factory/profile', label: 'โปรไฟล์', icon: Building2 },
  {
    key: 'showcases',
    to: { pathname: '/factory/showcases', search: '?type=PD' },
    label: 'โชว์เคส',
    icon: Images,
    activePath: '/factory/showcases',
  },
  { key: 'rfqs', to: '/factory/rfqs', label: 'กระดาน RFQ', icon: ClipboardList },
  { key: 'orders', to: '/factory/orders', label: 'ออเดอร์', icon: Package },
  { key: 'wallet', to: '/factory/wallet', label: 'กระเป๋าเงิน', icon: Wallet },
];

export function FactoryPortalLayout() {
  const location = useLocation();

  const isTabActive = (tab: TabItem) => {
    if (tab.activePath) {
      return location.pathname === tab.activePath;
    }
    const path = typeof tab.to === 'string' ? tab.to : tab.to.pathname;
    if (tab.end) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 pb-8">
      <div className="border-b border-gray-200 bg-white sticky top-0 z-30 lg:top-0">
        <div className="px-4 pt-4 pb-2 max-w-7xl mx-auto">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">พอร์ทัลโรงงาน</p>
          <h1 className="text-lg font-bold text-gray-900">จัดการงานและรายได้</h1>
        </div>
        <div className="overflow-x-auto max-w-7xl mx-auto px-2 pb-2">
          <nav className="flex gap-1 min-w-max sm:flex-wrap sm:min-w-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isTabActive(tab);
              return (
                <NavLink
                  key={tab.key}
                  to={tab.to}
                  end={tab.end ?? false}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    active ? 'text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={
                    active
                      ? { background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }
                      : {}
                  }
                >
                  <Icon size={18} strokeWidth={2} />
                  {tab.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Outlet />
      </div>
    </div>
  );
}
