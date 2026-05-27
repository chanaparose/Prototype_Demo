import React from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router';
import { LoginModal } from '@/components/auth/LoginModal';
import { AnimatedOutlet } from '@/components/layout/AnimatedOutlet';
import {
  Home,
  ClipboardList,
  MessageCircle,
  User,
  Lightbulb,
  Bell,
  Heart,
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
import { useFavorites } from '@/hooks/useFavorites';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
import { ImageLightbox } from '@/components/common/ImageLightbox';

type HeaderIconTone = 'purple' | 'indigo' | 'rose';

const headerIconToneClass: Record<HeaderIconTone, string> = {
  purple:
    'border-violet-100/90 bg-gradient-to-b from-violet-50/90 to-white text-brand-violet-deep hover:border-violet-200 hover:shadow-[0_2px_10px_rgba(109,40,217,0.14)]',
  indigo:
    'border-indigo-100/90 bg-gradient-to-b from-indigo-50/90 to-white text-brand-indigo hover:border-indigo-200 hover:shadow-[0_2px_10px_rgba(79,70,229,0.14)]',
  rose: 'border-rose-100/90 bg-gradient-to-b from-rose-50/90 to-white text-rose-500 hover:border-rose-200 hover:shadow-[0_2px_10px_rgba(244,63,94,0.12)]',
};

function HeaderIconLink({
  to,
  title,
  ariaLabel,
  tone,
  active,
  badge,
  onClick,
  children,
}: {
  to: string;
  title: string;
  ariaLabel: string;
  tone: HeaderIconTone;
  active?: boolean;
  badge?: number;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      title={title}
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition-all active:scale-95 ${headerIconToneClass[tone]} ${
        active
          ? tone === 'indigo'
            ? 'ring-2 ring-offset-1 ring-indigo-200'
            : tone === 'rose'
              ? 'ring-2 ring-offset-1 ring-rose-200'
              : 'ring-2 ring-offset-1 ring-violet-200'
          : ''
      }`}
    >
      {children}
      {badge != null && badge > 0 ? (
        <span
          className='absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-2 border-white px-0.5 text-[8px] font-bold tabular-nums text-white'
          style={{ background: 'var(--brand-orange)' }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </Link>
  );
}

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
  const { likedIds } = useFavorites();
  const { open: openLoginModal } = useAuthModalStore();
  const showCustomerFavorites = !isFactory && !isAdminRole;
  const favoritesHref = isAuthenticated ? '/profile/favorites' : '#';
  const onFavoritesPage = location.pathname === '/profile/favorites';
  const onNotificationsPage = location.pathname === '/notifications';
  const headerIconTone: HeaderIconTone = isFactory ? 'indigo' : 'purple';

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
      <ImageLightbox />
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
                  className='h-16 w-auto max-w-[9.5rem] object-contain'
                />
              </Link>

              {/* Right actions */}
              <div className='flex items-center gap-2'>
                {isFactory ? (
                  <Link
                    to='/factory/wallet'
                    className='flex max-w-[8.5rem] items-center gap-1.5 rounded-full border border-indigo-100/90 bg-gradient-to-b from-indigo-50/90 to-white py-1 pl-1 pr-2.5 shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition-all hover:border-indigo-200 active:scale-[0.98]'
                    title='กระเป๋าเงิน'
                  >
                    <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-100/80 bg-white text-brand-indigo'>
                      <Wallet size={16} strokeWidth={2.2} />
                    </span>
                    <span className='truncate text-xs font-bold tabular-nums text-slate-900'>
                      {formatCurrencyNoDecimals(data.currentUser?.walletBalance ?? 0)}
                    </span>
                  </Link>
                ) : null}

                {showCustomerFavorites ? (
                  <HeaderIconLink
                    to={favoritesHref}
                    title='รายการโปรด'
                    ariaLabel='รายการโปรด'
                    tone='rose'
                    active={onFavoritesPage}
                    onClick={!isAuthenticated ? (e: React.MouseEvent) => { e.preventDefault(); openLoginModal('/profile/favorites'); } : undefined}
                  >
                    <Heart
                      size={15}
                      strokeWidth={2}
                      className={likedIds.size > 0 ? 'fill-current' : ''}
                    />
                  </HeaderIconLink>
                ) : null}

                <HeaderIconLink
                  to='/notifications'
                  title='การแจ้งเตือน'
                  ariaLabel='การแจ้งเตือน'
                  tone={headerIconTone}
                  active={onNotificationsPage}
                  badge={unreadNotifications}
                >
                  <Bell size={15} strokeWidth={2} />
                </HeaderIconLink>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className='flex-1 min-w-0 overflow-x-hidden bg-[var(--brand-page)] pb-16 lg:pb-0'>
          {/* `relative` gives AnimatePresence a positioned ancestor so the
              exiting element doesn't escape the content column. */}
          <div className='relative max-w-7xl mx-auto min-h-full'>
            <AnimatedOutlet />
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
                return (
                  <button
                    key={path}
                    type='button'
                    onClick={() => {
                      if (path === '/profile' && !isAuthenticated) {
                        openLoginModal('/profile');
                        return;
                      }
                      void navigate(path);
                    }}
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

      {/* Global login modal — available on all layout-wrapped routes */}
      <LoginModal />
    </div>
  );
}
