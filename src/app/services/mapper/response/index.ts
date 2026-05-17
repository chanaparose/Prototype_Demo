/**
 * Mapper Functions — Transform API responses to model types
 * Centralize data transformation logic in one place
 */

/**
 * Mapper type — function that transforms raw API data to model
 */
export type Mapper<TResponse, TModel> = (data: TResponse) => TModel;

/**
 * Mapper with validation — checks if data exists before mapping
 */
export function createMapper<TResponse, TModel>(
  transform: (data: TResponse) => TModel,
): Mapper<TResponse, TModel> {
  return (data: TResponse): TModel => {
    if (!data) {
      throw new Error('No data to map');
    }
    return transform(data);
  };
}

export function createListMapper<TResponse, TModel>(
  itemMapper: Mapper<TResponse, TModel>,
): Mapper<TResponse[], TModel[]> {
  return (items: TResponse[]): TModel[] => {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.map(itemMapper);
  };
}

/**
 * Nullable mapper — maps optional data
 */
export function createNullableMapper<TResponse, TModel>(
  mapper: Mapper<TResponse, TModel>,
): Mapper<TResponse | null | undefined, TModel | null> {
  return (data: TResponse | null | undefined): TModel | null => {
    if (!data) {
      return null;
    }
    return mapper(data);
  };
}
