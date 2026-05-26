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
      <div className='lg:hidden flex flex-col min-h-full pb-20'>
        <div className='px-4 pt-5 pb-3'>
          <p className='text-[10px] uppercase tracking-wider font-semibold mb-0.5 text-[#C4A484]'>
                คำขอ
              </p>
          <h1 className='text-xl font-bold text-brand-navy-deep'>คำขอราคา & คำสั่งซื้อ</h1>
        </div>

        <div className='px-4 mb-4'>
          <div className='flex p-1 rounded-2xl border bg-surface-cream border-[rgba(196,164,132,0.4)]'>
            <Button
              variant='unstyled'
              onClick={() => setPrimaryTab('rfq')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  primaryTab === 'rfq'
                  ? 'bg-white/95 text-brand-violet-deep shadow-[0_2px_14px_rgba(109,40,217,0.18)]'
                  : 'text-neutral-subtle'
              }`}
            >
              คำขอราคา
            </Button>
            <Button
              variant='unstyled'
              onClick={() => setPrimaryTab('orders')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
                  primaryTab === 'orders'
                  ? 'bg-white/95 text-brand-orange-vivid shadow-[0_2px_14px_rgba(242,120,48,0.22)]'
                  : 'text-neutral-subtle'
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

      <div className='hidden lg:flex flex-col px-8 py-7 h-full'>
        <div className='flex items-center justify-between mb-6 shrink-0'>
          <div>
            <p className='text-xs uppercase tracking-wider font-semibold mb-0.5 text-[#C4A484]'>
              คำขอและคำสั่งซื้อ
            </p>
            <h1 className='text-2xl font-bold text-brand-navy-deep'>คำขอราคา &amp; คำสั่งซื้อ</h1>
          </div>
            <Link
            to='/create-rfq'
            className='flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white font-semibold transition-all hover:opacity-90 shadow-md bg-[linear-gradient(135deg,var(--brand-purple)_0%,var(--brand-orange)_100%)] shadow-[0_6px_20px_rgba(162,56,255,0.35)]'
            >
              <Plus size={16} />
            สร้างคำขอราคา
            </Link>
        </div>

        <div className='grid grid-cols-2 gap-6 flex-1 min-h-0'>
          <div className='bg-white rounded-2xl border border-[rgba(196,164,132,0.4)] border-t-[3px] border-t-brand-violet-deep overflow-hidden flex flex-col'>
            <div className='flex items-center justify-between px-5 py-4 border-b shrink-0 border-[rgba(196,164,132,0.4)] bg-[#FBF8FF]'>
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-xl flex items-center justify-center bg-brand-lavender'>
                  <FileText size={15} className='text-brand-violet-deep' />
                </div>
                <h2 className='font-bold text-brand-navy-deep'>คำขอราคา</h2>
                <span className='text-[11px] px-2 py-0.5 rounded-full font-semibold text-brand-violet-deep bg-brand-lavender'>
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

          <div className='bg-white rounded-2xl border border-[rgba(196,164,132,0.4)] border-t-[3px] border-t-brand-orange overflow-hidden flex flex-col'>
            <div className='flex items-center justify-between px-5 py-4 border-b shrink-0 border-[rgba(196,164,132,0.4)] bg-surface-peach'>
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-xl flex items-center justify-center bg-surface-peach'>
                  <Package size={15} className='text-brand-orange-vivid' />
                </div>
                <h2 className='font-bold text-brand-navy-deep'>คำสั่งซื้อ</h2>
                <span className='text-[11px] px-2 py-0.5 rounded-full font-semibold bg-surface-peach text-brand-orange-vivid'>
                  {orders.filter((o) => o.status !== 'completed').length}
                </span>
              </div>
              {hasPendingPayment && (
                <span className='flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse bg-surface-orange-soft text-brand-orange-vivid'>
                  <AlertTriangle size={10} />
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
