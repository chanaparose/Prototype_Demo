import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Home,
  ClipboardList,
  MessageCircle,
  Lightbulb,
  Factory,
  Plus,
  Bell,
  Wallet,
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const navLinks = [
  { path: '/', icon: Home, label: 'หน้าแรก' },
  { path: '/factory-ideas', icon: Lightbulb, label: 'แนะนำโรงงาน' },
  { path: '/orders', icon: ClipboardList, label: 'RFQ & คำสั่งงาน' },
  { path: '/messages', icon: MessageCircle, label: 'ข้อความ' },
];

export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = useData();
  const currentUser = data.currentUser;

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(path));

  const unreadMessages = data.conversations.reduce((s, c) => s + c.unread, 0);
  const activeRfqCount = data.rfqs.filter(
    (r) => r.status !== 'completed' && r.status !== 'cancelled' && r.status !== 'expired'
  ).length;

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-40">
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-gray-100 shrink-0">
        <Link to="/" className="flex items-center gap-2.5 w-full">
          <div
            className="h-8 px-2.5 rounded-xl flex items-center gap-1.5 shrink-0"
            style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)' }}
          >
            <Factory className="text-white shrink-0" size={15} strokeWidth={2.5} />
            <span className="text-white text-xs font-bold leading-none whitespace-nowrap">
              WeMake
            </span>
          </div>
          <span className="text-sm font-semibold text-gray-700">Manufacturing</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
        {navLinks.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm transition-all duration-150"
              style={{
                color: active ? '#6C47FF' : '#6B7280',
                background: active ? 'rgba(108,71,255,0.08)' : 'transparent',
                fontWeight: active ? 600 : 500,
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span className="flex-1 text-left">{label}</span>
              {path === '/messages' && unreadMessages > 0 && (
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
              {path === '/orders' && activeRfqCount > 0 && !active && (
                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center">
                  {activeRfqCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Wallet Summary */}
      <div className="mx-3 mb-3 p-3.5 rounded-xl" style={{ background: 'rgba(108,71,255,0.06)' }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Wallet size={13} style={{ color: '#6C47FF' }} />
          <span className="text-[11px] text-gray-500 font-medium">กระเป๋าเงิน</span>
        </div>
        <p className="text-base font-bold text-gray-900">
          ฿{currentUser?.walletBalance.toLocaleString()}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: '#F59E0B' }}>
          รอดำเนินการ ฿{currentUser?.pendingBalance.toLocaleString()}
        </p>
      </div>

      {/* Create RFQ Button */}
      <div className="px-3 pb-3">
        <button
          onClick={() => navigate('/create-rfq')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)' }}
        >
          <Plus size={18} />
          สร้าง RFQ ใหม่
        </button>
      </div>

      {/* Profile footer */}
      <div className="border-t border-gray-100 px-3 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 flex-1 min-w-0 p-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="w-8 h-8 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs text-gray-900 font-semibold truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{currentUser?.company}</p>
            </div>
          </button>
          <Link
            to="/notifications"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
          >
            <Bell size={17} style={{ color: '#6C47FF' }} />
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">
              3
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
