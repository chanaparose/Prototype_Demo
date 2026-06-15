import React from 'react';
import { useLocation, Link, Navigate } from 'react-router';
import { LoginModal } from '@/components/auth/LoginModal';
import { AnimatedOutlet } from '@/components/layout/AnimatedOutlet';
import {
  MessageCircle,
  Bell,
  Heart,
  Wallet,
  LayoutDashboard,
  Images,
  Package,
  User,
} from 'lucide-react';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { ProductTour } from '@/components/features/explore/ProductTour';
import { useAuth } from '@/stores/useAuthStore';
import { useData } from '@/stores/useDataStore';
import { useNotificationUnreadCount } from '@/hooks/useNotificationUnreadCount';
import { isFactoryRole } from '@/utils/factoryUser';
import { factoryVerifyStatus } from '@/components/factory/FactoryVerifiedGuard';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { Image } from '@/components/ui/image';
import {
  isMobileCustomBottomBarRoute,
  MOBILE_BOTTOM_NAV_CLEARANCE,
  useMobileBottomNavHide,
} from '@/hooks/useMobileBottomNavHide';
import { MobileCreateRfqFab } from '@/components/layout/MobileCreateRfqFab';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
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
    key: 'factory-profile',
    label: 'โปรไฟล์',
    icon: User,
    href: '/factory/profile',
    activeMatch: 'prefix' as const,
    activePath: '/factory/profile',
  },
];

// ─── Layout ──────────────────────────────────────────────────────────────────
export function Layout() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const data = useData();
  const unreadNotifications = useNotificationUnreadCount(isAuthenticated);
  const isFactory = isFactoryRole(user);
  const userRole = String(user?.role ?? '').toUpperCase();
  const isAdminRole = userRole === 'AM' || userRole === 'AD' || userRole === 'SA';
  const factoryApproved = factoryVerifyStatus(user) === 'AP';
  const bottomNavCompact = useMobileBottomNavHide();
  const hideMobileBottomNav = isMobileCustomBottomBarRoute(location.pathname);
  const unreadMessages = useConversationUnreadCount();
  const { likedIds } = useFavorites();
  const { open: openLoginModal } = useAuthModalStore();
  const showCustomerFavorites = !isFactory && !isAdminRole;
  const favoritesHref = isAuthenticated ? '/profile/favorites' : '#';
  const onFavoritesPage = location.pathname === '/profile/favorites';
  const onNotificationsPage = location.pathname === '/notifications';
  const headerIconTone: HeaderIconTone = 'purple';
  const hideMobileTopHeader =
    /^\/orders\/[^/]+$/.test(location.pathname) || location.pathname === '/create-rfq';
  const wideContentPaths = [
    '/',
    '/factory-ideas',
    '/orders',
    '/messages',
    '/notifications',
    '/create-rfq',
  ];
  const isWideChatRoom =
    location.pathname === '/chat-room' ||
    location.pathname.startsWith('/chat-room/') ||
    location.pathname.startsWith('/messages/');
  const isWideOrderDetail = location.pathname.startsWith('/orders/');
  const isWideFactoryPortal =
    location.pathname === '/factory' || location.pathname.startsWith('/factory/');
  const isProfileShell = location.pathname === '/profile';
  const isWidePublicDetail =
    location.pathname === '/product-detail' ||
    location.pathname === '/promotion-detail' ||
    location.pathname === '/idea-detail' ||
    location.pathname.startsWith('/factory-ideas/products/') ||
    location.pathname.startsWith('/factory-ideas/promotions/') ||
    location.pathname.startsWith('/factory-ideas/ideas/') ||
    location.pathname.startsWith('/factories/');
  const mainContentMaxWidth =
    wideContentPaths.includes(location.pathname) ||
    isWideChatRoom ||
    isWideOrderDetail ||
    isWideFactoryPortal ||
    isProfileShell ||
    isWidePublicDetail
      ? 'max-w-[1600px]'
      : 'max-w-7xl';

  if (isAdminRole && !location.pathname.startsWith('/admin')) {
    return <Navigate to='/admin/dashboard' replace />;
  }

  const brandActive = 'var(--brand-purple)';

  /** Mobile FAB — whitelist only (Explore home = `/`) */
  const createRfqFabPaths = ['/', '/factory-ideas', '/orders', '/messages', '/profile'] as const;

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
        {!hideMobileTopHeader ? (
          <header
            className={`lg:hidden sticky top-0 z-50 border-b backdrop-blur-md ${
              isWideFactoryPortal
                ? 'border-slate-200/70 bg-[var(--brand-page)]/95 shadow-none'
                : 'border-gray-200 bg-white shadow-sm'
            }`}
          >
            <div
              className={`mx-auto ${
                isWideFactoryPortal ? 'max-w-[1600px] px-5 sm:px-5' : 'max-w-7xl px-4 sm:px-6'
              }`}
            >
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
                  {null /* wallet hidden for factory — direct bank transfer flow */}

                  {showCustomerFavorites ? (
                    <HeaderIconLink
                      to={favoritesHref}
                      title='รายการโปรด'
                      ariaLabel='รายการโปรด'
                      tone='rose'
                      active={onFavoritesPage}
                      onClick={
                        !isAuthenticated
                          ? (e: React.MouseEvent) => {
                              e.preventDefault();
                              openLoginModal('/profile/favorites');
                            }
                          : undefined
                      }
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
        ) : null}

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main
          className={`flex-1 min-w-0 overflow-x-hidden bg-[var(--brand-page)]${isWideFactoryPortal ? ' lg:pb-0' : ''}`}
          style={
            isWideFactoryPortal && !hideMobileBottomNav
              ? {
                  paddingBottom: `calc(${MOBILE_BOTTOM_NAV_CLEARANCE} + env(safe-area-inset-bottom, 0px))`,
                }
              : undefined
          }
        >
          {/* `relative` gives AnimatePresence a positioned ancestor so the
              exiting element doesn't escape the content column. */}
          <div className={`relative ${mainContentMaxWidth} mx-auto min-h-full`}>
            <AnimatedOutlet />
          </div>
        </main>
      </div>

      {!hideMobileBottomNav ? (
        <MobileBottomNav
          compact={bottomNavCompact}
          isFactory={isFactory}
          factoryApproved={factoryApproved}
          factoryBottomLinks={factoryBottomLinks}
          unreadMessages={unreadMessages}
          brandActive={brandActive}
          isAuthenticated={isAuthenticated}
          onProfileGuest={() => openLoginModal('/profile')}
        />
      ) : null}

      {showCreateRfqFab ? (
        <MobileCreateRfqFab
          bottomNavCompact={bottomNavCompact}
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
