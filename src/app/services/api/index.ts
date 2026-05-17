/**
 * API Services — Main export for all API modules
 * Import from here instead of individual modules for cleaner code
 *
 * Usage:
 *   import { authApi, ordersApi, rfqsApi } from '@/services/api';
 *   authApi.login({ email, password });
 *   ordersApi.list();
 */

// ─── HTTP & Token Management ───────────────────────────
export { httpClient } from '@/services/api/httpClient';
export { ApiHttpError } from '@/services/api/httpClient';
export { getToken, setToken, removeToken } from '@/services/api/tokenManager';

// ─── Error Handling ────────────────────────────────────
export {
  ApiError,
  extractErrorMessage,
  formatApiError,
  getApiErrorStatus,
} from '@/services/api/apiErrorHandler';

// ─── Auth ──────────────────────────────────────────────
export { authApi } from '@/services/api/authApi';

// ─── RFQ ───────────────────────────────────────────────
export { rfqsApi, factoryRfqsApi, quotationsApi, quotationApi } from '@/services/api/rfqApi';

// ─── Orders ────────────────────────────────────────────
export { ordersApi, productionUpdatesApi, productionApi } from '@/services/api/ordersApi';

// ─── Factory ───────────────────────────────────────────
export { factoriesApi, showcasesApi, mediaApi } from '@/services/api/factoryApi';

// ─── Explore & Frontend ────────────────────────────────
export { frontendApi, promoSlidesApi } from '@/services/api/exploreApi';

// ─── Chat & Messaging ─────────────────────────────────
export { conversationsApi, messagesApi, notificationsApi } from '@/services/api/chatApi';

// ─── Master Data ───────────────────────────────────────
export { categoriesApi, masterApi, addressesApi } from '@/services/api/masterApi';

// ─── User (Profile, Wallet, Favorites, etc) ───────────
export {
  profileApi,
  walletApi,
  favoritesApi,
  reviewsApi,
  certificatesApi,
  transactionsApi,
} from '@/services/api/userApi';

// ─── Admin ─────────────────────────────────────────────
export {
  platformConfigApi,
  adminConfigApi,
  adminFactoryConfigApi,
  adminApi,
  adminCustomerApi,
  adminSettlementApi,
} from '@/services/api/adminApi';

// ─── Types ────────────────────────────────────────────
export * from '@/services/api/types';

// ─── Backward Compatibility ────────────────────────────
// Re-export common types that were previously in the main api.ts
export type { FrontendBootstrapResponse } from '@/services/api/exploreApi';
export type {
  PlatformConfig,
  AdminDashboardSummary,
  AdminFactoryRow,
  AdminRfqRow,
  AdminOrderRow,
} from '@/services/api/adminApi';
