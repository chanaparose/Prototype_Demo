import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/stores/useAuthStore';
import { isFactoryRole } from '@/utils/factoryUser';

export function FactoryRoleGuard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='min-h-[40vh] flex items-center justify-center'>
        <div
          className='w-10 h-10 border-3 border-t-transparent rounded-full animate-spin'
          style={{ borderColor: 'var(--brand-royal)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!isFactoryRole(user)) {
    return <Navigate to='/' replace />;
  }

  return <Outlet />;
}
