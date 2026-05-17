import * as React from 'react';

import { Image } from '@/components/ui/image';
import { cn } from '@lib/utils';

type AvatarProps = React.ComponentProps<'div'> & {
  src?: string;
  alt?: string;
  fallbackSrc?: string;
  fallback?: React.ReactNode;
  imageClassName?: string;
};

function Avatar({
  className,
  src,
  alt = '',
  fallbackSrc,
  fallback,
  imageClassName,
  ...props
}: AvatarProps) {
  return (
    <div
      data-slot='avatar'
      className={cn(
        'relative flex size-10 shrink-0 overflow-hidden rounded-full bg-gray-100',
        className,
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          fallbackSrc={fallbackSrc}
          alt={alt}
          className={cn('h-full w-full', imageClassName)}
        />
      ) : (
        <div className='flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500'>
          {fallback}
        </div>
      )}
    </div>
  );
}

export { Avatar };
