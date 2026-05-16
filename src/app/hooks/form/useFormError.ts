import { useState, useCallback } from 'react';

interface FieldErrors {
  [key: string]: string | undefined;
}

interface UseFormErrorReturn {
  errors: FieldErrors;
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  hasError: (field: string) => boolean;
  getError: (field: string) => string | undefined;
}

/**
 * Manage form field validation errors
 */
export function useFormError(initialErrors: FieldErrors = {}): UseFormErrorReturn {
  const [errors, setErrors] = useState<FieldErrors>(initialErrors);

  const setError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasError = useCallback((field: string) => {
    return !!errors[field];
  }, [errors]);

  const getError = useCallback((field: string) => {
    return errors[field];
  }, [errors]);

  return {
    errors,
    setError,
    clearError,
    clearAllErrors,
    hasError,
    getError,
  };
}
