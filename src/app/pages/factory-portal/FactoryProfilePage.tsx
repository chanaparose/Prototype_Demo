import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle,
  MapPin,
  Award,
  Landmark,
  AlertTriangle,
  Save,
  RotateCcw,
  ShieldCheck,
  Clock,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { factoriesApi } from '../../services/api';

import { useMyFactory } from '../../hooks/factory/useMyFactory';
import { useFactoryCategories } from '../../hooks/factory/useFactoryCategories';
import { useFactorySubCategories } from '../../hooks/factory/useFactorySubCategories';
import { useBeforeUnload } from '../../hooks/forms/useBeforeUnload';

import { FormSkeleton } from '../../components/common/FormSkeleton';
import { VerifyStatusBanner } from '../../components/factory/profile/VerifyStatusBanner';
import { BusinessInfoSection } from '../../components/factory/profile/BusinessInfoSection';
import { CategoriesSection } from '../../components/factory/profile/CategoriesSection';
import { AddressesSection } from '../../components/factory/profile/AddressesSection';
import { CertificatesSection } from '../../components/factory/profile/CertificatesSection';
import { BankAccountPlaceholder } from '../../components/factory/profile/BankAccountPlaceholder';

import {
  PROFILE_FORM_DEFAULTS,
  type ProfileFormValues,
} from '../../components/factory/profile/ProfileFormTypes';
import { FactoryPageHeader } from './components/FactoryPageHeader';

// ── Design tokens ─────────────────────────────────────────────────────────
const COLORS = {
  purple: '#4F46E5',
  orange: '#4F46E5',
  navy: '#2E2252',
  pageBg: '#F8F6FA',
};

function normalizeIds(ids: number[]): number[] {
  return Array.from(new Set(ids))
    .filter((id) => Number.isFinite(id) && id > 0)
    .sort((a, b) => a - b);
}

function countDirty(dirtyFields: Record<string, unknown>): number {
  let n = 0;
  for (const key of Object.keys(dirtyFields)) {
    const v = dirtyFields[key];
    if (Array.isArray(v)) {
      n += v.filter(Boolean).length > 0 ? 1 : 0;
    } else if (v) {
      n += 1;
    }
  }
  return n;
}

// ── Verification Stepper ──────────────────────────────────────────────────
interface StepDef {
  label: string;
  sublabel: string;
  complete: boolean;
}

function VerificationStepper({ steps }: { steps: StepDef[] }) {
  const allDone = steps.every((s) => s.complete);
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ขั้นตอนการยืนยัน</p>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${allDone ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
          {steps.filter((s) => s.complete).length}/{steps.length} ขั้นตอน
        </span>
      </div>

      <div className="flex items-start">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  step.complete
                    ? 'bg-teal-500 text-white shadow-sm shadow-teal-200'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step.complete ? '✓' : i + 1}
              </div>
              <div className="text-center min-w-0 px-1">
                <p className={`text-[10px] font-semibold leading-tight ${step.complete ? 'text-teal-700' : 'text-gray-500'}`}>
                  {step.label}
                </p>
                <p className="text-[9px] text-gray-400 leading-tight mt-0.5 hidden sm:block">{step.sublabel}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-0.5 flex-1 mt-[18px] mx-1 shrink-0 transition-all"
                style={{ backgroundColor: step.complete ? '#14b8a6' : '#E5E7EB' }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ── Section card wrapper ──────────────────────────────────────────────────
interface SectionCardProps {
  icon: React.ElementType;
  title: string;
  iconColor?: string;
  iconBg?: string;
  badge?: { label: string; complete: boolean };
  children: React.ReactNode;
}

function SectionCard({ icon: Icon, title, iconColor, iconBg, badge, children }: SectionCardProps) {
  return (
    <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconBg ?? 'rgba(122,75,148,0.1)' }}
          >
            <Icon size={16} style={{ color: iconColor ?? COLORS.purple }} strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: COLORS.navy }}>{title}</p>
          </div>
        </div>
        {badge && (
          <span
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
              badge.complete
                ? 'bg-teal-100 text-teal-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {badge.complete ? `ครบถ้วน ✓` : `ยังไม่ครบ !`}
          </span>
        )}
      </div>
      {/* Content */}
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

// ── Hero card ─────────────────────────────────────────────────────────────
function FactoryHeroCard({
  factoryName,
  verifyStatus,
}: {
  factoryName: string;
  verifyStatus: string;
}) {
  const isVerified = verifyStatus === 'AP';
  const isRejected = verifyStatus === 'RJ';
  const isPending = !isVerified && !isRejected;

  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden text-white shadow-md"
      style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #4A267D 100%)' }}
    >
      {/* Decorative blur */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: COLORS.orange }} />
      <div className="absolute -left-6 bottom-0 w-32 h-32 rounded-full opacity-10 blur-2xl" style={{ backgroundColor: '#FFFFFF' }} />

      <div className="relative z-10 flex items-center gap-4">
        {/* Factory avatar */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-2xl font-bold"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)' }}
        >
          {factoryName.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs opacity-60 font-medium">โรงงานของคุณ</p>
          <h1 className="text-xl font-bold mt-0.5 leading-snug truncate">{factoryName}</h1>
          <div className="mt-2">
            {isVerified && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.35)' }}
              >
                <ShieldCheck size={12} className="text-emerald-300" />
                ยืนยันแล้ว — พร้อมรับ RFQ
              </span>
            )}
            {isRejected && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.35)' }}
              >
                <XCircle size={12} className="text-red-300" />
                ไม่ผ่านการตรวจสอบ
              </span>
            )}
            {isPending && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(227,136,68,0.25)', border: '1px solid rgba(227,136,68,0.35)' }}
              >
                <Clock size={12} className="text-orange-300" />
                รอการอนุมัติจากแอดมิน
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export function FactoryProfilePage() {
  const { user, refreshUser } = useAuth();
  const fid = getFactoryEntityId(user);
  const qc = useQueryClient();

  const factoryQ = useMyFactory();
  const catsQ = useFactoryCategories(fid);
  const subsQ = useFactorySubCategories(fid);

  const isLoading = factoryQ.isLoading || catsQ.isLoading || subsQ.isLoading;
  const isError = factoryQ.isError;

  const factoryRaw = factoryQ.data ?? {};
  const verifyStatus = String(
    (factoryRaw as Record<string, unknown>).verify_status ??
      ((factoryRaw as Record<string, unknown>).is_verified ? 'AP' : 'PD'),
  );
  const isVerified = verifyStatus === 'AP';

  const initialValues = useMemo<ProfileFormValues>(
    () => ({
      factory_name: String(
        (factoryRaw as Record<string, unknown>).factory_name ??
          (factoryRaw as Record<string, unknown>).name ??
          '',
      ).trim(),
      tax_id: String((factoryRaw as Record<string, unknown>).tax_id ?? '').trim(),
      description: String((factoryRaw as Record<string, unknown>).description ?? '').trim(),
      factory_type_id: (() => {
        const v = Number((factoryRaw as Record<string, unknown>).factory_type_id);
        return Number.isFinite(v) && v > 0 ? v : null;
      })(),
      category_ids: normalizeIds(catsQ.data ?? []),
      sub_category_ids: normalizeIds(subsQ.data ?? []),
    }),
    [factoryRaw, catsQ.data, subsQ.data],
  );

  const form = useForm<ProfileFormValues>({
    defaultValues: PROFILE_FORM_DEFAULTS,
    mode: 'onBlur',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const changeCount = countDirty(form.formState.dirtyFields as Record<string, unknown>);
  const isDirty = form.formState.isDirty;
  const lastPrefillKeyRef = useRef('');
  const watched = form.watch();
  const requiredStatus = useMemo(() => {
    const hasBusiness = Boolean(watched.factory_name?.trim()) && Boolean(watched.factory_type_id);
    const hasCategories = (watched.category_ids?.length ?? 0) > 0;
    const hasAddress = true;
    const hasCertificates = true;
    return { hasBusiness, hasCategories, hasAddress, hasCertificates };
  }, [watched]);

  useEffect(() => {
    if (isLoading) return;
    if (saving) return;
    if (form.formState.isDirty) return;
    const nextKey = JSON.stringify(initialValues);
    if (lastPrefillKeyRef.current === nextKey) return;
    form.reset(initialValues);
    lastPrefillKeyRef.current = nextKey;
  }, [form, initialValues, isLoading, saving]);

  useBeforeUnload(isDirty);

  const handleSave = useCallback(async () => {
    if (!fid) {
      setError('ไม่พบรหัสโรงงาน');
      return;
    }
    const v = form.getValues();
    if (!v.factory_name.trim()) {
      setError('กรุณากรอกชื่อโรงงาน');
      return;
    }
    setSaving(true);
    setError('');
    setOkMsg('');

    const normalizedCategoryIds = normalizeIds(v.category_ids);
    const normalizedSubCategoryIds = normalizeIds(v.sub_category_ids);

    const saveDraftValues: ProfileFormValues = {
      ...v,
      category_ids: normalizedCategoryIds,
      sub_category_ids: normalizedSubCategoryIds,
    };

    let failed = 0;
    let subCategoryVerifyWarning = '';

    try {
      await factoriesApi.update(fid, {
        factory_name: v.factory_name.trim(),
        tax_id: v.tax_id.trim() || undefined,
        description: v.description.trim() || undefined,
        factory_type_id: v.factory_type_id ?? undefined,
      });
    } catch {
      failed += 1;
    }

    try {
      await factoriesApi.setCategories(fid, normalizedCategoryIds);
    } catch {
      failed += 1;
    }

    try {
      await factoriesApi.setSubCategories(fid, normalizedSubCategoryIds);

      const verifyRaw = await factoriesApi.getSubCategories(fid);
      const verifyRows = (Array.isArray(verifyRaw) ? verifyRaw : []) as Array<Record<string, unknown>>;
      if (verifyRows.length > 0 || normalizedSubCategoryIds.length === 0) {
        const persisted = Array.from(
          new Set(
            verifyRows
              .map((r) => Number(r.sub_category_id ?? r.id))
              .filter((n) => Number.isFinite(n) && n > 0),
          ),
        ).sort((a, b) => a - b);
        const persistedKey = persisted.join(',');
        const desiredKey = normalizedSubCategoryIds.join(',');
        if (persistedKey !== desiredKey) {
          subCategoryVerifyWarning = 'บันทึกสำเร็จ แต่หมวดย่อยอาจอัปเดตไม่ครบ';
        }
      }
    } catch {
      failed += 1;
    }

    setSaving(false);

    if (failed === 0) {
      setOkMsg(subCategoryVerifyWarning || 'บันทึกข้อมูลเรียบร้อย');
      form.reset(saveDraftValues);
      lastPrefillKeyRef.current = JSON.stringify(saveDraftValues);
      await refreshUser();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['factory', 'me'] }),
        qc.invalidateQueries({ queryKey: ['factory', String(fid), 'categories'] }),
        qc.invalidateQueries({ queryKey: ['factory', String(fid), 'sub-categories'] }),
      ]);
    } else if (failed === 3) {
      setError('บันทึกไม่สำเร็จ — กรุณาลองอีกครั้ง');
    } else {
      setError(`บันทึกสำเร็จบางส่วน (${failed} จาก 3 ล้มเหลว)`);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['factory', 'me'] }),
        qc.invalidateQueries({ queryKey: ['factory', String(fid), 'categories'] }),
        qc.invalidateQueries({ queryKey: ['factory', String(fid), 'sub-categories'] }),
      ]);
    }
  }, [fid, form, qc, refreshUser]);

  if (fid == null) {
    return <p className="text-sm text-red-600">บัญชีนี้ไม่ใช่โรงงาน หรือไม่มีรหัสโรงงานในระบบ</p>;
  }
  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-600 mb-3">โหลดข้อมูลไม่สำเร็จ</p>
        <button
          type="button"
          onClick={() => void factoryQ.refetch()}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm"
        >
          ลองใหม่
        </button>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="space-y-4">
        <FactoryPageHeader title="ข้อมูลโรงงาน" subtitle="Factory Portal" icon={Building2} />
        <FormSkeleton sections={5} />
      </div>
    );
  }

  // Stepper steps
  const steps: StepDef[] = [
    {
      label: 'ข้อมูลพื้นฐาน',
      sublabel: 'ชื่อ, ประเภท',
      complete: requiredStatus.hasBusiness,
    },
    {
      label: 'ที่อยู่',
      sublabel: 'จังหวัด, โทรศัพท์',
      complete: requiredStatus.hasAddress,
    },
    {
      label: 'เอกสาร',
      sublabel: 'ใบรับรอง, GMP',
      complete: requiredStatus.hasCertificates,
    },
    {
      label: 'อนุมัติ',
      sublabel: 'รอแอดมิน',
      complete: isVerified,
    },
  ];

  return (
    <div className="space-y-5 pb-32" style={{ backgroundColor: COLORS.pageBg }}>
      <FactoryPageHeader
        title="ข้อมูลโรงงาน"
        subtitle={isVerified ? 'ยืนยันแล้ว' : 'ตั้งค่าโปรไฟล์โรงงาน'}
        icon={Building2}
      />

      {/* Verification stepper (show if not fully verified) */}
      {!isVerified && <VerificationStepper steps={steps} />}

      {/* Verify status banner (existing component) */}
      <VerifyStatusBanner status={verifyStatus} />

      {/* Error / Success alerts */}
      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}
      {okMsg ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700">{okMsg}</p>
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        className="max-w-3xl space-y-5 w-full min-w-0"
      >
        {/* ── ข้อมูลพื้นฐาน ── */}
        <SectionCard
          icon={Building2}
          title="ข้อมูลพื้นฐาน"
          iconColor={COLORS.purple}
          iconBg="rgba(122,75,148,0.1)"
          badge={{ label: 'ข้อมูลพื้นฐาน', complete: requiredStatus.hasBusiness }}
        >
          <BusinessInfoSection form={form} />
        </SectionCard>

        {/* ── หมวดหมู่การผลิต ── */}
        <SectionCard
          icon={Award}
          title="ข้อมูลการผลิตและหมวดหมู่"
          iconColor="#0EA5E9"
          iconBg="rgba(14,165,233,0.1)"
          badge={{ label: 'หมวดหมู่', complete: requiredStatus.hasCategories }}
        >
          <CategoriesSection form={form} factoryId={fid} />
        </SectionCard>

        {/* ── ที่อยู่และการติดต่อ ── */}
        <SectionCard
          icon={MapPin}
          title="ที่อยู่และการติดต่อ"
          iconColor={COLORS.orange}
          iconBg="rgba(227,136,68,0.1)"
          badge={{ label: 'ที่อยู่', complete: requiredStatus.hasAddress }}
        >
          <AddressesSection />
        </SectionCard>

        {/* ── เอกสารและใบรับรอง ── */}
        <SectionCard
          icon={Award}
          title="เอกสารและใบรับรอง"
          iconColor="#10B981"
          iconBg="rgba(16,185,129,0.1)"
          badge={{ label: 'ใบรับรอง', complete: requiredStatus.hasCertificates }}
        >
          <p className="text-xs text-gray-400 -mt-1">เช่น GMP, Halal, ISO, มาตรฐานอาหาร</p>
          <CertificatesSection factoryId={fid} />
        </SectionCard>

        {/* ── บัญชีธนาคาร ── */}
        <SectionCard
          icon={Landmark}
          title="บัญชีธนาคาร"
          iconColor="#6366F1"
          iconBg="rgba(99,102,241,0.1)"
        >
          <div className="flex items-center gap-2 mb-3 -mt-1">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Optional</span>
            <p className="text-xs text-gray-400">ใช้สำหรับรับการโอนเงิน</p>
          </div>
          <BankAccountPlaceholder />
        </SectionCard>

        {/* Dirty indicator */}
        {isDirty && changeCount > 0 && (
          <p className="text-xs text-gray-400 text-center">
            มี {changeCount} ฟิลด์ที่เปลี่ยนแปลง — กดบันทึกเพื่อยืนยัน
          </p>
        )}
      </form>

      {/* ── Sticky Save Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-3 items-center">
          {/* Save status indicator */}
          <div className="flex-1 min-w-0">
            {isDirty ? (
              <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                มีการเปลี่ยนแปลง {changeCount} ฟิลด์ที่ยังไม่ได้บันทึก
              </p>
            ) : (
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                ข้อมูลเป็นปัจจุบัน
              </p>
            )}
          </div>

          {/* Cancel button (only when dirty) */}
          {isDirty && (
            <button
              type="button"
              onClick={() => form.reset(initialValues)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
            >
              <RotateCcw size={14} />
              ยกเลิก
            </button>
          )}

          {/* Save button */}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-all hover:opacity-90 active:scale-95 shrink-0"
            style={{
              backgroundColor: COLORS.purple,
              boxShadow: '0 2px 12px rgba(122,75,148,0.35)',
            }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save size={14} />
                บันทึกข้อมูล
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
