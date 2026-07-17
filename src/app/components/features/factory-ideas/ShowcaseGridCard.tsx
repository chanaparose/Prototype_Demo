import React from 'react';
import { ShowcaseCard } from '@/components/shared/ShowcaseCard';
import {
  factoryIdeasContentTypeBadge as contentTypeBadge,
  factoryIdeasContentTypeLabel as contentTypeLabel,
} from '@/components/features/factory-ideas/factoryIdeasTheme';
import { resolveUnitLabel } from '@/domain/master/mappers/mapMasterUnits';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import type { FactoryShowcase } from '@/stores/types';

/** ราคาแสดงบนการ์ด: โปรโมชันก่อน → ราคาปกติ → ช่วงราคา (string) → ไม่แสดง */
function resolvePriceLabel(item: {
  promoPrice?: number;
  basePrice?: number;
  priceRange?: string;
}): string | undefined {
  const n = item.promoPrice ?? item.basePrice;
  if (n != null && Number.isFinite(n) && n > 0) return formatCurrencyNoDecimals(n);
  const range = (item.priceRange ?? '').trim();
  return range || undefined;
}

export { resolvePriceLabel };

type ShowcaseGridCardProps = {
  item: FactoryShowcase;
  onClick: () => void;
  isLiked?: boolean;
  onToggleFavorite?: (id: string | number) => void;
};

/** Wrapper ของ ShowcaseCard สำหรับ FactoryShowcase — layout จริงอยู่ที่ shared/ShowcaseCard */
export function ShowcaseGridCard({
  item,
  onClick,
  isLiked = false,
  onToggleFavorite,
}: ShowcaseGridCardProps) {
  return (
    <ShowcaseCard
      image={item.image}
      title={item.title}
      priceLabel={resolvePriceLabel(item)}
      location={item.location ?? ''}
      moqLabel={`ขั้นต่ำ ${item.minOrder} ${resolveUnitLabel(item.unitId, item.moqUnit)}`}
      badge={{
        label: contentTypeLabel[item.contentType],
        color: contentTypeBadge[item.contentType],
      }}
      heart={
        onToggleFavorite
          ? { showcaseId: item.id, isLiked, onToggle: onToggleFavorite }
          : undefined
      }
      onClick={onClick}
    />
  );
}
