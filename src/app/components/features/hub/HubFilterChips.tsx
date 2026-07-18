import {
  ChevronRight,
  Cpu,
  FlaskConical,
  HeartPulse,
  LayoutGrid,
  Package,
  PawPrint,
  Shirt,
  Sparkles,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@/components/ui/button';

export type HubFilterOption = {
  hub_id: number;
  hub_name: string;
};

export function resolveHubIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/อาหาร|เครื่องดื่ม|food|beverage/.test(n)) return Utensils;
  if (/ความงาม|สกิน|beauty|cosmetic|skincare/.test(n)) return Sparkles;
  if (/สุขภาพ|เวช|health|medical|pharma/.test(n)) return HeartPulse;
  if (/แฟชั่น|ผ้า|สิ่งทอ|fashion|textile|apparel/.test(n)) return Shirt;
  if (/สัตว์เลี้ยง|pet/.test(n)) return PawPrint;
  if (/อิเล็ก|electronic|gadget/.test(n)) return Cpu;
  if (/เคมี|chemical|สาร/.test(n)) return FlaskConical;
  return Package;
}

type HubFilterChipsProps = {
  hubs: HubFilterOption[];
  selectedHubId: number | null;
  onSelect: (hubId: number | null) => void;
  onSeeAll?: () => void;
  className?: string;
};

export function HubFilterChips({
  hubs,
  selectedHubId,
  onSelect,
  onSeeAll,
  className,
}: HubFilterChipsProps) {
  if (hubs.length === 0) return null;

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h2 className='text-[14px] font-bold text-[var(--brand-navy)] lg:text-[15px]'>
            อยากกรองเพิ่มไหม?
          </h2>
          <p className='mt-0.5 text-[11px] text-gray-500'>เลือกหมวดหมู่เพื่อกรองผลลัพธ์ (ไม่บังคับ)</p>
        </div>
        {onSeeAll ? (
          <Button
            variant='unstyled'
            type='button'
            onClick={onSeeAll}
            className='group flex shrink-0 items-center gap-0.5 rounded-full border border-brand-purple/30 px-2.5 py-1 text-[11px] font-medium text-brand-purple transition-colors hover:bg-brand-purple/8'
          >
            ดูทั้งหมด
            <ChevronRight size={12} strokeWidth={2.5} />
          </Button>
        ) : null}
      </div>

      <div className='flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-hide'>
        <button
          type='button'
          onClick={() => onSelect(null)}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors',
            selectedHubId === null
              ? 'border-brand-purple/40 bg-brand-purple/10 text-brand-purple'
              : 'border-brand-purple/20 bg-white text-brand-purple/80 hover:border-brand-purple/35 hover:bg-brand-purple/5',
          )}
        >
          <LayoutGrid size={14} strokeWidth={2} />
          ทั้งหมด
        </button>

        {hubs.map((hub) => {
          const Icon = resolveHubIcon(hub.hub_name);
          const active = selectedHubId === hub.hub_id;
          return (
            <button
              key={hub.hub_id}
              type='button'
              onClick={() => onSelect(active ? null : hub.hub_id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors',
                active
                  ? 'border-brand-purple/40 bg-brand-purple/10 text-brand-purple'
                  : 'border-brand-purple/20 bg-white text-brand-purple/80 hover:border-brand-purple/35 hover:bg-brand-purple/5',
              )}
            >
              <Icon size={14} strokeWidth={2} />
              <span className='max-w-[9.5rem] truncate'>{hub.hub_name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
