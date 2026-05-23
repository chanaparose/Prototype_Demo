import { useCallback, useRef } from 'react';
import { mediaApi } from '@/services/api/factoryApi';
import { useAppMutation } from '@/hooks/useAppMutation';

interface UseImageUploadOptions {
  maxFiles?: number;
  multiple?: boolean;
  onSuccess?: (urls: string[]) => void;
  onError?: (error: Error) => void;
  fallbackMessage?: string;
}

interface UseImageUploadResult {
  upload: (files: FileList | null) => Promise<void>;
  isUploading: boolean;
  uploadFile: (file: File) => Promise<string>;
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadResult {
  const {
    maxFiles = 5,
    multiple = true,
    onSuccess,
    onError,
    fallbackMessage = 'อัปโหลดรูปไม่สำเร็จ',
  } = options;

  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useAppMutation({
    mutationFn: async (files: FileList) => {
      const uploaded: string[] = [];
      const filesToProcess = multiple
        ? Array.from(files).slice(0, maxFiles)
        : [files[0]];

      for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) continue;
        try {
          const result = await mediaApi.upload(file);
          const url = typeof result.url === 'string' ? result.url.trim() : '';
          if (/^https?:\/\//i.test(url)) {
            uploaded.push(url);
            if (!multiple || uploaded.length >= maxFiles) break;
          }
        } catch (err) {
          if (onError && err instanceof Error) {
            onError(err);
          }
          throw err;
        }
      }

      if (uploaded.length === 0) {
        throw new Error('ไม่พบรูปที่ถูกต้องในไฟล์ที่เลือก');
      }

      return uploaded;
    },
    fallbackMessage,
    onMutate: () => {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    onSuccess: (urls) => {
      if (onSuccess) {
        onSuccess(urls);
      }
    },
    onError,
  });

  const upload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      await uploadMutation.mutateAsync(files);
    },
    [uploadMutation],
  );

  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      if (!file.type.startsWith('image/')) {
        throw new Error('ต้องเลือกไฟล์รูปภาพเท่านั้น');
      }

      const result = await mediaApi.upload(file);
      const url = typeof result.url === 'string' ? result.url.trim() : '';

      if (!/^https?:\/\//i.test(url)) {
        throw new Error('อัปโหลดรูปไม่สำเร็จ');
      }

      return url;
    },
    [],
  );

  return {
    upload,
    isUploading: uploadMutation.isPending,
    uploadFile,
  };
}
