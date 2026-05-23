import type { IAuthResponse } from '@/services/api/types/auth.types';
import type { IAuthSession } from '@/domain/auth/types/auth.model';
import type { IUser } from '@/domain/auth/types/user.model';
import { asRecord, nestedRecord, type ApiRecord } from '@/lib/apiShape';

function pickString(raw: ApiRecord, ...keys: string[]): string {
  for (const key of keys) {
    const v = raw[key];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function pickId(raw: ApiRecord, ...keys: string[]): string | number | undefined {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'string' || typeof value === 'number') return value;
  }
  return undefined;
}

export function mapUserFromApi(raw: ApiRecord): IUser {
  const first = pickString(raw, 'first_name', 'firstName');
  const last = pickString(raw, 'last_name', 'lastName');
  const composedName = [first, last].filter(Boolean).join(' ').trim();

  return {
    id: pickId(raw, 'user_id', 'id') ?? '',
    role: pickString(raw, 'role'),
    name: pickString(raw, 'name', 'full_name', 'display_name') || composedName,
    email: pickString(raw, 'email'),
    phone: pickString(raw, 'phone', 'phone_number'),
    company: pickString(raw, 'company', 'company_name'),
    avatar: pickString(raw, 'avatar', 'avatar_url', 'image_url'),
    walletBalance: Number(raw.wallet_balance ?? raw.walletBalance ?? 0),
    pendingBalance: Number(raw.pending_balance ?? raw.pendingBalance ?? 0),
    memberSince: pickString(raw, 'member_since', 'memberSince', 'created_at'),
    factory_id: pickId(raw, 'factory_id'),
    factoryId: pickId(raw, 'factoryId', 'factory_id'),
    verify_status: pickString(raw, 'verify_status', 'verifyStatus') || undefined,
  };
}

export function mapAuthResponseToModel(data: IAuthResponse | unknown): IAuthSession {
  const row = asRecord(data);
  const token = pickString(row, 'token', 'access_token');
  if (!token) {
    throw new Error('เซิร์ฟเวอร์ไม่ได้ส่ง token กลับมา — กรุณาลองใหม่');
  }

  return {
    token,
    user: mapUserFromApi(nestedRecord(row, 'user')),
  };
}
