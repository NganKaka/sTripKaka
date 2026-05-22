import { apiUrl } from '../lib/api';
import type { NotificationsResponse } from '../types/notifications';

const NOTIFICATION_LIMIT = 5;

export async function fetchNotifications() {
  const response = await fetch(apiUrl(`/notifications?limit=${NOTIFICATION_LIMIT}`));
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json() as Promise<NotificationsResponse>;
}

export async function markNotificationsRead() {
  const response = await fetch(apiUrl(`/notifications/read-all?limit=${NOTIFICATION_LIMIT}`), { method: 'POST' });
  if (!response.ok) throw new Error('Failed to mark notifications as read');
  return response.json() as Promise<NotificationsResponse>;
}

export async function deleteNotification(notificationId: number) {
  const response = await fetch(apiUrl(`/notifications/${notificationId}`), { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete notification');
}

export async function deleteNotifications() {
  const response = await fetch(apiUrl('/notifications'), { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete all notifications');
}
