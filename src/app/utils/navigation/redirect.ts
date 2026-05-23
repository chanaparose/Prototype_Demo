import { APP_ROUTES } from '@/constants/routes';

export function redirectTo(url: string) {
  if (typeof window === 'undefined') return;
  window.location.assign(url);
}

export function redirectToLogin() {
  redirectTo(APP_ROUTES.login);
}

export function getCurrentHref() {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}
