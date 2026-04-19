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

const TIMEFRAMES: { id: AnalyticsTimeframe; label: string }[] = [
  { id: 'daily', label: 'วัน' },
  { id: 'weekly', label: 'สัปดาห์' },
  { id: 'monthly', label: 'เดือน' },
];

const PURPLE = '#A238FF';
const ORANGE = '#F28A2E';
const GREEN = '#059669';
const SLATE = '#94A3B8';

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
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}18` }}
        >
          <Icon size={20} style={{ color: accent }} strokeWidth={2} aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-[11px] font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="mt-1 text-base sm:text-lg font-bold text-gray-900 tabular-nums break-words">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p> : null}
    </div>
  );
}

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
      accent: '#7C3AED',
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
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div
          className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
        />
        <p className="text-sm text-gray-500">กำลังโหลดแดชบอร์ด…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-8 sm:pb-10 w-full min-w-0">
      {verifySt !== 'AP' ? (
        <div
          className={`rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-start gap-3 ${
            verifySt === 'RJ'
              ? 'border-rose-200 bg-rose-50/90 text-rose-950'
              : 'border-amber-200 bg-amber-50/90 text-amber-950'
          }`}
          role="status"
        >
          <AlertTriangle
            className={`w-5 h-5 shrink-0 mt-0.5 ${verifySt === 'RJ' ? 'text-rose-600' : 'text-amber-600'}`}
            strokeWidth={2}
            aria-hidden
          />
          <div className="flex-1 min-w-0 text-sm leading-relaxed">
            <p className="font-bold">
              {verifySt === 'RJ' ? 'บัญชีโรงงานไม่ผ่านการตรวจสอบ' : 'โรงงานอยู่ระหว่างตรวจสอบ'}
            </p>
            <p className="mt-1 opacity-95">
              {verifySt === 'RJ'
                ? verifyReason || 'กรุณาปรับข้อมูลและส่งตรวจสอบใหม่จากหน้าโปรไฟล์'
                : 'เมื่อแอดมินอนุมัติแล้ว คุณจะเข้า Showcase, กระดาน RFQ, ใบเสนอราคา และออเดอร์ได้'}
            </p>
            <Link
              to="/factory/profile"
              className="inline-block mt-3 text-sm font-semibold underline underline-offset-2 hover:opacity-90"
            >
              ไปที่ข้อมูลโรงงาน →
            </Link>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="flex-1">{error}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
          >
            <RefreshCw size={16} />
            ลองอีกครั้ง
          </button>
        </div>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">วิเคราะห์ธุรกิจ</p>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">แดชบอร์ดโรงงาน</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            KPI หลักจาก <code className="text-[10px] bg-gray-100 px-1 rounded">GET /factories/me/analytics</code> และ{' '}
            <code className="text-[10px] bg-gray-100 px-1 rounded">GET /factories/me/dashboard</code> (ถ้า API ล้มเหลวจะใช้ค่าที่คำนวณจากออเดอร์/RFQ ฝั่ง client); กราฟยังคำนวณจากออเดอร์ตามช่วงเวลา
          </p>
        </div>
        <div
          className="flex p-1 rounded-2xl bg-gray-100 w-fit max-w-full flex-wrap shrink-0"
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
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  on ? 'text-white shadow-md' : 'text-gray-600 hover:bg-white/80'
                }`}
                style={
                  on
                    ? { background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }
                    : undefined
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-1">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-1">รายได้และมัดจำ</h2>
          <p className="text-xs text-gray-500 mb-4">เปรียบเทียบตามช่วงเวลา</p>
          <div className="w-full min-w-0" style={{ height: lineChartHeight }}>
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

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm min-w-0">
            <h2 className="text-sm font-bold text-gray-900 mb-1">ออเดอร์</h2>
            <p className="text-xs text-gray-500 mb-4">ทั้งหมดและปิดสำเร็จ</p>
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
                  <Bar dataKey="total_orders" name="ออเดอร์รวม" fill={PURPLE} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="closed_orders" name="ปิดสำเร็จ" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-1">RFQ ที่ได้รับ vs การตอบกลับ</h2>
            <p className="text-xs text-gray-500 mb-4">
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
