import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link, Navigate } from 'react-router';
import {
  Home,
  ClipboardList,
  MessageCircle,
  User,
  Lightbulb,
  Menu,
  X,
  Bell,
  Wallet,
  Lock,
} from 'lucide-react';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { ProductTour } from '@/components/features/explore/ProductTour';
import { useAuth } from '@/stores';
import { useData } from '@/stores';
import { isFactoryRole } from '@/utils/factoryUser';
import {
  FACTORY_SIDEBAR_NAV,
  isFactorySidebarNavActive,
} from '@/components/layout/factoryGlobalNavConfig';
import { factoryVerifyStatus } from '@/components/factory/FactoryVerifiedGuard';
import { Button } from '@/components/ui/button';

const customerNavLinks = [
  { path: '/', icon: Home, label: 'หน้าแรก' },
  { path: '/factory-ideas', icon: Lightbulb, label: 'แนะนำโรงงาน' },
  { path: '/orders', icon: ClipboardList, label: 'คำสั่งงาน' },
  { path: '/messages', icon: MessageCircle, label: 'ข้อความ' },
];

type MobileNavItem = (typeof customerNavLinks)[number] | (typeof FACTORY_SIDEBAR_NAV)[number];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const data = useData();
  const unreadNotifications = data.notifications.filter((n) => !n.read).length;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isFactory = isFactoryRole(user);
  const userRole = String(user?.role ?? '').toUpperCase();
  const isAdminRole = userRole === 'AM' || userRole === 'AD' || userRole === 'SA';
  const navLinks: MobileNavItem[] = isFactory ? FACTORY_SIDEBAR_NAV : customerNavLinks;
  const factoryApproved = factoryVerifyStatus(user) === 'AP';

  if (isAdminRole && !location.pathname.startsWith('/admin')) {
    return <Navigate to='/admin/dashboard' replace />;
  }

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className='min-h-screen flex bg-white w-full max-w-full overflow-x-hidden'>
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content */}
      <div className='flex-1 flex flex-col lg:pl-64 min-w-0'>
        {/* Mobile/Tablet Header — hidden on desktop (lg+) */}
        <header className='lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6'>
            <div className='flex items-center justify-between h-16'>
              {/* Logo */}
              <Link to='/' className='flex items-center gap-2 shrink-0'>
                <img
                  src='/assets/tryly-logo.png'
                  alt='Tryly'
                  className='h-15 sm:h-15 w-auto object-contain'
                />
              </Link>

              {/* Desktop Nav (md only, before lg sidebar kicks in) */}
              <nav className='hidden md:flex lg:hidden items-center gap-1'>
                {navLinks.map((item) => {
                  if (isFactory && 'href' in item) {
                    const active = isFactorySidebarNavActive(location.pathname, item);
                    const Icon = item.icon;
                    const locked = Boolean(item.requiresApproval && !factoryApproved);
                    return (
                      <Button
                        variant='unstyled'
                        key={item.key}
                        type='button'
                        title={locked ? 'โรงงานอยู่ระหว่างตรวจสอบ' : undefined}
                        onClick={() => {
                          if (locked) return;
                          navigate(item.href);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors duration-150 ${
                          locked ? 'cursor-not-allowed opacity-60' : ''
                        }`}
                        style={{
                          color: active ? '#4338CA' : '#475569',
                          background: active ? '#EEF2FF' : 'transparent',
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                        {item.label}
                        {locked ? (
                          <Lock size={14} className='shrink-0 text-slate-500' aria-hidden />
                        ) : null}
                      </Button>
                    );
                  }
                  const { path, icon: Icon, label } = item as (typeof customerNavLinks)[number];
                  const active = isActive(path);
                  return (
                    <Button
                      variant='unstyled'
                      key={path}
                      type='button'
                      onClick={() => navigate(path)}
                      className='flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors duration-150'
                      style={{
                        color: active ? '#A238FF' : '#6B7280',
                        background: active ? 'rgba(162,56,255,0.08)' : 'transparent',
                        fontWeight: active ? 600 : 500,
                      }}
                    >
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                      {label}
                    </Button>
                  );
                })}
              </nav>

              {/* Right Actions */}
              <div className='flex items-center gap-2'>
                {isFactory ? (
                  <Link
                    to='/factory/wallet'
                    className='lg:hidden flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-indigo-50 transition-colors border border-indigo-100/80'
                    title='กระเป๋าเงิน'
                  >
                    <Wallet size={18} style={{ color: '#4F46E5' }} />
                    <span
                      className='text-xs font-bold tabular-nums max-w-[4.5rem] truncate'
                      style={{ color: '#0F172A' }}
                    >
                      ฿{(data.currentUser?.walletBalance ?? 0).toLocaleString()}
                    </span>
                  </Link>
                ) : null}
                <Link
                  to='/notifications'
                  className='relative w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors'
                >
                  <Bell size={20} style={{ color: isFactory ? '#4F46E5' : '#A238FF' }} />
                  {unreadNotifications > 0 ? (
                    <span
                      className='absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white flex items-center justify-center text-[9px] border-2 border-white tabular-nums'
                      style={{ background: '#F28A2E', fontWeight: 700 }}
                    >
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  ) : null}
                </Link>

                <Button
                  variant='unstyled'
                  onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
                  className='hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors'
                >
                  <User size={20} style={{ color: '#6B7280' }} />
                  <span className='text-sm' style={{ color: '#374151', fontWeight: 500 }}>
                    {isAuthenticated ? 'โปรไฟล์' : 'Guest View'}
                  </span>
                </Button>

                {/* Mobile menu toggle */}
                <Button
                  variant='unstyled'
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className='md:hidden w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors'
                  aria-label='Toggle menu'
                >
                  {mobileMenuOpen ? (
                    <X size={22} style={{ color: '#374151' }} />
                  ) : (
                    <Menu size={22} style={{ color: '#374151' }} />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Nav Dropdown */}
          {mobileMenuOpen && (
            <div className='md:hidden border-t border-gray-100 bg-white shadow-lg'>
              <div className='px-4 py-3 space-y-1'>
                {navLinks.map((item) => {
                  if (isFactory && 'href' in item) {
                    const active = isFactorySidebarNavActive(location.pathname, item);
                    const Icon = item.icon;
                    const locked = Boolean(item.requiresApproval && !factoryApproved);
                    return (
                      <Button
                        variant='unstyled'
                        key={item.key}
                        type='button'
                        title={locked ? 'โรงงานอยู่ระหว่างตรวจสอบ' : undefined}
                        onClick={() => {
                          if (locked) return;
                          navigate(item.href);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm transition-colors duration-150 ${
                          locked ? 'cursor-not-allowed opacity-60' : ''
                        }`}
                        style={{
                          color: active ? '#4338CA' : '#334155',
                          background: active ? '#EEF2FF' : 'transparent',
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                        {item.label}
                        {locked ? (
                          <Lock size={16} className='shrink-0 text-slate-500 ml-auto' aria-hidden />
                        ) : null}
                      </Button>
                    );
                  }
                  const { path, icon: Icon, label } = item as (typeof customerNavLinks)[number];
                  const active = isActive(path);
                  return (
                    <Button
                      variant='unstyled'
                      key={path}
                      type='button'
                      onClick={() => {
                        navigate(path);
                        setMobileMenuOpen(false);
                      }}
                      className='flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm transition-colors duration-150'
                      style={{
                        color: active ? '#A238FF' : '#374151',
                        background: active ? 'rgba(162,56,255,0.08)' : 'transparent',
                        fontWeight: active ? 600 : 500,
                      }}
                    >
                      <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                      {label}
                    </Button>
                  );
                })}
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => {
                    navigate(isAuthenticated ? '/profile' : '/login');
                    setMobileMenuOpen(false);
                  }}
                  className='flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm sm:hidden transition-colors duration-150'
                  style={{
                    color: isAuthenticated && isActive('/profile') ? '#A238FF' : '#374151',
                    background:
                      isAuthenticated && isActive('/profile')
                        ? 'rgba(162,56,255,0.08)'
                        : 'transparent',
                    fontWeight: isAuthenticated && isActive('/profile') ? 600 : 500,
                  }}
                >
                  <User
                    size={20}
                    strokeWidth={isAuthenticated && isActive('/profile') ? 2.2 : 1.8}
                  />
                  {isAuthenticated ? 'โปรไฟล์' : 'Guest View'}
                </Button>
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className='flex-1 min-w-0 overflow-x-hidden'>
          <div className='max-w-7xl mx-auto'>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Product Tour — persists across all routes */}
      <ProductTour />
    </div>
  );
}
