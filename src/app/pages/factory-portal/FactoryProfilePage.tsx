import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
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
import { ProfileSaveBar } from '../../components/factory/profile/ProfileSaveBar';

import {
  PROFILE_FORM_DEFAULTS,
  type ProfileFormValues,
} from '../../components/factory/profile/ProfileFormTypes';

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

  const form = useForm<ProfileFormValues>({
    defaultValues: PROFILE_FORM_DEFAULTS,
    values: {
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
      category_ids: catsQ.data ?? [],
      sub_category_ids: subsQ.data ?? [],
    },
    mode: 'onBlur',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const changeCount = countDirty(form.formState.dirtyFields as Record<string, unknown>);
  const isDirty = form.formState.isDirty;

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

    const results = await Promise.allSettled([
      factoriesApi.update(fid, {
        factory_name: v.factory_name.trim(),
        tax_id: v.tax_id.trim() || undefined,
        description: v.description.trim() || undefined,
        factory_type_id: v.factory_type_id ?? undefined,
      }),
      factoriesApi.setCategories(fid, v.category_ids),
      factoriesApi.setSubCategories(fid, v.sub_category_ids),
    ]);

    const failed = results.filter((r) => r.status === 'rejected');
    setSaving(false);

    if (failed.length === 0) {
      setOkMsg('บันทึกข้อมูลเรียบร้อย');
      form.reset(v);
      await refreshUser();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['factory', 'me'] }),
        qc.invalidateQueries({ queryKey: ['factory', String(fid), 'categories'] }),
        qc.invalidateQueries({ queryKey: ['factory', String(fid), 'sub-categories'] }),
      ]);
    } else if (failed.length === results.length) {
      setError('บันทึกไม่สำเร็จ — กรุณาลองอีกครั้ง');
    } else {
      setError(`บันทึกสำเร็จบางส่วน (${failed.length} จาก ${results.length} ล้มเหลว)`);
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
  if (isLoading) return <FormSkeleton sections={5} />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSave();
      }}
      className="space-y-6 sm:space-y-8 pb-28 sm:pb-28 w-full min-w-0"
    >
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      ) : null}
      {okMsg ? (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          {okMsg}
        </p>
      ) : null}

      <VerifyStatusBanner status={verifyStatus} />

      <BusinessInfoSection form={form} />
      <CategoriesSection form={form} factoryId={fid} />
      <AddressesSection />
      <CertificatesSection factoryId={fid} />
      <BankAccountPlaceholder />

      <ProfileSaveBar
        isDirty={isDirty}
        changeCount={changeCount}
        saving={saving}
        onSave={() => void handleSave()}
        onDiscard={() => form.reset()}
      />
    </form>
  );
}
