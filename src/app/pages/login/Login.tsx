/**
 * /login route — redirects to home and opens the login modal.
 * The modal is now the primary login UI (mounted inside Layout).
 */
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthModalStore } from '@/stores/useAuthModalStore';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { open } = useAuthModalStore();

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    // Open modal with any pending redirect, then navigate to home
    open(redirect ?? undefined);
    void navigate('/', { replace: true });
  }, []); // run once on mount

  return null;
}
