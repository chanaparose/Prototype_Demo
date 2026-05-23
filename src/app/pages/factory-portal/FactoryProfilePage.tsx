import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useFactoryProfileMutations } from '@/pages/factory-portal/hooks/useFactoryProfileMutations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileFormSchema } from '@/domain/factory/schemas/profileForm.schema';
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
import { useProfileInit } from '@/hooks/factory/useProfileInit';
import { useBeforeUnload } from '@/hooks/forms/useBeforeUnload';

import { FormSkeleton } from '@/components/common/FormSkeleton';
import { ImageCropModal } from '@/components/common/ImageCropModal';
import { VerifyStatusBanner } from '@/components/factory/profile/VerifyStatusBanner';
import { BusinessInfoSection } from '@/components/factory/profile/BusinessInfoSection';
import { CategoriesSection } from '@/components/factory/profile/CategoriesSection';
import { AddressesSection } from '@/components/factory/profile/AddressesSection';
import { CertificatesSection } from '@/components/factory/profile/CertificatesSection';
import { BankAccountPlaceholder } from '@/components/factory/profile/BankAccountPlaceholder';
import { ProfileSaveBar } from '@/components/factory/profile/ProfileSaveBar';
import { SectionCard } from '@/shared/ui/cards/SectionCard';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import { useConfirmDialog } from '@/shared/ui/modals/ConfirmDialog';
import { COMMON_COPY } from '@/constants/uiText';

import {
  PROFILE_FORM_DEFAULTS,
  type ProfileFormValues,
} from '@/components/factory/profile/ProfileFormTypes';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
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

function sectionBadge(complete: boolean) {
  return (
    <StatusBadge variant={complete ? 'success' : 'pending'} size='sm'>
      {complete ? 'ครบถ้วน ✓' : 'ยังไม่ครบ !'}
    </StatusBadge>
  );
}

interface StepDef {
  label: string;
  sublabel: string;
  complete: boolean;
}

function VerificationStepper({ steps }: { steps: StepDef[] }) {
  const allDone = steps.every((s) => s.complete);
  return (
    <div className='rounded-2xl border border-gray-100 bg-white shadow-sm p-5'>
      <div className='flex items-center justify-between mb-4'>
        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider'>
          ขั้นตอนการยืนยัน
        </p>
        <span
          className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${allDone ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}
        >
          {steps.filter((s) => s.complete).length}/{steps.length} ขั้นตอน
        </span>
      </div>

      <div className='flex items-start'>
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className='flex flex-col items-center gap-2 flex-1 min-w-0'>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  step.complete
                    ? 'bg-teal-500 text-white shadow-sm shadow-teal-200'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step.complete ? '✓' : i + 1}
              </div>
              <div className='text-center min-w-0 px-1'>
                <p
                  className={`text-[10px] font-semibold leading-tight ${step.complete ? 'text-teal-700' : 'text-gray-500'}`}
                >
                  {step.label}
                </p>
                <p className='text-[9px] text-gray-400 leading-tight mt-0.5 hidden sm:block'>
                  {step.sublabel}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className='h-0.5 flex-1 mt-[18px] mx-1 shrink-0 transition-all'
                style={{ backgroundColor: step.complete ? '#14b8a6' : 'var(--neutral-border)' }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function FactoryHeroCard({
  factoryName,
  verifyStatus,
  imageUrl,
  coverImageUrl,
  uploadingImage,
  uploadingCover,
  onPickImage,
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
              {COMMON_COPY.defaultFactoryName}
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
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const initQ = useProfileInit();

  // Adapter: expose the same shape as useMyFactory so the rest of the page doesn't change
  const factory = initQ.data?.factory;
  const factoryQ = {
    ...initQ,
    data: factory,
    categoryIds: (factory?.categories ?? []).map((c) => c.category_id),
    subCategoryIds: (factory?.sub_categories ?? []).map((s) => s.sub_category_id),
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

  const { saveProfile, uploadImage, removeCover } = useFactoryProfileMutations();
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
  const requiredStatus = useMemo(() => {
    const hasBusiness = Boolean(watched.factory_name?.trim()) && Boolean(watched.factory_type_id);
    const hasCategories = (watched.category_ids?.length ?? 0) > 0;
    const hasAddress = true;
    const hasCertificates = true;
    return { hasBusiness, hasCategories, hasAddress, hasCertificates };
  }, [watched]);

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
    setError('');
    setOkMsg('');

    const normalizedCategoryIds = normalizeIds(v.category_ids);
    const normalizedSubCategoryIds = normalizeIds(v.sub_category_ids);

    const saveDraftValues: ProfileFormValues = {
      ...v,
      category_ids: normalizedCategoryIds,
      sub_category_ids: normalizedSubCategoryIds,
    };

    saveProfile.mutate(
      {
        factoryId: fid,
        payload: {
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
        },
      },
      {
        onSuccess: async () => {
          setOkMsg('บันทึกข้อมูลเรียบร้อย');
          form.reset(saveDraftValues);
          await refreshUser();
        },
        onError: (err) =>
          setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ — กรุณาลองอีกครั้ง'),
      },
    );
  }, [fid, form, refreshUser, saveProfile]);

  const handleUploadImage = useCallback(
    async (file: File) => {
      if (!file || !fid) return;
      setError('');
      setOkMsg('');
      uploadImage.mutate(
        { factoryId: fid, file, field: 'image_url' },
        {
          onMutate: () => setUploadingImage(true),
          onSettled: () => setUploadingImage(false),
          onSuccess: ({ url }) => {
            form.setValue('image_url', url, { shouldDirty: false });
            setOkMsg('อัปโหลดและบันทึกรูปโปรไฟล์โรงงานแล้ว');
            void refreshUser();
          },
          onError: (err) =>
            setError(err instanceof Error ? err.message : 'อัปโหลดหรือบันทึกรูปไม่สำเร็จ'),
        },
      );
    },
    [fid, form, refreshUser, uploadImage],
  );

  const handleUploadCover = useCallback(
    async (file: File) => {
      if (!file || !fid) return;
      setError('');
      setOkMsg('');
      uploadImage.mutate(
        { factoryId: fid, file, field: 'background_image_url' },
        {
          onMutate: () => setUploadingCover(true),
          onSettled: () => setUploadingCover(false),
          onSuccess: ({ url }) => {
            form.setValue('cover_image_url', url, { shouldDirty: false });
            setOkMsg('อัปโหลดและบันทึกรูปพื้นหลังโรงงานแล้ว');
            void refreshUser();
          },
          onError: (err) =>
            setError(err instanceof Error ? err.message : 'อัปโหลดหรือบันทึกพื้นหลังไม่สำเร็จ'),
        },
      );
    },
    [fid, form, refreshUser, uploadImage],
  );

  const handleRemoveCover = useCallback(async () => {
    if (!fid) return;
    const ok = await confirm({
      title: 'ลบรูปพื้นหลังโรงงาน',
      description: 'รูปพื้นหลังโรงงานจะถูกลบออกจากระบบ ต้องการดำเนินการต่อหรือไม่?',
      confirmText: 'ลบรูป',
      destructive: true,
    });
    if (!ok) return;
    setError('');
    setOkMsg('');
    removeCover.mutate(fid, {
      onMutate: () => setUploadingCover(true),
      onSettled: () => setUploadingCover(false),
      onSuccess: async () => {
        form.setValue('cover_image_url', '', { shouldDirty: false });
        setOkMsg('ลบรูปพื้นหลังแล้ว');
        await refreshUser();
      },
      onError: (err) =>
        setError(err instanceof Error ? err.message : 'ลบพื้นหลังไม่สำเร็จ'),
    });
  }, [confirm, fid, form, refreshUser, removeCover]);

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
        <FactoryPageHeader title='ข้อมูลโรงงาน' subtitle={COMMON_COPY.factoryPortal} icon={Building2} />
        <FormSkeleton sections={5} />
      </div>
    );
  }

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
    <div className='space-y-5 pb-32' style={{ backgroundColor: COLORS.pageBg }}>
      <FactoryPageHeader
        title='ข้อมูลโรงงาน'
        subtitle={isVerified ? 'ยืนยันแล้ว' : 'ตั้งค่าโปรไฟล์โรงงาน'}
        icon={Building2}
      />

      <FactoryHeroCard
        factoryName={String(watched.factory_name || initialValues.factory_name || COMMON_COPY.defaultFactoryName)}
        verifyStatus={verifyStatus}
        imageUrl={String(watched.image_url ?? '').trim()}
        coverImageUrl={String(watched.cover_image_url ?? '').trim()}
        uploadingImage={uploadingImage}
        uploadingCover={uploadingCover}
        onPickImage={(file) => {
          openCropper('profile', file);
        }}
        onPickCover={(file) => {
          openCropper('cover', file);
        }}
        onRemoveCover={() => void handleRemoveCover()}
      />

      <ImageCropModal
        open={cropTarget != null && cropFile != null}
        file={cropFile}
        title={cropTarget === 'profile' ? 'ครอปรูปโปรไฟล์โรงงาน' : 'ครอปรูปพื้นหลังโรงงาน'}
        aspect={cropTarget === 'profile' ? 1 : 16 / 9}
        outputWidth={cropTarget === 'profile' ? 900 : 1800}
        onCancel={closeCropper}
        onConfirm={async (file) => {
          if (cropTarget === 'profile') {
            await handleUploadImage(file);
          } else if (cropTarget === 'cover') {
            await handleUploadCover(file);
          }
          closeCropper();
        }}
      />
      <ConfirmDialog />

      {!isVerified && <VerificationStepper steps={steps} />}
      <VerifyStatusBanner status={verifyStatus} />

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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        className='space-y-5 w-full min-w-0'
      >
        <SectionCard
          icon={<Building2 size={14} style={{ color: COLORS.purple }} strokeWidth={2} />}
          title='ข้อมูลพื้นฐาน'
          iconClassName='h-8 w-8 rounded-lg'
          iconStyle={{ backgroundColor: 'rgba(79,70,229,0.1)' }}
          titleClassName='text-[12px] font-bold leading-none text-gray-800 truncate'
          headerClassName='px-6 py-4'
          contentClassName='px-6 py-5'
          badge={sectionBadge(requiredStatus.hasBusiness)}
        >
          <BusinessInfoSection form={form} />
        </SectionCard>

        <SectionCard
          icon={<Award size={14} style={{ color: '#0EA5E9' }} strokeWidth={2} />}
          title='ข้อมูลการผลิตและหมวดหมู่'
          iconClassName='h-8 w-8 rounded-lg'
          iconStyle={{ backgroundColor: 'rgba(14,165,233,0.1)' }}
          titleClassName='text-[12px] font-bold leading-none text-gray-800 truncate'
          headerClassName='px-6 py-4'
          contentClassName='px-6 py-5'
          badge={sectionBadge(requiredStatus.hasCategories)}
          actionButton={
            <Button
              variant='unstyled'
              type='button'
              onClick={() => openCategoryPickerRef.current?.()}
              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors'
            >
              <Plus size={12} />
              เพิ่มหมวดหมู่
            </Button>
          }
        >
          <CategoriesSection
            form={form}
            factoryId={fid}
            onRegisterAdd={(handler) => {
              openCategoryPickerRef.current = handler;
            }}
            apiCategories={factoryQ.data?.categories}
            apiSubCategories={factoryQ.data?.sub_categories}
          />
        </SectionCard>

        <SectionCard
          icon={<MapPin size={14} style={{ color: '#F97316' }} strokeWidth={2} />}
          title='ที่อยู่และการติดต่อ'
          iconClassName='h-8 w-8 rounded-lg'
          iconStyle={{ backgroundColor: 'rgba(249,115,22,0.1)' }}
          titleClassName='text-[12px] font-bold leading-none text-gray-800 truncate'
          headerClassName='px-6 py-4'
          contentClassName='px-6 py-5'
          badge={sectionBadge(requiredStatus.hasAddress)}
        >
          <AddressesSection />
        </SectionCard>

        <SectionCard
          icon={<Award size={14} style={{ color: '#10B981' }} strokeWidth={2} />}
          title='เอกสารและใบรับรอง'
          iconClassName='h-8 w-8 rounded-lg'
          iconStyle={{ backgroundColor: 'rgba(16,185,129,0.1)' }}
          titleClassName='text-[12px] font-bold leading-none text-gray-800 truncate'
          headerClassName='px-6 py-4'
          contentClassName='px-6 py-5'
          badge={sectionBadge(requiredStatus.hasCertificates)}
          actionButton={
            <Button
              variant='unstyled'
              type='button'
              onClick={() => openCertAddRef.current?.()}
              className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors'
            >
              <Plus size={12} />
              เพิ่มใบรับรอง
            </Button>
          }
        >
          <p className='text-xs text-gray-400 mb-3'>เช่น GMP, Halal, ISO, มาตรฐานอาหาร</p>
          <CertificatesSection
            factoryId={fid}
            certs={(factoryQ.data?.certificates ?? []) as Record<string, unknown>[]}
            onRegisterAdd={(handler) => {
              openCertAddRef.current = handler;
            }}
          />
        </SectionCard>

        <SectionCard
          icon={<Landmark size={14} style={{ color: '#6366F1' }} strokeWidth={2} />}
          title='บัญชีธนาคาร'
          iconClassName='h-8 w-8 rounded-lg'
          iconStyle={{ backgroundColor: 'rgba(99,102,241,0.1)' }}
          titleClassName='text-[12px] font-bold leading-none text-gray-800 truncate'
          headerClassName='px-6 py-4'
          contentClassName='px-6 py-5'
        >
          <div className='flex items-center gap-2 mb-3'>
            <span className='text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500'>
              Optional
            </span>
            <p className='text-xs text-gray-400'>ใช้สำหรับรับการโอนเงิน</p>
          </div>
          <BankAccountPlaceholder />
        </SectionCard>

        {isDirty && changeCount > 0 && (
          <p className='text-xs text-gray-400 text-center'>
            มี {changeCount} ฟิลด์ที่เปลี่ยนแปลง — กดบันทึกเพื่อยืนยัน
          </p>
        )}
      </form>

      <ProfileSaveBar
        isDirty={isDirty}
        changeCount={changeCount}
        saving={saveProfile.isPending}
        onSave={() => void handleSave()}
        onDiscard={() => form.reset(initialValues)}
      />
    </div>
  );
}
