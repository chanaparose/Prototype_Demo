/**
 * API Response Types — Raw data returned from API endpoints
 * These are separate from Model types which are used in the application
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<TData> {
  success: boolean;
  code?: string | number;
  message?: string;
  data?: TData;
  errors?: Record<string, unknown> | string[];
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<TItem> {
  success: boolean;
  data?: {
    items: TItem[];
    total: number;
    page?: number;
    limit?: number;
    offset?: number;
  };
  message?: string;
  errors?: Record<string, unknown>;
}

/**
 * Standard error response
 */
export interface ErrorResponse {
  message: string;
  detail?: string;
  code?: string | number;
  errors?: Record<string, unknown> | string[];
  [key: string]: unknown;
}
