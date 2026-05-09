import React, { useCallback } from 'react';
import { ArrowLeft, Package, Clock, CheckCircle2, Star, ShieldCheck, Mail, MapPin, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  FactoryProfileHero,
  FactoryProfileTabContent,
  type TabId,
} from '../../components/features/factory-profile';
import type { useFactoryProfile } from '../../hooks/useFactoryProfile';
import { useStartChatWithFactory } from '../../hooks/useStartChatWithFactory';
import { useAuth } from '../../contexts/AuthContext';

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

  if (detailLoading && !factory) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 pb-20">
        <span
          className="h-9 w-9 animate-spin rounded-full border-2 border-violet-600 border-t-transparent"
          aria-hidden
        />
      </div>
    );
  }

  if (!factory) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 pb-20 pt-5">
        <button
          type="button"
          onClick={() => navigate('/explore')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าหลัก
        </button>
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="mb-2 text-3xl">🏭</p>
          <p className="text-sm font-medium text-gray-500">ไม่พบข้อมูลโรงงาน</p>
        </div>
      </div>
    );
  }

  const statItems = [
    { icon: <Package size={14} className="text-violet-500" />, label: 'ขั้นต่ำ', value: factory.minOrder },
    { icon: <Clock size={14} className="text-violet-500" />, label: 'Lead Time', value: factory.leadTime },
    {
      icon: <CheckCircle2 size={14} className="text-violet-500" />,
      label: 'งานสำเร็จ',
      value: `${factory.completedOrders}`,
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
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="px-4 pt-4">
        <FactoryProfileHero
          factory={factory}
          onBack={handleBack}
          onChat={handleChat}
          chatLoading={starting}
          showChat={canChat}
        />
      </div>

      <div className="space-y-3 px-4 pt-4">
        <div className="grid grid-cols-4 gap-2">
          {statItems.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-gray-100 bg-white p-2.5 text-center shadow-sm"
            >
              <div className="mb-1 flex justify-center">{s.icon}</div>
              <p className="text-[11px] font-bold leading-tight text-gray-900">{s.value}</p>
              <p className="mt-0.5 text-[9px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <p className="text-[12px] font-bold text-gray-900">{factory.name}</p>
              {factory.verified && <ShieldCheck size={13} className="text-violet-500" />}
            </div>
            <span className="text-[10px] text-gray-400">{factory.specialization}</span>
          </div>

          {profile && (profile.certificates ?? []).length > 0 && (
            <div className="border-t border-gray-50 px-4 pb-3 pt-1">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">ใบรับรอง</p>
              <div className="flex flex-wrap gap-1.5">
                {(profile.certificates ?? []).map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {factory.tags && factory.tags.length > 0 && (
            <div className="border-t border-gray-50 px-4 pb-3 pt-2">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                ความเชี่ยวชาญ
              </p>
              <div className="flex flex-wrap gap-1.5">
                {factory.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {groupedCategorySubs.length > 0 && (
            <div className="border-t border-gray-50 px-4 pb-3 pt-2">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                หมวดสินค้า
              </p>
              <div className="rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setShowCategorySubs((v) => !v)}
                  className="flex w-full items-center justify-between gap-2"
                >
                  <span className="text-[11px] font-semibold text-violet-800">หมวดหลัก {groupedCategorySubs.length} หมวด</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-violet-700 transition-transform ${showCategorySubs ? 'rotate-180' : ''}`} />
                </button>
                {showCategorySubs ? (
                  <div className="mt-2 space-y-1.5">
                    {groupedCategorySubs.map(([cat, subs]) => (
                      <div key={`cat-group-${cat}`} className="rounded-lg bg-white/80 px-2.5 py-2">
                        <p className="text-[11px] font-bold text-violet-900">{cat}</p>
                        <p className="mt-0.5 text-[10px] text-violet-700">
                          {subs.length > 0 ? subs.join(', ') : 'ไม่มีหมวดย่อย'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {apiCertificates.length > 0 && (
            <div className="border-t border-gray-50 px-4 pb-3 pt-2">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                ใบรับรอง (API)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {apiCertificates.map((c, i) => (
                  <span
                    key={String(c.map_id ?? c.cert_id ?? c.id ?? i)}
                    className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800"
                  >
                    {String(c.cert_name ?? c.name_th ?? c.cert_number ?? 'ใบรับรอง')}
                  </span>
                ))}
              </div>
            </div>
          )}
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
