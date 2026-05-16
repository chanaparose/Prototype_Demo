/**
 * Master Data API — Categories, units, certifications, etc
 */

import { httpClient } from './httpClient';
import type {
  CategoryDTO,
  SubCategoryDTO,
  UnitDTO,
  CertificationDTO,
  ShippingMethodDTO,
  FactoryTypeDTO,
  MaterialDTO,
} from './types';

export const categoriesApi = {
  list: () => httpClient.get<CategoryDTO[]>('/categories'),

  get: (id: string | number) => httpClient.get<CategoryDTO>(`/categories/${id}`),

  /** GET /categories/:id/sub-categories */
  subCategories: (categoryId: string | number) =>
    httpClient.get<SubCategoryDTO[]>(`/categories/${categoryId}/sub-categories`),
};

export const masterApi = {
  /** Aggregated master data endpoint */
  getAll: () =>
    httpClient.get<{
      categories?: CategoryDTO[];
      units?: UnitDTO[];
      certifications?: CertificationDTO[];
      shipping_methods?: ShippingMethodDTO[];
      factory_types?: FactoryTypeDTO[];
    }>('/master'),

  /** GET /master/categories */
  getCategories: () => httpClient.get<CategoryDTO[]>('/master/categories'),

  /** GET /master/units */
  getUnits: () => httpClient.get<UnitDTO[]>('/master/units'),

  /** GET /master/certifications */
  getCertifications: () => httpClient.get<CertificationDTO[]>('/master/certifications'),

  /** GET /master/shipping-methods */
  getShippingMethods: () =>
    httpClient.get<ShippingMethodDTO[]>('/master/shipping-methods'),

  /** GET /master/factory-types */
  getFactoryTypes: () => httpClient.get<FactoryTypeDTO[]>('/master/factory-types'),

  /** GET /master/materials */
  getMaterials: (categoryId?: string | number) => {
    const endpoint = categoryId
      ? `/master/materials?category_id=${categoryId}`
      : '/master/materials';
    return httpClient.get<MaterialDTO[]>(endpoint);
  },
};

export const addressesApi = {
  list: () => httpClient.get<unknown[]>('/addresses'),

  get: (id: string | number) => httpClient.get<unknown>(`/addresses/${id}`),

  create: (data: Record<string, unknown>) =>
    httpClient.post<unknown>('/addresses', data),

  update: (id: string | number, data: Record<string, unknown>) =>
    httpClient.put<unknown>(`/addresses/${id}`, data),

  patch: (id: string | number, data: Partial<Record<string, unknown>>) =>
    httpClient.patch<unknown>(`/addresses/${id}`, data),

  delete: (id: string | number) => httpClient.delete<void>(`/addresses/${id}`),

  /** Get user's default address */
  getDefault: () => httpClient.get<unknown>('/addresses/default'),

  /** Set default address */
  setDefault: (id: string | number) =>
    httpClient.post<void>(`/addresses/${id}/set-default`, {}),
};
