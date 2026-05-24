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
