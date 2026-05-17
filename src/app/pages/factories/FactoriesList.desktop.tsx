import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  MapPin,
  ShieldCheck,
  Star,
  Package,
  ArrowUpRight,
  ChevronDown,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/shared';
import type { useFactoriesList } from '@/hooks/useFactoriesList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type FactoriesListState = ReturnType<typeof useFactoriesList>;
type FactoriesListDesktopProps = { state: FactoriesListState };

export function FactoriesListDesktop({ state }: FactoriesListDesktopProps) {
  const { factories, locations, filters, setSearchText, setLocation, setVerifiedOnly, loadError } =
    state;
  const navigate = useNavigate();
  const [locationOpen, setLocationOpen] = useState(false);

  const hasActiveFilters = filters.searchText || filters.location || filters.verifiedOnly;
  const clearAll = () => {
    setSearchText('');
    setLocation('');
    setVerifiedOnly(false);
  };

  return (
    <div className='hidden lg:block min-h-[calc(100vh-4rem)] bg-gray-50'>
      {loadError ? (
        <div className='px-8 pt-4'>
          <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900'>
            {loadError} — แสดงข้อมูลจากแคชในแอป
          </div>
        </div>
      ) : null}

      <div className='bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10'>
        <div className='px-8 py-4'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <p className='text-[10px] font-semibold tracking-[0.14em] text-purple-400 uppercase mb-0.5'>
                ไดเรกทอรี
              </p>
              <h1 className='text-[22px] font-bold text-gray-900 leading-tight'>
                เลือกโรงงานคู่ค้า
              </h1>
            </div>
            <div className='flex items-center gap-2 text-[12px] text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2'>
              <SlidersHorizontal size={13} className='text-purple-500' />
              <span>
                <span className='font-bold text-gray-800'>{factories.length}</span> โรงงาน
              </span>
            </div>
          </div>

          <div className='flex items-center gap-2.5 flex-wrap'>
            <div className='flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-200 focus-within:border-purple-400 focus-within:bg-white transition-all w-72'>
              <Search size={14} className='text-gray-400 shrink-0' />
              <Input
                type='text'
                value={filters.searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder='ชื่อโรงงาน, ประเภทงาน, tag…'
                className='flex-1 bg-transparent text-[13px] outline-none text-gray-800 placeholder-gray-400'
              />
              {filters.searchText && (
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => setSearchText('')}
                  aria-label='ล้างข้อความค้นหา'
                  className='text-gray-400 hover:text-gray-600'
                >
                  <X size={12} />
                </Button>
              )}
            </div>

            <div className='relative'>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setLocationOpen(!locationOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] transition-all ${
                  filters.location
                    ? 'border-purple-400 bg-purple-50 text-purple-700 font-semibold'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
                }`}
              >
                <MapPin
                  size={13}
                  className={filters.location ? 'text-purple-500' : 'text-gray-400'}
                />
                {filters.location || 'ทุกพื้นที่'}
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${locationOpen ? 'rotate-180' : ''} ${filters.location ? 'text-purple-400' : 'text-gray-400'}`}
                />
              </Button>
              {locationOpen && (
                <div className='absolute top-full mt-1.5 left-0 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-20 min-w-[180px]'>
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => {
                      setLocation('');
                      setLocationOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-[13px] hover:bg-purple-50 transition-colors ${!filters.location ? 'text-purple-600 font-semibold bg-purple-50/50' : 'text-gray-700'}`}
                  >
                    ทุกพื้นที่
                  </Button>
                  <div className='mx-3 my-1 border-t border-gray-100' />
                  {locations.map((loc) => (
                    <Button
                      variant='unstyled'
                      key={loc}
                      type='button'
                      onClick={() => {
                        setLocation(loc);
                        setLocationOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-[13px] hover:bg-purple-50 transition-colors ${filters.location === loc ? 'text-purple-600 font-semibold' : 'text-gray-700'}`}
                    >
                      {loc}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant='unstyled'
              type='button'
              onClick={() => setVerifiedOnly(!filters.verifiedOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] transition-all ${
                filters.verifiedOnly
                  ? 'border-purple-400 bg-purple-50 text-purple-700 font-semibold'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <ShieldCheck
                size={13}
                className={filters.verifiedOnly ? 'text-purple-500' : 'text-gray-400'}
              />
              ยืนยันแล้วเท่านั้น
            </Button>

            {hasActiveFilters && (
              <Button
                variant='unstyled'
                type='button'
                onClick={clearAll}
                className='flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px] text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all'
              >
                <X size={12} />
                ล้างทั้งหมด
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className='px-8 py-6'>
        {factories.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm'>
            <p className='text-4xl mb-3'>🏭</p>
            <p className='text-[14px] text-gray-500 font-medium'>ไม่พบโรงงานที่ตรงกับเงื่อนไข</p>
            <p className='text-[12px] text-gray-400 mt-1'>ลองเปลี่ยนคีย์เวิร์ดหรือตัวกรอง</p>
          </div>
        ) : (
          <div className='grid grid-cols-3 xl:grid-cols-4 gap-4'>
            {factories.map((factory) => (
              <Button
                variant='unstyled'
                key={factory.id}
                type='button'
                onClick={() => navigate(`/factories/${factory.id}`)}
                className='group bg-white rounded-2xl border border-gray-100 overflow-hidden text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400/30'
              >
                <div className='relative h-44 overflow-hidden bg-gray-100'>
                  <ImageWithFallback
                    src={factory.image}
                    alt={factory.name}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent' />

                  <div className='absolute top-2.5 left-2.5'>
                    <span className='inline-flex items-center px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-semibold text-white'>
                      {factory.priceRange}
                    </span>
                  </div>

                  {factory.verified && (
                    <div className='absolute top-2.5 right-2.5'>
                      <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600/90 backdrop-blur-sm text-[9px] font-semibold text-white'>
                        <ShieldCheck size={9} />
                        ยืนยันแล้ว
                      </span>
                    </div>
                  )}

                  <div className='absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200'>
                    <ArrowUpRight size={13} className='text-white' />
                  </div>
                </div>

                <div className='p-4 space-y-2.5'>
                  <div>
                    <p className='text-[13px] font-bold text-gray-900 truncate'>{factory.name}</p>
                    <p className='text-[11px] text-gray-400 truncate mt-0.5'>
                      {factory.specialization}
                    </p>
                    {factory.factoryTypeName ? (
                      <p className='text-[10px] text-violet-600 font-medium truncate mt-0.5'>
                        {factory.factoryTypeName}
                      </p>
                    ) : null}
                  </div>

                  <div className='flex items-center justify-between text-[11px]'>
                    <span className='inline-flex items-center gap-1 text-gray-500'>
                      <MapPin size={10} className='text-gray-400' />
                      {factory.location}
                    </span>
                    <span className='inline-flex items-center gap-1 font-semibold text-gray-700'>
                      <Star size={10} className='text-amber-400 fill-amber-400' />
                      {factory.rating}
                      <span className='text-gray-400 font-normal'>({factory.reviews})</span>
                    </span>
                  </div>

                  <div className='flex items-center gap-1.5 text-[11px] text-gray-500 pt-2.5 border-t border-gray-100'>
                    <Package size={10} className='text-gray-400' />
                    ขั้นต่ำ <span className='font-semibold text-gray-700'>{factory.minOrder}</span>
                    <span className='mx-1 text-gray-200'>·</span>
                    <span className='truncate text-gray-400'>
                      {factory.tags.slice(0, 2).join(' · ')}
                    </span>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
