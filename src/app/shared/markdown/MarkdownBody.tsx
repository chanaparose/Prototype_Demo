import React, { useMemo } from 'react';
import { renderMarkdown } from './safeMarkdown';

type Props = {
  source: string;
  className?: string;
};

/** XSS-safe markdown body (detail pages + editor preview parity). */
export function MarkdownBody({ source, className }: Props) {
  const html = useMemo(() => renderMarkdown(source), [source]);
  const markdownClassName = `max-w-none text-gray-800 text-sm md:text-base leading-relaxed
         [&_p]:my-2
         [&_h1]:text-xl [&_h1]:md:text-2xl [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2
         [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2
         [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
         [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
         [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
         [&_li]:my-1
         [&_a]:text-blue-600 [&_a]:no-underline hover:[&_a]:underline
         [&_img]:rounded-lg [&_img]:mx-auto [&_img]:max-w-full
         [&_table]:text-sm [&_th]:bg-gray-50 [&_th]:border [&_td]:border [&_th]:px-2 [&_td]:py-1
         [&_pre]:overflow-x-auto [&_pre]:bg-gray-50 [&_pre]:p-3 [&_pre]:rounded-lg
         [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:text-gray-600`;
  return (
    <div
      className={className ? `${markdownClassName} ${className}` : markdownClassName}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
