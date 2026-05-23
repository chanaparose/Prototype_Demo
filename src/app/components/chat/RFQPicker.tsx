import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react';
import { messagesApi } from '@/services/api/chatApi';
import { rfqsApi } from '@/services/api/rfqApi';
import { toast } from 'sonner';
import { useAppMutation } from '@/hooks/useAppMutation';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { formatDate } from '@/utils/formatting/formatDate';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import { AppDialog } from '@/components/ui/app-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatKeys } from '@/lib/queryKeys';
import { apiListAsRecords, asRecord, type ApiRecord } from '@/lib/apiShape';

type Props = {
  conversationId: number;
  receiverId: number;
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

function toOpenRfqItem(row: ApiRecord): OpenRfqItem | null {
  const rfqId = Number(row.rfq_id ?? row.id ?? 0);
  if (!Number.isFinite(rfqId) || rfqId <= 0) return null;
  const status = String(row.status ?? '').toUpperCase();
  if (!(status === 'OP' || status === 'PD')) return null;
  return {
    rfq_id: rfqId,
    title: String(row.title ?? row.project_name ?? `RFQ #${rfqId}`),
    status,
    category_name: String(row.category_name ?? row.category ?? '').trim() || undefined,
    target_price: row.target_price != null ? Number(row.target_price) : undefined,
    required_delivery_date:
      String(row.required_delivery_date ?? row.deadline ?? row.target_date ?? '').trim() ||
      undefined,
  };
}

export function RFQPicker({ conversationId, receiverId, onSelect, onCancel }: Props) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [selectedRfqId, setSelectedRfqId] = useState<number | null>(null);

  const shareRfqMutation = useAppMutation({
    mutationFn: async (rfqId: number) => {
      const res = await messagesApi.send(conversationId, {
        content: '',
        receiver_id: receiverId,
        message_type: 'rfq_card',
        reference_type: 'RQ',
        reference_id: rfqId,
      });
      return asRecord(res);
    },
    onMutate: (rfqId) => setSelectedRfqId(rfqId),
    onSuccess: (res) => onSelect(res),
    onError: () => setSelectedRfqId(null),
    onErrorMessage: (message) => toast.error(message),
    fallbackMessage: 'แนบ RFQ ไม่สำเร็จ',
  });

  const q = useQuery({
    queryKey: chatKeys.rfqPicker(),
    queryFn: async () => {
      return apiListAsRecords(await rfqsApi.list())
        .map(toOpenRfqItem)
        .filter((x): x is OpenRfqItem => x !== null);
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const list = q.data ?? [];
    const key = keyword.trim().toLowerCase();
    if (!key) return list;
    return list.filter(
      (r) =>
        r.title.toLowerCase().includes(key) ||
        String(r.category_name ?? '')
          .toLowerCase()
          .includes(key),
    );
  }, [q.data, keyword]);

  const handleShare = (rfqId: number) => {
    if (shareRfqMutation.isPending) return;
    void shareRfqMutation.mutate(rfqId);
  };

  return (
    <AppDialog
      open
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
      title='แนบ RFQ'
      variant='sheet'
      size='md'
      bodyClassName='px-0 py-0 flex flex-col max-h-[min(80vh,100dvh)]'
      className='overflow-hidden flex flex-col'
    >
      <div className='w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4 lg:hidden' />

      <div className='px-4 py-3 border-b border-gray-100'>
        <div className='relative'>
          <Search className='w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2' />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder='ค้นหา RFQ...'
            className='w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm'
          />
        </div>
      </div>

      <div className='overflow-y-auto'>
        {q.isLoading ? (
          <p className='px-4 py-8 text-sm text-gray-500 text-center'>กำลังโหลด RFQ...</p>
        ) : filtered.length === 0 ? (
          <p className='px-4 py-8 text-sm text-gray-500 text-center'>ไม่พบ RFQ ที่เปิดอยู่</p>
        ) : (
          filtered.map((rfq) => (
            <Button
              variant='unstyled'
              key={rfq.rfq_id}
              type='button'
              onClick={() => void handleShare(rfq.rfq_id)}
              disabled={selectedRfqId === rfq.rfq_id}
              className='w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 disabled:opacity-60'
            >
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <p className='text-sm font-semibold text-gray-900 truncate'>{rfq.title}</p>
                  <p className='text-xs text-gray-500 mt-0.5'>
                    {rfq.target_price ? `งบ ${formatCurrency(rfq.target_price, 'THB')}` : 'ไม่มีงบ'}
                    {rfq.required_delivery_date
                      ? ` · กำหนด ${formatDate(rfq.required_delivery_date, 'd MMMM yyyy')}`
                      : ''}
                  </p>
                  {rfq.category_name ? (
                    <p className='text-xs text-gray-500 mt-0.5'>หมวด: {rfq.category_name}</p>
                  ) : null}
                </div>
                <StatusBadge variant='success' size='sm'>
                  เปิด
                </StatusBadge>
              </div>
              {selectedRfqId === rfq.rfq_id ? (
                <p className='text-[11px] text-violet-600 mt-1'>กำลังแนบ...</p>
              ) : null}
            </Button>
          ))
        )}

        <Button
          variant='unstyled'
          type='button'
          onClick={() => {
            onCancel();
            navigate('/create-rfq');
          }}
          className='w-full px-4 py-4 text-sm text-brand-mauve font-medium flex items-center gap-1 hover:bg-violet-50'
        >
          <Plus size={14} /> สร้างคำขอราคา
        </Button>
      </div>
    </AppDialog>
  );
}
