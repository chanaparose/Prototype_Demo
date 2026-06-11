import type { TourScenario } from '@/utils/tourMocks';

export type TourStepDef = {
  route: string | null;
  /**
   * Key ที่ใช้ระบุว่า step นี้เป็นของหน้าไหน
   * ใช้สำหรับ per-page first-visit tour
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
  /** @deprecated ไม่ render แล้ว เก็บไว้สำหรับ a11y/reference */
  badge?: string;
  title: string;
  desc: string;
  /** @deprecated ไม่ render เป็น tip box แยกอีกต่อไป — รวมเข้า desc แล้ว */
  tip?: string;
};
