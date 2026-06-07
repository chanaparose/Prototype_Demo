import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, SlidersHorizontal, MapPin, Star, ShieldCheck, Package, Factory, X } from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { useFactoriesList } from '@/hooks/useFactoriesList';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FactoriesListState = ReturnType<typeof useFactoriesList>;
type FactoriesListMobileProps = { state: FactoriesListState };

export function FactoriesListMobile({ state }: FactoriesListMobileProps) {
  const { factories, locations, filters, setSearchText, setLocation, setVerifiedOnly, loadError } =
    state;
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);

  const hasActiveFilters = filters.location || filters.verifiedOnly;
  const activeFilterCount = [filters.location, filters.verifiedOnly].filter(Boolean).length;

  return (
    <div className='pb-24 bg-gray-50 min-h-screen'>
      {loadError ? (
        <div className='mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'>
          {loadError} — แสดงข้อมูลจากแคชในแอป
        </div>
      ) : null}

      <div className='bg-white px-4 pt-5 pb-4 border-b border-gray-100'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <p className='text-[10px] text-gray-400 uppercase tracking-wider font-semibold'>
              ไดเรกทอรี
            </p>
            <h1 className='text-xl font-bold text-gray-900 leading-tight'>ค้นหาโรงงาน</h1>
          </div>
          <div className='px-3 py-1.5 rounded-full bg-violet-50 border border-violet-100'>
            <span className='text-[11px] font-bold text-violet-600'>{factories.length} โรงงาน</span>
          </div>
        </div>

        <div className='flex gap-2'>
          <div className='flex-1 flex items-center gap-2.5 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 focus-within:border-violet-400 focus-within:bg-white transition-all'>
            <Search size={16} className='text-gray-400 shrink-0' />
            <Input
              type='text'
              value={filters.searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder='ชื่อ, ประเภทงาน, tag…'
              className='flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400'
            />
            {filters.searchText && (
              <Button variant='unstyled' type='button' onClick={() => setSearchText('')}>
                <X size={14} className='text-gray-400' />
              </Button>
            )}
          </div>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => setFilterOpen(!filterOpen)}
            className='relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all'
            style={{
              background:
                filterOpen || hasActiveFilters ? 'var(--brand-royal)' : 'var(--neutral-white)',
              border: filterOpen || hasActiveFilters ? 'none' : '1px solid var(--neutral-border)',
            }}
          >
            <SlidersHorizontal
              size={17}
              color={filterOpen || hasActiveFilters ? 'var(--neutral-white)' : 'var(--brand-royal)'}
            />
            {activeFilterCount > 0 && !filterOpen && (
              <span className='absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white'>
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {filterOpen && (
          <div className='mt-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3'>
            <div>
              <p className='text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5'>
                พื้นที่ผลิต
              </p>
              <div className='relative'>
                <Select
                  value={filters.location}
                  onValueChange={(next) => setLocation(next === '__empty' ? '' : next)}
                >
                  <SelectTrigger className='h-10 text-gray-700'>
                    <SelectValue placeholder='ทุกพื้นที่' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='__empty'>ทุกพื้นที่</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Label
              className='flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all'
              style={{
                borderColor: filters.verifiedOnly ? 'var(--brand-violet)' : 'var(--neutral-border)',
                background: filters.verifiedOnly ? '#F5F3FF' : 'var(--neutral-white)',
              }}
            >
              <Checkbox
                checked={filters.verifiedOnly}
                onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
                className='sr-only'
                aria-label='โรงงานยืนยันตัวตนเท่านั้น'
              />
              <div
                className='w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all'
                style={{
                  borderColor: filters.verifiedOnly ? 'var(--brand-violet)' : '#D1D5DB',
                  background: filters.verifiedOnly ? 'var(--brand-violet)' : 'transparent',
                }}
              >
                {filters.verifiedOnly && (
                  <svg width='9' height='7' fill='none' viewBox='0 0 9 7'>
                    <path
                      d='M1 3.5l2.5 2.5 5-5'
                      stroke='white'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                )}
              </div>
              <div className='flex items-center gap-1.5'>
                <ShieldCheck
                  size={15}
                  className={filters.verifiedOnly ? 'text-violet-600' : 'text-gray-400'}
                />
                <span
                  className='text-sm'
                  style={{
                    color: filters.verifiedOnly
                      ? 'var(--brand-violet-deep)'
                      : 'var(--neutral-text)',
                    fontWeight: filters.verifiedOnly ? 600 : 400,
                  }}
                >
                  เฉพาะโรงงานยืนยันแล้ว
                </span>
              </div>
            </Label>

            <div className='flex gap-2 pt-1'>
              {hasActiveFilters && (
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => {
                    setLocation('');
                    setVerifiedOnly(false);
                  }}
                  className='flex-1 py-2.5 text-[13px] text-gray-500 rounded-xl border border-dashed border-gray-300'
                >
                  ล้างตัวกรอง
                </Button>
              )}
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setFilterOpen(false)}
                className='flex-1 py-2.5 text-[13px] font-semibold text-white rounded-xl'
                style={{ background: 'var(--brand-royal)' }}
              >
                ดูผลลัพธ์ ({factories.length})
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className='px-4 pt-4 space-y-3'>
        {factories.length === 0 ? (
          <div className='bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm'>
            <Factory size={30} className='mx-auto mb-2 text-gray-400' />
            <p className='text-sm font-medium text-gray-500'>ไม่พบโรงงานที่ตรงกับเงื่อนไข</p>
            <p className='text-xs text-gray-400 mt-1'>ลองเปลี่ยนคีย์เวิร์ดหรือตัวกรอง</p>
          </div>
        ) : (
          factories.map((factory) => (
            <Button
              variant='unstyled'
              key={factory.id}
              type='button'
              onClick={() => navigate(`/factories/${factory.id}`)}
              className='w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left active:scale-[0.98] transition-transform'
            >
              <div className='flex gap-0'>
                <div className='relative w-28 shrink-0'>
                  <ImageWithFallback
                    src={factory.image}
                    alt={factory.name}
                    className='w-full h-full object-cover'
                    style={{ minHeight: '96px' }}
                  />
                  {factory.verified && (
                    <div className='absolute top-2 left-2'>
                      <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-600/90 backdrop-blur-sm text-[8px] font-semibold text-white'>
                        <ShieldCheck size={7} /> ยืนยัน
                      </span>
                    </div>
                  )}
                </div>

                <div className='flex-1 px-3 py-3 min-w-0 flex flex-col justify-between'>
                  <div>
                    <p className='text-[13px] font-bold text-gray-900 truncate'>{factory.name}</p>
                    <p className='text-[11px] text-gray-500 truncate mt-0.5'>
                      {factory.specialization}
                    </p>
                  </div>

                  <div className='mt-2 space-y-1'>
                    <div className='flex items-center justify-between'>
                      <span className='inline-flex items-center gap-1 text-[11px] text-gray-500'>
                        <MapPin size={10} className='text-gray-400' />
                        {factory.location}
                      </span>
                      <span className='inline-flex items-center gap-0.5 text-[11px] font-semibold text-gray-700'>
                        <Star size={10} className='text-amber-400 fill-amber-400' />
                        {factory.rating}
                        <span className='text-gray-400 font-normal ml-0.5'>
                          ({factory.reviews})
                        </span>
                      </span>
                    </div>
                    <div className='flex items-center gap-1 text-[11px] text-gray-400'>
                      <Package size={10} className='text-gray-400' />
                      ขั้นต่ำ{' '}
                      <span className='font-semibold text-gray-600'>{factory.minOrder}</span>
                      <span className='text-gray-300 mx-0.5'>·</span>
                      <span className='truncate'>{factory.tags.slice(0, 2).join(' · ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Button>
          ))
        )}
      </div>
    </div>
  );
}
