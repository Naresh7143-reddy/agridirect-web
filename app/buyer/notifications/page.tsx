'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Bell, Loader2, CheckCheck, Trash2 } from 'lucide-react';
import { notificationsApi } from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  body: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list();
      setNotifications(res.data ?? []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
    finally { setMarkingAll(false); }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 7) return `${diffDay}d ago`;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const iconForType = (type?: string) => {
    switch (type) {
      case 'ORDER': return '📦';
      case 'PAYMENT': return '💳';
      case 'OFFER': return '🏷️';
      case 'DELIVERY': return '🚲';
      default: return '🔔';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/buyer/profile" className="size-10 rounded-xl border-2 border-border flex items-center justify-center hover:border-primary/40 transition">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-primary font-semibold">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            {markingAll ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-16 text-ink-2">
          <Bell className="size-12 mx-auto mb-3 text-ink-3" />
          <p className="font-semibold">No notifications yet</p>
          <p className="text-sm mt-1">Order updates and offers will show up here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !n.isRead && markRead(n.id)}
                className={`card flex gap-3 items-start cursor-pointer transition ${
                  n.isRead ? 'opacity-70' : 'border-l-4 border-primary'
                }`}
              >
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-lg">
                  {iconForType(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-bold text-sm truncate ${n.isRead ? '' : 'text-primary'}`}>{n.title}</h3>
                    <span className="text-xs text-ink-3 flex-shrink-0">{formatTime(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-ink-2 mt-0.5 line-clamp-2">{n.body}</p>
                </div>
                {!n.isRead && (
                  <div className="size-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
