export function formatThaiDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function groupFactoryCategorySubs(
  factorySubCategoryPairs: { categoryLabel: string; subLabel: string }[],
  factoryCategoryNames: string[] = [],
  factorySubCategoryNames: string[] = [],
): [string, string[]][] {
  const map = new Map<string, string[]>();
  for (const p of factorySubCategoryPairs) {
    const cat = String(p.categoryLabel ?? '').trim();
    const sub = String(p.subLabel ?? '').trim();
    if (!cat || !sub) continue;
    const prev = map.get(cat) ?? [];
    if (!prev.includes(sub)) prev.push(sub);
    map.set(cat, prev);
  }
  if (map.size === 0 && factoryCategoryNames.length > 0) {
    for (const c of factoryCategoryNames) map.set(c, []);
  }
  if (map.size === 0 && factorySubCategoryNames.length > 0) {
    map.set('หมวดย่อย', [...factorySubCategoryNames]);
  }
  return Array.from(map.entries());
}
