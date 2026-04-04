import React from 'react';

type FactoryProfileStatsProps = {
  minOrder: number | string;
  leadTime: string;
  completedOrders: number;
};

export function FactoryProfileStats({
  minOrder,
  leadTime,
  completedOrders,
}: FactoryProfileStatsProps) {
  return (
    <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[11px] text-gray-400">ขั้นต่ำผลิต</p>
          <p className="text-sm text-gray-900 mt-0.5" style={{ fontWeight: 700 }}>
            {minOrder}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">Lead time</p>
          <p className="text-sm text-gray-900 mt-0.5" style={{ fontWeight: 700 }}>
            {leadTime}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">งานสำเร็จ</p>
          <p className="text-sm text-gray-900 mt-0.5" style={{ fontWeight: 700 }}>
            {completedOrders}
          </p>
        </div>
      </div>
    </div>
  );
}
