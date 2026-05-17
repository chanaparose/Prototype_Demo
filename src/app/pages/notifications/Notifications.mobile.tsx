import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Search,
  Bell,
  ChevronLeft,
  Trash2,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  CreditCard,
  Star,
  FileText,
  FileCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { notificationsApi } from '@/services/api/chatApi';
import { NOTIFICATIONS_CHANGED_EVENT } from '@/hooks/useNotificationUnreadCount';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/utils/formatting/formatDate';

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
  const [tab, setTab] = useState<'all' | 'rfq' | 'order'>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);

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
    const byTab = notifications.filter((n) => {
      const t = String(n.type).toUpperCase();
      if (tab === 'rfq') return t.includes('RFQ') || t.includes('QUOTATION');
      if (tab === 'order')
        return t.includes('ORDER') || t.includes('PAYMENT') || t.includes('REVIEW');
      return true;
    });
    const byUnread = onlyUnread ? byTab.filter((n) => !n.is_read) : byTab;
    if (!keyword) return byUnread;
    return byUnread.filter(
      (n) =>
        n.title.toLowerCase().includes(keyword) ||
        n.message.toLowerCase().includes(keyword) ||
        n.type.toLowerCase().includes(keyword),
    );
  }, [notifications, searchText, tab, onlyUnread]);

  const markRead = useCallback(async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.noti_id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await notificationsApi.markAsRead(id);
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.noti_id === id ? { ...n, is_read: false } : n)),
      );
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
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
    } catch {
      setNotifications(backup);
      setUnreadCount(backup.filter((n) => !n.is_read).length);
    } finally {
      setMarkingAll(false);
    }
  }, [notifications]);

  const removeNotification = useCallback(
    async (id: number) => {
      const backup = notifications;
      const target = backup.find((n) => n.noti_id === id);
      setNotifications((prev) => prev.filter((n) => n.noti_id !== id));
      if (target && !target.is_read) setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await notificationsApi.delete(id);
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
      } catch {
        setNotifications(backup);
        setUnreadCount(backup.filter((n) => !n.is_read).length);
      }
    },
    [notifications],
  );

  const canLoadMore = notifications.length < total;

  return (
    <div className='min-h-screen flex flex-col pb-20 bg-white'>
      <div className='flex items-center justify-between px-4 pt-4 pb-3'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center'
        >
          <ChevronLeft size={22} className='text-gray-700' />
        </Button>
        <div className='flex flex-col items-center'>
          <p className='text-[10px] text-gray-400'>แจ้งเตือน</p>
          <div className='flex items-center gap-2'>
            <h1 className='text-[13px] text-gray-900 truncate' style={{ fontWeight: 700 }}>
              การแจ้งเตือน
            </h1>
            {unreadCount > 0 ? (
              <span className='min-w-[18px] h-[18px] px-1 rounded-full bg-brand-purple text-white flex items-center justify-center text-[9px] font-bold'>
                {unreadCount}
              </span>
            ) : null}
          </div>
        </div>
        {unreadCount > 0 ? (
          <Button
            variant='unstyled'
            type='button'
            onClick={() => void markAllRead()}
            disabled={markingAll}
            className='text-[11px] font-semibold text-brand-purple disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-violet-50'
          >
            {markingAll ? '…' : 'อ่านทั้งหมด'}
          </Button>
        ) : (
          <div className='w-10 h-10' aria-hidden />
        )}
      </div>

      <div className='px-4 py-3 flex-1'>
        <div className='relative mb-3'>
          <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
            <Search className='h-5 w-5 text-slate-400' />
          </div>
          <Input
            type='text'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className='block w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-sm text-slate-700 shadow-[0_4px_20px_rgb(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-brand-purple transition-all'
            placeholder='ค้นหาการแจ้งเตือน...'
          />
        </div>

        <div className='mb-3 grid grid-cols-3 gap-2'>
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'rfq', label: 'RFQ' },
            { key: 'order', label: 'Order' },
          ].map((t) => {
            const active = tab === t.key;
            return (
              <Button
                variant='unstyled'
                key={t.key}
                type='button'
                onClick={() => setTab(t.key as 'all' | 'rfq' | 'order')}
                className='rounded-lg px-2 py-1.5 text-[11px] font-semibold border transition-colors'
                style={{
                  borderColor: active ? 'var(--brand-purple)' : 'var(--neutral-slate-border)',
                  background: active ? '#F3E8FF' : 'var(--neutral-white)',
                  color: active ? '#7E22CE' : 'var(--neutral-slate-subtle)',
                }}
              >
                {t.label}
              </Button>
            );
          })}
        </div>
        <div className='mb-4 flex items-center justify-between'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => setOnlyUnread((v) => !v)}
            className='inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors'
            style={{
              borderColor: onlyUnread ? 'var(--brand-purple)' : 'var(--neutral-slate-border)',
              background: onlyUnread ? '#F3E8FF' : 'var(--neutral-white)',
              color: onlyUnread ? '#7E22CE' : 'var(--neutral-slate-subtle)',
            }}
          >
            ยังไม่อ่าน
            {unreadCount > 0 ? (
              <span className='rounded-full bg-white px-1.5 py-0.5 text-[10px]'>{unreadCount}</span>
            ) : null}
          </Button>
          <span className='text-[11px] text-slate-400'>{filtered.length} รายการ</span>
        </div>

        {error ? (
          <div className='mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600'>
            {error}
          </div>
        ) : null}

        <div className='space-y-3'>
          {loading ? (
            <div className='text-center py-12 text-slate-500 text-sm'>กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div className='text-center py-12 text-slate-500 text-sm'>ไม่พบการแจ้งเตือน</div>
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
                    className='block'
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
                  <Button
                    variant='unstyled'
                    type='button'
                    className='block w-full text-left'
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
                  </Button>
                )}
              </motion.div>
            ))
          )}
        </div>

        {canLoadMore ? (
          <div className='mt-4 flex justify-center'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => void load(page + 1, true)}
              disabled={loadingMore}
              className='px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 disabled:opacity-50'
            >
              {loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่ม'}
            </Button>
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
  const icon = getNotificationIcon(notif.type);
  return (
    <div
      className={`bg-white p-3 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border transition-all flex items-center gap-3 ${
        read ? 'border-slate-50' : 'border-brand-purple/20 bg-violet-50/30'
      }`}
    >
      <div className='relative w-12 h-12 shrink-0'>
        <div className='w-full h-full rounded-2xl bg-violet-100 flex items-center justify-center'>
          {icon}
        </div>
        {!read ? (
          <span className='absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-purple border-2 border-white rounded-full' />
        ) : null}
      </div>

      <div className='flex-1 min-w-0'>
        <div className='flex justify-between items-start gap-2 mb-1'>
          <h3
            className={`line-clamp-1 text-[13px] ${read ? 'font-semibold text-slate-700' : 'font-bold text-slate-800'}`}
          >
            {notif.title}
          </h3>
          <span
            className={`text-[11px] font-semibold shrink-0 ${!read ? 'text-brand-purple' : 'text-slate-400'}`}
          >
            {formatDateTime(notif.created_at)}
          </span>
        </div>
        <p
          className={`text-[13px] line-clamp-2 ${read ? 'font-medium text-slate-500' : 'font-medium text-slate-600'}`}
        >
          {notif.message}
        </p>
      </div>

      <Button
        variant='unstyled'
        type='button'
        onClick={onDelete}
        className='shrink-0 w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center'
        aria-label='ลบการแจ้งเตือน'
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (String(type).toUpperCase()) {
    case 'ORDER_PLACED':
      return <ShoppingBag className='text-brand-purple' size={20} />;
    case 'ORDER_SHIPPED':
      return <Truck className='text-brand-purple' size={20} />;
    case 'ORDER_COMPLETED':
      return <CheckCircle className='text-green-500' size={20} />;
    case 'ORDER_CANCELLED':
      return <XCircle className='text-red-400' size={20} />;
    case 'PAYMENT_RECEIVED':
      return <CreditCard className='text-brand-purple' size={20} />;
    case 'REVIEW_RECEIVED':
      return <Star className='text-amber-500' size={20} />;
    case 'QUOTATION_ACCEPTED':
      return <FileCheck className='text-green-500' size={20} />;
    case 'QUOTATION_RECEIVED':
      return <FileText className='text-brand-purple' size={20} />;
    case 'RFQ_RECEIVED':
      return <Bell className='text-brand-purple' size={20} />;
    default:
      return <Bell className='text-brand-purple' size={20} />;
  }
}
