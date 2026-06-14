import React from 'react';
import { ProfileMobile } from '@/pages/profile/Profile.mobile';

export function ProfileDesktop() {
  return (
    <div className='hidden min-h-[calc(100vh-4rem)] flex-col bg-[var(--brand-page)] lg:flex'>
      <ProfileMobile />
    </div>
  );
}
