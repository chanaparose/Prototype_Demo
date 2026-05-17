export type INotificationModel = {
  noti_id: number;
  type: string;
  title: string;
  message: string;
  link_to?: string;
  is_read: boolean;
  created_at: string;
  avatar?: string;
  rfq_id?: string;
  order_id?: string;
  conversation_id?: string;
};

export type INotificationsPageModel = {
  items: INotificationModel[];
  page: number;
  total: number;
  unreadCount: number;
};
