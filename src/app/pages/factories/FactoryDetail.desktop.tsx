import React, { useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Factory,
  ShieldCheck,
  MapPin,
  MessageCircle,
  ImageIcon,
  Star,
} from 'lucide-react';
import {
  FactoryProfileTabContent,
  type TabId,
} from '@/components/features/factory-profile/FactoryProfileTabContent';
import { FactoryProfileInsights } from '@/components/features/factory-profile/FactoryProfileInsights';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
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

  /* ── Loading ── */
  if (detailLoading && !factory) {
    return (
      <div className='hidden min-h-[calc(100vh-4rem)] items-center justify-center bg-[var(--brand-page)] lg:flex'>
        <span className='h-10 w-10 animate-spin rounded-full border-2 border-violet-600 border-t-transparent' />
      </div>
    );
  }

  /* ── Not found ── */
  if (!factory) {
    return (
      <div className='hidden min-h-[calc(100vh-4rem)] bg-[var(--brand-page)] px-8 pb-20 pt-8 lg:block'>
        <Button variant='unstyled' type='button' onClick={() => navigate('/')}
          className='mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-violet-600'>
          <ArrowLeft className='h-4 w-4' /> กลับหน้าหลัก
        </Button>
        <div className='rounded-2xl border border-gray-200 bg-white p-12 text-center'>
          <Factory size={38} className='mx-auto mb-3 text-gray-300' />
          <p className='text-[14px] font-medium text-gray-400'>ไม่พบข้อมูลโรงงาน</p>
        </div>
      </div>
    );
  }


  return (
    <div className='hidden min-h-[calc(100vh-4rem)] bg-[var(--brand-page)] lg:flex lg:flex-col'>
      {/* ── Top nav bar ── */}
      <div className='sticky top-0 z-20 flex items-center gap-3 border-b border-white/60 bg-[var(--brand-page)]/90 px-8 py-3 backdrop-blur-sm'>
        <Button variant='unstyled' type='button' onClick={handleBack}
          className='flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50'>
          <ArrowLeft className='h-4 w-4 text-gray-700' />
        </Button>
        <p className='text-[14px] font-semibold text-[var(--brand-navy)]'>{factory.name}</p>
        <div className='ml-auto'>
          {canChat && (
            <Button variant='unstyled' type='button' onClick={() => void handleChat()} disabled={starting}
              className='inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2 text-[13px] font-medium text-violet-700 shadow-sm hover:bg-violet-50 disabled:opacity-60'>
              {starting
                ? <span className='h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent' />
                : <MessageCircle className='h-4 w-4' />}
              แชทกับโรงงาน
            </Button>
          )}
        </div>
      </div>

      <div className='flex flex-1 gap-5 px-8 py-6 overflow-auto'>
        {/* ── Left sidebar ── */}
        <aside className='w-72 shrink-0 space-y-4'>
          {/* Profile card */}
          <div className='rounded-2xl border border-white/80 bg-white shadow-sm overflow-hidden'>
            {/* Cover */}
            <div className='h-[90px] w-full bg-gradient-to-br from-violet-600 via-purple-500 to-indigo-500 relative'>
              <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2)_0%,transparent_60%)]' />
            </div>
            <div className='px-4 pb-5'>
              {/* Avatar */}
              <div className='-mt-10 mb-3 flex items-end justify-between'>
                <div className='relative'>
                  <div className='h-20 w-20 overflow-hidden rounded-2xl border-4 border-white shadow-md bg-violet-50'>
                    {factory.image
                      ? <ImageWithFallback src={factory.image} alt={factory.name} className='h-full w-full object-cover' />
                      : <div className='flex h-full w-full items-center justify-center'>
                          <ImageIcon size={26} className='text-violet-300' strokeWidth={1.5} />
                        </div>}
                  </div>
                  {factory.verified && (
                    <div className='absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 shadow'>
                      <ShieldCheck size={11} className='text-white' />
                    </div>
                  )}
                </div>
                {factory.verified && (
                  <StatusBadge variant='success' icon={<ShieldCheck size={10} />} size='sm'>
                    ยืนยันแล้ว
                  </StatusBadge>
                )}
              </div>
              <h1 className='text-[16px] font-bold leading-snug text-[var(--brand-navy)]'>{factory.name}</h1>
              <div className='mt-1.5 flex flex-col gap-1'>
                <span className='inline-flex items-center gap-1 text-[12px] text-gray-500'>
                  <Star className='h-3.5 w-3.5 fill-amber-400 text-amber-400' />
                  {factory.rating} · {factory.reviews} รีวิว
                </span>
                {address ? (
                  <span className='inline-flex items-center gap-1 text-[12px] text-gray-500'>
                    <MapPin size={12} className='text-violet-400' /> {address}
                  </span>
                ) : null}
              </div>
              {description ? (
                <p className='mt-3 border-t border-gray-100 pt-3 text-[12px] leading-relaxed text-gray-600'>
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

        {/* ── Main content area ── */}
        <main className='min-w-0 flex-1'>
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
              onProductClick={(id) => navigate(`/factory-ideas/products/${id}`)}
              onIdeaClick={(id) => navigate(`/factory-ideas/ideas/${id}`)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
