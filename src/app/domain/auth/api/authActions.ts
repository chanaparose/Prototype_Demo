import { postLogin, postRegister } from '@/services/api/authApi';
import { frontendApi } from '@/services/api/exploreApi';
import {
  mapAuthResponseToModel,
  mapUserFromApi,
} from '@/domain/auth/mappers/mapAuthResponse';
import type { IAuthSession } from '@/domain/auth/types/auth.model';
import type { IUser } from '@/domain/auth/types/user.model';
import type {
  ILoginRequest,
  IRegisterCustomerRequest,
  IRegisterFactoryRequest,
} from '@/services/api/types/auth.types';

async function hydrateUserProfile(session: IAuthSession): Promise<IAuthSession> {
  try {
    const me = await frontendApi.getMe();
    return { ...session, user: mapUserFromApi(me) };
  } catch {
    return session;
  }
}

export async function loginAction(request: ILoginRequest): Promise<IAuthSession> {
  const raw = await postLogin(request);
  const session = mapAuthResponseToModel(raw);
  return hydrateUserProfile(session);
}

export async function registerAction(
  request: IRegisterCustomerRequest | IRegisterFactoryRequest,
): Promise<IAuthSession> {
  const raw = await postRegister(request);
  const session = mapAuthResponseToModel(raw);
  return hydrateUserProfile(session);
}

export async function fetchCurrentUserAction(): Promise<IUser> {
  const me = await frontendApi.getMe();
  return mapUserFromApi(me);
}
