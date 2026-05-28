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
} from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { factoriesApi, mediaApi } from '@/services/api/factoryApi';
import { useFactoryTypes } from '@/hooks/master/useFactoryTypes';

import { useProfileInit, profileInitKey } from '@/hooks/factory/useProfileInit';
import { useBeforeUnload } from '@/hooks/forms/useBeforeUnload';

import { FormSkeleton } from '@/components/common/FormSkeleton';
import { ImageCropModal } from '@/components/common/ImageCropModal';
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

const COLORS = {
  purple: 'var(--brand-indigo)',
  orange: 'var(--brand-indigo)',
  navy: 'var(--brand-navy)',
  pageBg: 'var(--brand-page)',
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

function FactoryHeroCard({
  factoryName,
  verifyStatus,
  imageUrl,
  coverImageUrl,
  uploadingImage,
  uploadingCover,
  onPickImage,
  onRemoveImage,
  onPickCover,
  onRemoveCover,
}: {
  factoryName: string;
  verifyStatus: string;
  imageUrl: string;
  coverImageUrl: string;
  uploadingImage: boolean;
  uploadingCover: boolean;
  onPickImage: (file: File) => void;
  onRemoveImage: () => void;
  onPickCover: (file: File) => void;
  onRemoveCover: () => void;
}) {
  const isVerified = verifyStatus === 'AP';
  const isRejected = verifyStatus === 'RJ';
  const isPending = !isVerified && !isRejected;
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [profileDragOver, setProfileDragOver] = useState(false);
  const [coverDragOver, setCoverDragOver] = useState(false);

  const busy = uploadingImage || uploadingCover;

  const acceptProfile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    onPickImage(file);
  };
  const acceptCover = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    onPickCover(file);
  };

  return (
    <div className='rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden'>
      <div
        className={`relative h-28 sm:h-36 transition-[box-shadow] ${
          coverDragOver ? 'ring-2 ring-inset ring-indigo-400' : ''
        }`}
        style={
          coverImageUrl
            ? {
                backgroundImage: `url(${coverImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
        onDragOver={(e) => {
          e.preventDefault();
          setCoverDragOver(true);
        }}
        onDragLeave={() => setCoverDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setCoverDragOver(false);
          acceptCover(e.dataTransfer.files?.[0]);
        }}
      >
        {!coverImageUrl ? (
          <div
            className='absolute inset-0 bg-gradient-to-br from-slate-100 via-violet-50 to-indigo-50'
            aria-hidden
          />
        ) : null}
        <div className='absolute inset-0 bg-slate-900/25 pointer-events-none' aria-hidden />

        {coverDragOver ? (
          <div className='absolute inset-0 z-[5] flex items-center justify-center bg-indigo-500/15 backdrop-blur-[1px]'>
            <p className='text-xs font-semibold text-indigo-900 px-3 py-1.5 rounded-full bg-white/95 shadow'>
              ปล่อยเพื่ออัปโหลดพื้นหลัง
            </p>
          </div>
        ) : null}

        {uploadingCover ? (
          <div className='absolute inset-0 z-[6] bg-black/45 flex items-center justify-center'>
            <Loader2 size={32} className='text-white animate-spin' />
          </div>
        ) : null}

        <Label className='absolute inset-0 z-[1] cursor-pointer group flex flex-col items-center justify-center text-center px-4'>
          <Input
            ref={coverInputRef}
            type='file'
            accept='image/jpeg,image/png,image/webp'
            className='hidden'
            disabled={busy}
            onChange={(e) => {
              acceptCover(e.target.files?.[0]);
              e.currentTarget.value = '';
            }}
          />
          {!coverImageUrl && !uploadingCover ? (
            <>
              <ImageIcon size={28} className='text-indigo-500 mb-1' strokeWidth={1.5} />
              <span className='text-[11px] font-semibold text-slate-800'>รูปพื้นหลังโรงงาน</span>
              <span className='text-[10px] text-slate-600 mt-0.5 max-w-[240px]'>
                คลิกหรือลากไฟล์มาวาง · JPG, PNG, WebP
              </span>
            </>
          ) : null}
          {coverImageUrl && !uploadingCover ? (
            <div className='absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100'>
              <Upload size={26} className='text-white drop-shadow-md' />
            </div>
          ) : null}
        </Label>

        {coverImageUrl ? (
          <Button
            variant='unstyled'
            type='button'
            disabled={busy}
            className='absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/95 text-red-600 border border-red-100 shadow-sm hover:bg-red-50 disabled:opacity-50'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemoveCover();
            }}
          >
            <Trash2 size={11} />
            ลบพื้นหลัง
          </Button>
        ) : null}
      </div>

      <div className='relative z-[2] px-5 pb-5 pt-4'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-end'>
          <div
            className={`w-fit shrink-0 rounded-2xl transition-[box-shadow] ${
              profileDragOver ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-white' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setProfileDragOver(true);
            }}
            onDragLeave={() => setProfileDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setProfileDragOver(false);
              acceptProfile(e.dataTransfer.files?.[0]);
            }}
          >
            <Label
              className={`relative block w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-md cursor-pointer bg-violet-50 text-indigo-700 ring-4 ring-white group border-2 ${
                imageUrl ? 'border-white' : 'border-dashed border-indigo-200'
              } ${uploadingImage ? 'pointer-events-none opacity-90' : 'hover:ring-indigo-100'}`}
            >
              {imageUrl ? (
                <Image src={imageUrl} alt='' className='w-full h-full object-cover' />
              ) : (
                <span className='w-full h-full flex flex-col items-center justify-center gap-1.5 p-2 text-center'>
                  <ImageIcon
                    size={28}
                    className='text-indigo-400 group-hover:text-indigo-500'
                    strokeWidth={1.5}
                  />
                  <span className='text-[10px] font-semibold text-indigo-600 leading-tight'>
                    โปรไฟล์
                  </span>
                </span>
              )}
              {uploadingImage ? (
                <div className='absolute inset-0 bg-black/45 flex items-center justify-center'>
                  <Loader2 size={28} className='text-white animate-spin' />
                </div>
              ) : (
                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100'>
                  <Upload size={22} className='text-white drop-shadow-md' />
                </div>
              )}
              <Input
                ref={profileInputRef}
                type='file'
                accept='image/jpeg,image/png,image/webp'
                className='hidden'
                disabled={busy}
                onChange={(e) => {
                  acceptProfile(e.target.files?.[0]);
                  e.currentTarget.value = '';
                }}
              />
            </Label>
          </div>

          <div className='min-w-0 flex-1 pt-1 sm:pb-0.5'>
            <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>
              โรงงานของคุณ
            </p>
            <h1
              className='text-lg sm:text-xl font-bold mt-0.5 leading-snug truncate'
              style={{ color: COLORS.navy }}
            >
              {factoryName}
            </h1>
            <div className='mt-2 flex flex-wrap gap-2'>
              {isVerified && (
                <span className='inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100'>
                  <ShieldCheck size={12} className='text-emerald-600' />
                  ยืนยันแล้ว — พร้อมรับ RFQ
                </span>
              )}
              {isRejected && (
                <span className='inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-800 border border-red-100'>
                  <XCircle size={12} className='text-red-600' />
                  ไม่ผ่านการตรวจสอบ
                </span>
              )}
              {isPending && (
                <span className='inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-100'>
                  <Clock size={12} className='text-amber-600' />
                  รอการอนุมัติจากแอดมิน
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FactoryProfilePage() {
  const { user, refreshUser } = useAuth();
  const fid = getFactoryEntityId(user);
  const qc = useQueryClient();
  const factoryTypesQ = useFactoryTypes();

  const initQ = useProfileInit();

  // Adapter: expose the same shape as useMyFactory so the rest of the page doesn't change
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

  const verifyStatus = factoryQ.data?.is_verified ? 'AP' : 'PD';
  const isVerified = verifyStatus === 'AP';

  const initialValues = useMemo<ProfileFormValues>(
    () => ({
      image_url: String(factoryQ.data?.image_url ?? '').trim(),
      cover_image_url: String(factoryQ.data?.background_image_url ?? '').trim(),
      factory_name: String(factoryQ.data?.factory_name ?? '').trim(),
      tax_id: String(factoryQ.data?.tax_id ?? '').trim(),
      description: String(factoryQ.data?.description ?? '').trim(),
      factory_type_id: (() => {
        const v = Number(factoryQ.data?.factory_type_id);
        return Number.isFinite(v) && v > 0 ? v : null;
      })(),
      category_ids: normalizeIds(factoryQ.categoryIds),
      sub_category_ids: normalizeIds(factoryQ.subCategoryIds),
      min_order: (() => {
        const v = Number(factoryQ.data?.min_order);
        return Number.isFinite(v) && v > 0 ? v : null;
      })(),
      lead_time_desc: String(factoryQ.data?.lead_time_desc ?? '').trim(),
    }),
    [factoryQ.data, factoryQ.categoryIds, factoryQ.subCategoryIds],
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: PROFILE_FORM_DEFAULTS,
    values: isLoading ? undefined : initialValues,
    resetOptions: { keepDirtyValues: true },
    mode: 'onBlur',
  });

  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCategoryEditing, setIsCategoryEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [cropTarget, setCropTarget] = useState<'profile' | 'cover' | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const openCategoryPickerRef = useRef<(() => void) | null>(null);
  const openCertAddRef = useRef<(() => void) | null>(null);

  const changeCount = countDirty(form.formState.dirtyFields as Record<string, unknown>);
  const isDirty = form.formState.isDirty;
  const watched = form.watch();
  useBeforeUnload(isDirty);

  const handleSave = useCallback(async () => {
    if (!fid) {
      setError('ไม่พบรหัสโรงงาน');
      return;
    }
    const valid = await form.trigger();
    if (!valid) {
      setError(form.formState.errors.factory_name?.message ?? 'กรุณาตรวจสอบข้อมูลในฟอร์ม');
      return;
    }
    const v = form.getValues();
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
        category_ids: normalizedCategoryIds,
        sub_category_ids: normalizedSubCategoryIds,
      });

      setSaving(false);
      setOkMsg('บันทึกข้อมูลเรียบร้อย');
      form.reset(saveDraftValues);
      setIsEditing(false);
      setIsCategoryEditing(false);
      await refreshUser();
      await qc.invalidateQueries({ queryKey: profileInitKey });
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ — กรุณาลองอีกครั้ง');
    }
  }, [fid, form, qc, refreshUser]);

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
        setOkMsg('อัปโหลดและบันทึกรูปโปรไฟล์โรงงานแล้ว');
        await refreshUser();
        await qc.invalidateQueries({ queryKey: profileInitKey });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'อัปโหลดหรือบันทึกรูปไม่สำเร็จ');
      } finally {
        setUploadingImage(false);
      }
    },
    [fid, form, qc, refreshUser],
  );

  const handleRemoveImage = useCallback(async () => {
    if (!fid) return;
    if (!window.confirm('ลบรูปโปรไฟล์โรงงานออกจากระบบ?')) return;
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

  const handleUploadCover = useCallback(
    async (file: File) => {
      if (!file || !fid) return;
      setUploadingCover(true);
      setError('');
      setOkMsg('');
      try {
        const up = await mediaApi.upload(file);
        const url = String(up?.url ?? '').trim();
        if (!url) throw new Error('อัปโหลดรูปไม่สำเร็จ');
        await factoriesApi.patch(fid, { background_image_url: url });
        form.setValue('cover_image_url', url, { shouldDirty: false });
        setOkMsg('อัปโหลดและบันทึกรูปพื้นหลังโรงงานแล้ว');
        await refreshUser();
        await qc.invalidateQueries({ queryKey: profileInitKey });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'อัปโหลดหรือบันทึกพื้นหลังไม่สำเร็จ');
      } finally {
        setUploadingCover(false);
      }
    },
    [fid, form, qc, refreshUser],
  );

  const handleRemoveCover = useCallback(async () => {
    if (!fid) return;
    if (!window.confirm('ลบรูปพื้นหลังโรงงานออกจากระบบ?')) return;
    setUploadingCover(true);
    setError('');
    setOkMsg('');
    try {
      await factoriesApi.patch(fid, { background_image_url: '' });
      form.setValue('cover_image_url', '', { shouldDirty: false });
      setOkMsg('ลบรูปพื้นหลังแล้ว');
      await refreshUser();
      await qc.invalidateQueries({ queryKey: profileInitKey });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบพื้นหลังไม่สำเร็จ');
    } finally {
      setUploadingCover(false);
    }
  }, [fid, form, qc, refreshUser]);

  const openCropper = useCallback((target: 'profile' | 'cover', file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setCropTarget(target);
    setCropFile(file);
  }, []);

  const closeCropper = useCallback(() => {
    setCropTarget(null);
    setCropFile(null);
  }, []);

  if (fid == null) {
    return <p className='text-sm text-red-600'>บัญชีนี้ไม่ใช่โรงงาน หรือไม่มีรหัสโรงงานในระบบ</p>;
  }
  if (isError) {
    return (
      <div className='py-12 text-center'>
        <p className='text-sm text-red-600 mb-3'>โหลดข้อมูลไม่สำเร็จ</p>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => void factoryQ.refetch()}
          className='px-4 py-2 rounded-xl border border-gray-200 text-sm'
        >
          ลองใหม่
        </Button>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className='space-y-4'>
        <FactoryPageHeader title='ข้อมูลโรงงาน' subtitle='Factory Portal' icon={Building2} />
        <FormSkeleton sections={5} />
      </div>
    );
  }

  const factoryTypeName =
    factoryTypesQ.data?.find((t) => t.id === watched.factory_type_id)?.label ??
    factoryTypesQ.data?.find((t) => t.id === initialValues.factory_type_id)?.label ??
    '—';

  const catNames = ((factoryQ.data?.categories ?? []) as Array<Record<string, unknown>>)
    .map((c) => String(c.name ?? c.category_name ?? '').trim())
    .filter(Boolean);
  const subNames = ((factoryQ.data?.sub_categories ?? []) as Array<Record<string, unknown>>)
    .map((s) => String(s.name ?? s.sub_category_name ?? '').trim())
    .filter(Boolean);

  const statusChip =
    verifyStatus === 'AP'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : verifyStatus === 'RJ'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';
  const statusText =
    verifyStatus === 'AP' ? 'Approved' : verifyStatus === 'RJ' ? 'Rejected' : 'Pending';

  return (
    <div className='pb-16'>
      <div className='max-w-4xl mx-auto px-4 space-y-5'>
        <h1 className='text-2xl font-bold text-gray-900'>Factory Info</h1>

        <ImageCropModal
          open={cropTarget != null && cropFile != null}
          file={cropFile}
          title={cropTarget === 'profile' ? 'ครอปรูปโปรไฟล์โรงงาน' : 'ครอปรูปพื้นหลังโรงงาน'}
          aspect={cropTarget === 'profile' ? 1 : 16 / 9}
          outputWidth={cropTarget === 'profile' ? 900 : 1800}
          onCancel={closeCropper}
          onConfirm={async (file) => {
            try {
              if (cropTarget === 'profile') await handleUploadImage(file);
              if (cropTarget === 'cover') await handleUploadCover(file);
            } finally {
              closeCropper();
            }
          }}
        />

        {error ? (
          <div className='flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3'>
            <AlertTriangle size={16} className='text-red-500 shrink-0 mt-0.5' />
            <p className='text-sm text-red-700'>{error}</p>
          </div>
        ) : null}
        {okMsg ? (
          <div className='flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3'>
            <CheckCircle size={16} className='text-emerald-500 shrink-0 mt-0.5' />
            <p className='text-sm text-emerald-700'>{okMsg}</p>
          </div>
        ) : null}

        <div className='rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
          <div className='px-6 py-5'>
            <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
              <div className='flex items-center gap-4 min-w-0'>
                <div className='w-20 h-20 rounded-full overflow-hidden border border-gray-200 bg-gray-100 shrink-0'>
                  {String(watched.image_url ?? '').trim() ? (
                    <Image src={String(watched.image_url)} alt='' className='w-full h-full object-cover' />
                  ) : null}
                </div>
                <div className='min-w-0'>
                  <p className='text-[18px] font-bold text-gray-900 truncate'>
                    {String(watched.factory_name || initialValues.factory_name || 'โรงงานของคุณ')}
                  </p>
                  <div className='flex items-center gap-2 mt-1 flex-wrap'>
                    <span className='text-sm text-gray-600'>{factoryTypeName}</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusChip}`}>
                      {statusText}
                    </span>
                  </div>
                </div>
              </div>

              {!isEditing ? (
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => setIsEditing(true)}
                  className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50'
                >
                  <Pencil size={12} /> Edit
                </Button>
              ) : (
                <div className='flex flex-col sm:flex-row gap-2'>
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => {
                      form.reset(initialValues);
                      setIsEditing(false);
                    }}
                    className='inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50'
                  >
                    <X size={12} /> ยกเลิก
                  </Button>
                  <Button
                    variant='unstyled'
                    type='button'
                    disabled={saving}
                    onClick={() => void handleSave()}
                    className='inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60'
                    style={{ background: 'linear-gradient(135deg,#3C50E0 0%,#6366f1 100%)' }}
                  >
                    {saving ? <Loader2 size={12} className='animate-spin' /> : <CheckCircle size={12} />} บันทึก
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className='border-t border-gray-100' />
          <div className='px-6 py-5'>
            {isEditing ? (
              <BusinessInfoSection form={form} />
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5'>
                <DataField label='Factory Name' value={initialValues.factory_name} />
                <DataField label='Type' value={factoryTypeName} />
                <DataField label='Tax ID' value={initialValues.tax_id} />
                <DataField label='MOQ' value={initialValues.min_order ? String(initialValues.min_order) : '—'} />
                <DataField label='Lead Time' value={initialValues.lead_time_desc} />
                <div className='sm:col-span-2 lg:col-span-3'>
                  <DataField label='Description' value={initialValues.description} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
          <div className='flex items-center justify-between border-b border-gray-100 px-6 py-5'>
            <h2 className='text-lg font-bold text-gray-900'>หมวดหมู่</h2>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setIsCategoryEditing((p) => !p)}
              className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50'
            >
              <Pencil size={12} /> {isCategoryEditing ? 'ปิดแก้ไข' : 'Edit'}
            </Button>
          </div>
          <div className='px-6 py-5'>
            {isCategoryEditing ? (
              <CategoriesSection
                form={form}
                factoryId={fid}
                onRegisterAdd={(handler) => {
                  openCategoryPickerRef.current = handler;
                }}
                apiCategories={factoryQ.data?.categories}
                apiSubCategories={factoryQ.data?.sub_categories}
              />
            ) : (
              <div className='space-y-4'>
                <div>
                  <p className='text-[11px] text-gray-400 mb-2'>หมวดหมู่หลัก</p>
                  <div className='flex flex-wrap gap-1.5'>
                    {catNames.length
                      ? catNames.map((n) => (
                          <span key={n} className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100'>
                            {n}
                          </span>
                        ))
                      : <span className='text-sm text-gray-400'>—</span>}
                  </div>
                </div>
                <div>
                  <p className='text-[11px] text-gray-400 mb-2'>หมวดหมู่ย่อย</p>
                  <div className='flex flex-wrap gap-1.5'>
                    {subNames.length
                      ? subNames.map((n) => (
                          <span key={n} className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100'>
                            {n}
                          </span>
                        ))
                      : <span className='text-sm text-gray-400'>—</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
          <div className='flex items-center justify-between border-b border-gray-100 px-6 py-5'>
            <h2 className='text-lg font-bold text-gray-900'>ที่อยู่</h2>
            <span className='text-xs text-gray-500'>+ เพิ่มที่อยู่</span>
          </div>
          <div className='px-6 py-5'>
            <AddressesSection readOnly={false} />
          </div>
        </div>

        <div className='rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
          <div className='flex items-center justify-between border-b border-gray-100 px-6 py-5'>
            <h2 className='text-lg font-bold text-gray-900'>เอกสารและใบรับรอง</h2>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => openCertAddRef.current?.()}
              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors'
            >
              <Plus size={12} /> เพิ่มใบรับรอง
            </Button>
          </div>
          <div className='px-6 py-5'>
            <CertificatesSection
              factoryId={fid}
              certs={(factoryQ.data?.certificates ?? []) as Record<string, unknown>[]}
              onRegisterAdd={(handler) => {
                openCertAddRef.current = handler;
              }}
              readOnly={false}
            />
          </div>
        </div>

        <div className='rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
          <div className='flex items-center justify-between border-b border-gray-100 px-6 py-5'>
            <h2 className='text-lg font-bold text-gray-900'>บัญชีธนาคาร</h2>
            <span className='text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200'>Optional</span>
          </div>
          <div className='px-6 py-5'>
            <BankAccountPlaceholder />
          </div>
        </div>
      </div>
    </div>
  );
}
