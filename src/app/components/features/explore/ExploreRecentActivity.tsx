import React from 'react';
import { ChevronRight, TrendingUp, Clock } from 'lucide-react';
import { EXPLORE_STATUS_CONFIG } from '@/components/features/explore/constants';
import { formatCurrency } from '@/utils/formatting';
import { Button } from '@/components/ui/button';

export type RfqActivityItem = {
  id: string;
  category: string;
  categoryIcon?: string | React.ReactNode;
  projectName: string;
  budget: number;
  createdAt: string;
  status: string;
  offerCount: number;
};

export type OrderActivityItem = {
  id: string;
  projectName: string;
  factoryName: string;
  status: string;
  progress: number;
};

type ExploreRecentActivityProps = {
  rfqs: RfqActivityItem[];
  orders: OrderActivityItem[];
  onRfqClick: (id: string) => void;
  onOrderClick: (id: string) => void;
  onViewAllClick: () => void;
};

export function ExploreRecentActivity({
  rfqs,
  orders,
  onRfqClick,
  onOrderClick,
  onViewAllClick,
}: ExploreRecentActivityProps) {
  return (
    <div className='px-4'>
      <div className='flex justify-between items-center mb-3'>
        <p className='text-sm text-[#292259]' style={{ fontWeight: 700 }}>
          กิจกรรมล่าสุด
        </p>
        <Button
          variant='unstyled'
          onClick={onViewAllClick}
          className='flex items-center gap-0.5 text-xs'
          style={{ color: '#A656A0', fontWeight: 600 }}
        >
          ดูทั้งหมด <ChevronRight size={14} />
        </Button>
      </div>

      <div className='space-y-3'>
        {rfqs.map((rfq) => {
          const cfg = EXPLORE_STATUS_CONFIG[rfq.status] ?? {
            label: rfq.status,
            color: '#6B7280',
            bg: '#F3F4F6',
          };
          return (
            <div
              key={rfq.id}
              onClick={() => onRfqClick(rfq.id)}
              className='bg-white rounded-2xl p-4 shadow-sm border border-gray-50 cursor-pointer transition-all active:scale-[0.98] hover:shadow-md hover:border-[#A656A0]/20'
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='text-base'>{rfq.categoryIcon}</span>
                    <p className='text-xs text-gray-500'>{rfq.category}</p>
                  </div>
                  <p className='text-sm text-gray-900 truncate' style={{ fontWeight: 600 }}>
                    {rfq.projectName}
                  </p>
                  <div className='flex items-center gap-3 mt-2'>
                    <div className='flex items-center gap-1'>
                      <TrendingUp size={12} className='text-gray-400' />
                      <span className='text-xs text-gray-500'>
                        {formatCurrency(rfq.budget, 'THB')}
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Clock size={12} className='text-gray-400' />
                      <span className='text-xs text-gray-500'>{rfq.createdAt}</span>
                    </div>
                  </div>
                </div>
                <div className='flex flex-col items-end gap-2 shrink-0 ml-3'>
                  <span
                    className='px-2.5 py-1 rounded-full text-[10px]'
                    style={{ background: cfg.bg, color: cfg.color, fontWeight: 600 }}
                  >
                    {cfg.label}
                  </span>
                  {rfq.offerCount > 0 && (
                    <span
                      className='px-2.5 py-1 rounded-full text-[10px]'
                      style={{
                        background: '#F2F2F2',
                        color: '#A656A0',
                        fontWeight: 700,
                        border: '1px solid #F2F2F240',
                      }}
                    >
                      {rfq.offerCount} ใบเสนอราคา
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {orders.map((order) => {
          const cfg = EXPLORE_STATUS_CONFIG[order.status] ?? {
            label: order.status,
            color: '#6B7280',
            bg: '#F3F4F6',
          };
          return (
            <div
              key={order.id}
              onClick={() => onOrderClick(order.id)}
              className='bg-white rounded-2xl p-4 shadow-sm border border-gray-50 cursor-pointer transition-all active:scale-[0.98] hover:shadow-md hover:border-[#A656A0]/20'
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='flex-1 min-w-0'>
                  <p className='text-[10px] text-gray-400 mb-0.5'>คำสั่งซื้อ #{order.id}</p>
                  <p className='text-sm text-gray-900 truncate' style={{ fontWeight: 600 }}>
                    {order.projectName}
                  </p>
                  <p className='text-xs text-gray-500 mt-0.5'>{order.factoryName}</p>
                </div>
                <span
                  className='shrink-0 px-2.5 py-1 rounded-full text-[10px] ml-3'
                  style={{ background: cfg.bg, color: cfg.color, fontWeight: 600 }}
                >
                  {cfg.label}
                </span>
              </div>
              <div className='space-y-1'>
                <div className='flex justify-between text-[10px] text-gray-500'>
                  <span>ความคืบหน้า</span>
                  <span style={{ fontWeight: 600, color: '#A656A0' }}>{order.progress}%</span>
                </div>
                <div className='h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                  <div
                    className='h-full rounded-full transition-all'
                    style={{
                      width: `${order.progress}%`,
                      background: 'linear-gradient(90deg, #292259, #A656A0, #F28A2E)',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
