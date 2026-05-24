import { httpClient } from '@/services/api/httpClient';
import type {
  IConversationResponse,
  IMessageResponse,
  IMessageSendRequest,
  IThreadResponse,
} from '@/services/api/types/chat.types';

export const conversationsApi = {
  list: () => httpClient.get<IConversationResponse[]>('/conversations'),

  get: (convId: string | number) =>
    httpClient.get<IConversationResponse>(`/conversations/${convId}`),

  create: (data: { customer_id?: number; factory_id?: number; rfq_id?: number }) =>
    httpClient.post<IConversationResponse>('/conversations', data),

  markAsRead: (convId: string | number) =>
    httpClient.post<void>(`/conversations/${convId}/mark-read`, {}),
};

export const messagesApi = {
  send: (convId: string | number, payload: IMessageSendRequest) =>
    httpClient.post<IMessageResponse>(`/conversations/${convId}/messages`, payload),

  list: (convId: string | number, limit = 50, offset = 0) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return httpClient.get<IMessageResponse[]>(`/conversations/${convId}/messages?${params}`);
  },

  get: (convId: string | number, msgId: string | number) =>
    httpClient.get<IMessageResponse>(`/conversations/${convId}/messages/${msgId}`),

  delete: (convId: string | number, msgId: string | number) =>
    httpClient.delete<void>(`/conversations/${convId}/messages/${msgId}`),

  getThread: (convId: string | number) =>
    httpClient.get<IThreadResponse>(`/conversations/${convId}/thread`),
};

export const notificationsApi = {
  list: (params?: { filter?: 'all' | 'rfq' | 'order'; limit?: number; offset?: number }) => {
    const search = new URLSearchParams();
    if (params?.filter && params.filter !== 'all') search.set('filter', params.filter);
    if (params?.limit != null) search.set('limit', String(params.limit));
    if (params?.offset != null) search.set('offset', String(params.offset));
    const query = search.toString();
    return httpClient.get<unknown>(`/notifications${query ? `?${query}` : ''}`);
  },

  markAsRead: (id: string | number) =>
    httpClient.post<{ ok: boolean; unread_count: number }>(`/notifications/${id}/read`, {}),

  markAllAsRead: (filter?: 'all' | 'rfq' | 'order') =>
    httpClient.post<{ ok: boolean; updated_count: number; unread_count: number }>(
      '/notifications/read-all',
      filter && filter !== 'all' ? { filter } : {},
    ),

  delete: (id: string | number) => httpClient.delete<void>(`/notifications/${id}`),

  unreadCount: () => httpClient.get<{ count: number }>('/notifications/unread-count'),
};
