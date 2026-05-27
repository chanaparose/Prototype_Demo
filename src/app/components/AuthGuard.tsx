import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/stores/useAuthStore';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
import { isTourActive, subscribeTourActive } from '@/utils/tourMocks';
import { useState } from 'react';

export function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { open: openModal } = useAuthModalStore();

  const [tourOn, setTourOn] = useState<boolean>(isTourActive());
  useEffect(() => subscribeTourActive(setTourOn), []);

  // Open the login modal when unauthenticated (instead of hard redirect)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !tourOn) {
      openModal(location.pathname + location.search);
    }
  }, [isAuthenticated, isLoading, tourOn, openModal, location.pathname, location.search]);

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

  // Admin routes don't have Layout (no LoginModal mounted there), so keep hard redirect
  const isAdminPath = location.pathname.startsWith('/admin');
  if (!isAuthenticated && !tourOn && isAdminPath) {
    return <Navigate to='/login' replace />;
  }

  // For non-admin protected routes: render nothing — the modal opens via useEffect above
  if (!isAuthenticated && !tourOn) {
    return null;
  }

  return <Outlet />;
}
