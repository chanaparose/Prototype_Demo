import React from 'react';
import { useNavigate } from 'react-router';
import { Heart, MessageCircle, Store } from 'lucide-react';
import { SHOWCASE_DETAIL_BRAND as BRAND } from '@/components/features/showcase-detail/showcaseDetailShared';
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
      className='lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t bg-white/95 backdrop-blur-md shadow-[0_-4px_14px_rgba(46,34,82,0.08)]'
      style={{
        borderColor: BRAND.border,
        height: 'calc(3.625rem + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label='การดำเนินการสินค้า'
    >
      <Button
        variant='unstyled'
        type='button'
        onClick={() => navigate(`/factories/${factoryId}`)}
        className='w-[72px] flex h-[3.625rem] flex-col items-center justify-center gap-0.5 text-gray-600 active:bg-gray-50'
      >
        <Store className='w-5 h-5' />
        <span className='text-[12px] leading-none'>โปรไฟล์</span>
      </Button>
      <div className='w-px bg-violet-100/70' />
      <Button
        variant='unstyled'
        type='button'
        onClick={onToggleFavorite}
        className='w-[72px] flex h-[3.625rem] flex-col items-center justify-center gap-0.5 text-gray-600 active:bg-gray-50'
        aria-label='ถูกใจ'
      >
        <Heart
          className='w-5 h-5 shrink-0'
          style={liked ? { color: 'var(--status-danger)', fill: 'var(--status-danger)' } : {}}
        />
        <span className='text-[12px] leading-none text-gray-500'>{likeCount}</span>
      </Button>
      <Button
        variant='unstyled'
        type='button'
        onClick={canChat ? onChat : () => navigate(`/factories/${factoryId}`)}
        disabled={starting}
        className='flex h-[3.625rem] flex-1 items-center justify-center gap-2 text-[14px] font-bold text-white disabled:opacity-70'
        style={{
          background: 'linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-orange) 100%)',
        }}
      >
        {starting ? (
          <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
        ) : (
          <MessageCircle className='w-4 h-4' />
        )}
        {canChat ? 'แชทกับโรงงาน' : 'ดูโปรไฟล์โรงงาน'}
      </Button>
    </nav>
  );
}
