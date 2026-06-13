import React, { useMemo, useState } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  Star,
  Factory,
  ShieldCheck,
  ChevronDown,
  Tags,
  type LucideIcon,
} from 'lucide-react';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import { Button } from '@/components/ui/button';
import { groupFactoryCategorySubs } from '@/components/features/factory-profile/utils';

type FactoryProfileInsightsProps = {
  layout?: 'mobile' | 'desktop';
  minOrder: string | number;
  leadTime: string;
  completedOrders: number;
  rating: number;
  reviews: number;
  factoryCategoryNames?: string[];
  factorySubCategoryNames?: string[];
  factorySubCategoryPairs?: { categoryLabel: string; subLabel: string }[];
  profileCertificates?: string[];
  apiCertificates?: Record<string, unknown>[];
  tags?: string[];
};

type StatItem = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function InsightSection({
  icon: Icon,
  iconClassName,
  iconBgClassName,
  title,
  trailing,
  children,
}: {
  icon: LucideIcon;
  iconClassName: string;
  iconBgClassName: string;
  title: string;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className='border-t border-gray-100'>
      <div className='flex items-center justify-between gap-2 px-4 py-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBgClassName}`}
          >
            <Icon size={14} className={iconClassName} />
          </div>
          <span className='text-[13px] font-semibold text-brand-navy-deep'>{title}</span>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

export function FactoryProfileInsights({
  layout = 'mobile',
  minOrder,
  leadTime,
  completedOrders,
  rating,
  reviews,
  factoryCategoryNames = [],
  factorySubCategoryNames = [],
  factorySubCategoryPairs = [],
  profileCertificates = [],
  apiCertificates = [],
  tags = [],
}: FactoryProfileInsightsProps) {
  const [showCategorySubs, setShowCategorySubs] = useState(false);

  const groupedCategorySubs = useMemo(
    () =>
      groupFactoryCategorySubs(
        factorySubCategoryPairs,
        factoryCategoryNames,
        factorySubCategoryNames,
      ),
    [factorySubCategoryPairs, factoryCategoryNames, factorySubCategoryNames],
  );

  const hasCerts = profileCertificates.length > 0 || apiCertificates.length > 0;
  const hasCategories = groupedCategorySubs.length > 0;
  const hasTags = tags.length > 0;
  const isDesktop = layout === 'desktop';

  const statItems: StatItem[] = [
    { icon: Package, label: 'ขั้นต่ำ', value: String(minOrder ?? '-') },
    { icon: Clock, label: 'Lead Time', value: leadTime || '-' },
    {
      icon: CheckCircle2,
      label: 'งานสำเร็จ',
      value: isDesktop ? `${completedOrders} ออเดอร์` : `${completedOrders}`,
    },
    {
      icon: Star,
      label: 'เรทติ้ง',
      value: isDesktop ? `${rating} (${reviews} รีวิว)` : `${rating}`,
    },
  ];

  return (
    <div className='overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm'>
      <div className='border-b border-gray-100 px-4 py-3'>
        <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-400'>
          ข้อมูลโรงงาน
        </p>
      </div>

      <div className={`grid gap-2 p-3 ${isDesktop ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {statItems.map((s) => (
          <div
            key={s.label}
            className='rounded-xl border border-gray-100 bg-[var(--brand-page)]/50 px-2 py-3 text-center'
          >
            <s.icon size={15} className='mx-auto mb-1.5 text-brand-violet-deep' />
            <p className='text-[12px] font-bold leading-tight text-brand-navy-deep'>{s.value}</p>
            <p className='mt-0.5 text-[9px] text-slate-400'>{s.label}</p>
          </div>
        ))}
      </div>

      {hasCategories ? (
        <InsightSection
          icon={Factory}
          iconClassName='text-brand-violet-deep'
          iconBgClassName='bg-violet-50'
          title='หมวดหมู่ที่รับผลิต'
          trailing={
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setShowCategorySubs((v) => !v)}
              className='inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-brand-violet-deep'
            >
              <span>{groupedCategorySubs.length} หมวด</span>
              <ChevronDown
                size={14}
                className={`transition-transform ${showCategorySubs ? 'rotate-180' : ''}`}
              />
            </Button>
          }
        >
          {showCategorySubs ? (
            <div className='space-y-1.5 border-t border-gray-100 px-4 pb-3 pt-2'>
              {groupedCategorySubs.map(([cat, subs]) => (
                <div key={cat} className='rounded-xl bg-violet-50/60 px-3 py-2.5'>
                  <p className='text-[11px] font-bold text-violet-900'>{cat}</p>
                  {subs.length > 0 ? (
                    <p className='mt-0.5 text-[11px] leading-relaxed text-violet-700'>
                      {subs.join(' · ')}
                    </p>
                  ) : (
                    <p className='mt-0.5 text-[11px] text-violet-500'>ไม่มีหมวดย่อย</p>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </InsightSection>
      ) : null}

      {hasCerts ? (
        <InsightSection
          icon={ShieldCheck}
          iconClassName='text-emerald-600'
          iconBgClassName='bg-emerald-50'
          title='มาตรฐาน / ใบรับรอง'
        >
          <div className='flex flex-wrap gap-1.5 border-t border-gray-100 px-4 pb-3 pt-2'>
            {profileCertificates.map((c) => (
              <StatusBadge key={c} variant='active' size='sm'>
                {c}
              </StatusBadge>
            ))}
            {apiCertificates.map((c, i) => (
              <StatusBadge
                key={String(c.map_id ?? c.cert_id ?? c.id ?? i)}
                variant='success'
                size='sm'
              >
                {String(c.cert_name ?? c.name_th ?? c.cert_number ?? 'ใบรับรอง')}
              </StatusBadge>
            ))}
          </div>
        </InsightSection>
      ) : null}

      {hasTags ? (
        <InsightSection
          icon={Tags}
          iconClassName='text-slate-500'
          iconBgClassName='bg-slate-50'
          title='ความเชี่ยวชาญ'
        >
          <div className='flex flex-wrap gap-1.5 border-t border-gray-100 px-4 pb-3 pt-2'>
            {tags.map((tag) => (
              <span
                key={tag}
                className='rounded-full border border-gray-100 bg-[var(--brand-page)] px-2.5 py-1 text-[11px] font-medium text-slate-600'
              >
                {tag}
              </span>
            ))}
          </div>
        </InsightSection>
      ) : null}
    </div>
  );
}
