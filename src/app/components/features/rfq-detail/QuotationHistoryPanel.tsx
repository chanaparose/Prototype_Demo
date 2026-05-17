import React from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { quotationsApi } from '@/services/api';
import type { QuotationHistoryEntry } from '@/types/rfq';
import { Button } from '@/components/ui/button';

type QuotationHistoryPanelProps = {
  quotationId: string | number;
};

const EVENT_LABEL: Record<string, string> = {
  CR: 'สร้างใบเสนอราคา',
  UP: 'แก้ไขเงื่อนไข',
  ST: 'เปลี่ยนสถานะ',
};

const EVENT_COLOR: Record<string, string> = {
  CR: '#16A34A',
  UP: '#2563EB',
  ST: '#9333EA',
};

const STATUS_LABEL: Record<string, string> = {
  PD: 'รอการตอบรับ',
  AC: 'ยืนยันแล้ว',
  RJ: 'ปฏิเสธ',
};

function toNum(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeHistoryRow(row: unknown): QuotationHistoryEntry | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const historyId = Number(r.history_id ?? 0);
  const quoteId = Number(r.quote_id ?? 0);
  if (!Number.isFinite(historyId) || historyId <= 0 || !Number.isFinite(quoteId) || quoteId <= 0)
    return null;
  return {
    history_id: historyId,
    quote_id: quoteId,
    event_type: String(r.event_type ?? 'UP') as QuotationHistoryEntry['event_type'],
    version_after: Number(r.version_after ?? 0),
    price_per_piece: toNum(r.price_per_piece),
    mold_cost: toNum(r.mold_cost),
    lead_time_days: toNum(r.lead_time_days),
    shipping_method_id: toNum(r.shipping_method_id),
    status: r.status == null ? null : String(r.status),
    reason: r.reason == null ? null : String(r.reason),
    edited_by: toNum(r.edited_by),
    created_at: String(r.created_at ?? ''),
  };
}

export function QuotationHistoryPanel({ quotationId }: QuotationHistoryPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [history, setHistory] = React.useState<QuotationHistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [fetched, setFetched] = React.useState(false);

  React.useEffect(() => {
    if (!quotationId) return;
    setLoading(true);
    setFetched(false);
    quotationsApi
      .history(quotationId)
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const mapped = arr
          .map(normalizeHistoryRow)
          .filter((v): v is QuotationHistoryEntry => v != null);
        setHistory(mapped);
      })
      .catch(() => setHistory([]))
      .finally(() => {
        setFetched(true);
        setLoading(false);
      });
  }, [quotationId]);

  if (fetched && history.length <= 1) return null;

  return (
    <div className='border border-gray-200 rounded-xl overflow-hidden bg-white'>
      <Button
        variant='unstyled'
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors'
      >
        <div className='flex items-center gap-2'>
          <Clock size={16} style={{ color: '#6366F1' }} />
          <span className='text-sm font-semibold text-gray-700'>ประวัติการแก้ไขใบเสนอราคา</span>
          {fetched && history.length > 0 ? (
            <span className='text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full'>
              {history.length} รายการ
            </span>
          ) : null}
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </Button>

      {open ? (
        <div className='divide-y divide-gray-100'>
          {loading ? (
            <div className='px-4 py-6 text-center text-sm text-gray-400'>กำลังโหลด...</div>
          ) : (
            history.map((h) => <HistoryItem key={h.history_id} entry={h} />)
          )}
        </div>
      ) : null}
    </div>
  );
}

function HistoryItem({ entry }: { entry: QuotationHistoryEntry }) {
  const label = EVENT_LABEL[entry.event_type] ?? entry.event_type;
  const color = EVENT_COLOR[entry.event_type] ?? '#6B7280';
  const date = entry.created_at
    ? new Date(entry.created_at).toLocaleString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  return (
    <div className='px-4 py-3'>
      <div className='flex items-center gap-2 mb-1.5 flex-wrap'>
        <span
          className='text-xs font-semibold px-2 py-0.5 rounded-full'
          style={{ background: `${color}18`, color }}
        >
          {label}
        </span>
        <span className='text-xs text-gray-500'>v{entry.version_after}</span>
        <span className='text-xs text-gray-400 ml-auto'>{date}</span>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-x-3 text-xs text-gray-600 mb-1'>
        {entry.price_per_piece != null ? (
          <div>
            <span className='text-gray-400'>ราคา/ชิ้น </span>
            <span className='font-medium'>฿{entry.price_per_piece.toLocaleString()}</span>
          </div>
        ) : null}
        {entry.mold_cost != null ? (
          <div>
            <span className='text-gray-400'>แม่พิมพ์ </span>
            <span className='font-medium'>฿{entry.mold_cost.toLocaleString()}</span>
          </div>
        ) : null}
        {entry.lead_time_days != null ? (
          <div>
            <span className='text-gray-400'>Lead Time </span>
            <span className='font-medium'>{entry.lead_time_days} วัน</span>
          </div>
        ) : null}
      </div>

      {entry.status ? (
        <div className='text-xs text-gray-500 mb-0.5'>
          สถานะ: <span className='font-medium'>{STATUS_LABEL[entry.status] ?? entry.status}</span>
        </div>
      ) : null}

      {entry.reason ? <div className='text-xs text-gray-500 italic'>"{entry.reason}"</div> : null}
    </div>
  );
}
