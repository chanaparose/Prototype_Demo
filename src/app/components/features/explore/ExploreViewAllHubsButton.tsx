import { useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import type { HubScope } from '@/components/features/hub/hubRowShared';

export function ExploreViewAllHubsButton({
  scope,
  className,
}: {
  scope: HubScope;
  className?: string;
}) {
  const navigate = useNavigate();

  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={() => navigate(`/factory-ideas-hub?scope=${scope}`)}
      className={cn(
        'flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-purple/25 bg-white py-2.5 text-[13px] font-semibold text-brand-purple shadow-sm transition-colors hover:border-brand-purple/40 hover:bg-[var(--brand-lavender-chip)]',
        className,
      )}
    >
      ดูหมวดทั้งหมด
      <ArrowRight size={14} />
    </Button>
  );
}
