import React from 'react';
import { Search } from 'lucide-react';

import { factoryCardClass } from '@/pages/factory-portal/factoryUi';

export type FactoryWorklistTab = {
  key: string;
  label: string;
  shortLabel?: string;
  count?: number;
  icon?: React.ReactNode;
};

type FactoryWorklistCardProps = {
  tabs?: FactoryWorklistTab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  tabAriaLabel?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchTrailing?: React.ReactNode;
  filters?: React.ReactNode;
  activeFilters?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function FactoryWorklistCard({
  tabs,
  activeTab,
  onTabChange,
  tabAriaLabel,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchTrailing,
  filters,
  activeFilters,
  children,
  className,
}: FactoryWorklistCardProps) {
  return (
    <div className={`sticky top-14 z-[5] bg-brand-page py-2 -my-1 ${className ?? ''}`}>
      <div className={factoryCardClass({ variant: 'shell' })}>
        {tabs?.length ? (
          <div
            className='flex overflow-x-auto overflow-y-hidden border-b border-slate-100 [&::-webkit-scrollbar]:hidden'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            role='tablist'
            aria-label={tabAriaLabel}
          >
            {tabs.map((tab) => {
              const on = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type='button'
                  role='tab'
                  aria-selected={on}
                  onClick={() => onTabChange?.(tab.key)}
                  className='-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3.5 text-[13px] transition-colors focus:outline-none'
                  style={{
                    borderBottomColor: on ? 'var(--brand-purple)' : 'transparent',
                    color: on ? 'var(--brand-purple)' : '#64748b',
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  {tab.icon}
                  <span className='hidden sm:inline'>{tab.label}</span>
                  <span className='sm:hidden'>{tab.shortLabel ?? tab.label}</span>
                  {tab.count && tab.count > 0 ? (
                    <span
                      className='min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums'
                      style={{
                        background: on ? '#eef2ff' : '#f1f5f9',
                        color: on ? 'var(--brand-purple)' : '#94a3b8',
                      }}
                    >
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className='px-3 pb-3 pt-3 sm:px-4'>
          <div className='flex gap-2'>
            <div className='relative flex-1'>
              <Search
                size={14}
                className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
              />
              <input
                type='search'
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className='h-9 w-full appearance-none rounded-lg border border-slate-200 bg-[var(--brand-page)] pl-9 pr-3 text-xs text-slate-800 outline-none transition-all placeholder:text-xs placeholder:text-slate-400 focus:border-brand-purple focus:bg-white focus:ring-2 focus:ring-brand-purple/15 sm:text-[13px]'
              />
            </div>
            {searchTrailing}
          </div>

          {filters ? <div className='mt-2'>{filters}</div> : null}
          {activeFilters ? <div className='mt-2'>{activeFilters}</div> : null}

          {children}
        </div>
      </div>
    </div>
  );
}
