import React from 'react';
import { ChevronDown, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RFQDraft } from '@/pages/rfq/useRFQDraft';

export const REQUEST_KIND_OPTIONS = [
  { id: 'PR' as const, label: 'OEM', desc: 'ขอราคาผลิต' },
  { id: 'MR' as const, label: 'วัตถุดิบ', desc: 'ขอราคาสั่งซื้อ' },
  { id: 'PS' as const, label: 'ตัวอย่าง สินค้า', desc: 'สินค้า 1–10' },
  { id: 'MS' as const, label: 'ตัวอย่าง วัตถุดิบ', desc: 'วัตถุดิบ 1–5' },
] as const;

type RfqFormSectionProps = {
  title: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
  'data-tour'?: string;
};

export function RfqFormSection({
  title,
  hint,
  required,
  optional,
  children,
  className = '',
  'data-tour': dataTour,
}: RfqFormSectionProps) {
  return (
    <section
      data-tour={dataTour}
      className={`overflow-hidden rounded-2xl border border-gray-100 bg-white ${className}`}
    >
      <div className='flex items-start justify-between gap-2 border-b border-gray-100 px-4 py-3 lg:px-5'>
        <div className='min-w-0'>
          <p className='text-[13px] font-bold text-brand-navy-deep'>{title}</p>
          {hint ? <p className='mt-0.5 text-[11px] leading-snug text-neutral-subtle'>{hint}</p> : null}
        </div>
        {required ? (
          <span className='shrink-0 rounded-full bg-[rgba(227,136,68,0.12)] px-2 py-0.5 text-[10px] font-semibold text-brand-orange-deep'>
            จำเป็น
          </span>
        ) : optional ? (
          <span className='shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-neutral-subtle'>
            เสริม
          </span>
        ) : null}
      </div>
      <div className='p-4 lg:p-5'>{children}</div>
    </section>
  );
}

type RfqKindPickerProps = {
  kind: RFQDraft['request_kind'];
  onSelect: (id: (typeof REQUEST_KIND_OPTIONS)[number]['id']) => void;
};

export function RfqKindPicker({ kind, onSelect }: RfqKindPickerProps) {
  return (
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
      {REQUEST_KIND_OPTIONS.map((opt) => {
        const active = kind === opt.id;
        const isSample = opt.id === 'PS' || opt.id === 'MS';
        return (
          <Button
            variant='unstyled'
            key={opt.id}
            type='button'
            onClick={() => onSelect(opt.id)}
            className={`rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98] ${
              active
                ? isSample
                  ? 'border-brand-orange-deep bg-[rgba(242,138,46,0.1)]'
                  : 'border-brand-violet-deep bg-brand-violet-soft'
                : 'border-gray-200 bg-white hover:border-brand-mauve-light'
            }`}
          >
            <p
              className={`text-[13px] font-bold leading-tight ${active ? (isSample ? 'text-brand-orange-deep' : 'text-brand-violet-deep') : 'text-brand-navy'}`}
            >
              {opt.label}
            </p>
            <p className='mt-0.5 text-[10px] text-neutral-subtle'>{opt.desc}</p>
          </Button>
        );
      })}
    </div>
  );
}

type RfqMatchStripProps = {
  loading: boolean;
  count: number | null;
  isMaterialKind: boolean;
};

export function RfqMatchStrip({ loading, count, isMaterialKind }: RfqMatchStripProps) {
  const n = count ?? 0;
  const ok = !loading && n > 0;
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
        ok
          ? isMaterialKind
            ? 'border-emerald-200 bg-emerald-50/90'
            : 'border-brand-violet-soft bg-brand-lavender-chip'
          : 'border-amber-200 bg-amber-50/90'
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          ok ? 'bg-white text-brand-violet-deep' : 'bg-white text-amber-600'
        }`}
      >
        <Factory size={16} />
      </div>
      <div className='min-w-0 flex-1'>
        <p className={`text-[12px] font-semibold ${ok ? 'text-brand-navy-deep' : 'text-amber-800'}`}>
          {loading ? 'กำลังค้นหาโรงงานที่ตรงสเปก…' : `พบ ${n} โรงงานที่รับงานนี้`}
        </p>
        {!loading && isMaterialKind && n <= 0 ? (
          <p className='mt-0.5 text-[11px] leading-snug text-amber-700'>
            ลองเปลี่ยนหมวดหมู่ หรือเลือกโหมด OEM
          </p>
        ) : !loading && ok ? (
          <p className='mt-0.5 text-[11px] text-neutral-subtle'>ระบบจะส่ง RFQ ไปยังโรงงานที่ตรงหมวด</p>
        ) : null}
      </div>
    </div>
  );
}

type RfqCollapsibleSectionProps = {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function RfqCollapsibleSection({
  title,
  hint,
  defaultOpen = false,
  children,
}: RfqCollapsibleSectionProps) {
  return (
    <details
      className='group overflow-hidden rounded-2xl border border-gray-100 bg-white'
      open={defaultOpen}
    >
      <summary className='flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 marker:content-none lg:px-5 [&::-webkit-details-marker]:hidden'>
        <span className='text-[13px] font-bold text-brand-navy-deep'>{title}</span>
        <span className='flex items-center gap-1 text-[10px] font-medium text-neutral-subtle'>
          ไม่บังคับ
          <ChevronDown
            size={14}
            className='transition-transform group-open:rotate-180'
            aria-hidden
          />
        </span>
      </summary>
      <div className='border-t border-gray-100 px-4 pb-4 pt-3 lg:px-5 lg:pb-5'>
        {hint ? (
          <p className='mb-3 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-[11px] leading-snug text-violet-800'>
            {hint}
          </p>
        ) : null}
        {children}
      </div>
    </details>
  );
}

type SummaryItemProps = { label: string; value: React.ReactNode };

export function RfqSummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className='min-w-0 py-2 border-b border-gray-50 last:border-0'>
      <dt className='text-[11px] font-medium text-neutral-subtle'>{label}</dt>
      <dd className='mt-0.5 text-[13px] font-medium text-brand-navy-deep break-words'>{value || '—'}</dd>
    </div>
  );
}

export function RfqSummaryCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className='rounded-2xl border border-gray-100 bg-white px-4 py-1 lg:px-5'>
      <p className='border-b border-gray-100 py-2.5 text-[13px] font-bold text-brand-navy-deep'>{title}</p>
      <dl>{children}</dl>
    </section>
  );
}
