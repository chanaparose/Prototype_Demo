import React, { useEffect, useRef } from 'react';
import { Bell, ChevronLeft, Search } from 'lucide-react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useAuth } from '@/stores/useAuthStore';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
import { useLocation, useNavigate } from 'react-router';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { NotificationsMobile } from '@/pages/notifications/Notifications.mobile';
import { NotificationsDesktop } from '@/pages/notifications/Notifications.desktop';

const NOTIFICATION_TABS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'rfq', label: 'RFQ' },
  { key: 'order', label: 'Order' },
];

export function Notifications() {
  const isDesktop = useIsDesktop();
  const { isAuthenticated, isLoading } = useAuth();
  const { open: openModal } = useAuthModalStore();
  const location = useLocation();
  const navigate = useNavigate();
  const modalShown = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !modalShown.current) {
      modalShown.current = true;
      openModal(location.pathname + location.search);
    }
  }, [isAuthenticated, isLoading, openModal, location.pathname, location.search]);

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <div className='flex min-h-screen flex-col bg-white pb-20'>
        {/* Header — identical to logged-in */}
        <div className='flex items-center justify-between gap-2 px-4 pb-2 pt-3'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate(-1)}
            className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-slate-50'
            aria-label='ย้อนกลับ'
          >
            <ChevronLeft size={20} strokeWidth={2.25} />
          </Button>
          <h1 className='truncate text-[14px] font-bold text-brand-navy-ink'>การแจ้งเตือน</h1>
          <div className='h-9 w-9 shrink-0' aria-hidden />
        </div>

        {/* Search + tabs — identical to logged-in (non-interactive) */}
        <div className='px-4 py-2'>
          <div className='relative mb-2.5'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              <Search className='h-4 w-4 text-gray-300' />
            </div>
            <input
              disabled
              className='block w-full rounded-lg border border-gray-100 bg-white py-2 pl-9 pr-3 text-[12px] text-gray-400 placeholder:text-gray-300'
              placeholder='ค้นหาการแจ้งเตือน...'
            />
          </div>

          <div className='mb-2.5 grid grid-cols-3 border-b border-slate-200'>
            {NOTIFICATION_TABS.map((t, i) => (
              <div
                key={t.key}
                className={`flex h-9 items-center justify-center text-[10px] font-semibold transition-colors ${
                  i === 0 ? 'text-brand-purple' : 'text-slate-400'
                }`}
              >
                {t.label}
                {i === 0 && (
                  <span className='absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand-purple' />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Empty state */}
        <div className='flex flex-1 flex-col items-center justify-center px-4'>
          <EmptyState
            title='ยังไม่มีการแจ้งเตือน'
            description='เข้าสู่ระบบเพื่อดูการแจ้งเตือนของคุณ'
            icon={
              <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-lavender)]'>
                <Bell size={26} className='text-[var(--brand-mauve)]' />
              </span>
            }
          />
        </div>
      </div>
    );
  }

  return isDesktop ? <NotificationsDesktop /> : <NotificationsMobile />;
}
