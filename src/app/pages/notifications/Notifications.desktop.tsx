import React from 'react';
import { NotificationsMobile } from '@/pages/notifications/Notifications.mobile';

export function NotificationsDesktop() {
  return (
    <div className='hidden lg:block'>
      <div className='mx-auto max-w-[1600px] px-6 2xl:px-10'>
        <NotificationsMobile />
      </div>
    </div>
  );
}
