import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useProductDetailShowcase } from '@/hooks/useProductDetailShowcase';
import { useFactoryProfileQuery } from '@/domain/factory/queries/useFactoryProfileQuery';
import { useData } from '@/stores/useDataStore';
import { useShallow } from 'zustand/react/shallow';
import { ReviewsBrowseView } from '@/components/features/reviews/ReviewsBrowseView';
import {
  normalizeFactoryReview,
  normalizeShowcaseReview,
} from '@/components/features/reviews/reviewBrowseUtils';

export function ReviewsBrowsePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const { id: pathId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const isFactoryRoute = /\/factories\/[^/]+\/reviews$/.test(location.pathname);

  const productState = useProductDetailShowcase();
  const data = useData(
    useShallow((s) => ({
      factories: s.factories,
      factoryProfiles: s.factoryProfiles,
      factoryReviews: s.factoryReviews,
    })),
  );

  const factoryFallback = useMemo(
    () => data.factories.find((f) => String(f.id) === String(pathId)),
    [data.factories, pathId],
  );
  const profileFallback = useMemo(
    () => data.factoryProfiles.find((p) => String(p.factoryId) === String(pathId)),
    [data.factoryProfiles, pathId],
  );

  const factoryQuery = useFactoryProfileQuery(isFactoryRoute ? pathId : undefined, {
    factory: factoryFallback,
    profile: profileFallback,
  });

  const productReviews = useMemo(() => {
    if (isFactoryRoute) return [];
    const items = productState.reviews?.items ?? [];
    return items.map(normalizeShowcaseReview);
  }, [isFactoryRoute, productState.reviews?.items]);

  const factoryReviews = useMemo(() => {
    if (!isFactoryRoute) return [];
    const rows =
      factoryQuery.data?.reviews ??
      data.factoryReviews.filter((r) => String(r.factoryId) === String(pathId));
    return rows.map(normalizeFactoryReview);
  }, [data.factoryReviews, factoryQuery.data?.reviews, isFactoryRoute, pathId]);

  const reviews = isFactoryRoute ? factoryReviews : productReviews;

  const loading = isFactoryRoute
    ? factoryQuery.isLoading && reviews.length === 0
    : productState.loading && reviews.length === 0;

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center bg-white'>
        <span className='h-9 w-9 animate-spin rounded-full border-2 border-brand-purple border-t-transparent' />
      </div>
    );
  }

  return (
    <div className={isDesktop ? 'bg-[var(--brand-page)] px-6 py-6' : 'bg-white'}>
      <ReviewsBrowseView
        reviews={reviews}
        onBack={handleBack}
        isDesktop={isDesktop}
      />
    </div>
  );
}
