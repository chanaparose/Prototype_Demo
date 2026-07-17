import { ShowcaseCard } from '@/components/shared/ShowcaseCard';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import {
  factoryIdeasContentTypeBadge,
  factoryIdeasContentTypeLabel,
  type FactoryIdeasContentType,
} from '@/components/features/factory-ideas/factoryIdeasTheme';
import type { IHubShowcaseItem } from '@/services/api/types/master.types';

function resolveShowcaseImage(item: IHubShowcaseItem): string {
  return (item.linked_showcases ?? []).find((url) => url.trim()) ?? '';
}

function resolvePrice(item: IHubShowcaseItem): number | null {
  const promo = item.promo_price;
  const base = item.base_price;
  if (promo != null && Number.isFinite(Number(promo)) && Number(promo) > 0) return Number(promo);
  if (base != null && Number.isFinite(Number(base)) && Number(base) > 0) return Number(base);
  return null;
}

type ShowcaseContentType = Exclude<FactoryIdeasContentType, 'all'>;

function resolveContentType(raw: string): ShowcaseContentType {
  const key = raw.trim().toUpperCase();
  if (key === 'PD' || key === 'PR' || key === 'PRODUCT') return 'product';
  if (key === 'PM' || key === 'PROMOTION') return 'promotion';
  if (key === 'MT' || key === 'MATERIAL') return 'material';
  if (key === 'ID' || key === 'IDEA') return 'idea';
  if (key === 'FACTORY') return 'factory';
  const lower = raw.trim().toLowerCase();
  if (lower in factoryIdeasContentTypeLabel) return lower as ShowcaseContentType;
  return 'product';
}

type HubHighlightGridCardProps = {
  item: IHubShowcaseItem;
  /** Rank badge 1–10 only; omit / null to hide. */
  rank?: number | null;
  isLiked: boolean;
  onToggleFavorite: (id: string | number) => void;
  onClick: () => void;
  className?: string;
};

/** Wrapper ของ ShowcaseCard สำหรับ IHubShowcaseItem — layout จริงอยู่ที่ shared/ShowcaseCard */
export function HubHighlightGridCard({
  item,
  rank,
  isLiked,
  onToggleFavorite,
  onClick,
  className,
}: HubHighlightGridCardProps) {
  const contentType = resolveContentType(item.content_type ?? '');
  const showRank = rank != null && rank >= 1 && rank <= 10;
  const moq = item.moq != null && item.moq > 0 ? item.moq : null;
  const unit = (item.unit_name_th ?? '').trim();
  const price = resolvePrice(item);

  return (
    <ShowcaseCard
      image={resolveShowcaseImage(item)}
      imageFallbackChar={item.factory_name || 'T'}
      title={item.title}
      priceLabel={price != null ? formatCurrencyNoDecimals(price) : undefined}
      location={item.factory_name ?? ''}
      moqLabel={
        moq != null
          ? `ขั้นต่ำ ${moq.toLocaleString('th-TH')}${unit ? ` ${unit}` : ''}`
          : 'สอบถามขั้นต่ำ'
      }
      badge={{
        label: factoryIdeasContentTypeLabel[contentType],
        color: factoryIdeasContentTypeBadge[contentType],
      }}
      heart={{ showcaseId: item.showcase_id, isLiked, onToggle: onToggleFavorite }}
      imageOverlay={
        showRank ? (
          <span className='pointer-events-none absolute bottom-0.5 left-1.5 z-[2] text-[22px] font-black italic leading-none tracking-tight text-brand-purple lg:text-[24px]'>
            {rank}
          </span>
        ) : undefined
      }
      onClick={onClick}
      className={className}
    />
  );
}

export { resolvePrice };
