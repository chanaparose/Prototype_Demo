/**
 * API Services — Main export for all API modules
 * Import from here instead of individual modules for cleaner code
 *
 * Usage:
 *   import { authApi, ordersApi, rfqsApi } from '@/services/api';
 *   authApi.login({ email, password });
 *   ordersApi.list();
 */

export { httpClient } from '@/services/api/httpClient';
export { ApiHttpError } from '@/services/api/httpClient';
export { getToken, setToken, removeToken } from '@/services/api/tokenManager';

export {
  ApiError,
  extractErrorMessage,
  formatApiError,
  getApiErrorStatus,
} from '@/services/api/apiErrorHandler';

export { authApi } from '@/services/api/authApi';

export { rfqsApi, factoryRfqsApi, quotationsApi, quotationApi } from '@/services/api/rfqApi';

export { ordersApi, productionUpdatesApi, productionApi } from '@/services/api/ordersApi';

export { factoriesApi, showcasesApi, mediaApi } from '@/services/api/factoryApi';

export { frontendApi, promoSlidesApi } from '@/services/api/exploreApi';

export { conversationsApi, messagesApi, notificationsApi } from '@/services/api/chatApi';

export { categoriesApi, masterApi, addressesApi } from '@/services/api/masterApi';

export {
  profileApi,
  walletApi,
  favoritesApi,
  reviewsApi,
  certificatesApi,
  transactionsApi,
} from '@/services/api/userApi';

export {
  platformConfigApi,
  adminConfigApi,
  adminFactoryConfigApi,
  adminApi,
  adminCustomerApi,
  adminSettlementApi,
} from '@/services/api/adminApi';

export * from '@/services/api/types';

// Re-export common types that were previously in the main api.ts
export type { FrontendBootstrapResponse } from '@/services/api/exploreApi';
export type {
  PlatformConfig,
  AdminDashboardSummary,
  AdminFactoryRow,
  AdminRfqRow,
  AdminOrderRow,
} from '@/services/api/adminApi';
