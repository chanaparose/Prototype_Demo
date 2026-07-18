import { ArrowLeft, ChevronDown, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';
import { AppDialog } from '@/components/ui/app-dialog';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { getFactoryIdeasHubPath } from '@/components/features/factory-ideas/factoryIdeasHubNav';
import { factoryBadgeClass } from '@/pages/factory-portal/factoryUi';
import { type HubScope } from '@/components/features/hub/hubRowShared';
import { getPalette } from '@/components/features/hub/HubCategoryCard';
import { resolveHubImg } from '@/components/features/hub/HubCard';
import { useLbiHubsQuery } from '@/components/features/hub/useLbiHubsQuery';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { IHubResponse } from '@/services/api/types/master.types';

type ScopeOption = HubScope | 'all';

const SCOPE_TAB_OPTIONS: { id: HubScope; label: string }[] = [
  { id: 'PD', label: 'ผลิตสินค้า' },
  { id: 'MT', label: 'วัตถุดิบ' },
];

function resolveHubListImg(hub: IHubResponse): string {
  const hubImg = resolveHubImg(hub);
  if (hubImg) return hubImg;
  for (const cat of hub.categories ?? []) {
    const catImg = String(cat.img || cat.image_url || cat.image || '').trim();
    if (catImg) return catImg;
  }
  return '';
}

function hubListDescription(hub: IHubResponse): string {
  const catCount = hub.categories?.length ?? 0;
  const factoryCount = (hub.categories ?? []).reduce(
    (sum, c) => sum + (c.factory_count ?? 0),
    0,
  );
  if (factoryCount > 0) {
    return `${factoryCount.toLocaleString('th-TH')} โรงงาน · ${catCount} หมวด`;
  }
  if (catCount > 0) return `${catCount} หมวดในกลุ่มนี้`;
  return 'ดูไอเดียในกลุ่มนี้';
}

type FactoryIdeasPageHeaderProps = {
  title: string;
  count: string;
  hubScope?: HubScope;
  showBack?: boolean;
  currentHubId?: number;
  onHubChange?: (hubId: number | null, scope: HubScope | undefined) => void;
  onScopeChange?: (scope: HubScope | null) => void;
  className?: string;
};

/** Soft brand wash — use on the parent section, not inside a bordered card. */
export function FactoryIdeasHeaderBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      <div className='absolute inset-0 bg-gradient-to-br from-brand-purple/[0.11] via-[var(--brand-page)] to-brand-orange/[0.08]' />
      <div className='absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white/90' />
      <div className='absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-orange/[0.09] blur-3xl' />
      <div className='absolute -left-12 top-6 h-36 w-36 rounded-full bg-brand-purple/[0.07] blur-3xl' />
    </div>
  );
}

function HubTabButton({
  label,
  active,
  onClick,
  tabRef,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tabRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={tabRef}
      type='button'
      onClick={onClick}
      className={cn(
        'relative shrink-0 pb-2 pt-0.5 text-[13px] transition-colors',
        active
          ? 'font-bold text-brand-navy-ink'
          : 'font-medium text-slate-400 hover:text-slate-600',
      )}
    >
      <span className='max-w-[10rem] truncate'>{label}</span>
      {active ? (
        <span
          className='absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-brand-purple'
          aria-hidden
        />
      ) : null}
    </button>
  );
}

function HubListRow({
  label,
  description,
  active,
  onClick,
  imgSrc,
  fallbackId = 0,
  leading,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  imgSrc?: string;
  fallbackId?: number;
  leading?: ReactNode;
}) {
  const palette = getPalette(fallbackId);

  return (
    <li>
      <button
        type='button'
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-3.5 rounded-2xl px-1.5 py-2.5 text-left transition-colors',
          active
            ? 'bg-brand-lavender-chip/80'
            : 'hover:bg-brand-lavender-chip/50 active:bg-brand-lavender-chip/80',
        )}
      >
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100',
            imgSrc || leading ? 'bg-white' : palette.bg,
          )}
        >
          {imgSrc ? (
            <ImageWithFallback
              src={imgSrc}
              alt={label}
              className='h-full w-full object-cover'
            />
          ) : leading ? (
            leading
          ) : (
            <span className={cn('text-lg font-bold opacity-50', palette.text)}>
              {label.slice(0, 1)}
            </span>
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <p
            className={cn(
              'truncate text-[14px] font-bold leading-tight',
              active ? 'text-brand-purple' : 'text-brand-navy-ink',
            )}
          >
            {label}
          </p>
          <p className='mt-1 line-clamp-1 text-[12px] leading-tight text-slate-400'>
            {description}
          </p>
        </div>
      </button>
    </li>
  );
}

export function FactoryIdeasPageHeader({
  title,
  count,
  hubScope,
  showBack = false,
  currentHubId,
  onHubChange,
  onScopeChange,
  className,
}: FactoryIdeasPageHeaderProps) {
  const navigate = useNavigate();
  const { data: allHubs = [] } = useLbiHubsQuery();
  const [hubSheetOpen, setHubSheetOpen] = useState(false);
  const activeTabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeScope: ScopeOption = hubScope ?? 'all';

  const scopedHubs = useMemo(
    () => (activeScope === 'all' ? allHubs : allHubs.filter((hub) => hub.scope === activeScope)),
    [allHubs, activeScope],
  );

  const canSwitchHub = !!(onHubChange && scopedHubs.length > 0);
  const canSwitchScope = !!onScopeChange;
  const selectedHubId = currentHubId ?? null;

  // Keep the active hub tab visible in the horizontal scroller.
  useEffect(() => {
    const key = selectedHubId == null ? 'all' : String(selectedHubId);
    const el = activeTabRefs.current.get(key);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedHubId, activeScope]);

  const pickHub = (hub: IHubResponse | null) => {
    if (!onHubChange) return;
    if (hub == null) {
      onHubChange(null, activeScope === 'all' ? undefined : activeScope);
    } else {
      onHubChange(hub.hub_id, (hub.scope as HubScope | undefined) ?? undefined);
    }
    setHubSheetOpen(false);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Row 1 — scope tabs with | + count */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2'>
          {showBack ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={() =>
                navigate(getFactoryIdeasHubPath(activeScope === 'all' ? undefined : activeScope))
              }
              aria-label='กลับหมวดหมู่'
              className='-ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/70 hover:text-brand-purple'
            >
              <ArrowLeft size={18} strokeWidth={2.25} aria-hidden />
            </Button>
          ) : null}

          {canSwitchScope ? (
            <div
              role='tablist'
              aria-label='ประเภทหมวดหมู่'
              className='flex min-w-0 items-center gap-2.5'
            >
              {SCOPE_TAB_OPTIONS.map((opt, idx) => {
                const selected = activeScope === opt.id;
                return (
                  <div key={opt.id} className='flex items-center gap-2.5'>
                    {idx > 0 ? (
                      <span className='select-none text-[15px] font-light text-slate-300' aria-hidden>
                        |
                      </span>
                    ) : null}
                    <button
                      type='button'
                      role='tab'
                      aria-selected={selected}
                      onClick={() => onScopeChange(opt.id)}
                      className={cn(
                        'truncate text-[15px] transition-colors sm:text-base',
                        selected
                          ? 'font-bold text-brand-navy-ink'
                          : 'font-semibold text-slate-400 hover:text-slate-600',
                      )}
                    >
                      {opt.label}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <h1 className='truncate text-[15px] font-bold text-brand-navy-ink sm:text-base'>
              {title}
            </h1>
          )}
        </div>

        <span
          className={factoryBadgeClass({
            variant: 'count',
            className: 'shrink-0 bg-white/70 text-slate-600 backdrop-blur-sm',
          })}
        >
          {count}
        </span>
      </div>

      {/* Row 2 — hub text tabs + V → grid sheet */}
      {canSwitchHub ? (
        <div className='flex items-stretch gap-0'>
          <div
            className='min-w-0 flex-1 overflow-x-auto scrollbar-hide'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className='flex items-end gap-4 pr-2'>
              <HubTabButton
                label='ทั้งหมด'
                active={selectedHubId === null}
                onClick={() => pickHub(null)}
                tabRef={(el) => {
                  if (el) activeTabRefs.current.set('all', el);
                  else activeTabRefs.current.delete('all');
                }}
              />
              {scopedHubs.map((hub) => {
                const active = selectedHubId === hub.hub_id;
                const key = String(hub.hub_id);
                return (
                  <HubTabButton
                    key={hub.hub_id}
                    label={hub.name}
                    active={active}
                    onClick={() => pickHub(hub)}
                    tabRef={(el) => {
                      if (el) activeTabRefs.current.set(key, el);
                      else activeTabRefs.current.delete(key);
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className='relative flex shrink-0 items-center pl-2'>
            <span className='absolute left-0 top-1 bottom-2 w-px bg-slate-200/90' aria-hidden />
            <button
              type='button'
              onClick={() => setHubSheetOpen(true)}
              aria-label='ดูหมวดหมู่ทั้งหมด'
              aria-expanded={hubSheetOpen}
              className='flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/80 hover:text-brand-purple'
            >
              <ChevronDown
                size={18}
                strokeWidth={2.25}
                className={cn('transition-transform duration-200', hubSheetOpen && 'rotate-180')}
              />
            </button>
          </div>
        </div>
      ) : !canSwitchScope ? null : (
        <h1 className='truncate text-[14px] font-semibold leading-snug text-brand-navy-ink'>
          {title}
        </h1>
      )}

      <AppDialog
        open={hubSheetOpen}
        onOpenChange={setHubSheetOpen}
        title='เลือกหมวดหมู่'
        variant='sheet'
        size='lg'
        className='max-h-[85vh] sm:max-h-[80vh]'
        bodyClassName='bg-white px-3 pb-5 pt-1 sm:px-4'
      >
        <ul className='space-y-1'>
          <HubListRow
            label='ทั้งหมด'
            description='ไอเดียทุกหมวดในประเภทนี้'
            active={selectedHubId === null}
            onClick={() => pickHub(null)}
            leading={
              <LayoutGrid
                size={22}
                strokeWidth={2}
                className={selectedHubId === null ? 'text-brand-purple' : 'text-slate-400'}
              />
            }
          />

          {scopedHubs.map((hub) => {
            const imgSrc = resolveHubListImg(hub);
            return (
              <HubListRow
                key={hub.hub_id}
                label={hub.name}
                description={hubListDescription(hub)}
                active={selectedHubId === hub.hub_id}
                imgSrc={imgSrc || undefined}
                fallbackId={hub.hub_id}
                onClick={() => pickHub(hub)}
              />
            );
          })}
        </ul>
      </AppDialog>
    </div>
  );
}
