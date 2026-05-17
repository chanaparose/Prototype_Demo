import { useState, useCallback } from 'react';

interface UseAsyncFormSubmitReturn {
  isSubmitting: boolean;
  error: Error | null;
  success: boolean;
  submit: <T>(data: T) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

export function useAsyncFormSubmit<T = any>(
  onSubmit: (data: T) => Promise<void>,
): UseAsyncFormSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(
    async (data: T) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      try {
        await onSubmit(data);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Submit failed'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit],
  );

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
    setSuccess(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSubmitting,
    error,
    success,
    submit,
    reset,
    clearError,
  };
}
