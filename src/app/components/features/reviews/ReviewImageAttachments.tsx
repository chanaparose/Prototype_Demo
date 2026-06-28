import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImagePlus, X } from 'lucide-react';
import { mediaApi } from '@/services/api/factoryApi';
import { normalizeReviewImageUrls, REVIEW_IMAGE_MAX } from '@/utils/reviewImageUrls';
import { REVIEW_BODY_TEXT_CLASS } from '@/components/features/reviews/reviewBrowseUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import { cn } from '@lib/utils';

type Props = {
  urls: string[];
  onChange?: (next: string[]) => void;
  disabled?: boolean;
  onPreviewUrl?: (url: string) => void;
  /** Called when upload fails (e.g. toast) */
  onUploadError?: (message: string) => void;
};

export function ReviewImageAttachments({
  urls,
  onChange,
  disabled,
  onPreviewUrl,
  onUploadError,
}: Props) {
  const editable = Boolean(onChange) && !disabled;
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files || !onChange) return;
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) {
      if (Array.from(files).length > 0) toast.error('รองรับเฉพาะไฟล์รูปภาพเท่านั้น');
      return;
    }
    setUploading(true);
    try {
      let next = [...urls];
      for (const f of list) {
        if (next.length >= REVIEW_IMAGE_MAX) break;
        const { url } = await mediaApi.upload(f);
        const u = String(url ?? '').trim();
        if (u && !next.includes(u)) next.push(u);
      }
      onChange(normalizeReviewImageUrls(next));
    } catch (e) {
      onUploadError?.(e instanceof Error ? e.message : 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

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
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-gray-300 text-gray-400 disabled:opacity-50',
                REVIEW_BODY_TEXT_CLASS,
              )}
            >
              <ImagePlus size={18} />
              {uploading ? '…' : 'เพิ่ม'}
            </Button>
          </>
        ) : null}
      </div>
      {editable ? (
        <p className={cn('text-gray-400', REVIEW_BODY_TEXT_CLASS)}>
          แนบรูปได้ไม่เกิน {REVIEW_IMAGE_MAX} รูป
        </p>
      ) : null}
    </div>
  );
}
