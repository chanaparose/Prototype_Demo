import React, { useCallback } from 'react';
import {
  ArrowLeft,
  Factory,
  ShieldCheck,
  MapPin,
  MessageCircle,
  ImageIcon,
  Star,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { APP_PAGE_TITLE_CLASS } from '@lib/appTypography';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import { FactoryProfileInsights } from '@/components/features/factory-profile/FactoryProfileInsights';
import {
  FactoryProfileTabContent,
  type TabId,
} from '@/components/features/factory-profile/FactoryProfileTabContent';
import { getFactoryReviewsBrowsePath } from '@/components/features/reviews/reviewBrowseUtils';
import type { useFactoryProfile } from '@/components/features/factory/hooks/useFactoryProfile';
import { useStartChatWithFactory } from '@/hooks/useStartChatWithFactory';
import { useAuth } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';

type FactoryDetailState = ReturnType<typeof useFactoryProfile>;
type FactoryDetailMobileProps = { state: FactoryDetailState };

export function FactoryDetailMobile({ state }: FactoryDetailMobileProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startChat, starting } = useStartChatWithFactory();
  const {
    factory,
    profile,
    activeTab,
    setActiveTab,
    productItems,
    materialItems,
    articleItems,
    reviews,
    detailLoading,
    factoryCategoryNames,
    factorySubCategoryNames,
    factorySubCategoryPairs,
    apiCertificates,
  } = state;

  const handleBack = useCallback(() => navigate(-1), [navigate]);
  const isSelfFactory = String(user?.id ?? '') === String(factory?.id ?? '');
  const canChat = !isSelfFactory && String(factory?.id ?? '').trim() !== '';
  const handleChat = useCallback(async () => {
    if (!factory) return;
    await startChat(factory.id);
  }, [factory, startChat]);

  const address = String(profile?.address ?? factory?.location ?? '').trim();
  const description = String(profile?.description ?? '').trim();

  /* ── Loading ── */
  if (detailLoading && !factory) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[var(--brand-page)]'>
        <span className='h-9 w-9 animate-spin rounded-full border-2 border-violet-500 border-t-transparent' />
      </div>
    );
  }

  /* ── Not found ── */
  if (!factory) {
    return (
      <div className='min-h-screen bg-[var(--brand-page)] px-4 pb-20 pt-5'>
        <Button variant='unstyled' type='button' onClick={() => navigate('/')}
          className='mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600'>
          <ArrowLeft className='h-4 w-4' /> กลับหน้าหลัก
        </Button>
        <div className='rounded-2xl border border-gray-200 bg-white p-8 text-center'>
          <Factory size={30} className='mx-auto mb-2 text-gray-300' />
          <p className='text-sm font-medium text-gray-400'>ไม่พบข้อมูลโรงงาน</p>
        </div>
      </div>
    );
  }


  return (
    <div className='min-h-screen bg-[var(--brand-page)] pb-10'>
      {/* ── Top nav bar ── */}
      <div className='sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-white/60 bg-[var(--brand-page)]/90 px-4 py-2.5 backdrop-blur-sm'>
        <Button variant='unstyled' type='button' onClick={handleBack}
          className='flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm'>
          <ArrowLeft className='h-4 w-4 text-gray-700' />
        </Button>
        <p className='flex-1 truncate text-center text-[13px] font-semibold text-[var(--brand-navy)]'>
          {factory.name}
        </p>
        {canChat ? (
          <Button variant='unstyled' type='button' onClick={() => void handleChat()} disabled={starting}
            className='flex h-9 w-9 items-center justify-center rounded-xl border border-violet-200 bg-white shadow-sm disabled:opacity-60'>
            {starting
              ? <span className='h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent' />
              : <MessageCircle className='h-4 w-4 text-violet-600' />}
          </Button>
        ) : <div className='h-9 w-9' />}
      </div>

      <div className='px-4 pt-4 space-y-3'>
        {/* ── Hero card ── */}
        <div className='rounded-2xl border border-white/80 bg-white shadow-sm overflow-hidden'>
          {/* Cover gradient */}
          <div className='h-[80px] w-full bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 relative'>
            <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18)_0%,transparent_60%)]' />
          </div>

          <div className='px-4 pb-4'>
            {/* Avatar row */}
            <div className='flex items-end justify-between -mt-10 mb-3'>
              <div className='relative'>
                <div className='h-20 w-20 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-violet-50'>
                  {factory.image
                    ? <ImageWithFallback src={factory.image} alt={factory.name} className='h-full w-full object-cover' />
                    : <div className='flex h-full w-full flex-col items-center justify-center'>
                        <ImageIcon size={24} className='text-violet-300' strokeWidth={1.5} />
                      </div>}
                </div>
                {factory.verified && (
                  <div className='absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 shadow-sm'>
                    <ShieldCheck size={11} className='text-white' />
                  </div>
                )}
              </div>
              {factory.verified && (
                <StatusBadge variant='success' icon={<ShieldCheck size={11} />} size='sm'>
                  ยืนยันแล้ว
                </StatusBadge>
              )}
            </div>

            {/* Name + rating */}
            <h1 className={APP_PAGE_TITLE_CLASS}>{factory.name}</h1>
            <div className='mt-1 flex flex-wrap items-center gap-2'>
              <span className='inline-flex items-center gap-1 text-[12px] text-gray-500'>
                <Star className='h-3 w-3 fill-amber-400 text-amber-400' />
                {factory.rating} ({factory.reviews} รีวิว)
              </span>
              {address ? (
                <span className='inline-flex items-center gap-1 text-[12px] text-gray-500'>
                  <MapPin size={11} className='text-violet-400' />
                  {address}
                </span>
              ) : null}
            </div>

            {/* Description */}
            {description ? (
              <p className='mt-3 text-[13px] leading-relaxed text-gray-600 border-t border-gray-100 pt-3'>
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <FactoryProfileInsights
          layout='mobile'
          minOrder={factory.minOrder}
          leadTime={factory.leadTime}
          completedOrders={factory.completedOrders}
          rating={factory.rating}
          reviews={factory.reviews}
          factoryCategoryNames={factoryCategoryNames}
          factorySubCategoryNames={factorySubCategoryNames}
          factorySubCategoryPairs={factorySubCategoryPairs}
          profileCertificates={profile?.certificates}
          apiCertificates={apiCertificates}
        />

        {/* ── Tab content (showcases + reviews) ── */}
        <div className='rounded-2xl border border-white/80 bg-white shadow-sm'>
          <FactoryProfileTabContent
            activeTab={activeTab}
            onTabChange={setActiveTab as (tab: TabId) => void}
            factoryId={factory.id}
            productItems={productItems}
            materialItems={materialItems}
            articleShowcases={articleItems.showcaseIdeas}
            factory={{
              name: factory.name,
              location: factory.location,
              specialization: factory.specialization,
              minOrder: factory.minOrder,
              leadTime: factory.leadTime,
              completedOrders: factory.completedOrders,
              rating: factory.rating,
              reviews: factory.reviews,
            }}
            reviews={reviews}
            onProductClick={(itemId) => navigate(`/factory-ideas/products/${itemId}`)}
            onIdeaClick={(itemId) => navigate(`/factory-ideas/ideas/${itemId}`)}
            onViewAllReviews={() => navigate(getFactoryReviewsBrowsePath(factory.id))}
          />
        </div>
      </div>
    </div>
  );
}
