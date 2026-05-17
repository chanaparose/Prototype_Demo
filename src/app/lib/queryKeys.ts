export const masterKeys = {
  all: ['master'] as const,
  units: () => [...masterKeys.all, 'units'] as const,
  shippingMethods: () => [...masterKeys.all, 'shipping-methods'] as const,
  provinces: () => [...masterKeys.all, 'provinces'] as const,
  districts: (provinceId: string | number) =>
    [...masterKeys.all, 'districts', String(provinceId)] as const,
  subDistricts: (districtId: string | number) =>
    [...masterKeys.all, 'sub-districts', String(districtId)] as const,
  subCategories: (categoryId: string | number) =>
    [...masterKeys.all, 'sub-categories', String(categoryId)] as const,
  productCategories: () => [...masterKeys.all, 'product-categories'] as const,
  certificates: () => [...masterKeys.all, 'certificates'] as const,
  factoryTypes: () => [...masterKeys.all, 'factory-types'] as const,
  lbiCategories: (scope: string) => [...masterKeys.all, 'lbi-categories', scope] as const,
};

export const rfqKeys = {
  all: ['rfq'] as const,
  lists: () => [...rfqKeys.all, 'list'] as const,
  list: () => [...rfqKeys.lists()] as const,
  details: () => [...rfqKeys.all, 'detail'] as const,
  detail: (id: string) => [...rfqKeys.details(), id] as const,
  quotations: (id: string) => [...rfqKeys.detail(id), 'quotations'] as const,
};

export const orderKeys = {
  all: ['order'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: () => [...orderKeys.lists()] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};
