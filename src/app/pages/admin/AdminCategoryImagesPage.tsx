import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getLbiHubs } from '@/services/api/masterApi';
import { mediaApi } from '@/services/api/factoryApi';
import { adminCatalogApi } from '@/services/api/adminApi';
import { ImageCropModal } from '@/components/common/ImageCropModal';
import type { IHubResponse, ICategoryForHubResponse } from '@/services/api/types/master.types';

type EditTarget = {
  category: ICategoryForHubResponse;
  file: File;
};

function CategoryCard({
  cat,
  onPickFile,
}: {
  cat: ICategoryForHubResponse;
  onPickFile: (cat: ICategoryForHubResponse, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasImg = Boolean(cat.img);

  return (
    <div className='relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm'>
      {/* image slot 1:1 */}
      <div
        className='relative w-full cursor-pointer bg-gray-50'
        style={{ aspectRatio: '1 / 1' }}
        onClick={() => inputRef.current?.click()}
        title='คลิกเพื่อเปลี่ยนภาพ'
      >
        {hasImg ? (
          <img
            src={cat.img}
            alt={cat.name}
            className='absolute inset-[4%] h-[92%] w-[92%] rounded-lg object-contain'
          />
        ) : (
          <div className='flex h-full w-full flex-col items-center justify-center gap-1 text-gray-300'>
            <ImagePlus size={28} strokeWidth={1.5} />
            <span className='text-[10px]'>ยังไม่มีภาพ</span>
          </div>
        )}
        <div className='absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100 bg-black/20 rounded-none'>
          <span className='rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-gray-700 shadow'>
            เปลี่ยนภาพ
          </span>
        </div>
        {hasImg ? (
          <span className='absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow'>
            <CheckCircle2 size={13} className='text-emerald-500' />
          </span>
        ) : (
          <span className='absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow'>
            <AlertCircle size={13} className='text-gray-300' />
          </span>
        )}
      </div>

      <div className='px-2.5 py-2'>
        <p className='text-[11px] font-semibold leading-tight text-gray-800 line-clamp-2'>{cat.name}</p>
        <p className='mt-0.5 text-[10px] text-gray-400'>ID {cat.category_id}</p>
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickFile(cat, f);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
    </div>
  );
}

export function AdminCategoryImagesPage() {
  const qc = useQueryClient();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [saving, setSaving] = useState(false);

  const hubsQ = useQuery({
    queryKey: ['lbi-hubs', 'all'],
    queryFn: async () => {
      const res = await getLbiHubs();
      const raw = res as unknown as { hubs?: IHubResponse[] };
      return raw.hubs ?? [];
    },
    staleTime: 60_000,
  });

  const hubs = hubsQ.data ?? [];

  const handleConfirmCrop = async (croppedFile: File) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const uploaded = await mediaApi.upload(croppedFile);
      await adminCatalogApi.patchCategoryImg(editTarget.category.category_id, uploaded.url);
      toast.success(`อัปเดตภาพ "${editTarget.category.name}" เรียบร้อย`);
      await qc.invalidateQueries({ queryKey: ['lbi-hubs'] });
      setEditTarget(null);
    } catch {
      toast.error('อัปโหลดภาพไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-lg font-bold text-gray-900'>ภาพประจำหมวดหมู่</h2>
        <p className='mt-0.5 text-sm text-gray-500'>
          คลิกที่ card เพื่ออัปโหลดและครอปภาพ (1:1) สำหรับแต่ละหมวดหมู่
        </p>
      </div>

      {hubsQ.isLoading ? (
        <div className='py-20 text-center text-sm text-gray-400'>กำลังโหลด...</div>
      ) : null}

      {hubs.map((hub) => (
        <section key={hub.hub_id} className='space-y-3'>
          <div className='flex items-center gap-2'>
            <span className='h-5 w-1 rounded-full bg-brand-purple/70' />
            <h3 className='text-[13px] font-bold text-gray-800'>{hub.name}</h3>
            <span className='rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500'>
              {hub.scope}
            </span>
            <span className='text-[11px] text-gray-400'>
              {hub.categories.filter((c) => c.img).length}/{hub.categories.length} มีภาพ
            </span>
          </div>

          <div className='grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'>
            {hub.categories.map((cat) => (
              <CategoryCard
                key={cat.category_id}
                cat={cat}
                onPickFile={(c, f) => setEditTarget({ category: c, file: f })}
              />
            ))}
          </div>
        </section>
      ))}

      <ImageCropModal
        open={editTarget !== null && !saving}
        file={editTarget?.file ?? null}
        title={`ครอปภาพ: ${editTarget?.category.name ?? ''}`}
        aspect={1}
        outputWidth={800}
        onCancel={() => setEditTarget(null)}
        onConfirm={handleConfirmCrop}
      />

      {saving ? (
        <div className='fixed inset-0 z-[200] flex items-center justify-center bg-black/30'>
          <div className='rounded-xl bg-white px-6 py-4 text-sm font-medium text-gray-700 shadow-xl'>
            กำลังอัปโหลด...
          </div>
        </div>
      ) : null}
    </div>
  );
}
