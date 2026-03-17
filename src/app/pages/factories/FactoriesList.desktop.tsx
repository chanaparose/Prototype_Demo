import React from 'react';
import { useNavigate } from 'react-router';
import { Search, SlidersHorizontal, MapPin, ShieldCheck } from 'lucide-react';
import { ImageWithFallback } from '../../components/shared';
import type { useFactoriesList } from '../../hooks/useFactoriesList';

type FactoriesListState = ReturnType<typeof useFactoriesList>;

type FactoriesListDesktopProps = {
  state: FactoriesListState;
};

export function FactoriesListDesktop({ state }: FactoriesListDesktopProps) {
  const {
    factories,
    locations,
    filters,
    setSearchText,
    setLocation,
    setVerifiedOnly,
  } = state;
  const navigate = useNavigate();

  return (
    <div className="hidden lg:flex px-10 py-8 gap-8 min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Sidebar filters */}
      <aside className="w-72 flex-shrink-0 space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">
            ตัวกรอง
          </p>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-1">ค้นหา</p>
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={filters.searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="ชื่อโรงงาน, ประเภทงาน, tag..."
                  className="flex-1 bg-transparent text-xs outline-none text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">พื้นที่ผลิต</p>
              <select
                value={filters.location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="">ทุกพื้นที่</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} className="text-violet-500" />
                  เฉพาะโรงงานยืนยันแล้ว
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-800 mb-1">
            เคล็ดลับการเลือกโรงงาน
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>ดู specialization ให้ตรงกับสินค้าที่ต้องการ</li>
            <li>ตรวจสอบขั้นต่ำการสั่งผลิต และ lead time</li>
            <li>พิจารณารีวิวและจำนวนงานที่เคยทำสำเร็จ</li>
          </ul>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Header + search (desktop-level) */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
              โรงงานทั้งหมด
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              เลือกโรงงานคู่ค้าของคุณ
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <SlidersHorizontal size={14} className="text-violet-500" />
            <span>{factories.length} โรงงานที่ตรงกับเงื่อนไข</span>
          </div>
        </div>

        {/* Grid of factories */}
        <div className="mt-2 grid grid-cols-3 gap-4">
          {factories.map((factory) => (
            <button
              key={factory.id}
              type="button"
              onClick={() => navigate(`/factories/${factory.id}`)}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="relative h-40">
                <ImageWithFallback
                  src={factory.image}
                  alt={factory.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm px-2 py-0.5">
                  <span className="text-[10px] text-white">
                    {factory.priceRange}
                  </span>
                </div>
              </div>
              <div className="p-3.5 space-y-1.5">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {factory.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {factory.specialization}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin size={11} className="text-slate-400" />
                    {factory.location}
                  </span>
                  <span>
                    ★ {factory.rating} ({factory.reviews})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  ขั้นต่ำ {factory.minOrder} ·{' '}
                  {factory.tags.slice(0, 2).join(' · ')}
                </p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

