/**
 * FactoryInfoPage — /factory/info
 *
 * TailAdmin-style profile page with per-section Edit buttons.
 * View mode shows labeled data. Edit mode shows form inputs.
 * API calls are identical to FactoryProfilePage:
 *   • ข้อมูลพื้นฐาน / หมวดหมู่ → factoriesApi.saveProfile()
 *   • รูปภาพ                    → factoriesApi.patch() + mediaApi.upload()
 *   • ที่อยู่                    → addressesApi (separate CRUD per item)
 *   • เอกสาร                    → certificatesApi (separate CRUD per item)
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileFormSchema } from '@/domain/factory/schemas/profileForm.schema';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle,
  MapPin,
  Award,
  Landmark,
  AlertTriangle,
  ShieldCheck,
  Clock,
  XCircle,
  Upload,
  Trash2,
  ImageIcon,
  Loader2,
  Plus,
  Pencil,
  X,
} from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { factoriesApi, mediaApi } from '@/services/api/factoryApi';
import { useProfileInit, profileInitKey } from '@/hooks/factory/useProfileInit';
import { useBeforeUnload } from '@/hooks/forms/useBeforeUnload';
import { FormSkeleton } from '@/components/common/FormSkeleton';
import { ImageCropModal } from '@/components/common/ImageCropModal';
import { VerifyStatusBanner } from '@/components/factory/profile/VerifyStatusBanner';
import { BusinessInfoSection } from '@/components/factory/profile/BusinessInfoSection';
import { CategoriesSection } from '@/components/factory/profile/CategoriesSection';
import { AddressesSection } from '@/components/factory/profile/AddressesSection';
import { CertificatesSection } from '@/components/factory/profile/CertificatesSection';
import { FactoryBankSettingsPage } from '@/pages/factory-portal/FactoryBankSettingsPage';
import {
  PROFILE_FORM_DEFAULTS,
  type ProfileFormValues,
} from '@/components/factory/profile/ProfileFormTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/image';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import {
  factoryBadgeClass,
  factoryButtonClass,
  factoryCardClass,
} from '@/pages/factory-portal/factoryUi';

type EditSection = 'info' | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalizeIds(ids: number[]): number[] {
  return Array.from(new Set(ids))
    .filter((id) => Number.isFinite(id) && id > 0)
    .sort((a, b) => a - b);
}

type CategoryScope = 'PD' | 'MT' | 'OTHER';

// ─── Shared UI ────────────────────────────────────────────────────────────────

/** Small labeled data field — label above bold value */
function Field({
  label,
  value,
  className = '',
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) {
  const displayValue =
    value && String(value).trim() ? value : <span className='text-gray-300 font-normal'>—</span>;
  return (
    <div className={`min-w-0 ${className}`}>
      <p className='text-[11px] font-medium text-gray-400 mb-0.5'>{label}</p>
      <p className='text-sm font-semibold text-gray-800 break-words leading-snug'>{displayValue}</p>
    </div>
  );
}

/** Card with optional header (title + action) and horizontal divider */
function InfoCard({
  title,
  action,
  children,
  className = '',
  noPadding = false,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div className={factoryCardClass({ variant: 'shell', className })}>
      {(title != null || action != null) && (
        <div className='flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-5'>
          {title != null ? (
            typeof title === 'string' || typeof title === 'number' ? (
              <span className='text-base font-bold text-gray-900'>{title}</span>
            ) : (
              <div className='min-w-0 flex-1'>{title}</div>
            )
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4 sm:p-5'}>{children}</div>
    </div>
  );
}

/** TailAdmin Edit / Save / Cancel button group for a section */
function SectionEditActions({
  isEditing,
  saving,
  onEdit,
  onCancel,
  onSave,
}: {
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!isEditing) {
    return (
      <Button
        variant='unstyled'
        type='button'
        onClick={onEdit}
        className={factoryButtonClass({ variant: 'secondary', size: 'sm' })}
      >
        <Pencil size={12} />
        แก้ไข
      </Button>
    );
  }
  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='unstyled'
        type='button'
        disabled={saving}
        onClick={onCancel}
        className={factoryButtonClass({ variant: 'secondary', size: 'sm' })}
      >
        <X size={12} />
        ยกเลิก
      </Button>
      <Button
        variant='unstyled'
        type='button'
        disabled={saving}
        onClick={onSave}
        className={factoryButtonClass({ variant: 'primary', size: 'sm', className: 'px-4' })}
      >
        {saving ? (
          <>
            <Loader2 size={12} className='animate-spin' /> กำลังบันทึก…
          </>
        ) : (
          <>
            <CheckCircle size={12} /> บันทึก
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Avatar uploader (compact, no cover) ─────────────────────────────────────
function AvatarUploader({
  imageUrl,
  uploading,
  busy,
  onPick,
  onRemove,
}: {
  imageUrl: string;
  uploading: boolean;
  busy: boolean;
  onPick: (f: File) => void;
  onRemove: () => void;
}) {
  const [drag, setDrag] = useState(false);

  return (
    <div
      className={`relative shrink-0 ${drag ? 'ring-2 ring-brand-purple ring-offset-2 rounded-full' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f?.type.startsWith('image/')) onPick(f);
      }}
    >
      <Label
        className={`relative block w-[70px] h-[70px] sm:w-20 sm:h-20 rounded-lg overflow-hidden cursor-pointer border-2 border-white group bg-brand-lavender ${uploading ? 'pointer-events-none' : ''}`}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt='' className='w-full h-full object-cover' />
        ) : (
          <span className='w-full h-full flex flex-col items-center justify-center gap-1'>
            <ImageIcon size={20} className='text-brand-muted-purple' strokeWidth={1.5} />
          </span>
        )}
        {uploading ? (
          <div className='absolute inset-0 bg-black/40 flex items-center justify-center'>
            <Loader2 size={18} className='text-white animate-spin' />
          </div>
        ) : (
          <div className='absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/15 transition-opacity flex items-center justify-center'>
            <Upload size={15} className='text-white drop-shadow' />
          </div>
        )}
        <Input
          type='file'
          accept='image/jpeg,image/png,image/webp'
          className='hidden'
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f?.type.startsWith('image/')) onPick(f);
            e.currentTarget.value = '';
          }}
        />
      </Label>
      {imageUrl && !uploading && (
        <button
          type='button'
          disabled={busy}
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          className='absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center border-2 border-white hover:bg-red-600 transition-colors'
          title='ลบรูปโปรไฟล์'
        >
          <X size={9} />
        </button>
      )}
    </div>
  );
}

// ─── CategoryViewCard — view-mode card for categories (no edit) ───────────────
type SubEntryView = { id: number; name: string };
type CatCardView = { id: number; name: string; subs: SubEntryView[] };

function CategoryViewCard({ cat, isMT = false }: { cat: CatCardView; isMT?: boolean }) {
  return (
    <div className={factoryCardClass({ variant: 'list', className: 'space-y-2' })}>
      <h3 className='text-sm font-bold text-gray-900'>{cat.name}</h3>

      {!isMT &&
        (cat.subs.length > 0 ? (
          <ul className='flex flex-wrap gap-1.5'>
            {cat.subs.map((s) => (
              <li key={s.id}>
                <span className={factoryBadgeClass({ variant: 'status' })}>{s.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-xs text-gray-400'>ยังไม่ได้เลือกหมวดย่อย</p>
        ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function FactoryInfoPage() {
  const { user, refreshUser } = useAuth();
  const fid = getFactoryEntityId(user);
  const qc = useQueryClient();
  const initQ = useProfileInit();

  const factoryQ = {
    ...initQ,
    data: initQ.data?.factory as Record<string, unknown> | undefined,
    categoryIds: (
      ((initQ.data?.factory as Record<string, unknown>)?.categories as Array<{
        category_id: number;
      }>) ?? []
    ).map((c) => c.category_id),
    subCategoryIds: (
      ((initQ.data?.factory as Record<string, unknown>)?.sub_categories as Array<{
        sub_category_id: number;
      }>) ?? []
    ).map((s) => s.sub_category_id),
    refetch: initQ.refetch,
  };

  const isLoading = initQ.isLoading;
  const isError = initQ.isError;
  const rawVerifyStatus = String(factoryQ.data?.verify_status ?? factoryQ.data?.status ?? '');
  const isVerified = rawVerifyStatus === 'AP' || Boolean(factoryQ.data?.is_verified);
  const isRejected = rawVerifyStatus === 'RJ';
  const verifyStatus = isVerified ? 'AP' : isRejected ? 'RJ' : 'PD';

  const initialValues = useMemo<ProfileFormValues>(
    () => ({
      image_url: String(factoryQ.data?.image_url ?? '').trim(),
      cover_image_url: String(factoryQ.data?.background_image_url ?? '').trim(),
      factory_name: String(factoryQ.data?.factory_name ?? '').trim(),
      tax_id: String(factoryQ.data?.tax_id ?? '').trim(),
      description: String(factoryQ.data?.description ?? '').trim(),
      category_ids: normalizeIds(factoryQ.categoryIds),
      sub_category_ids: normalizeIds(factoryQ.subCategoryIds),
      lead_time_desc: String(factoryQ.data?.lead_time_desc ?? '').trim(),
    }),
    [factoryQ.data, factoryQ.categoryIds, factoryQ.subCategoryIds, initQ.data],
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: PROFILE_FORM_DEFAULTS,
    values: isLoading ? undefined : initialValues,
    resetOptions: { keepDirtyValues: true },
    mode: 'onBlur',
  });

  // ── State ──────────────────────────────────────────────────────────────────
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const openCategoryPickerRef = useRef<(() => void) | null>(null);
  // PD categories ที่ยังไม่ได้เลือก sub — ใช้ block save
  const pdSubErrorsRef = useRef<Set<number>>(new Set());
  const openCertAddRef = useRef<(() => void) | null>(null);
  const openBankAddRef = useRef<(() => void) | null>(null);

  const isDirty = form.formState.isDirty;
  useBeforeUnload(isDirty);

  // ── Save info section ──────────────────────────────────────────────────────
  const handleSaveInfo = useCallback(async () => {
    if (!fid) return;
    const valid = await form.trigger(['factory_name', 'tax_id', 'lead_time_desc', 'description']);
    if (!valid) {
      setError('กรุณาตรวจสอบข้อมูลในฟอร์ม');
      return;
    }
    // ตรวจสอบว่า PD categories ทุกอันมี sub-category เลือกไว้
    if (pdSubErrorsRef.current.size > 0) {
      setError('กรุณาเลือกหมวดย่อยอย่างน้อย 1 รายการสำหรับทุก "หมวดสินค้า (PD)" ที่เลือกไว้');
      return;
    }
    setSaving(true);
    setError('');
    setOkMsg('');
    const v = form.getValues();
    const catIds = normalizeIds(v.category_ids);
    const subIds = normalizeIds(v.sub_category_ids);
    try {
      await factoriesApi.saveProfile(fid, {
        factory_name: v.factory_name.trim(),
        tax_id: v.tax_id.trim() || undefined,
        description: v.description.trim() || undefined,
        lead_time_desc: v.lead_time_desc.trim() || undefined,
        image_url: String(v.image_url ?? ''),
        background_image_url: String(v.cover_image_url ?? ''),
        category_ids: catIds,
        sub_category_ids: subIds,
      });
      if (catIds.length > 0) {
        await factoriesApi.setCategories(fid, catIds);
      }
      if (subIds.length > 0) {
        await factoriesApi.setSubCategories(fid, subIds);
      }
      form.reset({ ...v, category_ids: catIds, sub_category_ids: subIds });
      setOkMsg('บันทึกข้อมูลพื้นฐานเรียบร้อย');
      setEditSection(null);
      await refreshUser();
      await qc.invalidateQueries({ queryKey: profileInitKey });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }, [fid, form, qc, refreshUser]);

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleUploadImage = useCallback(
    async (file: File) => {
      if (!file || !fid) return;
      setUploadingImage(true);
      setError('');
      setOkMsg('');
      try {
        const up = await mediaApi.upload(file);
        const url = String(up?.url ?? '').trim();
        if (!url) throw new Error('อัปโหลดรูปไม่สำเร็จ');
        await factoriesApi.patch(fid, { image_url: url });
        form.setValue('image_url', url, { shouldDirty: false });
        setOkMsg('อัปโหลดรูปโปรไฟล์แล้ว');
        await refreshUser();
        await qc.invalidateQueries({ queryKey: profileInitKey });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'อัปโหลดรูปไม่สำเร็จ');
      } finally {
        setUploadingImage(false);
      }
    },
    [fid, form, qc, refreshUser],
  );

  const handleRemoveImage = useCallback(async () => {
    if (!fid || !window.confirm('ลบรูปโปรไฟล์โรงงาน?')) return;
    setUploadingImage(true);
    setError('');
    setOkMsg('');
    try {
      await factoriesApi.patch(fid, { image_url: '' });
      form.setValue('image_url', '', { shouldDirty: false });
      setOkMsg('ลบรูปโปรไฟล์แล้ว');
      await refreshUser();
      await qc.invalidateQueries({ queryKey: profileInitKey });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบรูปไม่สำเร็จ');
    } finally {
      setUploadingImage(false);
    }
  }, [fid, form, qc, refreshUser]);

  const watched = form.watch();
  const imageUrl = String(watched.image_url ?? '').trim();
  const busy = uploadingImage || saving;

  // ── View-mode labels ───────────────────────────────────────────────────────
  const rawCats = (factoryQ.data?.categories as Array<Record<string, unknown>> | undefined) ?? [];
  const rawSubs =
    (factoryQ.data?.sub_categories as Array<Record<string, unknown>> | undefined) ?? [];
  const lbiCategories =
    (initQ.data?.lbi_categories as Array<Record<string, unknown>> | undefined) ?? [];
  const catScopeById = useMemo(() => {
    const map = new Map<number, CategoryScope>();
    lbiCategories.forEach((c) => {
      const id = Number(c.category_id);
      const scope = String(c.scope ?? '').toUpperCase();
      if (!Number.isFinite(id)) return;
      if (scope === 'PD' || scope === 'MT') map.set(id, scope);
      else map.set(id, 'OTHER');
    });
    return map;
  }, [lbiCategories]);
  type SubEntry = { id: number; name: string };
  type CatCard = { id: number; name: string; subs: SubEntry[] };
  const categoryCardsByScope = useMemo(() => {
    const out: Record<'PD' | 'MT', CatCard[]> = { PD: [], MT: [] };
    const subByCat = new Map<number, SubEntry[]>();
    rawSubs.forEach((s) => {
      const catId = Number(s.category_id);
      const id = Number(s.sub_category_id);
      const name = String(s.sub_category_name ?? s.name ?? '').trim();
      if (!Number.isFinite(catId) || !Number.isFinite(id) || !name) return;
      const bucket = subByCat.get(catId) ?? [];
      if (!bucket.some((x) => x.id === id)) bucket.push({ id, name });
      subByCat.set(catId, bucket);
    });
    rawCats.forEach((c) => {
      const id = Number(c.category_id);
      const name = String(c.category_name ?? c.name ?? '').trim();
      if (!Number.isFinite(id) || !name) return;
      const scope = catScopeById.get(id) ?? 'PD';
      if (scope !== 'PD' && scope !== 'MT') return;
      out[scope].push({ id, name, subs: subByCat.get(id) ?? [] });
    });
    return out;
  }, [catScopeById, rawCats, rawSubs]);

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (fid == null) return <p className='text-sm text-red-600'>บัญชีนี้ไม่ใช่โรงงาน</p>;
  if (isError)
    return (
      <div className='py-12 text-center'>
        <p className='text-sm text-red-600 mb-3'>โหลดข้อมูลไม่สำเร็จ</p>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => void factoryQ.refetch()}
          className='px-4 py-2 rounded-lg border border-gray-200 text-sm'
        >
          ลองใหม่
        </Button>
      </div>
    );
  if (isLoading)
    return (
      <div className='w-full min-w-0 space-y-4'>
        <FactoryPageHeader
          title='ข้อมูลโรงงาน'
          subtitle='Factory / Info'
          icon={Building2}
          variant='minimal'
        />
        <FormSkeleton sections={4} />
      </div>
    );

  return (
    <div className='w-full min-w-0 space-y-4 pb-12'>
      <FactoryPageHeader
        title='ข้อมูลโรงงาน'
        subtitle='Factory / Info'
        icon={Building2}
        variant='minimal'
      />

      {/* Alerts */}
      {error && (
        <div className='flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3'>
          <AlertTriangle size={15} className='text-red-500 shrink-0 mt-0.5' />
          <p className='text-sm text-red-700'>{error}</p>
        </div>
      )}
      {okMsg && (
        <div className='flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3'>
          <CheckCircle size={15} className='text-emerald-500 shrink-0 mt-0.5' />
          <p className='text-sm text-emerald-700'>{okMsg}</p>
        </div>
      )}

      {/* ── 1+2. Profile + หมวดหมู่ — same API (PUT /factories/:id/profile) ─── */}
      <InfoCard
        title={<VerifyStatusBanner status={verifyStatus} />}
        action={
          <div className='flex items-center gap-2'>
            <SectionEditActions
              isEditing={editSection === 'info'}
              saving={saving}
              onEdit={() => {
                setEditSection('info');
                setError('');
                setOkMsg('');
              }}
              onCancel={() => {
                form.reset(initialValues);
                setEditSection(null);
                setError('');
              }}
              onSave={() => void handleSaveInfo()}
            />
          </div>
        }
      >
        {/* Avatar + Name row */}
        <div className='flex items-center gap-4 pb-5'>
          <AvatarUploader
            imageUrl={imageUrl}
            uploading={uploadingImage}
            busy={busy}
            onPick={(f) => setCropFile(f)}
            onRemove={() => void handleRemoveImage()}
          />
          <div className='min-w-0 flex-1'>
            <p className='text-lg font-bold text-gray-900 leading-tight truncate'>
              {initialValues.factory_name || 'โรงงานของคุณ'}
            </p>
            <div className='mt-2 flex flex-wrap gap-2'>
              {isVerified && (
                <span className={factoryBadgeClass({ variant: 'verified' })}>
                  <ShieldCheck size={10} /> ยืนยันแล้ว
                </span>
              )}
              {isRejected && (
                <span className={factoryBadgeClass({ variant: 'danger' })}>
                  <XCircle size={10} /> ไม่ผ่านการตรวจสอบ
                </span>
              )}
              {!isVerified && !isRejected && (
                <span className={factoryBadgeClass({ variant: 'warning' })}>
                  <Clock size={10} /> รอการอนุมัติ
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className='-mx-4 mb-5 border-t border-slate-100 sm:-mx-5' />

        {editSection === 'info' ? (
          /* ── Edit mode: business info + categories in one form ── */
          <div className='space-y-6'>
            <BusinessInfoSection form={form} />
            <div className='-mx-4 border-t border-slate-100 sm:-mx-5' />
            <div>
              <div className='flex items-center justify-between gap-2 mb-3'>
                <p className='text-xs font-semibold text-gray-500'>ข้อมูลการผลิตและหมวดหมู่</p>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => openCategoryPickerRef.current?.()}
                  className={factoryButtonClass({ variant: 'secondary', size: 'sm' })}
                >
                  <Plus size={11} /> เพิ่มหมวดหมู่
                </Button>
              </div>
              <CategoriesSection
                form={form}
                factoryId={fid}
                onRegisterAdd={(h) => {
                  openCategoryPickerRef.current = h;
                }}
                apiCategories={
                  (factoryQ.data?.categories ?? []) as Parameters<
                    typeof CategoriesSection
                  >[0]['apiCategories']
                }
                apiSubCategories={
                  (factoryQ.data?.sub_categories ?? []) as Parameters<
                    typeof CategoriesSection
                  >[0]['apiSubCategories']
                }
                onPdSubValidation={(invalidIds) => {
                  pdSubErrorsRef.current = invalidIds;
                }}
              />
            </div>
          </div>
        ) : (
          /* ── View mode: data grid + category tags ── */
          <div className='space-y-6'>
            <div className='grid grid-cols-2 sm:grid-cols-4 2xl:grid-cols-6 gap-x-8 gap-y-6'>
              <Field label='ชื่อโรงงาน' value={initialValues.factory_name} className='col-span-2' />
              <Field label='เลขประจำตัวผู้เสียภาษี' value={initialValues.tax_id} />
              <Field label='Lead Time' value={initialValues.lead_time_desc} />
              <Field
                label='รายละเอียด'
                value={initialValues.description}
                className='col-span-2 sm:col-span-4 2xl:col-span-6'
              />
            </div>

            {/* Categories sub-section */}
            <div className='-mx-4 border-t border-slate-100 sm:-mx-5' />
            <div className='space-y-4'>
              <p className='text-xs font-semibold text-gray-500'>ข้อมูลการผลิตและหมวดหมู่</p>

              {/* PD categories */}
              {categoryCardsByScope.PD.length > 0 ? (
                <div className='space-y-2.5'>
                  <p className='text-sm font-bold text-brand-purple'>หมวดสินค้า (PD)</p>
                  <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3'>
                    {categoryCardsByScope.PD.map((cat) => (
                      <CategoryViewCard key={`pd-${cat.id}`} cat={cat} />
                    ))}
                  </div>
                </div>
              ) : null}

              {/* MT categories */}
              {categoryCardsByScope.MT.length > 0 ? (
                <div className='space-y-2.5'>
                  <p className='text-sm font-bold text-emerald-700'>หมวดวัตถุดิบ (MT)</p>
                  <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3'>
                    {categoryCardsByScope.MT.map((cat) => (
                      <CategoryViewCard key={`mt-${cat.id}`} cat={cat} isMT />
                    ))}
                  </div>
                </div>
              ) : null}

              {categoryCardsByScope.PD.length === 0 && categoryCardsByScope.MT.length === 0 ? (
                <p className='text-sm text-gray-300 font-normal'>—</p>
              ) : null}
            </div>
          </div>
        )}
      </InfoCard>

      {/* Crop modal for avatar */}
      <ImageCropModal
        open={cropFile != null}
        file={cropFile}
        title='ครอปรูปโปรไฟล์โรงงาน'
        aspect={1}
        outputWidth={900}
        onCancel={() => setCropFile(null)}
        onConfirm={async (file) => {
          try {
            await handleUploadImage(file);
          } finally {
            setCropFile(null);
          }
        }}
      />

      {/* ── 3. ที่อยู่ — separate API per item, always shows CRUD ─────────────── */}
      <InfoCard title='ที่อยู่และการติดต่อ'>
        <AddressesSection />
      </InfoCard>

      {/* ── 4. เอกสาร — separate API per item, always shows CRUD ─────────────── */}
      <InfoCard
        title='เอกสารและใบรับรอง'
        action={
          <Button
            variant='unstyled'
            type='button'
            onClick={() => openCertAddRef.current?.()}
            className={factoryButtonClass({
              variant: 'primary',
              size: 'md',
              className: 'min-w-[126px] font-normal',
            })}
          >
            <Plus size={13} /> เพิ่มใบรับรอง
          </Button>
        }
      >
        <p className='text-xs text-gray-400 mb-4'>เช่น GMP, Halal, ISO, มาตรฐานอาหาร</p>
        <CertificatesSection
          factoryId={fid}
          certs={(factoryQ.data?.certificates ?? []) as Record<string, unknown>[]}
          onRegisterAdd={(h) => {
            openCertAddRef.current = h;
          }}
        />
      </InfoCard>

      {/* ── 5. บัญชีธนาคาร — full CRUD ──────────────────────────────────────── */}
      <InfoCard
        title='บัญชีธนาคาร'
        action={
          <Button
            variant='unstyled'
            type='button'
            onClick={() => openBankAddRef.current?.()}
            className={factoryButtonClass({
              variant: 'primary',
              size: 'md',
              className: 'min-w-[126px] font-normal',
            })}
          >
            <Plus size={13} /> เพิ่มบัญชี
          </Button>
        }
      >
        <FactoryBankSettingsPage
          embedded
          onRegisterAdd={(h) => {
            openBankAddRef.current = h;
          }}
        />
      </InfoCard>
    </div>
  );
}
