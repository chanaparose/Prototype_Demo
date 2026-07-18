import type { HubScope } from '@/components/features/hub/hubRowShared';
import type { IHubResponse } from '@/services/api/types/master.types';

export type ExploreCategoryItem = {
  categoryId: number;
  name: string;
  img: string;
  description: string;
  hubId: number;
  hubName: string;
  scope: HubScope;
  factoryCount: number;
};

/** Solid chip colors — vivid pills like the explore mock. */
export const CATEGORY_CHIP_COLORS = [
  '#3B82F6', // blue
  '#14B8A6', // teal
  '#8B5CF6', // violet
  '#F472B6', // pink
  '#F97316', // orange
  '#EF4444', // red
  '#06B6D4', // cyan
  '#A855F7', // purple
  '#EC4899', // hot pink
  '#22C55E', // green
  '#EAB308', // yellow
  '#6366F1', // indigo
] as const;

export function getCategoryChipColor(categoryId: number): string {
  return CATEGORY_CHIP_COLORS[Math.abs(categoryId) % CATEGORY_CHIP_COLORS.length];
}

export function flattenHubCategories(
  hubs: IHubResponse[],
  scope: HubScope,
): ExploreCategoryItem[] {
  const seen = new Set<number>();
  const items: ExploreCategoryItem[] = [];

  for (const hub of hubs) {
    if (hub.scope !== scope) continue;
    for (const cat of hub.categories) {
      if (seen.has(cat.category_id)) continue;
      seen.add(cat.category_id);

      const img = String(cat.img || cat.image_url || cat.image || '').trim();
      const preview = (cat.sub_preview ?? []).filter(Boolean).slice(0, 3).join(' · ');
      const description =
        preview ||
        (cat.factory_count > 0
          ? `${cat.factory_count.toLocaleString('th-TH')} โรงงานในหมวดนี้`
          : `ในกลุ่ม ${hub.name}`);

      items.push({
        categoryId: cat.category_id,
        name: cat.name,
        img,
        description,
        hubId: hub.hub_id,
        hubName: hub.name,
        scope,
        factoryCount: cat.factory_count ?? 0,
      });
    }
  }

  return items.sort((a, b) => a.name.localeCompare(b.name, 'th'));
}

export function buildExploreCategoriesAllUrl(scope: HubScope): string {
  return `/explore/categories?scope=${scope}`;
}

export function buildFactoryIdeasCategoryUrl(item: ExploreCategoryItem): string {
  const params = new URLSearchParams({
    category_id: String(item.categoryId),
    hub_id: String(item.hubId),
    hub_scope: item.scope,
    type: item.scope === 'MT' ? 'material' : 'product',
  });
  return `/factory-ideas?${params.toString()}`;
}

/** Navigate to factory-ideas filtered by category + sub-category. */
export function buildFactoryIdeasSubCategoryUrl(opts: {
  categoryId: number;
  subCategoryId: number;
  scope: HubScope;
  hubId?: number | null;
}): string {
  const params = new URLSearchParams({
    category_id: String(opts.categoryId),
    sub_category_id: String(opts.subCategoryId),
    hub_scope: opts.scope,
    type: opts.scope === 'MT' ? 'material' : 'product',
  });
  if (opts.hubId != null && Number.isFinite(opts.hubId) && opts.hubId > 0) {
    params.set('hub_id', String(opts.hubId));
  }
  return `/factory-ideas?${params.toString()}`;
}
