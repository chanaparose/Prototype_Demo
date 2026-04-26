import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, Bell, ChevronLeft, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { notificationsApi } from '../../services/api';

type NotificationItem = {
  noti_id: number;
  type: string;
  title: string;
  message: string;
  link_to?: string;
  is_read: boolean;
  created_at: string;
};

function mapNotification(row: Record<string, unknown>): NotificationItem | null {
  const notiId = Number(row.noti_id ?? row.id ?? 0);
  if (!Number.isFinite(notiId) || notiId <= 0) return null;
  return {
    noti_id: notiId,
    type: String(row.type ?? ''),
    title: String(row.title ?? 'การแจ้งเตือน'),
    message: String(row.message ?? ''),
    link_to:
      typeof row.link_to === 'string' && row.link_to
        ? row.link_to
        : typeof row.link === 'string' && row.link
        ? row.link
        : undefined,
    is_read: Boolean(row.is_read ?? false),
    created_at: String(row.created_at ?? ''),
  };
}

function formatTimeLabel(value: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationsMobile() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (nextPage: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');
    try {
      const [listRes, unreadRes] = await Promise.all([
        notificationsApi.list({ page: nextPage, limit: 20, unread: false }),
        notificationsApi.unreadCount(),
      ]);
      const listObj = listRes as Record<string, unknown>;
      const rows = Array.isArray(listObj.data)
        ? (listObj.data as Record<string, unknown>[])
        : Array.isArray(listRes)
        ? (listRes as Record<string, unknown>[])
        : [];
      const mapped = rows
        .map(mapNotification)
        .filter((item): item is NotificationItem => item !== null);
      setPage(Number(listObj.page ?? nextPage));
      setTotal(Number(listObj.total ?? mapped.length));
      setNotifications((prev) => (append ? [...prev, ...mapped] : mapped));
      setUnreadCount(Number((unreadRes as { count?: number }).count ?? listObj.unread_count ?? 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดการแจ้งเตือนไม่สำเร็จ');
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1, false);
  }, [load]);

  const filtered = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return notifications;
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(keyword) ||
        n.message.toLowerCase().includes(keyword) ||
        n.type.toLowerCase().includes(keyword),
    );
  }, [notifications, searchText]);

  const markRead = useCallback(async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.noti_id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await notificationsApi.markAsRead(id);
    } catch {
      setNotifications((prev) => prev.map((n) => (n.noti_id === id ? { ...n, is_read: false } : n)));
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    const backup = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllAsRead();
    } catch {
      setNotifications(backup);
      setUnreadCount(backup.filter((n) => !n.is_read).length);
    } finally {
      setMarkingAll(false);
    }
  }, [notifications]);

  const removeNotification = useCallback(async (id: number) => {
    const backup = notifications;
    const target = backup.find((n) => n.noti_id === id);
    setNotifications((prev) => prev.filter((n) => n.noti_id !== id));
    if (target && !target.is_read) setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await notificationsApi.delete(id);
    } catch {
      setNotifications(backup);
      setUnreadCount(backup.filter((n) => !n.is_read).length);
    }
  }, [notifications]);

  const canLoadMore = notifications.length < total;

  return (
    <div className="min-h-screen flex flex-col pb-20 bg-white">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center"
        >
          <ChevronLeft size={22} className="text-gray-700" />
        </button>
        <div className="flex flex-col items-center">
          <p className="text-[10px] text-gray-400">แจ้งเตือน</p>
          <div className="flex items-center gap-2">
            <h1 className="text-sm text-gray-900 truncate" style={{ fontWeight: 700 }}>
              การแจ้งเตือน
            </h1>
            {unreadCount > 0 ? (
              <span className="w-5 h-5 rounded-full bg-[#A238FF] text-white flex items-center justify-center text-[10px] font-bold">
                {unreadCount}
              </span>
            ) : null}
          </div>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={markingAll}
            className="text-[11px] font-semibold text-[#A238FF] disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-violet-50"
          >
            {markingAll ? '…' : 'อ่านทั้งหมด'}
          </button>
        ) : (
          <div className="w-10 h-10" aria-hidden />
        )}
      </div>

      <div className="px-4 py-4 flex-1">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-50 rounded-2xl text-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-[#A238FF] transition-all"
            placeholder="ค้นหาการแจ้งเตือน..."
          />
        </div>

        {error ? (
          <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
        ) : null}

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">ไม่พบการแจ้งเตือน</div>
          ) : (
            filtered.map((notif, i) => (
              <motion.div
                key={notif.noti_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                {notif.link_to ? (
                  <Link
                    to={notif.link_to}
                    className="block"
                    onClick={() => {
                      if (!notif.is_read) void markRead(notif.noti_id);
                    }}
                  >
                    <NotificationCard
                      notif={notif}
                      onDelete={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void removeNotification(notif.noti_id);
                      }}
                    />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => {
                      if (!notif.is_read) void markRead(notif.noti_id);
                    }}
                  >
                    <NotificationCard
                      notif={notif}
                      onDelete={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void removeNotification(notif.noti_id);
                      }}
                    />
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>

        {canLoadMore ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => void load(page + 1, true)}
              disabled={loadingMore}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 disabled:opacity-50"
            >
              {loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่ม'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NotificationCard({
  notif,
  onDelete,
}: {
  notif: NotificationItem;
  onDelete: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const read = notif.is_read;
  return (
    <div
      className={`bg-white p-4 rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border transition-all flex items-center gap-4 ${
        read ? 'border-slate-50' : 'border-[#A238FF]/20 bg-violet-50/30'
      }`}
    >
      <div className="relative w-14 h-14 shrink-0">
        <div className="w-full h-full rounded-[20px] bg-violet-100 flex items-center justify-center">
          <Bell className="text-[#A238FF]" size={24} />
        </div>
        {!read ? <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#A238FF] border-2 border-white rounded-full" /> : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className={`line-clamp-1 text-sm ${read ? 'font-semibold text-slate-700' : 'font-bold text-slate-800'}`}>
            {notif.title}
          </h3>
          <span className={`text-[11px] font-semibold shrink-0 ${!read ? 'text-[#A238FF]' : 'text-slate-400'}`}>
            {formatTimeLabel(notif.created_at)}
          </span>
        </div>
        <p className={`text-sm line-clamp-2 ${read ? 'font-medium text-slate-500' : 'font-medium text-slate-600'}`}>
          {notif.message}
        </p>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center"
        aria-label="ลบการแจ้งเตือน"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
