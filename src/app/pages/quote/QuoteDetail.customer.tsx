import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { quotationApi } from '@/services/api/rfqApi';
import { MoneyText } from '@/shared/ui/MoneyText';
import { DiffRow } from '@/shared/ui/DiffRow';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

type AnyObj = Record<string, unknown>;

export function QuoteDetailCustomer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qid = Number(id ?? 0);
  const [row, setRow] = React.useState<AnyObj | null>(null);
  const [history, setHistory] = React.useState<AnyObj[]>([]);
  const [compare, setCompare] = React.useState<{ before: AnyObj; after: AnyObj } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [requesting, setRequesting] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [q, h] = await Promise.all([quotationApi.get(qid), quotationApi.history(qid)]);
        if (!mounted) return;
        setRow(q);
        setHistory(Array.isArray(h) ? h : []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [qid]);

  if (loading || !row) {
    return <div className='px-4 py-10 text-sm text-gray-500'>กำลังโหลดใบเสนอราคา...</div>;
  }

  const accepted = String(row.status ?? '').toUpperCase() === 'AC';
  const currency = String(row.currency_code ?? 'THB');
  const breakdown = (row.breakdown ?? row) as AnyObj;
  const items = Array.isArray(row.items) ? (row.items as AnyObj[]) : [];

  return (
    <div className='max-w-5xl mx-auto px-4 py-6 space-y-4'>
      <div className='bg-white rounded-2xl border border-gray-100 p-4'>
        <p className='text-xs text-gray-400'>Quote #{qid}</p>
        <h1 className='text-lg font-bold text-gray-900'>
          {String(row.factory_name ?? row.factoryName ?? 'Factory quotation')}
        </h1>
        <p className='text-xs text-gray-500 mt-1'>
          Revision v{String(row.version ?? 1)} · valid {String(row.valid_until ?? '-')}
        </p>
        {accepted ? (
          <p className='mt-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs px-3 py-2'>
            Accepted on {String(row.accepted_at ?? '-')} - Order #{String(row.order_id ?? '-')}
          </p>
        ) : null}
      </div>

      <div className='bg-white rounded-2xl border border-gray-100 p-4'>
        <p className='text-sm font-bold text-gray-900 mb-2'>Items</p>
        <div className='space-y-2'>
          {items.map((it, i) => (
            <div key={i} className='grid grid-cols-12 text-xs'>
              <p className='col-span-1 text-gray-400'>{String(it.item_no ?? i + 1)}</p>
              <p className='col-span-5'>{String(it.description ?? '-')}</p>
              <p className='col-span-2 text-right'>{String(it.qty ?? 0)}</p>
              <p className='col-span-2 text-right'>
                <MoneyText value={Number(it.unit_price ?? 0)} currencyCode={currency} />
              </p>
              <p className='col-span-2 text-right'>
                <MoneyText value={Number(it.line_total ?? 0)} currencyCode={currency} />
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className='bg-white rounded-2xl border border-gray-100 p-4 space-y-1'>
        <p className='text-sm font-bold text-gray-900 mb-2'>Breakdown</p>
        <div className='flex justify-between text-sm'>
          <span>Subtotal</span>
          <MoneyText value={Number(breakdown.subtotal ?? 0)} currencyCode={currency} />
        </div>
        <div className='flex justify-between text-sm'>
          <span>Shipping</span>
          <MoneyText value={Number(breakdown.shipping_cost ?? 0)} currencyCode={currency} />
        </div>
        <div className='flex justify-between text-sm'>
          <span>Packaging</span>
          <MoneyText value={Number(breakdown.packaging_cost ?? 0)} currencyCode={currency} />
        </div>
        <div className='flex justify-between text-sm'>
          <span>Tooling</span>
          <MoneyText value={Number(breakdown.tooling_mold_cost ?? 0)} currencyCode={currency} />
        </div>
        <div className='flex justify-between text-sm'>
          <span>VAT</span>
          <MoneyText value={Number(breakdown.vat_amount ?? 0)} currencyCode={currency} />
        </div>
        <hr />
        <div className='flex justify-between font-semibold'>
          <span>Grand Total</span>
          <MoneyText value={Number(breakdown.grand_total ?? 0)} currencyCode={currency} />
        </div>
      </div>

      <div className='flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700'>
        <Info size={14} className='mt-0.5 shrink-0' />
        <span>หากท่านเป็นนิติบุคคล อาจต้องหัก WHT 1-3% ก่อนชำระ กรุณาตกลงกับผู้ขายโดยตรง</span>
      </div>

      {history.length > 1 ? (
        <div className='bg-white rounded-2xl border border-gray-100 p-4 space-y-2'>
          <div className='flex flex-wrap items-center gap-2'>
            {history.map((h, i) => (
              <Button
                variant='unstyled'
                key={String(h.quotation_id ?? i)}
                type='button'
                onClick={() => {
                  if (i === 0) return;
                  setCompare({ before: history[i - 1], after: history[i] });
                }}
                className='px-2 py-1 rounded-lg text-xs border border-gray-200'
              >
                v{String(h.version ?? i + 1)}
              </Button>
            ))}
          </div>
          {compare ? (
            <div className='rounded-xl bg-gray-50 p-2'>
              <DiffRow
                label='Subtotal'
                before={String(compare.before.subtotal ?? '-')}
                after={String(compare.after.subtotal ?? '-')}
                changed={compare.before.subtotal !== compare.after.subtotal}
              />
              <DiffRow
                label='Lead time'
                before={String(compare.before.lead_time_days ?? '-')}
                after={String(compare.after.lead_time_days ?? '-')}
                changed={compare.before.lead_time_days !== compare.after.lead_time_days}
              />
              <DiffRow
                label='Grand total'
                before={String(compare.before.grand_total ?? '-')}
                after={String(compare.after.grand_total ?? '-')}
                changed={compare.before.grand_total !== compare.after.grand_total}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className='grid grid-cols-3 gap-2'>
        <Button
          variant='unstyled'
          type='button'
          disabled={accepted || requesting}
          onClick={async () => {
            const reason = window.prompt('เหตุผลที่ต้องการแก้ไข') ?? '';
            if (!reason.trim()) return;
            setRequesting(true);
            try {
              await quotationApi.requestRevision(qid, { reason });
            } finally {
              setRequesting(false);
            }
          }}
          className='py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-50'
        >
          Request Revision
        </Button>
        <Button
          variant='unstyled'
          type='button'
          disabled={accepted || rejecting}
          onClick={async () => {
            const reason = window.prompt('เหตุผลที่ปฏิเสธ') ?? '';
            setRejecting(true);
            try {
              await quotationApi.reject(qid, reason);
              navigate(-1);
            } finally {
              setRejecting(false);
            }
          }}
          className='py-2 rounded-xl border border-rose-200 text-rose-600 text-sm disabled:opacity-50'
        >
          Reject
        </Button>
        <Button
          variant='unstyled'
          type='button'
          disabled={accepted}
          onClick={async () => {
            await quotationApi.accept(qid);
            navigate(0);
          }}
          className='py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-50'
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
