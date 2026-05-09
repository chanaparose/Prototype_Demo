import React, { useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Factory,
  Search,
  ThumbsUp,
  MapPin,
  Package,
  Percent,
  Newspaper,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { ImageWithFallback } from '../../shared';
import { ReviewImageAttachments } from '../reviews/ReviewImageAttachments';
import { formatThaiDate } from './utils';

export type TabId = 'products' | 'promotions' | 'materials' | 'articles' | 'about';

export type ShowcaseItem = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  minOrder?: number;
  leadTime?: string;
  postedAt?: string;
};

export type IdeaArticle = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  publishedAt: string;
};

export type FactoryAbout = {
  name: string;
  location: string;
  specialization: string;
  minOrder: number;
  leadTime: string;
  completedOrders: number;
  rating: number;
  reviews: number;
};

export type FactoryProfileExtra = {
  address?: string;
  acceptedProductTypes?: string[];
  certificates?: string[];
};

export type ReviewItem = {
  id: string;
  reviewer: string;
  date: string;
  rating: number;
  comment: string;
  imageUrls?: string[];
  helpfulCount?: number;
  optionText?: string;
};

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'products', label: 'สินค้า', icon: Package },
  { id: 'promotions', label: 'โปรโมชัน', icon: Percent },
  { id: 'materials', label: 'วัตถุดิบ', icon: Package },
  { id: 'articles', label: 'บทความ', icon: Newspaper },
  { id: 'about', label: 'โรงงาน', icon: Factory },
];

type FactoryProfileTabContentProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  productItems: ShowcaseItem[];
  promotionItems: ShowcaseItem[];
  materialItems: ShowcaseItem[];
  articleShowcases: ShowcaseItem[];
  factory: FactoryAbout;
  factoryId?: string;
  profile: FactoryProfileExtra | null | undefined;
  reviews: ReviewItem[];
  factoryCategoryNames?: string[];
  factorySubCategoryNames?: string[];
  factorySubCategoryPairs?: { categoryLabel: string; subLabel: string }[];
  apiCertificates?: Record<string, unknown>[];
  onProductClick: (id: string) => void;
  onPromotionClick: (id: string) => void;
  onIdeaClick: (id: string) => void;
};

export function FactoryProfileTabContent({
  activeTab,
  onTabChange,
  productItems,
  promotionItems,
  materialItems,
  articleShowcases,
  factory,
  factoryId,
  profile,
  reviews,
  factoryCategoryNames = [],
  factorySubCategoryNames = [],
  factorySubCategoryPairs = [],
  apiCertificates = [],
  onProductClick,
  onPromotionClick,
  onIdeaClick,
}: FactoryProfileTabContentProps) {
  const [showCategorySubs, setShowCategorySubs] = useState(false);
  const groupedCategorySubs = useMemo(() => {
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
    if (map.size === 0 && factorySubCategoryNames.length > 0) {
      map.set('หมวดย่อย', [...factorySubCategoryNames]);
    }
    return Array.from(map.entries());
  }, [factorySubCategoryPairs, factoryCategoryNames, factorySubCategoryNames]);

  const ShowcaseGridCard = ({
    item,
    onClick,
    badgeLabel,
    badgeColor,
  }: {
    item: ShowcaseItem;
    onClick: () => void;
    badgeLabel: string;
    badgeColor: string;
  }) => (
    <div
      onClick={onClick}
      className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span
          className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white"
          style={{ backgroundColor: badgeColor }}
        >
          {badgeLabel}
        </span>
      </div>
      <div className="p-2 flex flex-col flex-1 justify-between gap-0.5">
        <p className="text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-[#A238FF] transition-colors">
          {item.title}
        </p>
        <div className="flex items-center gap-0.5 mt-0.5">
          <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
          <span className="text-gray-500 text-[10px] truncate">{factory.location || '—'}</span>
        </div>
        <div className="mt-auto pt-1 border-t border-gray-50">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center gap-0.5 min-w-0">
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
              <span className="text-gray-700 text-[10px] font-semibold">{factory.rating}</span>
              <span className="text-gray-400 text-[9px] truncate">({factory.reviews})</span>
            </div>
            <span className="text-gray-400 text-[8px] shrink-0">ขั้นต่ำ {item.minOrder ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-4 pt-4 space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="shrink-0 px-3.5 py-2 rounded-xl text-sm flex items-center gap-1.5"
              style={{
                background: active ? '#6C47FF' : '#FFFFFF',
                color: active ? '#FFFFFF' : '#6B7280',
                border: active ? 'none' : '1px solid #E5E7EB',
                fontWeight: active ? 600 : 500,
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'products' && (
        <div>
          {productItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-500 text-center">
              โรงงานนี้ยังไม่มีสินค้าแนะนำ
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {productItems.map((item) => (
              <ShowcaseGridCard
                key={item.id}
                item={item}
                onClick={() => onProductClick(item.id)}
                badgeLabel="สินค้า"
                badgeColor="#5185D4"
              />
            ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'promotions' && (
        <div>
          {promotionItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-500 text-center">
              โรงงานนี้ยังไม่มีโปรโมชัน
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {promotionItems.map((item) => (
              <ShowcaseGridCard
                key={item.id}
                item={item}
                onClick={() => onPromotionClick(item.id)}
                badgeLabel="โปรโมชัน"
                badgeColor="#E38844"
              />
            ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'materials' && (
        <div>
          {materialItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-500 text-center">
              โรงงานนี้ยังไม่มีวัตถุดิบ
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {materialItems.map((item) => (
                <ShowcaseGridCard
                  key={item.id}
                  item={item}
                  onClick={() => onProductClick(item.id)}
                  badgeLabel="วัตถุดิบ"
                  badgeColor="#0EA5A4"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'articles' && (
        <div>
          {articleShowcases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-500 text-center">
              โรงงานนี้ยังไม่มีบทความ
            </div>
          ) : (
            <div className="space-y-3">
              {articleShowcases.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onIdeaClick(item.id)}
                  className="bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col active:scale-[0.98] p-4 min-w-0"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 uppercase tracking-wide">
                      Idea
                    </span>
                    <p className="text-[10px] text-gray-400 truncate">
                      {item.postedAt ? formatThaiDate(item.postedAt) : ''}
                    </p>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2" style={{ fontWeight: 700 }}>
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-3">{item.excerpt}</p>
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400">แตะเพื่ออ่านต่อ</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'about' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-900 mb-2" style={{ fontWeight: 700 }}>
              รายละเอียดโรงงาน
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-start gap-2">
                <Building2 className="w-4 h-4 mt-0.5 text-purple-600" />
                ชื่อโรงงาน: {factory.name}
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-purple-600" />
                ที่อยู่: {profile?.address ?? factory.location}
              </p>
              {groupedCategorySubs.length > 0 ? (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCategorySubs((v) => !v)}
                    className="flex w-full max-w-xl items-center justify-between gap-2 rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2 text-left"
                  >
                    <span className="text-[12px] font-semibold text-violet-800">หมวดหมู่ที่รับผลิต</span>
                    <div className="inline-flex items-center gap-1.5 text-[11px] text-violet-700 shrink-0">
                      <span>{groupedCategorySubs.length} หมวดหลัก</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCategorySubs ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {showCategorySubs ? (
                    <div className="mt-2 max-h-80 overflow-auto rounded-xl border border-violet-100 bg-white p-2 shadow-sm space-y-1.5">
                      {groupedCategorySubs.map(([cat, subs]) => (
                        <div key={`cat-group-${cat}`} className="rounded-lg bg-violet-50/50 px-2.5 py-2">
                          <p className="text-[11px] font-bold text-violet-900">{cat}</p>
                          <p className="mt-0.5 text-[11px] text-violet-700">
                            {subs.length > 0 ? subs.join(', ') : 'ไม่มีหมวดย่อย'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 text-purple-600" />
                <div>
                  <p>มาตรฐาน/ใบรับรอง</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(profile?.certificates ?? []).map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700"
                      >
                        {c}
                      </span>
                    ))}
                    {apiCertificates.map((c, i) => (
                      <span
                        key={String(c.map_id ?? c.cert_id ?? c.id ?? i)}
                        className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"
                      >
                        {String(c.cert_name ?? c.name_th ?? c.cert_number ?? 'ใบรับรอง')}
                      </span>
                    ))}
                    {(profile?.certificates ?? []).length === 0 && apiCertificates.length === 0 ? <span>-</span> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-sm text-gray-900 inline-flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                คะแนนสินค้า ({reviews.length})
              </p>
              <button
                type="button"
                className="text-xs font-medium inline-flex items-center gap-0.5 text-gray-500 hover:text-gray-700"
              >
                ดูทั้งหมด <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mb-3 relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                disabled
                placeholder="ค้นหารีวิวจากผู้ซื้อคนอื่น"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-xs text-gray-500"
              />
            </div>

            <div className="space-y-2.5">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">ยังไม่มีรีวิว</p>
              ) : (
                reviews.slice(0, 4).map((review) => (
                  <div key={review.id} className="rounded-xl bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-700" style={{ fontWeight: 600 }}>
                        {review.reviewer}
                      </p>
                      <p className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        มีประโยชน์ ({Number(review.helpfulCount ?? 0)})
                      </p>
                    </div>
                    <p className="text-[11px] text-amber-600 mb-1">★ {review.rating}</p>
                    {review.optionText ? (
                      <p className="text-[11px] text-gray-500 mb-1">ตัวเลือกสินค้า: {review.optionText}</p>
                    ) : null}
                    <p className="text-xs text-gray-600">{review.comment}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatThaiDate(review.date)}</p>
                    {review.imageUrls && review.imageUrls.length > 0 ? (
                      <div className="mt-2">
                        <ReviewImageAttachments
                          urls={review.imageUrls}
                          onPreviewUrl={(u) => window.open(u, '_blank', 'noopener,noreferrer')}
                        />
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            {factoryId && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  การรีวิวทำผ่านหน้าออเดอร์ที่เสร็จสมบูรณ์แล้วเท่านั้น เพื่อป้องกันรีวิวปลอมและรีวิวซ้ำ
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
