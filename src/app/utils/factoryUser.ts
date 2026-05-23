import type { IUser } from '@/domain/auth/types/user.model';

export function isFactoryRole(user: IUser | null | undefined): boolean {
  if (!user) return false;
  const r = String(user.role ?? '').toUpperCase();
  return r === 'FT' || r === 'FACTORY';
}

export function getFactoryEntityId(user: IUser | null | undefined): number | null {
  if (!user || !isFactoryRole(user)) return null;
  const raw = user.factory_id ?? user.factoryId ?? user.id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
