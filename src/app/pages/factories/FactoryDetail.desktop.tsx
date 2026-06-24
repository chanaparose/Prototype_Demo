import React, { useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Factory,
  ShieldCheck,
  MapPin,
  MessageCircle,
  Star,
} from 'lucide-react';
import {
  FactoryProfileTabContent,
  type TabId,
} from '@/components/features/factory-profile/FactoryProfileTabContent';
import { FactoryProfileInsights } from '@/components/features/factory-profile/FactoryProfileInsights';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import { getFactoryReviewsBrowsePath } from '@/components/features/reviews/reviewBrowseUtils';
import type { useFactoryProfile } from '@/components/features/factory/hooks/useFactoryProfile';
import { useStartChatWithFactory } from '@/hooks/useStartChatWithFactory';
import { useAuth } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';

type FactoryDetailState = ReturnType<typeof useFactoryProfile>;
type FactoryDetailDesktopProps = { state: FactoryDetailState };

export function FactoryDetailDesktop({ state }: FactoryDetailDesktopProps) {
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
      <div className='hidden min-h-[calc(100vh-4rem)] items-center justify-center bg-white lg:flex'>
        <span className='h-9 w-9 animate-spin rounded-full border-2 border-brand-purple border-t-transparent' />
      </div>
    );
  }

  if (!factory) {
    return (
      <div className='hidden min-h-[calc(100vh-4rem)] bg-white px-8 pb-20 pt-6 lg:block'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate('/')}
          className='mb-4 inline-flex items-center gap-1 text-[12px] font-medium text-brand-purple'
        >
          <ArrowLeft size={16} strokeWidth={2.25} /> กลับหน้าหลัก
        </Button>
        <div className='rounded-lg border border-dashed border-gray-100 bg-slate-50/80 p-12 text-center'>
          <Factory size={28} className='mx-auto mb-2 text-gray-300' strokeWidth={2.25} />
          <p className='text-[12px] text-gray-500'>ไม่พบข้อมูลโรงงาน</p>
        </div>
      </div>
    );
  }

  return (
    <div className='hidden min-h-[calc(100vh-4rem)] bg-white lg:flex lg:flex-col'>
      <div className='sticky top-0 z-20 flex items-center gap-3 border-b border-gray-100 bg-white/95 px-8 py-2.5 backdrop-blur-sm'>
        <Button
          variant='unstyled'
          type='button'
          onClick={handleBack}
          className='flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-slate-50'
          aria-label='ย้อนกลับ'
        >
          <ArrowLeft size={20} strokeWidth={2.25} />
        </Button>
        <p className='truncate text-[14px] font-bold text-brand-navy-ink'>{factory.name}</p>
        <div className='ml-auto'>
          {canChat ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => void handleChat()}
              disabled={starting}
              className='inline-flex items-center gap-1.5 rounded-full border border-gray-100 px-3 py-1.5 text-[12px] font-medium text-brand-purple transition-colors hover:border-brand-purple/25 hover:bg-brand-purple/5 disabled:opacity-60'
            >
              {starting ? (
                <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-purple border-t-transparent' />
              ) : (
                <MessageCircle size={14} strokeWidth={2.25} />
              )}
              แชทกับโรงงาน
            </Button>
          ) : null}
        </div>
      </div>

      <div className='flex flex-1 gap-4 overflow-auto px-8 py-5'>
        <aside className='w-64 shrink-0 space-y-2.5 xl:w-72'>
          <div className='overflow-hidden rounded-xl border border-gray-100 bg-white'>
            <div className='relative h-16 bg-gradient-to-br from-brand-purple/90 via-brand-purple/75 to-indigo-500/80'>
              <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15)_0%,transparent_60%)]' />
            </div>
            <div className='px-3 pb-4'>
              <div className='-mt-8 mb-2.5 flex items-end justify-between'>
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
              <h1 className='text-sm font-bold leading-snug text-[var(--brand-navy)]'>{factory.name}</h1>
              <div className='mt-1.5 flex flex-col gap-0.5'>
                 
                {address ? (
                  <span className='inline-flex items-start gap-1 text-[12px] text-gray-500'>
                    <MapPin size={11} className='mt-0.5 shrink-0 text-brand-purple/60' />
                    <span className='min-w-0'>{address}</span>
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
            layout='desktop'
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
            tags={factory.tags}
          />
        </aside>

        <main className='min-w-0 flex-1'>
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
              onProductClick={(id) => navigate(`/factory-ideas/products/${id}`)}
              onIdeaClick={(id) => navigate(`/factory-ideas/ideas/${id}`)}
              onViewAllReviews={() => navigate(getFactoryReviewsBrowsePath(factory.id))}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
