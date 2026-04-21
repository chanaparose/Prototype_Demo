import React from 'react';
import { Search } from 'lucide-react';
import type { SortKey, TabId } from '../types';

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'needs_action', label: '🔴 ต้องดำเนินการ' },
  { id: 'in_production', label: '🟣 กำลังผลิต' },
  { id: 'awaiting_customer', label: '🟡 รอลูกค้า' },
  { id: 'shipped', label: '🔵 จัดส่งแล้ว' },
  { id: 'completed', label: '⚪ เสร็จสิ้น' },
  { id: 'cancelled', label: '⚫ ยกเลิก' },
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
    <>
      <div className="flex p-1 rounded-2xl bg-gray-100 w-full overflow-x-auto gap-0.5" role="tablist">
        {TABS.map((t) => {
          const on = tabId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={`${t.label} ${tabCounts[t.id]} รายการ`}
              onClick={() => onTabChange(t.id)}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 ${on ? 'text-white bg-violet-600' : 'text-gray-600'}`}
            >
              {t.label} <span className="text-[10px]">· {tabCounts[t.id]}</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหา #ออเดอร์ / ชื่อสินค้า / ชื่อลูกค้า"
            className="w-full bg-transparent outline-none text-sm"
          />
        </label>
        <select
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
        >
          <option value="newest">ล่าสุด</option>
          <option value="deadline">ใกล้กำหนดส่ง</option>
          <option value="amount_desc">มูลค่าสูงสุด</option>
        </select>
      </div>
    </>
  );
}
