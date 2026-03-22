import React from 'react';
import { useNavigate } from 'react-router';
import { Search, SlidersHorizontal, Plus, ShoppingBag } from 'lucide-react';
import {
  ExplorePromoCarousel,
  ExploreCategories,
  ExploreFactoryGrid,
  ExploreIdeaArticles,
  ExploreRecentActivity,
  ExploreFooter,
} from '../../components/features/explore';
import type { RfqActivityItem, OrderActivityItem } from '../../components/features/explore/ExploreRecentActivity';
import type { CategoryItem } from '../../components/features/explore/ExploreCategories';
import type { FactoryItem } from '../../components/features/explore/ExploreFactoryGrid';
import type { IdeaArticleItem } from '../../components/features/explore/ExploreIdeaArticles';

/* ── Mock data for สินค้าแนะนำ (mobile) ─────────────────── */
const MOBILE_PRODUCTS = [
  { id: 'mp1', title: 'อาหารแมว Holistic สูตรไก่-แอปเปิล', price: '฿1,200.00', img: 'https://images.unsplash.com/photo-1584867818838-5312e821fe15?w=400' },
  { id: 'mp2', title: 'ขนมสุนัขออร์แกนิค', price: '฿350.00', img: 'https://images.unsplash.com/photo-1589924749359-9697080c3577?w=400' },
  { id: 'mp3', title: 'เสื้อสเวตเตอร์สัตว์เลี้ยง', price: '฿250.00', img: 'https://images.unsplash.com/photo-1768745888568-b3ef7c7ba366?w=400' },
  { id: 'mp4', title: 'แชมพูอาบน้ำสุนัข', price: '฿180.00', img: 'https://images.unsplash.com/photo-1625279138836-e7311d5c863a?w=400' },
];

type ExploreMobileProps = {
  searchText: string;
  setSearchText: (v: string) => void;
  categories: CategoryItem[];
  factories: FactoryItem[];
  activeRFQs: RfqActivityItem[];
  recentOrders: OrderActivityItem[];
  ideaArticles: IdeaArticleItem[];
};

export function ExploreMobile({
  searchText,
  setSearchText,
  categories,
  factories,
  activeRFQs,
  recentOrders,
  ideaArticles,
}: ExploreMobileProps) {
  const navigate = useNavigate();

  return (
    <div className="lg:hidden pt-5 pb-4 space-y-5">
      {/* Mini Banner */}
      <div className="mx-4 relative rounded-2xl overflow-hidden bg-[#2D1060] h-[160px] shadow-md flex items-center">
        <div className="absolute top-0 right-0 w-[300px] h-full bg-[#A020C8] rounded-l-[60px] opacity-90 transform translate-x-16 skew-x-[-15deg]"></div>
        <div className="absolute -bottom-10 right-10 w-[200px] h-[150px] bg-[#FF9A00] rounded-full opacity-70 blur-3xl mix-blend-screen"></div>

        <div className="relative z-10 px-6 py-5 text-white">
          <span className="inline-block px-2 py-0.5 mb-2 rounded-full bg-[#FF9A00]/20 text-[#FFD740] text-[10px] font-semibold tracking-wider border border-[#FF9A00]/30">
            PET MANUFACTURING
          </span>
          <h1 className="text-xl font-bold mb-1 leading-tight drop-shadow-md">
            ค้นหาโรงงาน <span className="text-[#FFD740]">สำหรับแบรนด์คุณ</span>
          </h1>
          <p className="text-[#E2DCE6] text-xs max-w-[240px]">
            ค้นหาโรงงานผลิตสินค้าสัตว์เลี้ยงระดับพรีเมียม
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="ค้นหาโรงงาน หรือ ประเภทงาน..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
        <button
          type="button"
          className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0"
        >
          <SlidersHorizontal size={18} className="text-[#A020C8]" />
        </button>
      </div>

      <ExplorePromoCarousel />

      <ExploreCategories categories={categories} />

      {/* สินค้าแนะนำ (Mobile) */}
      <div className="mb-5">
        <div className="mx-4 rounded-t-2xl bg-[#A020C8] px-4 py-3 text-center relative overflow-hidden">
          <div className="absolute top-0 right-6 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
          <h3 className="text-base font-bold text-white relative z-10 flex items-center justify-center gap-1.5">
            <ShoppingBag size={16} /> สินค้าแนะนำ
          </h3>
          <p className="text-white/80 text-[10px] mt-0.5 relative z-10">
            ส่งมอบความสุขให้สัตว์เลี้ยงแสนรักของคุณ
          </p>
        </div>
        <div className="mx-4 rounded-b-2xl border border-t-0 border-gray-200 bg-gradient-to-b from-purple-50/30 to-white p-3">
          <div className="grid grid-cols-2 gap-3">
            {MOBILE_PRODUCTS.map((product) => (
              <div key={product.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all group cursor-pointer">
                <div className="relative h-28 overflow-hidden bg-gray-100">
                  <img src={product.img} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm text-[8px]">
                    🐾
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-gray-800 text-xs mb-1 line-clamp-2 group-hover:text-[#A020C8] transition-colors">{product.title}</p>
                  <p className="font-bold text-[#FF9A00] text-sm">{product.price}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-center">
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-2 rounded-lg text-xs font-medium transition-colors">
              ดูเพิ่มเติม
            </button>
          </div>
        </div>
      </div>

      <ExploreFactoryGrid
        factories={factories}
        onFactoryClick={(id) => navigate(`/factories/${id}`)}
      />

      <ExploreIdeaArticles articles={ideaArticles} />

      <ExploreRecentActivity
        rfqs={activeRFQs.slice(0, 2)}
        orders={recentOrders}
        onRfqClick={(id) => navigate(`/rfqs/${id}`)}
        onOrderClick={(id) => navigate(`/orders/${id}`)}
        onViewAllClick={() => navigate('/orders')}
      />

      {/* Registration CTA (Mobile) */}
      <div className="mx-4 bg-gradient-to-r from-[#F3E5FF] to-[#FAFAFA] rounded-2xl overflow-hidden border border-[#A020C8]/20 shadow-sm p-5 text-center">
        <h3 className="text-lg font-bold text-[#352A55] mb-1">
          ลงทะเบียนกับ <span className="text-[#A020C8]">WeMake</span>
        </h3>
        <p className="text-gray-600 text-sm mb-4">สร้างเว็บไซต์หน้าร้านได้ง่าย ๆ ฟรี!</p>
        <div className="flex flex-col gap-2">
          <button className="w-full bg-[#A020C8] hover:bg-[#7B10A8] text-white py-2.5 rounded-lg font-bold transition-colors shadow-md text-sm">
            สมัครเลย
          </button>
          <button className="w-full bg-white border border-[#A020C8] text-[#A020C8] py-2.5 rounded-lg font-bold transition-colors text-sm">
            สิทธิประโยชน์มากมาย
          </button>
        </div>
      </div>

      {/* Footer (Mobile) */}
      <ExploreFooter />

      {/* FAB */}
      <button
        type="button"
        onClick={() => navigate('/create-rfq')}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-30"
        style={{ background: 'linear-gradient(135deg, #A020C8, #FF9A00)' }}
      >
        <Plus size={24} className="text-white" />
      </button>
    </div>
  );
}
