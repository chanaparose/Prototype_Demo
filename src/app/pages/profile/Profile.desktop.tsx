import React from 'react';
import { ProfileMobile } from '@/pages/profile/Profile.mobile';

export function ProfileDesktop() {
  return (
    <div className='hidden lg:block'>
      <ProfileMobile />
    </div>
  );
}
