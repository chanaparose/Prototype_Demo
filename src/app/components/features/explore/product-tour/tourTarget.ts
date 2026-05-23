import type { TourStepDef } from '@/components/features/explore/product-tour/tourTypes';

function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 1 && r.height > 1;
}

export function findTarget(def: TourStepDef): Element | null {
  if (def.targetSelector) {
    const candidates = Array.from(document.querySelectorAll(def.targetSelector));
    const visible = candidates.find(isVisible);
    if (visible) return visible;
  }
  if (def.targetTexts) {
    const interactiveSel = 'button, a, [role="button"], [role="tab"], input';
    for (const text of def.targetTexts) {
      const matches = Array.from(document.querySelectorAll(interactiveSel));
      const found = matches.find((el) => {
        const card = el.closest('[style*="z-index: 9999"]');
        if (card) return false;
        if (!isVisible(el)) return false;
        const t = (el.textContent || '').trim();
        const ph = (el as HTMLInputElement).placeholder || '';
        return t.includes(text) || ph.includes(text);
      });
      if (found) return found;
    }
    for (const text of def.targetTexts) {
      const all = Array.from(document.querySelectorAll('h1, h2, h3, p, span, div'));
      const found = all.find((el) => {
        const card = el.closest('[style*="z-index: 9999"]');
        if (card) return false;
        if (!isVisible(el)) return false;
        const own = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent || '')
          .join('')
          .trim();
        return own.includes(text);
      });
      if (found) return found;
    }
  }
  return null;
}
