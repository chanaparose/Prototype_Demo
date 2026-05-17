import { useCallback, useState } from 'react';

function toErrorMessage(error: unknown, fallback = 'ดำเนินการไม่สำเร็จ') {
  return error instanceof Error ? error.message : fallback;
}

export type UseModalReturn = {
  isOpen: boolean;
  open: boolean;
  isLoading: boolean;
  error: string;
  openModal: () => void;
  closeModal: () => void;
  setOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
  runAsync: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
};

export function useModal(initialIsOpen = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const openModal = useCallback(() => {
    setError('');
    setIsOpen(true);
    setIsLoading(false);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
    setError('');
  }, []);

  const setOpen = useCallback((open: boolean) => {
    if (open) {
      openModal();
    } else {
      closeModal();
    }
  }, [closeModal, openModal]);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const runAsync = useCallback(async <T,>(fn: () => Promise<T>) => {
    setIsLoading(true);
    setError('');
    try {
      return await fn();
    } catch (err) {
      setError(toErrorMessage(err));
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isOpen,
    open: isOpen,
    isLoading,
    error,
    openModal,
    closeModal,
    setOpen,
    setLoading,
    setError,
    clearError,
    runAsync,
  };
}
