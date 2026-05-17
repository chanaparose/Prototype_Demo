import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/stores/useAuthStore';
import { isTourActive, subscribeTourActive } from '@/utils/tourMocks';

export function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  // While the ProductTour is walking the user through protected routes

  // see the demo. Mocks installed by the tour provide canned data.
  const [tourOn, setTourOn] = useState<boolean>(isTourActive());
  useEffect(() => subscribeTourActive(setTourOn), []);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='flex flex-col items-center gap-3'>
          <div
            className='w-10 h-10 border-3 border-t-transparent rounded-full animate-spin'
            style={{ borderColor: 'var(--brand-royal)', borderTopColor: 'transparent' }}
          />
          <p className='text-sm text-gray-500'>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !tourOn) {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
}
