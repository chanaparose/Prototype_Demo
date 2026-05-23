import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { factoriesApi, mediaApi } from '@/services/api/factoryApi';
import { profileInitKey } from '@/hooks/factory/useProfileInit';
import { useAppMutation } from '@/hooks/useAppMutation';

export type SaveProfileInput = {
  factoryId: number;
  payload: Parameters<typeof factoriesApi.saveProfile>[1];
};

export type UploadFactoryImageInput = {
  factoryId: number;
  file: File;
  field: 'image_url' | 'background_image_url';
};

export function useFactoryProfileMutations() {
  const qc = useQueryClient();
  const [actionError, setActionError] = useState('');

  const invalidateProfile = () => qc.invalidateQueries({ queryKey: profileInitKey });

  const saveProfile = useAppMutation({
    mutationFn: ({ factoryId, payload }: SaveProfileInput) =>
      factoriesApi.saveProfile(factoryId, payload),
    onMutate: () => setActionError(''),
    onSuccess: invalidateProfile,
    onErrorMessage: setActionError,
    fallbackMessage: 'บันทึกไม่สำเร็จ — กรุณาลองอีกครั้ง',
  });

  const uploadImage = useAppMutation({
    mutationFn: async ({ factoryId, file, field }: UploadFactoryImageInput) => {
      const up = await mediaApi.upload(file);
      const url = String(up?.url ?? '').trim();
      if (!url) throw new Error('อัปโหลดรูปไม่สำเร็จ');
      const patch =
        field === 'image_url' ? { image_url: url } : { background_image_url: url };
      await factoriesApi.patch(factoryId, patch);
      return { url, field };
    },
    onMutate: () => setActionError(''),
    onSuccess: invalidateProfile,
    onErrorMessage: setActionError,
    fallbackMessage: 'อัปโหลดหรือบันทึกรูปไม่สำเร็จ',
  });

  const removeCover = useAppMutation({
    mutationFn: (factoryId: number) =>
      factoriesApi.patch(factoryId, { background_image_url: '' }),
    onMutate: () => setActionError(''),
    onSuccess: invalidateProfile,
    onErrorMessage: setActionError,
    fallbackMessage: 'ลบพื้นหลังไม่สำเร็จ',
  });

  return {
    actionError,
    setActionError,
    saveProfile,
    uploadImage,
    removeCover,
  };
}
