import React, { useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
  ChevronDown,
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

  return (
    <div className="hidden min-h-[calc(100vh-4rem)] flex-col bg-gray-50 lg:flex">
      <div className="px-8 pt-6">
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

          {groupedCategorySubs.length > 0 && (
            <>
              <div className="h-8 w-px shrink-0 bg-gray-100" />
              <div className="min-w-[280px] rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setShowCategorySubs((v) => !v)}
                  className="flex w-full items-center justify-between gap-2"
                >
                  <span className="text-[12px] font-semibold text-violet-800">หมวดหมู่ที่รับผลิต</span>
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-violet-700">
                    <span>{groupedCategorySubs.length} หมวดหลัก</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCategorySubs ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {showCategorySubs ? (
                  <div className="mt-2 space-y-1.5">
                    {groupedCategorySubs.map(([cat, subs]) => (
                      <div key={`cat-group-${cat}`} className="rounded-lg bg-white/80 px-2.5 py-2">
                        <p className="text-[11px] font-bold text-violet-900">{cat}</p>
                        <p className="mt-0.5 text-[11px] text-violet-700">
                          {subs.length > 0 ? subs.join(', ') : 'ไม่มีหมวดย่อย'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
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
    </div>
  );
}
