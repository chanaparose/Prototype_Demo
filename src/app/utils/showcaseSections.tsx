/**
 * Shared utilities for rendering showcase sections from DB data.
 * Used by all detail pages (product, promotion, idea) to replace hardcoded content.
 */
import React from 'react';
import {
  CheckCircle2,
  CirclePercent,
  CalendarClock,
  Clock,
  Heart,
  Lightbulb,
  ListChecks,
  Package,
  PackageCheck,
  Building2,
  Clock3,
  Star,
  Tag,
  TicketPercent,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { ShowcaseSection, FactoryShowcase } from '../contexts/DataContext';

/** Map icon_name strings stored in DB → Lucide icon components */
const ICON_MAP: Record<string, LucideIcon> = {
  CheckCircle2,
  CirclePercent,
  CalendarClock,
  Clock,
  Clock3,
  Heart,
  Lightbulb,
  ListChecks,
  Package,
  PackageCheck,
  Building2,
  Star,
  Tag,
  TicketPercent,
  TrendingUp,
};

export function getIcon(iconName: string | null | undefined): LucideIcon | null {
  if (!iconName) return null;
  return ICON_MAP[iconName] ?? null;
}

/**
 * Interpolate template placeholders like {lead_time}, {min_order} with actual item values.
 */
export function interpolate(template: string, item: FactoryShowcase): string {
  return template
    .replace(/\{lead_time\}/g, item.leadTime || '-')
    .replace(/\{min_order\}/g, String(item.minOrder || 0))
    .replace(/\{category\}/g, item.category || '-')
    .replace(/\{likes\}/g, String(item.likes || 0));
}

/** Get sections by type, sorted by sort_order */
export function getSectionsByType(
  sections: ShowcaseSection[] | undefined,
  type: 'highlight' | 'checklist',
): ShowcaseSection[] {
  if (!sections) return [];
  return sections
    .filter((s) => s.section_type === type)
    .sort((a, b) => a.sort_order - b.sort_order);
}
