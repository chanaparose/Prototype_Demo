import React from 'react';
import { useNavigate } from 'react-router';
import { MapPin, Mail, Phone, ArrowLeft } from 'lucide-react';
import {
  FactoryProfileHero,
  FactoryProfileStats,
  FactoryProfileTabContent,
  type TabId,
} from '../../components/features/factory-profile';
import { ImageWithFallback } from '../../components/shared';
import type { useFactoryProfile } from '../../hooks/useFactoryProfile';

type FactoryProfileState = ReturnType<typeof useFactoryProfile>;

type FactoryProfileDesktopProps = {
  state: FactoryProfileState;
};

export function FactoryProfileDesktop({ state }: FactoryProfileDesktopProps) {
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
      <div className="hidden lg:block px-10 pt-10 pb-20">
        <button
          type="button"
          onClick={() => navigate('/factory-ideas')}
          className="mb-4 inline-flex items-center gap-1 text-sm text-purple-600"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าแนะนำโรงงาน
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500 shadow-sm">
          ไม่พบข้อมูลโรงงาน
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Hero section full width */}
      <div className="shadow-sm">
        <FactoryProfileHero
          factory={factory}
          onBack={() => navigate('/factory-ideas')}
          onChat={() =>
            navigate(conversation ? `/messages/${conversation.id}` : '/messages')
          }
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex px-10 py-6 gap-6">
        {/* Left: profile summary & contact */}
        <aside className="w-80 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100">
                <ImageWithFallback
                  src={factory.image}
                  alt={factory.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {factory.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {factory.specialization}
                </p>
              </div>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <MapPin size={11} className="text-slate-400" />
                <span>{factory.location}</span>
              </div>
              {profile && (
                <>
                  <div className="flex items-center gap-1.5">
                    <Mail size={11} className="text-slate-400" />
                    <span className="truncate">{profile.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone size={11} className="text-slate-400" />
                    <span>{profile.contactPhone}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <FactoryProfileStats
              minOrder={factory.minOrder}
              leadTime={factory.leadTime}
              completedOrders={factory.completedOrders}
            />
          </div>

          {profile && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-[11px] text-slate-600 space-y-1.5">
              <p className="text-xs font-semibold text-slate-800 mb-1.5">
                ใบรับรองและมาตรฐาน
              </p>
              {(profile.certifications ?? []).map((c) => (
                <div key={c} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Right: Tab content */}
        <main className="flex-1 min-w-0">
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
        </main>
      </div>
    </div>
  );
}

