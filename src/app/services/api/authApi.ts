import { httpClient } from '@/services/api/httpClient';
import type {
  IAuthResponse,
  ILoginRequest,
  IRegisterCustomerRequest,
  IRegisterFactoryRequest,
} from '@/services/api/types/auth.types';

export function postLogin(request: ILoginRequest) {
  return httpClient.post<IAuthResponse>('/auth/login', request);
}

export function postRegister(request: IRegisterCustomerRequest | IRegisterFactoryRequest) {
  return httpClient.post<IAuthResponse>('/auth/register', request);
}

export type EmailCheckResult =
  | { exists: false; role: null; has_factory?: false; has_customer?: false }
  | { exists: true; role: string; has_factory?: boolean; has_customer?: boolean };

export async function checkEmail(email: string): Promise<EmailCheckResult> {
  const result = await httpClient.get<EmailCheckResult>(
    `/auth/email-check?email=${encodeURIComponent(email)}`,
  );
  return result;
}

export function postUpgradeToFactory(
  request: Omit<IRegisterFactoryRequest, 'role' | 'email' | 'phone' | 'password'>,
) {
  return httpClient.post<IAuthResponse>('/auth/upgrade-to-factory', request);
}

export function postUpgradeToCustomer(request: { first_name: string; last_name: string }) {
  return httpClient.post<IAuthResponse>('/auth/upgrade-to-customer', request);
}

export function postSwitchRole(role: string) {
  return httpClient.post<IAuthResponse>('/auth/switch-role', { role });
}

export function getAvailableRoles() {
  return httpClient.get<{ roles: string[] }>('/auth/available-roles');
}
