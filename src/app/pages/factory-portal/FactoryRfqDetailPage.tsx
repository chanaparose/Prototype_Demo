import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { rfqsApi, masterApi, quotationsApi, conversationsApi } from '../../services/api';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { DeadlineBadge } from '../../components/factory/DeadlineBadge';
import { ShippingMethodLockedField } from '../../components/factory/ShippingMethodLockedField';
import { summarizeRfqAddress } from '../../utils/rfqAddressSummary';
import { hoursUntilDeadline } from '../../utils/rfqDeadline';

type QuoteRow = Record<string, unknown>;

function quoteFid(q: QuoteRow): number | null {
  const n = Number(q.factory_id ?? q.factoryId);
  return Number.isFinite(n) ? n : null;
}

function quoteIdOf(q: QuoteRow): string {
  return String(q.quote_id ?? q.id ?? '');
}

export function FactoryRfqDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const isDesktop = useIsDesktop();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqBody, setRfqBody] = useState<Record<string, unknown>>({});
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [shippingMethods, setShippingMethods] = useState<Record<string, unknown>[]>([]);

  const [price, setPrice] = useState('');
  const [mold, setMold] = useState('');
  const [leadDays, setLeadDays] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [detail, qList, ships] = await Promise.all([
        rfqsApi.get(id),
        rfqsApi.listQuotations(id),
        masterApi.shippingMethods(),
      ]);
      const rfq = (detail.rfq ?? {}) as Record<string, unknown>;
      setRfqTitle(String(rfq.title ?? ''));
      setRfqBody(rfq);
      setQuotes(Array.isArray(qList) ? (qList as QuoteRow[]) : []);
      setShippingMethods(Array.isArray(ships) ? (ships as Record<string, unknown>[]) : []);
      const sidCheck = Number(rfq.shipping_method_id ?? 0);
      if (!Number.isFinite(sidCheck) || sidCheck <= 0) {
        console.warn('[FactoryRfqDetail] RFQ missing shipping_method_id', { rfq_id: rfq.rfq_id ?? id });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const myQuote = fid != null ? quotes.find((q) => quoteFid(q) === fid) : undefined;
  const myStatus = myQuote ? String(myQuote.status ?? 'PD').toUpperCase() : '';
  const canEdit = Boolean(myQuote && myStatus === 'PD');

  useEffect(() => {
    if (myQuote) {
      setPrice(String(myQuote.price_per_piece ?? ''));
      setMold(String(myQuote.mold_cost ?? ''));
      setLeadDays(String(myQuote.lead_time_days ?? ''));
    } else {
      setPrice('');
      setMold('');
      setLeadDays('');
    }
  }, [myQuote]);

  const rfqShipId = useMemo(() => {
    const n = Number(rfqBody.shipping_method_id ?? 0);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [rfqBody]);

  const customerShipLabel = useMemo(() => {
    const byName = String(rfqBody.shipping_method_name ?? '').trim();
    if (byName) return byName;
    if (rfqShipId == null) return '';
    const row = shippingMethods.find((m) => Number(m.shipping_method_id ?? m.id) === rfqShipId);
    return row ? String(row.method_name ?? row.name ?? '').trim() : '';
  }, [rfqBody, rfqShipId, shippingMethods]);

  const deadlineIso = useMemo(() => {
    const raw = String(
      rfqBody.deadline ?? rfqBody.target_date ?? rfqBody.rfq_deadline ?? rfqBody.expires_at ?? '',
    ).trim();
    return raw || null;
  }, [rfqBody]);

  const targetDaysCustomer = useMemo(() => {
    const n = Number(
      rfqBody.target_days ??
        rfqBody.lead_time_target ??
        rfqBody.customer_lead_days ??
        rfqBody.delivery_days ??
        0,
    );
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [rfqBody]);

  const addressSummary = useMemo(() => summarizeRfqAddress(rfqBody), [rfqBody]);

  const imageUrls = useMemo(() => {
    const urls = rfqBody.image_urls;
    const out: string[] = [];
    if (Array.isArray(urls)) {
      for (const u of urls) {
        if (typeof u === 'string' && u.trim()) out.push(u.trim());
      }
    }
    return out;
  }, [rfqBody]);

  const budgetPerPiece = useMemo(() => {
    const n = Number(rfqBody.budget_per_piece ?? 0);
    return Number.isFinite(n) ? n : null;
  }, [rfqBody]);

  const quantity = useMemo(() => {
    const n = Number(rfqBody.quantity ?? 0);
    return Number.isFinite(n) ? n : null;
  }, [rfqBody]);

  const revenueApprox = useMemo(() => {
    if (budgetPerPiece == null || quantity == null) return null;
    return budgetPerPiece * quantity;
  }, [budgetPerPiece, quantity]);

  const competitorCount = useMemo(() => {
    if (fid == null) return quotes.length;
    return quotes.filter((q) => quoteFid(q) !== fid).length;
  }, [quotes, fid]);

  const rfqStatus = String(rfqBody.status ?? '').toUpperCase();

  const buildPayload = useCallback(() => {
    const sid = rfqShipId;
    return {
      factory_id: fid as number,
      price_per_piece: Number(price),
      mold_cost: Number(mold) || 0,
      lead_time_days: Number(leadDays),
      shipping_method_id: sid != null ? sid : 0,
    };
  }, [fid, price, mold, leadDays, rfqShipId]);

  const formWarnings = useMemo(() => {
    const w: string[] = [];
    const p = Number(price);
    const ld = Number(leadDays);
    if (budgetPerPiece != null && Number.isFinite(p) && p > budgetPerPiece) {
      w.push('ราคาสูงกว่างบลูกค้า อาจถูกปฏิเสธ');
    }
    if (targetDaysCustomer != null && Number.isFinite(ld) && ld > targetDaysCustomer) {
      w.push(`ช้ากว่าที่ลูกค้าต้องการ ${targetDaysCustomer} วัน`);
    }
    const h = hoursUntilDeadline(deadlineIso);
    if (h != null && h > 0 && h < 24) {
      w.push('RFQ ใกล้ปิดรับ รีบยืนยัน');
    }
    return w;
  }, [price, leadDays, budgetPerPiece, targetDaysCustomer, deadlineIso]);

  const submitQuote = async () => {
    if (!id) return;
    if (fid == null) {
      setError('ไม่พบข้อมูลโรงงาน กรุณา login ใหม่');
      return;
    }
    if (rfqShipId == null) {
      setError('RFQ นี้ยังไม่ระบุวิธีจัดส่ง กรุณาติดต่อลูกค้า');
      return;
    }
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) {
      setError('กรอกราคาต่อชิ้น');
      return;
    }
    const ld = Number(leadDays);
    if (!Number.isFinite(ld) || ld <= 0) {
      setError('กรอกระยะเวลาผลิต (วัน)');
      return;
    }
    const payload = buildPayload();
    setSubmitting(true);
    setError('');
    try {
      if (myQuote && canEdit) {
        await quotationsApi.patch(quoteIdOf(myQuote), payload);
      } else if (!myQuote) {
        await rfqsApi.createQuotation(id, payload);
      }
      const customerId = Number(
        rfqBody.customer_id ?? rfqBody.user_id ?? rfqBody.customer_user_id ?? 0,
      );
      if (customerId > 0 && fid != null) {
        try {
          await conversationsApi.create({ customer_id: customerId, factory_id: fid });
        } catch {
          /* ห้องสนทนาอาจมีอยู่แล้ว */
        }
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกใบเสนอราคาไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelQuote = async () => {
    if (!myQuote) return;
    const qid = quoteIdOf(myQuote);
    if (!qid) return;
    setSubmitting(true);
    setError('');
    try {
      try {
        await quotationsApi.delete(qid);
      } catch {
        await quotationsApi.updateStatus(qid, 'RJ');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ยกเลิกใบเสนอราคาไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const twoCol = isDesktop ? 'lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start' : '';

  const customerCat = String(rfqBody.category_name ?? '').trim();
  const customerSub = String(rfqBody.sub_category_name ?? '').trim();
  const breadcrumb =
    customerCat && customerSub ? `${customerCat} › ${customerSub}` : customerSub || customerCat || '—';

  const canSubmitForm = (!myQuote || canEdit) && rfqShipId != null && fid != null;

  if (!id) {
    return null;
  }

  return (
    <div className="w-full min-w-0 max-w-lg lg:max-w-5xl mx-auto pb-24 pb-[max(6rem,env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center gap-3 mb-5 sm:mb-6 min-w-0">
        <button
          type="button"
          onClick={() => navigate('/factory/rfqs')}
          className="w-10 h-10 shrink-0 rounded-xl border border-gray-200 flex items-center justify-center bg-white"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-gray-400">RFQ</p>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 break-words">
            #{id} · {rfqTitle || '—'}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
              {rfqStatus || '—'}
            </span>
            {deadlineIso ? <DeadlineBadge deadlineIso={deadlineIso} /> : null}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
          />
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
      ) : null}

      {!loading ? (
        <div className={twoCol}>
          <div className="space-y-4 mb-4 lg:mb-0 min-w-0">
            {myQuote ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  myStatus === 'PD'
                    ? 'border-violet-200 bg-violet-50/80 text-violet-950'
                    : myStatus === 'AC'
                      ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                      : 'border-gray-200 bg-gray-50 text-gray-800'
                }`}
              >
                <p className="font-bold">สถานะใบเสนอราคาของคุณ</p>
                <p className="mt-1">
                  {myStatus === 'PD'
                    ? 'รอลูกค้าตัดสินใจ'
                    : myStatus === 'AC'
                      ? 'ลูกค้ารับแล้ว'
                      : myStatus === 'RJ'
                        ? 'ปิด / ถูกปฏิเสธ'
                        : myStatus}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
                คุณยังไม่ได้ส่งใบเสนอราคาสำหรับ RFQ นี้
              </div>
            )}

            {imageUrls.length > 0 ? (
              <section className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">รูปอ้างอิง</h2>
                <div className="flex flex-wrap gap-2">
                  {imageUrls.slice(0, 5).map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setLightbox(i)}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {imageUrls.length > 5 ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500">
                      +{imageUrls.length - 5}
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 space-y-2 text-sm break-words">
              <p>
                <span className="text-gray-500">หมวดหมู่: </span>
                {breadcrumb}
              </p>
              <p>
                <span className="text-gray-500">จำนวน: </span>
                {quantity != null ? `${quantity.toLocaleString('th-TH')} ชิ้น` : '—'}
              </p>
              <p>
                <span className="text-gray-500">งบ/ชิ้น: </span>
                {budgetPerPiece != null
                  ? `${budgetPerPiece.toLocaleString('th-TH')} บาท`
                  : '—'}
              </p>
              {revenueApprox != null ? (
                <p>
                  <span className="text-gray-500">รวมประเมิน: </span>≈ ฿
                  {Math.round(revenueApprox).toLocaleString('th-TH')}
                </p>
              ) : null}
              {targetDaysCustomer != null ? (
                <p>
                  <span className="text-gray-500">Lead time ที่ลูกค้าต้องการ: </span>
                  {targetDaysCustomer} วัน
                </p>
              ) : null}
              <div className="pt-1">
                <ShippingMethodLockedField
                  label="วิธีจัดส่ง (ลูกค้าเลือก)"
                  methodName={customerShipLabel || '—'}
                  hint="ล็อกตาม RFQ — โรงงานเปลี่ยนไม่ได้"
                  emptyFallback="—"
                />
              </div>
              {addressSummary ? (
                <p>
                  <span className="text-gray-500">📍 ที่อยู่ปลายทาง: </span>
                  {addressSummary}
                </p>
              ) : (
                <p>
                  <span className="text-gray-500">📍 ที่อยู่ปลายทาง: </span>—
                </p>
              )}
              <p>
                <span className="text-gray-500">รายละเอียด: </span>
                {String(rfqBody.details ?? rfqBody.description ?? '—')}
              </p>
            </section>

            <p className="text-sm text-gray-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
              คู่แข่งที่เสนอราคา: <strong>{competitorCount}</strong> ราย
              <span className="text-gray-500"> (ไม่แสดงราคาของคู่แข่ง)</span>
            </p>
          </div>

          <section className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 space-y-3 min-w-0">
            <h2 className="font-bold text-gray-900">
              {myQuote && canEdit ? 'แก้ไขใบเสนอราคา' : myQuote ? 'ดูใบเสนอราคา' : 'ส่งใบเสนอราคา'}
            </h2>

            {rfqShipId == null ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-sm px-3 py-2">
                RFQ นี้ยังไม่ระบุวิธีจัดส่ง — ไม่สามารถเสนอราคาได้ กรุณาติดต่อลูกค้า
              </div>
            ) : null}

            <label className="block">
              <span className="text-xs text-gray-500">ราคา/ชิ้น *</span>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={!!myQuote && !canEdit}
              />
              {budgetPerPiece != null ? (
                <span className="text-[11px] text-gray-500">งบลูกค้า {budgetPerPiece.toLocaleString('th-TH')} บ./ชิ้น</span>
              ) : null}
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">ค่าแม่พิมพ์ (ถ้ามี)</span>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                value={mold}
                onChange={(e) => setMold(e.target.value)}
                disabled={!!myQuote && !canEdit}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Lead time (วัน) *</span>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                value={leadDays}
                onChange={(e) => setLeadDays(e.target.value)}
                disabled={!!myQuote && !canEdit}
              />
              {targetDaysCustomer != null ? (
                <span className="text-[11px] text-gray-500">ลูกค้าต้องการ {targetDaysCustomer} วัน</span>
              ) : null}
            </label>

            <ShippingMethodLockedField
              methodName={customerShipLabel || `#${rfqShipId}`}
              hint="ใช้ตามที่ลูกค้าเลือกไว้ใน RFQ"
            />

            {formWarnings.length > 0 ? (
              <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 space-y-1">
                {formWarnings.map((w) => (
                  <li key={w}>⚠ {w}</li>
                ))}
              </ul>
            ) : null}

            {(!myQuote || canEdit) && (
              <button
                type="button"
                disabled={submitting || !canSubmitForm}
                onClick={() => void submitQuote()}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
              >
                {submitting ? 'กำลังบันทึก...' : myQuote ? 'บันทึกการแก้ไข' : 'ส่งใบเสนอราคา'}
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void cancelQuote()}
                className="w-full py-3 rounded-xl border border-red-200 text-red-600 text-sm font-semibold"
              >
                ถอนใบเสนอราคา
              </button>
            )}
          </section>
        </div>
      ) : null}

      {lightbox != null && imageUrls[lightbox] ? (
        <div
          role="presentation"
          className="fixed inset-0 z-[60] bg-black/75 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
            onClick={() => setLightbox(null)}
            aria-label="ปิด"
          >
            <X size={22} />
          </button>
          <img
            src={imageUrls[lightbox]}
            alt=""
            className="max-w-full max-h-[85vh] object-contain rounded-lg pointer-events-none"
          />
        </div>
      ) : null}
    </div>
  );
}
