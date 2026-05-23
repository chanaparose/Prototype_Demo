import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi, reviewsApi } from '@/services/api/userApi';
import { useAuth } from '@/stores/useAuthStore';
import { ReviewImageAttachments } from '@/components/features/reviews/ReviewImageAttachments';
import { normalizeReviewImageUrls } from '@/utils/reviewImageUrls';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useConfirmDialog } from '@/shared/ui/modals/ConfirmDialog';
import { mapReviewItems, type ReviewItem } from '@/domain/review/mappers/mapReview';

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
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const load = async () => {
    setLoading(true);
    try {
      const role = String(user?.role ?? '').toUpperCase();
      const raw =
        role === 'FT'
          ? await profileApi.receivedReviews({ page: 1, limit: 20 })
          : await profileApi.myReviews({ page: 1, limit: 20 });
      setItems(mapReviewItems(raw));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.role]);

  const openEdit = (r: ReviewItem) => {
    setEditReviewId(r.reviewId);
    setEditRating(r.rating);
    setEditComment(r.comment);
    setEditImages([...r.imageUrls]);
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
    <div className='space-y-4 pb-24'>
      <ConfirmDialog />
      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-2'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='text-slate-600'
          aria-label='ย้อนกลับ'
        >
          <ChevronLeft size={18} />
        </Button>
        <p className='text-sm font-bold text-slate-900'>รีวิวของฉัน</p>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
        {loading ? (
          <p className='text-sm text-slate-500'>กำลังโหลด...</p>
        ) : items.length === 0 ? (
          <p className='text-sm text-slate-500'>ยังไม่มีรีวิว — เขียนรีวิวหลังรับสินค้าแล้ว</p>
        ) : (
          <ul className='space-y-3'>
            {items.map((r) => (
              <li
                key={r.reviewId}
                className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-3'
              >
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-sm font-semibold text-slate-900'>
                    {r.factoryName || 'โรงงาน'}
                  </p>
                  <p className='text-[11px] text-slate-500'>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('th-TH') : '-'}
                  </p>
                </div>
                <p className='text-[12px] text-amber-500'>
                  {'★'.repeat(Math.max(1, Math.min(5, r.rating)))}
                </p>
                <p className='text-sm text-slate-700'>{r.comment || '-'}</p>
                <ReviewImageAttachments
                  urls={r.imageUrls}
                  onPreviewUrl={(u) => window.open(u, '_blank', 'noopener,noreferrer')}
                />
                {r.isEditable ? (
                  <div className='mt-2 flex gap-2'>
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={() => openEdit(r)}
                      className='px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-700'
                    >
                      แก้ไข
                    </Button>
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'ลบรีวิวนี้?',
                          description: 'รีวิวนี้จะถูกลบออกจากรายการของคุณ',
                          confirmText: 'ลบรีวิว',
                          destructive: true,
                        });
                        if (!ok) return;
                        await reviewsApi.delete(r.reviewId);
                        await load();
                      }}
                      className='px-2.5 py-1 rounded-lg border border-red-200 text-xs text-red-600'
                    >
                      ลบ
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {editOpen ? (
        <div className='fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4'>
          <div className='w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-4 space-y-3'>
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
