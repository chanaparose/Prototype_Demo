import React from 'react';
import { Link } from 'react-router';
import { Plus, FileText, Package, AlertTriangle } from 'lucide-react';
import { useRfqAndOrdersState } from '@/components/features/rfq-and-orders/hooks/useRfqAndOrdersState';
import { Button } from '@/components/ui/button';
import { OrderPanel } from '@/components/features/rfq-and-orders/components/OrderPanel';
import { RfqPanel } from '@/components/features/rfq-and-orders/components/RfqPanel';
import { TabSwipeContent } from '@/components/layout/TabSwipeContent';

const RFQ_ORDERS_TAB_ORDER = ['rfq', 'orders'] as const;

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

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='text-center'>
          <div className='w-10 h-10 rounded-full border-[3px] border-brand-violet-deep border-t-transparent animate-spin mx-auto mb-3' />
          <p className='text-sm text-gray-500'>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-[60vh] px-4'>
        <div className='text-center'>
          <p className='text-sm text-red-600 font-semibold mb-2'>เกิดข้อผิดพลาด</p>
          <p className='text-xs text-gray-500 mb-4'>{error}</p>
          <Button
            variant='unstyled'
            onClick={() => window.location.reload()}
            className='px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-violet-deep'
          >
            ลองใหม่
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className='sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-md'>
        <div className='mx-auto max-w-6xl px-4 py-4 lg:px-8'>
          <p className='text-xs font-semibold uppercase tracking-wider text-[#C4A484]'>
            คำขอและคำสั่งซื้อ
          </p>
          <div className='mt-1 flex items-center justify-between gap-2'>
            <h1 className='text-2xl font-bold text-brand-navy-deep'>คำขอราคา & คำสั่งซื้อ</h1>
            <Link
              to='/create-rfq'
              className='hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white font-semibold transition-all bg-brand-purple shadow-[0_2px_8px_rgba(162,56,255,0.18)] hover:bg-brand-violet-deep active:scale-[0.98] shrink-0'
            >
              <Plus size={16} />
              สร้างคำขอราคา
            </Link>
          </div>
        </div>
      </header>

      <div className='lg:hidden flex flex-col min-h-full pb-20'>
        <div className='px-4 pt-4 mb-4'>
          <div className='flex p-1 rounded-xl border bg-surface-cream border-[rgba(196,164,132,0.4)]'>
            <Button
              variant='unstyled'
              onClick={() => setPrimaryTab('rfq')}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${
                  primaryTab === 'rfq'
                  ? 'border-brand-orange/35 bg-surface-peach text-brand-orange-vivid'
                  : 'border-transparent text-neutral-subtle hover:bg-surface-peach/60'
              }`}
            >
              คำขอราคา
            </Button>
            <Button
              variant='unstyled'
              onClick={() => setPrimaryTab('orders')}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all relative ${
                  primaryTab === 'orders'
                  ? 'border-brand-orange/35 bg-surface-peach text-brand-orange-vivid'
                  : 'border-transparent text-neutral-subtle hover:bg-surface-peach/60'
              }`}
            >
              คำสั่งซื้อ
              {hasPendingPayment && primaryTab !== 'orders' && (
                <span className='absolute top-1.5 right-4 w-2 h-2 rounded-full animate-pulse bg-brand-orange' />
              )}
            </Button>
          </div>
          </div>

        <div className='px-4 flex-1'>
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

      <div className='hidden lg:flex flex-col px-8 2xl:px-10 py-7 h-full'>
        <div className='grid grid-cols-2 gap-6 flex-1 min-h-0'>
          <div className='bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col'>
            <div className='flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0'>
              <div className='flex items-center gap-3'>
                <FileText size={18} className='text-brand-violet-deep shrink-0' />
                <h2 className='font-semibold text-slate-900'>คำขอราคา</h2>
                <span className='text-[11px] px-2.5 py-1 font-semibold text-slate-600 border border-slate-200 rounded-lg'>
                  {
                    rfqs.filter(
                      (r) =>
                        r.status !== 'cancelled' &&
                        r.status !== 'expired' &&
                        r.status !== 'completed',
                    ).length
                  }
                </span>
              </div>
            </div>

            <div className='overflow-y-auto flex-1 p-4'>
              <RfqPanel rfqs={rfqs} isDesktop />
                  </div>
                </div>

          <div className='bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col'>
            <div className='flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0'>
              <div className='flex items-center gap-3'>
                <Package size={18} className='text-brand-orange-vivid shrink-0' />
                <h2 className='font-semibold text-slate-900'>คำสั่งซื้อ</h2>
                <span className='text-[11px] px-2.5 py-1 font-semibold text-slate-600 border border-slate-200 rounded-lg'>
                  {orders.filter((o) => o.status !== 'completed').length}
                </span>
              </div>
              {hasPendingPayment && (
                <span className='flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 text-red-600 border border-red-200 rounded-lg'>
                  <AlertTriangle size={14} />
                  {orderTagCounts.pendingPayment} รอชำระ
                </span>
              )}
              </div>

            <div className='overflow-y-auto flex-1 p-4'>
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
