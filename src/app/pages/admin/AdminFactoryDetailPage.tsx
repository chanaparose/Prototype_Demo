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
  ExternalLink,
  Image,
  Loader2,
  Pencil,
  ShieldCheck,
  CalendarX,
  X,
} from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import {
  adminApi,
  adminConfigApi,
  adminFactoryConfigApi,
  adminFactoryCertApi,
} from '@/services/api/adminApi';
import { mapFactoryApprovalStatus } from '@/domain/admin/mappers/mapAdminFactory';
import type {
  IAdminOrderListResponse,
  IFactoryConfigResponse,
  IPlatformConfigItemResponse,
} from '@/services/api/types/admin.types';
import type { FactoryApprovalStatus } from '@/domain/admin/types/adminFactory.model';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableContainer,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/AdminTable';
import { formatDateTime } from '@/utils/formatting/formatDate';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';

// ─── Types ────────────────────────────────────────────────────────────────────

type TimelineStatus = FactoryApprovalStatus | 'submitted';

interface TimelineRow {
  status: TimelineStatus;
  timestamp: string;
  note?: string;
}

export interface FactoryCertificate {
  map_id: number;
  cert_id: number;
  cert_name: string;
  verify_status: string;
  document_url?: string | null;
  cert_number?: string | null;
  expire_date?: string | null;
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
  certificates: FactoryCertificate[];
  timeline: TimelineRow[];
  is_verified: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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
  certificates: [],
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

const APPROVAL_CHIP: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-slate-200 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
};

const APPROVAL_LABEL: Record<string, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
  pending: 'รอ Approve',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getArray(raw: unknown, key: string): Record<string, unknown>[] {
  if (!raw || typeof raw !== 'object') return [];
  const v = (raw as Record<string, unknown>)[key];
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

/** Returns 'expired' | 'soon' (≤30d) | 'ok' | null */
function certExpireStatus(dateStr: string | null | undefined): 'expired' | 'soon' | 'ok' | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const diffDays = Math.floor((d.getTime() - now.getTime()) / 86_400_000);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'soon';
  return 'ok';
}

function mapDetail(raw: unknown): AdminFactoryDetailState {
  const root = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const factory = (root.factory ?? root.profile ?? root) as Record<string, unknown>;
  const rawCerts = getArray(root, 'certificates');

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
  ].filter((r) => r.timestamp) as TimelineRow[];

  const certificates: FactoryCertificate[] = rawCerts.map((d) => ({
    map_id: (d.map_id as number) ?? 0,
    cert_id: (d.cert_id as number) ?? 0,
    cert_name: pickScalarString(d.cert_name, d.name, 'ใบรับรอง'),
    verify_status: pickScalarString(d.verify_status, 'PE'),
    document_url: pickScalarString(d.document_url, d.url) || null,
    cert_number: pickScalarString(d.cert_number) || null,
    expire_date: pickScalarString(d.expire_date) || null,
  }));

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
    certificates,
    timeline,
    is_verified: Boolean(factory.is_verified ?? false),
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminFactoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = pickScalarString(user?.role);

  const [factory, setFactory] = useState<AdminFactoryDetailState>(EMPTY_DETAIL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'settlements' | 'config'>('info');

  // — Reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // — Suspend confirm modal
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false);

  // — Cert review modal (image + AP/RJ)
  const [certReview, setCertReview] = useState<FactoryCertificate | null>(null);
  const [certUpdating, setCertUpdating] = useState<number | null>(null);

  // — Config edit/view
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [configList, setConfigList] = useState<IPlatformConfigItemResponse[]>([]);
  const [currentConfig, setCurrentConfig] = useState<IFactoryConfigResponse | null>(null);
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

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const rawFactory = await adminApi.getFactory(id);
      setFactory(mapDetail(rawFactory));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดรายละเอียดโรงงานไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

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
      setSelectedConfigId(configRes.config_id as number);
      setConfigList(listRes.configs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลด config ของโรงงานไม่สำเร็จ');
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [id]);

  useEffect(() => {
    void loadFactoryConfig();
  }, [id]);

  // ── Config helpers ────────────────────────────────────────────────────────

  const isConfigUnchanged = useMemo(() => {
    if (selectedConfigId === '' || !currentConfig) return true;
    if (selectedConfigId === currentConfig.config_id) return true;
    if (
      selectedConfigId === 0 &&
      defaultPlatformConfigId != null &&
      currentConfig.config_id === defaultPlatformConfigId
    )
      return true;
    return false;
  }, [selectedConfigId, currentConfig, defaultPlatformConfigId]);

  const handleSaveFactoryConfig = async () => {
    if (!factory.factory_id || selectedConfigId === '' || isConfigUnchanged) return;
    setSavingConfig(true);
    setError('');
    try {
      const res = await adminFactoryConfigApi.assignConfig(factory.factory_id, {
        config_id: selectedConfigId,
        note: configNote.trim(),
      });
      setCurrentConfig(res);
      setSelectedConfigId(res.config_id as number);
      setConfigNote('');
      setIsEditingConfig(false);
      setSavedConfig(true);
      setTimeout(() => setSavedConfig(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึก config โรงงานไม่สำเร็จ');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCancelConfig = () => {
    setSelectedConfigId((currentConfig?.config_id as number) ?? '');
    setConfigNote('');
    setIsEditingConfig(false);
  };

  // ── Certificate handlers ──────────────────────────────────────────────────

  const handlePatchCert = async (mapId: number, status: 'AP' | 'RJ' | 'PE') => {
    if (!factory.factory_id) return;
    setCertUpdating(mapId);
    setError('');
    try {
      await adminFactoryCertApi.patchStatus(factory.factory_id, mapId, status);
      setFactory((prev) => ({
        ...prev,
        certificates: prev.certificates.map((c) =>
          c.map_id === mapId ? { ...c, verify_status: status } : c,
        ),
      }));
      // update cert review modal state too
      setCertReview((prev) => (prev?.map_id === mapId ? { ...prev, verify_status: status } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปเดตสถานะใบรับรองไม่สำเร็จ');
    } finally {
      setCertUpdating(null);
    }
  };

  // ── Factory status handlers ───────────────────────────────────────────────

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

  const handleRejectSubmit = async () => {
    if (!canApprove || !factory.factory_id || rejectReason.trim().length < 10) return;
    setRejectSubmitting(true);
    setError('');
    try {
      await adminApi.rejectFactory(factory.factory_id, rejectReason.trim());
      setRejectOpen(false);
      setRejectReason('');
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ปฏิเสธโรงงานไม่สำเร็จ');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleSuspendConfirm = async () => {
    if (!canSuspend || !factory.factory_id) return;
    setSaving(true);
    setError('');
    setSuspendConfirmOpen(false);
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

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const approvalChipCls = APPROVAL_CHIP[factory.approval_status] ?? APPROVAL_CHIP.pending;
  const approvalLabel = APPROVAL_LABEL[factory.approval_status] ?? 'รอ Approve';

  return (
    <div className='space-y-6'>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <div className='flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400'>
          <button
            type='button'
            onClick={() => navigate('/admin/factories')}
            className='inline-flex items-center gap-1 text-slate-400 hover:text-purple-600 transition-colors'
          >
            <ChevronLeft size={12} />
            โรงงาน
          </button>
        </div>

        {loading ? (
          <div className='mt-2 space-y-2'>
            <div className='h-7 w-56 bg-slate-100 rounded animate-pulse' />
            <div className='h-4 w-72 bg-slate-100 rounded animate-pulse' />
          </div>
        ) : (
          <>
            <h2 className='text-2xl font-bold text-slate-900 mt-1'>{factory.factory_name}</h2>
            {/* Summary bar */}
            <div className='flex flex-wrap items-center gap-2 mt-2'>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${approvalChipCls}`}>
                {approvalLabel}
              </span>
              {factory.approval_status === 'approved' ? (
                <span className='flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700'>
                  <ShieldCheck size={11} />
                  อนุมัติแล้ว
                </span>
              ) : null}
              <span className='text-xs text-slate-400 font-mono'>ID #{factory.factory_id}</span>
              {factory.email !== '-' && (
                <span className='text-xs text-slate-500'>{factory.email}</span>
              )}
            </div>
          </>
        )}
      </div>

      {error && (
        <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2'>
          <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
          <span>{error}</span>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className='flex gap-0 border-b border-slate-200'>
        {(
          [
            { key: 'info', label: 'ข้อมูลโรงงาน' },
            { key: 'settlements', label: 'Orders' },
            { key: 'config', label: 'Config' },
          ] as const
        ).map((t) => (
          <Button
            variant='unstyled'
            key={t.key}
            type='button'
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* ── Tab: Orders ──────────────────────────────────────────────────── */}
      {activeTab === 'settlements' && factory.factory_id ? (
        <FactoryOrdersTab factoryId={factory.factory_id} />
      ) : null}

      {/* ── Tab: Config ──────────────────────────────────────────────────── */}
      {activeTab === 'config' && factory.factory_id ? (
        <div className='bg-white rounded-xl border border-slate-200 p-6 space-y-5'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h3 className='text-sm font-bold text-slate-900'>Config ค่าคอมมิชชัน</h3>
              <p className='text-xs text-slate-400 mt-1'>
                การเปลี่ยน config มีผลกับ quotation ที่สร้างใหม่เท่านั้น
              </p>
            </div>
            {canAssignConfig && !isEditingConfig && (
              <button
                type='button'
                onClick={() => setIsEditingConfig(true)}
                className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors'
              >
                <Pencil size={12} />
                แก้ไข
              </button>
            )}
          </div>

          {/* Read-only view */}
          <div className='rounded-lg border border-slate-200 p-4 bg-slate-50'>
            <p className='text-xs text-slate-500 mb-2'>Config ปัจจุบัน</p>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm'>
              <div>
                <p className='text-[10px] text-slate-400 uppercase font-semibold tracking-wide mb-0.5'>
                  ชื่อ Config
                </p>
                <p className='font-semibold text-slate-800'>
                  {String(currentConfig?.label ?? '-')}
                </p>
              </div>
              <div>
                <p className='text-[10px] text-slate-400 uppercase font-semibold tracking-wide mb-0.5'>
                  ค่าคอม
                </p>
                <p className='font-semibold text-slate-800'>
                  {String(currentConfig?.default_commission_rate ?? 0)}%
                </p>
              </div>
              <div>
                <p className='text-[10px] text-slate-400 uppercase font-semibold tracking-wide mb-0.5'>
                  VAT
                </p>
                <p className='font-semibold text-slate-800'>
                  {String(currentConfig?.vat_rate ?? 0)}%
                </p>
              </div>
            </div>
            {savedConfig && (
              <p className='text-xs text-emerald-600 font-semibold mt-2'>✓ บันทึก config แล้ว</p>
            )}
          </div>

          {/* Edit form — only shown when editing */}
          {isEditingConfig && (
            <div className='rounded-lg border border-purple-200 p-4 bg-purple-50/30 space-y-4'>
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
                  >
                    <SelectTrigger className='w-full rounded-lg text-slate-900 bg-white'>
                      <SelectValue placeholder='เลือก Config Package' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='__empty'>เลือก Config Package</SelectItem>
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
                  <Label className='block text-xs font-semibold text-slate-700 mb-1.5'>
                    หมายเหตุ <span className='font-normal text-slate-400'>(เหตุผลการเปลี่ยน)</span>
                  </Label>
                  <Input
                    value={configNote}
                    onChange={(e) => setConfigNote(e.target.value)}
                    className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                    placeholder='เช่น ตกลงค่าคอมพิเศษ 3%'
                  />
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={handleSaveFactoryConfig}
                  disabled={savingConfig || isConfigUnchanged}
                  className='flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60'
                >
                  {savingConfig ? (
                    <Loader2 size={13} className='animate-spin' />
                  ) : (
                    <Save size={13} />
                  )}
                  {savingConfig ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={handleCancelConfig}
                  className='flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors'
                >
                  <X size={13} />
                  ยกเลิก
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* ── Tab: Info ────────────────────────────────────────────────────── */}
      {activeTab === 'info' && (
        <>
          {loading ? (
            /* Skeleton */
            <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
              <div className='xl:col-span-2 space-y-6'>
                <div className='bg-white rounded-xl border border-slate-200 p-6'>
                  <div className='h-4 w-28 bg-slate-100 rounded animate-pulse mb-4' />
                  <div className='grid grid-cols-2 gap-4'>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className='space-y-1.5'>
                        <div className='h-2.5 w-16 bg-slate-100 rounded animate-pulse' />
                        <div className='h-4 w-32 bg-slate-100 rounded animate-pulse' />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className='bg-white rounded-xl border border-slate-200 p-6'>
                <div className='h-4 w-32 bg-slate-100 rounded animate-pulse mb-4' />
                <div className='space-y-2'>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className='h-10 bg-slate-100 rounded animate-pulse' />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
              {/* Left column */}
              <div className='xl:col-span-2 space-y-6'>
                {/* Factory info */}
                <div className='bg-white rounded-xl border border-slate-200 p-6'>
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

                {/* Certificates table */}
                <div className='bg-white rounded-xl border border-slate-200 p-6'>
                  <h3 className='text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100'>
                    ใบรับรอง / เอกสารยืนยัน
                  </h3>
                  {factory.certificates.length === 0 ? (
                    <p className='text-sm text-slate-400'>ยังไม่มีใบรับรองที่เชื่อมกับโรงงานนี้</p>
                  ) : (
                    <div className='overflow-x-auto'>
                      <table className='w-full text-sm'>
                        <thead>
                          <tr className='border-b border-slate-100'>
                            <th className='text-left text-xs font-semibold text-slate-500 pb-2 pr-3'>
                              ใบรับรอง
                            </th>
                            <th className='text-left text-xs font-semibold text-slate-500 pb-2 pr-3'>
                              เลขที่
                            </th>
                            <th className='text-left text-xs font-semibold text-slate-500 pb-2 pr-3'>
                              วันหมดอายุ
                            </th>
                            <th className='text-left text-xs font-semibold text-slate-500 pb-2 pr-3'>
                              สถานะ
                            </th>
                            <th className='text-left text-xs font-semibold text-slate-500 pb-2'>
                              ดำเนินการ
                            </th>
                          </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-50'>
                          {factory.certificates.map((cert) => {
                            const vs = cert.verify_status?.trim();
                            const certStatusMeta: { label: string; variant: AdminBadgeVariant } =
                              vs === 'AP'
                                ? { label: 'อนุมัติแล้ว', variant: 'success' }
                                : vs === 'RJ'
                                  ? { label: 'ปฏิเสธ', variant: 'error' }
                                  : { label: 'รอตรวจสอบ', variant: 'pending' };
                            const expStatus = certExpireStatus(cert.expire_date);
                            return (
                              <tr
                                key={cert.map_id}
                                className='hover:bg-slate-50 transition-colors align-middle'
                              >
                                <td className='py-3 pr-3'>
                                  <div className='flex items-center gap-1.5'>
                                    <FileText size={13} className='text-slate-400 shrink-0' />
                                    <span className='font-medium text-slate-800'>
                                      {cert.cert_name}
                                    </span>
                                  </div>
                                </td>
                                <td className='py-3 pr-3 text-slate-600 text-xs font-mono'>
                                  {cert.cert_number ?? '—'}
                                </td>
                                <td className='py-3 pr-3'>
                                  {cert.expire_date ? (
                                    <span
                                      className={`flex items-center gap-1 text-xs ${
                                        expStatus === 'expired'
                                          ? 'text-red-600 font-semibold'
                                          : expStatus === 'soon'
                                            ? 'text-amber-600 font-semibold'
                                            : 'text-slate-600'
                                      }`}
                                    >
                                      {expStatus !== 'ok' && expStatus !== null && (
                                        <CalendarX size={11} />
                                      )}
                                      {cert.expire_date}
                                      {expStatus === 'expired' && (
                                        <span className='ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold'>
                                          หมดอายุ
                                        </span>
                                      )}
                                      {expStatus === 'soon' && (
                                        <span className='ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold'>
                                          ใกล้หมดอายุ
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className='text-xs text-slate-400'>—</span>
                                  )}
                                </td>
                                <td className='py-3 pr-3'>
                                  <Badge variant={certStatusMeta.variant} size='sm'>
                                    {certStatusMeta.label}
                                  </Badge>
                                </td>
                                <td className='py-3'>
                                  <button
                                    type='button'
                                    onClick={() => setCertReview(cert)}
                                    className='flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors'
                                  >
                                    <Image size={11} />
                                    ตรวจสอบ
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right column — actions + timeline */}
              <div className='space-y-6'>
                {/* Approval action card */}
                <div className='bg-white rounded-xl border border-slate-200 p-6'>
                  <h3 className='text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100'>
                    สถานะโรงงาน
                  </h3>

                  {/* Status display */}
                  <div className='flex items-center justify-between mb-4'>
                    <div>
                      <span
                        className={`inline-flex max-w-full items-center justify-center rounded-full px-2.5 py-1 text-center text-sm font-semibold leading-tight whitespace-normal sm:whitespace-nowrap ${approvalChipCls}`}
                      >
                        {approvalLabel}
                      </span>
                    </div>
                    {factory.approval_status === 'approved' && (
                      <span className='flex items-center gap-1 text-sm text-purple-600 font-semibold'>
                        <ShieldCheck size={14} />
                        อนุมัติแล้ว
                      </span>
                    )}
                  </div>

                  {/* Approve / Reject — only shown when pending */}
                  {factory.approval_status === 'pending' && canApprove ? (
                    <div className='space-y-2 mb-4'>
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={handleApprove}
                        disabled={saving}
                        className='w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60'
                      >
                        {saving ? (
                          <Loader2 size={14} className='animate-spin' />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        อนุมัติโรงงาน
                      </Button>
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={() => setRejectOpen(true)}
                        disabled={saving}
                        className='w-full flex items-center justify-center gap-2 py-2.5 bg-white text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors border border-red-200 disabled:opacity-60'
                      >
                        <XCircle size={14} />
                        ปฏิเสธ
                      </Button>
                    </div>
                  ) : null}

                  {/* Danger zone — Suspend (SA only, เฉพาะตอน approved หรือ suspended) */}
                  {canSuspend &&
                    (factory.approval_status === 'approved' ||
                      factory.approval_status === 'suspended') && (
                      <div className='border-t border-slate-100 pt-3 mt-2 space-y-2'>
                        <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide'>
                          การดำเนินการพิเศษ (SA only)
                        </p>
                        <Button
                          variant='unstyled'
                          type='button'
                          onClick={() => setSuspendConfirmOpen(true)}
                          disabled={saving}
                          className={`w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 ${
                            factory.approval_status === 'suspended'
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-100'
                          }`}
                        >
                          <AlertTriangle size={14} />
                          {factory.approval_status === 'suspended'
                            ? 'ยกเลิกระงับโรงงาน'
                            : 'ระงับโรงงาน'}
                        </Button>
                      </div>
                    )}
                </div>

                {/* Timeline */}
                <div className='bg-white rounded-xl border border-slate-200 p-6'>
                  <h3 className='text-base font-bold text-slate-900 mb-4'>ประวัติการดำเนินการ</h3>
                  <div className='relative'>
                    <div className='absolute left-4 top-0 bottom-0 w-px bg-slate-200' />
                    <div className='space-y-4'>
                      {factory.timeline.length === 0 ? (
                        <p className='text-base text-slate-400 pl-8'>ยังไม่มีประวัติ</p>
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
                                className={`w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center shrink-0 z-10 mt-0.5 ${
                                  isLast ? 'border-purple-400' : 'border-slate-300'
                                }`}
                              >
                                <Icon
                                  size={10}
                                  className={isLast ? 'text-purple-500' : 'text-slate-400'}
                                />
                              </div>
                              <div className='flex-1 min-w-0'>
                                <p className={`text-sm font-semibold ${meta.cls}`}>{meta.label}</p>
                                {event.note ? (
                                  <p className='text-sm text-slate-500 mt-0.5'>{event.note}</p>
                                ) : null}
                                <p className='text-xs text-slate-400 mt-1 tabular-nums'>
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
          )}
        </>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Reject factory modal */}
      {rejectOpen && (
        <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4'>
            <div className='flex items-start gap-3'>
              <div className='w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0'>
                <XCircle size={18} className='text-red-600' />
              </div>
              <div>
                <h3 className='text-base font-bold text-slate-900'>ปฏิเสธโรงงาน</h3>
                <p className='text-xs text-slate-500 mt-0.5'>
                  โรงงานจะได้รับแจ้งเหตุผลและสามารถยื่นใหม่ได้
                </p>
              </div>
            </div>
            <div>
              <label className='block text-xs font-semibold text-slate-700 mb-1.5'>
                เหตุผลในการปฏิเสธ <span className='text-red-500'>*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder='ระบุเหตุผลอย่างน้อย 10 ตัวอักษร เช่น เอกสารไม่ครบ, ข้อมูลไม่ถูกต้อง...'
                className='w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none'
              />
              {rejectReason.length > 0 && rejectReason.trim().length < 10 && (
                <p className='text-xs text-red-500 mt-1'>กรุณาระบุอย่างน้อย 10 ตัวอักษร</p>
              )}
            </div>
            <div className='flex items-center gap-2 pt-1'>
              <Button
                variant='unstyled'
                type='button'
                onClick={handleRejectSubmit}
                disabled={rejectSubmitting || rejectReason.trim().length < 10}
                className='flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60'
              >
                {rejectSubmitting ? (
                  <Loader2 size={13} className='animate-spin' />
                ) : (
                  <XCircle size={13} />
                )}
                ยืนยันการปฏิเสธ
              </Button>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => {
                  setRejectOpen(false);
                  setRejectReason('');
                }}
                className='flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors'
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend confirm modal */}
      {suspendConfirmOpen && (
        <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4'>
            <div className='flex items-start gap-3'>
              <div className='w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0'>
                <AlertTriangle size={18} className='text-amber-600' />
              </div>
              <div>
                <h3 className='text-base font-bold text-slate-900'>
                  {factory.approval_status === 'suspended'
                    ? 'ยืนยันการยกเลิกระงับ?'
                    : 'ยืนยันการระงับโรงงาน?'}
                </h3>
                <p className='text-xs text-slate-500 mt-1 leading-relaxed'>
                  {factory.approval_status === 'suspended'
                    ? 'โรงงานจะกลับมารับออเดอร์ได้ตามปกติ'
                    : 'โรงงานจะถูกระงับทันทีและไม่สามารถรับออเดอร์ใหม่ได้'}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='unstyled'
                type='button'
                onClick={handleSuspendConfirm}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                  factory.approval_status === 'suspended'
                    ? 'bg-slate-700 text-white hover:bg-slate-800'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {factory.approval_status === 'suspended'
                  ? 'ยืนยัน ยกเลิกระงับ'
                  : 'ยืนยัน ระงับโรงงาน'}
              </Button>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setSuspendConfirmOpen(false)}
                className='flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors'
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate review modal */}
      {certReview && (
        <div
          className='fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4'
          onClick={() => setCertReview(null)}
        >
          <div
            className='bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-slate-100'>
              <div>
                <h3 className='text-base font-bold text-slate-900'>{certReview.cert_name}</h3>
                <div className='flex items-center gap-3 mt-1 text-xs text-slate-500'>
                  {certReview.cert_number && (
                    <span className='font-mono'>เลขที่: {certReview.cert_number}</span>
                  )}
                  {certReview.expire_date && (
                    <span
                      className={`flex items-center gap-1 ${
                        certExpireStatus(certReview.expire_date) === 'expired'
                          ? 'text-red-600 font-semibold'
                          : certExpireStatus(certReview.expire_date) === 'soon'
                            ? 'text-amber-600 font-semibold'
                            : ''
                      }`}
                    >
                      {certExpireStatus(certReview.expire_date) !== 'ok' && <CalendarX size={11} />}
                      หมดอายุ: {certReview.expire_date}
                    </span>
                  )}
                </div>
              </div>
              <button
                type='button'
                onClick={() => setCertReview(null)}
                aria-label='ปิดหน้าต่างตรวจสอบใบรับรอง'
                title='ปิดหน้าต่างตรวจสอบใบรับรอง'
                className='w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors'
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className='grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100'>
              {/* Document preview */}
              <div className='p-4 bg-slate-50 flex items-center justify-center min-h-64'>
                {certReview.document_url ? (
                  <div className='relative w-full'>
                    <img
                      src={certReview.document_url}
                      alt='เอกสารใบรับรอง'
                      className='w-full max-h-80 object-contain rounded-lg'
                    />
                    <a
                      href={certReview.document_url}
                      target='_blank'
                      rel='noreferrer'
                      className='absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/50 text-white text-xs rounded hover:bg-black/70 transition-colors'
                    >
                      <ExternalLink size={11} />
                      เปิดใหม่
                    </a>
                  </div>
                ) : (
                  <div className='text-center text-slate-400 py-10'>
                    <FileText size={40} className='mx-auto mb-2 opacity-40' />
                    <p className='text-sm'>ไม่มีไฟล์เอกสาร</p>
                  </div>
                )}
              </div>

              {/* Decision panel */}
              <div className='p-6 space-y-4'>
                <div>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>
                    สถานะปัจจุบัน
                  </p>
                  {(() => {
                    const vs = certReview.verify_status?.trim();
                    const meta =
                      vs === 'AP'
                        ? { label: 'อนุมัติแล้ว', cls: 'bg-emerald-100 text-emerald-700' }
                        : vs === 'RJ'
                          ? { label: 'ปฏิเสธ', cls: 'bg-red-100 text-red-600' }
                          : { label: 'รอตรวจสอบ', cls: 'bg-amber-100 text-amber-700' };
                    return (
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${meta.cls}`}>
                        {meta.label}
                      </span>
                    );
                  })()}
                </div>

                {canApprove && (
                  <div className='space-y-2 pt-2'>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                      ตัดสินใจ
                    </p>
                    {certReview.verify_status?.trim() !== 'AP' && (
                      <Button
                        variant='unstyled'
                        type='button'
                        disabled={certUpdating === certReview.map_id}
                        onClick={() => handlePatchCert(certReview.map_id, 'AP')}
                        className='w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60'
                      >
                        {certUpdating === certReview.map_id ? (
                          <Loader2 size={14} className='animate-spin' />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        อนุมัติใบรับรองนี้
                      </Button>
                    )}
                    {certReview.verify_status?.trim() !== 'RJ' && (
                      <Button
                        variant='unstyled'
                        type='button'
                        disabled={certUpdating === certReview.map_id}
                        onClick={() => handlePatchCert(certReview.map_id, 'RJ')}
                        className='w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-60'
                      >
                        {certUpdating === certReview.map_id ? (
                          <Loader2 size={14} className='animate-spin' />
                        ) : (
                          <XCircle size={14} />
                        )}
                        ปฏิเสธใบรับรองนี้
                      </Button>
                    )}
                    {certReview.verify_status?.trim() !== 'PE' && (
                      <Button
                        variant='unstyled'
                        type='button'
                        disabled={certUpdating === certReview.map_id}
                        onClick={() => handlePatchCert(certReview.map_id, 'PE')}
                        className='w-full flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-60'
                      >
                        รีเซ็ตเป็นรอตรวจสอบ
                      </Button>
                    )}
                  </div>
                )}

                <button
                  type='button'
                  onClick={() => setCertReview(null)}
                  className='w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors'
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    <div className='flex items-start gap-3'>
      <Icon size={15} className='text-slate-400 mt-0.5 shrink-0' />
      <div>
        <p className='text-xs text-slate-500 font-semibold'>{label}</p>
        <p className='text-sm text-slate-900 font-medium'>{value || '-'}</p>
      </div>
    </div>
  );
}

type AdminBadgeVariant = NonNullable<React.ComponentProps<typeof Badge>['variant']>;

const ORDER_SLIP_STATUS: Record<string, { label: string; variant: AdminBadgeVariant }> = {
  PE: { label: 'รอสลีป', variant: 'pending' },
  ST: { label: 'รอตรวจสอบ', variant: 'info' },
  AP: { label: 'อนุมัติแล้ว', variant: 'success' },
  RJ: { label: 'ปฏิเสธ', variant: 'error' },
};

const ORDER_STATUS: Record<string, { label: string; variant: AdminBadgeVariant }> = {
  WS: { label: 'รอแนบสลิป', variant: 'pending' },
  WA: { label: 'รอยืนยันสลิป', variant: 'warning' },
  PP: { label: 'รอชำระเงิน', variant: 'pending' },
  PD: { label: 'ชำระแล้ว', variant: 'info' },
  PR: { label: 'กำลังผลิต', variant: 'active' },
  SH: { label: 'จัดส่งแล้ว', variant: 'info' },
  CP: { label: 'เสร็จสิ้น', variant: 'success' },
  CN: { label: 'ยกเลิกออเดอร์', variant: 'error' },
  CC: { label: 'ยกเลิกออเดอร์', variant: 'error' },
  CL: { label: 'ยกเลิกออเดอร์', variant: 'error' },
  RJ: { label: 'ขอคืนเงิน', variant: 'warning' },
};

const ORDERS_LIMIT = 20;

function FactoryOrdersTab({ factoryId }: { factoryId: number }) {
  const [orders, setOrders] = useState<IAdminOrderListResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSlip, setExpandedSlip] = useState<number | null>(null);

  useEffect(() => {
    if (!factoryId) return;
    setLoading(true);
    adminApi
      .listOrders({ factory_id: factoryId, page, page_size: ORDERS_LIMIT })
      .then((res: unknown) => {
        const r = res as {
          data?: IAdminOrderListResponse[];
          orders?: IAdminOrderListResponse[];
          pagination?: { total?: number };
          total?: number;
        };
        const list = Array.isArray(res)
          ? (res as IAdminOrderListResponse[])
          : (r.data ?? r.orders ?? []);
        const tot = Array.isArray(res)
          ? (res as IAdminOrderListResponse[]).length
          : (r.pagination?.total ?? r.total ?? list.length);
        setOrders(list);
        setTotal(tot);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'โหลด orders ไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [factoryId, page]);

  const totalPages = Math.ceil(total / ORDERS_LIMIT);

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
      <AdminTableContainer>
        <AdminTable>
          <AdminTableHeader>
            <AdminTableRow>
              <AdminTableHead>Order</AdminTableHead>
              <AdminTableHead>RFQ</AdminTableHead>
              <AdminTableHead>ลูกค้า</AdminTableHead>
              <AdminTableHead className='text-right'>ยอดรวม</AdminTableHead>
              <AdminTableHead className='text-center'>สถานะ Order</AdminTableHead>
              <AdminTableHead className='text-center'>สลิป</AdminTableHead>
              <AdminTableHead>วันที่</AdminTableHead>
            </AdminTableRow>
          </AdminTableHeader>
          <AdminTableBody className='divide-y divide-slate-50'>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <AdminTableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <AdminTableCell key={j}>
                      <div className='h-4 bg-slate-100 rounded animate-pulse' />
                    </AdminTableCell>
                  ))}
                </AdminTableRow>
              ))
            ) : orders.length === 0 ? (
              <AdminTableRow>
                <AdminTableCell colSpan={7} className='py-10 text-center text-sm text-slate-400'>
                  ยังไม่มี Order
                </AdminTableCell>
              </AdminTableRow>
            ) : (
              orders.map((o) => {
                const slipStatus = o.slip_status ?? '';
                const slipSt = ORDER_SLIP_STATUS[slipStatus] ?? {
                  label: slipStatus || '—',
                  variant: 'inactive' as const,
                };
                const orderStatus = o.status ?? '';
                const ordSt = ORDER_STATUS[orderStatus] ?? {
                  label: orderStatus || '—',
                  variant: 'inactive' as const,
                };
                const grandTotal =
                  pickScalarNumber(o.grand_total) ?? pickScalarNumber(o.total_amount) ?? 0;
                const slipUrl = o.slip_url;
                const isExpanded = expandedSlip === o.order_id;
                return (
                  <React.Fragment key={o.order_id}>
                    <AdminTableRow>
                      <AdminTableCell>
                        <Link
                          to={`/admin/orders/${o.order_id}`}
                          className='text-indigo-600 font-semibold text-xs hover:underline'
                        >
                          #{o.order_id}
                        </Link>
                      </AdminTableCell>
                      <AdminTableCell className='text-xs text-slate-700 max-w-[180px] truncate'>
                        {o.rfq_title || '—'}
                      </AdminTableCell>
                      <AdminTableCell className='text-xs text-slate-500'>
                        {o.customer_name || '—'}
                      </AdminTableCell>
                      <AdminTableCell className='text-right font-semibold tabular-nums text-xs'>
                        {formatCurrencyNoDecimals(grandTotal)}
                      </AdminTableCell>
                      <AdminTableCell className='text-center'>
                        <Badge variant={ordSt.variant} size='sm'>
                          {ordSt.label}
                        </Badge>
                      </AdminTableCell>
                      <AdminTableCell className='text-center'>
                        {slipUrl ? (
                          <button
                            type='button'
                            onClick={() => setExpandedSlip(isExpanded ? null : o.order_id)}
                            className='text-xs text-indigo-600 hover:underline inline-flex items-center gap-1 mx-auto'
                          >
                            <Badge variant={slipSt.variant} size='sm'>
                              {slipSt.label}
                            </Badge>
                            <span>{isExpanded ? '▲' : '▼'}</span>
                          </button>
                        ) : (
                          <Badge variant={slipSt.variant} size='sm'>
                            {slipSt.label}
                          </Badge>
                        )}
                      </AdminTableCell>
                      <AdminTableCell className='text-xs text-slate-400'>
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('th-TH') : '—'}
                      </AdminTableCell>
                    </AdminTableRow>
                    {isExpanded && slipUrl && (
                      <AdminTableRow className='hover:bg-slate-50'>
                        <AdminTableCell colSpan={7} className='px-6 pb-4 bg-slate-50'>
                          <img
                            src={slipUrl}
                            alt='สลีปการชำระเงิน'
                            className='max-h-64 rounded-lg border border-slate-200 object-contain'
                          />
                        </AdminTableCell>
                      </AdminTableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </AdminTableBody>
        </AdminTable>
      </AdminTableContainer>

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
