import { useCallback, useEffect, useMemo, useState } from 'react';
import { runAsyncAction } from '@/utils/asyncAction';
import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { rfqsApi, quotationsApi } from '@/services/api/rfqApi';
import { ordersApi } from '@/services/api/ordersApi';
import { walletApi } from '@/services/api/userApi';
import { factoriesApi } from '@/services/api/factoryApi';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

export type AnalyticsTimeframe = 'daily' | 'weekly' | 'monthly';

export type AnalyticsSeriesPoint = {
  label: string;
  periodStart?: string;
  revenue: number;
  deposits: number;
  closed_orders: number;
  total_orders: number;
  rfq_received: number;
  rfq_replies: number;
};

export type AnalyticsSummary = {
  revenue_total: number;
  deposits_total: number;
  closed_orders_total: number;
  total_orders_total: number;
  rfq_received_total: number;
  rfq_replies_total: number;
  pending_quotations_total: number;
};

function orderFactoryId(row: Record<string, unknown>): number | null {
  const inner = (row.order as Record<string, unknown>) ?? row;
  const n = pickScalarNumber(inner.factory_id, row.factory_id, row.factoryId);
  return Number.isFinite(n) ? n : null;
}

function orderStatus(row: Record<string, unknown>): string {
  const inner = (row.order as Record<string, unknown>) ?? row;
  return pickScalarString(inner.status, row.status).toUpperCase();
}

function orderCreatedTs(row: Record<string, unknown>): number | null {
  const inner = (row.order as Record<string, unknown>) ?? row;
  const raw = pickScalarString(inner.created_at, row.created_at, inner.updated_at, row.updated_at);
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : null;
}

function orderTotalAmount(row: Record<string, unknown>): number {
  const inner = (row.order as Record<string, unknown>) ?? row;
  return pickScalarNumber(
    inner.total_amount,
    inner.totalAmount,
    row.total_amount,
    row.totalAmount,
  ) ?? 0;
}

function rfqCreatedTs(r: Record<string, unknown>): number | null {
  const raw = pickScalarString(r.created_at, r.createdAt);
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : null;
}

function quoteFactoryId(q: Record<string, unknown>): number | null {
  const n = pickScalarNumber(q.factory_id, q.factoryId);
  return Number.isFinite(n) ? n : null;
}

function quoteCreatedTs(q: Record<string, unknown>): number | null {
  const raw = pickScalarString(q.created_at, q.updated_at, q.createdAt);
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : null;
}

function periodsFor(tf: AnalyticsTimeframe): { label: string; start: number; end: number }[] {
  const out: { label: string; start: number; end: number }[] = [];
  const now = new Date();

  if (tf === 'daily') {
    const n = 7;
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const start = d.getTime();
      const end = start + 86_400_000;
      out.push({
        label: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        start,
        end,
      });
    }
    return out;
  }

  if (tf === 'weekly') {
    const n = 4;
    for (let w = n - 1; w >= 0; w--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      const day = d.getDay();
      const diff = (day + 6) % 7;
      d.setDate(d.getDate() - diff - w * 7);
      const start = d.getTime();
      const end = start + 7 * 86_400_000;
      out.push({
        label: `สัปดาห์ ${n - w}`,
        start,
        end,
      });
    }
    return out;
  }

  const n = 6;
  for (let m = n - 1; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const start = d.getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    out.push({
      label: d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
      start,
      end,
    });
  }
  return out;
}

function buildSeries(
  mineOrders: Record<string, unknown>[],
  opRfqs: Record<string, unknown>[],
  myQuotes: Record<string, unknown>[],
  fid: number | null,
  tf: AnalyticsTimeframe,
): AnalyticsSeriesPoint[] {
  const periods = periodsFor(tf);
  const n = periods.length;
  const rfqTotal = opRfqs.length;
  const repliesTotal = fid != null ? myQuotes.filter((q) => quoteFactoryId(q) === fid).length : 0;
  const rfqFallback = n > 0 ? Math.max(1, Math.round(rfqTotal / n)) : 0;
  const replyFallback = n > 0 ? Math.max(1, Math.round(repliesTotal / n)) : 0;

  return periods.map((p) => {
    let revenue = 0;
    let closed = 0;
    let total = 0;
    let rfqReceived = 0;
    let rfqReplies = 0;
    let depositsHint = 0;

    for (const row of mineOrders) {
      const ts = orderCreatedTs(row);
      if (ts == null || ts < p.start || ts >= p.end) continue;
      const st = orderStatus(row);
      total += 1;
      if (st === 'CP') {
        closed += 1;
        revenue += orderTotalAmount(row);
      }
      if (st === 'PR' || st === 'QC') {
        depositsHint += orderTotalAmount(row) * 0.3;
      }
    }

    let anyRfqDate = false;
    for (const r of opRfqs) {
      const ts = rfqCreatedTs(r);
      if (ts == null) continue;
      anyRfqDate = true;
      if (ts >= p.start && ts < p.end) rfqReceived += 1;
    }
    if (!anyRfqDate) rfqReceived = rfqFallback;

    let anyQuoteDate = false;
    for (const q of myQuotes) {
      if (fid == null || quoteFactoryId(q) !== fid) continue;
      const ts = quoteCreatedTs(q);
      if (ts == null) continue;
      anyQuoteDate = true;
      if (ts >= p.start && ts < p.end) rfqReplies += 1;
    }
    if (!anyQuoteDate) rfqReplies = replyFallback;

    return {
      label: p.label,
      periodStart: new Date(p.start).toISOString().slice(0, 10),
      revenue,
      deposits: Math.round(depositsHint),
      closed_orders: closed,
      total_orders: total,
      rfq_received: rfqReceived,
      rfq_replies: rfqReplies,
    };
  });
}

export function useFactoryDashboard(timeframe: AnalyticsTimeframe) {
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opRfqs, setOpRfqs] = useState<Record<string, unknown>[]>([]);
  const [allOrders, setAllOrders] = useState<Record<string, unknown>[]>([]);
  const [myQuotes, setMyQuotes] = useState<Record<string, unknown>[]>([]);
  const [wallet, setWallet] = useState<Record<string, unknown> | null>(null);
  const [analyticsApi, setAnalyticsApi] = useState<Record<string, unknown> | null>(null);
  const [dashboardApi, setDashboardApi] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    await runAsyncAction(
      async () => {
      const [rfqRes, ordRes, qRes, wRes, aRes, dRes] = await Promise.allSettled([
        rfqsApi.matching(),
        ordersApi.list(),
        quotationsApi.listMine(),
        walletApi.getMe(),
        factoriesApi.getAnalytics(),
        factoriesApi.getDashboard(),
      ]);

      if (rfqRes.status === 'fulfilled') {
        const arr = Array.isArray(rfqRes.value) ? rfqRes.value : [];
        setOpRfqs(arr as Record<string, unknown>[]);
      } else {
        setOpRfqs([]);
      }

      if (ordRes.status === 'fulfilled') {
        const arr = Array.isArray(ordRes.value) ? ordRes.value : [];
        setAllOrders(arr as unknown as Record<string, unknown>[]);
      } else {
        setAllOrders([]);
      }

      if (qRes.status === 'fulfilled') {
        const arr = Array.isArray(qRes.value) ? qRes.value : [];
        setMyQuotes(arr as unknown as Record<string, unknown>[]);
      } else {
        setMyQuotes([]);
      }

      if (wRes.status === 'fulfilled' && wRes.value && typeof wRes.value === 'object') {
        setWallet(wRes.value as Record<string, unknown>);
      } else {
        setWallet(null);
      }

      if (aRes.status === 'fulfilled' && aRes.value && typeof aRes.value === 'object') {
        setAnalyticsApi(aRes.value as unknown as Record<string, unknown>);
      } else {
        setAnalyticsApi(null);
      }

      if (dRes.status === 'fulfilled' && dRes.value && typeof dRes.value === 'object') {
        setDashboardApi(dRes.value as unknown as Record<string, unknown>);
      } else {
        setDashboardApi(null);
      }

      if (
        rfqRes.status === 'rejected' &&
        ordRes.status === 'rejected' &&
        qRes.status === 'rejected' &&
        wRes.status === 'rejected' &&
        aRes.status === 'rejected' &&
        dRes.status === 'rejected'
      ) {
        setError('โหลดข้อมูลแดชบอร์ดไม่สำเร็จ');
      }
      },
      {
        onStart: () => {
          setLoading(true);
          setError(null);
        },
        onSettled: () => setLoading(false),
      },
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mineOrders = useMemo(() => {
    if (fid == null) return [];
    return allOrders.filter((r) => orderFactoryId(r) === fid);
  }, [allOrders, fid]);

  const summary: AnalyticsSummary = useMemo(() => {
    const pendingFund =
      wallet != null ? (pickScalarNumber(wallet.pending_fund, wallet.pendingBalance) ?? 0) : 0;
    const rfq_received_client = opRfqs.length;
    const rfq_replies_client =
      fid != null ? myQuotes.filter((q) => quoteFactoryId(q) === fid).length : 0;
    let revenue_client = 0;
    let closed_orders_client = 0;
    for (const row of mineOrders) {
      const st = orderStatus(row);
      if (st === 'CP') {
        closed_orders_client += 1;
        revenue_client += orderTotalAmount(row);
      }
    }
    const total_orders_client = mineOrders.length;
    const pending_quotations_client =
      fid != null
        ? myQuotes.filter(
            (q) =>
              quoteFactoryId(q) === fid && (pickScalarString(q.status) || 'PD').toUpperCase() === 'PD',
          ).length
        : 0;

    const A = analyticsApi;
    const D = dashboardApi;
    const hasA = A != null;
    const hasD = D != null;

    const revenue_total = hasA
      ? (pickScalarNumber(A.total_revenue, A.revenue_total) ?? revenue_client)
      : revenue_client;
    const closed_orders_total = hasA
      ? (pickScalarNumber(A.completed_orders, A.closed_orders_total) ?? closed_orders_client)
      : closed_orders_client;
    const total_orders_total = hasA
      ? (pickScalarNumber(A.total_orders, A.total_orders_total) ?? total_orders_client)
      : total_orders_client;
    const rfq_received_total = hasA
      ? (pickScalarNumber(A.total_quotations, A.rfq_received_total) ?? rfq_received_client)
      : rfq_received_client;
    const rfq_replies_total = hasA
      ? (pickScalarNumber(A.accepted_quotes, A.accepted_quotes_count, A.rfq_replies_total) ??
        rfq_replies_client)
      : rfq_replies_client;
    const pending_quotations_total = hasD
      ? (pickScalarNumber(D.pending_quotations_total, D.pending_quotations) ??
        pending_quotations_client)
      : pending_quotations_client;

    return {
      revenue_total,
      deposits_total: pendingFund,
      closed_orders_total,
      total_orders_total,
      rfq_received_total,
      rfq_replies_total,
      pending_quotations_total,
    };
  }, [mineOrders, myQuotes, opRfqs, fid, wallet, analyticsApi, dashboardApi]);

  const series = useMemo(() => {
    return buildSeries(mineOrders, opRfqs, myQuotes, fid, timeframe);
  }, [mineOrders, opRfqs, myQuotes, fid, timeframe]);

  return { loading, error, summary, series, reload: load };
}
