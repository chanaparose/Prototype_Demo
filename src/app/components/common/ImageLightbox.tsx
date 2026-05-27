import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ZoomIn } from 'lucide-react';
import { useLightboxStore } from '@/stores/useLightboxStore';

export function ImageLightbox() {
  const { url, close } = useLightboxStore();

  // Close on Escape
  useEffect(() => {
    if (!url) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [url, close]);

  // Lock body scroll while open
  useEffect(() => {
    if (url) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [url]);

  if (!url) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center'
      onClick={close}
      role='dialog'
      aria-modal='true'
      aria-label='ดูรูปขนาดใหญ่'
    >
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/85 backdrop-blur-sm' />

      {/* Toolbar */}
      <div className='absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3'>
        <div />
        <div className='flex items-center gap-2'>
          {/* Download */}
          <a
            href={url}
            download
            onClick={(e) => e.stopPropagation()}
            className='flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25'
            aria-label='ดาวน์โหลด'
          >
            <Download size={17} />
          </a>
          {/* Open original */}
          <a
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            onClick={(e) => e.stopPropagation()}
            className='flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25'
            aria-label='เปิดต้นฉบับ'
          >
            <ZoomIn size={17} />
          </a>
          {/* Close */}
          <button
            type='button'
            onClick={(e) => { e.stopPropagation(); close(); }}
            className='flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25'
            aria-label='ปิด'
          >
            <X size={19} />
          </button>
        </div>
      </div>

      {/* Image */}
      <img
        src={url}
        alt=''
        onClick={(e) => e.stopPropagation()}
        className='relative z-10 max-h-[90dvh] max-w-[95vw] rounded-xl object-contain shadow-2xl'
        draggable={false}
      />
    </div>,
    document.body,
  );
}
