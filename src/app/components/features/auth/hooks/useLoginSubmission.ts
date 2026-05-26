import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@/stores/useAuthStore';
import type {
  AuthLoginFormValues,
  AuthRegisterFormValues,
} from '@/domain/auth/schemas/authForm.schema';
import { getErrorMessage } from '@/lib/apiError';

function navigateAfterLogin(
  navigate: ReturnType<typeof useNavigate>,
  role?: string,
  redirectTo?: string,
) {
  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    navigate(redirectTo, { replace: true });
    return;
  }
  navigate(String(role ?? '').toUpperCase() === 'FT' ? '/factory' : '/', { replace: true });
}

export function useLoginSubmission() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? undefined;
  const { login, register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitLogin = useCallback(
    async (values: AuthLoginFormValues): Promise<boolean> => {
      setIsSubmitting(true);
      setError('');
      try {
        const session = await login(values);
        navigateAfterLogin(navigate, session?.user?.role, redirectTo);
        return true;
      } catch (err) {
        setError(getErrorMessage(err, 'เข้าสู่ระบบไม่สำเร็จ'));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [login, navigate, redirectTo],
  );

  const submitRegister = useCallback(
    async (values: AuthRegisterFormValues): Promise<boolean> => {
      setIsSubmitting(true);
      setError('');
      try {
        const session = await register({
          role: 'CT',
          email: values.email,
          phone: values.phone,
          password: values.password,
          first_name: values.first_name,
          last_name: values.last_name,
        });
        navigateAfterLogin(navigate, session?.user?.role, redirectTo);
        return true;
      } catch (err) {
        setError(getErrorMessage(err, 'สมัครสมาชิกไม่สำเร็จ'));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [register, navigate, redirectTo],
  );

  const clearError = useCallback(() => setError(''), []);

  return {
    submitLogin,
    submitRegister,
    isSubmitting,
    error,
    clearError,
  };
}
