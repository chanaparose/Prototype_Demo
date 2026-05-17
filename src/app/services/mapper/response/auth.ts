/**
 * Auth Response Mappers — Transform auth API responses to models
 */

import { IUser, IAuthResponse } from '@/types/model';
import { createMapper } from '@/services/mapper/response/index';

/**
 * Raw user data from API
 */
interface UserResponse {
  user_id?: number | string;
  id?: string | number;
  email: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  display_name?: string;
  displayName?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string;
  createdAt?: string;
  [key: string]: unknown;
}

/**
 * Raw auth response from API
 */
interface AuthResponseRaw {
  token: string;
  expires_in?: number;
  expiresIn?: number;
  type?: string;
  user: UserResponse;
  factory?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Map API user response to model
 */
export const mapUserResponse = createMapper<UserResponse, IUser>((data) => ({
  id: data.user_id || data.id || '',
  email: data.email || '',
  firstName: data.first_name || data.firstName || '',
  lastName: data.last_name || data.lastName || '',
  displayName: data.display_name || data.displayName || '',
  phone: data.phone,
  role: (data.role?.toUpperCase() || 'CT') as 'CT' | 'FT' | 'AD',
  isActive: data.is_active ?? data.isActive ?? true,
  createdAt: data.created_at || data.createdAt || new Date().toISOString(),
}));

/**
 * Map API auth response to model
 */
export const mapAuthResponse = createMapper<AuthResponseRaw, IAuthResponse>((data) => {
  // Handle both nested user object and flat response
  const user = data.user || (data as any);

  return {
    user: mapUserResponse(user),
    token: {
      token: data.token || '',
      expiresIn: data.expires_in || data.expiresIn,
      type: data.type || 'Bearer',
    },
  };
});
