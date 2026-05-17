/**
 * User API — Profile, wallet, favorites, reviews
 */

import { httpClient } from '@/services/api/httpClient';

type ProfileReviewListParams = {
  page?: number;
  limit?: number;
};

type ProfileReviewListResponse = {
  page: number;
  limit: number;
  total: number;
  data: unknown[];
};

function buildProfileReviewQuery(params: ProfileReviewListParams = {}) {
  return new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 50),
  });
}

export const profileApi = {
  getMe: () => httpClient.get<Record<string, unknown>>('/profile/me'),

  updateMe: (data: Record<string, unknown>) =>
    httpClient.patch<Record<string, unknown>>('/profile/me', data),

  changePassword: (old_password: string, new_password: string) =>
    httpClient.post<void>('/profile/change-password', { old_password, new_password }),

  uploadAvatar: (formData: FormData) =>
    httpClient.postForm<{
      avatar_url: string;
    }>('/profile/upload-avatar', formData),

  getTransactionHistory: (limit = 50, offset = 0) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return httpClient.get<unknown[]>(`/profile/transactions?${params}`);
  },

  getReviews: (limit = 50, offset = 0) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return httpClient.get<unknown[]>(`/profile/reviews?${params}`);
  },

  myReviews: (params?: ProfileReviewListParams) =>
    httpClient.get<ProfileReviewListResponse>(
      `/profile/reviews?${buildProfileReviewQuery(params)}`,
    ),

  receivedReviews: (params?: ProfileReviewListParams) =>
    httpClient.get<ProfileReviewListResponse>(
      `/profile/reviews/received?${buildProfileReviewQuery(params)}`,
    ),
};

export const walletApi = {
  getBalance: () =>
    httpClient.get<{
      balance: number;
      currency: string;
    }>('/wallet/balance'),

  getTransactions: (limit = 50, offset = 0) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return httpClient.get<unknown[]>(`/wallet/transactions?${params}`);
  },

  deposit: (amount: number, payment_method: string) =>
    httpClient.post<Record<string, unknown>>('/wallet/deposit', {
      amount,
      payment_method,
    }),

  withdraw: (amount: number, bank_account_id: string | number) =>
    httpClient.post<Record<string, unknown>>('/wallet/withdraw', {
      amount,
      bank_account_id,
    }),

  getWithdrawableBalance: () =>
    httpClient.get<{
      withdrawable_balance: number;
      locked_balance: number;
    }>('/wallet/withdrawable-balance'),
};

export const favoritesApi = {
  list: () => httpClient.get<unknown[]>('/favorites'),

  add: (showcase_id: string | number) => httpClient.post<void>('/favorites', { showcase_id }),

  remove: (showcase_id: string | number) => httpClient.delete<void>(`/favorites/${showcase_id}`),

  isFavorite: (showcase_id: string | number) =>
    httpClient.get<{
      is_favorite: boolean;
    }>(`/favorites/${showcase_id}/check`),
};

export type IFactoryReviewSummaryResponse = {
  average_rating: number;
  total_reviews: number;
  review_count?: number;
  rating_distribution: Record<string, number>;
};

function fetchFactoryReviews(
  factoryId: string | number,
  limit = 20,
  offset = 0,
) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return httpClient.get<unknown[]>(`/factories/${factoryId}/reviews?${params}`);
}

function fetchFactoryReviewSummary(factoryId: string | number) {
  return httpClient.get<IFactoryReviewSummaryResponse>(
    `/factories/${factoryId}/reviews/summary`,
  );
}

export const reviewsApi = {
  list: () => httpClient.get<unknown[]>('/reviews'),

  create: (data: {
    factory_id: string | number;
    order_id: string | number;
    rating: number;
    comment: string;
  }) => httpClient.post<unknown>('/reviews', data),

  update: (id: string | number, data: Partial<Record<string, unknown>>) =>
    httpClient.patch<unknown>(`/reviews/${id}`, data),

  delete: (id: string | number) => httpClient.delete<void>(`/reviews/${id}`),

  getForFactory: fetchFactoryReviews,

  getSummary: fetchFactoryReviewSummary,

  /** @deprecated Use `getSummary` */
  summaryByFactory: fetchFactoryReviewSummary,

  /** @deprecated Use `getForFactory` */
  listByFactory: fetchFactoryReviews,
};

export const certificatesApi = {
  list: (factoryId?: string | number) => {
    const endpoint = factoryId ? `/certificates?factory_id=${factoryId}` : '/certificates';
    return httpClient.get<unknown[]>(endpoint);
  },

  upload: (formData: FormData) => httpClient.postForm<unknown>('/certificates/upload', formData),

  delete: (certId: string | number) => httpClient.delete<void>(`/certificates/${certId}`),
};

export const transactionsApi = {
  list: (limit = 50, offset = 0) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return httpClient.get<unknown[]>(`/transactions?${params}`);
  },

  get: (id: string | number) => httpClient.get<unknown>(`/transactions/${id}`),
};
