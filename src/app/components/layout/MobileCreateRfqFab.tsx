import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { mobileFabBottomOffset } from '@/hooks/useMobileBottomNavHide';

type MobileCreateRfqFabProps = {
  /** Sync with Layout bottom nav scroll-hide */
  bottomNavHidden: boolean;
  /** `data-tour="fab"` on home for product tour */
  showTourAnchor?: boolean;
};

/**
 * Global mobile/tablet FAB — gradient style, offset above bottom nav (slides down when nav hides).
 */
export function MobileCreateRfqFab({
  bottomNavHidden,
  showTourAnchor = false,
}: MobileCreateRfqFabProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant='unstyled'
      type='button'
      aria-label='สร้างคำขอราคา'
      {...(showTourAnchor ? { 'data-tour': 'fab' as const } : {})}
      onClick={() => void navigate('/create-rfq')}
      className={cn(
        'lg:hidden fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full',
        'bg-[linear-gradient(135deg,#1A0F2E_0%,#4A267D_45%,var(--brand-purple)_100%)]',
        'shadow-[0_6px_20px_rgba(162,56,255,0.35)]',
        'transition-[bottom,transform] duration-300 ease-in-out active:scale-95',
      )}
      style={{ bottom: mobileFabBottomOffset(bottomNavHidden) }}
    >
      <Plus size={24} className='text-white' />
    </Button>
  );
}
