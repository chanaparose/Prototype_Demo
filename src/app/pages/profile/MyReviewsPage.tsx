import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { profileApi, reviewsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

type ReviewItem = {
  review_id: number;
  factory_name?: string;
  rating: number;
  comment: string;
  created_at: string;
  is_editable?: boolean;
};

export function MyReviewsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const role = String(user?.role ?? '').toUpperCase();
      const raw =
        role === 'FT'
          ? await profileApi.receivedReviews({ page: 1, limit: 20 })
          : await profileApi.myReviews({ page: 1, limit: 20 });
      const data = Array.isArray(raw.data) ? (raw.data as Record<string, unknown>[]) : [];
      setItems(
        data.map((row) => ({
          review_id: Number(row.review_id ?? row.id ?? 0),
          factory_name: String(row.factory_name ?? row.factory ?? ''),
          rating: Number(row.rating ?? 0),
          comment: String(row.comment ?? ''),
          created_at: String(row.created_at ?? ''),
          is_editable: Boolean(row.is_editable),
        })).filter((r) => Number.isFinite(r.review_id) && r.review_id > 0),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.role]);

  return (
    <div className="space-y-4 pb-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} className="text-slate-600"><ChevronLeft size={18} /></button>
        <p className="text-sm font-bold text-slate-900">รีวิวของฉัน</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? <p className="text-sm text-slate-500">กำลังโหลด...</p> : items.length === 0 ? (
          <p className="text-sm text-slate-500">ยังไม่มีรีวิว — เขียนรีวิวหลังรับสินค้าแล้ว</p>
        ) : (
          <ul className="space-y-3">
            {items.map((r) => (
              <li key={r.review_id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{r.factory_name || 'โรงงาน'}</p>
                  <p className="text-[11px] text-slate-500">{r.created_at ? new Date(r.created_at).toLocaleDateString('th-TH') : '-'}</p>
                </div>
                <p className="text-[12px] text-amber-500">{'★'.repeat(Math.max(1, Math.min(5, r.rating)))}</p>
                <p className="text-sm text-slate-700">{r.comment || '-'}</p>
                {r.is_editable ? (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const next = window.prompt('แก้ไขข้อความรีวิว', r.comment) ?? r.comment;
                        if (!next.trim()) return;
                        await reviewsApi.update(r.review_id, { rating: r.rating, comment: next.trim() });
                        await load();
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-700"
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm('ลบรีวิวนี้?')) return;
                        await reviewsApi.delete(r.review_id);
                        await load();
                      }}
                      className="px-2.5 py-1 rounded-lg border border-red-200 text-xs text-red-600"
                    >
                      ลบ
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
