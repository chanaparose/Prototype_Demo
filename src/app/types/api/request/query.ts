/**
 * Query Request Types — Pagination, filtering, sorting
 */

export interface PaginationRequest {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortRequest {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface QueryTableRequest<TFilter = Record<string, unknown>> {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filters?: TFilter;
  [key: string]: unknown;
}

export interface ListRequest<TFilter = Record<string, unknown>>
  extends PaginationRequest, SortRequest {
  search?: string;
  filters?: TFilter;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  offset?: number;
}

export type PageParams = {
  page: number;
  limit: number;
};

export type PaginatedParams = {
  offset: number;
  limit: number;
};
