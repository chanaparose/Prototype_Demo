import { httpClient } from '@/services/api/httpClient';
import type {
  IConversationResponse,
  IMessageResponse,
  IMessageSendRequest,
  IThreadResponse,
} from '@/services/api/types/chat.types';

export const conversationsApi = {
  list: () => httpClient.get<IConversationResponse[]>('/conversations'),

  get: (convId: string | number) => httpClient.get<IConversationResponse>(`/conversations/${convId}`),

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
  list: (params?: { page?: number; limit?: number; unread?: boolean }) => {
    const search = new URLSearchParams();
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.limit != null) search.set('limit', String(params.limit));
    if (params?.unread != null) search.set('unread', String(params.unread));
    const query = search.toString();
    return httpClient.get<unknown[]>(`/notifications${query ? `?${query}` : ''}`);
  },

  get: (id: string | number) => httpClient.get<unknown>(`/notifications/${id}`),

  markAsRead: (id: string | number) => httpClient.post<void>(`/notifications/${id}/mark-read`, {}),

  markAllAsRead: () => httpClient.post<void>('/notifications/mark-all-read', {}),

  delete: (id: string | number) => httpClient.delete<void>(`/notifications/${id}`),

  deleteAll: () => httpClient.delete<void>('/notifications'),

  /** Get unread count */
  getUnreadCount: () =>
    httpClient.get<{
      total: number;
      count?: number;
    }>('/notifications/unread-count'),

  unreadCount: () =>
    httpClient.get<{
      total: number;
      count?: number;
    }>('/notifications/unread-count'),
};
