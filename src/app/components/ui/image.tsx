import * as React from 'react';

import {
  ImageWithFallback,
  type ImageWithFallbackProps,
} from '@/components/shared/ImageWithFallback';
import { cn } from '@lib/utils';

function Image({ className, loading = 'lazy', ...props }: ImageWithFallbackProps) {
  return (
    <ImageWithFallback
      data-slot='image'
      loading={loading}
      className={cn('object-cover', className)}
      {...props}
    />
  );
}

export { Image };
