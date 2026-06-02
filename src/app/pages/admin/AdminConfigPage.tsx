import React, { useEffect, useMemo, useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const RANK: Record<string, number> = { AM: 1, AD: 2, SA: 3 };
function canEdit(role: string, minRole: 'AM' | 'AD' | 'SA'): boolean {
  return (RANK[role] ?? 0) >= RANK[minRole];
}

type TabKey = 'general' | 'commission' | 'configpackages' | 'verification';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'general', label: 'ทั่วไป' },
  { key: 'commission', label: 'ค่าคอม & VAT' },
  { key: 'configpackages', label: 'Config Packages' },
  { key: 'verification', label: 'การยืนยันโรงงาน' },
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
      className='flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50'
    >
      <Save size={14} />
      {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว ✓' : (text ?? 'บันทึก')}
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
      const created = await adminConfigApi.createConfig({
        label: values.label.trim(),
        default_commission_rate: commission,
        vat_rate: Number.isFinite(vat) ? vat : 7,
        currency_code: 'THB',
        effective_to: values.effective_to || null,
      });
      setConfigs((prev) => [...prev, created]);
      newConfigForm.reset({
        label: '',
        default_commission_rate: '',
        vat_rate: '7',
        effective_to: '',
      });
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
    <div className='space-y-6'>
      <div>
        <p className='text-xs text-slate-400 font-medium'>Admin / ตั้งค่า</p>
        <h2 className='text-2xl font-bold text-slate-900 mt-1'>ตั้งค่าระบบ</h2>
      </div>

      {error ? (
        <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2'>
          <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
          <span>{error}</span>
        </div>
      ) : null}

      <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
        <div className='flex border-b border-slate-200 overflow-x-auto'>
          {TABS.map((tab) => (
            <Button
              variant='unstyled'
              key={tab.key}
              type='button'
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
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
            <Form {...generalForm}>
              <div className='space-y-5 max-w-lg'>
                {!isSA ? (
                  <div className='text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5'>
                    เฉพาะ Super Admin เท่านั้นที่แก้ไขการตั้งค่าทั่วไปได้
                  </div>
                ) : null}

                <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>ข้อมูลแพลตฟอร์ม</p>

                <FormField
                  control={generalForm.control}
                  name='platform_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-semibold text-slate-700'>
                        ชื่อแพลตฟอร์ม
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isSA}
                          className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50'
                        />
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
                      <FormLabel className='text-xs font-semibold text-slate-700'>
                        อีเมลติดต่อ
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type='email'
                          disabled={!isSA}
                          className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50'
                        />
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
                      <FormLabel className='text-xs font-semibold text-slate-700'>
                        โทรศัพท์สนับสนุน
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isSA}
                          className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='border-t border-slate-100 pt-4'>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4'>การตั้งค่าระบบ</p>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <FormField
                      control={generalForm.control}
                      name='rfq_expired'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs font-semibold text-slate-700'>
                            อายุ RFQ (วัน)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type='number'
                              min={1}
                              step={1}
                              disabled={!isSA}
                              placeholder='30'
                              className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50'
                            />
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
                          <FormLabel className='text-xs font-semibold text-slate-700'>
                            เวลาจัดส่ง Default (วัน)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type='number'
                              min={1}
                              step={1}
                              disabled={!isSA}
                              placeholder='7'
                              className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {isSA ? (
                  <SaveButton
                    saving={savingGeneral}
                    saved={savedGeneral}
                    onClick={() => void onSaveGeneral()}
                    text='บันทึกการตั้งค่าทั่วไป'
                  />
                ) : null}
              </div>
            </Form>
          ) : null}

          {!loading && activeTab === 'commission' ? (
            <div className='max-w-xl space-y-5'>
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
                        className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50'
                      >
                        {savingDefault ? (
                          <><Loader2 size={12} className='animate-spin' /> กำลังบันทึก…</>
                        ) : savedDefault ? (
                          <><CheckCircle size={12} /> บันทึกแล้ว ✓</>
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
              <div className='flex items-center justify-between py-2.5 border-b border-slate-100'>
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
                <div className='space-y-3'>
                  <div className='flex items-center justify-between py-2 border-b border-slate-100'>
                    <span className='text-xs font-semibold text-slate-500'>ค่าคอมมิชชัน</span>
                    <span className='text-sm font-bold text-indigo-700 tabular-nums'>
                      {pickScalarString(defaultCommConfig?.default_commission_rate) || '—'}%
                    </span>
                  </div>
                  <div className='flex items-center justify-between py-2 border-b border-slate-100'>
                    <span className='text-xs font-semibold text-slate-500'>VAT</span>
                    <span className='text-sm font-semibold text-slate-700 tabular-nums'>
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

              <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
                <Table className='w-full text-sm min-w-[680px]'>
                  <TableHeader>
                    <TableRow className='bg-slate-50 border-b border-slate-200'>
                      <TableHead className='text-left px-4 py-2.5 text-xs font-semibold text-slate-500'>
                        ID
                      </TableHead>
                      <TableHead className='text-left px-4 py-2.5 text-xs font-semibold text-slate-500'>
                        ชื่อ Config
                      </TableHead>
                      <TableHead className='text-right px-4 py-2.5 text-xs font-semibold text-slate-500'>
                        คอม
                      </TableHead>
                      <TableHead className='text-right px-4 py-2.5 text-xs font-semibold text-slate-500'>
                        VAT
                      </TableHead>
                      <TableHead className='text-left px-4 py-2.5 text-xs font-semibold text-slate-500'>
                        หมดอายุ
                      </TableHead>
                      <TableHead className='text-right px-4 py-2.5 text-xs font-semibold text-slate-500'>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className='divide-y divide-slate-100'>
                    {sortedConfigs.map((cfg) => {
                      const isDefault = cfg.config_id === defaultCommConfig?.config_id;
                      return (
                        <TableRow key={cfg.config_id} className='hover:bg-slate-50'>
                          <TableCell className='px-4 py-3 text-xs text-slate-500'>
                            #{cfg.config_id}
                          </TableCell>
                          <TableCell className='px-4 py-3 text-sm font-medium text-slate-900'>
                            {configLabel(cfg)}{' '}
                            {isDefault ? <Lock size={12} className='inline text-slate-400' /> : null}
                          </TableCell>
                          <TableCell className='px-4 py-3 text-sm text-right tabular-nums text-indigo-700 font-bold'>
                            {formatCompactNumber(
                              pickScalarNumber(cfg.default_commission_rate) ?? 0,
                            )}
                            %
                          </TableCell>
                          <TableCell className='px-4 py-3 text-sm text-right tabular-nums'>
                            {formatCompactNumber(pickScalarNumber(cfg.vat_rate) ?? 0)}%
                          </TableCell>
                          <TableCell className='px-4 py-3 text-xs text-slate-500'>
                            {fmtDate(cfg.effective_to)}
                          </TableCell>
                          <TableCell className='px-4 py-3 text-right'>
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
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {isSA ? (
                <Form {...newConfigForm}>
                  <div className='bg-slate-50 rounded-xl border border-slate-200 p-4'>
                    <p className='text-xs font-semibold text-slate-700 mb-3'>
                      เพิ่ม Config พิเศษใหม่
                    </p>
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
                      className='mt-3 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40'
                    >
                      <Plus size={14} />
                      {savingConfig ? 'กำลังเพิ่ม...' : 'เพิ่ม Config พิเศษ'}
                    </Button>
                  </div>
                </Form>
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
                          <CheckSquare size={18} className='text-indigo-600 shrink-0' />
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
                      saved={savedVerification}
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
        </div>
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
        className='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50'
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
          className='w-full border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50'
        />
        <Percent size={12} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400' />
      </div>
    </div>
  );
}
