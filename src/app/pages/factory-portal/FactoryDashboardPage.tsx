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
import { Link } from 'react-router';
import {
  TrendingUp,
  PiggyBank,
  CheckCircle2,
  Package,
  MessageSquareReply,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { factoryVerifyStatus } from '../../components/factory/FactoryVerifiedGuard';
import {
  useFactoryDashboard,
  type AnalyticsTimeframe,
  type AnalyticsSummary,
  type AnalyticsSeriesPoint,
} from './hooks/useFactoryDashboard';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { FactoryPageHeader } from './components/FactoryPageHeader';

// ── Design tokens ──────────────────────────────────────────────────────────
const COLORS = {
  purple: '#7A4B94',
  purpleLight: '#9D77B2',
  orange: '#E38844',
  blue: '#2E2252',
  lightPurpleBg: '#F8F6FA',
  teal: '#0D9488',
  white: '#FFFFFF',
};

const TIMEFRAMES: { id: AnalyticsTimeframe; label: string }[] = [
  { id: 'daily', label: 'วัน' },
  { id: 'weekly', label: 'สัปดาห์' },
  { id: 'monthly', label: 'เดือน' },
];

// Chart palette
const PURPLE = '#7A4B94';
const ORANGE = '#E38844';
const GREEN = '#059669';
const SLATE = '#94A3B8';

// ── Formatters ─────────────────────────────────────────────────────────────
function formatBaht(n: number): string {
  return `฿${n.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
}

function compactAxis(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

function rfqReplyRatePct(summary: AnalyticsSummary): number {
  if (summary.rfq_received_total <= 0) return 0;
  return Math.round((summary.rfq_replies_total / summary.rfq_received_total) * 100);
}

// ── Tooltip components ─────────────────────────────────────────────────────
type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string;
};

function MoneyTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-gray-500">{p.name}:</span>
            <span className="font-medium text-gray-900">
              {p.dataKey === 'revenue' || p.dataKey === 'deposits'
                ? formatBaht(Number(p.value))
                : Number(p.value).toLocaleString('th-TH')}
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
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-gray-500">{p.name}:</span>
            <span className="font-medium text-gray-900">
              {Number(p.value).toLocaleString('th-TH')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number }>;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="rounded-xl p-2.5 flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}1F` }}
        >
          <Icon size={20} style={{ color: accent }} strokeWidth={2} aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide" style={{ color: '#6B7280' }}>{title}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums break-words" style={{ color: COLORS.blue }}>{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p> : null}
    </div>
  );
}

// ── KPI rows builder ───────────────────────────────────────────────────────
function kpiRows(summary: AnalyticsSummary) {
  return [
    {
      key: 'revenue',
      title: 'รายได้รวม',
      value: formatBaht(summary.revenue_total),
      sub: 'ในช่วงที่เลือก',
      icon: TrendingUp,
      accent: PURPLE,
    },
    {
      key: 'deposits',
      title: 'เงินรอรับ (กระเป๋า)',
      value: formatBaht(summary.deposits_total),
      sub: 'pending_fund จาก wallets/me',
      icon: PiggyBank,
      accent: ORANGE,
    },
    {
      key: 'closed',
      title: 'ปิดงานสำเร็จ',
      value: summary.closed_orders_total.toLocaleString('th-TH'),
      sub: 'ออเดอร์',
      icon: CheckCircle2,
      accent: GREEN,
    },
    {
      key: 'orders',
      title: 'ออเดอร์รวม',
      value: summary.total_orders_total.toLocaleString('th-TH'),
      sub: 'ทั้งหมดในช่วง',
      icon: Package,
      accent: COLORS.purple,
    },
    {
      key: 'rfq',
      title: 'ใบเสนอราคา / RFQ ที่ match',
      value: `${summary.pending_quotations_total.toLocaleString('th-TH')} รอ · ส่งแล้ว ${summary.rfq_replies_total.toLocaleString('th-TH')}`,
      sub: `RFQ ที่ตรงหมวด (matching) ${summary.rfq_received_total.toLocaleString('th-TH')} · อัตราตอบกลับ ${rfqReplyRatePct(summary)}%`,
      icon: MessageSquareReply,
      accent: '#0EA5E9',
    },
  ] as const;
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: COLORS.orange }}
      />
      <h2 className="text-base font-bold" style={{ color: COLORS.blue }}>{title}</h2>
      {sub ? <p className="text-xs text-gray-500 ml-1">{sub}</p> : null}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export function FactoryDashboardPage() {
  const { user } = useAuth();
  const verifySt = factoryVerifyStatus(user);
  const verifyReason = String(
    (user as Record<string, unknown> | null)?.verify_rejection_reason ??
      (user as Record<string, unknown> | null)?.rejection_reason ??
      '',
  ).trim();

  const isDesktop = useIsDesktop();
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('daily');
  const { loading, error, summary, series, reload } = useFactoryDashboard(timeframe);

  const chartData = useMemo(() => series as AnalyticsSeriesPoint[], [series]);
  const kpis = useMemo(() => kpiRows(summary), [summary]);

  const lineChartHeight = isDesktop ? 280 : 220;
  const barChartHeight = isDesktop ? 260 : 220;
  const barXAxisProps = isDesktop
    ? { angle: -25 as const, textAnchor: 'end' as const, height: 56, tick: { fontSize: 10 } }
    : { angle: 0 as const, textAnchor: 'middle' as const, height: 36, tick: { fontSize: 9 }, interval: 'preserveStartEnd' as const };

  if (loading) {
    return (
      <div className="space-y-4">
        <FactoryPageHeader title="แดชบอร์ดวิเคราะห์ธุรกิจ" subtitle="Factory Portal" icon={TrendingUp} />
        <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div
          className="w-10 h-10 border-[3px] border-t-transparent rounded-full animate-spin"
          style={{ borderColor: COLORS.purple, borderTopColor: 'transparent' }}
        />
        <p className="text-sm text-gray-500">กำลังโหลดแดชบอร์ด…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FactoryPageHeader title="แดชบอร์ดวิเคราะห์ธุรกิจ" subtitle="ภาพรวมโรงงานของคุณ" icon={TrendingUp} />

      {/* ── Verify guard banner ── */}
      {verifySt !== 'AP' ? (
        <div
          className="rounded-2xl p-5 relative overflow-hidden text-white shadow-md"
          style={{
            background:
              verifySt === 'RJ'
                ? 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)'
                : 'linear-gradient(135deg, #2D1B4E 0%, #4A267D 100%)',
          }}
          role="status"
        >
          {/* decorative blur */}
          <div
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-30 blur-2xl"
            style={{ backgroundColor: verifySt === 'RJ' ? '#FF5555' : '#FF7A00' }}
          />
          <div className="relative z-10 flex items-start gap-3">
            <div
              className="p-2 rounded-full shrink-0 mt-0.5"
              style={{
                backgroundColor:
                  verifySt === 'RJ'
                    ? 'rgba(255,100,100,0.25)'
                    : 'rgba(227,136,68,0.25)',
                border:
                  verifySt === 'RJ'
                    ? '1px solid rgba(255,100,100,0.40)'
                    : '1px solid rgba(227,136,68,0.40)',
              }}
            >
              <AlertTriangle size={16} className="text-white" strokeWidth={2} aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">
                {verifySt === 'RJ' ? 'บัญชีโรงงานไม่ผ่านการตรวจสอบ' : 'โรงงานอยู่ระหว่างตรวจสอบ'}
              </p>
              <p className="mt-1 text-sm opacity-90 leading-relaxed">
                {verifySt === 'RJ'
                  ? verifyReason || 'กรุณาปรับข้อมูลและส่งตรวจสอบใหม่จากหน้าโปรไฟล์'
                  : 'เมื่อแอดมินอนุมัติแล้ว คุณจะเข้า Showcase, กระดาน RFQ, ใบเสนอราคา และออเดอร์ได้'}
              </p>
              <Link
                to="/factory/profile"
                className="inline-block mt-3 text-sm font-semibold rounded-xl px-4 py-1.5 transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.30)',
                }}
              >
                ไปที่ข้อมูลโรงงาน →
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Error banner ── */}
      {error ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          <p className="flex-1">{error}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
            style={{
              backgroundColor: COLORS.orange,
              boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
            }}
          >
            <RefreshCw size={16} />
            ลองอีกครั้ง
          </button>
        </div>
      ) : null}

      {/* ── Timeframe tabs ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: COLORS.purpleLight }}>
            วิเคราะห์ธุรกิจ
          </p>
          <h1 className="text-lg sm:text-xl font-bold" style={{ color: COLORS.blue }}>
            แดชบอร์ดโรงงาน
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            KPI หลักจาก{' '}
            <code className="text-[10px] bg-white px-1 rounded border border-gray-200">
              GET /factories/me/analytics
            </code>{' '}
            และ{' '}
            <code className="text-[10px] bg-white px-1 rounded border border-gray-200">
              GET /factories/me/dashboard
            </code>{' '}
            (ถ้า API ล้มเหลวจะใช้ค่าที่คำนวณจากออเดอร์/RFQ ฝั่ง client); กราฟยังคำนวณจากออเดอร์ตามช่วงเวลา
          </p>
        </div>

        {/* Tab bar */}
        <div
          className="flex p-1 rounded-xl w-fit max-w-full flex-wrap shrink-0"
          style={{ backgroundColor: 'rgba(46,34,82,0.07)' }}
          role="tablist"
          aria-label="ช่วงเวลา"
        >
          {TIMEFRAMES.map(({ id, label }) => {
            const on = timeframe === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTimeframe(id)}
                className="px-4 py-2 rounded-lg text-sm transition-all"
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
                        color: COLORS.blue,
                        fontWeight: 500,
                      }
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <KpiCard
            key={k.key}
            title={k.title}
            value={k.value}
            sub={k.sub}
            icon={k.icon}
            accent={k.accent}
          />
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-5 lg:grid-cols-1">

        {/* Revenue line chart */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
          <SectionHeader title="รายได้และมัดจำ" sub="เปรียบเทียบตามช่วงเวลา" />
          <div className="w-full min-w-0 mt-4" style={{ height: lineChartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: isDesktop ? 8 : 4, left: 0, bottom: isDesktop ? 0 : 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: isDesktop ? 11 : 9 }} stroke={SLATE} />
                <YAxis
                  tickFormatter={compactAxis}
                  tick={{ fontSize: 11 }}
                  stroke={SLATE}
                  width={44}
                />
                <Tooltip content={<MoneyTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="รายได้"
                  stroke={PURPLE}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="deposits"
                  name="มัดจำ"
                  stroke={ORANGE}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Orders bar chart */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm min-w-0">
            <SectionHeader title="ออเดอร์" sub="ทั้งหมดและปิดสำเร็จ" />
            <div className="w-full min-w-0 mt-4" style={{ height: barChartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: isDesktop ? 8 : 4, left: 0, bottom: isDesktop ? 0 : 2 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="label" stroke={SLATE} interval={0} {...barXAxisProps} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke={SLATE} width={36} />
                  <Tooltip content={<CountTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="total_orders" name="ออเดอร์รวม" fill={PURPLE} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="closed_orders" name="ปิดสำเร็จ" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RFQ bar chart */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
            <SectionHeader title="RFQ ที่ได้รับ vs การตอบกลับ" />
            <p className="text-xs text-gray-500 mb-4 mt-0.5">
              ช่วงเวลาอิงจากวันที่สร้าง (ถ้า API ไม่ส่งวันที่ จะกระจายค่าโดยประมาณเพื่อให้เห็นแนวโน้ม)
            </p>
            <div className="w-full min-w-0" style={{ height: barChartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: isDesktop ? 8 : 4, left: 0, bottom: isDesktop ? 0 : 2 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="label" stroke={SLATE} interval={0} {...barXAxisProps} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke={SLATE} width={36} />
                  <Tooltip content={<CountTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="rfq_received" name="RFQ ที่ได้รับ" fill={SLATE} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="rfq_replies" name="ตอบกลับ" fill={ORANGE} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
