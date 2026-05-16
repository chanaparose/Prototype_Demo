/**
 * Auth API Types
 */

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterCustomerPayload = {
  role: 'CT';
  email: string;
  phone: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type RegisterFactoryPayload = {
  role: 'FT';
  email: string;
  phone: string;
  password: string;
  factory_name: string;
  factory_type_id: number;
  tax_id: string;
};

export type AuthResponse = {
  token: string;
  user: Record<string, unknown>;
  /** Present when registering as factory (role FT). */
  factory?: Record<string, unknown>;
};

export type ForgotPasswordResponse = {
  message: string;
  reset_token?: string;
};
