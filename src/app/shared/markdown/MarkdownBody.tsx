import React, { useMemo } from 'react';

import { SHOWCASE_DETAIL_MARKDOWN_CLASS } from '@/components/features/showcase-detail/showcaseDetailShared';
import { renderMarkdown } from '@/shared/markdown/safeMarkdown';
import { cn } from '@lib/utils';

type MarkdownTypography = 'default' | 'showcase-detail';

type Props = {
  source: string;
  className?: string;
  /** `showcase-detail` — flat 14px to match spec tables on product detail */
  typography?: MarkdownTypography;
};

const defaultMarkdownClassName = `max-w-none text-gray-800 text-sm md:text-base leading-relaxed
         [&_p]:my-2
         [&_h1]:text-2xl [&_h1]:md:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:mt-6 [&_h1]:mb-3
         [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:mt-5 [&_h2]:mb-3
         [&_h3]:text-lg [&_h3]:md:text-xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:mt-4 [&_h3]:mb-2
         [&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2
         [&_h5]:text-sm [&_h5]:font-semibold [&_h5]:mt-3 [&_h5]:mb-2
         [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:text-gray-500 [&_h6]:mt-3 [&_h6]:mb-2
         [&_strong]:font-semibold
         [&_em]:italic
         [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
         [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
         [&_li]:my-1
         [&_li>ul]:my-1 [&_li>ol]:my-1
         [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-700
         [&_img]:rounded-lg [&_img]:mx-auto [&_img]:max-w-full [&_img]:my-3
         [&_hr]:my-5 [&_hr]:border-gray-200
         [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_table]:my-3 [&_table]:overflow-x-auto [&_th]:bg-gray-50 [&_th]:border [&_td]:border [&_th]:px-3 [&_td]:px-3 [&_th]:py-2 [&_td]:py-2
         [&_pre]:overflow-x-auto [&_pre]:bg-gray-50 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-3
         [&_code]:font-mono [&_code]:text-[0.92em]
         [&_p_code]:bg-gray-100 [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:rounded
         [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:text-gray-600 [&_blockquote]:my-3`;

/** XSS-safe markdown body (detail pages + editor preview parity). */
export function MarkdownBody({ source, className, typography = 'default' }: Props) {
  const html = useMemo(() => renderMarkdown(source), [source]);
  const baseClassName =
    typography === 'showcase-detail' ? SHOWCASE_DETAIL_MARKDOWN_CLASS : defaultMarkdownClassName;

  return (
    <div
      className={cn(baseClassName, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
