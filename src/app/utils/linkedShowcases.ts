export type LinkedShowcaseEntry = string | number;

function normalizeArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s || (!s.startsWith('[') && !s.startsWith('{'))) return [];
    try {
      const parsed = JSON.parse(s) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function partitionLinkedShowcases(arr: unknown): {
  imageUrls: string[];
  showcaseIds: number[];
} {
  const list = normalizeArray(arr);
  const imageUrls: string[] = [];
  const showcaseIds: number[] = [];
  for (const item of list) {
    if (typeof item === 'string' && /^https?:\/\//i.test(item.trim())) {
      imageUrls.push(item.trim());
      continue;
    }
    const n = Number(item);
    if (Number.isFinite(n) && n > 0) {
      showcaseIds.push(n);
    }
  }
  return { imageUrls, showcaseIds };
}

export function mapLinkedShowcasesErrorToThai(message: string): string {
  const m = String(message ?? '');
  if (m.includes('linked_showcases: maximum 5 linked showcases allowed')) {
    return 'เลือกได้สูงสุด 5 รายการ';
  }
  if (m.includes('linked_showcases: all entries must be HTTPS URLs or numeric showcase IDs')) {
    return 'รายการอ้างอิงไม่ถูกต้อง';
  }
  if (m.includes('linked_showcases: all linked showcases must exist')) {
    return 'พบรายการอ้างอิงที่ไม่มีอยู่ในระบบ';
  }
  if (m.includes('linked_showcases: all linked showcases must belong to the same factory')) {
    return 'อ้างอิงได้เฉพาะสินค้า/โปรโมชันของโรงงานคุณ';
  }
  if (m.includes('linked_showcases: all linked showcases must be active')) {
    return 'อ้างอิงได้เฉพาะรายการที่เผยแพร่อยู่';
  }
  return '';
}
