/**
 * Chat & Messaging API — Conversations and messages
 */

import { httpClient } from '@/services/api/httpClient';
import { type MessageDTO, type MessageSendPayload, type ThreadResponse, type ConversationDTO } from '@/services/api/types/chat.types';

export const conversationsApi = {
  list: () => httpClient.get<ConversationDTO[]>('/conversations'),

  get: (convId: string | number) => httpClient.get<ConversationDTO>(`/conversations/${convId}`),

  create: (data: { customer_id?: number; factory_id?: number; rfq_id?: number }) =>
    httpClient.post<ConversationDTO>('/conversations', data),

  markAsRead: (convId: string | number) =>
    httpClient.post<void>(`/conversations/${convId}/mark-read`, {}),
};

export const messagesApi = {
  send: (convId: string | number, payload: MessageSendPayload) =>
    httpClient.post<MessageDTO>(`/conversations/${convId}/messages`, payload),

  list: (convId: string | number, limit = 50, offset = 0) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return httpClient.get<MessageDTO[]>(`/conversations/${convId}/messages?${params}`);
  },

  get: (convId: string | number, msgId: string | number) =>
    httpClient.get<MessageDTO>(`/conversations/${convId}/messages/${msgId}`),

  delete: (convId: string | number, msgId: string | number) =>
    httpClient.delete<void>(`/conversations/${convId}/messages/${msgId}`),

  getThread: (convId: string | number) =>
    httpClient.get<ThreadResponse>(`/conversations/${convId}/thread`),
};

export const notificationsApi = {
  list: () => httpClient.get<unknown[]>('/notifications'),

  get: (id: string | number) => httpClient.get<unknown>(`/notifications/${id}`),

  markAsRead: (id: string | number) => httpClient.post<void>(`/notifications/${id}/mark-read`, {}),

  markAllAsRead: () => httpClient.post<void>('/notifications/mark-all-read', {}),

  delete: (id: string | number) => httpClient.delete<void>(`/notifications/${id}`),

  deleteAll: () => httpClient.delete<void>('/notifications'),

  /** Get unread count */
  getUnreadCount: () =>
    httpClient.get<{
      total: number;
    }>('/notifications/unread-count'),
};
