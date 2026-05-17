import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';

type CropPoint = { x: number; y: number };
type Size = { width: number; height: number };

type Props = {
  open: boolean;
  file: File | null;
  title?: string;
  aspect?: number;
  outputWidth?: number;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function fileExtFromType(type: string): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('โหลดรูปไม่สำเร็จ'));
    img.src = url;
  });
}

async function renderCroppedFile(args: {
  sourceFile: File;
  sourceUrl: string;
  natural: Size;
  viewport: Size;
  baseScale: number;
  zoom: number;
  offset: CropPoint;
  outputWidth: number;
}): Promise<File> {
  const { sourceFile, sourceUrl, natural, viewport, baseScale, zoom, offset, outputWidth } = args;

  const img = await loadImageFromUrl(sourceUrl);
  const k = baseScale * zoom;
  const displayW = natural.width * k;
  const displayH = natural.height * k;
  const left = viewport.width / 2 + offset.x - displayW / 2;
  const top = viewport.height / 2 + offset.y - displayH / 2;

  const sx = clamp((0 - left) / k, 0, natural.width);
  const sy = clamp((0 - top) / k, 0, natural.height);
  const sw = clamp(viewport.width / k, 1, natural.width - sx);
  const sh = clamp(viewport.height / k, 1, natural.height - sy);

  const outW = Math.max(200, Math.round(outputWidth));
  const outH = Math.max(200, Math.round(outW * (viewport.height / viewport.width)));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('ไม่สามารถเตรียมพื้นที่ครอปรูปได้');
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

  const mime =
    sourceFile.type === 'image/png' || sourceFile.type === 'image/webp'
      ? sourceFile.type
      : 'image/jpeg';

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mime, 0.92);
  });
  if (!blob) throw new Error('ไม่สามารถสร้างไฟล์รูปหลังครอปได้');

  const ext = fileExtFromType(blob.type);
  const fileNameBase = sourceFile.name.replace(/\.[^/.]+$/, '') || 'cropped';
  return new File([blob], `${fileNameBase}-crop.${ext}`, {
    type: blob.type,
    lastModified: Date.now(),
  });
}

export function ImageCropModal({
  open,
  file,
  title = 'จัดตำแหน่งภาพ',
  aspect = 16 / 9,
  outputWidth = 1600,
  onCancel,
  onConfirm,
}: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [natural, setNatural] = useState<Size>({ width: 0, height: 0 });
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<CropPoint>({ x: 0, y: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ p: CropPoint; o: CropPoint } | null>(null);
  const didInitForSourceRef = useRef(false);

  useEffect(() => {
    if (!open || !file) {
      setSourceUrl('');
      setNatural({ width: 0, height: 0 });
      setViewport({ width: 0, height: 0 });
      setBaseScale(1);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setSubmitting(false);
      return;
    }
    const url = URL.createObjectURL(file);
    didInitForSourceRef.current = false;
    setSourceUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, file]);

  useEffect(() => {
    if (!sourceUrl) return;
    let cancelled = false;
    loadImageFromUrl(sourceUrl)
      .then((img) => {
        if (cancelled) return;
        setNatural({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });
      })
      .catch(() => {
        if (!cancelled) setNatural({ width: 0, height: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

  useEffect(() => {
    if (!open || !stageRef.current) return;
    const el = stageRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const nextW = Math.max(1, Math.round(rect.width));
      const nextH = Math.max(1, Math.round(rect.height));
      setViewport((prev) => {
        if (prev.width === nextW && prev.height === nextH) return prev;
        return { width: nextW, height: nextH };
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [open, aspect]);

  useEffect(() => {
    if (!natural.width || !natural.height || !viewport.width || !viewport.height) return;
    if (didInitForSourceRef.current) return;

    // at its original size and let white padding fill the rest.
    // The user can then zoom in freely to fill the frame as desired.
    const scaleToFit = Math.min(viewport.width / natural.width, viewport.height / natural.height);
    const scaleToFill = Math.min(1, scaleToFit);
    setBaseScale(scaleToFill);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    didInitForSourceRef.current = true;
  }, [natural.width, natural.height, viewport.width, viewport.height]);

  const baseDisplayed = useMemo(() => {
    const w = natural.width * baseScale;
    const h = natural.height * baseScale;
    return { width: w, height: h };
  }, [natural.width, natural.height, baseScale]);

  const displayed = useMemo(() => {
    const w = baseDisplayed.width * zoom;
    const h = baseDisplayed.height * zoom;
    return { width: w, height: h };
  }, [baseDisplayed.width, baseDisplayed.height, zoom]);

  const clampOffset = (p: CropPoint): CropPoint => {
    const maxX = Math.max(0, (displayed.width - viewport.width) / 2);
    const maxY = Math.max(0, (displayed.height - viewport.height) / 2);
    return {
      x: clamp(p.x, -maxX, maxX),
      y: clamp(p.y, -maxY, maxY),
    };
  };

  useEffect(() => {
    setOffset((prev) => clampOffset(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, displayed.width, displayed.height, viewport.width, viewport.height]);

  if (!open || !file) return null;

  const canRender =
    sourceUrl &&
    natural.width > 0 &&
    natural.height > 0 &&
    viewport.width > 0 &&
    viewport.height > 0;
  const isFourByThree = Math.abs(aspect - 4 / 3) < 0.001;

  return (
    <div className='fixed inset-0 z-[120] bg-black/55 backdrop-blur-[1px] p-4 flex items-center justify-center'>
      <div className='w-full max-w-3xl max-h-[92vh] rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col'>
        <div className='px-4 py-3 border-b border-slate-100 flex items-center justify-between'>
          <p className='text-sm font-semibold text-slate-900'>{title}</p>
          <Button
            onClick={onCancel}
            disabled={submitting}
            variant='outline'
            size='icon-sm'
            className='w-8 h-8 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center disabled:opacity-50'
            aria-label='ปิด'
          >
            <X size={15} />
          </Button>
        </div>

        <div className='p-4 space-y-3 overflow-y-auto'>
          <div
            ref={stageRef}
            className={`relative mx-auto block max-w-full overflow-hidden select-none touch-none ${
              isFourByThree
                ? 'rounded-2xl border-2 border-dashed border-gray-200 bg-white'
                : 'rounded-xl border border-slate-200 bg-white'
            }`}
            style={{
              aspectRatio: `${aspect}`,
              width: 'min(100%, calc((92vh - 220px) * var(--crop-aspect)))',
              maxWidth: '100%',
              maxHeight: 'calc(92vh - 220px)',
              height: 'auto',
              ['--crop-aspect' as string]: String(aspect),
            }}
            onPointerDown={(e) => {
              if (!canRender || submitting) return;
              setDragging(true);
              dragStartRef.current = {
                p: { x: e.clientX, y: e.clientY },
                o: offset,
              };
              (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!dragging || !dragStartRef.current) return;
              const dx = e.clientX - dragStartRef.current.p.x;
              const dy = e.clientY - dragStartRef.current.p.y;
              setOffset(
                clampOffset({ x: dragStartRef.current.o.x + dx, y: dragStartRef.current.o.y + dy }),
              );
            }}
            onPointerUp={(e) => {
              setDragging(false);
              dragStartRef.current = null;
              (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={(e) => {
              setDragging(false);
              dragStartRef.current = null;
              (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
            }}
          >
            {sourceUrl ? (
              <Image
                src={sourceUrl}
                alt=''
                draggable={false}
                className='absolute top-1/2 left-1/2 pointer-events-none'
                style={{
                  width: `${baseDisplayed.width}px`,
                  height: `${baseDisplayed.height}px`,
                  transformOrigin: 'center center',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                }}
              />
            ) : null}
          </div>

          <div className='flex items-center gap-3'>
            <span className='text-xs text-slate-500 shrink-0'>ซูม</span>
            <input
              type='range'
              min={0.2}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className='w-full'
              disabled={submitting}
            />
            <Button
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              disabled={submitting}
              variant='outline'
              size='xs'
              className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 disabled:opacity-50'
            >
              <RotateCcw size={12} />
              รีเซ็ต
            </Button>
          </div>
        </div>

        <div className='px-4 py-3 border-t border-slate-100 flex items-center justify-end gap-2'>
          <Button
            onClick={onCancel}
            disabled={submitting}
            variant='outline'
            size='sm'
            className='px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 disabled:opacity-50'
          >
            ยกเลิก
          </Button>
          <Button
            disabled={!canRender || submitting}
            onClick={async () => {
              if (!canRender || !sourceUrl) return;
              setSubmitting(true);
              try {
                const cropped = await renderCroppedFile({
                  sourceFile: file,
                  sourceUrl,
                  natural,
                  viewport,
                  baseScale,
                  zoom,
                  offset,
                  outputWidth,
                });
                await onConfirm(cropped);
              } finally {
                setSubmitting(false);
              }
            }}
            className='px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50'
            style={{ background: 'var(--brand-indigo)' }}
          >
            {submitting ? (
              <span className='inline-flex items-center gap-1.5'>
                <Loader2 size={14} className='animate-spin' />
                กำลังบันทึก...
              </span>
            ) : (
              'ใช้รูปนี้'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
