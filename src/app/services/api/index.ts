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
export { httpClient } from './httpClient';
export { ApiHttpError } from './httpClient';
export { getToken, setToken, removeToken } from './tokenManager';

// ─── Error Handling ────────────────────────────────────
export { ApiError, extractErrorMessage, formatApiError, getApiErrorStatus } from './apiErrorHandler';

// ─── Auth ──────────────────────────────────────────────
export { authApi } from './authApi';

// ─── RFQ ───────────────────────────────────────────────
export { rfqsApi, factoryRfqsApi, quotationsApi, quotationApi } from './rfqApi';

// ─── Orders ────────────────────────────────────────────
export { ordersApi, productionUpdatesApi, productionApi } from './ordersApi';

// ─── Factory ───────────────────────────────────────────
export { factoriesApi, showcasesApi, mediaApi } from './factoryApi';

// ─── Explore & Frontend ────────────────────────────────
export { frontendApi, promoSlidesApi } from './exploreApi';

// ─── Chat & Messaging ─────────────────────────────────
export { conversationsApi, messagesApi, notificationsApi } from './chatApi';

// ─── Master Data ───────────────────────────────────────
export { categoriesApi, masterApi, addressesApi } from './masterApi';

// ─── User (Profile, Wallet, Favorites, etc) ───────────
export {
  profileApi,
  walletApi,
  favoritesApi,
  reviewsApi,
  certificatesApi,
  transactionsApi,
} from './userApi';

// ─── Admin ─────────────────────────────────────────────
export {
  platformConfigApi,
  adminConfigApi,
  adminFactoryConfigApi,
  adminApi,
  adminCustomerApi,
  adminSettlementApi,
} from './adminApi';

// ─── Types ────────────────────────────────────────────
export * from './types';

// ─── Backward Compatibility ────────────────────────────
// Re-export common types that were previously in the main api.ts
export type { FrontendBootstrapResponse } from './exploreApi';
export type {
  PlatformConfig,
  AdminDashboardSummary,
  AdminFactoryRow,
  AdminRfqRow,
  AdminOrderRow,
} from './adminApi';
