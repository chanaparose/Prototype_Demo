import React from 'react';
import { useNavigate } from 'react-router';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ImageWithFallback } from '../../components/shared';
import type { useFactoriesList } from '../../hooks/useFactoriesList';

type FactoriesListState = ReturnType<typeof useFactoriesList>;

type FactoriesListMobileProps = {
  state: FactoriesListState;
};

export function FactoriesListMobile({ state }: FactoriesListMobileProps) {
  const { factories, filters, setSearchText } = state;
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
            โรงงานทั้งหมด
          </p>
          <h1 className="text-lg text-gray-900 font-bold">ค้นหาโรงงาน</h1>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={filters.searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="ค้นหาโรงงาน ชื่อ, หมวดหมู่, tag..."
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

      {/* Factory List */}
      <div className="space-y-3">
        {factories.map((factory) => (
          <button
            key={factory.id}
            type="button"
            onClick={() => navigate(`/factories/${factory.id}`)}
            className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left active:scale-[0.99] transition-transform"
          >
            <div className="flex gap-3">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                <ImageWithFallback
                  src={factory.image}
                  alt={factory.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 py-2 pr-3 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                  {factory.name}
                </p>
                <p className="text-[11px] text-gray-500 truncate mb-1">
                  {factory.specialization}
                </p>
                <p className="text-[11px] text-gray-400 mb-1">
                  {factory.location} · ขั้นต่ำ {factory.minOrder}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {factory.tags.join(' · ')}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

