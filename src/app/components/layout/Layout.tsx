import React from 'react';
import { Outlet, useNavigate, useLocation, Link, Navigate } from 'react-router';
import {
  Home,
  ClipboardList,
  MessageCircle,
  User,
  Lightbulb,
  Bell,
  Wallet,
  LayoutDashboard,
  Images,
  Package,
} from 'lucide-react';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { ProductTour } from '@/components/features/explore/ProductTour';
import { useAuth } from '@/stores/useAuthStore';
import { useData } from '@/stores/useDataStore';
import { useNotificationUnreadCount } from '@/hooks/useNotificationUnreadCount';
import { isFactoryRole } from '@/utils/factoryUser';
import {
  isFactorySidebarNavActive,
} from '@/components/layout/factoryGlobalNavConfig';
import { factoryVerifyStatus } from '@/components/factory/FactoryVerifiedGuard';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { Image } from '@/components/ui/image';
import { useMobileBottomNavHide } from '@/hooks/useMobileBottomNavHide';
import { MobileCreateRfqFab } from '@/components/layout/MobileCreateRfqFab';
import { useConversationUnreadCount } from '@/domain/chat/hooks/useConversationUnreadCount';

// ─── Customer bottom nav (5 items) ─────────────────────────────────────────
const customerNavLinks = [
  { path: '/', icon: Home, label: 'หน้าแรก' },
  { path: '/factory-ideas', icon: Lightbulb, label: 'แนะนำโรงงาน' },
  { path: '/orders', icon: ClipboardList, label: 'คำสั่งงาน' },
  { path: '/messages', icon: MessageCircle, label: 'ข้อความ' },
  { path: '/profile', icon: User, label: 'โปรไฟล์' },
];

// ─── Factory bottom nav (5 most-used items) ─────────────────────────────────
const factoryBottomLinks = [
  {
    key: 'factory-dash',
    label: 'แดชบอร์ด',
    icon: LayoutDashboard,
    href: '/factory',
    activeMatch: 'exact' as const,
    activePath: '/factory',
  },
  {
    key: 'factory-showcases',
    label: 'Showcases',
    icon: Images,
    href: '/factory/showcases?type=PD',
    activeMatch: 'pathname' as const,
    activePath: '/factory/showcases',
    requiresApproval: true,
  },
  {
    key: 'factory-orders',
    label: 'ออเดอร์',
    icon: Package,
    href: '/factory/orders',
    activeMatch: 'prefix' as const,
    activePath: '/factory/orders',
    requiresApproval: true,
  },
  {
    key: 'messages',
    label: 'ข้อความ',
    icon: MessageCircle,
    href: '/messages',
    activeMatch: 'prefix' as const,
    activePath: '/messages',
  },
  {
    key: 'factory-wallet',
    label: 'กระเป๋าเงิน',
    icon: Wallet,
    href: '/factory/wallet',
    activeMatch: 'prefix' as const,
    activePath: '/factory/wallet',
  },
];

// ─── Layout ──────────────────────────────────────────────────────────────────
export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const data = useData();
  const unreadNotifications = useNotificationUnreadCount(isAuthenticated);
  const isFactory = isFactoryRole(user);
  const userRole = String(user?.role ?? '').toUpperCase();
  const isAdminRole = userRole === 'AM' || userRole === 'AD' || userRole === 'SA';
  const factoryApproved = factoryVerifyStatus(user) === 'AP';
  const bottomNavHidden = useMobileBottomNavHide();
  const unreadMessages = useConversationUnreadCount();

  if (isAdminRole && !location.pathname.startsWith('/admin')) {
    return <Navigate to='/admin/dashboard' replace />;
  }

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const brandActive = isFactory ? 'var(--brand-indigo)' : 'var(--brand-purple)';
  const brandActiveBg = isFactory ? '#EEF2FF' : 'rgba(162,56,255,0.08)';

  /** Mobile FAB — whitelist only (Explore home = `/`) */
  const createRfqFabPaths = [
    '/',
    '/factory-ideas',
    '/orders',
    '/messages',
    '/profile',
  ] as const;

  const showCreateRfqFab =
    !isFactory &&
    !isAdminRole &&
    (createRfqFabPaths as readonly string[]).includes(location.pathname);

  return (
    <div className='min-h-screen flex bg-white w-full max-w-full overflow-x-hidden'>
      <DesktopSidebar />

      <div className='flex-1 flex flex-col lg:pl-64 min-w-0'>
        {/* ── Top header (mobile + iPad) ─────────────────────────────────── */}
        <header className='lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6'>
            <div className='flex items-center justify-between h-14'>
              {/* Logo */}
              <Link to='/' className='flex items-center gap-2 shrink-0 py-1'>
                <Image
                  src='/assets/tryly-logo.png'
                  alt='Tryly'
                  className='h-14 w-auto max-w-[9.5rem] object-contain'
                />
              </Link>

              {/* Right actions */}
              <div className='flex items-center gap-1.5'>
                {isFactory && (
                  <Link
                    to='/factory/wallet'
                    className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors border border-indigo-100/80'
                    title='กระเป๋าเงิน'
                  >
                    <Wallet size={17} style={{ color: 'var(--brand-indigo)' }} />
                    <span
                      className='text-xs font-bold tabular-nums max-w-[4.5rem] truncate'
                      style={{ color: '#0F172A' }}
                    >
                      {formatCurrencyNoDecimals(data.currentUser?.walletBalance ?? 0)}
                    </span>
                  </Link>
                )}

                {/* Bell */}
                <Link
                  to='/notifications'
                  className='relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors'
                >
                  <Bell
                    size={19}
                    style={{ color: isFactory ? 'var(--brand-indigo)' : 'var(--brand-purple)' }}
                  />
                  {unreadNotifications > 0 && (
                    <span
                      className='absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full text-white flex items-center justify-center text-[9px] border-2 border-white tabular-nums'
                      style={{ background: 'var(--brand-orange)', fontWeight: 700 }}
                    >
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className='flex-1 min-w-0 overflow-x-hidden pb-16 lg:pb-0'>
          <div className='max-w-7xl mx-auto'>
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Bottom Navigation bar (mobile + iPad) ───────────────────────── */}
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 transition-transform duration-300 ease-in-out ${
          bottomNavHidden ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className='flex items-stretch'>
          {isFactory
            ? /* ── Factory items ── */
              factoryBottomLinks.map((item) => {
                const active = isFactorySidebarNavActive(location.pathname, item);
                const locked = Boolean(item.requiresApproval && !factoryApproved);
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type='button'
                    disabled={locked}
                    onClick={() => {
                      if (locked) return;
                      void navigate(item.href);
                    }}
                    className='flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-w-0 disabled:opacity-40'
                  >
                    <div className='relative'>
                      <Icon
                        size={23}
                        strokeWidth={active ? 2.2 : 1.6}
                        style={{ color: active ? brandActive : '#9CA3AF' }}
                      />
                      {item.key === 'messages' && unreadMessages > 0 && (
                        <span
                          className='absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full text-white flex items-center justify-center text-[8px] border border-white tabular-nums'
                          style={{ background: 'var(--brand-orange)', fontWeight: 700 }}
                        >
                          {unreadMessages > 99 ? '99+' : unreadMessages}
                        </span>
                      )}
                    </div>
                    <span
                      className='text-[10px] font-medium leading-tight truncate max-w-full px-1'
                      style={{ color: active ? brandActive : '#9CA3AF' }}
                    >
                      {item.label}
                    </span>
                    {active && (
                      <span
                        className='absolute bottom-0 w-6 h-0.5 rounded-full'
                        style={{ background: brandActive }}
                      />
                    )}
                  </button>
                );
              })
            : /* ── Customer items ── */
              customerNavLinks.map(({ path, icon: Icon, label }) => {
                const active = isActive(path);
                // Profile item: show login if guest
                const target =
                  path === '/profile' && !isAuthenticated ? '/login' : path;
                return (
                  <button
                    key={path}
                    type='button'
                    onClick={() => void navigate(target)}
                    className='flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-w-0 relative'
                  >
                    <div className='relative'>
                      <Icon
                        size={23}
                        strokeWidth={active ? 2.2 : 1.6}
                        style={{ color: active ? brandActive : '#9CA3AF' }}
                      />
                      {path === '/messages' && unreadMessages > 0 && (
                        <span
                          className='absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full text-white flex items-center justify-center text-[8px] border border-white tabular-nums'
                          style={{ background: 'var(--brand-orange)', fontWeight: 700 }}
                        >
                          {unreadMessages > 99 ? '99+' : unreadMessages}
                        </span>
                      )}
                    </div>
                    <span
                      className='text-[10px] font-medium leading-tight truncate max-w-full px-1'
                      style={{ color: active ? brandActive : '#9CA3AF' }}
                    >
                      {label}
                    </span>
                    {active && (
                      <span
                        className='absolute bottom-0 w-6 h-0.5 rounded-full'
                        style={{ background: brandActive }}
                      />
                    )}
                  </button>
                );
              })}
        </div>
      </nav>

      {showCreateRfqFab ? (
        <MobileCreateRfqFab
          bottomNavHidden={bottomNavHidden}
          showTourAnchor={location.pathname === '/'}
        />
      ) : null}

      {/* Product Tour */}
      <ProductTour />
    </div>
  );
}
