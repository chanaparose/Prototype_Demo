export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterCustomerRequest {
  role: 'CT';
  email: string;
  phone: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface IRegisterFactoryRequest {
  role: 'FT';
  email: string;
  phone: string;
  password: string;
  factory_name: string;
  factory_type_id: number;
  tax_id: string;
}

export interface IAuthResponse {
  token: string;
  user: Record<string, unknown>;
  factory?: Record<string, unknown>;
}
