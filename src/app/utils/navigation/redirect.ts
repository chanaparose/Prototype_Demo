export function redirectTo(url: string) {
  if (typeof window === 'undefined') return;
  window.location.assign(url);
}

export function redirectToLogin() {
  redirectTo('/login');
}

export function getCurrentHref() {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}
