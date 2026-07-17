import React from 'react';
import { ShowcaseCard } from '@/components/shared/ShowcaseCard';
import {
  factoryIdeasContentTypeBadge as contentTypeBadge,
  factoryIdeasContentTypeLabel as contentTypeLabel,
} from '@/components/features/factory-ideas/factoryIdeasTheme';
import { resolveUnitLabel } from '@/domain/master/mappers/mapMasterUnits';
import type { FactoryShowcase } from '@/stores/types';

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
      location={item.location ?? ''}
      rating={item.factoryRating ?? 0}
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
