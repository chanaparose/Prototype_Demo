import { AnimatedOutlet } from '@/components/layout/AnimatedOutlet';

export function FactoryPortalLayout() {
  return (
    <div className='min-h-[calc(100vh-4rem)] bg-[var(--brand-page)] w-full min-w-0'>
      <div className='w-full max-w-[1600px] mx-auto px-5 sm:px-5 md:px-6 lg:px-8 2xl:px-10 pt-4 sm:pt-5 lg:pt-6 pb-[max(2rem,env(safe-area-inset-bottom,0px))] space-y-4'>
        <AnimatedOutlet />
      </div>
    </div>
  );
}
