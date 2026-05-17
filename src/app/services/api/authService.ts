/**
 * Auth Service — Authentication API calls with mappers
 * Pattern: Request Type → API Call → Response → Mapper → Model
 */

import { httpClient } from '@/services/api/httpClient';
import { mapAuthResponse } from '@/services/mapper/response/auth';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/types/api/request/auth';
import { IAuthResponse } from '@/types/model';

/**
 * Login user with email and password
 */
export const loginUser = async (payload: LoginRequest): Promise<IAuthResponse> => {
  try {
    const res = await httpClient.post<{ data?: Record<string, unknown> }>('/auth/login', payload);

    if (!res?.data) {
      throw new Error('Failed to login');
    }

    return mapAuthResponse(res.data as any);
  } catch (error) {
    throw error;
  }
};

/**
 * Register new user (customer or factory)
 */
export const registerUser = async (payload: RegisterRequest): Promise<IAuthResponse> => {
  try {
    const res = await httpClient.post<{ data?: Record<string, unknown> }>(
      '/auth/register',
      payload,
    );

    if (!res?.data) {
      throw new Error('Failed to register');
    }

    return mapAuthResponse(res.data as any);
  } catch (error) {
    throw error;
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (
  payload: ForgotPasswordRequest,
): Promise<{ message: string }> => {
  try {
    const res = await httpClient.post<{ message: string }>('/auth/forgot-password', payload);

    if (!res?.message) {
      throw new Error('Failed to send reset email');
    }

    return {
      message: res.message || 'Reset email sent successfully',
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  payload: ResetPasswordRequest,
): Promise<{ message: string }> => {
  try {
    const res = await httpClient.post<{ message?: string }>('/auth/reset-password', payload);

    return {
      message: res?.message || 'Password reset successfully',
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get current user (authenticated endpoint)
 */
export const getCurrentUser = async (): Promise<IAuthResponse> => {
  try {
    const res = await httpClient.get<Record<string, unknown>>('/auth/me');

    if (!res) {
      throw new Error('Failed to fetch current user');
    }

    return mapAuthResponse(res as any);
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await httpClient.post<void>('/auth/logout', {});
  } catch (error) {
    console.error('Logout error:', error);
  }
};
