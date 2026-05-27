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
  province_id?: number;
  category_ids?: number[];
  sub_category_ids?: number[];
  // Cert fields (optional — skipped by backend if cert_id == 0 or document_url == "")
  cert_id?: number;
  document_url?: string;
  cert_number?: string;
  cert_expire_date?: string;
  // Address fields — creates a default address row
  address_detail?: string;
  sub_district_id?: number;
  district_id?: number;
  zip_code?: string;
}

export interface IAuthResponse {
  token: string;
  user: Record<string, unknown>;
  factory?: Record<string, unknown>;
}
