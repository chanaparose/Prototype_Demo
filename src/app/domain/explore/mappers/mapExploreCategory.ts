import type { Category, Factory } from '@/stores/types';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import type { IExploreCategory } from '@/domain/explore/types/explore.model';
import type { IExploreCategoryResponse } from '@/services/api/types/explore.types';
import { pickScalarString } from '@/utils/pickScalarString';

export function mapExploreCategoryFromApi(row: IExploreCategoryResponse): IExploreCategory | null {
  const source = row as Record<string, unknown>;
  const id = pickScalarString(
    source.id,
    source.category_id,
    source.categoryId,
    source.lbi_category_id,
    source.product_category_id,
    source.lbi_product_category_id,
  );
  const name = pickScalarString(
    source.name,
    source.name_th,
    source.name_en,
    source.category_name,
    source.title,
    source.label,
  );
  if (!id || !name) return null;
  const parentId = pickScalarString(source.parent_id, source.parentId);
  return {
    id,
    name,
    parentId: parentId || null,
  };
}

export function mapStoreCategoryToExploreCategory(category: Category): IExploreCategory {
  return {
    id: category.id,
    name: category.name,
    parentId: null,
  };
}

export function mapStoreCategoriesToExplore(categories: Category[]): IExploreCategory[] {
  return categories.map(mapStoreCategoryToExploreCategory);
}

export function mapStoreFactoryToExploreItem(factory: Factory): FactoryItem {
  return {
    id: factory.id,
    name: factory.name,
    image: factory.image,
    location: factory.location,
    rating: factory.rating,
    reviews: factory.reviews,
    minOrder: factory.minOrder,
    verified: factory.verified,
  };
}

export function mapStoreFactoriesToExplore(factories: Factory[]): FactoryItem[] {
  return factories.map(mapStoreFactoryToExploreItem);
}
