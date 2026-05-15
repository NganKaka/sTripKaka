import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteNotification, deleteNotifications, fetchNotifications, markNotificationsRead } from '../services/notifications';
import type { NotificationItem, NotificationsResponse } from '../types/notifications';

function readResponse(data: NotificationsResponse) {
  return {
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    unreadCount: typeof data.unread_count === 'number' ? data.unread_count : 0,
  };
}

export function useNotifications(pollIntervalMs = 30000) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const applyResponse = useCallback((data: NotificationsResponse) => {
    const next = readResponse(data);
    setNotifications(next.notifications);
    setUnreadCount(next.unreadCount);
  }, []);

  const refresh = useCallback(() => {
    fetchNotifications()
      .then(applyResponse)
      .catch(() => {
        setNotifications([]);
        setUnreadCount(0);
      });
  }, [applyResponse]);

  const markAllAsRead = useCallback(() => {
    markNotificationsRead()
      .then(applyResponse)
      .catch(() => {
        setUnreadCount(0);
        setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
      });
  }, [applyResponse]);

  const removeNotification = useCallback((notificationId: number) => {
    deleteNotification(notificationId)
      .then(() => {
        setNotifications(prev => prev.filter(item => item.id !== notificationId));
        refresh();
      })
      .catch(() => {
        setNotifications(prev => prev.filter(item => item.id !== notificationId));
      });
  }, [refresh]);

  const removeAllNotifications = useCallback(() => {
    deleteNotifications()
      .then(() => {
        setNotifications([]);
        setUnreadCount(0);
      })
      .catch(() => {
        setNotifications([]);
        setUnreadCount(0);
      });
  }, []);

  useEffect(() => {
    refresh();

    const isHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

    let intervalId: number | undefined;

    const start = () => {
      if (intervalId !== undefined) return;
      intervalId = window.setInterval(() => {
        if (!isHidden()) refresh();
      }, pollIntervalMs);
    };

    const stop = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const handleVisibilityChange = () => {
      if (isHidden()) {
        stop();
      } else {
        refresh();
        start();
      }
    };

    if (!isHidden()) start();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pollIntervalMs, refresh]);

  const unreadBadge = useMemo(() => (unreadCount > 99 ? '99+' : String(unreadCount)), [unreadCount]);

  return {
    notifications,
    unreadCount,
    unreadBadge,
    markAllAsRead,
    removeNotification,
    removeAllNotifications,
  };
}
