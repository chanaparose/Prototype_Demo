import React, { useCallback } from 'react';
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
import { useStartChatWithFactory } from '../../hooks/useStartChatWithFactory';
import { useAuth } from '../../contexts/AuthContext';

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
    promotionItems,
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

  if (detailLoading && !factory) {
    return (
      <div className="hidden min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 pb-20 lg:flex">
        <span
          className="h-10 w-10 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"
          aria-hidden
        />
      </div>
    );
  }

  if (!factory) {
    return (
      <div className="hidden min-h-[calc(100vh-4rem)] bg-gray-50 px-8 pb-20 pt-8 lg:block">
        <button
          type="button"
          onClick={() => navigate('/explore')}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-purple-600 transition-colors hover:text-purple-800"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าหลัก
        </button>
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="mb-3 text-4xl">🏭</p>
          <p className="text-[14px] font-medium text-gray-500">ไม่พบข้อมูลโรงงาน</p>
        </div>
      </div>
    );
  }

  const statItems = [
    { icon: <Package size={14} className="text-purple-500" />, label: 'MOQ', value: factory.minOrder },
    { icon: <Clock size={14} className="text-purple-500" />, label: 'Lead Time', value: factory.leadTime },
    {
      icon: <CheckCircle2 size={14} className="text-purple-500" />,
      label: 'งานสำเร็จ',
      value: `${factory.completedOrders} ออเดอร์`,
    },
    {
      icon: <Star size={14} className="fill-amber-400 text-amber-400" />,
      label: 'เรทติ้ง',
      value: `${factory.rating} (${factory.reviews})`,
    },
  ];

  return (
    <div className="hidden min-h-[calc(100vh-4rem)] flex-col bg-gray-50 lg:flex">
      <div className="bg-white shadow-sm">
        <FactoryProfileHero
          factory={factory}
          onBack={handleBack}
          onChat={handleChat}
          chatLoading={starting}
          showChat={canChat}
        />
      </div>

      <div className="border-b border-gray-100 bg-white px-8 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex shrink-0 items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-100">
              <ImageWithFallback
                src={factory.image}
                alt={factory.name}
                className="h-full w-full object-cover"
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

           

          <div className="h-8 w-px shrink-0 bg-gray-100" />

          <div className="flex items-center gap-5">
            {statItems.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                {s.icon}
                <div>
                  <p className="mb-0.5 text-[9px] font-normal uppercase leading-none tracking-wide text-gray-400">
                    {s.label}
                  </p>
                  <p className="text-[12px] font-bold leading-none text-gray-800">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {profile && (profile.certificates ?? []).length > 0 && (
            <>
              <div className="h-8 w-px shrink-0 bg-gray-100" />
              <div className="flex flex-wrap items-center gap-2">
                {(profile.certificates ?? []).map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </>
          )}

          {factory.tags && factory.tags.length > 0 && (
            <>
              <div className="h-8 w-px shrink-0 bg-gray-100" />
              <div className="flex flex-wrap items-center gap-1.5">
                {factory.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}

          {(factorySubCategoryPairs.length > 0 ||
            factoryCategoryNames.length > 0 ||
            factorySubCategoryNames.length > 0) && (
            <>
              <div className="h-8 w-px shrink-0 bg-gray-100" />
              <div className="flex flex-wrap items-center gap-2">
                {factorySubCategoryPairs.length > 0
                  ? factorySubCategoryPairs.map((p, i) => (
                      <span
                        key={`pair-${p.categoryLabel}-${p.subLabel}-${i}`}
                        className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800"
                      >
                        {p.categoryLabel} › {p.subLabel}
                      </span>
                    ))
                  : (
                    <>
                      {factoryCategoryNames.map((n) => (
                        <span
                          key={`cat-${n}`}
                          className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800"
                        >
                          {n}
                        </span>
                      ))}
                      {factorySubCategoryNames.map((n) => (
                        <span
                          key={`sub-${n}`}
                          className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-800"
                        >
                          {n}
                        </span>
                      ))}
                    </>
                  )}
              </div>
            </>
          )}

          {apiCertificates.length > 0 && (
            <>
              <div className="h-8 w-px shrink-0 bg-gray-100" />
              <div className="flex flex-wrap items-center gap-2">
                {apiCertificates.map((c, i) => (
                  <span
                    key={String(c.map_id ?? c.cert_id ?? c.id ?? i)}
                    className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800"
                  >
                    {String(c.cert_name ?? c.name_th ?? c.cert_number ?? 'ใบรับรอง')}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 px-8 py-6">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <FactoryProfileTabContent
            activeTab={activeTab}
            onTabChange={setActiveTab as (tab: TabId) => void}
            factoryId={factory.id}
            productItems={productItems}
            promotionItems={promotionItems}
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
    </div>
  );
}
