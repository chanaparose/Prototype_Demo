import { mapFactoryApprovalStatus } from '@/domain/admin/mappers/mapAdminFactory';
import type { FactoryApprovalStatus } from '@/domain/admin/types/adminFactory.model';
import { apiListAsRecords, asRecord, nestedRecord, type ApiRecord } from '@/lib/apiShape';
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

export function mapAdminFactoryDetail(raw: unknown): AdminFactoryDetailState {
  const root = asRecord(raw);
  const factoryNested = nestedRecord(root, 'factory');
  const profileNested = nestedRecord(root, 'profile');
  const factoryRow =
    factoryNested.factory_id || factoryNested.name || factoryNested.id
      ? factoryNested
      : profileNested.factory_id || profileNested.name
        ? profileNested
        : root;
  const stats = asRecord(root.stats);
  const docs = apiListAsRecords(root.certificates);
  const categories = apiListAsRecords(root.categories);

  const factoryId = pickScalarNumber(factoryRow.factory_id, factoryRow.id, root.factory_id) ?? 0;
  const approvalStatus = mapFactoryApprovalStatus(factoryRow.approval_status);
  const registeredAt = pickScalarString(
    factoryRow.submitted_at,
    factoryRow.created_at,
    factoryRow.registered_at,
  );

  const timeline: TimelineRow[] = [
    { status: 'submitted' as const, timestamp: registeredAt || '', note: 'ส่งใบสมัครเข้ามา' },
    {
      status: approvalStatus,
      timestamp: pickScalarString(factoryRow.updated_at, registeredAt),
      note:
        approvalStatus === 'rejected'
          ? pickScalarString(factoryRow.rejection_reason, 'ปฏิเสธโดยผู้ดูแล')
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
    factory_name: pickScalarString(factoryRow.factory_name, factoryRow.name, '-'),
    owner_name: pickScalarString(factoryRow.owner_name, factoryRow.contact_name, '-'),
    email: pickScalarString(factoryRow.owner_email, factoryRow.email, '-'),
    phone: pickScalarString(factoryRow.owner_phone, factoryRow.phone, '-'),
    registered_at: registeredAt,
    approval_status: approvalStatus,
    business_type: pickScalarString(factoryRow.business_type_name, factoryRow.business_type, '-'),
    province: pickScalarString(factoryRow.province_name, factoryRow.province, '-'),
    address: pickScalarString(factoryRow.address_detail, factoryRow.address, '-'),
    tax_id: pickScalarString(factoryRow.tax_id, '-'),
    website: pickScalarString(factoryRow.website),
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
    is_verified: Boolean(factoryRow.is_verified ?? false),
  };
}
