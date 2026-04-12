import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, History, Lock } from 'lucide-react';
import { quotationsApi, masterApi } from '../../services/api';

type Row = Record<string, unknown>;

export function FactoryEditQuotationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [quote, setQuote] = useState<Row>({});
  const [history, setHistory] = useState<Row[]>([]);
  const [shippingMethods, setShippingMethods] = useState<Row[]>([]);

  const [price, setPrice] = useState('');
  const [mold, setMold] = useState('');
  const [leadDays, setLeadDays] = useState('');
  const [shipId, setShipId] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const status = String(quote.status ?? 'PD').toUpperCase();
  const isLocked = Boolean(quote.is_locked) || status === 'AC';

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [q, ships] = await Promise.all([
        quotationsApi.get(id),
        masterApi.shippingMethods(),
      ]);
      const body = (q ?? {}) as Row;
      setQuote(body);
      setPrice(String(body.price_per_piece ?? ''));
      setMold(String(body.mold_cost ?? ''));
      setLeadDays(String(body.lead_time_days ?? ''));
      setShipId(String(body.shipping_method_id ?? ''));
      setShippingMethods(Array.isArray(ships) ? (ships as Row[]) : []);

      try {
        const h = await quotationsApi.history(id);
        setHistory(Array.isArray(h) ? (h as Row[]) : []);
      } catch {
        setHistory([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดใบเสนอราคาไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!id) return;
    if (isLocked) {
      setError('ใบเสนอราคานี้ถูกล็อกแล้ว ไม่สามารถแก้ไขได้');
      return;
    }
    if (!price || Number.isNaN(Number(price))) {
      setError('กรุณากรอกราคาต่อชิ้นที่ถูกต้อง');
      return;
    }
    setSaving(true);
    setError('');
    setInfo('');
    try {
      await quotationsApi.patch(id, {
        price_per_piece: Number(price),
        mold_cost: Number(mold) || 0,
        lead_time_days: Number(leadDays) || 0,
        shipping_method_id: Number(shipId) || 1,
        reason: reason || undefined,
      });
      setInfo('บันทึกการแก้ไขเรียบร้อย');
      setReason('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (!id) return null;

  return (
    <div className="w-full min-w-0 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center bg-white"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400">QUOTATION</p>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
            แก้ไขใบเสนอราคา #{id}
          </h1>
        </div>
        {isLocked && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">
            <Lock size={12} /> ถูกล็อก
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
          )}
          {info && (
            <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 mb-4">
              {info}
            </p>
          )}

          <section className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 mb-4">
            <div className="text-xs text-gray-500">
              สถานะ: <strong className="text-gray-900">{status}</strong>
              {' · '}เวอร์ชัน: <strong>{String(quote.version ?? 1)}</strong>
            </div>

            <label className="block">
              <span className="text-xs text-gray-500">ราคาต่อชิ้น</span>
              <input
                type="number"
                step="0.01"
                disabled={isLocked}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">ค่าแม่พิมพ์</span>
              <input
                type="number"
                disabled={isLocked}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
                value={mold}
                onChange={(e) => setMold(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Lead time (วัน)</span>
              <input
                type="number"
                disabled={isLocked}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
                value={leadDays}
                onChange={(e) => setLeadDays(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">วิธีจัดส่ง</span>
              <select
                disabled={isLocked}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
                value={shipId}
                onChange={(e) => setShipId(e.target.value)}
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
            <label className="block">
              <span className="text-xs text-gray-500">เหตุผลที่แก้ไข (จะบันทึกลง audit log)</span>
              <textarea
                disabled={isLocked}
                rows={2}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="เช่น ปรับลดราคาตามเจรจาลูกค้า"
              />
            </label>

            <button
              type="button"
              onClick={save}
              disabled={isLocked || saving}
              className="w-full rounded-xl bg-[#A238FF] text-white py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
              <History size={16} /> ประวัติการแก้ไข
            </h2>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">ยังไม่มีประวัติการแก้ไข</p>
            ) : (
              <ol className="space-y-2 text-xs">
                {history.map((h, i) => (
                  <li
                    key={String(h.history_id ?? i)}
                    className="border-l-2 border-purple-200 pl-3 py-1"
                  >
                    <div className="text-gray-900 font-medium">
                      v{String(h.version ?? '?')} · {String(h.change_type ?? '')}
                    </div>
                    <div className="text-gray-500">
                      {String(h.created_at ?? '')} โดย user #{String(h.changed_by ?? '')}
                    </div>
                    {h.reason ? (
                      <div className="text-gray-600 mt-0.5">เหตุผล: {String(h.reason)}</div>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
