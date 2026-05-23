import React, { useCallback, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { getErrorMessage } from '@/lib/apiError';
import { normalizeReviewImageUrls, REVIEW_IMAGE_MAX } from '@/utils/reviewImageUrls';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';

type Props = {
  urls: string[];
  onChange?: (next: string[]) => void;
  disabled?: boolean;
  onPreviewUrl?: (url: string) => void;
  onUploadError?: (message: string) => void;
};

export function ReviewImageAttachments({
  urls,
  onChange,
  disabled,
  onPreviewUrl,
  onUploadError,
}: Readonly<Props>) {
  const editable = Boolean(onChange) && !disabled;

  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useImageUpload({
    maxFiles: REVIEW_IMAGE_MAX - urls.length,
    multiple: true,
    onSuccess: (newUrls) => {
      if (onChange) {
        const next = [...urls, ...newUrls];
        onChange(normalizeReviewImageUrls(next));
      }
    },
    onError: (error) => {
      onUploadError?.(getErrorMessage(error, 'อัปโหลดรูปไม่สำเร็จ'));
    },
    fallbackMessage: 'อัปโหลดรูปไม่สำเร็จ',
  });

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !onChange) return;
      await upload(files);
    },
    [upload, onChange],
  );

  const removeAt = (idx: number) => {
    if (!onChange) return;
    onChange(urls.filter((_, i) => i !== idx));
  };

  if (urls.length === 0 && !editable) return null;

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap gap-2'>
        {urls.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className='relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0'
          >
            {onPreviewUrl ? (
              <Button
                variant='unstyled'
                type='button'
                className='w-full h-full block'
                onClick={() => onPreviewUrl(url)}
              >
                <Image src={url} alt='' className='w-full h-full object-cover' />
              </Button>
            ) : (
              <Image src={url} alt='' className='w-full h-full object-cover' />
            )}
            {editable ? (
              <Button
                variant='unstyled'
                type='button'
                className='absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center'
                aria-label='ลบรูป'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeAt(idx);
                }}
              >
                <X size={12} strokeWidth={2.5} />
              </Button>
            ) : null}
          </div>
        ))}
        {editable && urls.length < REVIEW_IMAGE_MAX ? (
          <>
            <Input
              ref={inputRef}
              type='file'
              accept='image/*'
              multiple
              className='hidden'
              onChange={(e) => {
                void addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <Button
              variant='unstyled'
              type='button'
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              className='w-16 h-16 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-[10px] gap-0.5 disabled:opacity-50'
            >
              <ImagePlus size={18} />
              {isUploading ? '…' : 'เพิ่ม'}
            </Button>
          </>
        ) : null}
      </div>
      {editable ? (
        <p className='text-[10px] text-gray-400'>แนบรูปได้ไม่เกิน {REVIEW_IMAGE_MAX} รูป</p>
      ) : null}
    </div>
  );
}
