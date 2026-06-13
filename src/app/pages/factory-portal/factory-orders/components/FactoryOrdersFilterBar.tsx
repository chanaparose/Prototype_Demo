import React from 'react';
import { Search } from 'lucide-react';
import type { SortKey, TabId } from '@/pages/factory-portal/factory-orders/types';
import { TabNavigation } from '@/shared/ui/sections/TabNavigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const { tabId, onTabChange, tabCounts, sortKey, onSortChange, searchQuery, onSearchChange } =
    props;
  return (
    <div className='rounded-lg border border-slate-200 bg-white p-3 sm:p-4 space-y-3'>
      <div className='flex p-1 rounded-lg bg-slate-100 w-full overflow-x-auto gap-1' role='tablist'>
        <TabNavigation
          tabs={TABS.map((tab) => ({ ...tab, count: tabCounts[tab.id] }))}
          activeTabId={tabId}
          onTabChange={(id) => onTabChange(id as TabId)}
          className='border-b-0 gap-1'
          tabClassName='px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0'
        />
      </div>
      <div className='flex flex-col sm:flex-row gap-2'>
        <Label className='flex-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2'>
          <Search size={16} className='text-slate-400' />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='ค้นหา #ออเดอร์ / ชื่อสินค้า / ชื่อลูกค้า'
            className='w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400'
          />
        </Label>
        <Select value={sortKey} onValueChange={(next) => onSortChange(next as SortKey)}>
          <SelectTrigger className='w-full sm:w-44 text-slate-700'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='newest'>ล่าสุด</SelectItem>
            <SelectItem value='deadline'>ใกล้กำหนดส่ง</SelectItem>
            <SelectItem value='amount_desc'>มูลค่าสูงสุด</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
