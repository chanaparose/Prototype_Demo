import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, Bell, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useData } from '../../contexts/DataContext';
import { notificationsApi } from '../../services/api';

export function NotificationsMobile() {
  const navigate = useNavigate();
  const data = useData();
  const [searchText, setSearchText] = useState('');
  // Optimistic read tracking: set of noti IDs marked read locally
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());

  const markRead = useCallback(async (id: string) => {
    if (localRead.has(id)) return;
    setLocalRead((prev) => new Set([...prev, id]));
    try {
      await notificationsApi.markAsRead(id);
    } catch {
      // revert on failure
      setLocalRead((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [localRead]);

  const [markingAll, setMarkingAll] = useState(false);
  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setLocalRead(new Set(data.notifications.map((n) => n.id)));
    } catch {
      /* ignore */
    } finally {
      setMarkingAll(false);
    }
  }, [data.notifications]);

  const isRead = (notif: { id: string; read: boolean }) =>
    notif.read || localRead.has(notif.id);

  const filtered = data.notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(searchText.toLowerCase()) ||
      n.message.toLowerCase().includes(searchText.toLowerCase()),
  );

  const unreadCount = data.notifications.filter((n) => !isRead(n)).length;

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
            {unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#A238FF] text-white flex items-center justify-center text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
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
        <div className="relative mb-6">
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

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              ไม่พบการแจ้งเตือน
            </div>
          ) : (
            filtered.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {notif.linkTo ? (
                  <Link
                    to={notif.linkTo}
                    className="block"
                    onClick={() => markRead(notif.id)}
                  >
                    <NotificationCard notif={notif} read={isRead(notif)} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => markRead(notif.id)}
                  >
                    <NotificationCard notif={notif} read={isRead(notif)} />
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationCard({ notif, read }: { notif: any; read: boolean }) {
  return (
    <div
      className={`bg-white p-4 rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border transition-all flex items-center gap-4 ${
        read ? 'border-slate-50' : 'border-[#A238FF]/20 bg-violet-50/30'
      }`}
    >
      <div className="relative w-14 h-14 shrink-0">
        {notif.avatar ? (
          <img src={notif.avatar} alt="" className="w-full h-full object-cover rounded-[20px] shadow-sm" />
        ) : (
          <div className="w-full h-full rounded-[20px] bg-violet-100 flex items-center justify-center">
            <Bell className="text-[#A238FF]" size={24} />
          </div>
        )}
        {!read && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#A238FF] border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className={`truncate text-base ${read ? 'font-semibold text-slate-700' : 'font-bold text-slate-800'}`}>
            {notif.title}
          </h3>
          <span className={`text-xs font-semibold shrink-0 ml-2 ${!read ? 'text-[#A238FF]' : 'text-slate-400'}`}>
            {notif.time}
          </span>
        </div>
        <p className={`text-sm truncate ${read ? 'font-medium text-slate-500' : 'font-medium text-slate-600'}`}>
          {notif.message}
        </p>
      </div>
    </div>
  );
}
