/**
 * Auth API — Login, Register, Password Reset
 */

import { httpClient } from './httpClient';
import type {
  LoginPayload,
  RegisterCustomerPayload,
  RegisterFactoryPayload,
  AuthResponse,
  ForgotPasswordResponse,
} from './types';

export const authApi = {
  login: (payload: LoginPayload) => httpClient.post<AuthResponse>('/auth/login', payload),

  register: (payload: RegisterCustomerPayload | RegisterFactoryPayload) =>
    httpClient.post<AuthResponse>('/auth/register', payload),

  forgotPassword: (email: string) =>
    httpClient.post<ForgotPasswordResponse>('/auth/forgot-password', { email }),

  resetPassword: (token: string, new_password: string) =>
    httpClient.post<void>('/auth/reset-password', { token, new_password }),
};
