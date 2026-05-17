import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, FileCheck } from 'lucide-react';
import { quotationsApi } from '@/services/api';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';

type Row = Record<string, unknown>;

function quoteId(r: Row): string {
  return String(r.quote_id ?? r.id ?? '');
}

function rfqId(r: Row): string {
  return String(r.rfq_id ?? r.rfqId ?? '');
}

const STATUS_LABEL: Record<string, string> = {
  PD: 'รอลูกค้าตัดสินใจ',
  AC: 'ลูกค้ารับแล้ว',
  RJ: 'ปิด / ถูกปฏิเสธ',
};

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  PD: { bg: 'rgba(162,56,255,0.12)', color: '#4F46E5' },
  AC: { bg: 'rgba(16,185,129,0.12)', color: '#059669' },
  RJ: { bg: 'rgba(239,68,68,0.10)', color: '#DC2626' },
};

export function FactoryQuotationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const raw = await quotationsApi.listMine();
        if (!cancelled) setRows(Array.isArray(raw) ? (raw as Row[]) : []);
      } catch {
        if (!cancelled) {
          setRows([]);
          setError('โหลดรายการใบเสนอราคาไม่สำเร็จ — ฟีเจอร์นี้อาจยังไม่พร้อมบนเซิร์ฟเวอร์');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className='space-y-4'>
        <FactoryPageHeader title='ใบเสนอราคา' subtitle='Factory Portal' icon={FileCheck} />
        <div className='flex justify-center items-start pt-8'>
          <div
            className='w-10 h-10 border-3 border-t-transparent rounded-full animate-spin'
            style={{ borderColor: '#4F46E5', borderTopColor: 'transparent' }}
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
          {error}
        </p>
      ) : null}

      {rows.length === 0 && !error ? (
        <div className='rounded-2xl border border-gray-100 bg-white px-4 py-12 text-center space-y-4'>
          <div className='text-5xl'>📄</div>
          <p className='text-base font-bold' style={{ color: '#2E2252' }}>
            ยังไม่มีใบเสนอราคา
          </p>
          <p className='text-sm text-gray-400'>ไปที่กระดาน RFQ เพื่อเริ่มเสนอราคา</p>
          <Link
            to='/factory/rfqs'
            className='inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white'
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
              boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
            }}
          >
            ดูกระดาน RFQ
          </Link>
        </div>
      ) : (
        <ul className='space-y-3'>
          {rows.map((r) => {
            const id = quoteId(r);
            const st = String(r.status ?? 'PD').toUpperCase();
            const canEdit = st === 'PD';
            const badge = STATUS_BADGE[st] ?? STATUS_BADGE.PD;
            return (
              <li key={id || JSON.stringify(r)}>
                <div className='flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 sm:p-4 min-w-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200'>
                  <div className='min-w-0 flex-1 space-y-1'>
                    <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>
                      #{id}
                      {rfqId(r) ? ` · RFQ ${rfqId(r)}` : ''}
                    </p>
                    <p className='font-bold text-sm' style={{ color: '#2E2252' }}>
                      ฿{Number(r.price_per_piece ?? 0).toLocaleString('th-TH')}
                      {r.lead_time_days != null ? (
                        <span className='font-normal text-gray-500'>
                          {' '}
                          · {String(r.lead_time_days)} วัน
                        </span>
                      ) : null}
                    </p>
                    <span
                      className='inline-block rounded-full text-[11px] font-semibold px-2.5 py-0.5'
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {STATUS_LABEL[st] ?? st}
                    </span>
                  </div>
                  {canEdit && id ? (
                    <Link
                      to={`/factory/quotations/${id}/edit`}
                      className='shrink-0 inline-flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-xl text-white'
                      style={{
                        background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
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
