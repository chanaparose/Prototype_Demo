import { postLogin, postRegister, postUpgradeToFactory, postSwitchRole } from '@/services/api/authApi';
import { frontendApi } from '@/services/api/exploreApi';
import { mapAuthResponseToModel, mapUserFromApi } from '@/domain/auth/mappers/mapAuthResponse';
import type { IAuthSession } from '@/domain/auth/types/auth.model';
import type { IUser } from '@/domain/auth/types/user.model';
import type {
  ILoginRequest,
  IRegisterCustomerRequest,
  IRegisterFactoryRequest,
} from '@/services/api/types/auth.types';
type UpgradeToFactoryRequest = Omit<IRegisterFactoryRequest, 'role' | 'email' | 'phone' | 'password'>;
import { setToken } from '@/services/api/tokenManager';

async function hydrateUserProfile(session: IAuthSession): Promise<IAuthSession> {
  try {
    setToken(session.token);
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

export async function upgradeToFactoryAction(request: UpgradeToFactoryRequest): Promise<IAuthSession> {
  const raw = await postUpgradeToFactory(request);
  const session = mapAuthResponseToModel(raw);
  return hydrateUserProfile(session);
}

export async function switchRoleAction(role: string): Promise<IAuthSession> {
  const raw = await postSwitchRole(role);
  const session = mapAuthResponseToModel(raw);
  return hydrateUserProfile(session);
}

export async function fetchCurrentUserAction(): Promise<IUser> {
  const me = await frontendApi.getMe();
  return mapUserFromApi(me);
}
