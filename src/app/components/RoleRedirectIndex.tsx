import { Navigate } from 'react-router';
import { useAuth } from '@/stores/useAuthStore';
import { Explore } from '@/pages/explore';

/**
 * Index route component that redirects FT users to /factory
 * and renders the Explore page for everyone else (CT / guest).
 */
export function RoleRedirectIndex() {
  const { user, isAuthenticated } = useAuth();
  const role = String(user?.role ?? '').toUpperCase();

  if (isAuthenticated && role === 'FT') {
    return <Navigate to='/factory' replace />;
  }

  return <Explore />;
}
