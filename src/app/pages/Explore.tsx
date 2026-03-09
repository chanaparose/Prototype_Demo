import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Search, Bell, SlidersHorizontal, Plus } from 'lucide-react';
import { currentUser, factories, rfqs, orders, categories, ideaArticles } from '../data/mockData';
import {
  ExplorePromoCarousel,
  ExploreCategories,
  ExploreFactoryGrid,
  ExploreIdeaArticles,
  ExploreRecentActivity,
} from '../components/features/explore';

export function Explore() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');

  const activeRFQs = rfqs.filter((r) => r.status !== 'completed');
  const recentOrders = orders.filter((o) => o.status !== 'completed').slice(0, 2);

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
       

      <div className="flex gap-2">
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
          <SlidersHorizontal size={18} style={{ color: '#6C47FF' }} />
        </button>
      </div>

      <ExplorePromoCarousel />

      <ExploreCategories categories={categories} />

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

      <button
        type="button"
        onClick={() => navigate('/create-rfq')}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-30"
        style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)' }}
      >
        <Plus size={24} className="text-white" />
      </button>
    </div>
  );
}
