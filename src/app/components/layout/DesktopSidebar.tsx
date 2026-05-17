import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Home,
  ClipboardList,
  MessageCircle,
  Lightbulb,
  Plus,
  Bell,
  Wallet,
  Lock,
} from 'lucide-react';
import { useData } from '../../stores';
import { useAuth } from '../../stores';
import { isFactoryRole } from '../../utils/factoryUser';
import {
  FACTORY_SIDEBAR_NAV,
  isFactorySidebarNavActive,
} from './factoryGlobalNavConfig';
import { factoryVerifyStatus } from '../factory/FactoryVerifiedGuard';
import { HARDCODED_CUSTOMER_PROFILE_SRC } from '../../constants/customerProfile';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';
import { useLocalStorage } from '../../hooks';
import { isTourActive, subscribeTourActive } from '../../utils/tourMocks';
import { Button } from '../ui/button';

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
  { path: '/orders', icon: ClipboardList, label: 'คำขอราคา & คำสั่งงาน' },
  { path: '/messages', icon: MessageCircle, label: 'ข้อความ' },
];

export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = useData();
  const { user: authUser, isAuthenticated } = useAuth();
  const currentUser = data.currentUser;
  const isFactory = isFactoryRole(authUser);
  const factoryApproved = factoryVerifyStatus(authUser) === 'AP';
  // Tour state persisted with localStorage and synchronized via subscription
  const { value: tourOn, setValue: setTourOn } = useLocalStorage('tourActive', isTourActive());
  React.useEffect(() => subscribeTourActive((active) => setTourOn(active)), [setTourOn]);

  const isActivePath = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const unreadMessages = data.conversations.reduce((s, c) => s + c.unread, 0);
  const unreadNotifications = useNotificationUnreadCount(isAuthenticated);
  const activeRfqCount = data.rfqs.filter(
    (r) =>
      r.status !== 'completed' && r.status !== 'cancelled' && r.status !== 'expired',
  ).length;

  const avatarSrc = isFactory
    ? currentUser?.avatar && String(currentUser.avatar).trim() !== ''
      ? String(currentUser.avatar).trim()
      : DEFAULT_USER_AVATAR_SRC
    : HARDCODED_CUSTOMER_PROFILE_SRC;

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-40">
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-gray-100 shrink-0">
        <Link to="/" className="flex items-center w-full">
          <img
            src="/assets/tryly-logo.png"
            alt="Tryly"
            className="h-20 w-auto shrink-0 object-contain -ml-[10px]"
          />
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
                <Button variant="unstyled"
                  key={item.key}
                  type="button"
                  title={locked ? 'โรงงานอยู่ระหว่างตรวจสอบ' : undefined}
                  onClick={() => {
                    if (locked) return;
                    navigate(item.href);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm transition-all duration-150 ${
                    locked ? 'cursor-not-allowed opacity-60' : ''
                  } ${active ? 'border-l-4 border-indigo-600 pl-3' : 'border-l-4 border-transparent'}`}
                  style={{
                    color: active ? '#4338CA' : '#475569',
                    background: active ? '#EEF2FF' : 'transparent',
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {locked ? (
                    <Lock size={16} className="shrink-0 text-slate-500" strokeWidth={2} aria-hidden />
                  ) : null}
                  {item.badge === 'unread-messages' && unreadMessages > 0 ? (
                    <span
                      className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{ background: '#F28A2E' }}
                    >
                      {unreadMessages}
                    </span>
                  ) : null}
                </Button>
              );
            })
          : customerNavLinks.map(({ path, icon: Icon, label }) => {
              const active = isActivePath(path);
              return (
                <Button variant="unstyled"
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
                </Button>
              );
            })}
      </nav>

      {/* สรุปยอดกระเป๋า — โรงงาน: ทางลัด (มีเมนูกระเป๋าเงินใน nav แล้ว) */}
      {isFactory ? (
        <Link
          to="/factory/wallet"
          className="mx-3 mb-3 p-3.5 rounded-2xl border relative overflow-hidden block text-left transition-opacity hover:opacity-95 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 bg-slate-50 border-slate-200"
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl" style={{ background: 'rgba(79,70,229,0.10)' }}></div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Wallet size={13} style={{ color: '#4F46E5' }} />
              <span className="text-[11px] font-medium text-gray-500">กระเป๋าเงิน</span>
            </div>
            <span className="text-[10px] font-semibold shrink-0" style={{ color: '#4F46E5' }}>
              ดูรายละเอียด →
            </span>
          </div>
          <p className="text-base font-bold" style={{ color: '#0F172A' }}>
            ฿{currentUser?.walletBalance.toLocaleString()}
          </p>
          <p className="text-[10px] mt-0.5 font-medium" style={{ color: '#4F46E5' }}>
            รอดำเนินการ ฿{currentUser?.pendingBalance.toLocaleString()}
          </p>
        </Link>
      ) : isAuthenticated ? (
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
      ) : (
        <div className="mx-3 mb-3 p-3.5 rounded-2xl border relative overflow-hidden" style={{ background: '#F8F5FF', borderColor: 'rgba(162,56,255,0.20)' }}>
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl" style={{ background: 'rgba(162,56,255,0.10)' }}></div>
          <div className="flex items-center gap-1.5 mb-2">
            <Wallet size={13} style={{ color: '#F28A2E' }} />
            <span className="text-[11px] font-medium text-gray-500">กระเป๋าเงิน</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">Guest View: เข้าสู่ระบบเพื่อใช้งานกระเป๋าเงิน</p>
          <div className="flex gap-2">
            <Button variant="unstyled"
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 rounded-lg bg-white border border-[#A238FF]/25 px-2 py-1.5 text-[11px] font-semibold"
              style={{ color: '#A238FF' }}
            >
              Login
            </Button>
            <Button variant="unstyled"
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #A238FF 0%, #F28A2E 100%)' }}
            >
              Register
            </Button>
          </div>
        </div>
      )}

      {/* Create RFQ — เฉพาะลูกค้า (หรือระหว่าง ProductTour) */}
      {!isFactory && (isAuthenticated || tourOn === true) ? (
        <div className="px-3 pb-3">
          <Button variant="unstyled"
            type="button"
            data-tour="create-rfq-cta"
            onClick={() => navigate('/create-rfq')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #A238FF 0%, #F28A2E 100%)', boxShadow: '0 4px 14px rgba(162,56,255,0.30)' }}
          >
            <Plus size={18} />
            สร้างคำขอราคา
          </Button>
        </div>
      ) : null}

      {/* Profile + การแจ้งเตือน — รูปแบบเดียวกับลูกค้า (ไม่อยู่ในรายการเมนูหลัก) */}
      <div className="border-t border-gray-100 px-3 py-3 shrink-0">
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <Button variant="unstyled"
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 flex-1 min-w-0 p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span className="relative block w-8 h-8 rounded-xl overflow-hidden shrink-0 bg-[#EFEAF7]">
                <img
                  src={avatarSrc}
                  alt={currentUser?.name ?? 'โปรไฟล์'}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              </span>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: isFactory ? '#0F172A' : '#2D1B4E' }}>{currentUser?.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{currentUser?.company}</p>
              </div>
            </Button>
            <Link
              to="/notifications"
              className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
            >
              <Bell size={17} style={{ color: isFactory ? '#4F46E5' : '#A238FF' }} />
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
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
            <span className="relative block w-8 h-8 rounded-xl overflow-hidden shrink-0 bg-[#EFEAF7]">
              <img src={DEFAULT_USER_AVATAR_SRC} alt="Guest View" className="absolute inset-0 w-full h-full object-cover object-center" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#2D1B4E' }}>Guest View</p>
              <p className="text-[10px] text-gray-400 truncate">ดูข้อมูลได้โดยยังไม่ต้องเข้าสู่ระบบ</p>
            </div>
            <Button variant="unstyled"
              type="button"
              onClick={() => navigate('/login')}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-[#A238FF]/25 bg-white"
              style={{ color: '#A238FF' }}
            >
              Login
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
