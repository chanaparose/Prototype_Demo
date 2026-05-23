import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/stores/useAuthStore';
import type {
  AuthLoginFormValues,
  AuthRegisterFormValues,
} from '@/domain/auth/schemas/authForm.schema';
import { getErrorMessage } from '@/lib/apiError';

function navigateByRole(navigate: ReturnType<typeof useNavigate>, role?: string) {
  navigate(String(role ?? '').toUpperCase() === 'FT' ? '/factory' : '/', { replace: true });
}

export function useLoginSubmission() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitLogin = useCallback(
    async (values: AuthLoginFormValues): Promise<boolean> => {
      setIsSubmitting(true);
      setError('');
      try {
        const session = await login(values);
        navigateByRole(navigate, session?.user?.role);
        return true;
      } catch (err) {
        setError(getErrorMessage(err, 'เข้าสู่ระบบไม่สำเร็จ'));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [login, navigate],
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
        navigateByRole(navigate, session?.user?.role);
        return true;
      } catch (err) {
        setError(getErrorMessage(err, 'สมัครสมาชิกไม่สำเร็จ'));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [register, navigate],
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
