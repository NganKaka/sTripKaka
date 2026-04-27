import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Settings, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from '../lib/api';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NotificationItem {
  id: number;
  location_id: string;
  review_id: number | null;
  image_note_id?: number | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  unread_count: number;
  notifications: NotificationItem[];
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const tabs = ["Journal", "Stats"];
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const formatNotiDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchNotifications = () => {
    fetch(apiUrl('/notifications?limit=5'))
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch notifications');
        return res.json();
      })
      .then((data: NotificationsResponse) => {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadCount(typeof data.unread_count === 'number' ? data.unread_count : 0);
      })
      .catch(() => {
        setNotifications([]);
        setUnreadCount(0);
      });
  };

  const markAllAsRead = () => {
    fetch(apiUrl('/notifications/read-all?limit=5'), { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to mark notifications as read');
        return res.json();
      })
      .then((data: NotificationsResponse) => {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadCount(typeof data.unread_count === 'number' ? data.unread_count : 0);
      })
      .catch(() => {
        setUnreadCount(0);
        setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
      });
  };

  const handleDeleteNotification = (notificationId: number) => {
    fetch(apiUrl(`/notifications/${notificationId}`), { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete notification');
        setNotifications(prev => prev.filter(item => item.id !== notificationId));
        fetchNotifications();
      })
      .catch(() => {
        setNotifications(prev => prev.filter(item => item.id !== notificationId));
      });
  };

  const handleDeleteAllNotifications = () => {
    fetch(apiUrl('/notifications'), { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete all notifications');
        setNotifications([]);
        setUnreadCount(0);
      })
      .catch(() => {
        setNotifications([]);
        setUnreadCount(0);
      });
  };

  useEffect(() => {
    fetchNotifications();
    const id = window.setInterval(fetchNotifications, 10000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    markAllAsRead();
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (item: NotificationItem) => {
    if (item.review_id) {
      localStorage.setItem('reviewTarget', `${item.location_id}:${item.review_id}`);
    } else {
      localStorage.removeItem('reviewTarget');
    }
    setOpen(false);
    setActiveTab(`Gallery:${item.location_id}`);
  };

  const unreadBadge = useMemo(() => (unreadCount > 99 ? '99+' : String(unreadCount)), [unreadCount]);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-background/60 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 md:px-12 py-6">
        <div
          className="text-xl font-black text-primary tracking-tighter cursor-pointer"
          onClick={() => {
            if (activeTab === 'Dashboard') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              setActiveTab('Dashboard');
            }
          }}
        >
          sTripKaka
        </div>

        <div className="hidden md:flex items-center space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-headline tracking-tighter uppercase text-[12px] font-bold transition-all duration-300 relative pb-1 px-2 py-1 rounded-md cursor-pointer ${
                activeTab === tab
                  ? "text-primary border-b-2 border-primary bg-primary/10 shadow-[0_0_14px_rgba(233,195,73,0.18)]"
                  : "text-secondary/60 hover:text-cyan-300 hover:bg-cyan-400/10"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div ref={panelRef} className="relative flex items-center" onMouseLeave={() => setOpen(false)}>
            <button
              onClick={() => setOpen(prev => !prev)}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/12 hover:scale-110 transition-all cursor-pointer"
              aria-label="Open notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-[18px] text-center shadow-[0_0_12px_rgba(244,63,94,0.6)]">
                  {unreadBadge}
                </span>
              )}
            </button>

            {open && <div className="absolute top-full right-0 h-2 w-[340px] bg-transparent" />}

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-full right-0 mt-2 w-[340px] max-h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-3 z-50"
                >
                  <div className="flex items-center justify-between px-2 py-1 mb-2">
                    <span className="text-[11px] font-tech uppercase tracking-[0.2em] text-primary">Notifications</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAllNotifications}
                        disabled={notifications.length === 0}
                        className="text-[10px] font-tech uppercase tracking-[0.15em] text-secondary/70 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Delete all
                      </button>
                      <span className="text-[10px] font-tech uppercase tracking-[0.15em] text-secondary/70">{notifications.length} items</span>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-secondary/70 text-sm">No notifications yet</div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map(item => (
                        <div
                          key={`noti-${item.id}`}
                          className={`w-full rounded-xl border px-3 py-3 transition-all ${item.is_read ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]' : 'border-primary/30 bg-primary/10 hover:bg-primary/15'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <button onClick={() => handleNotificationClick(item)} className="flex-1 text-left cursor-pointer">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-on-surface leading-snug">{item.title}</p>
                                {!item.is_read && <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />}
                              </div>
                              <p className="text-xs text-secondary/80 mt-1 leading-relaxed">{item.message}</p>
                              <p className="text-[10px] text-secondary/60 mt-2 font-tech tracking-wider">{formatNotiDate(item.created_at)}</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNotification(item.id)}
                              className="shrink-0 rounded-full p-1 text-secondary/60 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                              aria-label="Delete notification"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="text-secondary hover:scale-110 transition-transform hidden sm:block cursor-pointer">
            <Settings size={20} />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('Journal')}
            className="bg-primary text-background px-6 py-2 rounded-lg text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(233,195,73,0.6)] hover:shadow-[0_0_30px_rgba(233,195,73,1)] border border-primary/50 transition-shadow cursor-pointer relative overflow-hidden group"
          >
            <span className="relative z-10">Begin Journey</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
