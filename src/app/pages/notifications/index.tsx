import React from 'react';
import { useResponsiveRender } from '@/hooks/useResponsiveRender';
import { NotificationsMobile } from '@/pages/notifications/Notifications.mobile.tsx';
import { NotificationsDesktop } from '@/pages/notifications/Notifications.desktop.tsx';

export function Notifications() {
  const { render } = useResponsiveRender();
  return render(<NotificationsMobile />, <NotificationsDesktop />);
}
