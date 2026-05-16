/**
 * Auth Request Helper — Get authorization config for API requests
 */

import { getToken } from '@/services/api';

export interface AuthRequestConfig {
  headers: {
    Authorization?: string;
    'Content-Type': string;
    [key: string]: string | undefined;
  };
}

/**
 * Get authorization header for authenticated requests
 * Automatically includes JWT token if available
 */
export function getAuthHeader(): AuthRequestConfig['headers'] {
  const token = getToken();
  const headers: AuthRequestConfig['headers'] = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Get full auth request config
 */
export async function authedRequest(): Promise<AuthRequestConfig> {
  return {
    headers: getAuthHeader(),
  };
}

/**
 * Get authorization config for form data requests
 */
export function getFormAuthHeader(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}
