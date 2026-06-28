import { ClipboardList, GitCompare } from 'lucide-react';
import {
  RFQ_DETAIL_TAB_ACTIVE_CLASS,
  RFQ_DETAIL_TAB_ICON_ACTIVE_CLASS,
  RFQ_DETAIL_TAB_ICON_IDLE_CLASS,
  RFQ_DETAIL_TAB_IDLE_CLASS,
  RFQ_DETAIL_TAB_INDICATOR_CLASS,
  RFQ_DETAIL_TAB_LIST_CLASS,
} from '@/components/features/rfq-detail/rfqDetailTheme';

export type RfqDetailTab = 'specs' | 'offers';

const DETAIL_TABS: {
  id: RfqDetailTab;
  label: string;
  icon: typeof ClipboardList;
  dataTour?: string;
}[] = [
  { id: 'specs', label: 'สเปกโครงการ', icon: ClipboardList },
  { id: 'offers', label: 'ใบเสนอราคา', icon: GitCompare, dataTour: 'tab-offers' },
];

export function RfqDetailTabBar({
  activeTab,
  offerCount,
  onChange,
}: {
  activeTab: RfqDetailTab;
  offerCount: number;
  onChange: (tab: RfqDetailTab) => void;
}) {
  return (
    <div role='tablist' aria-label='รายละเอียดคำขอราคา' className={RFQ_DETAIL_TAB_LIST_CLASS}>
      {DETAIL_TABS.map((tab) => {
        const active = activeTab === tab.id;
        const Icon = tab.icon;
        const countLabel = tab.id === 'offers' && offerCount > 0 ? ` (${offerCount})` : '';
        return (
          <button
            key={tab.id}
            type='button'
            role='tab'
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            {...(tab.dataTour ? { 'data-tour': tab.dataTour } : {})}
            className={`relative flex min-w-0 items-center justify-center gap-1.5 px-3 py-3 text-center transition-colors ${
              active ? RFQ_DETAIL_TAB_ACTIVE_CLASS : RFQ_DETAIL_TAB_IDLE_CLASS
            }`}
          >
            <Icon
              size={15}
              strokeWidth={2.1}
              className={`shrink-0 ${active ? RFQ_DETAIL_TAB_ICON_ACTIVE_CLASS : RFQ_DETAIL_TAB_ICON_IDLE_CLASS}`}
              aria-hidden
            />
            <span
              className={`truncate text-[12px] font-semibold leading-tight ${
                active ? 'text-brand-violet-deep' : 'text-slate-500'
              }`}
            >
              {tab.label}
              {countLabel}
            </span>
            {active ? <span className={RFQ_DETAIL_TAB_INDICATOR_CLASS} /> : null}
          </button>
        );
      })}
    </div>
  );
}
