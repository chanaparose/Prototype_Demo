import type { TourScenario } from '@/utils/tourMocks';

export type TourStepDef = {
  route: string | null;
  mockScenario?: TourScenario;
  targetTexts?: string[];
  targetSelector?: string;
  /** Click this selector before trying to find/measure the target (e.g. switch to the right tab) */
  preActionSelector?: string;
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
