import React from 'react';
import { useNavigate } from 'react-router';
import { Heart, MessageCircle, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  mobileBottomNavCompactStyles,
  useMobileBottomNavHide,
} from '@/hooks/useMobileBottomNavHide';

type ShowcaseDetailMobileActionBarProps = {
  factoryId: string;
  liked: boolean;
  likeCount: number;
  canChat: boolean;
  starting: boolean;
  onToggleFavorite: () => void;
  onChat: () => void;
};

export function ShowcaseDetailMobileActionBar({
  factoryId,
  liked,
  likeCount,
  canChat,
  starting,
  onToggleFavorite,
  onChat,
}: ShowcaseDetailMobileActionBarProps) {
  const navigate = useNavigate();
  const compact = useMobileBottomNavHide();

  return (
    <nav
      className='lg:hidden fixed inset-x-3 z-50 flex h-12 items-stretch overflow-hidden rounded-[1.1rem] border border-white/80 bg-white/78 shadow-[0_8px_32px_rgba(46,34,82,0.12)] backdrop-blur-2xl transition-[transform,opacity] duration-300 ease-out'
      style={mobileBottomNavCompactStyles(compact)}
      aria-label='การดำเนินการสินค้า'
    >
      <Button
        variant='unstyled'
        type='button'
        onClick={() => navigate(`/factories/${factoryId}`)}
        className='flex w-[3.75rem] shrink-0 flex-col items-center justify-center gap-0.5 text-gray-600 active:bg-gray-50/80'
      >
        <Store className='h-4 w-4' />
        <span className='text-[9px] font-semibold leading-none text-slate-500'>โปรไฟล์</span>
      </Button>
      <div className='w-px self-stretch bg-violet-100/70' />
      <Button
        variant='unstyled'
        type='button'
        onClick={onToggleFavorite}
        className='flex w-[3.75rem] shrink-0 flex-col items-center justify-center gap-0.5 text-gray-600 active:bg-gray-50/80'
        aria-label='ถูกใจ'
      >
        <Heart
          className='h-4 w-4 shrink-0'
          style={liked ? { color: 'var(--status-danger)', fill: 'var(--status-danger)' } : {}}
        />
        <span className='text-[9px] font-semibold leading-none text-slate-500'>{likeCount}</span>
      </Button>
      <Button
        variant='unstyled'
        type='button'
        onClick={canChat ? onChat : () => navigate(`/factories/${factoryId}`)}
        disabled={starting}
        className='flex flex-1 items-center justify-center gap-1.5 text-[12px] font-semibold text-white disabled:opacity-70'
        style={{
          background: 'linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-orange) 100%)',
        }}
      >
        {starting ? (
          <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent' />
        ) : (
          <MessageCircle className='h-3.5 w-3.5' />
        )}
        {canChat ? 'แชทกับโรงงาน' : 'ดูโปรไฟล์โรงงาน'}
      </Button>
    </nav>
  );
}
