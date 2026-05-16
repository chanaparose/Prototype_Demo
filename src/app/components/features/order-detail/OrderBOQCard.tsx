import React, { useEffect, useState } from 'react';
import { ChevronDown, CheckCircle } from 'lucide-react';
import { rfqsApi } from '../../../services/api';
import type { QuotationRow } from '../../../types/rfq';
import { formatCurrency } from '@/utils/formatting';

interface Props {
  rfqId: number | string;
  quoteId: number | string;
  factoryId: number | string;
  factoryName?: string;
}

const fmt = (n: number) =>
  formatCurrency(n, 'THB').replace('฿', '').trim();

const paymentTermsLabel: Record<string, string> = {
  lc_at_sight: 'ชำระเต็ม 100% ก่อนผลิต',
  full_payment: 'ชำระเต็ม 100%',
  '50_50': 'แบ่งชำระ 50/50',
  '30_70': 'แบ่งชำระ 30/70',
  net_30: 'Net 30 วัน',
};

export function OrderBOQCard({ rfqId, quoteId, factoryId, factoryName }: Props) {
  const [open, setOpen] = useState(true);
  const [quotation, setQuotation] = useState<QuotationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const rid = Number(rfqId);
    const qid = Number(quoteId);
    const fid = Number(factoryId);
    if (!Number.isFinite(rid) || rid <= 0) {
      setLoading(false);
      return () => void 0;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const list = await rfqsApi.listQuotations(rid);
        const rows = Array.isArray(list) ? list : [];
        // Match by quote_id first, fall back to factory_id
        const found =
          rows.find((q) => Number(q.quote_id) === qid) ??
          rows.find((q) => Number(q.factory_id) === fid) ??
          null;
        if (mounted) setQuotation(found);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [rfqId, quoteId, factoryId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-violet-400 rounded-full animate-spin" />
          กำลังโหลดใบเสนอราคา...
        </div>
      </div>
    );
  }
  if (error || !quotation) return null;

  const q = quotation;
  const subtotal = Number(q.subtotal ?? 0);
  const shippingCost = Number(q.shipping_cost ?? 0);
  const packagingCost = Number(q.packaging_cost ?? 0);
  const toolingMoldCost = Number(q.tooling_mold_cost ?? q.mold_cost ?? 0);
  const discountAmount = Number(q.discount_amount ?? 0);
  const vatRate = Number(q.vat_rate ?? 0);
  const vatAmount = Number(q.vat_amount ?? 0);
  const grandTotal = Number(q.grand_total ?? 0);
  const validityDays = Number(q.validity_days ?? 0);
  const validUntil = String(q.valid_until ?? '').split('T')[0];
  const paymentTerms = String(q.payment_terms ?? '');
  const paymentLabel = paymentTermsLabel[paymentTerms] ?? paymentTerms;

  const imageUrls: string[] = Array.isArray(q.image_urls)
    ? q.image_urls.filter((u) => typeof u === 'string' && u.trim())
    : [];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">ใบเสนอราคา BOQ</span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle size={10} /> ยอมรับแล้ว
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-4">
          {/* Factory header row */}
          <div className="flex items-center gap-2.5 -mt-1">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-base shrink-0">
              🏭
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {factoryName ?? `โรงงาน #${q.factory_id}`}
              </p>
              <p className="text-[10px] text-gray-400">ผู้รับผลิต · #{q.quote_id}</p>
            </div>
          </div>

          {/* KPI tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'ราคาต่อชิ้น', value: `฿${fmt(Number(q.price_per_piece ?? 0))}`, accent: true },
              { label: 'Lead time (วัน)', value: String(q.lead_time_days ?? '-'), accent: false },
              { label: 'ค่าสินค้ารวม (ก่อน VAT)', value: `฿${fmt(subtotal)}`, accent: false },
              { label: 'อายุใบเสนอ', value: validityDays > 0 ? `${validityDays} วัน` : '-', accent: false },
            ].map((tile) => (
              <div key={tile.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p
                  className="text-sm font-bold"
                  style={{ color: tile.accent ? '#7A4B94' : '#2E2252' }}
                >
                  {tile.value}
                </p>
                <p className="text-[9px] text-gray-500 mt-0.5">{tile.label}</p>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
              รายละเอียดค่าใช้จ่าย
            </p>

            <Row label="ค่าสินค้ารวม" value={`฿${fmt(subtotal)}`} />
            {shippingCost > 0 && <Row label="ค่าขนส่ง" value={`฿${fmt(shippingCost)}`} />}
            {packagingCost > 0 && <Row label="ค่าบรรจุภัณฑ์" value={`฿${fmt(packagingCost)}`} />}
            {toolingMoldCost > 0 && <Row label="ค่าแม่พิมพ์ / Tooling" value={`฿${fmt(toolingMoldCost)}`} />}
            {discountAmount > 0 && (
              <Row label="ส่วนลด" value={`-฿${fmt(discountAmount)}`} valueColor="text-emerald-600" />
            )}

            <div className="border-t border-gray-200 pt-1.5 mt-1">
              <Row
                label={`VAT ${vatRate > 0 ? `${vatRate}%` : ''}`}
                value={`฿${fmt(vatAmount)}`}
              />
            </div>

            <div className="border-t border-gray-200 pt-1.5 mt-1">
              <Row
                label="รวมทั้งหมด (Grand total)"
                value={`฿${fmt(grandTotal)}`}
                bold
                valueColor="text-[#7A4B94]"
              />
            </div>

          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {paymentLabel && (
              <div className="rounded-xl bg-violet-50 px-3 py-2">
                <p className="text-[9px] text-gray-400 mb-0.5">เงื่อนไขชำระเงิน</p>
                <p className="font-semibold text-violet-800">{paymentLabel}</p>
              </div>
            )}
            {validUntil && (
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-[9px] text-gray-400 mb-0.5">ใบเสนอราคาถึง</p>
                <p className="font-semibold text-gray-800">{validUntil}</p>
              </div>
            )}
          </div>

          {/* Images */}
          {imageUrls.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                รูปประกอบใบเสนอราคา
              </p>
              <div className="grid grid-cols-3 gap-2">
                {imageUrls.map((url) => (
                  <div key={url} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
  valueColor,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`text-[11px] ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span
        className={`text-[11px] ${bold ? 'font-bold' : 'font-semibold'} ${
          valueColor ?? (muted ? 'text-gray-500' : 'text-[#2E2252]')
        }`}
      >
        {value}
      </span>
    </div>
  );
}
