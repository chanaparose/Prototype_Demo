import type { Category, Factory } from '@/stores/types';
import type { ExploreCategoryItem } from '@/utils/exploreCategoriesFromApi';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';

export function mapStoreCategoryToExploreCategory(category: Category): ExploreCategoryItem {
  return {
    id: category.id,
    name: category.name,
    parentId: null,
  };
}

export function mapStoreCategoriesToExplore(categories: Category[]): ExploreCategoryItem[] {
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
