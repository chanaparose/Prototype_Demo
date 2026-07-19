import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Star, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi, reviewsApi } from '@/services/api/userApi';
import { useAuth } from '@/stores/useAuthStore';
import { ReviewImageAttachments } from '@/components/features/reviews/ReviewImageAttachments';
import { normalizeReviewImageUrls } from '@/utils/reviewImageUrls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ReviewItem = {
  review_id: number;
  factory_name?: string;
  rating: number;
  comment: string;
  created_at: string;
  is_editable?: boolean;
  image_urls: string[];
  factory_reply?: string;
  factory_reply_at?: string;
};

export function MyReviewsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editReviewId, setEditReviewId] = useState(0);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);

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
        data
          .map((row) => ({
            review_id: Number(row.review_id ?? row.id ?? 0),
            factory_name: String(row.factory_name ?? row.factory ?? ''),
            rating: Number(row.rating ?? 0),
            comment: String(row.comment ?? ''),
            created_at: String(row.created_at ?? ''),
            is_editable: Boolean(row.is_editable),
            image_urls: normalizeReviewImageUrls(row.image_urls),
            factory_reply: row.factory_reply ? String(row.factory_reply) : undefined,
            factory_reply_at: row.factory_reply_at ? String(row.factory_reply_at) : undefined,
          }))
          .filter((r) => Number.isFinite(r.review_id) && r.review_id > 0),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.role]);

  const openEdit = (r: ReviewItem) => {
    setEditReviewId(r.review_id);
    setEditRating(r.rating);
    setEditComment(r.comment);
    setEditImages([...r.image_urls]);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const text = editComment.trim();
    if (!text) {
      toast.error('กรุณาเขียนรีวิว');
      return;
    }
    if (!Number.isFinite(editRating) || editRating < 1 || editRating > 5) {
      toast.error('กรุณาเลือกคะแนน 1 ถึง 5 ดาว');
      return;
    }
    setEditSaving(true);
    try {
      await reviewsApi.update(editReviewId, {
        rating: editRating,
        comment: text,
        image_urls: normalizeReviewImageUrls(editImages),
      });
      toast.success('บันทึกรีวิวแล้ว');
      setEditOpen(false);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ';
      const m = msg.toLowerCase();
      if (m.includes('image_urls') && m.includes('5')) toast.error('แนบรูปได้ไม่เกิน 5 รูป');
      else toast.error(msg);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className='flex min-h-screen flex-col bg-white pb-20'>
      {/* Header - Match FavoriteShowcasesPage style */}
      <div className='flex items-center justify-between px-4 pb-3 pt-4'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm'
          aria-label='ย้อนกลับ'
        >
          <ChevronLeft size={22} className='text-gray-700' />
        </Button>
        <div className='flex flex-col items-center'>
          <p className='text-[12px] text-gray-400'>บัญชี</p>
          <h1 className='text-[16px] text-gray-900 font-bold'>รีวิวของฉัน</h1>
        </div>
        <div className='h-10 w-10' aria-hidden />
      </div>

      <div className='flex-1 px-4 py-3'>
        {/* Search Input */}
        <div className='relative mb-4'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
            <Search className='h-5 w-5 text-slate-400' />
          </div>
          <Input
            type='text'
            placeholder='ค้นหารีวิว...'
            className='block w-full rounded-xl border border-slate-100 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-[0_4px_20px_rgb(0,0,0,0.04)] transition-all focus:outline-none focus:ring-2 focus:ring-brand-purple'
          />
        </div>

        {/* Item Count */}
        <div className='mb-3 flex items-center justify-end'>
          <span className='text-[11px] text-slate-400'>{items.length} รายการ</span>
        </div>

        {/* Reviews List */}
        <div className='space-y-2'>
          {loading ? (
            <div className='py-8 text-center'>
              <p className='text-sm text-slate-500'>กำลังโหลด...</p>
            </div>
          ) : items.length === 0 ? (
            <div className='py-12 text-center text-sm text-slate-500'>
              ยังไม่มีรีวิว — เขียนรีวิวหลังรับสินค้าแล้ว
            </div>
          ) : (
            items.map((r) => (
              <div
                key={r.review_id}
                className='rounded-lg border border-slate-100 bg-white px-4 py-3'
              >
                <div className='flex items-center justify-between gap-2 mb-2'>
                  <p className='text-sm font-medium text-slate-900'>
                    {r.factory_name || 'โรงงาน'}
                  </p>
                  <p className='text-[11px] text-slate-500'>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('th-TH') : '-'}
                  </p>
                </div>
                <p className='text-xs text-amber-500 mb-1'>
                  {'★'.repeat(Math.max(1, Math.min(5, r.rating)))}
                </p>
                <p className='text-sm text-slate-700 mb-2'>{r.comment || '-'}</p>
                <ReviewImageAttachments
                  urls={r.image_urls}
                  onPreviewUrl={(u) => window.open(u, '_blank', 'noopener,noreferrer')}
                />
                {r.factory_reply ? (
                  <div className='mt-2 rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2'>
                    <p className='mb-0.5 text-[10px] font-semibold text-brand-purple'>การตอบกลับจากโรงงาน</p>
                    <p className='text-xs text-slate-700 leading-relaxed'>{r.factory_reply}</p>
                    {r.factory_reply_at ? (
                      <p className='mt-0.5 text-[10px] text-slate-400'>
                        {new Date(r.factory_reply_at).toLocaleDateString('th-TH')}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {r.is_editable ? (
                  <div className='mt-2 flex gap-2'>
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() => openEdit(r)}
                      className='px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium hover:bg-slate-50'
                    >
                      แก้ไข
                    </Button>
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={async () => {
                        if (!window.confirm('ลบรีวิวนี้?')) return;
                        await reviewsApi.delete(r.review_id);
                        await load();
                      }}
                      className='px-3 py-1.5 rounded-lg border border-red-200 text-xs text-red-600 font-medium hover:bg-red-50'
                    >
                      ลบ
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      {editOpen ? (
        <div className='fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4'>
          <div className='w-full max-w-md !max-h-[70dvh] overflow-y-auto overscroll-contain rounded-2xl bg-white border border-slate-200 shadow-xl p-4 space-y-3 [-webkit-overflow-scrolling:touch] sm:!max-h-[90vh]'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-bold text-slate-900'>แก้ไขรีวิว</p>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setEditOpen(false)}
                className='w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500'
                aria-label='ปิด'
              >
                <X size={16} />
              </Button>
            </div>
            <div className='flex items-center gap-1'>
              {[1, 2, 3, 4, 5].map((s) => (
                <Button
                  variant='unstyled'
                  key={s}
                  type='button'
                  onClick={() => setEditRating(s)}
                  className='p-0.5'
                  aria-label={`${s} ดาว`}
                >
                  <Star
                    size={20}
                    className={s <= editRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                  />
                </Button>
              ))}
            </div>
            <Textarea
              aria-label='ข้อความรีวิว'
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              maxLength={1000}
              rows={4}
              className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300'
            />
            <ReviewImageAttachments
              urls={editImages}
              onChange={setEditImages}
              onUploadError={(msg) => toast.error(msg)}
            />
            <Button
              variant='unstyled'
              type='button'
              disabled={editSaving}
              onClick={() => void saveEdit()}
              className='w-full rounded-xl bg-brand-royal py-2.5 text-sm font-semibold text-white disabled:opacity-60'
            >
              {editSaving ? 'กำลังบันทึก…' : 'บันทึก'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
