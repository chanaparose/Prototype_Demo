import type { IUser } from '@/domain/auth/types/user.model';

export interface IAuthSession {
  token: string;
  user: IUser;
}
