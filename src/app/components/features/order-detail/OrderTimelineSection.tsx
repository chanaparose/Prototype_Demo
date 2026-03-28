import React from 'react';
import { CheckCircle, Clock, Circle, Camera } from 'lucide-react';
import { formatDateTh } from './utils';

export type TimelineMilestone = {
  id: string;
  title: string;
  date?: string | null;
  status: string;
  photo?: string | null;
  description?: string | null;
};

type OrderForTimeline = {
  progress: number;
  estimatedDelivery: string;
  status: string;
  timeline?: TimelineMilestone[] | null;
};

type OrderTimelineSectionProps = {
  order: OrderForTimeline;
  onPhotoClick: (photo: string) => void;
};

export function OrderTimelineSection({ order, onPhotoClick }: OrderTimelineSectionProps) {
  const timeline = order.timeline ?? [];
  const hasTimeline = timeline.length > 0;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        {!hasTimeline ? (
          <div className="py-6 text-center">
            <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600" style={{ fontWeight: 500 }}>
              {order.status === 'completed'
                ? 'คำสั่งซื้อเสร็จสิ้นแล้ว'
                : 'ยังไม่มีรายการติดตามความคืบหน้า'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {timeline.map((milestone, index) => {
              const isLast = index === timeline.length - 1;
              return (
                <div key={milestone.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10"
                      style={{
                        background:
                          milestone.status === 'completed'
                            ? '#A238FF'
                            : milestone.status === 'current'
                              ? 'rgba(162,56,255,0.12)'
                              : '#F3F4F6',
                        border:
                          milestone.status === 'current' ? '2px solid #A238FF' : 'none',
                      }}
                    >
                      {milestone.status === 'completed' ? (
                        <CheckCircle size={16} className="text-white" />
                      ) : milestone.status === 'current' ? (
                        <div
                          className="w-3 h-3 rounded-full animate-pulse"
                          style={{ background: '#A238FF' }}
                        />
                      ) : (
                        <Circle size={16} className="text-gray-300" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className="w-0.5 flex-1 my-1"
                        style={{
                          background:
                            milestone.status === 'completed' ? '#A238FF' : '#E5E7EB',
                          minHeight: milestone.photo ? 120 : 32,
                        }}
                      />
                    )}
                  </div>

                  <div className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p
                          className="text-sm"
                          style={{
                            fontWeight: 600,
                            color:
                              milestone.status === 'current'
                                ? '#A238FF'
                                : milestone.status === 'completed'
                                  ? '#1F2937'
                                  : '#9CA3AF',
                          }}
                        >
                          {milestone.title}
                        </p>
                        {milestone.date && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock size={10} className="text-gray-400" />
                            <span className="text-[10px] text-gray-400">
                              {milestone.date}
                            </span>
                          </div>
                        )}
                        {milestone.description && (
                          <p className="text-[11px] text-gray-500 mt-1">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                      {milestone.status === 'current' && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] ml-2"
                          style={{
                            background: 'rgba(162,56,255,0.12)',
                            color: '#A238FF',
                            fontWeight: 600,
                          }}
                        >
                          ปัจจุบัน
                        </span>
                      )}
                    </div>

                    {milestone.photo && (
                      <button
                        onClick={() => onPhotoClick(milestone.photo!)}
                        className="mt-2 relative overflow-hidden rounded-xl"
                        style={{ width: '100%', height: 100 }}
                      >
                        <img
                          src={milestone.photo}
                          alt={milestone.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10 flex items-end p-2">
                          <div
                            className="flex items-center gap-1 px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(0,0,0,0.5)' }}
                          >
                            <Camera size={10} className="text-white" />
                            <span className="text-[10px] text-white">ดูรูป</span>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-[#F8F6FA] to-[#F3EFF8] border border-[rgba(162,56,255,0.20)] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 text-sm">ความคืบหน้าโดยรวม</span>
          <span className="text-[#A238FF] text-base" style={{ fontWeight: 700 }}>
            {order.progress}%
          </span>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden border border-[rgba(162,56,255,0.20)]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${order.progress}%`,
              background: 'linear-gradient(90deg, #A238FF, #4A267D)',
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          กำหนดส่งมอบ: {formatDateTh(order.estimatedDelivery)}
        </p>
      </div>
    </div>
  );
}
