import React from 'react';
import { ProfileMobile } from '@/pages/profile/Profile.mobile';

export function ProfileDesktop() {
  return (
    <div className='hidden lg:flex flex-col min-h-[calc(100vh-4rem)] bg-gray-50'>
      <div className='flex-1 px-6 py-6 overflow-auto'>
        <div className='max-w-5xl mx-auto'>
          <ProfileMobile />
        </div>
      </div>
    </div>
  );
}
