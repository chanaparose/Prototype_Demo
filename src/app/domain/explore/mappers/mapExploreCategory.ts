import type { BootstrapCategoryModel, Factory } from '@/stores/types';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';
import type { IExploreCategory } from '@/domain/explore/types/explore.model';
import type { IExploreCategoryResponse } from '@/services/api/types/explore.types';
import { pickScalarString } from '@/utils/pickScalarString';

export function mapExploreCategoryFromApi(row: IExploreCategoryResponse): IExploreCategory | null {
  const id = pickScalarString(
    row.id,
    row.category_id,
    row.categoryId,
    row.lbi_category_id,
    row.product_category_id,
    row.lbi_product_category_id,
  );
  const name = pickScalarString(
    row.name,
    row.name_th,
    row.name_en,
    row.category_name,
    row.title,
    row.label,
  );
  if (!id || !name) return null;
  const parentId = pickScalarString(row.parent_id, row.parentId);
  return {
    id,
    name,
    parentId: parentId || null,
  };
}

export function mapStoreCategoryToExploreCategory(
  category: BootstrapCategoryModel,
): IExploreCategory {
  return {
    id: category.id,
    name: category.name,
    parentId: null,
  };
}

export function mapStoreCategoriesToExplore(
  categories: BootstrapCategoryModel[],
): IExploreCategory[] {
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
