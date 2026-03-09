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
} from 'lucide-react';

const navLinks = [
  { path: '/', icon: Home, label: 'หน้าแรก' },
  { path: '/factory-ideas', icon: Lightbulb, label: 'แนะนำโรงงาน' },
  { path: '/orders', icon: ClipboardList, label: 'คำสั่งงาน' },
  { path: '/messages', icon: MessageCircle, label: 'ข้อความ' },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div
                className="h-7 pl-1.5 pr-2 sm:h-8 sm:pl-2 sm:pr-2.5 rounded-lg flex items-center gap-1.5 shrink-0"
                style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)' }}
              >
                <Factory className="text-white shrink-0" size={14} strokeWidth={2.5} />
                <span className="text-white text-[10px] sm:text-xs font-bold leading-none whitespace-nowrap">
                  WeMake
                </span>
              </div>
              <span className="text-base sm:text-lg font-bold text-gray-800 hidden sm:block leading-tight">
                FactoryLink
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ path, icon: Icon, label }) => {
                const active = isActive(path);
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors duration-150"
                    style={{
                      color: active ? '#6C47FF' : '#6B7280',
                      background: active ? 'rgba(108,71,255,0.08)' : 'transparent',
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
              <Link
                to="/notifications"
                className="relative w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Bell size={20} style={{ color: '#6C47FF' }} />
                <span
                  className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px]"
                  style={{ background: '#EF4444', fontWeight: 700 }}
                >
                  3
                </span>
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
              {navLinks.map(({ path, icon: Icon, label }) => {
                const active = isActive(path);
                return (
                  <button
                    key={path}
                    onClick={() => {
                      navigate(path);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm transition-colors duration-150"
                    style={{
                      color: active ? '#6C47FF' : '#374151',
                      background: active ? 'rgba(108,71,255,0.08)' : 'transparent',
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                    {label}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  navigate('/profile');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm sm:hidden transition-colors duration-150"
                style={{
                  color: isActive('/profile') ? '#6C47FF' : '#374151',
                  background: isActive('/profile') ? 'rgba(108,71,255,0.08)' : 'transparent',
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

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
