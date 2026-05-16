/**
 * Auth Request Types
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCustomerRequest {
  role: 'CT';
  email: string;
  phone: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface RegisterFactoryRequest {
  role: 'FT';
  email: string;
  phone: string;
  password: string;
  factory_name: string;
  factory_type_id: number;
  tax_id: string;
}

export type RegisterRequest = RegisterCustomerRequest | RegisterFactoryRequest;

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}
