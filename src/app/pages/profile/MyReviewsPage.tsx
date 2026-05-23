import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useAppMutation } from '@/hooks/useAppMutation';
import { getErrorMessage } from '@/lib/apiError';

function reviewsQueryKey(role: string | undefined) {
  return ['profile', 'reviews', String(role ?? '').toUpperCase()] as const;
}

export function MyReviewsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const reviewsQuery = useQuery({
    queryKey: reviewsQueryKey(user?.role),
    queryFn: async () => {
      const role = String(user?.role ?? '').toUpperCase();
      const raw =
        role === 'FT'
          ? await profileApi.receivedReviews({ page: 1, limit: 20 })
          : await profileApi.myReviews({ page: 1, limit: 20 });
      return mapReviewItems(raw);
    },
    enabled: Boolean(user?.role),
  });

  const items = reviewsQuery.data ?? [];
  const loading = reviewsQuery.isLoading;

  const [editOpen, setEditOpen] = useState(false);
  const [editReviewId, setEditReviewId] = useState(0);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);

  const saveEditMutation = useAppMutation({
    mutationFn: async () => {
      const text = editComment.trim();
      if (!text) throw new Error('กรุณาเขียนรีวิว');
      if (!Number.isFinite(editRating) || editRating < 1 || editRating > 5) {
        throw new Error('กรุณาเลือกคะแนน 1 ถึง 5 ดาว');
      }
      await reviewsApi.update(editReviewId, {
        rating: editRating,
        comment: text,
        image_urls: normalizeReviewImageUrls(editImages),
      });
    },
    onSuccess: async () => {
      toast.success('บันทึกรีวิวแล้ว');
      setEditOpen(false);
      await qc.invalidateQueries({ queryKey: reviewsQueryKey(user?.role) });
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'บันทึกไม่สำเร็จ');
      const m = message.toLowerCase();
      if (m.includes('image_urls') && m.includes('5')) toast.error('แนบรูปได้ไม่เกิน 5 รูป');
      else toast.error(message);
    },
  });

  const deleteMutation = useAppMutation({
    mutationFn: (reviewId: number) => reviewsApi.delete(reviewId),
    onSuccess: async () => {
      toast.success('ลบรีวิวแล้ว');
      await qc.invalidateQueries({ queryKey: reviewsQueryKey(user?.role) });
    },
    onErrorMessage: (message) => toast.error(message),
    fallbackMessage: 'ลบไม่สำเร็จ',
  });

  const openEdit = (r: ReviewItem) => {
    setEditReviewId(r.reviewId);
    setEditRating(r.rating);
    setEditComment(r.comment);
    setEditImages([...r.imageUrls]);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    await saveEditMutation.mutateAsync();
  };

  const removeReview = async (reviewId: number) => {
    const ok = await confirm({
      title: 'ลบรีวิวนี้?',
      description: 'รีวิวจะถูกลบถาวร',
      confirmText: 'ลบรีวิว',
      destructive: true,
    });
    if (!ok) return;
    void deleteMutation.mutate(reviewId);
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
                <div className='flex gap-2 mt-2'>
                  <Button
                    variant='outline'
                    size='xs'
                    type='button'
                    onClick={() => openEdit(r)}
                  >
                    แก้ไข
                  </Button>
                  <Button
                    variant='outline'
                    size='xs'
                    type='button'
                    disabled={deleteMutation.isPending}
                    onClick={() => void removeReview(r.reviewId)}
                    className='text-red-600 border-red-200'
                  >
                    ลบ
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editOpen ? (
        <div className='fixed inset-0 z-[70] flex items-end sm:items-center justify-center'>
          <Button
            variant='unstyled'
            type='button'
            className='absolute inset-0 bg-black/40'
            onClick={() => setEditOpen(false)}
          />
          <div className='relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-4 space-y-3'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-bold'>แก้ไขรีวิว</p>
              <Button variant='unstyled' type='button' onClick={() => setEditOpen(false)}>
                <X size={18} />
              </Button>
            </div>
            <div className='flex gap-1'>
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  variant='unstyled'
                  type='button'
                  onClick={() => setEditRating(n)}
                  className='p-1'
                >
                  <Star
                    size={20}
                    className={n <= editRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                  />
                </Button>
              ))}
            </div>
            <Textarea
              className='w-full min-h-[100px] rounded-xl border border-slate-200 px-3 py-2 text-sm'
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
            />
            <ReviewImageAttachments urls={editImages} onChange={setEditImages} />
            <Button
              variant='unstyled'
              type='button'
              disabled={saveEditMutation.isPending}
              onClick={() => void saveEdit()}
              className='w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50'
            >
              {saveEditMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
