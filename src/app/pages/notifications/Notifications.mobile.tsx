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
  FileText,
  FileCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@lib/utils';
import { notificationsApi } from '@/services/api/chatApi';
import { fetchNotificationsPage } from '@/domain/notifications/queries/useNotificationQueries';
import { NOTI_SUPERSEDE_RULES } from '@/domain/notifications/mappers/mapNotification';
import type { INotificationModel } from '@/domain/notifications/types/notification.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/utils/formatting/formatDate';
import { NotificationItemSkeleton } from '@/components/skeletons/PageSkeletons';
import { TabSwipeContent } from '@/components/layout/TabSwipeContent';

const NOTIFICATION_TAB_ORDER = ['all', 'rfq', 'order'] as const;

const NOTIFICATION_TABS = [
  { key: 'all' as const, label: 'ทั้งหมด' },
  { key: 'rfq' as const, label: 'RFQ' },
  { key: 'order' as const, label: 'Order' },
];

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

  const load = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError('');
      try {
        const pageRes = await fetchNotificationsPage(tab, LIMIT, nextOffset);
        setOffset(nextOffset);
        setTotal(pageRes.total);
        setNotifications((prev) => {
          if (!append) return pageRes.items;
          const existingIds = new Set(prev.map((n) => n.noti_id));
          return [...prev, ...pageRes.items.filter((n) => !existingIds.has(n.noti_id))];
        });
        setUnreadCount(pageRes.unreadCount);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'โหลดการแจ้งเตือนไม่สำเร็จ');
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [tab],
  );

  useEffect(() => {
    setNotifications([]);
    void load(0, false);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const seen = new Set<number>();
    let unique = notifications.filter((n) => {
      if (seen.has(n.noti_id)) return false;
      seen.add(n.noti_id);
      return true;
    });

    if (NOTI_SUPERSEDE_RULES.length > 0) {
      const specificKeys = new Set<string>();
      for (const n of unique) {
        for (const rule of NOTI_SUPERSEDE_RULES) {
          if (n.type === rule.specificType && n.rfq_id) {
            specificKeys.add(`${rule.specificType}__${n.rfq_id}`);
          }
        }
      }
      if (specificKeys.size > 0) {
        unique = unique.filter((n) => {
          for (const rule of NOTI_SUPERSEDE_RULES) {
            if (n.type === rule.broadType && n.rfq_id) {
              if (specificKeys.has(`${rule.specificType}__${n.rfq_id}`)) return false;
            }
          }
          return true;
        });
      }
    }

    const keyword = searchText.trim().toLowerCase();
    const byUnread = onlyUnread ? unique.filter((n) => !n.is_read) : unique;
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
    try {
      const res = await notificationsApi.markAsRead(id);
      setUnreadCount(res.unread_count);
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
      const res = await notificationsApi.markAllAsRead(tab);
      setUnreadCount(res.unread_count);
    } catch {
      setNotifications(backup);
      setUnreadCount(backup.filter((n) => !n.is_read).length);
    } finally {
      setMarkingAll(false);
    }
  }, [notifications, tab]);

  const removeNotification = useCallback(
    async (id: number) => {
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
    },
    [notifications],
  );

  const canLoadMore = notifications.length < total;

  return (
    <div className='flex min-h-screen flex-col bg-white pb-20'>
      <div className='flex items-center justify-between gap-2 px-4 pb-2 pt-3'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-slate-50'
          aria-label='ย้อนกลับ'
        >
          <ChevronLeft size={20} strokeWidth={2.25} />
        </Button>
        <h1 className='truncate text-[14px] font-bold text-brand-navy-ink'>การแจ้งเตือน</h1>
        {unreadCount > 0 ? (
          <Button
            variant='unstyled'
            type='button'
            onClick={() => void markAllRead()}
            disabled={markingAll}
            className='shrink-0 rounded-full px-2 py-1 text-[12px] font-medium text-brand-purple transition-colors hover:bg-brand-purple/8 disabled:opacity-50'
          >
            {markingAll ? '…' : 'อ่านทั้งหมด'}
          </Button>
        ) : (
          <div className='h-9 w-9 shrink-0' aria-hidden />
        )}
      </div>

      <div className='flex-1 px-4 py-2'>
        <div className='relative mb-2.5'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
            <Search className='h-4 w-4 text-gray-400' />
          </div>
          <Input
            type='text'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className='block w-full rounded-lg border border-gray-100 bg-white py-2 pl-9 pr-3 text-[12px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-purple/30'
            placeholder='ค้นหาการแจ้งเตือน...'
          />
        </div>

        <div
          role='tablist'
          aria-label='ประเภทการแจ้งเตือน'
          className='mb-2.5 grid grid-cols-3 border-b border-slate-200'
        >
          {NOTIFICATION_TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type='button'
                role='tab'
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={cn(
                  'relative flex h-9 items-center justify-center text-[12px] font-bold transition-colors',
                  active ? 'text-brand-purple' : 'text-slate-500 hover:text-[var(--brand-navy)]',
                )}
              >
                {t.label}
                {active ? (
                  <span className='absolute bottom-[-1px] left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-brand-purple' />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className='mb-3 flex items-center justify-between'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => setOnlyUnread((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-colors',
              onlyUnread
                ? 'border-brand-purple/30 bg-brand-purple/8 text-brand-purple'
                : 'border-gray-100 bg-white text-slate-500 hover:border-brand-purple/20',
            )}
          >
            ยังไม่อ่าน
            {unreadCount > 0 ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                  onlyUnread ? 'bg-white/80 text-brand-purple' : 'bg-slate-100 text-slate-500',
                )}
              >
                {unreadCount}
              </span>
            ) : null}
          </Button>
          <span className='text-[10px] text-gray-400'>{filtered.length} รายการ</span>
        </div>

        {error ? (
          <div className='mb-2.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[12px] text-red-600'>
            {error}
          </div>
        ) : null}

        <TabSwipeContent activeKey={tab} tabOrder={NOTIFICATION_TAB_ORDER}>
          <div className='space-y-2'>
            {loading ? (
              <>
                {[...Array(6)].map((_, i) => (
                  <NotificationItemSkeleton key={i} />
                ))}
              </>
            ) : filtered.length === 0 ? (
              <div className='rounded-lg border border-dashed border-gray-100 bg-slate-50/80 py-10 text-center text-[12px] text-gray-500'>
                ไม่พบการแจ้งเตือน
              </div>
            ) : (
              filtered.map((notif, i) => {
                const dest = resolveNotificationPath(notif);
                return (
                  <motion.div
                    key={notif.noti_id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.12) }}
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
                className='rounded-full border border-gray-100 px-4 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:border-brand-purple/25 hover:text-brand-purple disabled:opacity-50'
              >
                {loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่ม'}
              </Button>
            </div>
          ) : null}
        </TabSwipeContent>
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
      className={cn(
        'flex items-center gap-2.5 rounded-lg border bg-white p-2.5 transition-colors',
        read ? 'border-gray-100' : 'border-brand-purple/20 bg-brand-purple/[0.03]',
      )}
    >
      <div className='relative h-9 w-9 shrink-0'>
        <div className='flex h-full w-full items-center justify-center rounded-lg bg-brand-purple/10'>
          {icon}
        </div>
        {!read ? (
          <span className='absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-brand-purple' />
        ) : null}
      </div>

      <div className='min-w-0 flex-1'>
        <div className='mb-0.5 flex items-start justify-between gap-2'>
          <h3
            className={cn(
              'line-clamp-1 text-xs leading-tight',
              read ? 'font-medium text-gray-700' : 'font-semibold text-[var(--brand-navy)]',
            )}
          >
            {notif.title}
          </h3>
          <span
            className={cn(
              'shrink-0 text-[10px] font-medium',
              !read ? 'text-brand-purple' : 'text-gray-400',
            )}
          >
            {formatDateTime(notif.created_at)}
          </span>
        </div>
        <p className='line-clamp-2 text-[10px] leading-snug text-gray-500'>{notif.message}</p>
      </div>

      <Button
        variant='unstyled'
        type='button'
        onClick={onDelete}
        className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-100 text-gray-400 transition-colors hover:border-red-200 hover:text-red-500'
        aria-label='ลบการแจ้งเตือน'
      >
        <Trash2 size={13} strokeWidth={2.25} />
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
      return <FileText className='text-brand-purple' size={16} strokeWidth={2.25} />;
    case 'rfq_expired':
    case 'rfq_closed':
      return <XCircle className='text-red-400' size={16} strokeWidth={2.25} />;
    case 'order_confirmed':
      return <FileCheck className='text-green-500' size={16} strokeWidth={2.25} />;
    case 'order_status_changed':
      return <ShoppingBag className='text-brand-purple' size={16} strokeWidth={2.25} />;
    case 'production_updated':
      return <Truck className='text-brand-purple' size={16} strokeWidth={2.25} />;
    case 'order_completed':
      return <CheckCircle className='text-green-500' size={16} strokeWidth={2.25} />;
    case 'payment_due':
      return <CreditCard className='text-brand-purple' size={16} strokeWidth={2.25} />;
    default:
      return <Bell className='text-brand-purple' size={16} strokeWidth={2.25} />;
  }
}
