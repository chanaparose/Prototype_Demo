import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  ClipboardList,
  MessageCircle,
  Lightbulb,
  Plus,
  Bell,
  Lock,
  ArrowLeftRight,
  Factory,
  User,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { useData } from '@/stores/useDataStore';
import { useShallow } from 'zustand/react/shallow';
import { useAuth, useAuthStore } from '@/stores/useAuthStore';
import { getAvailableRoles } from '@/services/api/authApi';
import { httpClient } from '@/services/api/httpClient';
import { isFactoryRole } from '@/utils/factoryUser';
import { profileInitKey } from '@/hooks/factory/useProfileInit';
import {
  FACTORY_SIDEBAR_NAV,
  filterFactoryNavByPaymentMode,
  isFactorySidebarNavActive,
} from '@/components/layout/factoryGlobalNavConfig';
import { usePaymentConfig } from '@/hooks/usePaymentConfig';
import { factoryVerifyStatus } from '@/components/factory/FactoryVerifiedGuard';
import { resolveCustomerAvatarSrc } from '@/utils/customerAvatar';
import { useRfqListQuery } from '@/domain/rfq/queries/useRfqListQuery';
import { useConversationUnreadCount } from '@/domain/chat/hooks/useConversationUnreadCount';
import { useNotificationUnreadCount } from '@/hooks/useNotificationUnreadCount';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
import { createRfqCtaSidebarClass } from '@/styles/createRfqCta';
import { isCustomerNavLinkActive } from '@/components/features/factory-ideas/factoryIdeasHubNav';

/** รูปโปรไฟล์เริ่มต้นเมื่อไม่มี avatar จาก API */
const DEFAULT_USER_AVATAR_SRC =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="14" fill="var(--brand-violet-soft)"/>
      <circle cx="32" cy="26" r="11" fill="var(--brand-purple)" opacity="0.35"/>
      <ellipse cx="32" cy="48" rx="18" ry="14" fill="var(--brand-purple)" opacity="0.25"/>
    </svg>`,
  );

function pickString(...values: unknown[]): string {
  for (const value of values) {
    const text = value != null ? String(value).trim() : '';
    if (text) return text;
  }
  return '';
}

const customerNavLinks = [
  { path: '/', icon: Home, label: 'หน้าแรก' },
  { path: '/factory-ideas-hub', icon: Lightbulb, label: 'แนะนำโรงงาน' },
  { path: '/orders', icon: ClipboardList, label: 'คำขอราคา & คำสั่งงาน' },
  { path: '/messages', icon: MessageCircle, label: 'ข้อความ' },
];

const sidebarTheme = {
  activeText: 'var(--brand-purple)',
  inactiveText: 'var(--neutral-subtle)',
  activeBg: 'rgba(162,56,255,0.08)',
  softBorder: 'rgba(162,56,255,0.14)',
  mutedPurple: 'var(--brand-muted-purple)',
} as const;

function RoleSwitcher({ isFactory }: { isFactory: boolean }) {
  const navigate = useNavigate();
  const switchRole = useAuthStore((s) => s.switchRole);
  const [roles, setRoles] = React.useState<string[]>([]);
  const [switching, setSwitching] = React.useState(false);
  const loaded = React.useRef(false);

  React.useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    getAvailableRoles()
      .then((r) => setRoles(r.roles))
      .catch(() => {});
  }, []);

  // Only show if user has both CT and FT
  if (!roles.includes('CT') || !roles.includes('FT')) return null;

  const targetRole = isFactory ? 'CT' : 'FT';
  const targetLabel = isFactory ? 'ลูกค้า' : 'โรงงาน';
  const TargetIcon = isFactory ? User : Factory;

  const handleSwitch = async () => {
    setSwitching(true);
    try {
      await switchRole(targetRole);
      navigate(targetRole === 'FT' ? '/factory' : '/', { replace: true });
      window.location.reload();
    } catch {
      setSwitching(false);
    }
  };

  return (
    <div className='mx-3 mb-2'>
      <Button
        variant='unstyled'
        type='button'
        disabled={switching}
        onClick={() => void handleSwitch()}
        className='flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed text-xs font-medium transition-all hover:bg-[var(--brand-panel-hover)] hover:text-brand-purple active:scale-[0.99]'
        style={{
          borderColor: isFactory ? sidebarTheme.softBorder : 'var(--neutral-border)',
          color: sidebarTheme.mutedPurple,
        }}
      >
        {switching ? (
          <Loader2 size={15} className='animate-spin shrink-0' />
        ) : (
          <ArrowLeftRight size={15} className='shrink-0' />
        )}
        <span className='flex-1 text-left'>
          สลับเป็นบัญชี<strong>{targetLabel}</strong>
        </span>
        <TargetIcon size={15} className='shrink-0 opacity-60' />
      </Button>
    </div>
  );
}

export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = useData(useShallow((s) => ({ currentUser: s.currentUser })));
  const { user: authUser, isAuthenticated } = useAuth();
  const currentUser = data.currentUser;
  const isFactory = isFactoryRole(authUser);
  const factoryApproved = factoryVerifyStatus(authUser) === 'AP';
  const { isEscrow } = usePaymentConfig();
  const factoryNavItems = filterFactoryNavByPaymentMode(FACTORY_SIDEBAR_NAV, isEscrow);
  const { open: openLoginModal } = useAuthModalStore();

  const isActivePath = (path: string) => isCustomerNavLinkActive(location.pathname, path);

  const unreadMessages = useConversationUnreadCount();
  const unreadNotifications = useNotificationUnreadCount(isAuthenticated);
  const { data: rfqListResult } = useRfqListQuery();
  const factoryProfileQ = useQuery({
    queryKey: profileInitKey,
    enabled: isAuthenticated && isFactory,
    queryFn: () =>
      httpClient.get<{
        factory?: Record<string, unknown> | null;
      }>('/factories/me/profile-init'),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const rfqList = rfqListResult?.rfqs ?? [];
  const activeRfqCount = rfqList.filter(
    (r) =>
      r.status !== 'completed' &&
      r.status !== 'cancelled' &&
      r.status !== 'expired' &&
      r.status !== 'closed',
  ).length;

  const avatarFromApi = [currentUser?.avatar, authUser?.avatar]
    .map((v) => (v != null ? String(v).trim() : ''))
    .find(Boolean);
  const factoryRow = factoryProfileQ.data?.factory;
  const factoryAvatarFromProfile = pickString(
    factoryRow?.image_url,
    factoryRow?.image,
    factoryRow?.logo_url,
  );
  const avatarSrc = isFactory
    ? factoryAvatarFromProfile || avatarFromApi || DEFAULT_USER_AVATAR_SRC
    : resolveCustomerAvatarSrc(currentUser?.id ?? authUser?.id, 96);

  return (
    <aside className='hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-40'>
      <div className='flex items-center h-16 px-5 border-b border-gray-100 shrink-0'>
        <Link to='/' className='flex items-center w-full'>
          <Image
            src='/assets/tryly-logo.png'
            alt='Tryly'
            className='h-20 w-auto shrink-0 object-contain -ml-[10px]'
          />
        </Link>
      </div>

      <nav className='flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto' aria-label='เมนูหลัก'>
        {isFactory
          ? factoryNavItems.map((item) => {
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
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm transition-all duration-150 hover:bg-slate-50 ${
                    locked ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                  style={{
                    color: active ? sidebarTheme.activeText : sidebarTheme.inactiveText,
                    background: active ? sidebarTheme.activeBg : 'transparent',
                    fontWeight: active ? 600 : 500,
                  }}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  <span className='flex-1 text-left'>{item.label}</span>
                  {locked ? (
                    <Lock
                      size={16}
                      className='shrink-0 text-brand-muted-purple'
                      strokeWidth={2}
                      aria-hidden
                    />
                  ) : null}
                  {item.badge === 'unread-messages' && unreadMessages > 0 ? (
                    <span
                      className='w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center'
                      style={{ background: 'var(--brand-orange)' }}
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
                <Button
                  variant='unstyled'
                  key={path}
                  type='button'
                  onClick={() => navigate(path)}
                  className='flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm transition-all duration-150'
                  style={{
                    color: active ? 'var(--brand-purple)' : 'var(--neutral-subtle)',
                    background: active ? 'rgba(162,56,255,0.08)' : 'transparent',
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  <span className='flex-1 text-left'>{label}</span>
                  {path === '/messages' && unreadMessages > 0 ? (
                    <span
                      className='w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center'
                      style={{ background: 'var(--brand-orange)' }}
                    >
                      {unreadMessages}
                    </span>
                  ) : null}
                  {path === '/orders' && activeRfqCount > 0 ? (
                    <span
                      className='w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center'
                      style={
                        active
                          ? { background: 'var(--brand-purple)', color: 'white' }
                          : { background: 'var(--neutral-muted)', color: 'var(--neutral-subtle)' }
                      }
                    >
                      {activeRfqCount}
                    </span>
                  ) : null}
                </Button>
              );
            })}
      </nav>

      {!isFactory ? (
        <div className='space-y-2.5 px-3 pb-3'>
          
          {!isAuthenticated ? (
            <div
              className='relative w-full overflow-hidden rounded-xl border p-3.5'
              style={{
                background: 'var(--brand-panel-hover)',
                borderColor: 'rgba(162,56,255,0.20)',
              }}
            >
              <div
                className='pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl'
                style={{ background: 'rgba(162,56,255,0.10)' }}
              />
              <div className='relative'>
                <div className='mb-1.5 flex items-center gap-1.5'>
                  <UserPlus size={13} style={{ color: 'var(--brand-orange)' }} />
                  <span className='text-[11px] font-medium text-gray-500'>สมาชิกใหม่</span>
                </div>
                <p
                  className='mb-0.5 text-sm font-bold leading-snug'
                  style={{ color: 'var(--brand-navy-deep)' }}
                >
                  เริ่มต้นใช้งานฟรี
                </p>
                <p className='mb-3 text-[10px] leading-relaxed text-gray-500'>
                  สมัครเพื่อติดตามงาน และแชทกับโรงงาน
                </p>
                <div className='flex gap-2'>
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => openLoginModal()}
                    className='flex-1 rounded-lg border border-brand-purple/25 bg-white px-2 py-2 text-[11px] font-semibold transition-colors hover:bg-brand-lavender-muted/40'
                    style={{ color: 'var(--brand-purple)' }}
                  >
                    เข้าสู่ระบบ
                  </Button>
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => navigate('/register')}
                    className='flex-1 rounded-lg bg-brand-purple px-2 py-2 text-[11px] font-semibold text-white shadow-[0_2px_8px_rgba(162,56,255,0.18)] transition-colors hover:bg-brand-violet-deep'
                  >
                    สมัครสมาชิก
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <Button
            variant='unstyled'
            type='button'
            data-tour='create-rfq-cta'
            onClick={() => navigate('/create-rfq')}
            className={createRfqCtaSidebarClass}
          >
            <Plus
              size={18}
              className='text-white/90 transition-transform duration-200 group-hover:rotate-90'
            />
            <span>สร้าง RFQ</span>
            <span
              aria-hidden
              className='pointer-events-none absolute inset-0 rounded-xl bg-white/0 transition-colors group-hover:bg-white/10'
            />
          </Button>
        </div>
      ) : null}

      {/* Role switcher — shown when user has both CT and FT profiles */}
      {isAuthenticated && <RoleSwitcher isFactory={isFactory} />}

      <div className='border-t border-gray-100 px-3 py-3 shrink-0'>
        {isAuthenticated ? (
          <div className='flex items-center gap-2'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate('/profile')}
              className='flex items-center gap-2.5 flex-1 min-w-0 p-2 rounded-xl hover:bg-[var(--brand-panel-hover)] transition-colors'
            >
              <span className='relative block w-8 h-8 rounded-xl overflow-hidden shrink-0 bg-brand-lavender-muted'>
                <Image
                  src={avatarSrc}
                  alt={currentUser?.name ?? 'โปรไฟล์'}
                  className='absolute inset-0 w-full h-full object-cover object-center'
                />
              </span>
              <div className='flex-1 text-left min-w-0'>
                <p
                  className='text-xs font-semibold truncate'
                  style={{ color: 'var(--brand-navy-deep)' }}
                >
                  {currentUser?.name}
                </p>
                <p className='text-[10px] text-gray-400 truncate'>{currentUser?.company}</p>
              </div>
            </Button>
            <Link
              to='/notifications'
              className='relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--brand-panel-hover)] transition-colors shrink-0'
            >
              <Bell size={17} style={{ color: 'var(--brand-purple)' }} />
              {unreadNotifications > 0 ? (
                <span
                  className='absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9px] flex items-center justify-center font-bold border-2 border-white tabular-nums'
                  style={{ background: 'var(--brand-orange)' }}
                >
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              ) : null}
            </Link>
          </div>
        ) : (
          <div className='flex items-center gap-2 p-2 rounded-xl bg-gray-50'>
            <span className='relative block w-8 h-8 rounded-xl overflow-hidden shrink-0 bg-brand-lavender-muted'>
              <Image
                src={DEFAULT_USER_AVATAR_SRC}
                alt='Guest View'
                className='absolute inset-0 w-full h-full object-cover object-center'
              />
            </span>
            <div className='flex-1 min-w-0'>
              <p
                className='text-xs font-semibold truncate'
                style={{ color: 'var(--brand-navy-deep)' }}
              >
                Guest View
              </p>
              <p className='text-[10px] text-gray-400 truncate'>
                ดูข้อมูลได้โดยยังไม่ต้องเข้าสู่ระบบ
              </p>
            </div>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => openLoginModal()}
              className='text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-brand-purple/25 bg-white'
              style={{ color: 'var(--brand-purple)' }}
            >
              Login
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
