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
  productionUpdates: (id: string | number | undefined) =>
    [...orderKeys.detail(String(id ?? '')), 'production-updates'] as const,
};

export const factoryKeys = {
  all: ['factory'] as const,
  me: () => [...factoryKeys.all, 'me'] as const,
  profileInit: () => [...factoryKeys.me(), 'profile-init'] as const,
  details: () => [...factoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...factoryKeys.details(), id] as const,
  categories: (id: string | number | null | undefined) =>
    [...factoryKeys.all, String(id ?? ''), 'categories'] as const,
  subCategories: (id: string | number | null | undefined) =>
    [...factoryKeys.all, String(id ?? ''), 'sub-categories'] as const,
  certificates: (id: string | number | null | undefined) =>
    [...factoryKeys.all, String(id ?? ''), 'certs'] as const,
  reviewsSummary: (id: string | number) => [...factoryKeys.all, String(id), 'reviews-summary'] as const,
  reviewsList: (id: string | number) => [...factoryKeys.all, String(id), 'reviews-list'] as const,
  orders: (id: string | number | null | undefined) => [...factoryKeys.all, 'orders', id] as const,
  dashboard: () => [...factoryKeys.all, 'dashboard'] as const,
  rfqDetail: (id: string) => [...factoryKeys.all, 'rfq-detail', id] as const,
};

export const quotationKeys = {
  all: ['quotation'] as const,
  lists: () => [...quotationKeys.all, 'list'] as const,
  listMine: () => [...quotationKeys.lists(), 'mine'] as const,
  detail: (id: string) => [...quotationKeys.all, id] as const,
  history: (id: string) => [...quotationKeys.all, id, 'history'] as const,
};

export const exploreKeys = {
  all: ['explore'] as const,
  pageData: () => [...exploreKeys.all, 'page-data'] as const,
};

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  rfqPicker: () => [...chatKeys.all, 'rfqs', 'open', 'picker'] as const,
};

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (page: number, limit: number, unread: boolean) =>
    [...notificationKeys.lists(), page, limit, unread] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  topCustomers: (limit: number) => [...adminKeys.all, 'top-customers', limit] as const,
  rfqList: (status: string, search: string) =>
    [...adminKeys.all, 'rfqs', status, search] as const,
  rfqDetail: (id: string) => [...adminKeys.all, 'rfq', id] as const,
  factoriesList: (statusTab: string, search: string) =>
    [...adminKeys.all, 'factories', statusTab, search] as const,
  factoryDetail: (id: string) => [...adminKeys.all, 'factory', id] as const,
  factoryConfig: (factoryId: number) => [...adminKeys.all, 'factory-config', factoryId] as const,
  configList: () => [...adminKeys.all, 'config-list'] as const,
  ordersList: (filters: {
    statusTab: string;
    search: string;
    dateFrom: string;
    dateTo: string;
  }) => [...adminKeys.all, 'orders', filters] as const,
  platformCommission: () => [...adminKeys.all, 'platform-commission'] as const,
  factorySettlements: (factoryId: number, page: number) =>
    [...adminKeys.all, 'factory-settlements', factoryId, page] as const,
};

export const factoryIdeasKeys = {
  all: ['factory-ideas'] as const,
  categories: (materialTab: boolean) =>
    [...factoryIdeasKeys.all, 'categories', materialTab ? 'MT' : 'PD'] as const,
  factoryList: () => [...factoryIdeasKeys.all, 'factories'] as const,
  showcasesPaginated: (params: Record<string, unknown>) =>
    [...factoryIdeasKeys.all, 'showcases-paginated', params] as const,
};

export const sessionKeys = {
  all: ['session'] as const,
  data: () => [...sessionKeys.all, 'data'] as const,
};

export const showcaseKeys = {
  all: ['showcase'] as const,
  lists: () => [...showcaseKeys.all, 'list'] as const,
  list: (type?: string) => [...showcaseKeys.lists(), type ?? 'ALL'] as const,
  detail: (id: string | number) => [...showcaseKeys.all, 'detail', String(id)] as const,
  related: (idsKey: string) => [...showcaseKeys.all, 'related', idsKey] as const,
  relatedForDetail: (id: string | number, kind: string) =>
    [...showcaseKeys.detail(id), 'related', kind] as const,
  factoryList: (factoryId: string | number) =>
    [...showcaseKeys.all, 'factory', String(factoryId)] as const,
};

export const addressKeys = {
  all: ['addresses'] as const,
  me: () => [...addressKeys.all, 'me'] as const,
};

export const walletKeys = {
  all: ['wallet'] as const,
  me: () => [...walletKeys.all, 'me'] as const,
  factoryPage: () => [...walletKeys.all, 'factory-page'] as const,
};

export const productionKeys = {
  all: ['production'] as const,
  template: (factoryTypeId?: string | number) =>
    [...productionKeys.all, 'template', factoryTypeId ?? 'all'] as const,
};
