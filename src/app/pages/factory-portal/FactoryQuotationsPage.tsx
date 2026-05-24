import { Link } from 'react-router';
import { ChevronRight, FileCheck } from 'lucide-react';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import { useFactoryQuotationsListQuery } from '@/domain/factory/queries/useFactoryQuotationsListQuery';
import type { IQuotationResponse } from '@/services/api/types/rfq.types';
import {
  QUOTATION_STATUS_BADGE_FACTORY,
  QUOTATION_STATUS_LABEL_FACTORY,
} from '@/domain/rfq/constants';

function quoteId(r: IQuotationResponse): string {
  return String(r.quote_id);
}

function rfqId(r: IQuotationResponse): string {
  return String(r.rfq_id);
}

export function FactoryQuotationsPage() {
  const listQ = useFactoryQuotationsListQuery();
  const rows = listQ.data ?? [];
  const loading = listQ.isLoading;
  const error = listQ.error;

  if (loading) {
    return (
      <div className='space-y-4'>
        <FactoryPageHeader title='ใบเสนอราคา' subtitle='Factory Portal' icon={FileCheck} />
        <div className='flex justify-center items-start pt-8'>
          <div
            className='w-10 h-10 border-3 border-t-transparent rounded-full animate-spin'
            style={{ borderColor: 'var(--brand-indigo)', borderTopColor: 'transparent' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <FactoryPageHeader
        title='ใบเสนอราคา'
        subtitle='Factory Portal'
        icon={FileCheck}
        count={`${rows.length} รายการ`}
      />

      {error ? (
        <p className='text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3'>
          โหลดรายการใบเสนอราคาไม่สำเร็จ — ฟีเจอร์นี้อาจยังไม่พร้อมบนเซิร์ฟเวอร์
        </p>
      ) : null}

      {rows.length === 0 && !error ? (
        <div className='rounded-2xl border border-gray-100 bg-white px-4 py-12 text-center space-y-4'>
          <div className='text-5xl'>📄</div>
          <p className='text-base font-bold' style={{ color: 'var(--brand-navy)' }}>
            ยังไม่มีใบเสนอราคา
          </p>
          <p className='text-sm text-gray-400'>ไปที่กระดาน RFQ เพื่อเริ่มเสนอราคา</p>
          <Link
            to='/factory/rfqs'
            className='inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white'
            style={{
              background:
                'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-indigo-dark) 100%)',
              boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
            }}
          >
            ดูกระดาน RFQ
          </Link>
        </div>
      ) : (
        <ul className='space-y-3'>
          {rows.map((r, idx) => {
            const id = quoteId(r);
            const st = String(r.status || 'PD').toUpperCase();
            const canEdit = st === 'PD';
            const badge = QUOTATION_STATUS_BADGE_FACTORY[st] ?? QUOTATION_STATUS_BADGE_FACTORY.PD;
            return (
              <li key={id || String(idx)}>
                <div className='flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 sm:p-4 min-w-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200'>
                  <div className='min-w-0 flex-1 space-y-1'>
                    <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>
                      #{id}
                      {rfqId(r) ? ` · RFQ ${rfqId(r)}` : ''}
                    </p>
                    <p className='font-bold text-sm' style={{ color: 'var(--brand-navy)' }}>
                      {formatCurrencyNoDecimals(r.price_per_piece)}
                      {r.lead_time_days > 0 ? (
                        <span className='font-normal text-gray-500'> · {r.lead_time_days} วัน</span>
                      ) : null}
                    </p>
                    <span
                      className='inline-block rounded-full text-[11px] font-semibold px-2.5 py-0.5'
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {QUOTATION_STATUS_LABEL_FACTORY[st] ?? st}
                    </span>
                  </div>
                  {canEdit && id ? (
                    <Link
                      to={`/factory/quotations/${id}/edit`}
                      className='shrink-0 inline-flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-xl text-white'
                      style={{
                        background:
                          'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-indigo-dark) 100%)',
                        boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
                      }}
                    >
                      แก้ไข
                      <ChevronRight size={16} />
                    </Link>
                  ) : (
                    <span className='text-xs text-gray-400 shrink-0 px-2 py-1 bg-gray-50 rounded-lg'>
                      ล็อกแล้ว
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
