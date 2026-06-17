import { Link, useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '@lib/utils';
import type { HubScope } from '@/components/features/hub/hubRowShared';
import { HubScopeTabs } from '@/components/features/hub/HubScopeTabs';
import { HubSection } from '@/components/features/hub/HubSection';
import { HubSectionSkeleton } from '@/components/features/hub/HubSectionSkeleton';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { ExploreViewAllHubsButton } from '@/components/features/explore/ExploreViewAllHubsButton';

const MAX_HUB_PREVIEW = 2;

type ExploreHubPreviewProps = {
  activeScope: HubScope;
  onScopeChange: (scope: HubScope) => void;
  className?: string;
  sectionClassName?: string;
};

export function ExploreHubPreview({
  activeScope,
  onScopeChange,
  className,
  sectionClassName,
}: ExploreHubPreviewProps) {
  const navigate = useNavigate();
  const hubsQ = useLbiHubsQuery();
  const hubs = (hubsQ.data ?? []).filter((h) => h.scope === activeScope).slice(0, MAX_HUB_PREVIEW);
  const isLoading = hubsQ.isLoading;

  return (
    <div className={cn('space-y-3', className)} data-tour='categories'>
      <div className='flex items-center justify-between px-4 md:px-0'>
        <h3 className='text-[14px] font-bold text-brand-navy-ink'>หมวดหมู่</h3>
        <Link
          to={`/factory-ideas-hub?scope=${activeScope}`}
          className='flex items-center gap-0.5 text-[13px] text-brand-purple hover:underline'
        >
          ดูทั้งหมด <ChevronRight size={13} />
        </Link>
      </div>

      <HubScopeTabs
        activeScope={activeScope}
        onScopeChange={onScopeChange}
        className='rounded-xl overflow-hidden mx-4 md:mx-0'
      />

      <div className='space-y-3 px-4 md:px-0'>
        {isLoading ? (
          <>
            <HubSectionSkeleton />
            <HubSectionSkeleton />
          </>
        ) : null}

        {!isLoading && hubs.length === 0 ? (
          <div className='rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center'>
            <p className='text-sm text-gray-500'>ยังไม่มีหมวดในขอบเขตนี้</p>
          </div>
        ) : null}

        {!isLoading
          ? hubs.map((hub) => (
              <HubSection
                key={hub.hub_id}
                hub={hub}
                onNavigate={navigate}
                className={sectionClassName}
              />
            ))
          : null}

        {!isLoading && hubs.length > 0 ? (
          <ExploreViewAllHubsButton scope={activeScope} />
        ) : null}
      </div>
    </div>
  );
}
