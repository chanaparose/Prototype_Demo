import type { TourScenario } from '@/utils/tourMocks';

export type TourStepDef = {
  route: string | null;
  mockScenario?: TourScenario;
  targetTexts?: string[];
  targetSelector?: string;
  spotlightRadius?: number;
  spotlightPad?: number;
  cardPlacement?: 'top' | 'bottom' | 'auto';
  badgeColor: string;
  icon: string;
  badge: string;
  title: string;
  desc: string;
  tip: string;
};
