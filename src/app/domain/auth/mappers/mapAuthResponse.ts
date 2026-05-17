import type { IAuthResponse } from '@/services/api/types/auth.types';
import type { IAuthSession } from '@/domain/auth/types/auth.model';
import type { IUser } from '@/domain/auth/types/user.model';

function pickString(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = raw[key];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

export function mapUserFromApi(raw: Record<string, unknown>): IUser {
  const first = pickString(raw, 'first_name', 'firstName');
  const last = pickString(raw, 'last_name', 'lastName');
  const composedName = [first, last].filter(Boolean).join(' ').trim();

  return {
    id: raw.user_id ?? raw.id ?? '',
    role: pickString(raw, 'role'),
    name: pickString(raw, 'name', 'full_name', 'display_name') || composedName,
    email: pickString(raw, 'email'),
    phone: pickString(raw, 'phone', 'phone_number'),
    company: pickString(raw, 'company', 'company_name'),
    avatar: pickString(raw, 'avatar', 'avatar_url', 'image_url'),
    walletBalance: Number(raw.wallet_balance ?? raw.walletBalance ?? 0),
    pendingBalance: Number(raw.pending_balance ?? raw.pendingBalance ?? 0),
    memberSince: pickString(raw, 'member_since', 'memberSince', 'created_at'),
    factory_id: raw.factory_id,
    factoryId: raw.factoryId ?? raw.factory_id,
    verify_status: pickString(raw, 'verify_status', 'verifyStatus') || undefined,
  };
}

export function mapAuthResponseToModel(
  data: IAuthResponse | Record<string, unknown>,
): IAuthSession {
  const row = data as Record<string, unknown>;
  const token = pickString(row, 'token', 'access_token');
  if (!token) {
    throw new Error('เซิร์ฟเวอร์ไม่ได้ส่ง token กลับมา — กรุณาลองใหม่');
  }

  const userRaw = (row.user ?? {}) as Record<string, unknown>;
  return {
    token,
    user: mapUserFromApi(userRaw),
  };
}
