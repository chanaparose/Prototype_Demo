import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Star, MessageSquareReply, ChevronDown, ChevronUp, User } from 'lucide-react';
import { factoryReviewApi } from '@/services/api/factoryApi';
import type { IFactoryReview, IFactoryReviewSummary } from '@/services/api/types/admin.types';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import { factoryButtonClass, factoryCardClass, factoryBoxClass } from '@/pages/factory-portal/factoryUi';

const MONTHS_SHORT = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth() + 1]} ${d.getFullYear() + 543}`;
}

function StarRow({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className='flex items-center gap-0.5'>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={13}
          className={i < Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
        />
      ))}
    </span>
  );
}

function RatingBreakdown({ summary }: { summary: IFactoryReviewSummary }) {
  const total = summary.review_count || 1;
  return (
    <div className={factoryCardClass({ variant: 'section', className: 'flex flex-col sm:flex-row gap-6' })}>
      {/* avg score */}
      <div className='flex flex-col items-center justify-center gap-1 sm:w-32 shrink-0'>
        <p className='text-4xl font-bold text-slate-900'>{summary.average_rating.toFixed(1)}</p>
        <StarRow value={summary.average_rating} />
        <p className='text-xs text-slate-500'>{summary.review_count} รีวิว</p>
      </div>
      {/* bars */}
      <div className='flex-1 flex flex-col gap-1.5'>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = summary.rating_breakdown?.[String(star)] ?? 0;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={star} className='flex items-center gap-2'>
              <span className='w-4 text-right text-[11px] font-medium text-slate-500'>{star}</span>
              <Star size={11} className='text-amber-400 fill-amber-400 shrink-0' />
              <div className='flex-1 h-2 rounded-full bg-slate-100 overflow-hidden'>
                <div
                  className='h-full rounded-full bg-amber-400 transition-all'
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className='w-6 text-[11px] text-slate-400'>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  onReplySubmit,
}: {
  review: IFactoryReview;
  onReplySubmit: (id: number, reply: string) => Promise<void>;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState(review.factory_reply ?? '');
  const [submitting, setSubmitting] = useState(false);
  const hasReply = !!review.factory_reply;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReplySubmit(review.review_id, replyText.trim());
      setShowReply(false);
      toast.success('บันทึกการตอบกลับแล้ว');
    } catch {
      toast.error('ไม่สามารถบันทึกได้ กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={factoryCardClass({ variant: 'section', className: 'flex flex-col gap-3' })}>
      {/* reviewer row */}
      <div className='flex items-start gap-3'>
        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500'>
          <User size={16} />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-sm font-semibold text-slate-800'>
              {review.reviewer_name || 'ลูกค้า'}
            </p>
            <StarRow value={review.rating} />
            <span className='text-[11px] text-slate-400'>{formatDate(review.created_at)}</span>
          </div>
          {review.order_id && (
            <a
              href={`/factory/orders/${review.order_id}`}
              className='text-[11px] text-brand-purple hover:underline'
            >
              ออเดอร์ #{review.order_id}
            </a>
          )}
        </div>
      </div>

      {/* comment */}
      {review.comment && (
        <p className='text-sm text-slate-700 leading-relaxed pl-12'>{review.comment}</p>
      )}

      {/* existing reply */}
      {hasReply && !showReply && (
        <div className={factoryBoxClass({ variant: 'violet', className: 'ml-12 p-3' })}>
          <p className='mb-1 text-[11px] font-semibold text-brand-purple'>การตอบกลับของโรงงาน</p>
          <p className='text-sm text-slate-700 leading-relaxed'>{review.factory_reply}</p>
          {review.factory_reply_at && (
            <p className='mt-1 text-[10px] text-slate-400'>{formatDate(review.factory_reply_at)}</p>
          )}
        </div>
      )}

      {/* reply toggle / form */}
      <div className='pl-12'>
        {!showReply ? (
          <button
            type='button'
            onClick={() => setShowReply(true)}
            className={factoryButtonClass({ variant: 'ghostIcon', size: 'sm', className: 'gap-1.5 text-xs' })}
          >
            <MessageSquareReply size={13} />
            {hasReply ? 'แก้ไขการตอบกลับ' : 'ตอบกลับรีวิวนี้'}
          </button>
        ) : (
          <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder='พิมพ์การตอบกลับ...'
              className='w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-purple/50 focus:bg-white focus:outline-none resize-none'
              autoFocus
            />
            <div className='flex items-center justify-between gap-2'>
              <span className='text-[11px] text-slate-400'>{replyText.length}/1000</span>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => { setShowReply(false); setReplyText(review.factory_reply ?? ''); }}
                  className={factoryButtonClass({ variant: 'secondary', size: 'sm' })}
                >
                  ยกเลิก
                </button>
                <button
                  type='submit'
                  disabled={submitting || !replyText.trim()}
                  className={factoryButtonClass({ variant: 'primary', size: 'sm' })}
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

type FilterType = 'all' | 'replied' | 'pending' | '5' | '4' | '3' | '2' | '1';

export function FactoryReviewPage() {
  const [reviews, setReviews] = useState<IFactoryReview[]>([]);
  const [summary, setSummary] = useState<IFactoryReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    factoryReviewApi.list().then((res) => {
      setReviews(res.reviews ?? []);
      setSummary(res.summary ?? null);
    }).catch(() => {
      toast.error('ไม่สามารถโหลดรีวิวได้');
    }).finally(() => setLoading(false));
  }, []);

  async function handleReply(reviewId: number, reply: string) {
    const updated = await factoryReviewApi.reply(reviewId, reply);
    setReviews((prev) => prev.map((r) => r.review_id === reviewId ? { ...r, ...updated } : r));
  }

  const filtered = reviews.filter((r) => {
    if (filter === 'replied') return !!r.factory_reply;
    if (filter === 'pending') return !r.factory_reply;
    if (['1', '2', '3', '4', '5'].includes(filter)) return Math.round(r.rating) === Number(filter);
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.factory_reply).length;

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'pending', label: `รอตอบ${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { key: 'replied', label: 'ตอบแล้ว' },
    { key: '5', label: '★ 5' },
    { key: '4', label: '★ 4' },
    { key: '3', label: '★ 3' },
    { key: '2', label: '★ 2' },
    { key: '1', label: '★ 1' },
  ];

  return (
    <div className='flex flex-col gap-4'>
      <FactoryPageHeader
        title='รีวิวจากลูกค้า'
        subtitle='Factory / รีวิว'
        icon={Star}
        count={loading ? undefined : `${reviews.length}`}
        variant='minimal'
      />

      {loading ? (
        <div className='flex items-center justify-center py-16 text-slate-400 text-sm'>
          กำลังโหลด...
        </div>
      ) : reviews.length === 0 ? (
        <div className={factoryCardClass({ variant: 'empty' })}>
          <Star size={32} className='mx-auto mb-3 text-slate-300' />
          <p className='text-sm font-medium text-slate-500'>ยังไม่มีรีวิว</p>
          <p className='mt-1 text-xs text-slate-400'>รีวิวจากลูกค้าจะแสดงที่นี่หลังจากออเดอร์เสร็จสิ้น</p>
        </div>
      ) : (
        <>
          {summary && <RatingBreakdown summary={summary} />}

          {/* filter tabs */}
          <div className='flex flex-wrap gap-1.5'>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type='button'
                onClick={() => setFilter(f.key)}
                className={factoryButtonClass({
                  variant: filter === f.key ? 'primary' : 'secondary',
                  size: 'sm',
                  className: 'text-xs',
                })}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className={factoryCardClass({ variant: 'empty' })}>
              <p className='text-sm text-slate-500'>ไม่มีรีวิวในหมวดนี้</p>
            </div>
          ) : (
            <div className='flex flex-col gap-3'>
              {filtered.map((r) => (
                <ReviewCard key={r.review_id} review={r} onReplySubmit={handleReply} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
