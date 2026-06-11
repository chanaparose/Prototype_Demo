import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Home,
  ClipboardList,
  MessageCircle,
  User,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@lib/utils';
import {
  isFactorySidebarNavActive,
  type FactorySidebarNavItem,
} from '@/components/layout/factoryGlobalNavConfig';
import { MOBILE_BOTTOM_NAV_COMPACT_SCALE } from '@/hooks/useMobileBottomNavHide';

type MobileBottomNavProps = {
  compact: boolean;
  isFactory: boolean;
  factoryApproved: boolean;
  factoryBottomLinks: FactorySidebarNavItem[];
  unreadMessages: number;
  brandActive: string;
  isAuthenticated: boolean;
  onProfileGuest: () => void;
};

function NavItem({
  icon: Icon,
  label,
  active,
  brandActive,
  badge,
  disabled,
  onClick,
  activeBgClass,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  brandActive: string;
  badge?: number;
  disabled?: boolean;
  onClick: () => void;
  activeBgClass: string;
}) {
  return (
    <button
      type='button'
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 transition-colors active:scale-95 disabled:opacity-40',
        active ? activeBgClass : 'hover:bg-gray-50/80',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <div className='relative'>
        <Icon
          size={20}
          strokeWidth={active ? 2.4 : 1.8}
          style={{ color: active ? brandActive : '#94A3B8' }}
        />
        {badge != null && badge > 0 ? (
          <span
            className='absolute -right-2 -top-1.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full border border-white px-0.5 text-[7px] font-bold tabular-nums text-white'
            style={{ background: 'var(--brand-orange)' }}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </div>
      <span
        className='max-w-full truncate px-0.5 text-[9px] font-semibold leading-tight'
        style={{ color: active ? brandActive : '#94A3B8' }}
      >
        {label}
      </span>
    </button>
  );
}

const customerNavLinks = [
  { path: '/', icon: Home, label: 'หน้าแรก' },
  { path: '/factory-ideas', icon: Lightbulb, label: 'แนะนำ' },
  { path: '/orders', icon: ClipboardList, label: 'คำสั่งงาน' },
  { path: '/messages', icon: MessageCircle, label: 'ข้อความ' },
  { path: '/profile', icon: User, label: 'โปรไฟล์' },
] as const;

export function MobileBottomNav({
  compact,
  isFactory,
  factoryApproved,
  factoryBottomLinks,
  unreadMessages,
  brandActive,
  isAuthenticated,
  onProfileGuest,
}: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const go = (path: string) => void navigate(path);
  const activeBgClass = isFactory ? 'bg-indigo-50/90' : 'bg-violet-50/90';

  return (
    <nav
      className='lg:hidden fixed inset-x-3 z-50 transition-[transform,opacity] duration-300 ease-out'
      style={{
        bottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
        transform: compact ? `scale(${MOBILE_BOTTOM_NAV_COMPACT_SCALE})` : 'scale(1)',
        transformOrigin: 'bottom center',
        opacity: compact ? 0.94 : 1,
      }}
      aria-label='เมนูหลัก'
    >
      <div className='flex items-stretch rounded-[1.25rem] border border-white/80 bg-white/78 px-1 py-1.5 shadow-[0_8px_32px_rgba(46,34,82,0.12)] backdrop-blur-2xl'>
        {isFactory
          ? factoryBottomLinks.map((item) => {
              const active = isFactorySidebarNavActive(location.pathname, item);
              const locked = Boolean(item.requiresApproval && !factoryApproved);
              const badge = item.key === 'messages' ? unreadMessages : undefined;
              return (
                <NavItem
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  active={active}
                  brandActive={brandActive}
                  badge={badge}
                  disabled={locked}
                  activeBgClass={activeBgClass}
                  onClick={() => {
                    if (locked) return;
                    void navigate(item.href);
                  }}
                />
              );
            })
          : customerNavLinks.map(({ path, icon, label }) => (
              <NavItem
                key={path}
                icon={icon}
                label={label}
                active={isActive(path)}
                brandActive={brandActive}
                badge={path === '/messages' ? unreadMessages : undefined}
                activeBgClass={activeBgClass}
                onClick={() => {
                  if (path === '/profile' && !isAuthenticated) {
                    onProfileGuest();
                    return;
                  }
                  go(path);
                }}
              />
            ))}
      </div>
    </nav>
  );
}
