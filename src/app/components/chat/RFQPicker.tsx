import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Plus } from 'lucide-react';
import { conversationsApi, rfqsApi } from '../../services/api';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/utils/formatting';

type Props = {
  conversationId: number;
  onSelect: (sharedMessage?: Record<string, unknown>) => void;
  onCancel: () => void;
};

type OpenRfqItem = {
  rfq_id: number;
  title: string;
  status: string;
  category_name?: string;
  target_price?: number;
  required_delivery_date?: string;
};

function toOpenRfqItem(row: Record<string, unknown>): OpenRfqItem | null {
  const rfqId = Number(row.rfq_id ?? row.id ?? 0);
  if (!Number.isFinite(rfqId) || rfqId <= 0) return null;
  const status = String(row.status ?? '').toUpperCase();
  if (!(status === 'OP' || status === 'PD')) return null;
  return {
    rfq_id: rfqId,
    title: String(row.title ?? row.project_name ?? `RFQ #${rfqId}`),
    status,
    category_name: String(row.category_name ?? row.category ?? '').trim() || undefined,
    target_price:
      row.target_price != null ? Number(row.target_price) : undefined,
    required_delivery_date: String(
      row.required_delivery_date ?? row.deadline ?? row.target_date ?? '',
    ).trim() || undefined,
  };
}

export function RFQPicker({ conversationId, onSelect, onCancel }: Props) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [selectedRfqId, setSelectedRfqId] = useState<number | null>(null);

  const q = useQuery({
    queryKey: ['rfqs', 'open', 'picker'],
    queryFn: async () => {
      const [opRows, pdRows] = await Promise.all([rfqsApi.list('OP'), rfqsApi.list('PD')]);
      const op = (Array.isArray(opRows) ? opRows : []) as Record<string, unknown>[];
      const pd = (Array.isArray(pdRows) ? pdRows : []) as Record<string, unknown>[];
      const merged = [...op, ...pd];
      const mapped = merged.map(toOpenRfqItem).filter((x): x is OpenRfqItem => x !== null);
      const seen = new Set<number>();
      return mapped.filter((item) => {
        if (seen.has(item.rfq_id)) return false;
        seen.add(item.rfq_id);
        return true;
      });
    },
  });

  const filtered = useMemo(() => {
    const list = q.data ?? [];
    const key = keyword.trim().toLowerCase();
    if (!key) return list;
    return list.filter((r) =>
      r.title.toLowerCase().includes(key) ||
      String(r.category_name ?? '').toLowerCase().includes(key),
    );
  }, [q.data, keyword]);

  const handleShare = async (rfqId: number) => {
    setSelectedRfqId(rfqId);
    try {
      const res = await conversationsApi.shareRfq(conversationId, rfqId);
      const message =
        (res.message && typeof res.message === 'object'
          ? (res.message as Record<string, unknown>)
          : undefined) ??
        ((res.data as Record<string, unknown> | undefined)?.message &&
        typeof (res.data as Record<string, unknown>).message === 'object'
          ? ((res.data as Record<string, unknown>).message as Record<string, unknown>)
          : undefined);
      onSelect(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'แนบ RFQ ไม่สำเร็จ');
      setSelectedRfqId(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onCancel} />
      <div className="fixed z-50 bottom-0 left-0 right-0 lg:inset-0 lg:flex lg:items-center lg:justify-center">
        <div className="bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col lg:max-w-md lg:w-full">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4 lg:hidden" />
          <div className="px-4 pb-3 flex items-center justify-between border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">แนบ RFQ</p>
            <button type="button" onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
              <X size={16} />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="ค้นหา RFQ..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>

          <div className="overflow-y-auto">
            {q.isLoading ? (
              <p className="px-4 py-8 text-sm text-gray-500 text-center">กำลังโหลด RFQ...</p>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-8 text-sm text-gray-500 text-center">ไม่พบ RFQ ที่เปิดอยู่</p>
            ) : (
              filtered.map((rfq) => (
                <button
                  key={rfq.rfq_id}
                  type="button"
                  onClick={() => void handleShare(rfq.rfq_id)}
                  disabled={selectedRfqId === rfq.rfq_id}
                  className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 disabled:opacity-60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{rfq.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {rfq.target_price ? `งบ ${formatCurrency(rfq.target_price, 'THB')}` : 'ไม่มีงบ'}
                        {rfq.required_delivery_date ? ` · กำหนด ${formatDate(rfq.required_delivery_date, 'd MMMM yyyy')}` : ''}
                      </p>
                      {rfq.category_name ? (
                        <p className="text-xs text-gray-500 mt-0.5">หมวด: {rfq.category_name}</p>
                      ) : null}
                    </div>
                    <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-green-50 text-green-700 shrink-0">
                      เปิด
                    </span>
                  </div>
                  {selectedRfqId === rfq.rfq_id ? (
                    <p className="text-[11px] text-violet-600 mt-1">กำลังแนบ...</p>
                  ) : null}
                </button>
              ))
            )}

            <button
              type="button"
              onClick={() => {
                onCancel();
                navigate('/create-rfq');
              }}
              className="w-full px-4 py-4 text-sm text-[#7A4B94] font-medium flex items-center gap-1 hover:bg-violet-50"
            >
              <Plus size={14} /> สร้างคำขอราคา
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
