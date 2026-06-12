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
  /** raw reference_id จาก DB — ใช้สำหรับ semantic dedup (category vs subcategory) */
  reference_id?: number;
};

export type INotificationsPageModel = {
  items: INotificationModel[];
  page: number;
  total: number;
  unreadCount: number;
};
