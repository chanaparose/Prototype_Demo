import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { quotationApi } from '@/services/api/rfqApi';
import { MoneyText } from '@/shared/ui/MoneyText';
import { DiffRow } from '@/shared/ui/DiffRow';
import { Button } from '@/components/ui/button';
import { usePromptDialog } from '@/shared/ui/modals/PromptDialog';
import {
  mapQuoteDetail,
  mapQuoteHistory,
  type QuoteDetailModel,
  type QuoteHistoryEntry,
} from '@/domain/quote/mappers/mapQuoteDetail';
import { useAppMutation } from '@/hooks/useAppMutation';

export function QuoteDetailCustomer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qid = Number(id ?? 0);
  const [compare, setCompare] = useState<{ before: QuoteHistoryEntry; after: QuoteHistoryEntry } | null>(null);
  const { prompt, PromptDialog } = usePromptDialog();

  const quoteQuery = useQuery({
    queryKey: ['quotation', 'detail', qid],
    queryFn: async () => {
      const [q, h] = await Promise.all([quotationApi.get(qid), quotationApi.history(qid)]);
      return { quote: mapQuoteDetail(q), history: mapQuoteHistory(h) };
    },
    enabled: qid > 0,
  });

  const revisionMutation = useAppMutation({
    mutationFn: (reason: string) => quotationApi.requestRevision(qid, { reason }),
  });

  const rejectMutation = useAppMutation({
    mutationFn: (reason: string) => quotationApi.reject(qid, { reason }),
    onSuccess: () => navigate(-1),
  });

  const acceptMutation = useAppMutation({
    mutationFn: () => quotationApi.accept(qid),
    onSuccess: () => navigate(0),
  });

  const quote = quoteQuery.data?.quote ?? null;
  const history = quoteQuery.data?.history ?? [];
  const loading = quoteQuery.isLoading;

  if (loading || !quote) {
    return <div className='px-4 py-10 text-sm text-gray-500'>กำลังโหลดใบเสนอราคา...</div>;
  }

  return (
    <div className='max-w-5xl mx-auto px-4 py-6 space-y-4'>
      <PromptDialog />
      <div className='bg-white rounded-2xl border border-gray-100 p-4'>
        <p className='text-xs text-gray-400'>Quote #{qid}</p>
        <h1 className='text-lg font-bold text-gray-900'>
          {quote.factoryName}
        </h1>
        <p className='text-xs text-gray-500 mt-1'>
          Revision v{quote.version} · valid {quote.validUntil}
        </p>
        {quote.accepted ? (
          <p className='mt-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs px-3 py-2'>
            Accepted on {quote.acceptedAt} - Order #{quote.orderId}
          </p>
        ) : null}
      </div>

      <div className='bg-white rounded-2xl border border-gray-100 p-4'>
        <p className='text-sm font-bold text-gray-900 mb-2'>Items</p>
        <div className='space-y-2'>
          {quote.items.map((it, index) => (
            <div key={`${it.itemNo}-${index}`} className='grid grid-cols-12 text-xs'>
              <p className='col-span-1 text-gray-400'>{it.itemNo}</p>
              <p className='col-span-5'>{it.description}</p>
              <p className='col-span-2 text-right'>{it.qty}</p>
              <p className='col-span-2 text-right'>
                <MoneyText value={it.unitPrice} currencyCode={quote.currencyCode} />
              </p>
              <p className='col-span-2 text-right'>
                <MoneyText value={it.lineTotal} currencyCode={quote.currencyCode} />
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className='bg-white rounded-2xl border border-gray-100 p-4 space-y-1'>
        <p className='text-sm font-bold text-gray-900 mb-2'>Breakdown</p>
        <div className='flex justify-between text-sm'>
          <span>Subtotal</span>
          <MoneyText value={quote.breakdown.subtotal} currencyCode={quote.currencyCode} />
        </div>
        <div className='flex justify-between text-sm'>
          <span>Shipping</span>
          <MoneyText value={quote.breakdown.shippingCost} currencyCode={quote.currencyCode} />
        </div>
        <div className='flex justify-between text-sm'>
          <span>Packaging</span>
          <MoneyText value={quote.breakdown.packagingCost} currencyCode={quote.currencyCode} />
        </div>
        <div className='flex justify-between text-sm'>
          <span>Tooling</span>
          <MoneyText value={quote.breakdown.toolingMoldCost} currencyCode={quote.currencyCode} />
        </div>
        <div className='flex justify-between text-sm'>
          <span>VAT</span>
          <MoneyText value={quote.breakdown.vatAmount} currencyCode={quote.currencyCode} />
        </div>
        <hr />
        <div className='flex justify-between font-semibold'>
          <span>Grand Total</span>
          <MoneyText value={quote.breakdown.grandTotal} currencyCode={quote.currencyCode} />
        </div>
      </div>

      <div className='rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700'>
        ℹ️ หากท่านเป็นนิติบุคคล อาจต้องหัก WHT 1-3% ก่อนชำระ กรุณาตกลงกับผู้ขายโดยตรง
      </div>

      {history.length > 1 ? (
        <div className='bg-white rounded-2xl border border-gray-100 p-4 space-y-2'>
          <div className='flex flex-wrap items-center gap-2'>
            {history.map((h, i) => (
              <Button
                variant='unstyled'
                key={h.quotationId}
                type='button'
                onClick={() => {
                  if (i === 0) return;
                  setCompare({ before: history[i - 1], after: history[i] });
                }}
                className='px-2 py-1 rounded-lg text-xs border border-gray-200'
              >
                v{h.version}
              </Button>
            ))}
          </div>
          {compare ? (
            <div className='rounded-xl bg-gray-50 p-2'>
              <DiffRow
                label='Subtotal'
                before={String(compare.before.subtotal)}
                after={String(compare.after.subtotal)}
                changed={compare.before.subtotal !== compare.after.subtotal}
              />
              <DiffRow
                label='Lead time'
                before={compare.before.leadTimeDays}
                after={compare.after.leadTimeDays}
                changed={compare.before.leadTimeDays !== compare.after.leadTimeDays}
              />
              <DiffRow
                label='Grand total'
                before={String(compare.before.grandTotal)}
                after={String(compare.after.grandTotal)}
                changed={compare.before.grandTotal !== compare.after.grandTotal}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className='grid grid-cols-3 gap-2'>
        <Button
          variant='unstyled'
          type='button'
          disabled={quote.accepted || revisionMutation.isPending}
          onClick={async () => {
            const reason = await prompt({
              title: 'ขอแก้ไขใบเสนอราคา',
              label: 'เหตุผลที่ต้องการแก้ไข',
              placeholder: 'ระบุรายละเอียดที่อยากให้โรงงานแก้ไข',
              confirmText: 'ส่งคำขอแก้ไข',
            });
            if (!reason) return;
            void revisionMutation.mutate(reason);
          }}
          className='py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-50'
        >
          Request Revision
        </Button>
        <Button
          variant='unstyled'
          type='button'
          disabled={quote.accepted || rejectMutation.isPending}
          onClick={async () => {
            const reason = await prompt({
              title: 'ปฏิเสธใบเสนอราคา',
              label: 'เหตุผลที่ปฏิเสธ',
              placeholder: 'ระบุเหตุผลเพื่อแจ้งโรงงาน',
              confirmText: 'ปฏิเสธ',
              required: false,
            });
            if (reason == null) return;
            void rejectMutation.mutate(reason);
          }}
          className='py-2 rounded-xl border border-rose-200 text-rose-600 text-sm disabled:opacity-50'
        >
          Reject
        </Button>
        <Button
          variant='unstyled'
          type='button'
          disabled={quote.accepted || acceptMutation.isPending}
          onClick={() => void acceptMutation.mutate()}
          className='py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-50'
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
