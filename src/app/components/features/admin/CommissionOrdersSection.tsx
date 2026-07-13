import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, TrendingUp } from 'lucide-react';
import { adminCommissionApi } from '@/services/api/adminApi';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatting/formatCurrency';

type CommissionOrder = Awaited<
  ReturnType<typeof adminCommissionApi.escrowOrders>
>['orders'][number];

const ORDER_STATUS: Record<string, { label: string; variant: 'success' | 'info' | 'pending' | 'inactive' }> = {
  CP: { label: 'เสร็จสมบูรณ์', variant: 'success' },
  PD: { label: 'ชำระแล้ว', variant: 'info' },
  PR: { label: 'กำลังผลิต', variant: 'pending' },
  SH: { label: 'จัดส่ง', variant: 'info' },
};

/**
 * ค่าคอมมิชชันที่ Tryly ได้รับต่อออเดอร์ (escrow flow) — เห็นว่าได้ค่า comm
 * จาก order ไหนเท่าไหร่ (นับเฉพาะ order ที่ยืนยันสลิปแล้ว slip_status=AP)
 */
export function CommissionOrdersSection() {
  const [orders, setOrders] = useState<CommissionOrder[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [totalGross, setTotalGross] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminCommissionApi
      .escrowOrders()
      .then((res) => {
        if (cancelled) return;
        setOrders(res.orders ?? []);
        setTotalCommission(Number(res.total_commission ?? 0));
        setTotalGross(Number(res.total_gross ?? 0));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'โหลดข้อมูลค่าคอมไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className='space-y-4'>
      {/* Summary cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-4'>
          <div className='flex items-center gap-1.5'>
            <TrendingUp size={13} className='text-emerald-600' />
            <p className='text-xs font-semibold text-emerald-600'>ค่าคอมมิชชันรวม</p>
          </div>
          <p className='mt-1 text-2xl font-bold tabular-nums text-emerald-700'>
            {formatCurrency(totalCommission)}
          </p>
        </div>
        <div className='rounded-xl border border-purple-200 bg-purple-50 p-4'>
          <p className='text-xs font-semibold text-purple-600'>ยอดขายรวม (gross)</p>
          <p className='mt-1 text-2xl font-bold tabular-nums text-purple-700'>
            {formatCurrency(totalGross)}
          </p>
        </div>
        <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
          <p className='text-xs font-semibold text-slate-500'>จำนวนออเดอร์</p>
          <p className='mt-1 text-2xl font-bold tabular-nums text-slate-800'>{orders.length}</p>
        </div>
      </div>

      {error ? (
        <div className='flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700'>
          <AlertTriangle size={14} />
          {error}
        </div>
      ) : null}

      <div className='overflow-x-auto rounded-xl border border-slate-200 bg-white'>
        <table className='w-full min-w-[860px] text-sm'>
          <thead>
            <tr className='border-b border-slate-100 text-left text-xs font-semibold text-slate-500'>
              <th className='px-4 py-3'>Order</th>
              <th className='px-4 py-3'>โรงงาน</th>
              <th className='px-4 py-3'>ลูกค้า</th>
              <th className='px-4 py-3 text-right'>ยอดขาย</th>
              <th className='px-4 py-3 text-right'>เรต</th>
              <th className='px-4 py-3 text-right'>ค่าคอม</th>
              <th className='px-4 py-3 text-right'>โรงงานได้รับ</th>
              <th className='px-4 py-3'>สถานะ</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {loading ? (
              <tr>
                <td colSpan={8} className='px-4 py-10 text-center text-slate-400'>
                  <Loader2 size={16} className='mx-auto animate-spin' />
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className='px-4 py-10 text-center text-sm text-slate-400'>
                  ยังไม่มีออเดอร์ที่ยืนยันการชำระเงิน
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const meta = ORDER_STATUS[o.status] ?? { label: o.status, variant: 'inactive' as const };
                return (
                  <tr key={o.order_id} className='hover:bg-slate-50'>
                    <td className='px-4 py-3 font-mono text-xs font-semibold text-purple-600'>
                      #{o.order_id}
                      <p className='mt-0.5 font-sans text-[11px] font-normal text-slate-400'>
                        {String(o.created_at ?? '').slice(0, 10)}
                      </p>
                    </td>
                    <td className='px-4 py-3 text-slate-700'>{o.factory_name}</td>
                    <td className='px-4 py-3 text-slate-500'>{o.customer_name}</td>
                    <td className='px-4 py-3 text-right tabular-nums text-slate-900'>
                      {formatCurrency(o.grand_total)}
                    </td>
                    <td className='px-4 py-3 text-right tabular-nums text-slate-400'>
                      {o.commission_rate}%
                    </td>
                    <td className='px-4 py-3 text-right font-bold tabular-nums text-emerald-700'>
                      {formatCurrency(o.commission_amount)}
                    </td>
                    <td className='px-4 py-3 text-right tabular-nums text-slate-600'>
                      {formatCurrency(o.factory_net)}
                    </td>
                    <td className='px-4 py-3'>
                      <Badge variant={meta.variant} size='sm'>
                        {meta.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {!loading && orders.length > 0 ? (
            <tfoot>
              <tr className='border-t-2 border-emerald-200 bg-emerald-50'>
                <td colSpan={5} className='px-4 py-3 text-xs font-bold text-emerald-700'>
                  รวมค่าคอมมิชชัน {orders.length} ออเดอร์
                </td>
                <td className='px-4 py-3 text-right text-sm font-bold tabular-nums text-emerald-800'>
                  {formatCurrency(totalCommission)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </section>
  );
}
