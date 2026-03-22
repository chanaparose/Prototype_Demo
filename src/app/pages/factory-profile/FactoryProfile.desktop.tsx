import React from 'react';
import { useNavigate } from 'react-router';
import {
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
  Star,
  Package,
  Clock,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  FactoryProfileHero,
  FactoryProfileTabContent,
  type TabId,
} from '../../components/features/factory-profile';
import { ImageWithFallback } from '../../components/shared';
import type { useFactoryProfile } from '../../hooks/useFactoryProfile';

type FactoryProfileState = ReturnType<typeof useFactoryProfile>;
type FactoryProfileDesktopProps = { state: FactoryProfileState };

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
      <div className="hidden lg:block px-8 pt-8 pb-20 bg-gray-50 min-h-[calc(100vh-4rem)]">
        <button
          type="button"
          onClick={() => navigate('/factory-ideas')}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-purple-600 hover:text-purple-800 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าแนะนำโรงงาน
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <p className="text-4xl mb-3">🏭</p>
          <p className="text-[14px] text-gray-500 font-medium">ไม่พบข้อมูลโรงงาน</p>
        </div>
      </div>
    );
  }

  const statItems = [
    { icon: <Package size={14} className="text-purple-500" />, label: 'MOQ', value: factory.minOrder },
    { icon: <Clock size={14} className="text-purple-500" />, label: 'Lead Time', value: factory.leadTime },
    { icon: <CheckCircle2 size={14} className="text-purple-500" />, label: 'งานสำเร็จ', value: `${factory.completedOrders} ออเดอร์` },
    { icon: <Star size={14} className="text-amber-400 fill-amber-400" />, label: 'เรทติ้ง', value: `${factory.rating} (${factory.reviews})` },
  ];

  return (
    <div className="hidden lg:flex flex-col min-h-[calc(100vh-4rem)] bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-white shadow-sm">
        <FactoryProfileHero
          factory={factory}
          onBack={() => navigate('/factory-ideas')}
          onChat={() => navigate(conversation ? `/messages/${conversation.id}` : '/messages')}
        />
      </div>

      {/* ── Info strip ── */}
      <div className="bg-white border-b border-gray-100 px-8 py-4">
        <div className="flex items-center gap-6 flex-wrap">

          {/* Factory thumb + name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 shrink-0">
              <ImageWithFallback
                src={factory.image}
                alt={factory.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-bold text-gray-900">{factory.name}</p>
                {factory.verified && <ShieldCheck size={13} className="text-purple-500" />}
              </div>
              <p className="text-[11px] text-gray-400">{factory.specialization}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-100 shrink-0" />

          {/* Contact */}
          <div className="flex items-center gap-4 text-[12px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-gray-400" />
              {factory.location}
            </span>
            {profile && (
              <>
                <span className="flex items-center gap-1.5">
                  <Mail size={12} className="text-gray-400" />
                  ติดต่อผ่านแชท
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={12} className="text-gray-400" />
                  -
                </span>
              </>
            )}
          </div>

          <div className="w-px h-8 bg-gray-100 shrink-0" />

          {/* Stats inline */}
          <div className="flex items-center gap-5">
            {statItems.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                {s.icon}
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">{s.label}</p>
                  <p className="text-[12px] font-bold text-gray-800 leading-none">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Certifications */}
          {profile && (profile.certificates ?? []).length > 0 && (
            <>
              <div className="w-px h-8 bg-gray-100 shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                {(profile.certificates ?? []).map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-100"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Tags */}
          {factory.tags && factory.tags.length > 0 && (
            <>
              <div className="w-px h-8 bg-gray-100 shrink-0" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {factory.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[11px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Tab content (full width) ── */}
      <div className="flex-1 px-8 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
            onPromotionClick={(itemId) => navigate(`/factory-ideas/promotions/${itemId}`)}
            onIdeaClick={(itemId) => navigate(`/factory-ideas/ideas/${itemId}`)}
          />
        </div>
      </div>
    </div>
  );
}