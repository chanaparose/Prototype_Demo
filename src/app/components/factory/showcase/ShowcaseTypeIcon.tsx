import { Boxes, Gift, Lightbulb, Tag, type LucideIcon } from 'lucide-react';

export type ShowcaseIconType = 'PD' | 'PM' | 'ID' | 'MT';

const ICONS: Record<ShowcaseIconType, LucideIcon> = {
  PD: Tag,
  PM: Gift,
  ID: Lightbulb,
  MT: Boxes,
};

export function ShowcaseTypeIcon({
  type,
  size = 14,
  className,
}: {
  type: ShowcaseIconType;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[type];
  return <Icon size={size} className={className} />;
}
