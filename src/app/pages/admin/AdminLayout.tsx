import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { AnimatedOutlet } from '@/components/layout/AnimatedOutlet';
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  ShoppingCart,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  ImageIcon,
  Banknote,
  ShieldAlert,
  ReceiptText,
} from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import { usePaymentConfig } from '@/hooks/usePaymentConfig';
import { useAdminPendingCounts } from '@/hooks/admin/useAdminPendingCounts';
import { Navigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { pickScalarString } from '@/utils/pickScalarString';

const ADMIN_ROLES = ['AM', 'AD', 'SA'] as const;
type AdminRole = (typeof ADMIN_ROLES)[number];

const ROLE_LABELS: Record<string, string> = {
  AM: 'Account Manager',
  AD: 'Admin',
  SA: 'Super Admin',
};

const ROLE_COLORS: Record<string, string> = {
  AM: 'bg-sky-50 text-sky-700',
  AD: 'bg-brand-violet-soft text-brand-violet-deep',
  SA: 'bg-brand-lavender text-brand-purple',
};

const ROLE_RANK: Record<string, number> = { AM: 1, AD: 2, SA: 3 };

type NavBadgeKey = 'slips' | 'disputes' | 'withdrawals';

type NavItem = {
  path: string;
  icon: typeof LayoutDashboard;
  label: string;
  minRank: number;
  /** Which pending-count badge to show next to this item, if any. */
  badge?: NavBadgeKey;
  /** Only show while escrow payment mode is active. */
  escrowOnly?: boolean;
};

type NavGroup = {
  /** Section header; omit for the top-level group (dashboard). */
  label?: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ path: '/admin/dashboard', icon: LayoutDashboard, label: 'แดชบอร์ด', minRank: 1 }],
  },
  {
    label: 'จัดการข้อมูล',
    items: [
      { path: '/admin/factories', icon: Building2, label: 'โรงงาน', minRank: 1 },
      { path: '/admin/customers', icon: Users, label: 'ลูกค้า', minRank: 2 },
    ],
  },
  {
    label: 'การซื้อขาย',
    items: [
      { path: '/admin/rfqs', icon: ClipboardList, label: 'RFQ', minRank: 1 },
      { path: '/admin/orders', icon: ShoppingCart, label: 'คำสั่งซื้อ', minRank: 1 },
    ],
  },
  {
    label: 'ตรวจสอบการเงิน',
    items: [
      {
        path: '/admin/slips',
        icon: ReceiptText,
        label: 'ยืนยันสลิป',
        minRank: 3,
        badge: 'slips',
        escrowOnly: true,
      },
      {
        path: '/admin/disputes',
        icon: ShieldAlert,
        label: 'คำร้องคืนเงิน',
        minRank: 3,
        badge: 'disputes',
      },
      {
        path: '/admin/withdrawals',
        icon: Banknote,
        label: 'คำขอถอนเงิน',
        minRank: 2,
        badge: 'withdrawals',
      },
      { path: '/admin/commission', icon: ClipboardList, label: 'Commission', minRank: 2 },
    ],
  },
  {
    label: 'ระบบ',
    items: [
      { path: '/admin/config', icon: Settings, label: 'ตั้งค่า', minRank: 2 },
      { path: '/admin/category-images', icon: ImageIcon, label: 'ภาพ Hub / หมวด', minRank: 3 },
    ],
  },
];

const sidebarTheme = {
  activeText: 'var(--brand-purple)',
  inactiveText: 'var(--neutral-subtle)',
  activeBg: 'rgba(162,56,255,0.08)',
} as const;

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'แดชบอร์ด',
  '/admin/factories': 'จัดการโรงงาน',
  '/admin/customers': 'จัดการลูกค้า',
  '/admin/rfqs': 'จัดการ RFQ',
  '/admin/orders': 'จัดการคำสั่งซื้อ',
  '/admin/slips': 'ยืนยันสลิปการชำระเงิน',
  '/admin/commission': 'Commission',
  '/admin/withdrawals': 'คำขอถอนเงิน',
  '/admin/disputes': 'คำร้อง / ขอคืนเงิน',
  '/admin/config': 'ตั้งค่าระบบ',
  '/admin/category-images': 'ภาพ Hub / หมวด',
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
    rfqs: 'RFQ',
    orders: 'คำสั่งซื้อ',
    config: 'ตั้งค่า',
  };
  const labels = parts.slice(1).map((part) => map[part] ?? part);
  return ['Admin', ...labels].join(' / ');
}

function NavLink({
  item,
  active,
  count,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  count: number;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={onNavigate}
      className='group relative flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-slate-50'
      style={{
        color: active ? sidebarTheme.activeText : sidebarTheme.inactiveText,
        background: active ? sidebarTheme.activeBg : 'transparent',
        fontWeight: active ? 600 : 500,
      }}
      aria-current={active ? 'page' : undefined}
    >
      {active ? (
        <span className='absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-brand-purple' />
      ) : null}
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
          active
            ? 'bg-white text-brand-purple shadow-sm ring-1 ring-brand-purple/10'
            : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200/70 group-hover:bg-white'
        }`}
        aria-hidden
      >
        <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
      </span>
      <span className='flex-1 text-left'>{item.label}</span>
      {count > 0 ? (
        <span
          className='inline-flex min-w-[20px] items-center justify-center rounded-full bg-brand-orange px-1.5 text-[11px] font-bold leading-[18px] text-white'
          aria-label={`${count} รายการรอดำเนินการ`}
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Button>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = pickScalarString(user?.role);
  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleCls = ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-600';
  const displayName = pickScalarString(user?.name, 'Admin');
  const roleRank = ROLE_RANK[role] ?? 0;

  const { isEscrow } = usePaymentConfig();
  const pendingCounts = useAdminPendingCounts(roleRank);

  const visibleGroups = NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter(
      (item) => roleRank >= item.minRank && (!item.escrowOnly || isEscrow),
    ),
  })).filter((group) => group.items.length > 0);

  const isActivePath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className='flex flex-col h-full'>
      <div className='flex h-16 shrink-0 items-center border-b border-gray-100 px-4'>
        <Link
          to='/admin/dashboard'
          onClick={onClose}
          className='flex min-w-0 flex-1 items-center gap-2.5'
        >
          <Image
            src='/assets/tryly-logo.png'
            alt='Tryly'
            className='h-14 w-auto shrink-0 object-contain -ml-1'
          />
        </Link>
        {onClose && (
          <Button
            variant='unstyled'
            type='button'
            onClick={onClose}
            className='lg:hidden p-1.5 rounded-xl hover:bg-[var(--brand-panel-hover)] text-[var(--neutral-subtle)]'
            aria-label='ปิดเมนู'
          >
            <X size={18} />
          </Button>
        )}
      </div>

      <nav className='flex-1 space-y-1 overflow-y-auto px-3 pt-4 pb-2' aria-label='เมนูแอดมิน'>
        {visibleGroups.map((group, gi) => {
          if (!group.label) {
            return (
              <div key={`group-${gi}`} className='space-y-1'>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    item={item}
                    active={isActivePath(item.path)}
                    count={item.badge ? pendingCounts[item.badge] : 0}
                    onNavigate={() => {
                      navigate(item.path);
                      onClose?.();
                    }}
                  />
                ))}
              </div>
            );
          }

          return (
            <div key={group.label} className={gi > 0 ? 'mt-5 space-y-1' : 'space-y-1'}>
              <div className='flex items-center px-2.5 pb-1'>
                <p className='text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400'>
                  {group.label}
                </p>
              </div>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  item={item}
                  active={isActivePath(item.path)}
                  count={item.badge ? pendingCounts[item.badge] : 0}
                  onNavigate={() => {
                    navigate(item.path);
                    onClose?.();
                  }}
                />
              ))}
            </div>
          );
        })}
      </nav>

      <div className='border-t border-gray-100 px-3 py-3 shrink-0'>
        <div className='flex items-center gap-2'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => {
              navigate('/admin/dashboard');
              onClose?.();
            }}
            className='flex items-center gap-2.5 flex-1 min-w-0 p-2 rounded-xl hover:bg-[var(--brand-panel-hover)] transition-colors'
          >
            <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-lavender-muted text-sm font-bold text-brand-purple'>
              A
            </span>
            <span className='flex-1 text-left min-w-0'>
              <span className='block text-xs font-semibold truncate text-[var(--brand-navy-deep)]'>
                {displayName}
              </span>
              <span
                className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${roleCls}`}
              >
                {roleLabel}
              </span>
            </span>
          </Button>
          <Button
            variant='unstyled'
            type='button'
            className='relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--brand-panel-hover)] transition-colors shrink-0'
            aria-label='การแจ้งเตือน'
          >
            <Bell size={17} style={{ color: 'var(--brand-purple)' }} />
            <span
              className='absolute top-2 right-2 w-2 h-2 rounded-full'
              style={{ background: 'var(--brand-orange)' }}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutMenuOpen, setLogoutMenuOpen] = useState(false);

  // Auth guard
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50'>
        <div className='w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin' />
      </div>
    );
  }

  const role = pickScalarString(user?.role);
  if (!ADMIN_ROLES.includes(role as AdminRole)) {
    return <Navigate to='/' replace />;
  }

  const pageTitle = getPageTitle(location.pathname);
  const breadcrumb = getBreadcrumb(location.pathname);
  const roleCls = ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-600';
  const roleLabel = ROLE_LABELS[role] ?? role;
  const displayName = pickScalarString(user?.name, 'Admin');
  const handleLogout = () => {
    setLogoutMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className='min-h-screen flex bg-[var(--brand-page)]'>
      <aside className='hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-40'>
        <SidebarContent />
      </aside>

      {drawerOpen && (
        <div
          className='lg:hidden fixed inset-0 bg-black/40 z-40'
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={() => setDrawerOpen(false)} />
      </aside>

      <div className='flex-1 flex flex-col lg:pl-64 min-w-0'>
        <header className='sticky top-0 z-20 bg-white/95 border-b border-gray-200 h-16 flex items-center px-4 sm:px-6 gap-4 backdrop-blur-md'>
          <Button
            variant='unstyled'
            type='button'
            className='lg:hidden p-2 rounded-xl hover:bg-[var(--brand-panel-hover)] text-[var(--neutral-subtle)]'
            onClick={() => setDrawerOpen(true)}
            aria-label='เปิดเมนู'
          >
            <Menu size={20} />
          </Button>

          <div className='flex-1 min-w-0'>
            <h1 className='text-lg font-bold text-[var(--brand-navy-deep)] truncate'>
              {pageTitle}
            </h1>
            <p className='text-[11px] text-slate-400 truncate'>{breadcrumb}</p>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='unstyled'
              type='button'
              className='p-2 rounded-xl hover:bg-[var(--brand-panel-hover)] relative'
              aria-label='การแจ้งเตือน'
            >
              <Bell size={18} style={{ color: 'var(--brand-purple)' }} />
              <span
                className='absolute top-1.5 right-1.5 w-2 h-2 rounded-full'
                style={{ background: 'var(--brand-orange)' }}
              />
            </Button>

            <div className='flex items-center gap-2 pl-2 border-l border-slate-200'>
              <div
                className='flex size-8 items-center justify-center rounded-full bg-brand-lavender-muted text-sm font-bold text-brand-purple'
                aria-label={displayName}
              >
                A
              </div>
              <div className='hidden sm:block'>
                <p className='text-xs font-semibold text-slate-900 leading-none'>
                  {displayName}
                </p>
                <span
                  className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${roleCls}`}
                >
                  {roleLabel}
                </span>
              </div>
            </div>

            <div className='relative'>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setLogoutMenuOpen((open) => !open)}
                className='inline-flex items-center justify-center size-9 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors'
                aria-label='เมนูออกจากระบบ'
                aria-expanded={logoutMenuOpen}
                title='เมนูออกจากระบบ'
              >
                <LogOut size={16} />
              </Button>

              {logoutMenuOpen ? (
                <div className='absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-brand-lavender-muted bg-white p-1.5 shadow-[0_20px_60px_rgba(46,34,82,0.16)]'>
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={handleLogout}
                    className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors'
                  >
                    <LogOut size={15} />
                    ออกจากระบบ
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className='flex-1 min-w-0 overflow-x-hidden bg-[var(--brand-page)]'>
          <div className='w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10'>
            <AnimatedOutlet />
          </div>
        </main>
      </div>
    </div>
  );
}
