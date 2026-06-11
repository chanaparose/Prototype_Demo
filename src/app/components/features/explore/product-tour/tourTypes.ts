import type { TourScenario } from '@/utils/tourMocks';

export type TourStepDef = {
  route: string | null;
  /**
   * Key ที่ใช้ระบุว่า step นี้เป็นของหน้าไหน
   * ใช้สำหรับ per-page first-visit tour
   * เช่น 'explore', 'factory-ideas', 'create-rfq'
   */
  pageKey?: string;
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
