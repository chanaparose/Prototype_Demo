import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, CheckCircle2, AlertCircle, Crop, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@lib/utils';
import { getLbiHubs } from '@/services/api/masterApi';
import { mediaApi } from '@/services/api/factoryApi';
import { adminCatalogApi } from '@/services/api/adminApi';
import { ImageCropModal } from '@/components/common/ImageCropModal';
import {
  HUB_CARD_IMG_FRAME_CLASS,
  HUB_CARD_IMG_CLASS,
} from '@/components/features/hub/HubCategoryCard';
import { resolveHubImg } from '@/components/features/hub/HubCard';
import { HUB_SCOPE_LABELS } from '@/components/features/hub/hubRowShared';
import { Button } from '@/components/ui/button';
import type { IHubResponse, ICategoryForHubResponse } from '@/services/api/types/master.types';

type AdminImageTab = 'hub' | 'category';

type HubEditTarget = { kind: 'hub'; hub: IHubResponse; file: File };
type CategoryEditTarget = { kind: 'category'; category: ICategoryForHubResponse; file: File };
type EditTarget = HubEditTarget | CategoryEditTarget;

/** ดึงภาพเดิมจาก URL มาเป็น File เพื่อครอปใหม่ได้โดยไม่ต้องอัพโหลดไฟล์ใหม่ */
async function urlToFile(url: string, name: string): Promise<File> {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error('โหลดภาพเดิมไม่สำเร็จ');
  const blob = await res.blob();
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `${name}.${ext}`, { type: blob.type || 'image/jpeg' });
}

function ImageSlotActions({
  hasImg,
  onUploadClick,
  onRecrop,
}: {
  hasImg: boolean;
  onUploadClick: () => void;
  onRecrop?: () => void;
}) {
  return (
    <>
      <div className='absolute inset-0 flex items-center justify-center gap-1.5 bg-black/25 opacity-0 transition-opacity group-hover:opacity-100'>
        <button
          type='button'
          onClick={onUploadClick}
          title='อัปโหลดภาพใหม่'
          className='flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow transition-transform hover:scale-105'
        >
          <Upload size={14} />
        </button>
        {hasImg && onRecrop ? (
          <button
            type='button'
            onClick={onRecrop}
            title='ครอป/จัดตำแหน่งภาพเดิม'
            className='flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow transition-transform hover:scale-105'
          >
            <Crop size={14} />
          </button>
        ) : null}
      </div>
      <span className='absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow'>
        {hasImg ? (
          <CheckCircle2 size={13} className='text-emerald-500' />
        ) : (
          <AlertCircle size={13} className='text-gray-300' />
        )}
      </span>
    </>
  );
}

function HubImageCard({
  hub,
  onPickFile,
  onRecrop,
}: {
  hub: IHubResponse;
  onPickFile: (hub: IHubResponse, file: File) => void;
  onRecrop: (hub: IHubResponse) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgSrc = resolveHubImg(hub);
  const hasImg = Boolean(imgSrc);
  const factoryCount = hub.categories.reduce((s, c) => s + (c.factory_count ?? 0), 0);

  return (
    <div className='group relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm'>
      <div className={HUB_CARD_IMG_FRAME_CLASS} style={{ aspectRatio: '1 / 1' }}>
        {hasImg ? (
          <img src={imgSrc} alt={hub.name} className={HUB_CARD_IMG_CLASS} />
        ) : (
          <div className='flex h-full w-full flex-col items-center justify-center gap-1 text-gray-300'>
            <ImagePlus size={28} strokeWidth={1.5} />
            <span className='text-[10px]'>ยังไม่มีภาพ</span>
          </div>
        )}
        <ImageSlotActions
          hasImg={hasImg}
          onUploadClick={() => inputRef.current?.click()}
          onRecrop={hasImg ? () => onRecrop(hub) : undefined}
        />
      </div>

      <div className='px-2.5 py-2'>
        <p className='line-clamp-2 text-[11px] font-semibold leading-tight text-gray-800'>{hub.name}</p>
        <p className='mt-0.5 text-[10px] text-gray-400'>
          Hub #{hub.hub_id}
          {factoryCount > 0 ? ` · ${factoryCount} โรงงาน` : ''}
        </p>
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickFile(hub, f);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
    </div>
  );
}

function CategoryImageCard({
  cat,
  onPickFile,
  onRecrop,
}: {
  cat: ICategoryForHubResponse;
  onPickFile: (cat: ICategoryForHubResponse, file: File) => void;
  onRecrop: (cat: ICategoryForHubResponse) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasImg = Boolean(cat.img);

  return (
    <div className='group relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm'>
      <div className={HUB_CARD_IMG_FRAME_CLASS} style={{ aspectRatio: '1 / 1' }}>
        {hasImg ? (
          <img src={cat.img} alt={cat.name} className={HUB_CARD_IMG_CLASS} />
        ) : (
          <div className='flex h-full w-full flex-col items-center justify-center gap-1 text-gray-300'>
            <ImagePlus size={28} strokeWidth={1.5} />
            <span className='text-[10px]'>ยังไม่มีภาพ</span>
          </div>
        )}
        <ImageSlotActions
          hasImg={hasImg}
          onUploadClick={() => inputRef.current?.click()}
          onRecrop={hasImg ? () => onRecrop(cat) : undefined}
        />
      </div>

      <div className='px-2.5 py-2'>
        <p className='line-clamp-2 text-[11px] font-semibold leading-tight text-gray-800'>{cat.name}</p>
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

const TABS: { key: AdminImageTab; label: string }[] = [
  { key: 'hub', label: 'Hub' },
  { key: 'category', label: 'Category' },
];

export function AdminCategoryImagesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<AdminImageTab>('hub');
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingRecropId, setLoadingRecropId] = useState<number | null>(null);

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
  const pdHubs = hubs.filter((h) => h.scope === 'PD');
  const mtHubs = hubs.filter((h) => h.scope === 'MT');
  const hubsWithImg = hubs.filter((h) => resolveHubImg(h)).length;
  const categories = hubs.flatMap((h) => h.categories);
  const categoriesWithImg = categories.filter((c) => c.img).length;

  const handleRecropHub = async (hub: IHubResponse) => {
    const imgSrc = resolveHubImg(hub);
    if (!imgSrc) return;
    setLoadingRecropId(hub.hub_id);
    try {
      const file = await urlToFile(imgSrc, `hub-${hub.hub_id}`);
      setEditTarget({ kind: 'hub', hub, file });
    } catch {
      toast.error('โหลดภาพเดิมไม่สำเร็จ ลองอัปโหลดไฟล์ใหม่แทน');
    } finally {
      setLoadingRecropId(null);
    }
  };

  const handleRecropCategory = async (cat: ICategoryForHubResponse) => {
    if (!cat.img) return;
    setLoadingRecropId(cat.category_id);
    try {
      const file = await urlToFile(cat.img, `category-${cat.category_id}`);
      setEditTarget({ kind: 'category', category: cat, file });
    } catch {
      toast.error('โหลดภาพเดิมไม่สำเร็จ ลองอัปโหลดไฟล์ใหม่แทน');
    } finally {
      setLoadingRecropId(null);
    }
  };

  const handleConfirmCrop = async (croppedFile: File) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const uploaded = await mediaApi.upload(croppedFile);
      if (editTarget.kind === 'hub') {
        await adminCatalogApi.patchHubImg(editTarget.hub.hub_id, uploaded.url);
        toast.success(`อัปเดตภาพ hub "${editTarget.hub.name}" เรียบร้อย`);
      } else {
        await adminCatalogApi.patchCategoryImg(editTarget.category.category_id, uploaded.url);
        toast.success(`อัปเดตภาพ "${editTarget.category.name}" เรียบร้อย`);
      }
      await qc.invalidateQueries({ queryKey: ['lbi-hubs'] });
      setEditTarget(null);
    } catch {
      toast.error('อัปโหลดภาพไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const renderHubGrid = (list: IHubResponse[]) => (
    <div className='grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'>
      {list.map((hub) => (
        <HubImageCard
          key={hub.hub_id}
          hub={hub}
          onPickFile={(h, f) => setEditTarget({ kind: 'hub', hub: h, file: f })}
          onRecrop={handleRecropHub}
        />
      ))}
    </div>
  );

  const cropTitle =
    editTarget?.kind === 'hub'
      ? editTarget.hub.name
      : editTarget?.kind === 'category'
        ? editTarget.category.name
        : '';

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-lg font-bold text-gray-900'>ภาพ Hub / หมวดหมู่</h2>
        <p className='mt-0.5 text-sm text-gray-500'>
          อัปโหลดและครอปภาพ 1:1 — Hub สำหรับ /factory-ideas-hub · Category สำหรับการ์ดหมวดบน /factory-ideas
        </p>
      </div>

      <div className='flex gap-1 flex-wrap'>
        {TABS.map((t) => {
          const active = tab === t.key;
          const countLabel =
            t.key === 'hub'
              ? hubs.length > 0
                ? `${hubsWithImg}/${hubs.length}`
                : null
              : categories.length > 0
                ? `${categoriesWithImg}/${categories.length}`
                : null;
          return (
            <Button
              variant='unstyled'
              key={t.key}
              type='button'
              onClick={() => setTab(t.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                active
                  ? 'bg-purple-600 text-white'
                  : 'border border-purple-100 bg-white text-slate-600 hover:border-purple-200 hover:bg-purple-50',
              )}
            >
              {t.label}
              {countLabel ? (
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                    active ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600',
                  )}
                >
                  {countLabel}
                </span>
              ) : null}
            </Button>
          );
        })}
      </div>

      {hubsQ.isLoading ? (
        <div className='py-20 text-center text-sm text-gray-400'>กำลังโหลด...</div>
      ) : null}

      {!hubsQ.isLoading && hubs.length === 0 ? (
        <div className='rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400'>
          ไม่พบ hub จากระบบ
        </div>
      ) : null}

      {tab === 'hub' && !hubsQ.isLoading && hubs.length > 0 ? (
        <div className='space-y-8'>
          {pdHubs.length > 0 ? (
            <section className='space-y-3'>
              <div className='flex items-center gap-2'>
                <span className='h-5 w-1 rounded-full bg-brand-purple/70' />
                <h3 className='text-[13px] font-bold text-gray-800'>{HUB_SCOPE_LABELS.PD}</h3>
                <span className='rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500'>
                  PD
                </span>
                <span className='text-[11px] text-gray-400'>
                  {pdHubs.filter((h) => resolveHubImg(h)).length}/{pdHubs.length} มีภาพ
                </span>
              </div>
              {renderHubGrid(pdHubs)}
            </section>
          ) : null}

          {mtHubs.length > 0 ? (
            <section className='space-y-3'>
              <div className='flex items-center gap-2'>
                <span className='h-5 w-1 rounded-full bg-emerald-500/70' />
                <h3 className='text-[13px] font-bold text-gray-800'>{HUB_SCOPE_LABELS.MT}</h3>
                <span className='rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500'>
                  MT
                </span>
                <span className='text-[11px] text-gray-400'>
                  {mtHubs.filter((h) => resolveHubImg(h)).length}/{mtHubs.length} มีภาพ
                </span>
              </div>
              {renderHubGrid(mtHubs)}
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === 'category' && !hubsQ.isLoading && hubs.length > 0 ? (
        <div className='space-y-8'>
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
                  <CategoryImageCard
                    key={cat.category_id}
                    cat={cat}
                    onPickFile={(c, f) => setEditTarget({ kind: 'category', category: c, file: f })}
                    onRecrop={handleRecropCategory}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      <ImageCropModal
        open={editTarget !== null && !saving}
        file={editTarget?.file ?? null}
        title={`ครอปภาพ: ${cropTitle}`}
        aspect={1}
        outputWidth={800}
        onCancel={() => setEditTarget(null)}
        onConfirm={handleConfirmCrop}
      />

      {saving || loadingRecropId !== null ? (
        <div className='fixed inset-0 z-[200] flex items-center justify-center bg-black/30'>
          <div className='rounded-xl bg-white px-6 py-4 text-sm font-medium text-gray-700 shadow-xl'>
            {saving ? 'กำลังอัปโหลด...' : 'กำลังโหลดภาพเดิม...'}
          </div>
        </div>
      ) : null}
    </div>
  );
}
