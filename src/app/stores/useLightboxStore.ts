import { create } from 'zustand';

interface LightboxState {
  url: string | null;
  open: (url: string) => void;
  close: () => void;
}

export const useLightboxStore = create<LightboxState>((set) => ({
  url: null,
  open: (url) => set({ url }),
  close: () => set({ url: null }),
}));

/** Convenience helper — call this anywhere instead of window.open */
export function openImageLightbox(url: string) {
  useLightboxStore.getState().open(url);
}
