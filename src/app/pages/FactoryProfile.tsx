import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import {
  conversations,
  factories,
  factoryProfiles,
  factoryReviews,
  factoryShowcases,
  ideaArticles,
} from '../data/mockData';
import {
  FactoryProfileHero,
  FactoryProfileStats,
  FactoryProfileTabContent,
} from '../components/features/factory-profile';
import type { TabId } from '../components/features/factory-profile';

export function FactoryProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabId>('products');

  const factory = factories.find((f) => f.id === id);
  const profile = factoryProfiles.find((p) => p.factoryId === id);
  const conversation = conversations.find((c) => c.factoryId === id);

  const productItems = useMemo(
    () =>
      factoryShowcases.filter(
        (item) => item.factoryId === id && item.contentType === 'product'
      ),
    [id]
  );
  const promotionItems = useMemo(
    () =>
      factoryShowcases.filter(
        (item) => item.factoryId === id && item.contentType === 'promotion'
      ),
    [id]
  );
  const articleItems = useMemo(() => {
    const showcaseIdeas = factoryShowcases.filter(
      (item) => item.factoryId === id && item.contentType === 'idea'
    );
    const ideas = ideaArticles.filter((item) => item.factoryId === id);
    return { showcaseIdeas, ideas };
  }, [id]);
  const reviews = useMemo(
    () => factoryReviews.filter((r) => r.factoryId === id),
    [id]
  );

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

      <div className="px-4 pt-4 space-y-3">
        <FactoryProfileStats
          minOrder={factory.minOrder}
          leadTime={factory.leadTime}
          completedOrders={factory.completedOrders}
        />
        <FactoryProfileTabContent
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
