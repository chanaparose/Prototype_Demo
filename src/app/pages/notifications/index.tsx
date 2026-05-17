import React from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { NotificationsMobile } from '@/pages/notifications/Notifications.mobile.tsx';
import { NotificationsDesktop } from '@/pages/notifications/Notifications.desktop.tsx';

export function Notifications() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <NotificationsDesktop /> : <NotificationsMobile />;
}
