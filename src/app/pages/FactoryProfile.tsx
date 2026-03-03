import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  MapPin,
  MessageCircle,
  Package,
  Percent,
  Star,
  Newspaper,
  Factory,
  ShieldCheck,
} from 'lucide-react';
import {
  conversations,
  factories,
  factoryProfiles,
  factoryReviews,
  factoryShowcases,
  ideaArticles,
} from '../data/mockData';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

type TabId = 'products' | 'promotions' | 'articles' | 'about';

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'products', label: 'สินค้า', icon: Package },
  { id: 'promotions', label: 'โปรโมชัน', icon: Percent },
  { id: 'articles', label: 'บทความ', icon: Newspaper },
  { id: 'about', label: 'โรงงาน', icon: Factory },
];

function formatThaiDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function FactoryProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabId>('products');

  const factory = factories.find((f) => f.id === id);
  const profile = factoryProfiles.find((p) => p.factoryId === id);
  const conversation = conversations.find((c) => c.factoryId === id);

  const productItems = useMemo(
    () => factoryShowcases.filter((item) => item.factoryId === id && item.contentType === 'product'),
    [id]
  );
  const promotionItems = useMemo(
    () => factoryShowcases.filter((item) => item.factoryId === id && item.contentType === 'promotion'),
    [id]
  );
  const articleItems = useMemo(() => {
    const showcaseIdeas = factoryShowcases.filter((item) => item.factoryId === id && item.contentType === 'idea');
    const ideas = ideaArticles.filter((item) => item.factoryId === id);
    return { showcaseIdeas, ideas };
  }, [id]);
  const reviews = useMemo(() => factoryReviews.filter((r) => r.factoryId === id), [id]);

  if (!factory) {
    return (
      <div className="px-4 pt-5 pb-20">
        <button
          type="button"
          onClick={() => navigate('/factory-ideas')}
          className="mb-4 inline-flex items-center gap-1 text-sm text-purple-600"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าแนะนำโรงงาน
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-500 shadow-sm">
          ไม่พบข้อมูลโรงงาน
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-56">
        <ImageWithFallback src={factory.image} alt={factory.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <button
          type="button"
          onClick={() => navigate('/factory-ideas')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <button
          type="button"
          onClick={() => navigate(conversation ? `/messages/${conversation.id}` : '/messages')}
          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md"
          aria-label="แชทกับโรงงาน"
        >
          <MessageCircle className="w-5 h-5" style={{ color: '#6C47FF' }} />
        </button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-lg leading-tight" style={{ fontWeight: 700 }}>
              {factory.name}
            </p>
            {factory.verified && <BadgeCheck className="w-4 h-4 text-violet-200" />}
          </div>
          <div className="flex items-center gap-3 text-xs text-white/90">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {factory.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
              {factory.rating} ({factory.reviews})
            </span>
            <span>{factory.priceRange}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[11px] text-gray-400">ขั้นต่ำผลิต</p>
              <p className="text-sm text-gray-900 mt-0.5" style={{ fontWeight: 700 }}>
                {factory.minOrder}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Lead time</p>
              <p className="text-sm text-gray-900 mt-0.5" style={{ fontWeight: 700 }}>
                {factory.leadTime}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">งานสำเร็จ</p>
              <p className="text-sm text-gray-900 mt-0.5" style={{ fontWeight: 700 }}>
                {factory.completedOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
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
                  onClick={() => navigate(`/factory-ideas/products/${item.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <div className="h-36">
                    <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-900 line-clamp-1" style={{ fontWeight: 700 }}>
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                    <p className="text-[11px] text-gray-400 mt-2">MOQ {item.minOrder} • {item.leadTime}</p>
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
                  onClick={() => navigate(`/factory-ideas/promotions/${item.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <div className="h-36">
                    <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-900 line-clamp-1" style={{ fontWeight: 700 }}>
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                    <p className="text-[11px] text-amber-700 mt-2">ขั้นต่ำเริ่มที่ MOQ {item.minOrder}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'articles' && (
          <div className="space-y-3">
            {[...articleItems.ideas, ...articleItems.showcaseIdeas].length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-500 text-center">
                โรงงานนี้ยังไม่มีบทความ
              </div>
            ) : (
              <>
                {articleItems.ideas.map((article) => (
                  <div key={article.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-36">
                      <ImageWithFallback src={article.image} alt={article.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-900 line-clamp-2" style={{ fontWeight: 700 }}>
                        {article.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
                      <p className="text-[11px] text-gray-400 mt-2">{formatThaiDate(article.publishedAt)}</p>
                    </div>
                  </div>
                ))}
                {articleItems.showcaseIdeas.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/factory-ideas/ideas/${item.id}`)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                  >
                    <div className="h-36">
                      <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-900 line-clamp-2" style={{ fontWeight: 700 }}>
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                      <p className="text-[11px] text-gray-400 mt-2">{formatThaiDate(item.postedAt)}</p>
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
                <p className="flex items-start gap-2"><Building2 className="w-4 h-4 mt-0.5 text-purple-600" />ชื่อโรงงาน: {factory.name}</p>
                <p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-purple-600" />ที่อยู่: {profile?.address ?? factory.location}</p>
                <p className="flex items-start gap-2"><Package className="w-4 h-4 mt-0.5 text-purple-600" />ประเภทสินค้าที่รับผลิต: {(profile?.acceptedProductTypes ?? [factory.specialization]).join(', ')}</p>
                <p className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 text-purple-600" />มาตรฐาน/ใบรับรอง: {(profile?.certificates ?? []).join(', ') || '-'}</p>
                <p className="flex items-start gap-2"><Star className="w-4 h-4 mt-0.5 text-purple-600" />รีวิวเฉลี่ย: {factory.rating} จาก {factory.reviews} รีวิว</p>
                <p className="flex items-start gap-2"><Factory className="w-4 h-4 mt-0.5 text-purple-600" />ขั้นต่ำรับผลิต: {factory.minOrder} ชิ้น</p>
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
                        <p className="text-[11px] text-gray-400">{formatThaiDate(review.date)}</p>
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

    </div>
  );
}
