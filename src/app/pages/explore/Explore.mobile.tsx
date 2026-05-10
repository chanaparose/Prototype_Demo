import React from 'react';
import { useNavigate } from 'react-router';
import { Search, SlidersHorizontal, Plus, ShoppingBag, ChevronRight, Tag, Leaf, MapPin, Star } from 'lucide-react';
import {
  ExplorePromoCarousel,
  ExploreCategories,
  ExploreFactoryShowcase,
  ExploreIdeaArticles,
  ExploreFooter,
  HowToOrderSection,
} from '../../components/features/explore';
import { ImageWithFallback } from '../../components/shared';
import type { CategoryItem } from '../../components/features/explore/ExploreCategories';
import type { FactoryItem } from '../../components/features/explore/ExploreFactoryGrid';
import type { IdeaArticleItem } from '../../components/features/explore/ExploreIdeaArticles';

type ShowcaseItem = {
  id: string; title: string; excerpt: string; image: string;
  factoryName: string; factoryId: string; minOrder: number;
  contentType: string;
  category?: string;
  subCategoryName?: string;
};

type ExploreMobileProps = {
  searchText: string;
  setSearchText: (v: string) => void;
  categories: CategoryItem[];
  exploreCategoriesMerged: CategoryItem[];
  exploreCategoriesLoading: boolean;
  exploreCategoriesError: string | null;
  reloadExploreCategories: () => void;
  factories: FactoryItem[];
  ideaArticles: IdeaArticleItem[];
  factoryShowcases: ShowcaseItem[];
  exploreProducts: ShowcaseItem[];
  explorePromotions: ShowcaseItem[];
  exploreMatrials?: ShowcaseItem[];
  explorePromoCodes: unknown[];
  promoSlides: unknown[];
};

export function ExploreMobile({
  searchText,
  setSearchText,
  categories,
  exploreCategoriesMerged,
  exploreCategoriesLoading,
  exploreCategoriesError,
  reloadExploreCategories,
  factories,
  ideaArticles,
  exploreProducts,
  explorePromotions,
  exploreMatrials,
  explorePromoCodes,
  promoSlides,
}: ExploreMobileProps) {
  const navigate = useNavigate();

  const productShowcases = (exploreProducts ?? []).slice(0, 8);
  const promoShowcases = (explorePromotions ?? []).slice(0, 4);
  const materialShowcases = (exploreMatrials ?? []).slice(0, 8);

  const hasProductShowcases = productShowcases.length > 0;
  const hasPromoShowcases = promoShowcases.length > 0;
  const hasMaterialShowcases = materialShowcases.length > 0;

  return (
    <div className="md:hidden pt-3 pb-2 space-y-3">
      {/* Hero Banner — matches desktop purple gradient */}
      <div className="mx-4 relative rounded-2xl overflow-hidden h-[115px] shadow-md">
        <ImageWithFallback
          src="/assets/tryly-banner-final.png"
          alt="Tryly banner"
          className="block h-full w-full object-cover object-[center_calc(50%)]"
        />
      </div>

      {/* Search Bar */}
      <div data-tour="search" className="px-4 flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="ค้นหาโรงงาน ประเภทงาน หรือ วัสดุ..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
        <button
          type="button"
          className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0 hover:border-[#A656A0]/30 transition-colors"
        >
          <SlidersHorizontal size={16} className="text-[#A656A0]" />
        </button>
      </div>

      <ExplorePromoCarousel promoSlides={promoSlides} promoCodes={explorePromoCodes} />

      <div data-tour="categories" className="mt-[20px]">
        <ExploreCategories
          categories={categories}
          mergedFromApi={exploreCategoriesMerged}
          apiLoading={exploreCategoriesLoading}
          apiError={exploreCategoriesError}
          onRetryCategoriesApi={reloadExploreCategories}
        />
      </div>

      {/* สินค้าแนะนำ (Mobile) — แบนเนอร์ PET SHOP แสดงเสมอ; grid เมื่อมีข้อมูล */}
      <div data-tour="products" className="mb-3">
        <div className="mt-[25px] flex items-center justify-between px-4 mb-2">
          <h3 className="text-base font-bold text-[#292259] flex items-center gap-1.5">
            <ShoppingBag size={15} className="text-[#F28A2E]" /> สินค้าแนะนำ
          </h3>
          <button
            type="button"
            onClick={() => navigate('/factory-ideas?type=product')}
            className="text-[#A656A0] text-xs font-medium flex items-center gap-0.5"
          >
            ดูเพิ่มเติม <ChevronRight size={13} />
          </button>
        </div>

        {/* Cards — full-width horizontal scroll (เริ่มที่ pl-4 ซ้าย, spacer ขวา) */}
        {hasProductShowcases ? (
          <div
            className="flex gap-2 overflow-x-auto pb-2 pl-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {productShowcases.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  navigate(`/product-detail?showcase_id=${encodeURIComponent(item.id)}`)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/product-detail?showcase_id=${encodeURIComponent(item.id)}`);
                  }
                }}
                className="flex-shrink-0 w-[155px] bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-all group cursor-pointer flex flex-col"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-1 left-1 bg-[#5185D4] px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white uppercase tracking-wide">
                    สินค้า
                  </div>
                </div>
                <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                  <p className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">{item.title}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                    <span className="text-gray-500 text-[10px] truncate">
                      {((factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))?.location ?? '').trim() || '—'}
                    </span>
                  </div>
                  <div className="mt-auto pt-1 border-t border-gray-50">
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-0.5 min-w-0">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="text-gray-700 text-[10px] font-semibold">
                          {Number((factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))?.rating ?? 0)}
                        </span>
                        <span className="text-gray-400 text-[9px] truncate">
                          ({Number((factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))?.reviews ?? 0)})
                        </span>
                      </div>
                      <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {item.minOrder ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* trailing spacer — การ์ดสุดท้ายไม่โดนตัด */}
            <div className="flex-shrink-0 w-3" aria-hidden />
          </div>
        ) : (
          <div className="px-4">
            <div className="rounded-xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white px-4 py-5 text-center">
              <p className="text-sm font-medium text-gray-600">ยังไม่มีสินค้าแนะนำในขณะนี้</p>
              <p className="mt-1 text-xs text-gray-400">ดูไอเดียสินค้าและโรงงานได้จากปุ่มด้านล่าง</p>
              <button
                type="button"
                onClick={() => navigate('/factory-ideas?type=product')}
                className="mt-3 w-full rounded-full border border-[#A656A0]/40 bg-white py-2 text-sm font-medium text-[#A656A0] hover:bg-[#F8F5FF] transition-colors"
              >
                ดูสินค้าแนะนำ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* วัตถุดิบแนะนำ (Mobile) */}
      <div className="mb-3">
        <div className="mt-[20px] flex items-center justify-between px-4 mb-2">
          <h3 className="text-base font-bold text-[#292259] flex items-center gap-1.5">
            <Leaf size={15} className="text-[#059669]" /> วัตถุดิบแนะนำ
          </h3>
          <button
            type="button"
            onClick={() => navigate('/factory-ideas?type=material')}
            className="text-[#059669] text-xs font-medium flex items-center gap-0.5"
          >
            ดูเพิ่มเติม <ChevronRight size={13} />
          </button>
        </div>

        {/* Cards — horizontal scroll */}
        {hasMaterialShowcases ? (
          <div
            className="flex gap-2 overflow-x-auto pb-2 pl-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {materialShowcases.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/product-detail?showcase_id=${encodeURIComponent(item.id)}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/product-detail?showcase_id=${encodeURIComponent(item.id)}`);
                  }
                }}
                className="flex-shrink-0 w-[155px] bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-all group cursor-pointer flex flex-col"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-gray-50">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-[#059669] px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wide">
                    วัตถุดิบ
                  </div>
                </div>
                <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                  <p className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">{item.title}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                    <span className="text-gray-500 text-[10px] truncate">
                      {((factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))?.location ?? '').trim() || '—'}
                    </span>
                  </div>
                  <div className="mt-auto pt-1 border-t border-gray-50">
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-0.5 min-w-0">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="text-gray-700 text-[10px] font-semibold">
                          {Number((factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))?.rating ?? 0)}
                        </span>
                        <span className="text-gray-400 text-[9px] truncate">
                          ({Number((factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))?.reviews ?? 0)})
                        </span>
                      </div>
                      <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {item.minOrder ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex-shrink-0 w-3" aria-hidden />
          </div>
        ) : (
          <div className="px-4">
            <div className="rounded-xl border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white px-4 py-5 text-center">
              <p className="text-sm font-medium text-gray-600">ยังไม่มีวัตถุดิบแนะนำในขณะนี้</p>
              <p className="mt-1 text-xs text-gray-400">ดูข้อมูลวัตถุดิบได้จากปุ่มด้านล่าง</p>
              <button
                type="button"
                onClick={() => navigate('/factory-ideas?type=material')}
                className="mt-3 w-full rounded-full border border-[#059669]/40 bg-white py-2 text-sm font-medium text-[#059669] hover:bg-emerald-50 transition-colors"
              >
                ดูวัตถุดิบแนะนำ
              </button>
            </div>
          </div>
        )}
      </div>


      {/* How to Order */}
      <HowToOrderSection className="mx-4" />


      <div className="mt-[20px]">
        <ExploreFactoryShowcase
          factories={(factories ?? []).slice(0, 8)}
          onFactoryClick={(id) => navigate(`/factories/${id}`)}
          onSeeAll={() => navigate('/factory-ideas?type=factory')}
          variant="mobile"
        />
      </div>

      <div className="mt-[20px]">
        <ExploreIdeaArticles
          articles={(ideaArticles ?? []).slice(0, 3)}
          onSeeAll={() => navigate('/factory-ideas?type=idea')}
          onArticleClick={(id) => navigate(`/idea-detail?showcase_id=${id}`)}
        />
      </div>

      {/* โปรโมชันแนะนำ — แบนเนอร์ส้ม (เดียวกับ desktop) แสดงเสมอ; การ์ดเมื่อมีข้อมูล */}
      <div className="mb-3">
        <div className="mt-[20px] flex items-center justify-between px-4 mb-2">
          <h3 className="text-base font-bold text-[#292259] flex items-center gap-1.5">
            <Tag size={15} className="text-[#F27830]" /> โปรโมชันแนะนำ
          </h3>
          <button
            type="button"
            onClick={() => navigate('/factory-ideas?type=promotion')}
            className="text-[#F28A2E] text-xs font-medium hover:text-[#F27830] flex items-center gap-0.5 transition-colors"
          >
            ดูเพิ่มเติม <ChevronRight size={13} />
          </button>
        </div>
        <div className="px-3 space-y-2">
          {hasPromoShowcases ? (
            <div
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {promoShowcases.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                    onClick={() => navigate(`/factory-ideas/promotions/${item.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/factory-ideas/promotions/${item.id}`);
                      }
                    }}
                  className="flex-shrink-0 w-[155px] bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-[#F28A2E] px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wide">
                      โปรโมชัน
                    </div>
                  </div>
                  <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
                    <h4 className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">{item.title}</h4>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                      <span className="text-gray-500 text-[10px] truncate">
                        {((factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))?.location ?? '').trim() || '—'}
                      </span>
                    </div>
                    <div className="mt-auto pt-1 border-t border-gray-50">
                      <div className="flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-0.5 min-w-0">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                          <span className="text-gray-700 text-[10px] font-semibold">
                            {Number((factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))?.rating ?? 0)}
                          </span>
                          <span className="text-gray-400 text-[9px] truncate">
                            ({Number((factories ?? []).find((f) => String(f.id) === String(item.factoryId ?? ''))?.reviews ?? 0)})
                          </span>
                        </div>
                        <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {item.minOrder ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#F28A2E]/25 bg-gradient-to-br from-orange-50/50 to-white px-4 py-5 text-center">
              <p className="text-sm font-medium text-gray-600">ยังไม่มีโปรโมชันแนะนำในขณะนี้</p>
              <p className="mt-1 text-xs text-gray-400">ดูไอเดียโปรโมชันได้จากปุ่มด้านล่าง</p>
              <button
                type="button"
                onClick={() => navigate('/factory-ideas?type=promotion')}
                className="mt-3 w-full rounded-full border border-[#F28A2E]/40 bg-white py-2 text-sm font-medium text-[#F27830] hover:bg-orange-50/80 transition-colors"
              >
                ดูไอเดียโปรโมชัน
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Registration CTA (Mobile) — matches desktop purple theme */}
      <div className="mx-4 rounded-xl overflow-hidden shadow-sm border border-[#A238FF]/30 relative" style={{ background: 'linear-gradient(135deg, #F8F5FF 0%, #FAFAFA 100%)' }}>
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ maskImage: 'linear-gradient(to left, rgba(0,0,0,0.5), transparent)', WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.5), transparent)' }}
        >
          <img
            src="https://images.unsplash.com/photo-1584867818838-5312e821fe15?w=400"
            className="w-full h-full object-cover mix-blend-multiply"
            alt=""
          />
        </div>
        <div className="relative z-10 p-3.5 text-center">
          <h3 className="text-base font-bold text-[#2D1B4E] mb-0.5">
            ลงทะเบียนกับ <span className="text-[#A238FF]">Tryly</span>
          </h3>
          <p className="text-gray-600 text-sm mb-3 font-medium">สร้างเว็บไซต์หน้าร้านได้ง่าย ๆ ฟรี!</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate('/register/factory')}
              className="w-full py-2 rounded-lg font-bold transition-colors shadow-md text-sm text-white"
              style={{ background: '#A238FF' }}
            >
              สมัครเลย
            </button>
            <button className="w-full bg-white border border-[#A238FF] text-[#A238FF] py-2 rounded-lg font-bold transition-colors text-sm">
              สิทธิประโยชน์มากมาย
            </button>
          </div>
        </div>
      </div>

      {/* Footer (Mobile) */}
      <ExploreFooter />

      {/* FAB — matches desktop purple accent */}
      <button
        data-tour="fab"
        type="button"
        onClick={() => navigate('/create-rfq')}
        className="fixed bottom-6 right-5 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-30"
        style={{ background: '#A238FF', boxShadow: '0 6px 20px rgba(162,56,255,0.40)' }}
      >
        <Plus size={20} className="text-white" />
      </button>

    </div>
  );
}
