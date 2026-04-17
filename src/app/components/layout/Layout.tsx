import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router';
import {
  Home,
  ClipboardList,
  MessageCircle,
  User,
  Lightbulb,
  Menu,
  X,
  Bell,
  Factory,
  Wallet,
} from 'lucide-react';
import { DesktopSidebar } from './DesktopSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { isFactoryRole } from '../../utils/factoryUser';
import {
  FACTORY_SIDEBAR_NAV,
  isFactorySidebarNavActive,
} from './factoryGlobalNavConfig';

const customerNavLinks = [
  { path: '/', icon: Home, label: 'หน้าแรก' },
  { path: '/factory-ideas', icon: Lightbulb, label: 'แนะนำโรงงาน' },
  { path: '/orders', icon: ClipboardList, label: 'คำสั่งงาน' },
  { path: '/messages', icon: MessageCircle, label: 'ข้อความ' },
];

type MobileNavItem =
  | (typeof customerNavLinks)[number]
  | (typeof FACTORY_SIDEBAR_NAV)[number];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const data = useData();
  const unreadNotifications = data.notifications.filter((n) => !n.read).length;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isFactory = isFactoryRole(user);
  const navLinks: MobileNavItem[] = isFactory ? FACTORY_SIDEBAR_NAV : customerNavLinks;

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="min-h-screen flex bg-white w-full max-w-full overflow-x-hidden">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Mobile/Tablet Header — hidden on desktop (lg+) */}
        <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 shrink-0">
                <div
                  className="h-7 pl-1.5 pr-2 sm:h-8 sm:pl-2 sm:pr-2.5 rounded-full flex items-center gap-1.5 shrink-0 border backdrop-blur-sm"
                  style={{ background: 'rgba(162,56,255,0.30)', borderColor: 'rgba(162,56,255,0.50)' }}
                >
                  <Factory className="shrink-0" size={14} strokeWidth={2.5} style={{ color: '#A238FF' }} />
                  <span className="text-[10px] sm:text-xs font-bold leading-none whitespace-nowrap" style={{ color: '#A238FF' }}>
                    WeMake
                  </span>
                </div>
              </Link>

              {/* Desktop Nav (md only, before lg sidebar kicks in) */}
              <nav className="hidden md:flex lg:hidden items-center gap-1">
                {navLinks.map((item) => {
                  if (isFactory && 'href' in item) {
                    const active = isFactorySidebarNavActive(location.pathname, item);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors duration-150"
                        style={{
                          color: active ? '#A238FF' : '#6B7280',
                          background: active ? 'rgba(162,56,255,0.08)' : 'transparent',
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                        {item.label}
                      </button>
                    );
                  }
                  const { path, icon: Icon, label } = item as (typeof customerNavLinks)[number];
                  const active = isActive(path);
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => navigate(path)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors duration-150"
                      style={{
                        color: active ? '#A238FF' : '#6B7280',
                        background: active ? 'rgba(162,56,255,0.08)' : 'transparent',
                        fontWeight: active ? 600 : 500,
                      }}
                    >
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                      {label}
                    </button>
                  );
                })}
              </nav>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                {isFactory ? (
                  <Link
                    to="/factory/wallet"
                    className="lg:hidden flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-violet-50 transition-colors border border-violet-100/80"
                    title="กระเป๋าเงิน"
                  >
                    <Wallet size={18} style={{ color: '#F28A2E' }} />
                    <span className="text-xs font-bold tabular-nums max-w-[4.5rem] truncate" style={{ color: '#2D1B4E' }}>
                      ฿{(data.currentUser?.walletBalance ?? 0).toLocaleString()}
                    </span>
                  </Link>
                ) : null}
                <Link
                  to="/notifications"
                  className="relative w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Bell size={20} style={{ color: '#A238FF' }} />
                  {unreadNotifications > 0 ? (
                    <span
                      className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white flex items-center justify-center text-[9px] border-2 border-white tabular-nums"
                      style={{ background: '#F28A2E', fontWeight: 700 }}
                    >
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  ) : null}
                </Link>

                <button
                  onClick={() => navigate('/profile')}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <User size={20} style={{ color: '#6B7280' }} />
                  <span className="text-sm" style={{ color: '#374151', fontWeight: 500 }}>
                    โปรไฟล์
                  </span>
                </button>

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X size={22} style={{ color: '#374151' }} />
                  ) : (
                    <Menu size={22} style={{ color: '#374151' }} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Nav Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((item) => {
                  if (isFactory && 'href' in item) {
                    const active = isFactorySidebarNavActive(location.pathname, item);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          navigate(item.href);
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm transition-colors duration-150"
                        style={{
                          color: active ? '#A238FF' : '#374151',
                          background: active ? 'rgba(162,56,255,0.08)' : 'transparent',
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                        {item.label}
                      </button>
                    );
                  }
                  const { path, icon: Icon, label } = item as (typeof customerNavLinks)[number];
                  const active = isActive(path);
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => {
                        navigate(path);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm transition-colors duration-150"
                      style={{
                        color: active ? '#A238FF' : '#374151',
                        background: active ? 'rgba(162,56,255,0.08)' : 'transparent',
                        fontWeight: active ? 600 : 500,
                      }}
                    >
                      <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                      {label}
                    </button>
                    );
                  })}
                {isFactory ? (
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/factory/wallet');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm transition-colors border mt-2"
                    style={{
                      color: '#2D1B4E',
                      background: '#F8F5FF',
                      borderColor: 'rgba(162,56,255,0.20)',
                      fontWeight: 600,
                    }}
                  >
                    <Wallet size={20} style={{ color: '#F28A2E' }} />
                    <span className="flex-1 text-left">กระเป๋าเงิน</span>
                    <span className="text-xs font-bold tabular-nums">
                      ฿{(data.currentUser?.walletBalance ?? 0).toLocaleString()}
                    </span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    navigate('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm sm:hidden transition-colors duration-150"
                  style={{
                    color: isActive('/profile') ? '#A238FF' : '#374151',
                    background: isActive('/profile') ? 'rgba(162,56,255,0.08)' : 'transparent',
                    fontWeight: isActive('/profile') ? 600 : 500,
                  }}
                >
                  <User size={20} strokeWidth={isActive('/profile') ? 2.2 : 1.8} />
                  โปรไฟล์
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
