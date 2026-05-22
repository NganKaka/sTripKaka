export interface NotificationItem {
  id: number;
  location_id: string;
  review_id: number | null;
  image_note_id?: number | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  unread_count: number;
  notifications: NotificationItem[];
}
