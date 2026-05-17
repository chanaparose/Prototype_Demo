/**
 * @deprecated Use the new modular API structure instead
 *
 * MIGRATION GUIDE:
 * Old:  import { authApi, ordersApi } from '@/services/api';
 * New:  import { authApi, ordersApi } from '@/services/api';
 *
 * The old api.ts has been refactored into separate modules:
 * - api/authApi.ts          (authentication)
 * - api/rfqApi.ts           (RFQ management)
 * - api/ordersApi.ts        (Orders)
 * - api/factoryApi.ts       (Factory & Showcases)
 * - api/exploreApi.ts       (Explore & Frontend)
 * - api/chatApi.ts          (Chat & Messaging)
 * - api/masterApi.ts        (Master data)
 * - api/userApi.ts          (User profile, wallet, etc)
 * - api/httpClient.ts       (HTTP client)
 * - api/tokenManager.ts     (Token management)
 * - api/apiErrorHandler.ts  (Error handling)
 * - api/types/              (Type definitions)
 *
 * All exports are re-exported from api/index.ts for backward compatibility.
 * You can import from either location, but please use the new modular imports.
 */

// Re-export everything from the new api modules
export * from '@/services/api/index';

// Backward compatibility: also export as `api` object
export { httpClient as api } from '@/services/api/httpClient';
