import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, FileText } from 'lucide-react';
import { quotationsApi } from '../../services/api';

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
      <div className="flex justify-center py-16">
        <div
          className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full min-w-0 pb-6 sm:pb-8">
      <div className="min-w-0 flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(162,56,255,0.12)' }}
        >
          <FileText size={20} style={{ color: '#A238FF' }} />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">ใบเสนอราคา</p>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">ใบเสนอราคาของฉัน</h1>
          <p className="text-xs text-gray-500 mt-1">
            แก้ไขได้เมื่อสถานะยังเป็น PD — ลิงก์ไปหน้าแก้ไข (Phase 1.5)
          </p>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          {error}
        </p>
      ) : null}

      <ul className="space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-100 p-6 text-center">
            ยังไม่มีใบเสนอราคา หรือยังไม่สามารถโหลดจาก API ได้
          </li>
        ) : (
          rows.map((r) => {
            const id = quoteId(r);
            const st = String(r.status ?? 'PD').toUpperCase();
            const canEdit = st === 'PD';
            return (
              <li key={id || JSON.stringify(r)}>
                <div className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400">
                      #{id}
                      {rfqId(r) ? ` · RFQ ${rfqId(r)}` : ''}
                    </p>
                    <p className="font-semibold text-gray-900 truncate">
                      ฿{Number(r.price_per_piece ?? 0).toLocaleString('th-TH')}
                      {r.lead_time_days != null ? ` · ${String(r.lead_time_days)} วัน` : ''}
                    </p>
                    <p className="text-xs mt-1 font-medium" style={{ color: '#A238FF' }}>
                      {STATUS_LABEL[st] ?? st}
                    </p>
                  </div>
                  {canEdit && id ? (
                    <Link
                      to={`/factory/quotations/${id}/edit`}
                      className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-xl text-white"
                      style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
                    >
                      แก้ไข
                      <ChevronRight size={18} />
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-400 shrink-0">ล็อกแล้ว</span>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
