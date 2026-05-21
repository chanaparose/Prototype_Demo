/**
 * User API — Profile, wallet, favorites, reviews
 */

import { httpClient } from '@/services/api/httpClient';

type ProfileReviewListParams = {
  page?: number;
  limit?: number;
};

type ProfileTransactionsParams = {
  page?: number;
  limit?: number;
  type?: 'all' | 'in' | 'out' | string;
};

type ProfileReviewListResponse = {
  page: number;
  limit: number;
  total: number;
  data: unknown[];
};

type ProfileTransactionsResponse = {
  page: number;
  limit: number;
  total: number;
  total_pages?: number;
  summary?: Record<string, number>;
  data: unknown[];
};

function buildProfileReviewQuery(params: ProfileReviewListParams = {}) {
  return new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 50),
  });
}

export const profileApi = {
  // GET /profile/
  get: () => httpClient.get<Record<string, unknown>>('/profile/'),

  // PUT /profile/
  update: (data: Record<string, unknown>) =>
    httpClient.put<Record<string, unknown>>('/profile/', data),

  // PUT /profile/change-password  (BE uses PUT; maps current_password → old_password)
  changePassword: (values: { current_password: string; new_password: string }) =>
    httpClient.put<void>('/profile/change-password', {
      old_password: values.current_password,
      new_password: values.new_password,
    }),

  // POST /profile/avatar  (wraps File in FormData automatically)
  uploadAvatar: (file: File | FormData) => {
    const fd = file instanceof FormData ? file : (() => { const f = new FormData(); f.append('file', file); return f; })();
    return httpClient.postForm<{ avatar_url: string }>('/profile/avatar', fd);
  },

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

  transactions: (params: ProfileTransactionsParams = {}) => {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
      type: String(params.type ?? 'all'),
    });
    return httpClient.get<ProfileTransactionsResponse>(`/profile/transactions?${query}`);
  },
};

export type WalletResponse = {
  wallet_id: number;
  user_id: number;
  good_fund: number;
  pending_fund: number;
};

export const walletApi = {
  /** GET /wallets/me — full wallet object with good_fund / pending_fund */
  getMe: () => httpClient.get<WalletResponse>('/wallets/me'),

  /** @deprecated use getMe() */
  getBalance: () => httpClient.get<WalletResponse>('/wallets/me'),

  getTransactions: (limit = 50, offset = 0) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return httpClient.get<unknown[]>(`/wallets/me/transactions?${params}`);
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

  create: (
    factoryId: string | number,
    data: { cert_id: number; document_url: string; cert_number?: string; expire_date?: string },
  ) => httpClient.post<unknown>(`/factories/${factoryId}/certificates`, data),

  update: (
    factoryId: string | number,
    mapId: string | number,
    data: Partial<{ cert_id: number; document_url: string; cert_number: string; expire_date: string }>,
  ) => httpClient.patch<unknown>(`/factories/${factoryId}/certificates/${mapId}`, data),

  upload: (formData: FormData) => httpClient.postForm<unknown>('/certificates/upload', formData),

  delete: (factoryId: string | number, certId: string | number) =>
    httpClient.delete<void>(`/factories/${factoryId}/certificates/${certId}`),
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
