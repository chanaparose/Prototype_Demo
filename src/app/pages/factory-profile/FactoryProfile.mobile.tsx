import React, { useCallback } from 'react';
import { ArrowLeft, Package, Clock, CheckCircle2, Star, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  FactoryProfileHero,
  FactoryProfileTabContent,
  type TabId,
} from '../../components/features/factory-profile';
import type { useFactoryProfile } from '../../hooks/useFactoryProfile';
import { useData } from '../../contexts/DataContext';

type FactoryProfileState = ReturnType<typeof useFactoryProfile>;
type FactoryProfileMobileProps = { state: FactoryProfileState };

export function FactoryProfileMobile({ state }: FactoryProfileMobileProps) {
  const navigate = useNavigate();
  const data = useData();
  const { factory, profile, conversation, activeTab, setActiveTab, productItems, promotionItems, articleItems, reviews, startConversation, startingConversation } = state;

  const handleChat = useCallback(async () => {
    if (conversation) {
      navigate(`/messages/${conversation.id}`);
      return;
    }
    const customerId = data.currentUser?.id;
    if (!customerId) { navigate('/messages'); return; }
    const convId = await startConversation(customerId);
    navigate(convId ? `/messages/${convId}` : '/messages');
  }, [conversation, navigate, startConversation, data.currentUser]);

  if (!factory) {
    return (
      <div className="px-4 pt-5 pb-20 bg-gray-50 min-h-screen">
        <button
          type="button"
          onClick={() => navigate('/factory-ideas')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าแนะนำโรงงาน
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <p className="text-3xl mb-2">🏭</p>
          <p className="text-sm font-medium text-gray-500">ไม่พบข้อมูลโรงงาน</p>
        </div>
      </div>
    );
  }

  const statItems = [
    { icon: <Package size={14} className="text-violet-500" />, label: 'ขั้นต่ำ', value: factory.minOrder },
    { icon: <Clock size={14} className="text-violet-500" />,   label: 'Lead Time', value: factory.leadTime },
    { icon: <CheckCircle2 size={14} className="text-violet-500" />, label: 'งานสำเร็จ', value: `${factory.completedOrders}` },
    { icon: <Star size={14} className="text-amber-400 fill-amber-400" />, label: 'เรทติ้ง', value: `${factory.rating} (${factory.reviews})` },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Hero */}
      <FactoryProfileHero
        factory={factory}
        onBack={() => navigate('/factory-ideas')}
        onChat={handleChat}
        chatLoading={startingConversation}
      />

      <div className="px-4 pt-4 space-y-3">
        {/* ── Stats row ── */}
        <div className="grid grid-cols-4 gap-2">
          {statItems.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-2.5 text-center shadow-sm">
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-[11px] font-bold text-gray-900 leading-tight">{s.value}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Contact & info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <p className="text-[12px] font-bold text-gray-900">{factory.name}</p>
              {factory.verified && <ShieldCheck size={13} className="text-violet-500" />}
            </div>
            <span className="text-[10px] text-gray-400">{factory.specialization}</span>
          </div>

          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 text-[12px] text-gray-600">
              <MapPin size={13} className="text-gray-400 shrink-0" />
              <span>{factory.location}</span>
            </div>
            {profile?.address && (
              <div className="flex items-center gap-2 text-[12px] text-gray-600">
                <Mail size={13} className="text-gray-400 shrink-0" />
                <span className="truncate">{profile.address}</span>
              </div>
            )}
          </div>

          {/* Certifications */}
          {profile && (profile.certificates ?? []).length > 0 && (
            <div className="px-4 pb-3 pt-1 border-t border-gray-50">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                ใบรับรอง
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(profile.certificates ?? []).map((c) => (
                  <span key={c} className="px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100 text-[10px] font-semibold text-violet-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {factory.tags && factory.tags.length > 0 && (
            <div className="px-4 pb-3 border-t border-gray-50 pt-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                ความเชี่ยวชาญ
              </p>
              <div className="flex flex-wrap gap-1.5">
                {factory.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-gray-100 text-[10px] text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Tab content ── */}
        <FactoryProfileTabContent
          activeTab={activeTab}
          onTabChange={setActiveTab as (tab: TabId) => void}
          factoryId={factory.id}
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
  );
}