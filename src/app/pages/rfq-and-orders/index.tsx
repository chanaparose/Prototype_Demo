import React from 'react';
import { Link } from 'react-router';
import { Plus, FileText, Package, AlertTriangle } from 'lucide-react';
import { useRfqAndOrdersState } from '@/components/features/rfq-and-orders/hooks/useRfqAndOrdersState';
import { Button } from '@/components/ui/button';
import { OrderPanel } from '@/components/features/rfq-and-orders/components/OrderPanel';
import { RfqPanel } from '@/components/features/rfq-and-orders/components/RfqPanel';
import { TabSwipeContent } from '@/components/layout/TabSwipeContent';

const RFQ_ORDERS_TAB_ORDER = ['rfq', 'orders'] as const;

const RFQ_ORDERS_TABS = [
  { id: 'rfq' as const, label: 'คำขอราคา' },
  { id: 'orders' as const, label: 'คำสั่งซื้อ' },
];

type PrimaryTab = (typeof RFQ_ORDERS_TAB_ORDER)[number];

function RfqOrdersTabBar({
  primaryTab,
  setPrimaryTab,
  hasPendingPayment,
}: {
  primaryTab: PrimaryTab;
  setPrimaryTab: (tab: PrimaryTab) => void;
  hasPendingPayment: boolean;
}) {
  return (
    <div className='flex border-t-0'>
      {RFQ_ORDERS_TABS.map((tab) => {
        const active = primaryTab === tab.id;
        return (
          <button
            key={tab.id}
            type='button'
            onClick={() => setPrimaryTab(tab.id)}
            className='relative min-w-0 flex-1 px-2 py-2.5 text-center'
          >
            <span
              className={`inline-flex items-center gap-1 text-[13px] leading-none whitespace-nowrap ${
                active ? 'font-bold text-[var(--brand-navy)]' : 'font-medium text-gray-400'
              }`}
            >
              {tab.label}
              {tab.id === 'orders' && hasPendingPayment && !active ? (
                <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange animate-pulse' />
              ) : null}
            </span>
            {active ? (
              <span
                className='absolute bottom-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full'
                style={{ background: 'var(--brand-purple)' }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function RfqAndOrders() {
  const {
    primaryTab,
    setPrimaryTab,
    orderFilter,
    setOrderFilter,
    filteredOrders,
    orderTagCounts,
    rfqs,
    orders,
    loading,
    error,
  } = useRfqAndOrdersState({ primaryTab: 'rfq' });

  const hasPendingPayment = orderTagCounts.pendingPayment > 0;
  const activeRfqCount = rfqs.filter(
    (r) => r.status !== 'cancelled' && r.status !== 'expired' && r.status !== 'completed',
  ).length;
  const activeOrderCount = orders.filter((o) => o.status !== 'completed').length;

  if (loading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center bg-[var(--brand-page)]'>
        <div className='text-center'>
          <div className='mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-[3px] border-brand-violet-deep border-t-transparent' />
          <p className='text-sm text-gray-500'>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center bg-[var(--brand-page)] px-4'>
        <div className='text-center'>
          <p className='mb-2 text-sm font-semibold text-red-600'>เกิดข้อผิดพลาด</p>
          <p className='mb-4 text-xs text-gray-500'>{error}</p>
          <Button
            variant='unstyled'
            onClick={() => window.location.reload()}
            className='rounded-xl bg-brand-violet-deep px-4 py-2 text-xs font-semibold text-white'
          >
            ลองใหม่
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop header ── */}
      <header className='sticky top-0 z-20 hidden border-b border-gray-100 bg-white lg:block'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-3 px-8 py-4 2xl:px-10'>
          <div className='min-w-0'>
            <p className='text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-orange-deep)]'>
              คำขอและคำสั่งซื้อ
            </p>
            <h1 className='text-lg font-bold leading-tight text-[var(--brand-navy)]'>
              คำขอราคา & คำสั่งซื้อ
            </h1>
          </div>
          <Link
            to='/create-rfq'
            className='flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-purple px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-brand-violet-deep active:scale-[0.98]'
          >
            <Plus size={14} />
            สร้างคำขอราคา
          </Link>
        </div>
      </header>

      {/* ── Mobile: title flush under layout logo + sticky tabs ── */}
      <div className='flex min-h-[100dvh] flex-col bg-[var(--brand-page)] pb-20 lg:hidden'>
        <div className='border-b border-gray-100 bg-white'>
          <div className='px-4 pt-3 pb-2'>
            <p className='text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-orange-deep)]'>
              คำขอและคำสั่งซื้อ
            </p>
            <h1 className='text-lg font-bold leading-tight text-[var(--brand-navy)]'>
              คำขอราคา & คำสั่งซื้อ
            </h1>
          </div>
        </div>

        <div className='sticky top-14 z-20 border-b border-gray-100 bg-white'>
          <RfqOrdersTabBar
            primaryTab={primaryTab}
            setPrimaryTab={setPrimaryTab}
            hasPendingPayment={hasPendingPayment}
          />
        </div>

        <div className='flex-1 px-4 pt-3'>
          <TabSwipeContent activeKey={primaryTab} tabOrder={RFQ_ORDERS_TAB_ORDER}>
            {primaryTab === 'rfq' ? (
              <RfqPanel rfqs={rfqs} isMobile />
            ) : (
              <OrderPanel
                orderFilter={orderFilter}
                setOrderFilter={setOrderFilter}
                filteredOrders={filteredOrders}
                orderTagCounts={orderTagCounts}
              />
            )}
          </TabSwipeContent>
        </div>
      </div>

      {/* ── Desktop: two-column panels ── */}
      <div className='hidden h-full flex-col bg-[var(--brand-page)] px-8 py-6 lg:flex 2xl:px-10'>
        <div className='grid min-h-0 flex-1 grid-cols-2 gap-5'>
          <div className='flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white'>
            <div className='flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3.5'>
              <div className='flex items-center gap-2.5'>
                <FileText size={16} className='shrink-0 text-brand-violet-deep' />
                <h2 className='text-sm font-bold text-[var(--brand-navy)]'>คำขอราคา</h2>
                <span className='rounded-md border border-gray-200 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-gray-500'>
                  {activeRfqCount}
                </span>
              </div>
            </div>
            <div className='flex-1 overflow-y-auto p-4'>
              <RfqPanel rfqs={rfqs} isDesktop />
            </div>
          </div>

          <div className='flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white'>
            <div className='flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3.5'>
              <div className='flex items-center gap-2.5'>
                <Package size={16} className='shrink-0 text-brand-orange-vivid' />
                <h2 className='text-sm font-bold text-[var(--brand-navy)]'>คำสั่งซื้อ</h2>
                <span className='rounded-md border border-gray-200 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-gray-500'>
                  {activeOrderCount}
                </span>
              </div>
              {hasPendingPayment ? (
                <span className='flex items-center gap-1 rounded-md border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-600'>
                  <AlertTriangle size={12} />
                  {orderTagCounts.pendingPayment} รอชำระ
                </span>
              ) : null}
            </div>
            <div className='flex-1 overflow-y-auto p-4'>
              <OrderPanel
                orderFilter={orderFilter}
                setOrderFilter={setOrderFilter}
                filteredOrders={filteredOrders}
                orderTagCounts={orderTagCounts}
                isDesktop
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
