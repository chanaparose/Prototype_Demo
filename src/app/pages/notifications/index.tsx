import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { NotificationsMobile } from './Notifications.mobile.tsx';
import { NotificationsDesktop } from './Notifications.desktop.tsx';

export function Notifications() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <NotificationsDesktop /> : <NotificationsMobile />;
}

