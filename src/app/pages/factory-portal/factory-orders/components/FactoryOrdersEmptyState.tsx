import React from 'react';
import { Link } from 'react-router';
import { Button } from '../../../../components/ui/button';
import type { TabId } from '../types';

const TAB_LABEL: Record<TabId, string> = {
  all: 'ทั้งหมด',
  needs_action: 'ต้องดำเนินการ',
  in_production: 'กำลังผลิต',
  awaiting_customer: 'รอลูกค้า',
  shipped: 'จัดส่งแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
};

export function FactoryOrdersEmptyState({
  hasAnyRows,
  tabId,
  onResetTab,
}: {
  hasAnyRows: boolean;
  tabId: TabId;
  onResetTab: () => void;
}) {
  if (!hasAnyRows) {
    return (
      <div className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-100 p-6 text-center lg:col-span-2">
        <p className="text-base text-gray-600">ยังไม่มีออเดอร์</p>
        <Link to="/factory/rfq-board" className="text-violet-700 underline">ไปหน้า RFQ Board</Link>
      </div>
    );
  }
  return (
    <div className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-100 p-6 text-center lg:col-span-2">
      <p>ไม่มีออเดอร์ในหมวด {TAB_LABEL[tabId]}</p>
      <Button variant="link" className="text-violet-700" onClick={onResetTab}>ดูทั้งหมด</Button>
    </div>
  );
}
