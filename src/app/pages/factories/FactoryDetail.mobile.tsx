import React, { useCallback } from 'react';
import {
  ArrowLeft,
  Factory,
  ShieldCheck,
  MapPin,
  MessageCircle,
  Star,
} from 'lucide-react';
import { useNavigate } from 'react-router';
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

  if (detailLoading && !factory) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white'>
        <span className='h-8 w-8 animate-spin rounded-full border-2 border-brand-purple border-t-transparent' />
      </div>
    );
  }

  if (!factory) {
    return (
      <div className='min-h-screen bg-white px-4 pb-20 pt-3'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate('/')}
          className='mb-3 inline-flex items-center gap-1 text-[12px] font-medium text-brand-purple'
        >
          <ArrowLeft size={16} strokeWidth={2.25} /> กลับหน้าหลัก
        </Button>
        <div className='rounded-lg border border-dashed border-gray-100 bg-slate-50/80 p-8 text-center'>
          <Factory size={24} className='mx-auto mb-2 text-gray-300' strokeWidth={2.25} />
          <p className='text-[12px] text-gray-500'>ไม่พบข้อมูลโรงงาน</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white pb-10'>
      <div className='sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-gray-100 bg-white/95 px-4 py-2 backdrop-blur-sm'>
        <Button
          variant='unstyled'
          type='button'
          onClick={handleBack}
          className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-slate-50'
          aria-label='ย้อนกลับ'
        >
          <ArrowLeft size={20} strokeWidth={2.25} />
        </Button>
         
        {canChat ? (
          <Button
            variant='unstyled'
            type='button'
            onClick={() => void handleChat()}
            disabled={starting}
            className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-100 text-brand-purple transition-colors hover:border-brand-purple/25 hover:bg-brand-purple/5 disabled:opacity-60'
            aria-label='แชทกับโรงงาน'
          >
            {starting ? (
              <span className='h-4 w-4 animate-spin rounded-full border-2 border-brand-purple border-t-transparent' />
            ) : (
              <MessageCircle size={18} strokeWidth={2.25} />
            )}
          </Button>
        ) : (
          <div className='h-9 w-9 shrink-0' aria-hidden />
        )}
      </div>

      <div className='space-y-2.5 px-4 pt-3'>
        <div className='overflow-hidden rounded-xl border border-gray-100 bg-white'>
          <div className='relative h-14 bg-gradient-to-r from-brand-purple/90 via-brand-purple/75 to-indigo-500/80'>
            <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15)_0%,transparent_60%)]' />
          </div>

          <div className='px-3 pb-3'>
            <div className='mb-2.5 flex items-end justify-between -mt-8'>
              <div className='relative'>
                <div className='h-16 w-16 overflow-hidden rounded-lg border-2 border-white bg-gray-100 shadow-sm'>
                  <ImageWithFallback
                    src={factory.image}
                    alt={factory.name}
                    className='h-full w-full object-cover'
                  />
                </div>
                 
              </div>
              {factory.verified ? (
                <StatusBadge variant='success' icon={<ShieldCheck size={10} />} size='sm'>
                  ยืนยันแล้ว
                </StatusBadge>
              ) : null}
            </div>

            <h1 className='text-[14px] font-bold leading-tight text-brand-navy-ink'>{factory.name}</h1>
            <div className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5'>
               
              {address ? (
                <span className='inline-flex min-w-0 items-center gap-0.5 text-[12px] text-gray-500'>
                  <MapPin size={11} className='shrink-0 text-brand-purple/60' />
                  <span className='truncate'>{address}</span>
                </span>
              ) : null}
            </div>

            {description ? (
              <p className='mt-2.5 border-t border-gray-100 pt-2.5 text-[12px] leading-relaxed text-gray-600'>
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

        <div className='overflow-hidden rounded-xl border border-gray-100 bg-white'>
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
