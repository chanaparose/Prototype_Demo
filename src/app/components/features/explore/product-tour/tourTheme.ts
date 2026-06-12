/** Shared bright, modern palette for product tour UI */
export const TOUR_THEME = {
  /** Soft dim — page content stays visible, not washed out by white */
  scrimBase: 'rgba(21, 18, 40, 0.42)',
  cardShadow: '0 16px 48px rgba(21, 18, 40, 0.18), 0 4px 16px rgba(109, 40, 217, 0.08)',
  cardShadowUp: '0 -16px 48px rgba(21, 18, 40, 0.18), 0 -4px 16px rgba(109, 40, 217, 0.08)',
  title: '#1e1b4b',
  body: '#475569',
  progressInactive: 'rgba(148, 163, 184, 0.35)',
  ringContrast: 'rgba(21, 18, 40, 0.55)',
} as const;

/** Brighter accent per step — easier to scan than deep CSS vars alone */
export const TOUR_ACCENT: Record<string, string> = {
  'var(--brand-purple)': '#b855ff',
  'var(--brand-orange)': '#fb923c',
  'var(--brand-teal)': '#14b8a6',
  'var(--status-info)': '#3b82f6',
  'var(--brand-violet)': '#8b5cf6',
  'var(--status-success-bright)': '#22c55e',
};

export function tourAccent(color: string): string {
  return TOUR_ACCENT[color] ?? color;
}
