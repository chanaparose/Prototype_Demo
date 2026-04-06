/**
 * Mock สำหรับ Analytics Dashboard โรงงาน — โครงสร้างรองรับสลับ Daily / Weekly / Monthly
 */

export type AnalyticsTimeframe = 'daily' | 'weekly' | 'monthly';

export type AnalyticsSeriesPoint = {
  label: string;
  periodStart?: string;
  revenue: number;
  deposits: number;
  closed_orders: number;
  total_orders: number;
  /** RFQ ที่โรงงานได้รับ/มีโอกาสเห็นในช่วงนั้น (ควร ≥ rfq_replies) */
  rfq_received: number;
  /** จำนวนครั้งที่ส่งใบเสนอราคา/ตอบกลับ RFQ */
  rfq_replies: number;
};

export type AnalyticsSummary = {
  revenue_total: number;
  deposits_total: number;
  closed_orders_total: number;
  total_orders_total: number;
  rfq_received_total: number;
  rfq_replies_total: number;
};

export type AnalyticsTimeframeBundle = {
  summary: AnalyticsSummary;
  series: AnalyticsSeriesPoint[];
};

export type FactoryAnalyticsMock = Record<AnalyticsTimeframe, AnalyticsTimeframeBundle>;

export const FACTORY_ANALYTICS_MOCK: FactoryAnalyticsMock = {
  daily: {
    summary: {
      revenue_total: 428500,
      deposits_total: 156000,
      closed_orders_total: 5,
      total_orders_total: 14,
      rfq_received_total: 51,
      rfq_replies_total: 23,
    },
    series: [
      {
        label: '31 มี.ค.',
        periodStart: '2026-03-31',
        revenue: 42000,
        deposits: 18000,
        closed_orders: 0,
        total_orders: 2,
        rfq_received: 9,
        rfq_replies: 4,
      },
      {
        label: '1 เม.ย.',
        periodStart: '2026-04-01',
        revenue: 55000,
        deposits: 22000,
        closed_orders: 1,
        total_orders: 3,
        rfq_received: 6,
        rfq_replies: 3,
      },
      {
        label: '2 เม.ย.',
        periodStart: '2026-04-02',
        revenue: 48000,
        deposits: 15000,
        closed_orders: 0,
        total_orders: 2,
        rfq_received: 12,
        rfq_replies: 5,
      },
      {
        label: '3 เม.ย.',
        periodStart: '2026-04-03',
        revenue: 61000,
        deposits: 24000,
        closed_orders: 1,
        total_orders: 2,
        rfq_received: 5,
        rfq_replies: 2,
      },
      {
        label: '4 เม.ย.',
        periodStart: '2026-04-04',
        revenue: 72000,
        deposits: 31000,
        closed_orders: 1,
        total_orders: 2,
        rfq_received: 8,
        rfq_replies: 4,
      },
      {
        label: '5 เม.ย.',
        periodStart: '2026-04-05',
        revenue: 89000,
        deposits: 28000,
        closed_orders: 1,
        total_orders: 2,
        rfq_received: 6,
        rfq_replies: 3,
      },
      {
        label: '6 เม.ย.',
        periodStart: '2026-04-06',
        revenue: 61500,
        deposits: 18000,
        closed_orders: 1,
        total_orders: 1,
        rfq_received: 5,
        rfq_replies: 2,
      },
    ],
  },
  weekly: {
    summary: {
      revenue_total: 1842000,
      deposits_total: 642000,
      closed_orders_total: 18,
      total_orders_total: 52,
      rfq_received_total: 150,
      rfq_replies_total: 89,
    },
    series: [
      {
        label: 'สัปดาห์ 9',
        periodStart: '2026-02-24',
        revenue: 410000,
        deposits: 140000,
        closed_orders: 4,
        total_orders: 12,
        rfq_received: 35,
        rfq_replies: 20,
      },
      {
        label: 'สัปดาห์ 10',
        periodStart: '2026-03-03',
        revenue: 445000,
        deposits: 158000,
        closed_orders: 5,
        total_orders: 14,
        rfq_received: 38,
        rfq_replies: 22,
      },
      {
        label: 'สัปดาห์ 11',
        periodStart: '2026-03-10',
        revenue: 468000,
        deposits: 162000,
        closed_orders: 4,
        total_orders: 13,
        rfq_received: 40,
        rfq_replies: 24,
      },
      {
        label: 'สัปดาห์ 12',
        periodStart: '2026-03-17',
        revenue: 519000,
        deposits: 182000,
        closed_orders: 5,
        total_orders: 13,
        rfq_received: 37,
        rfq_replies: 23,
      },
    ],
  },
  monthly: {
    summary: {
      revenue_total: 6820000,
      deposits_total: 2410000,
      closed_orders_total: 64,
      total_orders_total: 198,
      rfq_received_total: 421,
      rfq_replies_total: 312,
    },
    series: [
      {
        label: 'พ.ย. 2025',
        periodStart: '2025-11-01',
        revenue: 980000,
        deposits: 340000,
        closed_orders: 9,
        total_orders: 28,
        rfq_received: 65,
        rfq_replies: 48,
      },
      {
        label: 'ธ.ค. 2025',
        periodStart: '2025-12-01',
        revenue: 1050000,
        deposits: 370000,
        closed_orders: 10,
        total_orders: 31,
        rfq_received: 70,
        rfq_replies: 52,
      },
      {
        label: 'ม.ค. 2026',
        periodStart: '2026-01-01',
        revenue: 1120000,
        deposits: 398000,
        closed_orders: 11,
        total_orders: 33,
        rfq_received: 72,
        rfq_replies: 54,
      },
      {
        label: 'ก.พ. 2026',
        periodStart: '2026-02-01',
        revenue: 1180000,
        deposits: 420000,
        closed_orders: 12,
        total_orders: 35,
        rfq_received: 76,
        rfq_replies: 56,
      },
      {
        label: 'มี.ค. 2026',
        periodStart: '2026-03-01',
        revenue: 1245000,
        deposits: 445000,
        closed_orders: 12,
        total_orders: 36,
        rfq_received: 78,
        rfq_replies: 58,
      },
      {
        label: 'เม.ย. 2026',
        periodStart: '2026-04-01',
        revenue: 1245000,
        deposits: 437000,
        closed_orders: 10,
        total_orders: 35,
        rfq_received: 60,
        rfq_replies: 44,
      },
    ],
  },
};
