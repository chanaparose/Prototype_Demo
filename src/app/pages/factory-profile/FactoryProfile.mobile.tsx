import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  FactoryProfileHero,
  FactoryProfileStats,
  FactoryProfileTabContent,
  type TabId,
} from '../../components/features/factory-profile';
import type { useFactoryProfile } from '../../hooks/useFactoryProfile';

type FactoryProfileState = ReturnType<typeof useFactoryProfile>;

type FactoryProfileMobileProps = {
  state: FactoryProfileState;
};

export function FactoryProfileMobile({ state }: FactoryProfileMobileProps) {
  const navigate = useNavigate();
  const {
    factory,
    profile,
    conversation,
    activeTab,
    setActiveTab,
    productItems,
    promotionItems,
    articleItems,
    reviews,
  } = state;

  if (!factory) {
    return (
      <div className="px-4 pt-5 pb-20">
        <button
          type="button"
          onClick={() => navigate('/factory-ideas')}
          className="mb-4 inline-flex items-center gap-1 text-sm text-purple-600"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าแนะนำโรงงาน
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-500 shadow-sm">
          ไม่พบข้อมูลโรงงาน
        </div>
      </div>
    );
  }

  return (
    <div>
      <FactoryProfileHero
        factory={factory}
        onBack={() => navigate('/factory-ideas')}
        onChat={() =>
          navigate(conversation ? `/messages/${conversation.id}` : '/messages')
        }
      />

      <div className="px-4 pt-4 space-y-3 pb-6">
        <FactoryProfileStats
          minOrder={factory.minOrder}
          leadTime={factory.leadTime}
          completedOrders={factory.completedOrders}
        />
        <FactoryProfileTabContent
          activeTab={activeTab}
          onTabChange={setActiveTab as (tab: TabId) => void}
          productItems={productItems}
          promotionItems={promotionItems}
          articleIdeas={articleItems.ideas}
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
          onProductClick={(itemId) => navigate(`/factory-ideas/products/${itemId}`)}
          onPromotionClick={(itemId) =>
            navigate(`/factory-ideas/promotions/${itemId}`)
          }
          onIdeaClick={(itemId) => navigate(`/factory-ideas/ideas/${itemId}`)}
        />
      </div>
    </div>
  );
}

