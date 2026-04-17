import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { rfqsApi, masterApi, quotationsApi, conversationsApi } from '../../services/api';
import { useIsDesktop } from '../../hooks/useIsDesktop';

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
  const [shipId, setShipId] = useState('');

  const [submitting, setSubmitting] = useState(false);

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
  const canEdit = myQuote && myStatus === 'PD';

  useEffect(() => {
    if (myQuote) {
      setPrice(String(myQuote.price_per_piece ?? ''));
      setMold(String(myQuote.mold_cost ?? ''));
      setLeadDays(String(myQuote.lead_time_days ?? ''));
      setShipId(String(myQuote.shipping_method_id ?? ''));
    } else {
      setPrice('');
      setMold('');
      setLeadDays('');
      setShipId('');
    }
  }, [myQuote]);

  const payload = () => ({
    price_per_piece: Number(price),
    mold_cost: Number(mold) || 0,
    lead_time_days: Number(leadDays) || 0,
    shipping_method_id: Number(shipId) || 1,
  });

  const submitQuote = async () => {
    if (!id) return;
    if (!price || Number.isNaN(Number(price))) {
      setError('กรุณากรอกราคาต่อชิ้น');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (myQuote && canEdit) {
        await quotationsApi.patch(quoteIdOf(myQuote), payload());
      } else if (!myQuote) {
        await rfqsApi.createQuotation(id, payload());
      }
      const customerId = Number(
        rfqBody.customer_id ?? rfqBody.user_id ?? rfqBody.customer_user_id ?? 0,
      );
      if (customerId > 0 && fid != null) {
        try {
          await conversationsApi.create({ customer_id: customerId, factory_id: fid });
        } catch {
          /* ห้องสนทนาอาจมีอยู่แล้ว — ไม่บล็อก flow */
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
      setError(e instanceof Error ? e.message : 'ยกเลิกใบเสนอราคาไม่สำเร็จ — อาจต้องรองรับจาก API');
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    return null;
  }

  const twoCol = isDesktop ? 'lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start' : '';

  const customerSub = String(rfqBody.sub_category_name ?? '').trim();
  const customerShipLabel = useMemo(() => {
    const byName = String(rfqBody.shipping_method_name ?? '').trim();
    if (byName) return byName;
    const sid = Number(rfqBody.shipping_method_id ?? 0);
    if (!sid) return '';
    const row = shippingMethods.find((m) => Number(m.shipping_method_id ?? m.id) === sid);
    return row ? String(row.method_name ?? row.name ?? '').trim() : '';
  }, [rfqBody, shippingMethods]);

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
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400">RFQ</p>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
            {rfqTitle || `#${id}`}
          </h1>
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
            <section className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 space-y-2 text-sm break-words">
              {!loading ? (
                <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 space-y-1 mb-1">
                  <p>
                    <span className="text-gray-500">ประเภทย่อย (ลูกค้า): </span>
                    {customerSub || '—'}
                  </p>
                  <p>
                    <span className="text-gray-500">วิธีจัดส่งที่ลูกค้าต้องการ: </span>
                    {customerShipLabel || '—'}
                  </p>
                </div>
              ) : null}
              <p>
                <span className="text-gray-500">รายละเอียด: </span>
                {String(rfqBody.details ?? rfqBody.description ?? '—')}
              </p>
              <p>
                <span className="text-gray-500">จำนวน: </span>
                {String(rfqBody.quantity ?? '—')}
              </p>
              <p>
                <span className="text-gray-500">งบ/ชิ้น: </span>
                {String(rfqBody.budget_per_piece ?? '—')}
              </p>
            </section>

            {myQuote ? (
              <p className="text-sm px-0.5">
                สถานะใบเสนอราคาของคุณ:{' '}
                <strong>
                  {myStatus === 'PD'
                    ? 'รอลูกค้าตัดสินใจ'
                    : myStatus === 'AC'
                      ? 'ลูกค้ารับแล้ว'
                      : myStatus === 'RJ'
                        ? 'ปิด / ถูกปฏิเสธ'
                        : myStatus}
                </strong>
              </p>
            ) : (
              <p className="text-sm text-gray-600 px-0.5">
                คุณยังไม่ได้ส่งใบเสนอราคาสำหรับ RFQ นี้
              </p>
            )}
          </div>

          <section className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 space-y-3 min-w-0">
        <h2 className="font-bold text-gray-900">
          {myQuote && canEdit ? 'แก้ไขใบเสนอราคา' : myQuote ? 'ดูใบเสนอราคา' : 'ส่งใบเสนอราคา'}
        </h2>
        <label className="block">
          <span className="text-xs text-gray-500">ราคาต่อชิ้น</span>
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={!!myQuote && !canEdit}
          />
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
          <span className="text-xs text-gray-500">Lead time (วัน)</span>
          <input
            type="number"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={leadDays}
            onChange={(e) => setLeadDays(e.target.value)}
            disabled={!!myQuote && !canEdit}
          />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500">วิธีจัดส่ง</span>
          <select
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={shipId}
            onChange={(e) => setShipId(e.target.value)}
            disabled={!!myQuote && !canEdit}
          >
            <option value="">— เลือก —</option>
            {shippingMethods.map((m) => {
              const mid = String(m.shipping_method_id ?? m.id ?? '');
              const label = String(m.method_name ?? m.name ?? mid);
              return (
                <option key={mid} value={mid}>
                  {label}
                </option>
              );
            })}
          </select>
        </label>

        {(!myQuote || canEdit) && (
          <button
            type="button"
            disabled={submitting}
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
    </div>
  );
}
