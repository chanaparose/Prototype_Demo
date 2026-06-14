import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  MoreVertical,
  Search,
  Share2,
  Store,
} from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { AppSheetDialog } from '@/components/ui/app-sheet-dialog';
import { useScrollPast } from '@/hooks/useMobileBottomNavHide';

type ShowcaseDetailMobileScrollHeaderProps = {
  title: string;
  onBack: () => void;
  onShare?: () => void;
  /** px scrolled before header slides in */
  revealAt?: number;
  liked?: boolean;
  likeCount?: number;
  onToggleFavorite?: () => void;
  factoryId?: string;
  canChat?: boolean;
  onChat?: () => void;
  chatStarting?: boolean;
  /** factory-ideas tab when tapping search pill */
  searchType?: 'product' | 'material' | 'idea';
};

export function ShowcaseDetailMobileScrollHeader({
  title,
  onBack,
  onShare,
  revealAt = 120,
  liked = false,
  likeCount = 0,
  onToggleFavorite,
  factoryId,
  canChat = false,
  onChat,
  chatStarting = false,
  searchType = 'product',
}: ShowcaseDetailMobileScrollHeaderProps) {
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const scrolledPast = useScrollPast(Math.max(0, revealAt));
  const visible = revealAt <= 0 || scrolledPast;

  const handleShare =
    onShare ??
    (() => {
      if (typeof navigator !== 'undefined' && navigator.share) {
        void navigator.share({ title, url: window.location.href });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        void navigator.clipboard.writeText(window.location.href);
      }
    });

  const likeBadge =
    likeCount > 99 ? '99+' : likeCount > 0 ? String(likeCount) : null;

  return (
    <>
      <header
        aria-hidden={!visible}
        className={cn(
          'fixed left-0 right-0 top-0 z-[60] border-b border-gray-100 bg-white shadow-sm transition-[transform,opacity] duration-200 lg:hidden',
          visible
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none',
        )}
      >
        <div className='flex h-14 items-center gap-1 px-2.5'>
          <Button
            variant='unstyled'
            type='button'
            onClick={onBack}
            className='flex h-10 w-9 shrink-0 items-center justify-center active:opacity-70'
            aria-label='กลับ'
          >
            <ArrowLeft className='h-[22px] w-[22px] text-brand-magenta' strokeWidth={2.25} />
          </Button>

          <button
            type='button'
            onClick={() =>
              navigate(`/factory-ideas?type=${searchType}`, { state: { searchText: title } })
            }
            className='flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-left active:bg-gray-200/80'
            aria-label={`ค้นหา ${title}`}
          >
            <Search className='h-4 w-4 shrink-0 text-gray-400' strokeWidth={2.25} />
            <span className='truncate text-[13px] text-gray-500'>{title}</span>
          </button>

          <Button
            variant='unstyled'
            type='button'
            onClick={handleShare}
            className='flex h-10 w-9 shrink-0 items-center justify-center active:opacity-70'
            aria-label='แชร์'
          >
            <Share2 className='h-[19px] w-[19px] text-brand-magenta' strokeWidth={2.25} />
          </Button>

          {onToggleFavorite ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={onToggleFavorite}
              className='relative flex h-10 w-9 shrink-0 items-center justify-center active:opacity-70'
              aria-label='ถูกใจ'
            >
              <Heart
                className='h-[19px] w-[19px]'
                strokeWidth={2.25}
                style={
                  liked
                    ? { color: 'var(--status-danger)', fill: 'var(--status-danger)' }
                    : { color: 'var(--brand-magenta)' }
                }
              />
              {likeBadge ? (
                <span className='absolute -right-0.5 top-1 min-w-[18px] rounded-full bg-[var(--status-danger)] px-1 py-px text-center text-[9px] font-bold leading-none text-white'>
                  {likeBadge}
                </span>
              ) : null}
            </Button>
          ) : null}

          <Button
            variant='unstyled'
            type='button'
            onClick={() => setMoreOpen(true)}
            className='flex h-10 w-9 shrink-0 items-center justify-center active:opacity-70'
            aria-label='เมนูเพิ่มเติม'
          >
            <MoreVertical className='h-[19px] w-[19px] text-brand-magenta' strokeWidth={2.25} />
          </Button>
        </div>
      </header>

      <AppSheetDialog
        open={moreOpen}
        onOpenChange={setMoreOpen}
        title='ตัวเลือกเพิ่มเติม'
        bodyClassName='p-0'
      >
        <ul className='divide-y divide-gray-100 pb-[max(0.5rem,env(safe-area-inset-bottom))]'>
          {factoryId ? (
            <li>
              <button
                type='button'
                onClick={() => {
                  setMoreOpen(false);
                  navigate(`/factories/${factoryId}`);
                }}
                className='flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-gray-800 active:bg-gray-50'
              >
                <Store className='h-4 w-4 shrink-0 text-brand-magenta' />
                ดูโปรไฟล์โรงงาน
              </button>
            </li>
          ) : null}
          {canChat && onChat ? (
            <li>
              <button
                type='button'
                disabled={chatStarting}
                onClick={() => {
                  setMoreOpen(false);
                  onChat();
                }}
                className='flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-gray-800 active:bg-gray-50 disabled:opacity-50'
              >
                <MessageCircle className='h-4 w-4 shrink-0 text-brand-magenta' />
                {chatStarting ? 'กำลังเปิดแชท…' : 'แชทกับโรงงาน'}
              </button>
            </li>
          ) : null}
          <li>
            <button
              type='button'
              onClick={() => {
                setMoreOpen(false);
                handleShare();
              }}
              className='flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-gray-800 active:bg-gray-50'
            >
              <Share2 className='h-4 w-4 shrink-0 text-brand-magenta' />
              แชร์ลิงก์
            </button>
          </li>
        </ul>
      </AppSheetDialog>
    </>
  );
}
