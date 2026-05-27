/**
 * Token Management — Store, retrieve, and clear JWT tokens
 * Handles token expiration logic (2 hours)
 */

const TOKEN_ISSUED_AT_KEY = 'auth_token_issued_at';
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours — matches BE JWT expiry

function normalizeToken(raw: unknown): string {
  if (typeof raw !== 'string') return '';

  let trimmed = raw.trim();
  if (!trimmed) return '';

  // tolerate values like `"eyJ..."` or `'eyJ...'`
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  return trimmed.replace(/^Bearer\s+/i, '').trim();
}

export function getToken(): string | null {
  const raw = localStorage.getItem('auth_token');
  const normalized = normalizeToken(raw);

  if (!normalized) return null;

  const issuedAtRaw = localStorage.getItem(TOKEN_ISSUED_AT_KEY);
  const issuedAt = Number(issuedAtRaw ?? 0);

  if (Number.isFinite(issuedAt) && issuedAt > 0 && Date.now() - issuedAt > TOKEN_MAX_AGE_MS) {
    removeToken();
    try {
      sessionStorage.setItem('auth_token_expired', '1');
    } catch {
      // ignore storage availability issues
    }
    return null;
  }

  // Self-heal old/incorrect persisted values
  if (raw !== normalized) localStorage.setItem('auth_token', normalized);

  return normalized;
}

export function setToken(token: string) {
  const normalized = normalizeToken(token);
  if (!normalized) return;

  localStorage.setItem('auth_token', normalized);
  localStorage.setItem(TOKEN_ISSUED_AT_KEY, String(Date.now()));

  try {
    sessionStorage.setItem('auth_login_at', String(Date.now()));
    sessionStorage.removeItem('auth_token_expired');
  } catch {
    // ignore storage availability issues
  }
}

export function removeToken() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem(TOKEN_ISSUED_AT_KEY);

  try {
    sessionStorage.removeItem('auth_login_at');
  } catch {
    // ignore storage availability issues
  }
}
