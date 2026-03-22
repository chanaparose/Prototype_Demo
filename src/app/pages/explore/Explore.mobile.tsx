import React from 'react';
import { useNavigate } from 'react-router';
import { Search, SlidersHorizontal, Plus, ShoppingBag, ChevronRight, Tag } from 'lucide-react';
import {
  ExplorePromoCarousel,
  ExploreCategories,
  ExploreFactoryGrid,
  ExploreIdeaArticles,
  ExploreFooter,
} from '../../components/features/explore';
import type { CategoryItem } from '../../components/features/explore/ExploreCategories';
import type { FactoryItem } from '../../components/features/explore/ExploreFactoryGrid';
import type { IdeaArticleItem } from '../../components/features/explore/ExploreIdeaArticles';

/* ── Mock data for โปรโมชันแนะนำ (mobile) ────────────────── */
const RECOMMENDED_PROMOS = [
  { id: 'rp1', title: 'แพ็กเกจอาบน้ำ-ตัดขน VIP', desc: 'บริการดูแลความสะอาดแบบพรีเมียม', price: '฿850.00', img: 'https://images.unsplash.com/photo-1625279138836-e7311d5c863a?w=400', tag: 'บริการ' },
  { id: 'rp2', title: 'ลด 15% ค่าผลิตครั้งแรก', desc: 'ใช้โค้ด FIRST15 เมื่อสร้าง RFQ ใหม่', price: 'ลดสูงสุด ฿2,000', img: 'https://images.unsplash.com/photo-1584867818838-5312e821fe15?w=400', tag: 'ส่วนลด' },
  { id: 'rp3', title: 'บริการสระว่ายน้ำสุนัข', desc: 'ออกกำลังกายเสริมสุขภาพที่ดี', price: '฿500.00 - ฿3,500.00', img: 'https://images.unsplash.com/photo-1589924749359-9697080c3577?w=400', tag: 'บริการ' },
  { id: 'rp4', title: 'ส่วนลด 500 บาท', desc: 'เมื่อสั่งซื้อขั้นต่ำ 5,000 บาท', price: 'โค้ด: PET500', img: 'https://images.unsplash.com/photo-1768745888568-b3ef7c7ba366?w=400', tag: 'ส่วนลด' },
];

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
  ideaArticles: IdeaArticleItem[];
};

export function ExploreMobile({
  searchText,
  setSearchText,
  categories,
  factories,
  ideaArticles,
}: ExploreMobileProps) {
  const navigate = useNavigate();

  return (
    <div className="lg:hidden pt-5 pb-4 space-y-5">
      {/* Hero Banner — matches desktop purple gradient */}
      <div className="mx-4 relative rounded-2xl overflow-hidden h-[160px] shadow-md flex items-center" style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #4A267D 100%)' }}>
        <div className="absolute top-0 right-0 w-[280px] h-full rounded-l-[60px] opacity-70 transform translate-x-16 skew-x-[-15deg]" style={{ background: '#A238FF' }} />
        <div className="absolute -bottom-10 right-10 w-[200px] h-[150px] rounded-full opacity-40 blur-3xl mix-blend-screen" style={{ background: '#FF7A00' }} />
        <div className="absolute top-4 left-1/3 w-32 h-32 rounded-full opacity-30 blur-2xl" style={{ background: '#A238FF' }} />

        <div className="relative z-10 px-6 py-5 text-white">
          <span className="inline-block px-2 py-0.5 mb-2 rounded-full text-[10px] font-semibold tracking-wide border backdrop-blur-sm" style={{ background: 'rgba(162,56,255,0.30)', color: '#EBD3FF', borderColor: 'rgba(162,56,255,0.50)' }}>
            AMERICA'S FIRST HOLISTIC
          </span>
          <h1 className="text-xl font-bold mb-1 leading-tight drop-shadow-md" style={{ fontFamily: 'serif' }}>
            Solid Gold <span style={{ color: '#FFB870' }}>Manufacturing</span>
          </h1>
          <p className="text-xs max-w-[240px] font-medium" style={{ color: '#E2DCE6' }}>
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
            placeholder="ค้นหาโรงงาน ประเภทงาน หรือ วัสดุ..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
        <button
          type="button"
          className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0 hover:border-[#A656A0]/30 transition-colors"
        >
          <SlidersHorizontal size={18} className="text-[#A656A0]" />
        </button>
      </div>

      <ExplorePromoCarousel />

      <ExploreCategories categories={categories} />

      {/* สินค้าแนะนำ (Mobile) — matches desktop theme */}
      <div className="mb-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h3 className="text-base font-bold text-[#292259] flex items-center gap-1.5">
            <ShoppingBag size={16} className="text-[#F28A2E]" /> สินค้าแนะนำ
          </h3>
          <button className="text-[#A656A0] text-xs font-medium flex items-center gap-0.5">
            ดูเพิ่มเติม <ChevronRight size={14} />
          </button>
        </div>
        <div className="px-4">
          <div className="grid grid-cols-2 gap-3">
            {MOBILE_PRODUCTS.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-all group cursor-pointer">
                <div className="relative h-32 overflow-hidden bg-gray-50">
                  <img src={product.img} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center shadow-sm text-[9px]">
                    🐾
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-gray-700 text-xs mb-1 line-clamp-2 leading-snug group-hover:text-[#A656A0] transition-colors min-h-[28px]">{product.title}</p>
                  <p className="font-bold text-[#F28A2E] text-sm">{product.price}</p>
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

      {/* โปรโมชันแนะนำ — matches desktop orange theme */}
      <div className="mb-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <h3 className="text-base font-bold text-[#292259] flex items-center gap-1.5">
            <Tag size={16} className="text-[#F27830]" /> โปรโมชันแนะนำ
          </h3>
          <button className="text-[#F28A2E] text-xs font-medium hover:text-[#F27830] flex items-center gap-0.5 transition-colors">
            ดูเพิ่มเติม <ChevronRight size={14} />
          </button>
        </div>
        <div
          className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {RECOMMENDED_PROMOS.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-[200px] bg-white border border-[#F28A2E]/15 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#F28A2E]/30 transition-all group flex flex-col cursor-pointer">
              <div className="h-28 relative overflow-hidden bg-gray-100">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 left-2 bg-[#F28A2E] px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wide">
                  {item.tag}
                </div>
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h4 className="font-bold text-xs text-[#292259] mb-1 line-clamp-2 leading-snug group-hover:text-[#F27830] transition-colors">{item.title}</h4>
                <p className="text-[11px] text-gray-500 mb-2 line-clamp-2">{item.desc}</p>
                <div className="mt-auto pt-2 border-t border-[#F28A2E]/10 font-bold text-[#F27830] text-xs">
                  {item.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Registration CTA (Mobile) — matches desktop purple theme */}
      <div className="mx-4 rounded-2xl overflow-hidden shadow-sm border border-[#A238FF]/30 relative" style={{ background: 'linear-gradient(135deg, #F8F5FF 0%, #FAFAFA 100%)' }}>
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
        <div className="relative z-10 p-5 text-center">
          <h3 className="text-lg font-bold text-[#2D1B4E] mb-1">
            ลงทะเบียนกับ <span className="text-[#A238FF]">WeMake</span>
          </h3>
          <p className="text-gray-600 text-sm mb-4 font-medium">สร้างเว็บไซต์หน้าร้านได้ง่าย ๆ ฟรี!</p>
          <div className="flex flex-col gap-2">
            <button className="w-full py-2.5 rounded-lg font-bold transition-colors shadow-md text-sm text-white" style={{ background: '#A238FF' }}>
              สมัครเลย
            </button>
            <button className="w-full bg-white border border-[#A238FF] text-[#A238FF] py-2.5 rounded-lg font-bold transition-colors text-sm">
              สิทธิประโยชน์มากมาย
            </button>
          </div>
        </div>
      </div>

      {/* Footer (Mobile) */}
      <ExploreFooter />

      {/* FAB — matches desktop purple accent */}
      <button
        type="button"
        onClick={() => navigate('/create-rfq')}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-30"
        style={{ background: '#A238FF', boxShadow: '0 6px 20px rgba(162,56,255,0.40)' }}
      >
        <Plus size={24} className="text-white" />
      </button>
    </div>
  );
}
