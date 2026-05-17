import React from 'react';
import { Search } from 'lucide-react';
import type { SortKey, TabId } from '../types';
import { TabNavigation } from '../../../../shared/ui';

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'needs_action', label: 'ต้องดำเนินการ' },
  { id: 'in_production', label: 'กำลังผลิต' },
  { id: 'awaiting_customer', label: 'รอลูกค้า' },
  { id: 'shipped', label: 'จัดส่งแล้ว' },
  { id: 'completed', label: 'เสร็จสิ้น' },
  { id: 'cancelled', label: 'ยกเลิก' },
];

export function FactoryOrdersFilterBar(props: {
  tabId: TabId;
  onTabChange: (id: TabId) => void;
  tabCounts: Record<TabId, number>;
  sortKey: SortKey;
  onSortChange: (k: SortKey) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  const { tabId, onTabChange, tabCounts, sortKey, onSortChange, searchQuery, onSearchChange } = props;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm space-y-3">
      <div className="flex p-1 rounded-xl bg-slate-100 w-full overflow-x-auto gap-1" role="tablist">
        <TabNavigation
          tabs={TABS.map((tab) => ({ ...tab, count: tabCounts[tab.id] }))}
          activeTabId={tabId}
          onTabChange={(id) => onTabChange(id as TabId)}
          className="border-b-0 gap-1"
          tabClassName="px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหา #ออเดอร์ / ชื่อสินค้า / ชื่อลูกค้า"
            className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
          />
        </label>
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
        >
          <option value="newest">ล่าสุด</option>
          <option value="deadline">ใกล้กำหนดส่ง</option>
          <option value="amount_desc">มูลค่าสูงสุด</option>
        </select>
      </div>
    </div>
  );
}
