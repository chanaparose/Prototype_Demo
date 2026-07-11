import { removeToken } from '@/services/api/tokenManager';

/**
 * Centralized auth-expiry handling.
 *
 * The transport layer (httpClient) must not decide how the app navigates. It
 * only reports "the session is no longer valid" by calling `notifyAuthExpired`.
 * A single handler here decides what that means. By default it clears the token
 * and hard-redirects to /login (preserving previous behavior), but the app can
 * override it — e.g. to do a soft, router-based redirect that keeps SPA state.
 */

export type AuthExpiredHandler = () => void;

function defaultHandler(): void {
  removeToken();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

let handler: AuthExpiredHandler = defaultHandler;

/** Register a custom auth-expiry handler (e.g. router-based redirect). */
export function setAuthExpiredHandler(next: AuthExpiredHandler): void {
  handler = next;
}

/** Reset to the default hard-redirect handler. */
export function resetAuthExpiredHandler(): void {
  handler = defaultHandler;
}

let notifying = false;

/**
 * Report that the current session is invalid. Guarded so that a burst of
 * concurrent 401s (many in-flight requests failing at once) triggers the
 * handler only once instead of racing multiple redirects.
 */
export function notifyAuthExpired(): void {
  if (notifying) return;
  notifying = true;
  try {
    handler();
  } finally {
    // Allow a later, genuinely new expiry to fire again.
    setTimeout(() => {
      notifying = false;
    }, 1000);
  }
}
