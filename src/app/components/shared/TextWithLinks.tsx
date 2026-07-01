import type { ReactNode } from 'react';

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<]+/gi;

function normalizeHref(raw: string): string {
  let href = raw;
  while (/[.,;:!?)\]}>"']$/.test(href)) {
    href = href.slice(0, -1);
  }
  return /^www\./i.test(href) ? `https://${href}` : href;
}

function splitTextWithLinks(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  const re = new RegExp(URL_PATTERN.source, 'gi');
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const raw = match[0];
    nodes.push(
      <a
        key={`${match.index}-${raw}`}
        href={normalizeHref(raw)}
        target='_blank'
        rel='noopener noreferrer'
        className='font-medium underline decoration-current/40 underline-offset-2 hover:decoration-current break-all'
        onClick={(e) => e.stopPropagation()}
      >
        {raw}
      </a>,
    );
    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

type TextWithLinksProps = {
  text: string;
  className?: string;
};

export function TextWithLinks({ text, className }: TextWithLinksProps) {
  if (!text) return null;
  return <span className={className}>{splitTextWithLinks(text)}</span>;
}
