import React, { useState } from 'react';
import {
  Building2,
  Factory,
  MapPin,
  Package,
  Percent,
  Newspaper,
  ShieldCheck,
  Star,
  Send,
} from 'lucide-react';
import { ImageWithFallback } from '../../shared';
import { formatThaiDate } from './utils';
import { reviewsApi } from '../../../services/api';

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
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const submitReview = async () => {
    if (!factoryId || reviewSubmitting || reviewDone) return;
    setReviewSubmitting(true);
    try {
      await reviewsApi.create(factoryId, { rating: reviewRating, comment: reviewComment });
      setReviewDone(true);
      setReviewComment('');
    } catch {
      // silently fail; user can retry
    } finally {
      setReviewSubmitting(false);
    }
  };

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
              <div
                key={item.id}
                onClick={() => onProductClick(item.id)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform min-w-0"
              >
                <div className="h-28 sm:h-32">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2.5 sm:p-3">
                  <p className="text-xs sm:text-sm text-gray-900 line-clamp-2" style={{ fontWeight: 700 }}>
                    {item.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1.5">
                    MOQ {item.minOrder} • {item.leadTime}
                  </p>
                </div>
              </div>
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
              <div
                key={item.id}
                onClick={() => onPromotionClick(item.id)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform min-w-0"
              >
                <div className="h-28 sm:h-32">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2.5 sm:p-3">
                  <p className="text-xs sm:text-sm text-gray-900 line-clamp-2" style={{ fontWeight: 700 }}>
                    {item.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                  <p className="text-[10px] sm:text-[11px] text-amber-700 mt-1.5">
                    ขั้นต่ำเริ่มที่ MOQ {item.minOrder}
                  </p>
                </div>
              </div>
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
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer active:scale-[0.99] transition-transform p-4 min-w-0"
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
              <p className="flex items-start gap-2">
                <Package className="w-4 h-4 mt-0.5 text-purple-600" />
                ประเภทสินค้าที่รับผลิต:{' '}
                {(profile?.acceptedProductTypes ?? [factory.specialization]).join(', ')}
              </p>
              {(factorySubCategoryPairs.length > 0 ||
                factoryCategoryNames.length > 0 ||
                factorySubCategoryNames.length > 0) && (
                <div className="flex items-start gap-2">
                  <Package className="w-4 h-4 mt-0.5 text-purple-600" />
                  <div>
                    <p>หมวดสินค้า</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {factorySubCategoryPairs.length > 0
                        ? factorySubCategoryPairs.map((p, i) => (
                            <span
                              key={`pair-${p.categoryLabel}-${p.subLabel}-${i}`}
                              className="rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-800"
                            >
                              {p.categoryLabel} › {p.subLabel}
                            </span>
                          ))
                        : (
                          <>
                            {factoryCategoryNames.map((n) => (
                              <span
                                key={`cat-${n}`}
                                className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800"
                              >
                                {n}
                              </span>
                            ))}
                            {factorySubCategoryNames.map((n) => (
                              <span
                                key={`sub-${n}`}
                                className="rounded-full border border-teal-100 bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-800"
                              >
                                {n}
                              </span>
                            ))}
                          </>
                        )}
                    </div>
                  </div>
                </div>
              )}
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

            {/* Write a review */}
            {factoryId && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-700 mb-2">เขียนรีวิว</p>
                {reviewDone ? (
                  <p className="text-xs text-green-600 font-semibold">✓ ขอบคุณสำหรับรีวิว!</p>
                ) : (
                  <>
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-lg"
                          aria-label={`${star} ดาว`}
                        >
                          <Star
                            size={20}
                            className={star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="แบ่งปันประสบการณ์ของคุณ..."
                      rows={3}
                      className="w-full text-xs border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                    />
                    <button
                      type="button"
                      onClick={submitReview}
                      disabled={reviewSubmitting || !reviewComment.trim()}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs text-white disabled:opacity-60"
                      style={{ background: '#6C47FF', fontWeight: 600 }}
                    >
                      <Send size={13} />
                      {reviewSubmitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
