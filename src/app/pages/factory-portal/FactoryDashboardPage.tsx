import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Link, useNavigate } from 'react-router';
import {
  TrendingUp,
  Package,
  MessageSquareReply,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Wallet,
  ClipboardList,
  ShoppingBag,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import { factoryVerifyStatus } from '@/components/factory/FactoryVerifiedGuard';
import {
  useFactoryDashboard,
  type AnalyticsTimeframe,
  type AnalyticsSummary,
  type AnalyticsSeriesPoint,
} from '@/pages/factory-portal/hooks/useFactoryDashboard';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import { Button } from '@/components/ui/button';
import { appColors } from '@/styles/colors';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCompactNumber, formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';

const COLORS = {
  purple: appColors.brand.indigo,
  purpleLight: appColors.brand.mauveLight,
  orange: appColors.brand.indigo,
  navy: appColors.brand.navy,
  pageBg: appColors.brand.page,
  teal: appColors.brand.teal,
  white: appColors.neutral.white,
};

const TIMEFRAMES: { id: AnalyticsTimeframe; label: string }[] = [
  { id: 'daily', label: 'วัน' },
  { id: 'weekly', label: 'สัปดาห์' },
  { id: 'monthly', label: 'เดือน' },
];

const PURPLE = appColors.brand.indigo;
const ORANGE = appColors.brand.indigo;
const GREEN = appColors.status.success;
const SLATE = appColors.neutral.slate;

function compactAxis(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

function rfqReplyRatePct(summary: AnalyticsSummary): number {
  if (summary.rfq_received_total <= 0) return 0;
  return Math.round((summary.rfq_replies_total / summary.rfq_received_total) * 100);
}

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string;
};

function MoneyTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className='rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg'>
      <p className='font-semibold text-gray-800 mb-1'>{label}</p>
      <ul className='space-y-0.5'>
        {payload.map((p) => (
          <li key={String(p.dataKey)} className='flex items-center gap-2'>
            <span
              className='inline-block w-2 h-2 rounded-full shrink-0'
              style={{ background: p.color }}
            />
            <span className='text-gray-500'>{p.name}:</span>
            <span className='font-medium text-gray-900'>
              {p.dataKey === 'revenue' || p.dataKey === 'deposits'
                ? formatCurrencyNoDecimals(Number(p.value))
                : formatCompactNumber(Number(p.value))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CountTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className='rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg'>
      <p className='font-semibold text-gray-800 mb-1'>{label}</p>
      <ul className='space-y-0.5'>
        {payload.map((p) => (
          <li key={String(p.dataKey)} className='flex items-center gap-2'>
            <span
              className='inline-block w-2 h-2 rounded-full shrink-0'
              style={{ background: p.color }}
            />
            <span className='text-gray-500'>{p.name}:</span>
            <span className='font-medium text-gray-900'>
              {formatCompactNumber(Number(p.value))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function kpiRows(summary: AnalyticsSummary) {
  const replyRate = rfqReplyRatePct(summary);
  return [
    {
      key: 'revenue',
      title: 'รายได้รวม',
      value: formatCurrencyNoDecimals(summary.revenue_total),
      sub: 'ในช่วงที่เลือก',
      icon: TrendingUp,
      accent: PURPLE,
      iconBg: 'rgba(122,75,148,0.12)',
      to: '/factory/wallet',
    },
    {
      key: 'deposits',
      title: 'เงินรอรับ',
      value: formatCurrencyNoDecimals(summary.deposits_total),
      sub: 'กระเป๋าเงิน',
      icon: Wallet,
      accent: ORANGE,
      iconBg: 'rgba(227,136,68,0.12)',
      to: '/factory/wallet',
    },
    {
      key: 'orders',
      title: 'ออเดอร์ทั้งหมด',
      value: formatCompactNumber(summary.total_orders_total),
      sub: `ปิดสำเร็จ ${formatCompactNumber(summary.closed_orders_total)}`,
      icon: Package,
      accent: GREEN,
      iconBg: 'rgba(5,150,105,0.12)',
      to: '/factory/orders',
    },
    {
      key: 'rfq',
      title: 'RFQ ที่ได้รับ',
      value: formatCompactNumber(summary.rfq_received_total),
      sub: `ส่งตอบแล้ว ${formatCompactNumber(summary.rfq_replies_total)}`,
      icon: ClipboardList,
      accent: '#0EA5E9',
      iconBg: 'rgba(14,165,233,0.12)',
      to: '/factory/rfqs',
    },
    {
      key: 'replyrate',
      title: 'อัตราตอบ RFQ',
      value: `${replyRate}%`,
      sub: replyRate < 50 ? 'ต่ำกว่าเกณฑ์' : 'ดี',
      icon: MessageSquareReply,
      accent: replyRate < 50 ? 'var(--status-danger)' : '#10B981',
      iconBg: replyRate < 50 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
      to: '/factory/rfqs',
    },
  ] as const;
}

const VERIFY_STEPS = [
  { id: 1, label: 'ข้อมูลพื้นฐาน', icon: ClipboardList },
  { id: 2, label: 'ที่อยู่', icon: ShoppingBag },
  { id: 3, label: 'เอกสาร', icon: CheckCircle },
  { id: 4, label: 'อนุมัติ', icon: ShieldAlert },
];

function VerificationStepper({
  verifySt,
  verifyReason,
}: Readonly<{
  verifySt: string;
  verifyReason: string;
}>) {
  const isRejected = verifySt === 'RJ';
  const currentStep = isRejected ? 3 : verifySt === 'PD' ? 3 : 0;

  return (
    <div
      className='rounded-2xl p-5 relative overflow-hidden text-white shadow-md'
      style={{
        background: isRejected
          ? 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)'
          : 'linear-gradient(135deg, var(--brand-navy-deep) 0%, #4A267D 100%)',
      }}
    >
      <div
        className='absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20 blur-3xl'
        style={{ backgroundColor: isRejected ? '#FF5555' : ORANGE }}
      />
      <div
        className='absolute -left-6 -bottom-10 w-32 h-32 rounded-full opacity-10 blur-2xl'
        style={{ backgroundColor: 'var(--neutral-white)' }}
      />

      <div className='relative z-10'>
        <div className='flex items-start gap-3 mb-5'>
          <div
            className='p-2.5 rounded-xl shrink-0'
            style={{
              backgroundColor: isRejected ? 'rgba(255,100,100,0.2)' : 'rgba(227,136,68,0.2)',
              border: `1px solid ${isRejected ? 'rgba(255,100,100,0.35)' : 'rgba(227,136,68,0.35)'}`,
            }}
          >
            <AlertTriangle size={18} className='text-white' strokeWidth={2} />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='font-bold text-base leading-snug'>
              {isRejected ? 'บัญชีโรงงานไม่ผ่านการตรวจสอบ' : 'กำลังรอการอนุมัติจากแอดมิน'}
            </p>
            <p className='mt-1 text-sm opacity-80 leading-relaxed'>
              {isRejected
                ? verifyReason || 'กรุณาปรับข้อมูลและส่งตรวจสอบใหม่จากหน้าโปรไฟล์'
                : 'เมื่อแอดมินอนุมัติแล้ว คุณจะเข้าถึง RFQ ใบเสนอราคา และออเดอร์ได้'}
            </p>
          </div>
        </div>

        <div className='flex items-center mb-5'>
          {VERIFY_STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <React.Fragment key={step.id}>
                <div className='flex flex-col items-center gap-1.5 flex-1'>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done
                        ? 'bg-teal-400 text-white'
                        : active
                          ? 'bg-white/20 text-white border-2 border-white/60'
                          : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {done ? '✓' : step.id}
                  </div>
                  <span
                    className={`text-[10px] text-center leading-tight max-w-[56px] ${done ? 'text-teal-300' : active ? 'text-white' : 'text-white/50'}`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < VERIFY_STEPS.length - 1 && (
                  <div
                    className='h-0.5 flex-1 mb-5 mx-1'
                    style={{
                      backgroundColor: done ? 'rgba(52,211,153,0.6)' : 'rgba(255,255,255,0.15)',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <Link
          to='/factory/profile'
          className='inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-5 py-2.5 transition-all hover:opacity-90 active:scale-95'
          style={{
            backgroundColor: isRejected ? 'rgba(255,100,100,0.25)' : 'rgba(227,136,68,0.9)',
            border: `1px solid ${isRejected ? 'rgba(255,100,100,0.45)' : 'rgba(227,136,68,1)'}`,
          }}
        >
          {isRejected ? 'แก้ไขข้อมูลโรงงาน' : 'ตรวจสอบข้อมูลโรงงาน'}
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export function FactoryDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const verifySt = factoryVerifyStatus(user);
  const verifyReason = String(
    (user as Record<string, unknown> | null)?.verify_rejection_reason ??
      (user as Record<string, unknown> | null)?.rejection_reason ??
      '',
  ).trim();

  const factoryName =
    String(
      (user as Record<string, unknown> | null)?.factory_name ??
        (user as Record<string, unknown> | null)?.name ??
        'โรงงานของคุณ',
    ).trim() || 'โรงงานของคุณ';

  const isDesktop = useIsDesktop();
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('daily');
  const [statsRange, setStatsRange] = useState<'monthly' | 'quarterly' | 'annually'>('monthly');
  const [performanceTab, setPerformanceTab] = useState<'daily' | 'online' | 'new'>('daily');
  const { loading, error, summary, series, reload } = useFactoryDashboard(timeframe);

  const chartData = useMemo(() => series as AnalyticsSeriesPoint[], [series]);
  const kpis = useMemo(() => kpiRows(summary), [summary]);
  const funnelChartData = useMemo(
    () =>
      chartData.map((it) => ({
        label: it.label,
        received: it.rfq_received,
        replied: Math.max(it.rfq_replies, 0),
        ordered: Math.max(it.total_orders, 0),
        closed: Math.max(it.closed_orders, 0),
      })),
    [chartData],
  );

  const lineChartHeight = isDesktop ? 280 : 220;
  const barChartHeight = isDesktop ? 260 : 220;
  const barXAxisProps = isDesktop
    ? {
        angle: -25 as const,
        textAnchor: 'end' as const,
        height: 56,
        tick: { fontSize: 10, fill: SLATE },
      }
    : {
        angle: 0 as const,
        textAnchor: 'middle' as const,
        height: 36,
        tick: { fontSize: 9, fill: SLATE },
        interval: 'preserveStartEnd' as const,
      };

  if (loading) {
    return (
      <div className='space-y-4'>
        <FactoryPageHeader
          title='แดชบอร์ดวิเคราะห์ธุรกิจ'
          subtitle='Factory / Dashboard'
          icon={TrendingUp}
        />
        <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-5'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className='h-24 rounded-2xl bg-white border border-gray-100 animate-pulse'
            />
          ))}
        </div>
        <div className='flex flex-col items-center justify-center py-20 gap-3'>
          <div
            className='w-10 h-10 border-[3px] border-t-transparent rounded-full animate-spin'
            style={{ borderColor: COLORS.purple, borderTopColor: 'transparent' }}
          />
          <p className='text-sm text-gray-500'>กำลังโหลดแดชบอร์ด…</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-5 pb-8'>
      <FactoryPageHeader
        title='แดชบอร์ดวิเคราะห์ธุรกิจ'
        subtitle={`Factory / Dashboard · ${factoryName}`}
        icon={TrendingUp}
      />

      {verifySt !== 'AP' && <VerificationStepper verifySt={verifySt} verifyReason={verifyReason} />}

      {error ? (
        <div className='flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900'>
          <AlertTriangle size={16} className='shrink-0 text-amber-600' />
          <p className='flex-1'>{error}</p>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => void reload()}
            className='inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-90'
            style={{ backgroundColor: COLORS.orange, boxShadow: '0 2px 8px rgba(227,136,68,0.35)' }}
          >
            <RefreshCw size={14} />
            ลองอีกครั้ง
          </Button>
        </div>
      ) : null}

      <section className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-bold text-slate-900'>Overview Performance</h3>
          <span className='text-xs text-slate-500'>Factory KPI</span>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3'>
          {kpis.slice(0, 4).map((k) => {
            const Icon = k.icon;
            return (
              <Button
                variant='unstyled'
                key={k.key}
                type='button'
                onClick={() => navigate(k.to)}
                className='w-full text-left rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-all duration-200 group'
              >
                <div className='flex items-start justify-between gap-2'>
                  <div
                    className='rounded-xl p-2.5 flex items-center justify-center shrink-0'
                    style={{ backgroundColor: k.iconBg }}
                  >
                    <Icon size={18} style={{ color: k.accent }} strokeWidth={2} aria-hidden />
                  </div>
                  <ChevronRight
                    size={14}
                    className='text-gray-300 group-hover:text-gray-500 transition-colors mt-1'
                  />
                </div>
                <p className='mt-3 text-xs font-medium text-slate-500'>{k.title}</p>
                <p className='mt-1 text-3xl font-bold tabular-nums break-words leading-none text-slate-900'>
                  {k.value}
                </p>
                {k.sub ? <p className='mt-1 text-xs text-slate-400'>{k.sub}</p> : null}
              </Button>
            );
          })}
        </div>
      </section>

      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div>
          <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide'>
            ช่วงเวลาที่แสดง
          </p>
          <p className='text-sm font-semibold mt-0.5' style={{ color: COLORS.navy }}>
            วิเคราะห์รายได้และออเดอร์
          </p>
        </div>
        <div
          className='flex p-1 rounded-xl shrink-0'
          style={{ backgroundColor: 'rgba(46,34,82,0.07)' }}
          role='tablist'
          aria-label='ช่วงเวลา'
        >
          {TIMEFRAMES.map(({ id, label }) => {
            const on = timeframe === id;
            return (
              <Button
                variant='unstyled'
                key={id}
                type='button'
                role='tab'
                aria-selected={on}
                onClick={() => setTimeframe(id)}
                className='px-4 py-2 rounded-lg text-sm font-medium transition-all'
                style={
                  on
                    ? {
                        backgroundColor: COLORS.orange,
                        color: COLORS.white,
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: COLORS.navy,
                        fontWeight: 500,
                      }
                }
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      <section className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
        <div className='flex items-center justify-between mb-2'>
          <div>
            <h3 className='text-lg font-bold text-slate-900'>Users & Revenue Statistics</h3>
            <p className='text-sm text-slate-500'>รายได้ มัดจำ และออเดอร์ตามช่วงเวลา</p>
          </div>
          <div className='flex p-1 rounded-xl bg-slate-100'>
            {[
              { id: 'monthly', label: 'Monthly' },
              { id: 'quarterly', label: 'Quarterly' },
              { id: 'annually', label: 'Annually' },
            ].map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => setStatsRange(item.id as typeof statsRange)}
                className='px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors'
                style={{
                  background: statsRange === item.id ? '#fff' : 'transparent',
                  color: statsRange === item.id ? '#0F172A' : '#64748B',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className='w-full min-w-0 mt-4' style={{ height: lineChartHeight + 40 }}>
          <ResponsiveContainer width='100%' height='100%'>
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: isDesktop ? 8 : 4, left: 0, bottom: isDesktop ? 0 : 4 }}
            >
              <CartesianGrid strokeDasharray='3 3' stroke='var(--neutral-slate-muted)' />
              <XAxis
                dataKey='label'
                tick={{ fontSize: isDesktop ? 11 : 9, fill: SLATE }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId='money'
                tickFormatter={compactAxis}
                tick={{ fontSize: 11, fill: SLATE }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <YAxis yAxisId='count' orientation='right' hide />
              <Tooltip content={<MoneyTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                yAxisId='count'
                dataKey='total_orders'
                name='Orders'
                fill='rgba(99,102,241,0.25)'
                radius={[6, 6, 0, 0]}
                maxBarSize={20}
              />
              <Line
                yAxisId='money'
                type='monotone'
                dataKey='revenue'
                name='Revenue'
                stroke={PURPLE}
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: PURPLE }}
              />
              <Line
                yAxisId='money'
                type='monotone'
                dataKey='deposits'
                name='Deposit'
                stroke={ORANGE}
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: ORANGE }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className='grid gap-5 lg:grid-cols-5'>
        <div className='lg:col-span-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
          <div className='flex items-center justify-between mb-1'>
            <div>
              <h3 className='text-lg font-bold text-slate-900'>Conversion Funnel</h3>
              <p className='text-xs text-gray-400 mt-0.5'>RFQ ที่ได้รับ → ตอบกลับ → ออเดอร์ → ปิดสำเร็จ</p>
            </div>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate('/factory/rfqs')}
              className='text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity'
              style={{ color: COLORS.orange }}
            >
              จัดการ RFQ <ArrowRight size={12} />
            </Button>
          </div>
          <div className='w-full min-w-0 mt-4' style={{ height: barChartHeight + 20 }}>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={funnelChartData}
                margin={{ top: 8, right: isDesktop ? 8 : 4, left: 0, bottom: isDesktop ? 0 : 2 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='var(--neutral-slate-muted)' />
                <XAxis
                  dataKey='label'
                  interval={0}
                  {...barXAxisProps}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: SLATE }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<CountTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey='received' name='RFQ Received' stackId='funnel' fill='#3730A3' />
                <Bar dataKey='replied' name='Replied' stackId='funnel' fill='#4F46E5' />
                <Bar dataKey='ordered' name='Ordered' stackId='funnel' fill='#818CF8' />
                <Bar dataKey='closed' name='Closed' stackId='funnel' fill='#BFDBFE' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className='lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-lg font-bold text-slate-900'>Product Performance</h3>
          </div>
          <div className='grid grid-cols-3 rounded-xl bg-slate-100 p-1 mb-3'>
            {[
              { id: 'daily', label: 'Daily Sales' },
              { id: 'online', label: 'Online Sales' },
              { id: 'new', label: 'New Users' },
            ].map((tab) => (
              <button
                key={tab.id}
                type='button'
                onClick={() => setPerformanceTab(tab.id as typeof performanceTab)}
                className='rounded-lg py-2 text-xs font-semibold transition-colors'
                style={{
                  background: performanceTab === tab.id ? '#fff' : 'transparent',
                  color: performanceTab === tab.id ? '#0F172A' : '#64748B',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className='rounded-xl border border-slate-200 p-3 mb-3 grid grid-cols-2 gap-3'>
            <div>
              <p className='text-xs text-slate-500'>RFQ ตอบกลับ</p>
              <p className='text-3xl font-bold text-slate-900 tabular-nums'>
                {formatCompactNumber(summary.rfq_replies_total)}
              </p>
            </div>
            <div>
              <p className='text-xs text-slate-500'>ปิดสำเร็จ</p>
              <p className='text-3xl font-bold text-slate-900 tabular-nums'>
                {formatCompactNumber(summary.closed_orders_total)}
              </p>
            </div>
          </div>
          <div className='rounded-xl border border-slate-200 p-3'>
            <p className='text-xs text-slate-500 mb-1'>Average Daily Orders</p>
            <p className='text-2xl font-bold text-slate-900 tabular-nums mb-3'>
              {summary.total_orders_total > 0
                ? (summary.total_orders_total / Math.max(chartData.length, 1)).toFixed(1)
                : '0.0'}
            </p>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='var(--neutral-slate-muted)' />
                  <XAxis
                    dataKey='label'
                    tick={{ fontSize: 10, fill: SLATE }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<CountTooltip />} />
                  <Bar dataKey='total_orders' fill='#4F46E5' radius={[6, 6, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className='grid gap-5 lg:grid-cols-5'>
        <div className='lg:col-span-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
          <div className='flex items-center justify-between mb-1'>
            <div>
              <h3 className='text-sm font-bold' style={{ color: COLORS.navy }}>
                รายได้
              </h3>
              <p className='text-xs text-gray-400 mt-0.5'>รายได้และมัดจำ เปรียบเทียบตามช่วงเวลา</p>
            </div>
            <span
              className='text-[10px] font-semibold px-2.5 py-1 rounded-full'
              style={{ backgroundColor: 'rgba(122,75,148,0.1)', color: COLORS.purple }}
            >
              {TIMEFRAMES.find((t) => t.id === timeframe)?.label}
            </span>
          </div>
          <div className='w-full min-w-0 mt-4' style={{ height: lineChartHeight }}>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={chartData}
                margin={{ top: 8, right: isDesktop ? 8 : 4, left: 0, bottom: isDesktop ? 0 : 4 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='var(--neutral-slate-muted)' />
                <XAxis
                  dataKey='label'
                  tick={{ fontSize: isDesktop ? 11 : 9, fill: SLATE }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={compactAxis}
                  tick={{ fontSize: 11, fill: SLATE }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip content={<MoneyTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type='monotone'
                  dataKey='revenue'
                  name='รายได้'
                  stroke={PURPLE}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: PURPLE }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type='monotone'
                  dataKey='deposits'
                  name='มัดจำ'
                  stroke={ORANGE}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: ORANGE }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className='lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
          <div className='flex items-center justify-between mb-1'>
            <div>
              <h3 className='text-sm font-bold' style={{ color: COLORS.navy }}>
                คำสั่งซื้อ
              </h3>
              <p className='text-xs text-gray-400 mt-0.5'>ออเดอร์ทั้งหมดและปิดสำเร็จ</p>
            </div>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate('/factory/orders')}
              className='text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity'
              style={{ color: COLORS.purple }}
            >
              ดูทั้งหมด <ArrowRight size={12} />
            </Button>
          </div>
          <div className='w-full min-w-0 mt-4' style={{ height: barChartHeight }}>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={chartData}
                margin={{ top: 8, right: isDesktop ? 8 : 4, left: 0, bottom: isDesktop ? 0 : 2 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='var(--neutral-slate-muted)' />
                <XAxis
                  dataKey='label'
                  interval={0}
                  {...barXAxisProps}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: SLATE }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<CountTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey='total_orders'
                  name='ออเดอร์รวม'
                  fill={PURPLE}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey='closed_orders'
                  name='ปิดสำเร็จ'
                  fill={GREEN}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

       
    </div>
  );
}
