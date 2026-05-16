import { useState, useCallback } from 'react';

interface UseModalReturn {
  isOpen: boolean;
  isLoading: boolean;
  openModal: () => void;
  closeModal: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Manage modal state with loading state
 * Useful for modals with async operations
 */
export function useModal(initialIsOpen = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isLoading, setIsLoading] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
    setIsLoading(false);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return { isOpen, isLoading, openModal, closeModal, setLoading };
}
