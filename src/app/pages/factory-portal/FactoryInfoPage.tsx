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
  Building2, CheckCircle, MapPin, Award, Landmark,
  AlertTriangle, ShieldCheck, Clock, XCircle,
  Upload, Trash2, ImageIcon, Loader2, Plus, Pencil, X,
} from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { factoriesApi, mediaApi } from '@/services/api/factoryApi';
import { useFactoryTypes } from '@/hooks/master/useFactoryTypes';
import { useProfileInit, profileInitKey } from '@/hooks/factory/useProfileInit';
import { useBeforeUnload } from '@/hooks/forms/useBeforeUnload';
import { FormSkeleton } from '@/components/common/FormSkeleton';
import { ImageCropModal } from '@/components/common/ImageCropModal';
import { VerifyStatusBanner } from '@/components/factory/profile/VerifyStatusBanner';
import { BusinessInfoSection } from '@/components/factory/profile/BusinessInfoSection';
import { CategoriesSection } from '@/components/factory/profile/CategoriesSection';
import { AddressesSection } from '@/components/factory/profile/AddressesSection';
import { CertificatesSection } from '@/components/factory/profile/CertificatesSection';
import { BankAccountPlaceholder } from '@/components/factory/profile/BankAccountPlaceholder';
import {
  PROFILE_FORM_DEFAULTS,
  type ProfileFormValues,
} from '@/components/factory/profile/ProfileFormTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/image';

// ─── Constants ───────────────────────────────────────────────────────────────
const PRIMARY = '#3C50E0';

type EditSection = 'info' | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalizeIds(ids: number[]): number[] {
  return Array.from(new Set(ids)).filter((id) => Number.isFinite(id) && id > 0).sort((a, b) => a - b);
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

/** Small labeled data field — label above bold value */
function Field({ label, value, className = '' }: { label: string; value?: React.ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className='text-[11px] font-medium text-gray-400 mb-0.5'>{label}</p>
      <p className='text-sm font-semibold text-gray-800 break-words leading-snug'>
        {value ?? <span className='text-gray-300 font-normal'>—</span>}
      </p>
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
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}>
      {(title != null || action != null) && (
        <div className='flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100'>
          {title != null
            ? <span className='text-base font-bold text-gray-900'>{title}</span>
            : <span />}
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'px-6 py-6'}>{children}</div>
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
        className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors'
      >
        <Pencil size={12} />
        Edit
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
        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors'
      >
        <X size={12} />
        ยกเลิก
      </Button>
      <Button
        variant='unstyled'
        type='button'
        disabled={saving}
        onClick={onSave}
        className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50'
        style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #6366f1 100%)` }}
      >
        {saving
          ? <><Loader2 size={12} className='animate-spin' /> กำลังบันทึก…</>
          : <><CheckCircle size={12} /> บันทึก</>
        }
      </Button>
    </div>
  );
}

// ─── Avatar uploader (compact, no cover) ─────────────────────────────────────
function AvatarUploader({
  imageUrl, uploading, busy,
  onPick, onRemove,
}: {
  imageUrl: string; uploading: boolean; busy: boolean;
  onPick: (f: File) => void; onRemove: () => void;
}) {
  const [drag, setDrag] = useState(false);

  return (
    <div
      className={`relative shrink-0 ${drag ? 'ring-2 ring-indigo-400 ring-offset-2 rounded-full' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f?.type.startsWith('image/')) onPick(f);
      }}
    >
      <Label
        className={`relative block w-[70px] h-[70px] sm:w-20 sm:h-20 rounded-full overflow-hidden cursor-pointer border-4 border-white shadow-md group bg-indigo-50 ${uploading ? 'pointer-events-none' : ''}`}
      >
        {imageUrl
          ? <Image src={imageUrl} alt='' className='w-full h-full object-cover' />
          : (
            <span className='w-full h-full flex flex-col items-center justify-center gap-1'>
              <ImageIcon size={20} className='text-indigo-300' strokeWidth={1.5} />
            </span>
          )
        }
        {uploading
          ? <div className='absolute inset-0 bg-black/40 flex items-center justify-center'><Loader2 size={18} className='text-white animate-spin' /></div>
          : <div className='absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/15 transition-opacity flex items-center justify-center'><Upload size={15} className='text-white drop-shadow' /></div>
        }
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
          onClick={(e) => { e.preventDefault(); onRemove(); }}
          className='absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow border-2 border-white hover:bg-red-600 transition-colors'
          title='ลบรูปโปรไฟล์'
        >
          <X size={9} />
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function FactoryInfoPage() {
  const { user, refreshUser } = useAuth();
  const fid = getFactoryEntityId(user);
  const qc = useQueryClient();
  const initQ = useProfileInit();
  const factoryTypesQ = useFactoryTypes();

  const factoryQ = {
    ...initQ,
    data: initQ.data?.factory as Record<string, unknown> | undefined,
    categoryIds: ((initQ.data?.factory as Record<string, unknown>)?.categories as Array<{ category_id: number }> ?? []).map((c) => c.category_id),
    subCategoryIds: ((initQ.data?.factory as Record<string, unknown>)?.sub_categories as Array<{ sub_category_id: number }> ?? []).map((s) => s.sub_category_id),
    refetch: initQ.refetch,
  };

  const isLoading = initQ.isLoading;
  const isError = initQ.isError;
  const rawVerifyStatus = String(factoryQ.data?.verify_status ?? factoryQ.data?.status ?? '');
  const isVerified = rawVerifyStatus === 'AP' || Boolean(factoryQ.data?.is_verified);
  const isRejected = rawVerifyStatus === 'RJ';
  const verifyStatus = isVerified ? 'AP' : isRejected ? 'RJ' : 'PD';

  const initialValues = useMemo<ProfileFormValues>(() => ({
    image_url: String(factoryQ.data?.image_url ?? '').trim(),
    cover_image_url: String(factoryQ.data?.background_image_url ?? '').trim(),
    factory_name: String(factoryQ.data?.factory_name ?? '').trim(),
    tax_id: String(factoryQ.data?.tax_id ?? '').trim(),
    description: String(factoryQ.data?.description ?? '').trim(),
    factory_type_id: (() => { const v = Number(factoryQ.data?.factory_type_id); return Number.isFinite(v) && v > 0 ? v : null; })(),
    category_ids: normalizeIds(factoryQ.categoryIds),
    sub_category_ids: normalizeIds(factoryQ.subCategoryIds),
    min_order: (() => { const v = Number(factoryQ.data?.min_order); return Number.isFinite(v) && v > 0 ? v : null; })(),
    lead_time_desc: String(factoryQ.data?.lead_time_desc ?? '').trim(),
  }), [factoryQ.data, factoryQ.categoryIds, factoryQ.subCategoryIds]);

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
  const openCertAddRef = useRef<(() => void) | null>(null);

  const isDirty = form.formState.isDirty;
  useBeforeUnload(isDirty);

  // ── Save info section ──────────────────────────────────────────────────────
  const handleSaveInfo = useCallback(async () => {
    if (!fid) return;
    const valid = await form.trigger(['factory_name', 'factory_type_id', 'tax_id', 'min_order', 'lead_time_desc', 'description']);
    if (!valid) { setError('กรุณาตรวจสอบข้อมูลในฟอร์ม'); return; }
    setSaving(true); setError(''); setOkMsg('');
    const v = form.getValues();
    const catIds = normalizeIds(v.category_ids);
    const subIds = normalizeIds(v.sub_category_ids);
    try {
      await factoriesApi.saveProfile(fid, {
        factory_name: v.factory_name.trim(),
        tax_id: v.tax_id.trim() || undefined,
        description: v.description.trim() || undefined,
        factory_type_id: v.factory_type_id ?? undefined,
        min_order: v.min_order != null && v.min_order > 0 ? v.min_order : undefined,
        lead_time_desc: v.lead_time_desc.trim() || undefined,
        image_url: String(v.image_url ?? ''),
        background_image_url: String(v.cover_image_url ?? ''),
        category_ids: catIds,
        sub_category_ids: subIds,
      });
      form.reset({ ...v, category_ids: catIds, sub_category_ids: subIds });
      setOkMsg('บันทึกข้อมูลพื้นฐานเรียบร้อย');
      setEditSection(null);
      await refreshUser(); await qc.invalidateQueries({ queryKey: profileInitKey });
    } catch (e) { setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'); }
    finally { setSaving(false); }
  }, [fid, form, qc, refreshUser]);


  // ── Image upload ──────────────────────────────────────────────────────────
  const handleUploadImage = useCallback(async (file: File) => {
    if (!file || !fid) return;
    setUploadingImage(true); setError(''); setOkMsg('');
    try {
      const up = await mediaApi.upload(file);
      const url = String(up?.url ?? '').trim();
      if (!url) throw new Error('อัปโหลดรูปไม่สำเร็จ');
      await factoriesApi.patch(fid, { image_url: url });
      form.setValue('image_url', url, { shouldDirty: false });
      setOkMsg('อัปโหลดรูปโปรไฟล์แล้ว');
      await refreshUser(); await qc.invalidateQueries({ queryKey: profileInitKey });
    } catch (e) { setError(e instanceof Error ? e.message : 'อัปโหลดรูปไม่สำเร็จ'); }
    finally { setUploadingImage(false); }
  }, [fid, form, qc, refreshUser]);

  const handleRemoveImage = useCallback(async () => {
    if (!fid || !window.confirm('ลบรูปโปรไฟล์โรงงาน?')) return;
    setUploadingImage(true); setError(''); setOkMsg('');
    try {
      await factoriesApi.patch(fid, { image_url: '' });
      form.setValue('image_url', '', { shouldDirty: false });
      setOkMsg('ลบรูปโปรไฟล์แล้ว');
      await refreshUser(); await qc.invalidateQueries({ queryKey: profileInitKey });
    } catch (e) { setError(e instanceof Error ? e.message : 'ลบรูปไม่สำเร็จ'); }
    finally { setUploadingImage(false); }
  }, [fid, form, qc, refreshUser]);

  const watched = form.watch();
  const imageUrl = String(watched.image_url ?? '').trim();
  const busy = uploadingImage || saving;

  // ── View-mode labels ───────────────────────────────────────────────────────
  const factoryTypeName = factoryTypesQ.data?.find((t) => t.id === initialValues.factory_type_id)?.label;
  const rawCats = (factoryQ.data?.categories as Array<Record<string, unknown>> | undefined) ?? [];
  const rawSubs = (factoryQ.data?.sub_categories as Array<Record<string, unknown>> | undefined) ?? [];
  const catNames = rawCats.map((c) => String(c.category_name ?? c.name ?? '')).filter(Boolean);
  const subNames = rawSubs.map((s) => String(s.sub_category_name ?? s.name ?? '')).filter(Boolean);

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (fid == null) return <p className='text-sm text-red-600'>บัญชีนี้ไม่ใช่โรงงาน</p>;
  if (isError) return (
    <div className='py-12 text-center'>
      <p className='text-sm text-red-600 mb-3'>โหลดข้อมูลไม่สำเร็จ</p>
      <Button variant='unstyled' type='button' onClick={() => void factoryQ.refetch()} className='px-4 py-2 rounded-xl border border-gray-200 text-sm'>ลองใหม่</Button>
    </div>
  );
  if (isLoading) return (
    <div className='space-y-4'>
      <h1 className='text-xl font-bold text-gray-900'>Factory Info</h1>
      <FormSkeleton sections={4} />
    </div>
  );

  return (
    <div className='space-y-5 pb-12 max-w-4xl'>
      {/* Page heading */}
      <h1 className='text-xl font-bold text-gray-900'>Factory Info</h1>

      {/* Alerts */}
      {error && (
        <div className='flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3'>
          <AlertTriangle size={15} className='text-red-500 shrink-0 mt-0.5' />
          <p className='text-sm text-red-700'>{error}</p>
        </div>
      )}
      {okMsg && (
        <div className='flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3'>
          <CheckCircle size={15} className='text-emerald-500 shrink-0 mt-0.5' />
          <p className='text-sm text-emerald-700'>{okMsg}</p>
        </div>
      )}

      <VerifyStatusBanner status={verifyStatus} />

      {/* ── 1+2. Profile + หมวดหมู่ — same API (PUT /factories/:id/profile) ─── */}
      <InfoCard
        action={
          <div className='flex items-center gap-2'>
            <SectionEditActions
              isEditing={editSection === 'info'}
              saving={saving}
              onEdit={() => { setEditSection('info'); setError(''); setOkMsg(''); }}
              onCancel={() => { form.reset(initialValues); setEditSection(null); setError(''); }}
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
            <p className='text-sm text-gray-400 mt-0.5'>{factoryTypeName ?? '—'}</p>
            <div className='mt-2 flex flex-wrap gap-2'>
              {isVerified && (
                <span className='inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'>
                  <ShieldCheck size={10} /> ยืนยันแล้ว
                </span>
              )}
              {isRejected && (
                <span className='inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200'>
                  <XCircle size={10} /> ไม่ผ่านการตรวจสอบ
                </span>
              )}
              {!isVerified && !isRejected && (
                <span className='inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200'>
                  <Clock size={10} /> รอการอนุมัติ
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className='border-t border-gray-100 -mx-6 mb-6' />

        {editSection === 'info' ? (
          /* ── Edit mode: business info + categories in one form ── */
          <div className='space-y-6'>
            <BusinessInfoSection form={form} />
            <div className='border-t border-gray-100 -mx-6' />
            <div>
              <div className='flex items-center justify-between gap-2 mb-3'>
                <p className='text-xs font-semibold text-gray-500'>ข้อมูลการผลิตและหมวดหมู่</p>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => openCategoryPickerRef.current?.()}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  <Plus size={11} /> เพิ่มหมวดหมู่
                </Button>
              </div>
              <CategoriesSection
                form={form}
                factoryId={fid}
                onRegisterAdd={(h) => { openCategoryPickerRef.current = h; }}
                apiCategories={factoryQ.data?.categories as Parameters<typeof CategoriesSection>[0]['apiCategories']}
                apiSubCategories={factoryQ.data?.sub_categories as Parameters<typeof CategoriesSection>[0]['apiSubCategories']}
              />
            </div>
          </div>
        ) : (
          /* ── View mode: data grid + category tags ── */
          <div className='space-y-6'>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6'>
              <Field label='ชื่อโรงงาน' value={initialValues.factory_name} className='col-span-2' />
              <Field label='ประเภทโรงงาน' value={factoryTypeName} />
              <Field label='เลขประจำตัวผู้เสียภาษี' value={initialValues.tax_id} />
              <Field label='MOQ (ขั้นต่ำรับผลิต)' value={initialValues.min_order ? `${initialValues.min_order.toLocaleString()} ชิ้น` : undefined} />
              <Field label='Lead Time' value={initialValues.lead_time_desc} />
              <Field label='รายละเอียด' value={initialValues.description} className='col-span-2 sm:col-span-4' />
            </div>

            {/* Categories sub-section */}
            <div className='border-t border-gray-100 -mx-6' />
            <div className='space-y-4'>
              <p className='text-xs font-semibold text-gray-500'>ข้อมูลการผลิตและหมวดหมู่</p>
              <div>
                <p className='text-[11px] font-medium text-gray-400 mb-2'>หมวดหมู่หลัก</p>
                {catNames.length > 0 ? (
                  <div className='flex flex-wrap gap-2'>
                    {catNames.map((n) => (
                      <span key={n} className='inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100'>{n}</span>
                    ))}
                  </div>
                ) : <p className='text-sm text-gray-300 font-normal'>—</p>}
              </div>
              {subNames.length > 0 && (
                <div>
                  <p className='text-[11px] font-medium text-gray-400 mb-2'>หมวดหมู่ย่อย</p>
                  <div className='flex flex-wrap gap-2'>
                    {subNames.map((n) => (
                      <span key={n} className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100'>{n}</span>
                    ))}
                  </div>
                </div>
              )}
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
          try { await handleUploadImage(file); } finally { setCropFile(null); }
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
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors'
          >
            <Plus size={11} /> เพิ่มใบรับรอง
          </Button>
        }
      >
        <p className='text-xs text-gray-400 mb-4'>เช่น GMP, Halal, ISO, มาตรฐานอาหาร</p>
        <CertificatesSection
          factoryId={fid}
          certs={(factoryQ.data?.certificates ?? []) as Record<string, unknown>[]}
          onRegisterAdd={(h) => { openCertAddRef.current = h; }}
        />
      </InfoCard>

      {/* ── 5. บัญชีธนาคาร — placeholder ──────────────────────────────────────── */}
      <InfoCard
        title='บัญชีธนาคาร'
        action={
          <span className='text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200'>Optional</span>
        }
      >
        <p className='text-xs text-gray-400 mb-4'>ใช้สำหรับรับการโอนเงิน</p>
        <BankAccountPlaceholder />
      </InfoCard>
    </div>
  );
}
