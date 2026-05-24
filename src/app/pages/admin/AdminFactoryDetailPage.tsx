import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import {
  ChevronLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import {
  adminApi,
  adminConfigApi,
  adminFactoryConfigApi,
  adminSettlementApi,
} from '@/services/api/adminApi';
import { mapFactoryApprovalStatus } from '@/domain/admin/mappers/mapAdminFactory';
import type {
  IAdminSettlementListItemResponse,
  IFactoryConfigResponse,
  IPlatformConfigItemResponse,
} from '@/services/api/types/admin.types';
import type { FactoryApprovalStatus } from '@/domain/admin/types/adminFactory.model';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/utils/formatting/formatDate';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';

type TimelineStatus = FactoryApprovalStatus | 'submitted';

interface TimelineRow {
  status: TimelineStatus;
  timestamp: string;
  note?: string;
}

interface AdminFactoryDetailState {
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

const EMPTY_DETAIL: AdminFactoryDetailState = {
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

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  submitted: { label: 'ส่งใบสมัคร', cls: 'text-slate-500', icon: Clock },
  pending: { label: 'รอ Approve', cls: 'text-amber-600', icon: Clock },
  approved: { label: 'Approved', cls: 'text-emerald-600', icon: CheckCircle },
  rejected: { label: 'Rejected', cls: 'text-red-600', icon: XCircle },
  suspended: { label: 'Suspended', cls: 'text-slate-600', icon: AlertTriangle },
};

const DOC_STATUS_META = {
  uploaded: { label: 'อัปโหลดแล้ว', cls: 'bg-blue-100 text-blue-700' },
  verified: { label: 'ตรวจสอบแล้ว', cls: 'bg-emerald-100 text-emerald-700' },
  missing: { label: 'ยังไม่มี', cls: 'bg-red-100 text-red-600' },
};

function getArray(raw: unknown, key: string): Record<string, unknown>[] {
  if (!raw || typeof raw !== 'object') return [];
  const v = (raw as Record<string, unknown>)[key];
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

function mapDetail(raw: unknown): AdminFactoryDetailState {
  const root = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const factory = (root.factory ?? root.profile ?? root) as Record<string, unknown>;
  const stats = (root.stats ?? {}) as Record<string, unknown>;
  const docs = getArray(root, 'certificates');
  const categories = getArray(root, 'categories');

  const factoryId = pickScalarNumber(factory.factory_id, factory.id, root.factory_id) ?? 0;
  const approvalStatus = mapFactoryApprovalStatus(factory.approval_status);
  const registeredAt = pickScalarString(
    factory.submitted_at,
    factory.created_at,
    factory.registered_at,
  );

  const timeline: TimelineRow[] = [
    { status: 'submitted', timestamp: registeredAt || '', note: 'ส่งใบสมัครเข้ามา' },
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
              status: Boolean(stats.profile_completed) ? 'verified' : 'uploaded',
              url: '',
            },
          ],
    timeline,
    is_verified: Boolean(factory.is_verified ?? false),
  };
}

export function AdminFactoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = pickScalarString(user?.role);

  const [factory, setFactory] = useState<AdminFactoryDetailState>(EMPTY_DETAIL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'config' | 'settlements'>('info');

  const [configList, setConfigList] = useState<IPlatformConfigItemResponse[]>([]);
  const [currentConfig, setCurrentConfig] = useState<IFactoryConfigResponse | null>(null);
  /** ค่า '' = ยังไม่โหลด / ยังไม่เลือก; 0 = reset กลับ default ตาม BE (`config_id: 0`) */
  const [selectedConfigId, setSelectedConfigId] = useState<number | ''>('');
  const [configNote, setConfigNote] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [savedConfig, setSavedConfig] = useState(false);

  const defaultPlatformConfigId = useMemo(
    () => (configList.length ? configList[0].config_id : undefined),
    [configList],
  );

  const canAssignConfig = role === 'AD' || role === 'SA';
  const canApprove = role === 'AD' || role === 'SA';
  const canSuspend = role === 'SA';

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const rawFactory = await adminApi.getFactory(id);

      const mapped = mapDetail(rawFactory);
      setFactory(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดรายละเอียดโรงงานไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [id]);

  const loadFactoryConfig = async () => {
    if (!id) return;
    try {
      const fid = pickScalarNumber(id) ?? 0;
      if (!Number.isFinite(fid) || fid <= 0) return;
      const [configRes, listRes] = await Promise.all([
        adminFactoryConfigApi.getFactoryConfig(fid),
        adminConfigApi.listConfigs(),
      ]);
      setCurrentConfig(configRes);
      setSelectedConfigId(configRes.config_id);
      setConfigList((listRes.configs ?? []).slice().sort((a, b) => a.config_id - b.config_id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลด config ของโรงงานไม่สำเร็จ');
    }
  };

  useEffect(() => {
    void loadFactoryConfig();
  }, [id]);

  const isFactoryConfigSelectionUnchanged = useMemo(() => {
    if (selectedConfigId === '' || !currentConfig) return true;
    if (selectedConfigId === currentConfig.config_id) return true;
    if (
      selectedConfigId === 0 &&
      defaultPlatformConfigId != null &&
      currentConfig.config_id === defaultPlatformConfigId
    ) {
      return true;
    }
    return false;
  }, [selectedConfigId, currentConfig, defaultPlatformConfigId]);

  const handleSaveFactoryConfig = async () => {
    if (!factory.factory_id || selectedConfigId === '' || isFactoryConfigSelectionUnchanged) return;
    setSavingConfig(true);
    setError('');
    try {
      const res = await adminFactoryConfigApi.assignConfig(factory.factory_id, {
        config_id: selectedConfigId,
        note: configNote.trim(),
      });
      setCurrentConfig(res);
      setSelectedConfigId(res.config_id);
      setConfigNote('');
      setSavedConfig(true);
      setTimeout(() => setSavedConfig(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึก config โรงงานไม่สำเร็จ');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleApprove = async () => {
    if (!canApprove || !factory.factory_id) return;
    setSaving(true);
    setError('');
    try {
      await adminApi.approveFactory(factory.factory_id);
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อนุมัติโรงงานไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!canApprove || !factory.factory_id) return;
    const reason = window.prompt('กรุณาระบุเหตุผลในการปฏิเสธ (อย่างน้อย 10 ตัวอักษร)') ?? '';
    if (reason.trim().length < 10) return;

    setSaving(true);
    setError('');
    try {
      await adminApi.rejectFactory(factory.factory_id, reason.trim());
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ปฏิเสธโรงงานไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspendToggle = async () => {
    if (!canSuspend || !factory.factory_id) return;
    setSaving(true);
    setError('');
    try {
      if (factory.approval_status === 'suspended') {
        await adminApi.unsuspendFactory(factory.factory_id);
      } else {
        await adminApi.suspendFactory(factory.factory_id, 'ระงับโดยผู้ดูแลระบบ');
      }
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปเดตสถานะระงับไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVerification = async () => {
    if (!canSuspend || !factory.factory_id) return;
    setSaving(true);
    setError('');
    try {
      await adminApi.updateFactoryVerification(factory.factory_id, !factory.is_verified);
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปเดตสถานะยืนยันไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const statusChip = useMemo(() => {
    if (factory.approval_status === 'approved') {
      return (
        <span className='px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold'>
          Approved
        </span>
      );
    }
    if (factory.approval_status === 'rejected') {
      return (
        <span className='px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-bold'>
          Rejected
        </span>
      );
    }
    if (factory.approval_status === 'suspended') {
      return (
        <span className='px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 text-sm font-bold'>
          Suspended
        </span>
      );
    }
    return (
      <span className='px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-bold'>
        รอ Approve
      </span>
    );
  }, [factory.approval_status]);

  return (
    <div className='space-y-6'>
      <div>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate('/admin/factories')}
          className='flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors mb-2'
        >
          <ChevronLeft size={14} />
          กลับไปรายการโรงงาน
        </Button>
        <p className='text-xs text-slate-400 font-medium'>Admin / โรงงาน / รายละเอียด</p>
        <h2 className='text-2xl font-bold text-slate-900 mt-1'>{factory.factory_name}</h2>
      </div>

      {error && (
        <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2'>
          <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
          <span>{error}</span>
        </div>
      )}

      <div className='flex gap-0 border-b border-slate-200'>
        {(
          [
            { key: 'info', label: 'ข้อมูลโรงงาน' },
            { key: 'config', label: 'Config' },
            { key: 'settlements', label: 'Settlement' },
          ] as const
        ).map((t) => (
          <Button
            variant='unstyled'
            key={t.key}
            type='button'
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {activeTab === 'settlements' && factory.factory_id ? (
        <FactorySettlementsTab factoryId={factory.factory_id} />
      ) : null}

      {activeTab === 'config' && factory.factory_id ? (
        <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5'>
          <div>
            <h3 className='text-sm font-bold text-slate-900'>Config ค่าคอมมิชชัน</h3>
            <p className='text-xs text-slate-400 mt-1'>
              การเปลี่ยน config มีผลกับ quotation ที่สร้างใหม่เท่านั้น
            </p>
          </div>

          <div className='rounded-lg border border-slate-200 p-4 bg-slate-50'>
            <p className='text-xs text-slate-500 mb-2'>Config ปัจจุบัน</p>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm'>
              <p className='text-slate-700 font-medium'>ชื่อ: {currentConfig?.label ?? '-'}</p>
              <p className='text-slate-700'>คอม: {currentConfig?.default_commission_rate ?? 0}%</p>
              <p className='text-slate-700'>VAT: {currentConfig?.vat_rate ?? 0}%</p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label className='block text-xs font-semibold text-slate-700 mb-1.5'>
                เปลี่ยน Config
              </Label>
              <Select
                value={selectedConfigId === '' ? '' : String(selectedConfigId)}
                onValueChange={(next) => {
                  if (next === '__empty') setSelectedConfigId('');
                  else setSelectedConfigId(Number(next));
                }}
                disabled={!canAssignConfig}
              >
                <SelectTrigger className='w-full rounded-lg text-slate-900 disabled:bg-slate-50'>
                  <SelectValue placeholder='เลือก Config Package' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__empty'>เลือก Config Package</SelectItem>
                  <SelectItem value='0'>กลับเป็นมาตรฐาน (ใช้ default จากระบบ)</SelectItem>
                  {configList.map((cfg) => (
                    <SelectItem key={cfg.config_id} value={String(cfg.config_id)}>
                      [{cfg.config_id}]{' '}
                      {cfg.label ??
                        `Commission ${cfg.default_commission_rate}% / VAT ${cfg.vat_rate}%`}{' '}
                      — คอม {cfg.default_commission_rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className='block text-xs font-semibold text-slate-700 mb-1.5'>หมายเหตุ</Label>
              <Input
                value={configNote}
                onChange={(e) => setConfigNote(e.target.value)}
                disabled={!canAssignConfig}
                className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50'
                placeholder='ระบุเหตุผลการเปลี่ยน config'
              />
            </div>
          </div>

          <Button
            variant='unstyled'
            type='button'
            onClick={handleSaveFactoryConfig}
            disabled={!canAssignConfig || savingConfig || isFactoryConfigSelectionUnchanged}
            className='flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60'
          >
            <Save size={14} />
            {savingConfig ? 'กำลังบันทึก...' : savedConfig ? 'บันทึกแล้ว ✓' : 'บันทึก'}
          </Button>
        </div>
      ) : null}

      {activeTab === 'info' && (
        <>
          <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
            <div className='xl:col-span-2 space-y-6'>
              <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
                <h3 className='text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100'>
                  ข้อมูลโรงงาน
                </h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <InfoRow icon={Building2} label='ชื่อโรงงาน' value={factory.factory_name} />
                  <InfoRow icon={Building2} label='ประเภทธุรกิจ' value={factory.business_type} />
                  <InfoRow icon={Mail} label='อีเมล' value={factory.email} />
                  <InfoRow icon={Phone} label='โทรศัพท์' value={factory.phone} />
                  <InfoRow icon={MapPin} label='จังหวัด' value={factory.province} />
                  <InfoRow icon={FileText} label='เลขที่ภาษี' value={factory.tax_id} />
                  <InfoRow
                    icon={Clock}
                    label='วันที่สมัคร'
                    value={formatDateTime(factory.registered_at)}
                  />
                  <InfoRow
                    icon={CheckCircle}
                    label='ยืนยันตัวตน'
                    value={factory.is_verified ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}
                  />
                  <div className='sm:col-span-2'>
                    <InfoRow icon={MapPin} label='ที่อยู่' value={factory.address} />
                  </div>
                  {factory.website ? (
                    <div className='sm:col-span-2'>
                      <InfoRow icon={Building2} label='เว็บไซต์' value={factory.website} />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
                <h3 className='text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100'>
                  เอกสารแนบ
                </h3>
                <div className='space-y-2.5'>
                  {factory.documents.length === 0 ? (
                    <p className='text-sm text-slate-400'>ยังไม่มีเอกสารที่เชื่อมกับโรงงานนี้</p>
                  ) : (
                    factory.documents.map((doc) => {
                      const meta = DOC_STATUS_META[doc.status];
                      return (
                        <div
                          key={`${doc.name}-${doc.url || ''}`}
                          className='flex items-center justify-between py-2 border-b border-slate-50 last:border-0'
                        >
                          <div className='flex items-center gap-2.5'>
                            <FileText size={15} className='text-slate-400' />
                            <span className='text-sm text-slate-700'>{doc.name}</span>
                          </div>
                          <div className='flex items-center gap-2'>
                            {doc.url ? (
                              <a
                                href={doc.url}
                                target='_blank'
                                rel='noreferrer'
                                className='text-xs text-indigo-600 hover:underline'
                              >
                                เปิดไฟล์
                              </a>
                            ) : null}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className='space-y-6'>
              <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
                <h3 className='text-sm font-bold text-slate-900 mb-4'>สถานะการอนุมัติ</h3>
                <div className='flex items-center gap-2 mb-4'>{statusChip}</div>
                <div className='space-y-2'>
                  {factory.approval_status === 'pending' && canApprove ? (
                    <>
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={handleApprove}
                        disabled={saving}
                        className='w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60'
                      >
                        <CheckCircle size={15} />
                        อนุมัติโรงงาน
                      </Button>
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={handleReject}
                        disabled={saving}
                        className='w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-100 disabled:opacity-60'
                      >
                        <XCircle size={15} />
                        ปฏิเสธ
                      </Button>
                    </>
                  ) : null}

                  {canSuspend ? (
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={handleSuspendToggle}
                      disabled={saving}
                      className='w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-60'
                    >
                      {factory.approval_status === 'suspended'
                        ? 'ยกเลิกระงับโรงงาน'
                        : 'ระงับโรงงาน'}
                    </Button>
                  ) : null}

                  {canSuspend ? (
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={handleToggleVerification}
                      disabled={saving}
                      className='w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-60'
                    >
                      {factory.is_verified ? 'ยกเลิกยืนยันตัวตน' : 'ยืนยันตัวตนโรงงาน'}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
                <h3 className='text-sm font-bold text-slate-900 mb-4'>ประวัติการดำเนินการ</h3>
                <div className='relative'>
                  <div className='absolute left-4 top-0 bottom-0 w-px bg-slate-200' />
                  <div className='space-y-4'>
                    {factory.timeline.length === 0 ? (
                      <p className='text-sm text-slate-400 pl-8'>ยังไม่มีประวัติ</p>
                    ) : (
                      factory.timeline.map((event, i) => {
                        const meta = STATUS_META[event.status] ?? STATUS_META.pending;
                        const Icon = meta.icon;
                        const isLast = i === factory.timeline.length - 1;
                        return (
                          <div
                            key={`${event.status}-${event.timestamp}-${i}`}
                            className='flex gap-3 pl-2'
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center shrink-0 z-10 mt-0.5 ${isLast ? 'border-indigo-400' : 'border-slate-300'}`}
                            >
                              <Icon
                                size={10}
                                className={isLast ? 'text-indigo-500' : 'text-slate-400'}
                              />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <p className={`text-xs font-semibold ${meta.cls}`}>{meta.label}</p>
                              {event.note ? (
                                <p className='text-xs text-slate-500 mt-0.5'>{event.note}</p>
                              ) : null}
                              <p className='text-[10px] text-slate-400 mt-1 tabular-nums'>
                                {formatDateTime(event.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? <div className='text-sm text-slate-500'>กำลังโหลดข้อมูล...</div> : null}
        </>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className='flex items-start gap-2.5'>
      <Icon size={14} className='text-slate-400 mt-0.5 shrink-0' />
      <div>
        <p className='text-[10px] text-slate-400 font-medium uppercase tracking-wide'>{label}</p>
        <p className='text-sm text-slate-900 font-medium'>{value || '-'}</p>
      </div>
    </div>
  );
}

const SETTLEMENT_STATUS: Record<string, { label: string; cls: string }> = {
  PE: { label: 'รอโอน', cls: 'bg-amber-50 text-amber-700' },
  PR: { label: 'กำลังประมวลผล', cls: 'bg-blue-50 text-blue-700' },
  CP: { label: 'โอนแล้ว', cls: 'bg-emerald-50 text-emerald-700' },
  FL: { label: 'ล้มเหลว', cls: 'bg-red-50 text-red-700' },
};

const SETTLE_LIMIT = 20;

function FactorySettlementsTab({ factoryId }: { factoryId: number }) {
  const [settlements, setSettlements] = useState<IAdminSettlementListItemResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!factoryId) return;
    setLoading(true);
    adminSettlementApi
      .listByFactory(factoryId, { limit: SETTLE_LIMIT, offset: page * SETTLE_LIMIT })
      .then((res) => {
        const data = res as unknown as {
          settlements: IAdminSettlementListItemResponse[];
          total: number;
        };
        setSettlements(data.settlements ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'โหลด settlement ไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [factoryId, page]);

  const totalPages = Math.ceil(total / SETTLE_LIMIT);

  if (error) {
    return (
      <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2'>
        <AlertTriangle size={14} />
        {error}
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table className='w-full text-sm'>
            <TableHeader>
              <TableRow className='bg-slate-50 border-b border-slate-200'>
                <TableHead className='px-4 py-3 text-left text-xs font-semibold text-slate-500'>
                  Settlement ID
                </TableHead>
                <TableHead className='px-4 py-3 text-left text-xs font-semibold text-slate-500'>
                  Order
                </TableHead>
                <TableHead className='px-4 py-3 text-right text-xs font-semibold text-slate-500'>
                  จำนวน
                </TableHead>
                <TableHead className='px-4 py-3 text-center text-xs font-semibold text-slate-500'>
                  สถานะ
                </TableHead>
                <TableHead className='px-4 py-3 text-left text-xs font-semibold text-slate-500'>
                  วันที่
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className='divide-y divide-slate-50'>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j} className='px-4 py-3'>
                        <div className='h-4 bg-slate-100 rounded animate-pulse' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : settlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='px-4 py-10 text-center text-sm text-slate-400'>
                    ยังไม่มี Settlement
                  </TableCell>
                </TableRow>
              ) : (
                settlements.map((s) => {
                  const st = SETTLEMENT_STATUS[s.status] ?? {
                    label: s.status,
                    cls: 'bg-slate-100 text-slate-500',
                  };
                  return (
                    <TableRow key={s.settlement_id}>
                      <TableCell className='px-4 py-3 text-xs text-slate-400 font-mono'>
                        #{s.settlement_id}
                      </TableCell>
                      <TableCell className='px-4 py-3'>
                        <Link
                          to={`/admin/orders/${s.order_id}`}
                          className='text-indigo-600 font-semibold text-xs hover:underline'
                        >
                          #{s.order_id}
                        </Link>
                      </TableCell>
                      <TableCell className='px-4 py-3 text-right font-semibold tabular-nums'>
                        {formatCurrencyNoDecimals(pickScalarNumber(s.amount) ?? 0)}
                      </TableCell>
                      <TableCell className='px-4 py-3 text-center'>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </TableCell>
                      <TableCell className='px-4 py-3 text-xs text-slate-400'>
                        {s.created_at ? new Date(s.created_at).toLocaleDateString('th-TH') : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <Button
            variant='unstyled'
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => p - 1)}
            className='px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50'
          >
            ← ก่อนหน้า
          </Button>
          <span className='text-sm text-slate-500'>
            หน้า {page + 1} / {totalPages}
          </span>
          <Button
            variant='unstyled'
            disabled={page + 1 >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className='px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50'
          >
            ถัดไป →
          </Button>
        </div>
      )}
    </div>
  );
}
