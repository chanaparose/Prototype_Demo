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
  Lock,
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { isFactoryRole } from '../../utils/factoryUser';
import {
  FACTORY_SIDEBAR_NAV,
  isFactorySidebarNavActive,
} from './factoryGlobalNavConfig';
import { factoryVerifyStatus } from '../factory/FactoryVerifiedGuard';

/** รูปโปรไฟล์เริ่มต้นเมื่อไม่มี avatar จาก API */
const DEFAULT_USER_AVATAR_SRC =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="14" fill="#EDE9FE"/>
      <circle cx="32" cy="26" r="11" fill="#A238FF" opacity="0.35"/>
      <ellipse cx="32" cy="48" rx="18" ry="14" fill="#A238FF" opacity="0.25"/>
    </svg>`,
  );

const customerNavLinks = [
  { path: '/', icon: Home, label: 'หน้าแรก' },
  { path: '/factory-ideas', icon: Lightbulb, label: 'แนะนำโรงงาน' },
  { path: '/orders', icon: ClipboardList, label: 'RFQ & คำสั่งงาน' },
  { path: '/messages', icon: MessageCircle, label: 'ข้อความ' },
];

export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = useData();
  const { user: authUser } = useAuth();
  const currentUser = data.currentUser;
  const isFactory = isFactoryRole(authUser);
  const factoryApproved = factoryVerifyStatus(authUser) === 'AP';

  const isActivePath = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const unreadMessages = data.conversations.reduce((s, c) => s + c.unread, 0);
  const unreadNotifications = data.notifications.filter((n) => !n.read).length;
  const activeRfqCount = data.rfqs.filter(
    (r) =>
      r.status !== 'completed' && r.status !== 'cancelled' && r.status !== 'expired',
  ).length;

  const avatarSrc =
    currentUser?.avatar && String(currentUser.avatar).trim() !== ''
      ? String(currentUser.avatar).trim()
      : DEFAULT_USER_AVATAR_SRC;

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-40">
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-gray-100 shrink-0">
        <Link to="/" className="flex items-center gap-2.5 w-full">
          <div
            className="h-8 px-2.5 rounded-full flex items-center gap-1.5 shrink-0 border backdrop-blur-sm"
            style={{ background: 'rgba(162,56,255,0.30)', borderColor: 'rgba(162,56,255,0.50)' }}
          >
            <Factory className="shrink-0" size={15} strokeWidth={2.5} style={{ color: '#A238FF' }} />
            <span className="text-xs font-bold leading-none whitespace-nowrap" style={{ color: '#A238FF' }}>
              WeMake
            </span>
          </div>
          <span className="text-sm font-semibold" style={{ color: '#2D1B4E' }}>Manufacturing</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto" aria-label="เมนูหลัก">
        {isFactory
          ? FACTORY_SIDEBAR_NAV.map((item) => {
              const active = isFactorySidebarNavActive(location.pathname, item);
              const Icon = item.icon;
              const locked = Boolean(item.requiresApproval && !factoryApproved);
              return (
                <button
                  key={item.key}
                  type="button"
                  title={locked ? 'โรงงานอยู่ระหว่างตรวจสอบ' : undefined}
                  onClick={() => {
                    if (locked) return;
                    navigate(item.href);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm transition-all duration-150 ${
                    locked ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                  style={{
                    color: active ? '#A238FF' : '#6B7280',
                    background: active ? 'rgba(162,56,255,0.08)' : 'transparent',
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {locked ? (
                    <Lock size={16} className="shrink-0 text-violet-500" strokeWidth={2} aria-hidden />
                  ) : null}
                  {item.badge === 'unread-messages' && unreadMessages > 0 ? (
                    <span
                      className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{ background: '#F28A2E' }}
                    >
                      {unreadMessages}
                    </span>
                  ) : null}
                </button>
              );
            })
          : customerNavLinks.map(({ path, icon: Icon, label }) => {
              const active = isActivePath(path);
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm transition-all duration-150"
                  style={{
                    color: active ? '#A238FF' : '#6B7280',
                    background: active ? 'rgba(162,56,255,0.08)' : 'transparent',
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="flex-1 text-left">{label}</span>
                  {path === '/messages' && unreadMessages > 0 ? (
                    <span
                      className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{ background: '#F28A2E' }}
                    >
                      {unreadMessages}
                    </span>
                  ) : null}
                  {path === '/orders' && activeRfqCount > 0 ? (
                    <span
                      className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={
                        active
                          ? { background: '#A238FF', color: 'white' }
                          : { background: '#F3F4F6', color: '#6B7280' }
                      }
                    >
                      {activeRfqCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
      </nav>

      {/* สรุปยอดกระเป๋า — โรงงาน: ทางลัด (มีเมนูกระเป๋าเงินใน nav แล้ว) */}
      {isFactory ? (
        <Link
          to="/factory/wallet"
          className="mx-3 mb-3 p-3.5 rounded-2xl border relative overflow-hidden block text-left transition-opacity hover:opacity-95 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
          style={{ background: '#F8F5FF', borderColor: 'rgba(162,56,255,0.20)' }}
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl" style={{ background: 'rgba(162,56,255,0.10)' }}></div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Wallet size={13} style={{ color: '#F28A2E' }} />
              <span className="text-[11px] font-medium text-gray-500">กระเป๋าเงิน</span>
            </div>
            <span className="text-[10px] font-semibold shrink-0" style={{ color: '#A238FF' }}>
              ดูรายละเอียด →
            </span>
          </div>
          <p className="text-base font-bold" style={{ color: '#2D1B4E' }}>
            ฿{currentUser?.walletBalance.toLocaleString()}
          </p>
          <p className="text-[10px] mt-0.5 font-medium" style={{ color: '#A238FF' }}>
            รอดำเนินการ ฿{currentUser?.pendingBalance.toLocaleString()}
          </p>
        </Link>
      ) : (
        <div className="mx-3 mb-3 p-3.5 rounded-2xl border relative overflow-hidden" style={{ background: '#F8F5FF', borderColor: 'rgba(162,56,255,0.20)' }}>
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl" style={{ background: 'rgba(162,56,255,0.10)' }}></div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Wallet size={13} style={{ color: '#F28A2E' }} />
            <span className="text-[11px] font-medium text-gray-500">กระเป๋าเงิน</span>
          </div>
          <p className="text-base font-bold" style={{ color: '#2D1B4E' }}>
            ฿{currentUser?.walletBalance.toLocaleString()}
          </p>
          <p className="text-[10px] mt-0.5 font-medium" style={{ color: '#A238FF' }}>
            รอดำเนินการ ฿{currentUser?.pendingBalance.toLocaleString()}
          </p>
        </div>
      )}

      {/* Create RFQ — เฉพาะลูกค้า */}
      {!isFactory ? (
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => navigate('/create-rfq')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #A238FF 0%, #F28A2E 100%)', boxShadow: '0 4px 14px rgba(162,56,255,0.30)' }}
          >
            <Plus size={18} />
            สร้าง RFQ ใหม่
          </button>
        </div>
      ) : null}

      {/* Profile + การแจ้งเตือน — รูปแบบเดียวกับลูกค้า (ไม่อยู่ในรายการเมนูหลัก) */}
      <div className="border-t border-gray-100 px-3 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 flex-1 min-w-0 p-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <img
              src={avatarSrc}
              alt={currentUser?.name ?? 'โปรไฟล์'}
              className="w-8 h-8 rounded-xl object-cover shrink-0 bg-violet-50"
            />
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#2D1B4E' }}>{currentUser?.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{currentUser?.company}</p>
            </div>
          </button>
          <Link
            to="/notifications"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
          >
            <Bell size={17} style={{ color: '#A238FF' }} />
            {unreadNotifications > 0 ? (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] flex items-center justify-center font-bold border-2 border-white tabular-nums"
                style={{ background: '#F28A2E' }}
              >
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </aside>
  );
}
