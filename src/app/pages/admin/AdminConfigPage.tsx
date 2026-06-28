import React, { useEffect, useMemo, useState } from 'react';
import { httpClient } from '@/services/api/httpClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CheckCircle, CheckSquare, Lock, Loader2, Pencil, Percent, Plus, Save, Square, Trash2, X } from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import { adminConfigApi, adminTConfigApi } from '@/services/api/adminApi';
import type {
  IPlatformConfigItemResponse,
  IUpdatePlatformConfigRequest,
} from '@/services/api/types/admin.types';
import {
  adminDefaultCommissionSchema,
  adminGeneralConfigSchema,
  adminNewConfigSchema,
  type AdminDefaultCommissionFormValues,
  type AdminGeneralConfigFormValues,
  type AdminNewConfigFormValues,
} from '@/domain/admin/schemas/adminConfig.schema';
import { formatCompactNumber } from '@/utils/formatting/formatCurrency';
import { formatDate } from '@/utils/formatting/formatDate';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableContainer,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/AdminTable';

const RANK: Record<string, number> = { AM: 1, AD: 2, SA: 3 };
function canEdit(role: string, minRole: 'AM' | 'AD' | 'SA'): boolean {
  return (RANK[role] ?? 0) >= RANK[minRole];
}

type TabKey = 'general' | 'commission' | 'configpackages' | 'verification' | 'cronjob';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'general', label: 'ทั่วไป' },
  { key: 'commission', label: 'ค่าคอม & VAT' },
  { key: 'configpackages', label: 'Config Packages' },
  { key: 'verification', label: 'การยืนยันโรงงาน' },
  { key: 'cronjob', label: 'Cronjob' },
];

interface VerificationRequirement {
  id: string;
  label: string;
  enabled: boolean;
}

const DEFAULT_REQUIREMENTS: VerificationRequirement[] = [
  { id: 'dbd', label: 'ต้องมีเอกสาร DBD', enabled: true },
  { id: 'photo', label: 'ต้องมีรูปถ่ายโรงงาน', enabled: true },
  { id: 'email', label: 'ต้องยืนยัน email', enabled: true },
  { id: 'iso', label: 'ต้องมี ISO certificate', enabled: false },
  { id: 'address', label: 'ต้องมีที่อยู่จดทะเบียน', enabled: true },
];

function parseVerifyRequirements(raw: string | undefined): VerificationRequirement[] {
  if (!raw) return DEFAULT_REQUIREMENTS;
  try {
    const parsed = JSON.parse(raw) as VerificationRequirement[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore
  }
  return DEFAULT_REQUIREMENTS;
}

function configLabel(cfg: IPlatformConfigItemResponse): string {
  if (cfg.label && cfg.label.trim()) return cfg.label;
  return `Commission ${cfg.default_commission_rate}% / VAT ${cfg.vat_rate}%`;
}

function fmtDate(input?: string | null): string {
  if (!input) return '—';
  return formatDate(input);
}

function SaveButton({
  saving,
  saved,
  disabled,
  onClick,
  text,
}: {
  saving: boolean;
  saved: boolean;
  disabled?: boolean;
  onClick: () => void;
  text?: string;
}) {
  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={onClick}
      disabled={saving || disabled}
      className='flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50'
    >
      <Save size={14} />
      {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : (text ?? 'บันทึก')}
    </Button>
  );
}

export function AdminConfigPage() {
  const { user } = useAuth();
  const role = pickScalarString(user?.role);
  const isSA = canEdit(role, 'SA');

  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const generalForm = useForm<AdminGeneralConfigFormValues>({
    resolver: zodResolver(adminGeneralConfigSchema),
    defaultValues: {
      platform_name: '',
      contact_email: '',
      support_phone: '',
      rfq_expired: '',
      shipping_days: '',
    },
  });
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savedGeneral, setSavedGeneral] = useState(false);

  // Commission tab: dedicated state from platform_config WHERE label = 'default_comm'
  const [defaultCommConfig, setDefaultCommConfig] = useState<IPlatformConfigItemResponse | null>(null);
  const [isEditingCommission, setIsEditingCommission] = useState(false);
  const defaultCommissionForm = useForm<AdminDefaultCommissionFormValues>({
    resolver: zodResolver(adminDefaultCommissionSchema),
    defaultValues: { commission: '', vat: '' },
  });
  const [savingDefault, setSavingDefault] = useState(false);
  const [savedDefault, setSavedDefault] = useState(false);

  // Config Packages tab: all platform_config rows
  const [configs, setConfigs] = useState<IPlatformConfigItemResponse[]>([]);
  const newConfigForm = useForm<AdminNewConfigFormValues>({
    resolver: zodResolver(adminNewConfigSchema),
    defaultValues: {
      label: '',
      default_commission_rate: '',
      vat_rate: '7',
      effective_to: '',
    },
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [showNewConfigForm, setShowNewConfigForm] = useState(false);

  const [savingVerification, setSavingVerification] = useState(false);
  const [savedVerification, setSavedVerification] = useState(false);
  const [requirements, setRequirements] = useState<VerificationRequirement[]>(DEFAULT_REQUIREMENTS);

  const sortedConfigs = useMemo(
    () => [...configs].sort((a, b) => a.config_id - b.config_id),
    [configs],
  );

  // Seed commission form whenever the dedicated default_comm config changes
  useEffect(() => {
    if (!defaultCommConfig) return;
    defaultCommissionForm.reset({
      commission: pickScalarString(defaultCommConfig.default_commission_rate),
      vat: pickScalarString(defaultCommConfig.vat_rate),
    });
  }, [defaultCommConfig, defaultCommissionForm]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [defaultCommRes, configsRes, tconfigRes] = await Promise.all([
        adminConfigApi.getDefaultComm(),   // platform_config WHERE label = 'default_comm'
        adminConfigApi.listConfigs(),       // all platform_config rows for Packages tab
        adminTConfigApi.getAll(),           // tconfig key-value pairs
      ]);

      setDefaultCommConfig(defaultCommRes);
      setConfigs(Array.isArray(configsRes.configs) ? configsRes.configs : []);

      const tc = tconfigRes.configs ?? {};
      generalForm.reset({
        platform_name: tc['platform_name'] ?? '',
        contact_email: tc['contact_email'] ?? '',
        support_phone: tc['support_phone'] ?? '',
        rfq_expired: tc['rfq_expired'] ?? '',
        shipping_days: tc['shipping_days'] ?? '',
      });
      setRequirements(parseVerifyRequirements(tc['verify_requirements']));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดการตั้งค่าไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSaveGeneral = generalForm.handleSubmit(async (values) => {
    if (!isSA) return;
    setSavingGeneral(true);
    setError('');
    try {
      const payload: Record<string, string> = {
        platform_name: values.platform_name,
        contact_email: values.contact_email,
        support_phone: values.support_phone,
      };
      if (values.rfq_expired) payload['rfq_expired'] = values.rfq_expired;
      if (values.shipping_days) payload['shipping_days'] = values.shipping_days;
      await adminTConfigApi.patchBulk(payload);
      setIsEditingGeneral(false);
      setSavedGeneral(true);
      setTimeout(() => setSavedGeneral(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกการตั้งค่าทั่วไปไม่สำเร็จ');
    } finally {
      setSavingGeneral(false);
    }
  });

  const handleSaveDefault = defaultCommissionForm.handleSubmit(async (values) => {
    if (!isSA || !defaultCommConfig) return;
    setSavingDefault(true);
    setError('');
    try {
      const payload: IUpdatePlatformConfigRequest = {
        label: String(defaultCommConfig.label ?? 'default_comm'), // label is locked — never changed
        default_commission_rate: pickScalarNumber(values.commission) ?? 0,
        vat_rate: pickScalarNumber(values.vat) ?? 0,
      };
      // PATCH platform_config WHERE config_id = defaultCommConfig.config_id
      await adminConfigApi.updateConfig(defaultCommConfig.config_id, payload);
      // Re-fetch from the dedicated endpoint to confirm the saved state
      const refreshed = await adminConfigApi.getDefaultComm();
      setDefaultCommConfig(refreshed);
      // Also sync configs list so Config Packages tab stays consistent
      setConfigs((prev) =>
        prev.map((c) => (c.config_id === refreshed.config_id ? refreshed : c)),
      );
      setIsEditingCommission(false);
      setSavedDefault(true);
      setTimeout(() => setSavedDefault(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึก config มาตรฐานไม่สำเร็จ');
    } finally {
      setSavingDefault(false);
    }
  });

  const handleCreateConfig = newConfigForm.handleSubmit(async (values) => {
    if (!isSA) return;
    const commission = pickScalarNumber(values.default_commission_rate) ?? 0;
    const vat = pickScalarNumber(values.vat_rate, '7') ?? 7;

    setSavingConfig(true);
    setError('');
    try {
      // BE expects RFC3339 datetime — convert YYYY-MM-DD → YYYY-MM-DDT00:00:00Z
      const effectiveTo = values.effective_to
        ? `${values.effective_to}T00:00:00Z`
        : null;
      const created = await adminConfigApi.createConfig({
        label: values.label.trim(),
        default_commission_rate: commission,
        vat_rate: Number.isFinite(vat) ? vat : 7,
        currency_code: 'THB',
        effective_to: effectiveTo,
      });
      setConfigs((prev) => [...prev, created]);
      newConfigForm.reset({
        label: '',
        default_commission_rate: '',
        vat_rate: '7',
        effective_to: '',
      });
      setShowNewConfigForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'สร้าง config พิเศษไม่สำเร็จ');
    } finally {
      setSavingConfig(false);
    }
  });

  const handleDeleteConfig = async (configId: number) => {
    if (!isSA || configId === defaultCommConfig?.config_id) return;
    setError('');
    try {
      await adminConfigApi.deleteConfig(configId);
      setConfigs((prev) => prev.filter((c) => c.config_id !== configId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบ config ไม่สำเร็จ');
    }
  };

  const handleSaveVerification = async () => {
    if (!isSA) return;
    setSavingVerification(true);
    setError('');
    try {
      await adminTConfigApi.patchBulk({
        verify_requirements: JSON.stringify(requirements),
      });
      setSavedVerification(true);
      setTimeout(() => setSavedVerification(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกเงื่อนไขการยืนยันไม่สำเร็จ');
    } finally {
      setSavingVerification(false);
    }
  };

  return (
    <div className='space-y-6 lg:space-y-8'>
      <div>
        <h2 className='text-2xl lg:text-3xl font-bold text-slate-900'>ตั้งค่าระบบ</h2>
      </div>

      {error ? (
        <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2'>
          <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
          <span>{error}</span>
        </div>
      ) : null}

      <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
        <div className='flex border-b border-slate-200 overflow-x-auto'>
          {TABS.map((tab) => (
            <Button
              variant='unstyled'
              key={tab.key}
              type='button'
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-purple-600 text-purple-700 bg-purple-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className='p-6'>
          {loading ? <p className='text-sm text-slate-500'>กำลังโหลดการตั้งค่า...</p> : null}

          {!loading && activeTab === 'general' ? (
            <div className='w-full space-y-5'>
              {/* Header row: title + Edit / Cancel+Save buttons */}
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <h4 className='text-sm font-bold text-slate-900'>การตั้งค่าทั่วไป</h4>
                  <p className='text-xs text-slate-400 mt-1'>ชื่อแพลตฟอร์ม ช่องทางติดต่อ และค่า default ของระบบ</p>
                </div>
                {isSA ? (
                  isEditingGeneral ? (
                    <div className='flex items-center gap-2 shrink-0'>
                      <Button
                        variant='unstyled'
                        type='button'
                        disabled={savingGeneral}
                        onClick={() => {
                          generalForm.reset();
                          setIsEditingGeneral(false);
                          setError('');
                        }}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors'
                      >
                        <X size={12} />
                        ยกเลิก
                      </Button>
                      <Button
                        variant='unstyled'
                        type='button'
                        disabled={savingGeneral}
                        onClick={() => void onSaveGeneral()}
                        className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50'
                      >
                        {savingGeneral ? (
                          <><Loader2 size={12} className='animate-spin' /> กำลังบันทึก…</>
                        ) : savedGeneral ? (
                          <><CheckCircle size={12} /> บันทึกแล้ว</>
                        ) : (
                          <><CheckCircle size={12} /> บันทึก</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() => { setIsEditingGeneral(true); setError(''); }}
                      className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shrink-0'
                    >
                      <Pencil size={12} />
                      Edit
                    </Button>
                  )
                ) : (
                  <div className='text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 shrink-0'>
                    เฉพาะ SA เท่านั้น
                  </div>
                )}
              </div>

              {/* View mode */}
              {!isEditingGeneral ? (
                <div className='space-y-5'>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3'>ข้อมูลแพลตฟอร์ม</p>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    {[
                      { label: 'ชื่อแพลตฟอร์ม', value: generalForm.getValues('platform_name') },
                      { label: 'อีเมลติดต่อ',   value: generalForm.getValues('contact_email') },
                      { label: 'โทรศัพท์สนับสนุน', value: generalForm.getValues('support_phone') },
                    ].map(({ label, value }) => (
                      <div key={label} className='rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3'>
                        <span className='block text-xs font-semibold text-slate-500'>{label}</span>
                        <span className='mt-1 block text-sm text-slate-800 break-words'>{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3'>การตั้งค่าระบบ</p>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {[
                        { label: 'อายุ RFQ (วัน)',           value: generalForm.getValues('rfq_expired'),   unit: 'วัน' },
                        { label: 'เวลาจัดส่ง Default (วัน)', value: generalForm.getValues('shipping_days'), unit: 'วัน' },
                      ].map(({ label, value, unit }) => (
                        <div key={label} className='rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3'>
                          <span className='block text-xs font-semibold text-slate-500'>{label}</span>
                          <span className='mt-1 block text-sm font-semibold text-slate-800 tabular-nums'>
                            {value ? `${value} ${unit}` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Edit mode */
                <Form {...generalForm}>
                  <div className='space-y-4'>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>ข้อมูลแพลตฟอร์ม</p>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <FormField
                        control={generalForm.control}
                        name='platform_name'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs font-semibold text-slate-700'>ชื่อแพลตฟอร์ม</FormLabel>
                            <FormControl>
                              <Input {...field} className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm' />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={generalForm.control}
                        name='contact_email'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs font-semibold text-slate-700'>อีเมลติดต่อ</FormLabel>
                            <FormControl>
                              <Input {...field} type='email' className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm' />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={generalForm.control}
                        name='support_phone'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs font-semibold text-slate-700'>โทรศัพท์สนับสนุน</FormLabel>
                            <FormControl>
                              <Input {...field} className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm' />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className='border-t border-slate-100 pt-3'>
                      <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3'>การตั้งค่าระบบ</p>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <FormField
                          control={generalForm.control}
                          name='rfq_expired'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs font-semibold text-slate-700'>อายุ RFQ (วัน)</FormLabel>
                              <FormControl>
                                <Input {...field} type='number' min={1} step={1} placeholder='30'
                                  className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm' />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={generalForm.control}
                          name='shipping_days'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs font-semibold text-slate-700'>เวลาจัดส่ง Default (วัน)</FormLabel>
                              <FormControl>
                                <Input {...field} type='number' min={1} step={1} placeholder='7'
                                  className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm' />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </Form>
              )}
            </div>
          ) : null}

          {!loading && activeTab === 'commission' ? (
            <div className='w-full space-y-5'>
              {/* Header row: title + Edit / Cancel+Save buttons */}
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <h4 className='text-sm font-bold text-slate-900'>
                    ค่าคอม & VAT — Config มาตรฐาน
                  </h4>
                  <p className='text-xs text-slate-400 mt-1'>
                    อัตรานี้ใช้กับโรงงานที่ไม่ได้รับ Config พิเศษ
                  </p>
                </div>
                {isSA ? (
                  isEditingCommission ? (
                    <div className='flex items-center gap-2 shrink-0'>
                      <Button
                        variant='unstyled'
                        type='button'
                        disabled={savingDefault}
                        onClick={() => {
                          defaultCommissionForm.reset({
                            commission: pickScalarString(defaultCommConfig?.default_commission_rate),
                            vat: pickScalarString(defaultCommConfig?.vat_rate),
                          });
                          setIsEditingCommission(false);
                          setError('');
                        }}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors'
                      >
                        <X size={12} />
                        ยกเลิก
                      </Button>
                      <Button
                        variant='unstyled'
                        type='button'
                        disabled={savingDefault || !defaultCommConfig}
                        onClick={() => void handleSaveDefault()}
                        className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50'
                      >
                        {savingDefault ? (
                          <><Loader2 size={12} className='animate-spin' /> กำลังบันทึก…</>
                        ) : savedDefault ? (
                          <><CheckCircle size={12} /> บันทึกแล้ว</>
                        ) : (
                          <><CheckCircle size={12} /> บันทึก</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() => { setIsEditingCommission(true); setError(''); }}
                      className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shrink-0'
                    >
                      <Pencil size={12} />
                      Edit
                    </Button>
                  )
                ) : (
                  <div className='text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5'>
                    เฉพาะ SA เท่านั้น
                  </div>
                )}
              </div>

              {/* Config name row — always read-only (locked) */}
              <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3'>
                <span className='text-xs font-semibold text-slate-500'>ชื่อ Config</span>
                <div className='flex items-center gap-1.5 text-sm font-medium text-slate-700'>
                  <span className='font-mono text-xs bg-slate-100 px-2 py-0.5 rounded'>
                    {String(defaultCommConfig?.label ?? 'default_comm')}
                  </span>
                  <Lock size={12} className='text-slate-400' />
                </div>
              </div>

              {/* View mode */}
              {!isEditingCommission ? (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='rounded-xl border border-purple-100 bg-purple-50/60 px-4 py-3'>
                    <span className='block text-xs font-semibold text-slate-500'>ค่าคอมมิชชัน</span>
                    <span className='mt-1 block text-lg font-bold text-purple-700 tabular-nums'>
                      {pickScalarString(defaultCommConfig?.default_commission_rate) || '—'}%
                    </span>
                  </div>
                  <div className='rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3'>
                    <span className='block text-xs font-semibold text-slate-500'>VAT</span>
                    <span className='mt-1 block text-lg font-semibold text-slate-700 tabular-nums'>
                      {pickScalarString(defaultCommConfig?.vat_rate) || '—'}%
                    </span>
                  </div>
                </div>
              ) : (
                /* Edit mode */
                <Form {...defaultCommissionForm}>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <FormField
                      control={defaultCommissionForm.control}
                      name='commission'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs font-semibold text-slate-700'>
                            ค่าคอมมิชชัน (%)
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Input
                                {...field}
                                type='number'
                                min={0}
                                max={100}
                                step={0.1}
                                className='w-full border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm'
                              />
                              <Percent
                                size={12}
                                className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400'
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={defaultCommissionForm.control}
                      name='vat'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs font-semibold text-slate-700'>
                            VAT (%)
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Input
                                {...field}
                                type='number'
                                min={0}
                                max={100}
                                step={0.1}
                                className='w-full border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm'
                              />
                              <Percent
                                size={12}
                                className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400'
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              )}
            </div>
          ) : null}

          {!loading && activeTab === 'configpackages' ? (
            <div className='space-y-6'>
              <div>
                <h4 className='text-sm font-bold text-slate-900 mb-1'>Config Packages</h4>
                <p className='text-xs text-slate-400'>
                  กำหนดชุดอัตราค่าคอม/VAT สำหรับกำหนดให้โรงงานรายโรง
                </p>
              </div>

              <AdminTableContainer>
                <AdminTable className='min-w-[680px]'>
                  <AdminTableHeader>
                    <AdminTableRow>
                      <AdminTableHead>
                        ID
                      </AdminTableHead>
                      <AdminTableHead>
                        ชื่อ Config
                      </AdminTableHead>
                      <AdminTableHead className='text-right px-4 py-2.5 text-xs font-semibold text-slate-500'>
                        คอม
                      </AdminTableHead>
                      <AdminTableHead className='text-right px-4 py-2.5 text-xs font-semibold text-slate-500'>
                        VAT
                      </AdminTableHead>
                      <AdminTableHead>
                        หมดอายุ
                      </AdminTableHead>
                      <AdminTableHead className='text-right px-4 py-2.5 text-xs font-semibold text-slate-500'>
                        Actions
                      </AdminTableHead>
                    </AdminTableRow>
                  </AdminTableHeader>
                  <AdminTableBody className='divide-y divide-slate-100'>
                    {sortedConfigs.map((cfg) => {
                      const isDefault = cfg.config_id === defaultCommConfig?.config_id;
                      return (
                        <AdminTableRow key={cfg.config_id} className='hover:bg-slate-50'>
                          <AdminTableCell className='px-4 py-3 text-xs text-slate-500'>
                            #{cfg.config_id}
                          </AdminTableCell>
                          <AdminTableCell className='px-4 py-3 text-sm font-medium text-slate-900'>
                            {configLabel(cfg)}{' '}
                            {isDefault ? <Lock size={12} className='inline text-slate-400' /> : null}
                          </AdminTableCell>
                          <AdminTableCell className='px-4 py-3 text-sm text-right tabular-nums text-purple-700 font-bold'>
                            {formatCompactNumber(
                              pickScalarNumber(cfg.default_commission_rate) ?? 0,
                            )}
                            %
                          </AdminTableCell>
                          <AdminTableCell className='px-4 py-3 text-sm text-right tabular-nums'>
                            {formatCompactNumber(pickScalarNumber(cfg.vat_rate) ?? 0)}%
                          </AdminTableCell>
                          <AdminTableCell className='px-4 py-3 text-xs text-slate-500'>
                            {fmtDate(cfg.effective_to)}
                          </AdminTableCell>
                          <AdminTableCell className='px-4 py-3 text-right'>
                            {!isDefault && isSA ? (
                              <Button
                                variant='unstyled'
                                type='button'
                                onClick={() => void handleDeleteConfig(cfg.config_id)}
                                className='p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors'
                              >
                                <Trash2 size={14} />
                              </Button>
                            ) : (
                              <span className='text-xs text-slate-400'>—</span>
                            )}
                          </AdminTableCell>
                        </AdminTableRow>
                      );
                    })}
                  </AdminTableBody>
                </AdminTable>
              </AdminTableContainer>

              {isSA ? (
                !showNewConfigForm ? (
                  /* Collapsed — show + button only */
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => { setShowNewConfigForm(true); setError(''); }}
                    className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-dashed border-purple-300 text-xs font-semibold text-purple-600 hover:bg-purple-50 transition-colors'
                  >
                    <Plus size={14} />
                    เพิ่ม Config พิเศษ
                  </Button>
                ) : (
                  /* Expanded form */
                  <Form {...newConfigForm}>
                    <div className='bg-slate-50 rounded-xl border border-slate-200 p-4'>
                      <div className='flex items-center justify-between mb-3'>
                        <p className='text-xs font-semibold text-slate-700'>เพิ่ม Config พิเศษใหม่</p>
                        <Button
                          variant='unstyled'
                          type='button'
                          disabled={savingConfig}
                          onClick={() => {
                            newConfigForm.reset({ label: '', default_commission_rate: '', vat_rate: '7', effective_to: '' });
                            setShowNewConfigForm(false);
                            setError('');
                          }}
                          className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-100 transition-colors'
                        >
                          <X size={12} />
                          ยกเลิก
                        </Button>
                      </div>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        <FormField
                          control={newConfigForm.control}
                          name='label'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs font-semibold text-slate-700'>
                                ชื่อ Config
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={newConfigForm.control}
                          name='effective_to'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs font-semibold text-slate-700'>
                                หมดอายุ
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type='date'
                                  className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={newConfigForm.control}
                          name='default_commission_rate'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs font-semibold text-slate-700'>
                                ค่าคอม (%)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type='number'
                                  min={0}
                                  max={100}
                                  step={0.1}
                                  className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={newConfigForm.control}
                          name='vat_rate'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs font-semibold text-slate-700'>
                                VAT (%)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type='number'
                                  min={0}
                                  max={100}
                                  step={0.1}
                                  className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        variant='unstyled'
                        type='button'
                        onClick={() => void handleCreateConfig()}
                        disabled={savingConfig}
                        className='mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-40'
                      >
                        {savingConfig ? (
                          <><Loader2 size={14} className='animate-spin' /> กำลังเพิ่ม…</>
                        ) : (
                          <><Plus size={14} /> เพิ่ม Config</>
                        )}
                      </Button>
                    </div>
                  </Form>
                )
              ) : null}
            </div>
          ) : null}

          {!loading && activeTab === 'verification' ? (
            <div className='space-y-4'>
              <div>
                <h4 className='text-sm font-bold text-slate-900 mb-1'>เงื่อนไขการยืนยันโรงงาน</h4>
                <p className='text-xs text-slate-400 mb-5'>
                  เปิด/ปิดข้อกำหนดที่โรงงานต้องผ่านก่อนได้รับการอนุมัติ
                </p>
                {!isSA ? (
                  <div className='text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4'>
                    เฉพาะ Super Admin เท่านั้นที่แก้ไขเงื่อนไขได้
                  </div>
                ) : null}
                <div className='bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden'>
                  {requirements.map((req) => (
                    <div
                      key={req.id}
                      className={`flex items-center justify-between px-5 py-3.5 transition-colors ${isSA ? 'cursor-pointer hover:bg-slate-50' : 'opacity-60'}`}
                      onClick={() => {
                        if (!isSA) return;
                        setRequirements((prev) =>
                          prev.map((r) => (r.id === req.id ? { ...r, enabled: !r.enabled } : r)),
                        );
                      }}
                    >
                      <div className='flex items-center gap-3'>
                        {req.enabled ? (
                          <CheckSquare size={18} className='text-purple-600 shrink-0' />
                        ) : (
                          <Square size={18} className='text-slate-300 shrink-0' />
                        )}
                        <span
                          className={`text-sm ${req.enabled ? 'text-slate-900 font-medium' : 'text-slate-400'}`}
                        >
                          {req.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className='mt-4 flex items-center gap-3'>
                  {isSA ? (
                    <SaveButton
                      saving={savingVerification}
                      saved={false}
                      onClick={() => void handleSaveVerification()}
                    />
                  ) : null}
                  <p className='text-xs text-slate-400'>
                    เปิดใช้งาน {requirements.filter((r) => r.enabled).length} /{' '}
                    {requirements.length} เงื่อนไข
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === 'cronjob' ? (
            <CronjobTab isSA={isSA} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

type CronJob = {
  job_key: string;
  schedule_type: string;
  schedule_value: string;
  hour: number;
  enabled: boolean;
  description?: string;
  last_run_at?: string;
};

function CronjobTab({ isSA }: { isSA: boolean }) {
  const [jobs, setJobs] = React.useState<CronJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<CronJob | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  useEffect(() => {
    httpClient.get<{ jobs: CronJob[] }>('/admin/cronjobs')
      .then((d) => setJobs((d as { jobs: CronJob[] }).jobs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await httpClient.patch<CronJob>(`/admin/cronjobs/${editing.job_key}`, {
        schedule_type: editing.schedule_type,
        schedule_value: editing.schedule_value,
        hour: editing.hour,
        enabled: editing.enabled,
      });
      setJobs((prev) => prev.map((j) => (j.job_key === updated.job_key ? updated : j)));
      setEditing(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const SCHEDULE_TYPES = [
    { value: 'day_of_month', label: 'ทุกวันที่ X ของเดือน' },
    { value: 'day_of_week', label: 'ทุกวัน X ของสัปดาห์' },
    { value: 'daily', label: 'ทุกวัน' },
  ];
  const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const WEEKDAY_LABELS: Record<string, string> = { MON: 'จันทร์', TUE: 'อังคาร', WED: 'พุธ', THU: 'พฤหัส', FRI: 'ศุกร์', SAT: 'เสาร์', SUN: 'อาทิตย์' };

  const scheduleLabel = (j: CronJob) => {
    if (j.schedule_type === 'daily') return `ทุกวัน เวลา ${j.hour}:00`;
    if (j.schedule_type === 'day_of_week') return `ทุกวัน${WEEKDAY_LABELS[j.schedule_value] ?? j.schedule_value} เวลา ${j.hour}:00`;
    return `ทุกวันที่ ${j.schedule_value} ของเดือน เวลา ${j.hour}:00`;
  };

  if (loading) return <div className='py-8 text-center text-sm text-slate-400'>กำลังโหลด...</div>;

  return (
    <div className='space-y-4'>
      <div>
        <h4 className='text-sm font-bold text-slate-900 mb-1'>ตั้งค่า Cronjob</h4>
        <p className='text-xs text-slate-400 mb-5'>กำหนดเวลารันงานอัตโนมัติ เฉพาะ Super Admin เท่านั้น</p>
      </div>

      {saved && (
        <div className='flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-700'>
          <CheckCircle size={14} /> บันทึกสำเร็จ
        </div>
      )}

      <div className='space-y-3'>
        {jobs.map((j) => (
          <div key={j.job_key} className='rounded-xl border border-slate-200 bg-white p-4'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='text-sm font-semibold text-slate-900'>{j.job_key}</span>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${j.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {j.enabled ? 'เปิด' : 'ปิด'}
                  </span>
                </div>
                {j.description && <p className='text-xs text-slate-500 mb-1'>{j.description}</p>}
                <p className='text-xs text-brand-purple font-medium'>{scheduleLabel(j)}</p>
                {j.last_run_at && (
                  <p className='text-[10px] text-slate-400 mt-1'>รันล่าสุด: {new Date(j.last_run_at).toLocaleString('th-TH')}</p>
                )}
              </div>
              {isSA && (
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => setEditing({ ...j })}
                  className='shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50'
                >
                  <Pencil size={13} className='mr-1 inline' />
                  แก้ไข
                </Button>
              )}
            </div>

            {editing?.job_key === j.job_key && (
              <div className='mt-4 border-t border-slate-100 pt-4 space-y-3'>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <Label className='text-xs font-semibold text-slate-700 mb-1.5 block'>ประเภท</Label>
                    <select
                      value={editing.schedule_type}
                      onChange={(e) => setEditing({ ...editing, schedule_type: e.target.value, schedule_value: e.target.value === 'day_of_week' ? 'MON' : '1' })}
                      className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
                    >
                      {SCHEDULE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className='text-xs font-semibold text-slate-700 mb-1.5 block'>เวลา (ชั่วโมง)</Label>
                    <select
                      value={editing.hour}
                      onChange={(e) => setEditing({ ...editing, hour: Number(e.target.value) })}
                      className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                </div>

                {editing.schedule_type === 'day_of_month' && (
                  <div>
                    <Label className='text-xs font-semibold text-slate-700 mb-1.5 block'>วันที่ของเดือน (1–28)</Label>
                    <Input
                      type='number'
                      min={1}
                      max={28}
                      value={editing.schedule_value}
                      onChange={(e) => setEditing({ ...editing, schedule_value: e.target.value })}
                      className='w-full'
                    />
                  </div>
                )}

                {editing.schedule_type === 'day_of_week' && (
                  <div>
                    <Label className='text-xs font-semibold text-slate-700 mb-1.5 block'>วันของสัปดาห์</Label>
                    <div className='flex flex-wrap gap-2'>
                      {WEEKDAYS.map((wd) => (
                        <button
                          key={wd}
                          type='button'
                          onClick={() => setEditing({ ...editing, schedule_value: wd })}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${editing.schedule_value === wd ? 'bg-brand-purple text-white border-brand-purple' : 'border-slate-200 text-slate-600 hover:border-brand-purple/40'}`}
                        >
                          {WEEKDAY_LABELS[wd]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => setEditing({ ...editing, enabled: !editing.enabled })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${editing.enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${editing.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                  <span className='text-xs text-slate-600'>{editing.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                </div>

                <div className='flex gap-2 pt-1'>
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className='flex items-center gap-1.5 rounded-lg bg-brand-purple px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:bg-brand-violet-deep'
                  >
                    {saving ? <Loader2 size={13} className='animate-spin' /> : <Save size={13} />}
                    บันทึก
                  </Button>
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => setEditing(null)}
                    className='rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50'
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  type = 'text',
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className='block text-xs font-semibold text-slate-700 mb-1.5'>{label}</Label>
      <Input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50'
      />
    </div>
  );
}

function RateField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className='block text-xs font-semibold text-slate-700 mb-1.5'>{label}</Label>
      <div className='relative'>
        <Input
          type='number'
          min={0}
          max={100}
          step={0.1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className='w-full border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50'
        />
        <Percent size={12} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400' />
      </div>
    </div>
  );
}
