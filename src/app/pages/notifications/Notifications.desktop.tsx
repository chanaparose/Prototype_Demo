import React from 'react';
import { NotificationsMobile } from './Notifications.mobile';

export function NotificationsDesktop() {
  return (
    <div className="hidden lg:block">
      <div className="max-w-4xl mx-auto px-6">
        <NotificationsMobile />
      </div>
    </div>
  );
}

