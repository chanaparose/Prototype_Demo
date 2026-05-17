import React from 'react';
import { ProfileMobile } from '@/pages/profile/Profile.mobile';

export function ProfileDesktop() {
  return (
    <div className='hidden lg:block'>
      <div className='max-w-4xl mx-auto px-6'>
        <ProfileMobile />
      </div>
    </div>
  );
}
