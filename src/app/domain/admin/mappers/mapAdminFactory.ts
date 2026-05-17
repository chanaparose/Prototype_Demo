import type {
  AdminFactory,
  FactoryApprovalStatus,
} from '@/domain/admin/types/adminFactory.model';
import { pickScalarString } from '@/utils/pickScalarString';

export function mapFactoryApprovalStatus(raw: unknown): FactoryApprovalStatus {
  const status = pickScalarString(raw).toUpperCase();
  if (status === 'AP' || status === 'APPROVED') return 'approved';
  if (status === 'RJ' || status === 'REJECTED') return 'rejected';
  if (status === 'SU' || status === 'SUSPENDED') return 'suspended';
  return 'pending';
}

export function extractAdminFactoryRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
    if (Array.isArray(obj.rows)) return obj.rows as Record<string, unknown>[];
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
  }
  return [];
}

export function mapAdminFactory(row: Record<string, unknown>): AdminFactory {
  const factoryId = Number(row.factory_id ?? row.id ?? 0);
  return {
    id: pickScalarString(factoryId || row.id),
    factory_id: factoryId,
    factory_name: pickScalarString(row.factory_name, row.name, '-'),
    owner_name: pickScalarString(row.owner_name, row.contact_name, row.full_name, '-'),
    email: pickScalarString(row.owner_email, row.email, '-'),
    phone: pickScalarString(row.owner_phone, row.phone, '-'),
    registered_at: pickScalarString(row.submitted_at, row.registered_at, row.created_at),
    approval_status: mapFactoryApprovalStatus(row.approval_status),
    business_type: pickScalarString(row.business_type_name, row.business_type, '-'),
    province: pickScalarString(row.province_name, row.province, '-'),
    is_verified: Boolean(row.is_verified ?? false),
  };
}
