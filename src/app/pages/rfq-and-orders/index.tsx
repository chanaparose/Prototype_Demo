import React from 'react';
import { FileText, Package, AlertTriangle } from 'lucide-react';
import { useRfqAndOrdersState } from '@/components/features/rfq-and-orders/hooks/useRfqAndOrdersState';
import { Button } from '@/components/ui/button';
import { factoryIdeasChromeGradientClass, factoryIdeasContentSurfaceClass } from '@/components/features/factory-ideas/factoryIdeasTheme';
import { PageHeader } from '@/components/ui/PageHeader';
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
    <div
      role='tablist'
      aria-label='คำขอราคาและคำสั่งซื้อ'
      className='grid grid-cols-2 border-b border-slate-200'
    >
      {RFQ_ORDERS_TABS.map((tab) => {
        const active = primaryTab === tab.id;
        const Icon = tab.id === 'rfq' ? FileText : Package;
        return (
          <button
            key={tab.id}
            type='button'
            role='tab'
            aria-selected={active}
            onClick={() => setPrimaryTab(tab.id)}
            className={`relative flex min-w-0 items-center justify-center gap-1.5 px-3 py-3 text-center transition-colors ${
              active
                ? 'text-brand-violet-deep'
                : 'text-slate-500 hover:text-brand-violet-deep'
            }`}
          >
            <Icon
              size={15}
              strokeWidth={2.1}
              className={`shrink-0 ${active ? 'text-brand-violet-deep' : 'text-slate-400'}`}
              aria-hidden
            />
            <span className='relative min-w-0'>
              <span
                className={`block truncate text-[12px] font-semibold leading-tight ${
                  active ? 'text-brand-violet-deep' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
              {tab.id === 'orders' && hasPendingPayment && !active ? (
                <span className='absolute -right-2 -top-0.5 h-1.5 w-1.5 rounded-full bg-brand-orange animate-pulse' />
              ) : null}
            </span>
            {active ? (
              <span
                className='absolute inset-x-4 bottom-[-1px] h-0.5 rounded-full bg-brand-violet-deep'
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
      <header className='sticky top-0 z-20 hidden lg:block'>
        <PageHeader
          title='คำขอราคา & คำสั่งซื้อ'
          subtitle='คำขอและคำสั่งซื้อ'
          icon={FileText}
          action={{ label: 'สร้างคำขอราคา', to: '/create-rfq' }}
          variant='minimal'
          className='border-b border-gray-100/80 px-8 py-4 2xl:px-10'
        />
      </header>

      {/* ── Mobile: title flush under layout logo + sticky tabs ── */}
      <div className={`flex min-h-[100dvh] flex-col pb-20 lg:hidden ${factoryIdeasContentSurfaceClass}`}>
        <div className={factoryIdeasChromeGradientClass}>
          <PageHeader
            title='คำขอราคา & คำสั่งซื้อ'
            subtitle='คำขอและคำสั่งซื้อ'
            icon={FileText}
            variant='minimal'
            className='px-4 pb-3 pt-3'
          />

          <div className='sticky top-14 z-20 bg-white shadow-none'>
            <RfqOrdersTabBar
              primaryTab={primaryTab}
              setPrimaryTab={setPrimaryTab}
              hasPendingPayment={hasPendingPayment}
            />
          </div>
        </div>

        <div className={`flex-1 px-4 pt-3 ${factoryIdeasContentSurfaceClass}`}>
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
        <div className='grid h-full flex-1 grid-cols-2 gap-5'>
          <div className='flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white'>
            <div className='flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3.5'>
              <div className='flex items-center gap-2.5'>
                <FileText size={16} className='shrink-0 text-brand-violet-deep' />
                <h2 className='text-[13px] font-bold text-[var(--brand-navy)]'>คำขอราคา</h2>
                <span className='rounded-md border border-gray-200 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-gray-500'>
                  {activeRfqCount}
                </span>
              </div>
            </div>
            <div className='flex-1 overflow-y-auto p-4'>
              <RfqPanel rfqs={rfqs} isDesktop />
            </div>
          </div>

          <div className='flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white'>
            <div className='flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3.5'>
              <div className='flex items-center gap-2.5'>
                <Package size={16} className='shrink-0 text-brand-orange-vivid' />
                <h2 className='text-[13px] font-bold text-[var(--brand-navy)]'>คำสั่งซื้อ</h2>
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
