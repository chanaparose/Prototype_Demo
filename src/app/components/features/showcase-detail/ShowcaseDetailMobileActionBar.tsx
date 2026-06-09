import React from 'react';
import { useNavigate } from 'react-router';
import { Heart, MessageCircle, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  return (
    <nav
      className='lg:hidden fixed inset-x-3 z-50 flex items-stretch overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/78 shadow-[0_8px_32px_rgba(46,34,82,0.12)] backdrop-blur-2xl'
      style={{
        bottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
        height: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label='การดำเนินการสินค้า'
    >
      <Button
        variant='unstyled'
        type='button'
        onClick={() => navigate(`/factories/${factoryId}`)}
        className='flex w-[4.5rem] shrink-0 flex-col items-center justify-center gap-0.5 text-gray-600 active:bg-gray-50/80'
      >
        <Store className='h-5 w-5' />
        <span className='text-[9px] font-semibold leading-none text-slate-500'>โปรไฟล์</span>
      </Button>
      <div className='w-px self-stretch bg-violet-100/70' />
      <Button
        variant='unstyled'
        type='button'
        onClick={onToggleFavorite}
        className='flex w-[4.5rem] shrink-0 flex-col items-center justify-center gap-0.5 text-gray-600 active:bg-gray-50/80'
        aria-label='ถูกใจ'
      >
        <Heart
          className='h-5 w-5 shrink-0'
          style={liked ? { color: 'var(--status-danger)', fill: 'var(--status-danger)' } : {}}
        />
        <span className='text-[9px] font-semibold leading-none text-slate-500'>{likeCount}</span>
      </Button>
      <Button
        variant='unstyled'
        type='button'
        onClick={canChat ? onChat : () => navigate(`/factories/${factoryId}`)}
        disabled={starting}
        className='flex h-full min-h-[3.5rem] flex-1 items-center justify-center gap-2 text-[13px] font-bold text-white disabled:opacity-70'
        style={{
          background: 'linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-orange) 100%)',
        }}
      >
        {starting ? (
          <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
        ) : (
          <MessageCircle className='h-4 w-4' />
        )}
        {canChat ? 'แชทกับโรงงาน' : 'ดูโปรไฟล์โรงงาน'}
      </Button>
    </nav>
  );
}
