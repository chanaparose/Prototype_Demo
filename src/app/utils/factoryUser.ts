import type { User } from '../stores';

/** บทบาทโรงงานตาม API (register ใช้ FT) */
export function isFactoryRole(user: User | null | undefined): boolean {
  if (!user) return false;
  const r = String(user.role ?? '').toUpperCase();
  return r === 'FT' || r === 'FACTORY';
}

/**
 * คีย์ factory จากผู้ใช้ — backend อาจส่ง factory_id หรือใช้ user id เป็นตัวแทนโรงงาน
 */
export function getFactoryEntityId(user: User | null | undefined): number | null {
  if (!user || !isFactoryRole(user)) return null;
  const raw =
    user.factory_id ??
    user.factoryId ??
    (user as Record<string, unknown>).factory_id ??
    user.id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
