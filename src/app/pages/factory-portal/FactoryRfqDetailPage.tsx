import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import type { QuotationRow } from '../../types/rfq';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { rfqsApi, quotationsApi, conversationsApi, messagesApi, categoriesApi } from '../../services/api';
import { findOrCreateConversation, openChatSession } from '../../utils/openChatSession';
import { buildSendPayload, chatRoomPath, getCurrentUserId } from '../../utils/chatContract';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useShippingMethods } from '../../hooks/master/useShippingMethods';
import { DeadlineBadge } from '../../components/factory/DeadlineBadge';
import { ShippingMethodLockedField } from '../../components/factory/ShippingMethodLockedField';
import { QuotationCreateForm, type QuotationCreateFormHandle } from '../../components/factory/QuotationCreateForm';
import { summarizeRfqAddress } from '../../utils/rfqAddressSummary';

type QuoteRow = QuotationRow & {
  factoryId?: number | string;
  id?: number | string;
  mold_cost?: number | string;
};

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
  const data = useData();
  const fid = getFactoryEntityId(user);
  const isDesktop = useIsDesktop();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqBody, setRfqBody] = useState<Record<string, unknown>>({});
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [subCategoryName, setSubCategoryName] = useState('');

  const quoteFormRef = useRef<QuotationCreateFormHandle>(null);
  const shippingMethodsQ = useShippingMethods();

  const [cancelBusy, setCancelBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [detail, qList] = await Promise.all([rfqsApi.get(id), rfqsApi.listQuotations(id)]);
      const rfq = (detail.rfq ?? {}) as Record<string, unknown>;
      setRfqTitle(String(rfq.title ?? ''));
      setRfqBody(rfq);
      setQuotes(Array.isArray(qList) ? qList : []);
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

  useEffect(() => {
    const cid = Number(rfqBody.category_id ?? 0);
    const sid = Number(rfqBody.sub_category_id ?? 0);
    if (!Number.isFinite(cid) || cid <= 0 || !Number.isFinite(sid) || sid <= 0) {
      setSubCategoryName('');
      return;
    }
    let mounted = true;
    void categoriesApi.subCategories(cid)
      .then((raw) => {
        if (!mounted) return;
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        const hit = arr.find((r) => Number(r.sub_category_id ?? r.id ?? 0) === sid);
        setSubCategoryName(String(hit?.name ?? '').trim());
      })
      .catch(() => setSubCategoryName(''));
    return () => {
      mounted = false;
    };
  }, [rfqBody.category_id, rfqBody.sub_category_id]);

  const myQuote = fid != null ? quotes.find((q) => quoteFid(q) === fid) : undefined;
  const myStatus = myQuote ? String(myQuote.status ?? 'PD').toUpperCase() : '';
  const canEdit = Boolean(myQuote && myStatus === 'PD');

  const rfqShipId = useMemo(() => {
    const n = Number(rfqBody.shipping_method_id ?? 0);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [rfqBody]);

  const customerShipLabel = useMemo(() => {
    const byName = String(rfqBody.shipping_method_name ?? '').trim();
    if (byName) return byName;
    if (rfqShipId == null) return '';
    const row = shippingMethodsQ.data?.find((m) => m.id === rfqShipId);
    return row?.label ?? '';
  }, [rfqBody, rfqShipId, shippingMethodsQ.data]);

  const deadlineIso = useMemo(() => {
    const raw = String(rfqBody.required_delivery_date ?? '').trim();
    return raw || null;
  }, [rfqBody]);

  const targetDaysCustomer = useMemo(() => {
    const n = Number(
      rfqBody.target_lead_time_days ?? 0,
    );
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [rfqBody]);

  const addressSummary = useMemo(
    () => summarizeRfqAddress(rfqBody),
    [rfqBody],
  );

  const imageUrls = useMemo(() => {
    const urls = Array.isArray(rfqBody.reference_images) ? rfqBody.reference_images : rfqBody.image_urls;
    const out: string[] = [];
    if (Array.isArray(urls)) {
      for (const u of urls) {
        if (typeof u === 'string' && u.trim()) out.push(u.trim());
      }
    }
    return out;
  }, [rfqBody]);

  const budgetPerPiece = useMemo(() => {
    const totalBudget = Number(
      rfqBody.target_unit_price ?? rfqBody.budget_total ?? rfqBody.total_budget ?? 0,
    );
    const qty = Number(rfqBody.quantity ?? 0);
    if (Number.isFinite(totalBudget) && totalBudget > 0 && Number.isFinite(qty) && qty > 0) {
      return totalBudget / qty;
    }
    const legacy = Number(rfqBody.budget_per_piece ?? 0);
    return Number.isFinite(legacy) && legacy > 0 ? legacy : null;
  }, [rfqBody]);

  const quantity = useMemo(() => {
    const n = Number(rfqBody.quantity ?? 0);
    return Number.isFinite(n) ? n : null;
  }, [rfqBody]);

  const revenueApprox = useMemo(() => {
    const totalBudget = Number(
      rfqBody.target_unit_price ?? rfqBody.budget_total ?? rfqBody.total_budget ?? 0,
    );
    if (Number.isFinite(totalBudget) && totalBudget > 0) return totalBudget;
    if (budgetPerPiece == null || quantity == null) return null;
    return budgetPerPiece * quantity;
  }, [rfqBody, budgetPerPiece, quantity]);

  const competitorCount = useMemo(() => {
    if (fid == null) return quotes.length;
    return quotes.filter((q) => quoteFid(q) !== fid).length;
  }, [quotes, fid]);

  const rfqStatus = String(rfqBody.status ?? '').toUpperCase();

  const customerId = useMemo(
    () => Number(rfqBody.customer_id ?? rfqBody.user_id ?? rfqBody.customer_user_id ?? 0),
    [rfqBody],
  );

  const openChatToCustomer = async () => {
    if (fid == null || !Number.isFinite(customerId) || customerId <= 0) {
      setError('ไม่พบรหัสลูกค้าใน RFQ');
      return;
    }
    setChatBusy(true);
    setError('');
    try {
      await openChatSession(navigate, user, {
        customerUserId: customerId,
        factoryEntityId: fid,
        pendingReference: {
          type: 'RQ',
          id: Number(id),
          title: rfqTitle || `RFQ #${id}`,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เปิดแชทไม่สำเร็จ');
    } finally {
      setChatBusy(false);
    }
  };

  const sendQuoteMessageToCustomer = async () => {
    const uid = getCurrentUserId(user);
    if (fid == null || !Number.isFinite(customerId) || customerId <= 0 || uid == null) {
      setError('ไม่พบข้อมูลลูกค้าหรือบัญชี');
      return;
    }
    const vals = quoteFormRef.current?.getValues();
    const p = Number(vals?.price_per_piece ?? '');
    const ld = Number(vals?.lead_time_days ?? '');
    if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(ld) || ld <= 0) {
      setError('กรอกราคาและ lead time ก่อนส่งใบเสนอราคาในแชท');
      return;
    }
    const until = new Date();
    until.setDate(until.getDate() + 30);
    const quoteData = JSON.stringify({
      price: p,
      lead_time: ld,
      valid_until: until.toISOString().slice(0, 10),
    });
    setChatBusy(true);
    setError('');
    try {
      const conv = await findOrCreateConversation(customerId, fid);
      if (!conv) throw new Error('สร้างห้องแชทไม่สำเร็จ');
      await messagesApi.send(
        buildSendPayload({
          conv,
          currentUserId: uid,
          content: 'ใบเสนอราคา',
          messageType: 'QT',
          reference: { type: 'RQ', id: Number(id), title: rfqTitle || `RFQ #${id}` },
          quoteData,
        }),
      );
      navigate(chatRoomPath(conv.conv_id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ส่งใบเสนอราคาในแชทไม่สำเร็จ');
    } finally {
      setChatBusy(false);
    }
  };

  const cancelQuote = async () => {
    if (!myQuote) return;
    const qid = quoteIdOf(myQuote);
    if (!qid) return;
    setCancelBusy(true);
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
      setCancelBusy(false);
    }
  };

  const twoCol = isDesktop ? 'lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start' : '';

  const categoryIdNum = Number(rfqBody.category_id ?? 0);
  const customerCat =
    String(rfqBody.category_name ?? '').trim() ||
    data.categories.find((c) => Number(c.id) === categoryIdNum)?.name ||
    '';
  const customerSub = String(rfqBody.sub_category_name ?? '').trim() || subCategoryName;
  const breadcrumb =
    customerCat && customerSub ? `${customerCat} › ${customerSub}` : customerSub || customerCat || '—';

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
              <p>
                <span className="text-gray-500">วัสดุ/เกรด: </span>
                {String(rfqBody.material_grade ?? '-')}
              </p>
              
              <p>
                <span className="text-gray-500">งบประมาณรวม: </span>
                {rfqBody.target_unit_price != null ? `${Number(rfqBody.target_unit_price).toLocaleString('th-TH')} บาท` : '-'}
              </p>
              <p>
                <span className="text-gray-500">วันที่ต้องการรับสินค้า: </span>
                {deadlineIso ? new Date(deadlineIso).toLocaleDateString('th-TH') : '-'}
              </p>
              <p>
                <span className="text-gray-500">ต้องการตัวอย่าง: </span>
                {Boolean(rfqBody.sample_required) ? `ใช่${rfqBody.sample_qty ? ` (${String(rfqBody.sample_qty)} ชิ้น)` : ''}` : 'ไม่'}
              </p>
              <p>
                <span className="text-gray-500">ประเภทการตรวจสอบ: </span>
                {String(rfqBody.inspection_type ?? '-')}
              </p>
              {Array.isArray(rfqBody.certifications_required) && rfqBody.certifications_required.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-gray-500">ใบรับรองที่ต้องการ:</span>
                  {rfqBody.certifications_required.map((c) => (
                    <span key={String(c)} className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                      {String(c)}
                    </span>
                  ))}
                </div>
              ) : null}
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

            {fid != null && rfqShipId != null ? (
              <QuotationCreateForm
                key={`quote-${id}-${myQuote ? quoteIdOf(myQuote) : 'new'}`}
                ref={quoteFormRef}
                rfqId={id}
                factoryId={fid}
                lockedShippingMethodId={rfqShipId}
                rfqQuantity={quantity}
                patchQuotationId={
                  myQuote && canEdit && quoteIdOf(myQuote) ? quoteIdOf(myQuote) : undefined
                }
                initial={
                  myQuote
                    ? {
                        price_per_piece: String(myQuote.price_per_piece ?? ''),
                        tooling_mold_cost: String(myQuote.tooling_mold_cost ?? myQuote.mold_cost ?? ''),
                        shipping_cost: String(myQuote.shipping_cost ?? ''),
                        packaging_cost: String(myQuote.packaging_cost ?? ''),
                        lead_time_days: String(myQuote.lead_time_days ?? ''),
                        validity_days: String(myQuote.validity_days ?? '14'),
                      }
                    : undefined
                }
                initialImageUrls={
                  myQuote
                    ? (() => {
                        const urls = (myQuote as Record<string, unknown>).image_urls;
                        if (Array.isArray(urls)) return urls.filter((u): u is string => typeof u === 'string');
                        return [];
                      })()
                    : undefined
                }
                submitLabel={myQuote && canEdit ? 'อัปเดตใบเสนอราคา' : 'ส่งใบเสนอราคา'}
                readOnly={Boolean(myQuote && !canEdit)}
                showHeading={false}
                budgetPerPiece={budgetPerPiece}
                targetDaysCustomer={targetDaysCustomer}
                deadlineIso={deadlineIso}
                onSubmitted={async () => {
                  if (customerId > 0 && fid != null) {
                    try {
                      await conversationsApi.create({ customer_id: customerId, factory_id: fid });
                    } catch {
                      /* ห้องสนทนาอาจมีอยู่แล้ว */
                    }
                  }
                  await load();
                }}
              />
            ) : null}

            {canEdit && rfqShipId != null ? (
              <button
                type="button"
                disabled={cancelBusy}
                onClick={() => void cancelQuote()}
                className="w-full py-3 rounded-xl border border-red-200 text-red-600 text-sm font-semibold disabled:opacity-50"
              >
                ถอนใบเสนอราคา
              </button>
            ) : null}
          </section>
        </div>
      ) : null}

      {customerId > 0 && fid != null ? (
        <section className="w-full min-w-0 max-w-lg lg:max-w-5xl mx-auto mt-6 rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-900">ติดต่อลูกค้า</h2>
          <p className="text-xs text-gray-500">
            เปิดห้องแชทกับลูกค้า — ข้อความแรกจากโรงงานจะแนบบริบท RFQ ตามสเปก
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled={chatBusy}
              onClick={() => void openChatToCustomer()}
              className="flex-1 py-3 rounded-xl border border-violet-200 text-violet-800 text-sm font-semibold disabled:opacity-50"
            >
              ส่งข้อความหาลูกค้า
            </button>
            <button
              type="button"
              disabled={chatBusy}
              onClick={() => void sendQuoteMessageToCustomer()}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)' }}
            >
              ส่งใบเสนอราคาในแชท (QT)
            </button>
          </div>
        </section>
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
