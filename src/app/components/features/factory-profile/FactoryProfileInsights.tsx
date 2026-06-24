import React, { useMemo, useState } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  Star,
  Building2,
  ShieldCheck,
  ChevronDown,
  Tags,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@lib/utils';
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
      <div className='flex items-center justify-between gap-2 px-3 py-2.5'>
        <div className='flex min-w-0 items-center gap-1.5'>
          <div
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
              iconBgClassName,
            )}
          >
            <Icon size={12} strokeWidth={2.25} className={iconClassName} />
          </div>
          <span className='text-xs font-semibold text-[var(--brand-navy)]'>{title}</span>
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
      value: isDesktop ? `${rating} (${reviews})` : `${rating}`,
    },
  ];

  return (
    <div className='overflow-hidden rounded-xl border border-gray-100 bg-white'>
      <div className='border-b border-gray-100 px-3 py-2'>
        <p className='text-[10px] font-semibold uppercase tracking-wide text-gray-400'>
          ข้อมูลโรงงาน
        </p>
      </div>

      <div className={cn('grid gap-1.5 p-2.5', isDesktop ? 'grid-cols-2' : 'grid-cols-4')}>
        {statItems.map((s) => (
          <div
            key={s.label}
            className='rounded-lg border border-gray-100 bg-slate-50/50 px-1.5 py-2 text-center'
          >
            <s.icon size={13} strokeWidth={2.25} className='mx-auto mb-1 text-brand-purple' />
            <p className='text-xs font-semibold leading-tight text-[var(--brand-navy)]'>{s.value}</p>
            <p className='mt-0.5 text-[9px] text-gray-400'>{s.label}</p>
          </div>
        ))}
      </div>

      {hasCategories ? (
        <InsightSection
          icon={Building2}
          iconClassName='text-brand-purple'
          iconBgClassName='bg-brand-purple/10'
          title='หมวดหมู่ที่รับผลิต'
          trailing={
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setShowCategorySubs((v) => !v)}
              className='inline-flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-brand-purple'
            >
              <span>{groupedCategorySubs.length} หมวด</span>
              <ChevronDown
                size={12}
                strokeWidth={2.25}
                className={cn('transition-transform', showCategorySubs && 'rotate-180')}
              />
            </Button>
          }
        >
          {showCategorySubs ? (
            <div className='space-y-1 border-t border-gray-100 px-3 pb-2.5 pt-1.5'>
              {groupedCategorySubs.map(([cat, subs]) => (
                <div key={cat} className='rounded-lg bg-slate-50/80 px-2.5 py-2'>
                  <p className='text-[12px] font-semibold text-[var(--brand-navy)]'>{cat}</p>
                  {subs.length > 0 ? (
                    <p className='mt-0.5 text-[10px] leading-relaxed text-gray-500'>
                      {subs.join(' · ')}
                    </p>
                  ) : (
                    <p className='mt-0.5 text-[10px] text-gray-400'>ไม่มีหมวดย่อย</p>
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
          <div className='flex flex-wrap gap-1 border-t border-gray-100 px-3 pb-2.5 pt-1.5'>
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
          iconClassName='text-gray-500'
          iconBgClassName='bg-slate-100'
          title='ความเชี่ยวชาญ'
        >
          <div className='flex flex-wrap gap-1 border-t border-gray-100 px-3 pb-2.5 pt-1.5'>
            {tags.map((tag) => (
              <span
                key={tag}
                className='rounded-full border border-gray-100 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-gray-600'
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
