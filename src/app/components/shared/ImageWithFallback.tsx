import React, { useEffect, useState } from 'react';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

export type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** รูปสำรอง (เช่น factory_image_url จาก GET /showcases/:id) เมื่อ src หลักว่างหรือโหลดไม่สำเร็จ */
  fallbackSrc?: string;
};

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const { src, fallbackSrc, alt, style, className, onError, ...rest } = props;

  const primary = src != null && String(src).trim() !== '' ? String(src).trim() : '';
  const fallback = fallbackSrc != null && String(fallbackSrc).trim() !== '' ? String(fallbackSrc).trim() : '';

  const [mode, setMode] = useState<'primary' | 'fallback' | 'broken'>(() => {
    if (primary) return 'primary';
    if (fallback) return 'fallback';
    return 'broken';
  });

  useEffect(() => {
    if (primary) setMode('primary');
    else if (fallback) setMode('fallback');
    else setMode('broken');
  }, [primary, fallback]);

  const currentUrl = mode === 'primary' ? primary : mode === 'fallback' ? fallback : '';

  const handleError = () => {
    if (mode === 'primary' && fallback) setMode('fallback');
    else setMode('broken');
  };

  if (mode === 'broken' || !currentUrl) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex h-full w-full items-center justify-center">
          <img
            src={ERROR_IMG_SRC}
            alt="Error loading image"
            {...rest}
            data-original-url={primary || undefined}
            data-fallback-url={fallback || undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <img
      src={currentUrl}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={(e) => {
        handleError();
        onError?.(e);
      }}
      data-fallback-tried={mode === 'fallback' ? 'true' : undefined}
    />
  );
}
