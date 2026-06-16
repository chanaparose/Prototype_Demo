import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { getFactoryIdeasHubPath } from '@/components/features/factory-ideas/factoryIdeasHubNav';

type FactoryIdeasHubBackButtonProps = {
  hubScope?: 'PD' | 'MT';
  className?: string;
  label?: string;
};

export function FactoryIdeasHubBackButton({
  hubScope,
  className,
  label = 'หมวดหมู่',
}: FactoryIdeasHubBackButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={() => navigate(getFactoryIdeasHubPath(hubScope))}
      className={cn(
        '-ml-1 mb-2 inline-flex items-center gap-1 rounded-lg px-1 py-1 text-[12px] font-medium text-gray-500 transition-colors hover:text-brand-purple',
        className,
      )}
    >
      <ArrowLeft size={16} strokeWidth={2.25} aria-hidden />
      {label}
    </Button>
  );
}
