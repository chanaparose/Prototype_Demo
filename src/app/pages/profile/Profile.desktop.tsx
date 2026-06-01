import React from 'react';
import { ProfileMobile } from '@/pages/profile/Profile.mobile';

export function ProfileDesktop() {
  return (
    <div className='hidden lg:flex flex-col min-h-[calc(100vh-4rem)] bg-white'>
      <ProfileMobile />
    </div>
  );
}
