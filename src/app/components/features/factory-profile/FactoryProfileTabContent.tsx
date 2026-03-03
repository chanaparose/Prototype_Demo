import React from 'react';
import {
  Building2,
  Factory,
  MapPin,
  Package,
  Percent,
  Newspaper,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { ImageWithFallback } from '../../shared';
import { formatThaiDate } from './utils';

export type TabId = 'products' | 'promotions' | 'articles' | 'about';

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
};

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'products', label: 'สินค้า', icon: Package },
  { id: 'promotions', label: 'โปรโมชัน', icon: Percent },
  { id: 'articles', label: 'บทความ', icon: Newspaper },
  { id: 'about', label: 'โรงงาน', icon: Factory },
];

type FactoryProfileTabContentProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  productItems: ShowcaseItem[];
  promotionItems: ShowcaseItem[];
  articleIdeas: IdeaArticle[];
  articleShowcases: ShowcaseItem[];
  factory: FactoryAbout;
  profile: FactoryProfileExtra | null | undefined;
  reviews: ReviewItem[];
  onProductClick: (id: string) => void;
  onPromotionClick: (id: string) => void;
  onIdeaClick: (id: string) => void;
};

export function FactoryProfileTabContent({
  activeTab,
  onTabChange,
  productItems,
  promotionItems,
  articleIdeas,
  articleShowcases,
  factory,
  profile,
  reviews,
  onProductClick,
  onPromotionClick,
  onIdeaClick,
}: FactoryProfileTabContentProps) {
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
        <div className="space-y-3">
          {productItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-500 text-center">
              โรงงานนี้ยังไม่มีสินค้าแนะนำ
            </div>
          ) : (
            productItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onProductClick(item.id)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="h-36">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-900 line-clamp-1" style={{ fontWeight: 700 }}>
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                  <p className="text-[11px] text-gray-400 mt-2">
                    MOQ {item.minOrder} • {item.leadTime}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'promotions' && (
        <div className="space-y-3">
          {promotionItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-500 text-center">
              โรงงานนี้ยังไม่มีโปรโมชัน
            </div>
          ) : (
            promotionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onPromotionClick(item.id)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="h-36">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-900 line-clamp-1" style={{ fontWeight: 700 }}>
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                  <p className="text-[11px] text-amber-700 mt-2">
                    ขั้นต่ำเริ่มที่ MOQ {item.minOrder}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'articles' && (
        <div className="space-y-3">
          {articleIdeas.length === 0 && articleShowcases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-500 text-center">
              โรงงานนี้ยังไม่มีบทความ
            </div>
          ) : (
            <>
              {articleIdeas.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="h-36">
                    <ImageWithFallback
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-900 line-clamp-2" style={{ fontWeight: 700 }}>
                      {article.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
                    <p className="text-[11px] text-gray-400 mt-2">
                      {formatThaiDate(article.publishedAt)}
                    </p>
                  </div>
                </div>
              ))}
              {articleShowcases.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onIdeaClick(item.id)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <div className="h-36">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-900 line-clamp-2" style={{ fontWeight: 700 }}>
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                    <p className="text-[11px] text-gray-400 mt-2">
                      {item.postedAt ? formatThaiDate(item.postedAt) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </>
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
              <p className="flex items-start gap-2">
                <Package className="w-4 h-4 mt-0.5 text-purple-600" />
                ประเภทสินค้าที่รับผลิต:{' '}
                {(profile?.acceptedProductTypes ?? [factory.specialization]).join(', ')}
              </p>
              <p className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 text-purple-600" />
                มาตรฐาน/ใบรับรอง: {(profile?.certificates ?? []).join(', ') || '-'}
              </p>
              <p className="flex items-start gap-2">
                <Star className="w-4 h-4 mt-0.5 text-purple-600" />
                รีวิวเฉลี่ย: {factory.rating} จาก {factory.reviews} รีวิว
              </p>
              <p className="flex items-start gap-2">
                <Factory className="w-4 h-4 mt-0.5 text-purple-600" />
                ขั้นต่ำรับผลิต: {factory.minOrder} ชิ้น
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-900 mb-2.5" style={{ fontWeight: 700 }}>
              รีวิวจากลูกค้า
            </p>
            <div className="space-y-2.5">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">ยังไม่มีรีวิว</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="rounded-xl bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-700" style={{ fontWeight: 600 }}>
                        {review.reviewer}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {formatThaiDate(review.date)}
                      </p>
                    </div>
                    <p className="text-[11px] text-amber-600 mb-1">★ {review.rating}</p>
                    <p className="text-xs text-gray-600">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
