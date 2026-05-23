import { mapFactoryApprovalStatus } from '@/domain/admin/mappers/mapAdminFactory';
import type { FactoryApprovalStatus } from '@/domain/admin/types/adminFactory.model';
import { type ApiRecord } from '@/lib/apiShape';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

export type TimelineStatus = FactoryApprovalStatus | 'submitted';

export interface TimelineRow {
  status: TimelineStatus;
  timestamp: string;
  note?: string;
}

export interface AdminFactoryDetailState {
  id: string;
  factory_id: number;
  factory_name: string;
  owner_name: string;
  email: string;
  phone: string;
  registered_at: string;
  approval_status: FactoryApprovalStatus;
  business_type: string;
  province: string;
  address: string;
  tax_id: string;
  website?: string;
  documents: { name: string; status: 'uploaded' | 'missing' | 'verified'; url?: string }[];
  timeline: TimelineRow[];
  is_verified: boolean;
}

export const EMPTY_ADMIN_FACTORY_DETAIL: AdminFactoryDetailState = {
  id: '',
  factory_id: 0,
  factory_name: '-',
  owner_name: '-',
  email: '-',
  phone: '-',
  registered_at: '',
  approval_status: 'pending',
  business_type: '-',
  province: '-',
  address: '-',
  tax_id: '-',
  documents: [],
  timeline: [],
  is_verified: false,
};

function getNestedList(root: Record<string, unknown>, key: string): ApiRecord[] {
  const v = root[key];
  if (!Array.isArray(v)) return [];
  return v.filter(
    (item): item is ApiRecord =>
      item != null && typeof item === 'object' && !Array.isArray(item),
  );
}

export function mapAdminFactoryDetail(raw: unknown): AdminFactoryDetailState {
  const root = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const factory = (root.factory ?? root.profile ?? root) as Record<string, unknown>;
  const stats = (root.stats ?? {}) as Record<string, unknown>;
  const docs = getNestedList(root, 'certificates');
  const categories = getNestedList(root, 'categories');

  const factoryId = pickScalarNumber(factory.factory_id, factory.id, root.factory_id) ?? 0;
  const approvalStatus = mapFactoryApprovalStatus(factory.approval_status);
  const registeredAt = pickScalarString(
    factory.submitted_at,
    factory.created_at,
    factory.registered_at,
  );

  const timeline: TimelineRow[] = [
    { status: 'submitted' as const, timestamp: registeredAt || '', note: 'ส่งใบสมัครเข้ามา' },
    {
      status: approvalStatus,
      timestamp: pickScalarString(factory.updated_at, registeredAt),
      note:
        approvalStatus === 'rejected'
          ? pickScalarString(factory.rejection_reason, 'ปฏิเสธโดยผู้ดูแล')
          : approvalStatus === 'approved'
            ? 'อนุมัติโดยผู้ดูแลระบบ'
            : approvalStatus === 'suspended'
              ? 'ระงับการใช้งานโดยผู้ดูแลระบบ'
              : 'รอการตรวจสอบจากทีม Admin',
    },
  ].filter((r) => r.timestamp);

  return {
    id: pickScalarString(factoryId),
    factory_id: factoryId,
    factory_name: pickScalarString(factory.factory_name, factory.name, '-'),
    owner_name: pickScalarString(factory.owner_name, factory.contact_name, '-'),
    email: pickScalarString(factory.owner_email, factory.email, '-'),
    phone: pickScalarString(factory.owner_phone, factory.phone, '-'),
    registered_at: registeredAt,
    approval_status: approvalStatus,
    business_type: pickScalarString(factory.business_type_name, factory.business_type, '-'),
    province: pickScalarString(factory.province_name, factory.province, '-'),
    address: pickScalarString(factory.address_detail, factory.address, '-'),
    tax_id: pickScalarString(factory.tax_id, '-'),
    website: pickScalarString(factory.website),
    documents:
      docs.length > 0
        ? docs.map((d) => ({
            name: pickScalarString(d.cert_name, d.name, 'เอกสารโรงงาน'),
            status:
              pickScalarString(d.status, d.is_verified).toLowerCase() === 'verified' ||
              Boolean(d.is_verified)
                ? 'verified'
                : pickScalarString(d.document_url, d.url)
                  ? 'uploaded'
                  : 'missing',
            url: pickScalarString(d.document_url, d.url),
          }))
        : [
            ...categories.map((c) => ({
              name: `หมวด: ${pickScalarString(c.category_name, c.name, '-')}`,
              status: 'verified' as const,
              url: '',
            })),
            {
              name: 'ยืนยันโปรไฟล์โรงงาน',
              status: stats.profile_completed ? 'verified' : 'uploaded',
              url: '',
            },
          ],
    timeline,
    is_verified: Boolean(factory.is_verified ?? false),
  };
}
