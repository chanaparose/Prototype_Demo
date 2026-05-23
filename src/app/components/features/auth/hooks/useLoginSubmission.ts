import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/stores/useAuthStore';
import type {
  AuthLoginFormValues,
  AuthRegisterFormValues,
} from '@/domain/auth/schemas/authForm.schema';
import { runAsyncAction } from '@/utils/asyncAction';

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
      const result = await runAsyncAction(async () => {
        const session = await login(values);
        navigateByRole(navigate, session?.user?.role);
        return true;
      }, {
        onStart: () => {
          setIsSubmitting(true);
          setError('');
        },
        onError: (message) => setError(message),
        onSettled: () => setIsSubmitting(false),
        fallbackMessage: 'เข้าสู่ระบบไม่สำเร็จ',
      });
      return result ?? false;
    },
    [login, navigate],
  );

  const submitRegister = useCallback(
    async (values: AuthRegisterFormValues): Promise<boolean> => {
      const result = await runAsyncAction(async () => {
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
      }, {
        onStart: () => {
          setIsSubmitting(true);
          setError('');
        },
        onError: (message) => setError(message),
        onSettled: () => setIsSubmitting(false),
        fallbackMessage: 'สมัครสมาชิกไม่สำเร็จ',
      });
      return result ?? false;
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
