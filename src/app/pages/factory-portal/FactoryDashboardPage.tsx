import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
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
  const { loading, error, summary, series, reload } = useFactoryDashboard(timeframe);

  const chartData = useMemo(() => series as AnalyticsSeriesPoint[], [series]);
  const kpis = useMemo(() => kpiRows(summary), [summary]);

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

      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Button
              variant='unstyled'
              key={k.key}
              type='button'
              onClick={() => navigate(k.to)}
              className='w-full text-left rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group'
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
              <p className='mt-3 text-[11px] font-medium uppercase tracking-wide text-gray-500'>
                {k.title}
              </p>
              <p
                className='mt-1 text-xl font-bold tabular-nums break-words leading-none'
                style={{ color: COLORS.navy }}
              >
                {k.value}
              </p>
              {k.sub ? <p className='mt-1 text-[11px] text-gray-400'>{k.sub}</p> : null}
            </Button>
          );
        })}
      </div>

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
          aria
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

      <div className='grid gap-5 lg:grid-cols-2'>
        {/* ── Pipeline ธุรกิจ ── */}
        <div className='rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col'>
          {/* header */}
          <div className='px-5 py-4 border-b border-gray-50 flex items-center justify-between'>
            <div>
              <h3 className='text-sm font-bold' style={{ color: COLORS.navy }}>
                Pipeline ธุรกิจ
              </h3>
              <p className='text-xs text-gray-400 mt-0.5'>Conversion ตั้งแต่ RFQ ถึงยอดขาย</p>
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

          {/* funnel stages */}
          <div className='px-5 py-4 flex-1 space-y-4'>
            {(() => {
              const stages = [
                {
                  label: 'RFQ ที่ได้รับ',
                  sub: 'คำขอใบเสนอราคาทั้งหมด',
                  count: summary.rfq_received_total,
                  barColor: '#6366F1',
                  textColor: 'text-indigo-600',
                  bgColor: 'bg-indigo-50',
                  iconColor: 'text-indigo-500',
                  Icon: ClipboardList,
                  pct: 100,
                  to: '/factory/rfqs',
                },
                {
                  label: 'ส่งใบเสนอราคาแล้ว',
                  sub: 'ตอบกลับ RFQ',
                  count: summary.rfq_replies_total,
                  barColor: '#0EA5E9',
                  textColor: 'text-sky-600',
                  bgColor: 'bg-sky-50',
                  iconColor: 'text-sky-500',
                  Icon: MessageSquareReply,
                  pct:
                    summary.rfq_received_total > 0
                      ? Math.round((summary.rfq_replies_total / summary.rfq_received_total) * 100)
                      : 0,
                  to: '/factory/rfqs',
                },
                {
                  label: 'ออเดอร์ที่ได้รับ',
                  sub: 'ลูกค้ายืนยันแล้ว',
                  count: summary.total_orders_total,
                  barColor: '#F59E0B',
                  textColor: 'text-amber-600',
                  bgColor: 'bg-amber-50',
                  iconColor: 'text-amber-500',
                  Icon: Package,
                  pct:
                    summary.rfq_replies_total > 0
                      ? Math.round((summary.total_orders_total / summary.rfq_replies_total) * 100)
                      : 0,
                  to: '/factory/orders',
                },
                {
                  label: 'ปิดการขายสำเร็จ',
                  sub: 'ดำเนินการเสร็จสิ้น',
                  count: summary.closed_orders_total,
                  barColor: '#10B981',
                  textColor: 'text-emerald-600',
                  bgColor: 'bg-emerald-50',
                  iconColor: 'text-emerald-500',
                  Icon: CheckCircle,
                  pct:
                    summary.total_orders_total > 0
                      ? Math.round(
                          (summary.closed_orders_total / summary.total_orders_total) * 100,
                        )
                      : 0,
                  to: '/factory/orders',
                },
              ];
              return stages.map((s, i) => (
                <button
                  key={s.label}
                  type='button'
                  onClick={() => navigate(s.to)}
                  className='w-full text-left group'
                >
                  <div className='flex items-center gap-3 mb-1.5'>
                    {/* step number + icon */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.bgColor} transition-transform group-hover:scale-110`}
                    >
                      <s.Icon size={13} className={s.iconColor} />
                    </div>
                    {/* label */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-baseline justify-between gap-2'>
                        <span className='text-xs font-semibold text-gray-700 truncate'>
                          {s.label}
                        </span>
                        <span className={`text-sm font-bold shrink-0 ${s.textColor}`}>
                          {formatCompactNumber(s.count)}
                        </span>
                      </div>
                      <div className='flex items-center justify-between gap-2 mt-0.5'>
                        <span className='text-[10px] text-gray-400 truncate'>{s.sub}</span>
                        <span className='text-[10px] text-gray-400 shrink-0'>
                          {i === 0 ? '100%' : `${s.pct}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* progress bar */}
                  <div className='ml-10 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden'>
                    <div
                      className='h-full rounded-full transition-all duration-700'
                      style={{
                        width: `${Math.min(i === 0 ? 100 : s.pct, 100)}%`,
                        backgroundColor: s.barColor,
                      }}
                    />
                  </div>
                </button>
              ));
            })()}
          </div>

          {/* urgent action — pending quotations */}
          {summary.pending_quotations_total > 0 && (
            <div className='mx-5 mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3'>
              <div className='w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0'>
                <AlertTriangle size={13} className='text-amber-600' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-xs font-semibold text-amber-800'>
                  มี {summary.pending_quotations_total} RFQ รอการตอบกลับ
                </p>
                <p className='text-[11px] text-amber-600 mt-0.5'>ตอบเร็วเพื่อเพิ่มโอกาสได้ออเดอร์</p>
              </div>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate('/factory/rfqs')}
                className='shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors'
              >
                ตอบเลย
              </Button>
            </div>
          )}

          {/* footer metrics */}
          <div className='px-5 py-3 border-t border-gray-50 flex gap-4 flex-wrap'>
            <div className='flex items-center gap-1.5'>
              <span className='w-2 h-2 rounded-full bg-sky-400' />
              <span className='text-[11px] text-gray-500'>
                Reply Rate:{' '}
                <span className='font-semibold text-gray-700'>{rfqReplyRatePct(summary)}%</span>
              </span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='w-2 h-2 rounded-full bg-emerald-400' />
              <span className='text-[11px] text-gray-500'>
                Close Rate:{' '}
                <span className='font-semibold text-gray-700'>
                  {summary.total_orders_total > 0
                    ? Math.round(
                        (summary.closed_orders_total / summary.total_orders_total) * 100,
                      )
                    : 0}
                  %
                </span>
              </span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='w-2 h-2 rounded-full' style={{ backgroundColor: SLATE }} />
              <span className='text-[11px] text-gray-500'>
                รายได้:{' '}
                <span className='font-semibold text-gray-700'>
                  {formatCurrencyNoDecimals(summary.revenue_total)}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className='rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden'>
          <div className='px-5 py-4 border-b border-gray-50 flex items-center justify-between'>
            <div>
              <h3 className='text-sm font-bold' style={{ color: COLORS.navy }}>
                คำสั่งซื้อล่าสุด
              </h3>
              <p className='text-xs text-gray-400 mt-0.5'>สถานะออเดอร์ในช่วงนี้</p>
            </div>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate('/factory/orders')}
              className='text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity'
              style={{ color: COLORS.orange }}
            >
              ดูทั้งหมด <ArrowRight size={12} />
            </Button>
          </div>

          <div className='p-4 grid grid-cols-3 gap-3'>
            <div className='rounded-xl border border-gray-100 bg-gray-50 p-3 text-center'>
              <p className='text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1'>
                ทั้งหมด
              </p>
              <p className='text-xl font-bold' style={{ color: COLORS.navy }}>
                {formatCompactNumber(summary.total_orders_total)}
              </p>
              <p className='text-[10px] text-gray-400 mt-0.5'>ออเดอร์</p>
            </div>
            <div className='rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center'>
              <p className='text-[10px] text-emerald-500 font-medium uppercase tracking-wide mb-1'>
                ปิดสำเร็จ
              </p>
              <p className='text-xl font-bold text-emerald-600'>
                {formatCompactNumber(summary.closed_orders_total)}
              </p>
              <p className='text-[10px] text-emerald-400 mt-0.5'>ออเดอร์</p>
            </div>
            <div className='rounded-xl border border-amber-100 bg-amber-50 p-3 text-center'>
              <p className='text-[10px] text-amber-500 font-medium uppercase tracking-wide mb-1'>
                กำลังดำเนินการ
              </p>
              <p className='text-xl font-bold text-amber-600'>
                {formatCompactNumber(
                  Math.max(
                    summary.total_orders_total - summary.closed_orders_total,
                    0,
                  ),
                )}
              </p>
              <p className='text-[10px] text-amber-400 mt-0.5'>ออเดอร์</p>
            </div>
          </div>

          <div className='px-4 pb-4'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate('/factory/orders')}
              className='w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2'
              style={{
                backgroundColor: COLORS.purple,
                boxShadow: '0 2px 8px rgba(122,75,148,0.3)',
              }}
            >
              จัดการคำสั่งซื้อ
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
        <div className='flex items-center justify-between mb-1'>
          <div>
            <h3 className='text-sm font-bold' style={{ color: COLORS.navy }}>
              RFQ ที่ได้รับ vs การตอบกลับ
            </h3>
            <p className='text-xs text-gray-400 mt-0.5'>
              เปรียบเทียบจำนวน RFQ ที่ได้รับและที่ตอบกลับ
            </p>
          </div>

          <div
            className='flex items-center gap-2 rounded-xl px-3 py-2'
            style={{
              backgroundColor:
                rfqReplyRatePct(summary) < 50 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
            }}
          >
            <span className='text-[10px] font-medium text-gray-500'>อัตราตอบ</span>
            <span
              className='text-base font-bold tabular-nums'
              style={{ color: rfqReplyRatePct(summary) < 50 ? 'var(--status-danger)' : '#10B981' }}
            >
              {rfqReplyRatePct(summary)}%
            </span>
          </div>
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
                dataKey='rfq_received'
                name='RFQ ที่ได้รับ'
                fill={SLATE}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey='rfq_replies'
                name='ตอบกลับ'
                fill={ORANGE}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {rfqReplyRatePct(summary) < 50 && summary.rfq_received_total > 0 && (
          <div className='mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3'>
            <AlertTriangle size={16} className='text-amber-500 shrink-0 mt-0.5' />
            <div>
              <p className='text-sm font-semibold text-amber-800'>อัตราตอบ RFQ ต่ำ</p>
              <p className='text-xs text-amber-600 mt-0.5'>
                คุณตอบ RFQ เพียง {rfqReplyRatePct(summary)}% — การตอบกลับสูงขึ้นช่วยให้ได้งานมากขึ้น
              </p>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => navigate('/factory/rfqs')}
                className='mt-2 text-xs font-semibold text-amber-700 underline hover:text-amber-900'
              >
                ไปตอบ RFQ ที่รอ →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
