import { create } from 'zustand';

interface AuthModalState {
  isOpen: boolean;
  pendingRedirect: string | null;
  open: (redirectTo?: string) => void;
  close: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  pendingRedirect: null,
  open: (redirectTo) => set({ isOpen: true, pendingRedirect: redirectTo ?? null }),
  close: () => set({ isOpen: false, pendingRedirect: null }),
}));
