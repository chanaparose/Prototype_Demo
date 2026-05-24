import React, { useCallback } from 'react';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  Star,
  ShieldCheck,
  Mail,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { FactoryProfileHero } from '@/components/features/factory-profile/FactoryProfileHero';
import {
  FactoryProfileTabContent,
  type TabId,
} from '@/components/features/factory-profile/FactoryProfileTabContent';
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
    promotionItems,
    materialItems,
    articleItems,
    reviews,
    detailLoading,
    factoryCategoryNames,
    factorySubCategoryNames,
    factorySubCategoryPairs,
    apiCertificates,
  } = state;

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const isSelfFactory = String(user?.id ?? '') === String(factory?.id ?? '');
  const canChat = !isSelfFactory && String(factory?.id ?? '').trim() !== '';

  const handleChat = useCallback(async () => {
    if (!factory) return;
    await startChat(factory.id);
  }, [factory, startChat]);

  const [showCategorySubs, setShowCategorySubs] = React.useState(false);
  const groupedCategorySubs = React.useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of factorySubCategoryPairs) {
      const cat = String(p.categoryLabel ?? '').trim();
      const sub = String(p.subLabel ?? '').trim();
      if (!cat || !sub) continue;
      const prev = map.get(cat) ?? [];
      if (!prev.includes(sub)) prev.push(sub);
      map.set(cat, prev);
    }
    if (map.size === 0 && factoryCategoryNames.length > 0) {
      for (const c of factoryCategoryNames) map.set(c, []);
    }
    return Array.from(map.entries());
  }, [factorySubCategoryPairs, factoryCategoryNames]);

  if (detailLoading && !factory) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 pb-20'>
        <span
          className='h-9 w-9 animate-spin rounded-full border-2 border-violet-600 border-t-transparent'
          aria-hidden
        />
      </div>
    );
  }

  if (!factory) {
    return (
      <div className='min-h-screen bg-gray-50 px-4 pb-20 pt-5'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate('/explore')}
          className='mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600'
        >
          <ArrowLeft className='h-4 w-4' />
          กลับหน้าหลัก
        </Button>
        <div className='rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm'>
          <p className='mb-2 text-3xl'>🏭</p>
          <p className='text-sm font-medium text-gray-500'>ไม่พบข้อมูลโรงงาน</p>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      icon: <Package size={14} className='text-violet-500' />,
      label: 'ขั้นต่ำ',
      value: factory.minOrder,
    },
    {
      icon: <Clock size={14} className='text-violet-500' />,
      label: 'Lead Time',
      value: factory.leadTime,
    },
    {
      icon: <CheckCircle2 size={14} className='text-violet-500' />,
      label: 'งานสำเร็จ',
      value: `${factory.completedOrders}`,
    },
    {
      icon: <Star size={14} className='fill-amber-400 text-amber-400' />,
      label: 'เรทติ้ง',
      value: `${factory.rating} (${factory.reviews})`,
    },
  ];
  return (
    <div className='min-h-screen bg-gray-50 pb-10'>
      <div className='px-4 pt-4'>
        <FactoryProfileHero
          factory={factory}
          onBack={handleBack}
          onChat={handleChat}
          chatLoading={starting}
          showChat={canChat}
        />
      </div>

      <div className='space-y-3 px-4 pt-4'>
        <div className='grid grid-cols-4 gap-2'>
          {statItems.map((s) => (
            <div
              key={s.label}
              className='rounded-2xl border border-gray-100 bg-white p-2.5 text-center shadow-sm'
            >
              <div className='mb-1 flex justify-center'>{s.icon}</div>
              <p className='text-[11px] font-bold leading-tight text-gray-900'>{s.value}</p>
              <p className='mt-0.5 text-[9px] text-gray-400'>{s.label}</p>
            </div>
          ))}
        </div>

        <FactoryProfileTabContent
          activeTab={activeTab}
          onTabChange={setActiveTab as (tab: TabId) => void}
          factoryId={factory.id}
          productItems={productItems}
          promotionItems={promotionItems}
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
          profile={profile}
          reviews={reviews}
          factoryCategoryNames={factoryCategoryNames}
          factorySubCategoryNames={factorySubCategoryNames}
          factorySubCategoryPairs={factorySubCategoryPairs}
          apiCertificates={apiCertificates}
          onProductClick={(itemId) => navigate(`/factory-ideas/products/${itemId}`)}
          onPromotionClick={(itemId) => navigate(`/factory-ideas/promotions/${itemId}`)}
          onIdeaClick={(itemId) => navigate(`/factory-ideas/ideas/${itemId}`)}
        />
      </div>
    </div>
  );
}
