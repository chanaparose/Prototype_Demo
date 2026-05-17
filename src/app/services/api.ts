/**
 * Legacy compatibility entry — prefer direct imports from `@/services/api/*` modules.
 */

export { httpClient, ApiHttpError } from '@/services/api/httpClient';
export { httpClient as api } from '@/services/api/httpClient';
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
export type { FrontendBootstrapResponse } from '@/services/api/exploreApi';
export type {
  PlatformConfig,
  AdminDashboardSummary,
  AdminFactoryRow,
  AdminRfqRow,
  AdminOrderRow,
} from '@/services/api/adminApi';
