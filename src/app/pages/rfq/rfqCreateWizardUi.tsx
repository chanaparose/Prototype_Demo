import React from 'react';
import { ChevronDown, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RFQDraft } from '@/pages/rfq/useRFQDraft';

/** มุมมน + เส้นขอบมาตรฐาน — ใช้ร่วมกันทุก control ในหน้า /create-rfq */
export const RFQ_RADIUS = 'rounded-lg';

export const RFQ_BORDER = 'border-[0.5px] border-gray-200';

/** สไตล์ช่องกรอก — ไม่มีเงา (override shadow-sm จาก ui/input) */
export const RFQ_FIELD_CLASS = [
  'w-full shadow-none bg-white px-3 py-2.5 text-[11px] font-normal text-brand-navy-deep xl:text-[13px] 2xl:text-sm',
  RFQ_RADIUS,
  RFQ_BORDER,
  'placeholder:text-[11px] placeholder:font-normal placeholder:text-neutral-placeholder xl:placeholder:text-[13px] 2xl:placeholder:text-sm',
  'data-[placeholder]:text-[11px] data-[placeholder]:font-normal xl:data-[placeholder]:text-[13px] 2xl:data-[placeholder]:text-sm',
  'focus:border-brand-violet-deep focus:outline-none focus:ring-2 focus:ring-[rgba(109,40,217,0.10)]',
].join(' ');

export const RFQ_LABEL_CLASS = 'text-[11px] font-semibold text-brand-navy-deep xl:text-[13px] 2xl:text-sm';
export const RFQ_HELP_CLASS = 'text-[11px] text-neutral-subtle xl:text-[12px] 2xl:text-[13px]';

/** ปุ่ม/การ์ดเลือก (ที่อยู่, จัดส่ง, ประเภท RFQ ฯลฯ) */
export const RFQ_CHOICE_SHELL = `${RFQ_RADIUS} border transition-all`;

export const rfqChoiceClass = (active: boolean, activeBorder = 'border-brand-violet-deep') =>
  active
    ? `${RFQ_CHOICE_SHELL} ${activeBorder} border bg-brand-violet-soft`
    : `${RFQ_CHOICE_SHELL} ${RFQ_BORDER} bg-white hover:border-gray-300`;

export const REQUEST_KIND_OPTIONS = [
  { id: 'PR' as const, label: 'OEM', desc: 'ขอราคาผลิต' },
  { id: 'MR' as const, label: 'วัตถุดิบ', desc: 'ขอราคาสั่งซื้อ' },
  { id: 'PS' as const, label: 'ตัวอย่าง สินค้า', desc: 'สั่งซื้อตัวอย่าง' },
  { id: 'MS' as const, label: 'ตัวอย่าง วัตถุดิบ', desc: 'สั่งซื้อตัวอย่าง' },
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
      className={`overflow-hidden ${RFQ_RADIUS} ${RFQ_BORDER} bg-white ${className}`}
    >
      <div className='flex items-start justify-between gap-2 border-b border-gray-100 px-4 py-3 lg:px-5'>
        <div className='min-w-0'>
          <p className='text-[13px] font-bold text-brand-navy-deep xl:text-[15px] 2xl:text-base'>{title}</p>
          {hint ? <p className='mt-0.5 text-[11px] leading-snug text-neutral-subtle xl:text-[12px] 2xl:text-[13px]'>{hint}</p> : null}
        </div>
        {required ? (
          <span className='shrink-0 rounded-full bg-[rgba(227,136,68,0.12)] px-2 py-0.5 text-[10px] font-semibold text-brand-orange-deep xl:text-[11px]'>
            จำเป็น
          </span>
        ) : optional ? (
          <span className='shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-neutral-subtle xl:text-[11px]'>
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
            className={`${RFQ_CHOICE_SHELL} px-3 py-2.5 text-left active:scale-[0.98] ${
              active
                ? isSample
                  ? 'border border-brand-orange-deep bg-[rgba(242,138,46,0.1)]'
                  : 'border border-brand-violet-deep bg-brand-violet-soft'
                : `${RFQ_BORDER} bg-white hover:border-brand-mauve-light`
            }`}
          >
            <p
              className={`text-[13px] font-bold leading-tight xl:text-[15px] 2xl:text-base ${active ? (isSample ? 'text-brand-orange-deep' : 'text-brand-violet-deep') : 'text-brand-navy'}`}
            >
              {opt.label}
            </p>
            <p className='mt-0.5 text-[10px] text-neutral-subtle xl:text-[12px]'>{opt.desc}</p>
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
      className={`flex items-center gap-2.5 ${RFQ_RADIUS} ${RFQ_BORDER} px-3 py-2.5 ${
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
        <p className={`text-[12px] font-semibold xl:text-sm ${ok ? 'text-brand-navy-deep' : 'text-amber-800'}`}>
          {loading ? 'กำลังค้นหาโรงงานที่ตรงสเปก…' : `พบ ${n} โรงงานที่รับงานนี้`}
        </p>
        {!loading && isMaterialKind && n <= 0 ? (
          <p className='mt-0.5 text-[11px] leading-snug text-amber-700 xl:text-[12px]'>
            ลองเปลี่ยนหมวดหมู่ หรือเลือกโหมด OEM
          </p>
        ) : !loading && ok ? (
          <p className='mt-0.5 text-[11px] text-neutral-subtle xl:text-[12px]'>ระบบจะส่ง RFQ ไปยังโรงงานที่ตรงหมวด</p>
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
      className={`group overflow-hidden ${RFQ_RADIUS} ${RFQ_BORDER} bg-white`}
      open={defaultOpen}
    >
      <summary className='flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-brand-violet-soft/70 active:bg-brand-violet-soft group-open:bg-brand-violet-soft/60 marker:content-none lg:px-5 [&::-webkit-details-marker]:hidden'>
        <span className='text-[13px] font-bold text-brand-navy-deep xl:text-[15px] 2xl:text-base'>{title}</span>
        <span className='flex items-center gap-1 text-[10px] font-medium text-neutral-subtle xl:text-[11px]'>
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
          <p className={`mb-3 ${RFQ_RADIUS} border-[0.5px] border-brand-violet-soft bg-brand-lavender-chip px-3 py-2 text-[11px] leading-snug text-brand-violet-deep xl:text-[12px]`}>
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
      <dt className='text-[11px] font-medium text-neutral-subtle xl:text-[12px]'>{label}</dt>
      <dd className='mt-0.5 text-[13px] font-medium text-brand-navy-deep break-words xl:text-[15px]'>{value || '—'}</dd>
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
    <section className={`${RFQ_RADIUS} ${RFQ_BORDER} bg-white px-4 py-1 lg:px-5`}>
      <p className='border-b border-gray-100 py-2.5 text-[13px] font-bold text-brand-navy-deep xl:text-[15px] 2xl:text-base'>{title}</p>
      <dl>{children}</dl>
    </section>
  );
}
