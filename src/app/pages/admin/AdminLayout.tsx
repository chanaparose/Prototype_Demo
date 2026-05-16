import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Factory,
  Users,
  ClipboardList,
  ShoppingCart,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../stores';
import { Navigate } from 'react-router';

// ─── Types ───────────────────────────────────────────────────────
const ADMIN_ROLES = ['AM', 'AD', 'SA'] as const;
type AdminRole = (typeof ADMIN_ROLES)[number];

const ROLE_LABELS: Record<string, string> = {
  AM: 'Account Manager',
  AD: 'Admin',
  SA: 'Super Admin',
};

const ROLE_COLORS: Record<string, string> = {
  AM: 'bg-blue-100 text-blue-700',
  AD: 'bg-indigo-100 text-indigo-700',
  SA: 'bg-purple-100 text-purple-700',
};

const ROLE_RANK: Record<string, number> = { AM: 1, AD: 2, SA: 3 };

// ─── Nav config ─────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'แดชบอร์ด', minRank: 1 },
  { path: '/admin/factories', icon: Factory,         label: 'โรงงาน',   minRank: 1 },
  { path: '/admin/customers', icon: Users,            label: 'ลูกค้า',   minRank: 2 },
  { path: '/admin/rfqs',      icon: ClipboardList,   label: 'RFQ',       minRank: 1 },
  { path: '/admin/orders',    icon: ShoppingCart,     label: 'คำสั่งซื้อ', minRank: 1 },
  { path: '/admin/config',    icon: Settings,         label: 'ตั้งค่า',  minRank: 2 },
];

// ─── Page title map ──────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard':  'แดชบอร์ด',
  '/admin/factories':  'จัดการโรงงาน',
  '/admin/customers':  'จัดการลูกค้า',
  '/admin/rfqs':       'จัดการ RFQ',
  '/admin/orders':     'จัดการคำสั่งซื้อ',
  '/admin/config':     'ตั้งค่าระบบ',
};

function getPageTitle(pathname: string): string {
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || pathname.startsWith(`${key}/`)) return title;
  }
  return 'Admin';
}

function getBreadcrumb(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length <= 1) return 'Admin';
  const map: Record<string, string> = {
    dashboard: 'แดชบอร์ด',
    factories: 'โรงงาน',
    customers: 'ลูกค้า',
    rfqs:      'RFQ',
    orders:    'คำสั่งซื้อ',
    config:    'ตั้งค่า',
  };
  const labels = parts.slice(1).map((part) => map[part] ?? part);
  return ['Admin', ...labels].join(' / ');
}

// ─── Sidebar content ────────────────────────────────────────────
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = String(user?.role ?? '');
  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleCls = ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-600';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <img
            src="/assets/tryly-logo.png"
            alt="Tryly"
            className="h-8 w-auto object-contain"
          />
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">Tryly</p>
            <p className="text-[10px] text-indigo-600 font-medium mt-0.5">Admin Panel</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.filter(item => (ROLE_RANK[role] ?? 0) >= item.minRank).map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 pl-2'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent pl-2'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 shrink-0 border-t border-slate-200 pt-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-50 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
            {String(user?.name ?? 'A').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name ?? 'Admin'}</p>
            <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${roleCls}`}>
              {roleLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={15} />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────
export function AdminLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auth guard
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = String(user?.role ?? '');
  if (!ADMIN_ROLES.includes(role as AdminRole)) {
    return <Navigate to="/" replace />;
  }

  const pageTitle = getPageTitle(location.pathname);
  const breadcrumb = getBreadcrumb(location.pathname);
  const roleCls = ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-600';
  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-white border-r border-slate-200 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={() => setDrawerOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm h-16 flex items-center px-4 sm:px-6 gap-4">
          {/* Hamburger */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            onClick={() => setDrawerOpen(true)}
            aria-label="เปิดเมนู"
          >
            <Menu size={20} />
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate">{pageTitle}</h1>
            <p className="text-[11px] text-slate-400 truncate">{breadcrumb}</p>
          </div>

          {/* Right: bell + user */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 relative"
              aria-label="การแจ้งเตือน"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                {String(user?.name ?? 'A').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 leading-none">{user?.name ?? 'Admin'}</p>
                <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${roleCls}`}>
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
