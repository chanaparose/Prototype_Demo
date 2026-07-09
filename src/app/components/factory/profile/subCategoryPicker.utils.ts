export interface SubCategoryOption {
  id: number;
  name: string;
  categoryId: number;
  sortOrder?: number;
}

export function sortSubCategories(a: SubCategoryOption, b: SubCategoryOption) {
  const sortA = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 0;
  const sortB = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0;
  if (sortA !== sortB) return sortA - sortB;
  return a.name.localeCompare(b.name, 'th');
}

export function getAllSubItem(subs: SubCategoryOption[]) {
  return subs.find((s) => Number(s.sortOrder ?? 0) === 99);
}

export function subsForDisplay(working: number[], subs: SubCategoryOption[]): number[] {
  const allItem = getAllSubItem(subs);
  const catSubIds = subs.map((s) => s.id);
  if (allItem && working.includes(allItem.id)) {
    return working.filter((x) => !catSubIds.includes(x) || x === allItem.id);
  }
  return working;
}

export function toggleSubCategory(
  working: number[],
  subs: SubCategoryOption[],
  id: number,
): number[] {
  const allItem = getAllSubItem(subs);
  const catSubIds = subs.map((s) => s.id);
  const sub = subs.find((s) => s.id === id);
  const isAll = Number(sub?.sortOrder ?? 0) === 99;
  const allSelected = allItem ? working.includes(allItem.id) : false;

  if (working.includes(id)) {
    return working.filter((x) => x !== id);
  }

  // เลือก "ทั้งหมด" แล้ว — ห้ามเลือกหมวดย่อยอื่นเพิ่ม
  if (!isAll && allSelected) {
    return working;
  }

  if (isAll) {
    return [...working.filter((x) => !catSubIds.includes(x)), id].sort((a, b) => a - b);
  }

  return [...working, id].sort((a, b) => a - b);
}

export function partitionSubs(subs: SubCategoryOption[]) {
  const sorted = [...subs].sort(sortSubCategories);
  const allItem = getAllSubItem(sorted);
  const regular = sorted.filter((s) => Number(s.sortOrder ?? 0) !== 99);
  return { allItem, regular, sorted };
}

export function selectedSubNames(working: number[], subs: SubCategoryOption[]): string[] {
  const displayIds = subsForDisplay(working, subs);
  return [...subs]
    .sort(sortSubCategories)
    .filter((s) => displayIds.includes(s.id))
    .map((s) => s.name);
}
