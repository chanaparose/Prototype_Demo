import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { runAsyncAction } from '@/utils/asyncAction';
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
  FileText,
  FileCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { notificationsApi } from '@/services/api/chatApi';
import { fetchNotificationsPage } from '@/domain/notifications/queries/useNotificationQueries';
import type { INotificationModel } from '@/domain/notifications/types/notification.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/utils/formatting/formatDate';

export function NotificationsMobile() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [notifications, setNotifications] = useState<INotificationModel[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const [tab, setTab] = useState<'all' | 'rfq' | 'order'>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);

  const LIMIT = 20;

  const load = useCallback(async (nextOffset: number, append: boolean) => {
    setError('');
    await runAsyncAction(
      async () => {
        const pageRes = await fetchNotificationsPage(tab, LIMIT, nextOffset);
        setOffset(nextOffset);
        setTotal(pageRes.total);
        setNotifications((prev) => (append ? [...prev, ...pageRes.items] : pageRes.items));
        setUnreadCount(pageRes.unreadCount);
      },
      {
        onStart: () => {
          if (append) setLoadingMore(true);
          else setLoading(true);
        },
        onSettled: () => {
          if (append) setLoadingMore(false);
          else setLoading(false);
        },
        onError: (message) => setError(message),
        fallbackMessage: 'โหลดการแจ้งเตือนไม่สำเร็จ',
      },
    );
  }, [tab]);

  // Reload from beginning when tab changes
  useEffect(() => {
    setNotifications([]);
    void load(0, false);
  }, [load]);


  // Tab filtering is server-side; only apply local search and unread filter
  const filtered = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    const byUnread = onlyUnread ? notifications.filter((n) => !n.is_read) : notifications;
    if (!keyword) return byUnread;
    return byUnread.filter(
      (n) =>
        n.title.toLowerCase().includes(keyword) ||
        n.message.toLowerCase().includes(keyword) ||
        n.type.toLowerCase().includes(keyword),
    );
  }, [notifications, searchText, onlyUnread]);

  const markRead = useCallback(async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.noti_id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await notificationsApi.markAsRead(id).then(
      (res) => setUnreadCount(res.unread_count),
      () => {
        setNotifications((prev) =>
          prev.map((n) => (n.noti_id === id ? { ...n, is_read: false } : n)),
        );
        setUnreadCount((prev) => prev + 1);
      },
    );
  }, []);

  const markAllRead = useCallback(async () => {
    const backup = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await runAsyncAction(
      async () => {
        const res = await notificationsApi.markAllAsRead(tab);
        setUnreadCount(res.unread_count);
      },
      {
        onStart: () => setMarkingAll(true),
        onSettled: () => setMarkingAll(false),
        onError: () => {
          setNotifications(backup);
          setUnreadCount(backup.filter((n) => !n.is_read).length);
        },
      },
    );
  }, [notifications, tab]);

  const removeNotification = useCallback(
    async (id: number) => {
      const backup = notifications;
      const target = backup.find((n) => n.noti_id === id);
      setNotifications((prev) => prev.filter((n) => n.noti_id !== id));
      if (target && !target.is_read) setUnreadCount((prev) => Math.max(0, prev - 1));
      await notificationsApi.delete(id).catch(() => {
        setNotifications(backup);
        setUnreadCount(backup.filter((n) => !n.is_read).length);
      });
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
            filtered.map((notif, i) => {
              const dest = resolveNotificationPath(notif);
              return (
                <motion.div
                  key={notif.noti_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {dest ? (
                    <Link
                      to={dest}
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
              );
            })
          )}
        </div>

        {canLoadMore ? (
          <div className='mt-4 flex justify-center'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => void load(offset + LIMIT, true)}
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
  notif: INotificationModel;
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

function resolveNotificationPath(notif: INotificationModel): string | null {
  const explicitPath = normalizeInternalPath(notif.link_to);
  if (explicitPath) return explicitPath;

  if (notif.conversation_id) return `/messages/${notif.conversation_id}`;

  switch (notif.type) {
    case 'quote_received':
    case 'rfq_expired':
    case 'rfq_closed':
      return notif.rfq_id ? `/rfqs/${notif.rfq_id}` : null;
    case 'order_confirmed':
    case 'order_status_changed':
    case 'production_updated':
    case 'order_completed':
    case 'payment_due':
      return notif.order_id ? `/orders/${notif.order_id}` : null;
    default:
      if (notif.order_id) return `/orders/${notif.order_id}`;
      if (notif.rfq_id) return `/rfqs/${notif.rfq_id}`;
      return null;
  }
}

function normalizeInternalPath(path?: string): string | null {
  const trimmed = path?.trim();
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (/^\/qu[ao]tations?\//.test(trimmed)) return trimmed.replace(/^\/qu[ao]tations?\//, '/rfqs/');
  return trimmed;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'quote_received':
      return <FileText className='text-brand-purple' size={20} />;
    case 'rfq_expired':
    case 'rfq_closed':
      return <XCircle className='text-red-400' size={20} />;
    case 'order_confirmed':
      return <FileCheck className='text-green-500' size={20} />;
    case 'order_status_changed':
      return <ShoppingBag className='text-brand-purple' size={20} />;
    case 'production_updated':
      return <Truck className='text-brand-purple' size={20} />;
    case 'order_completed':
      return <CheckCircle className='text-green-500' size={20} />;
    case 'payment_due':
      return <CreditCard className='text-brand-purple' size={20} />;
    default:
      return <Bell className='text-brand-purple' size={20} />;
  }
}
