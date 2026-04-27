import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
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
  image_urls?: unknown;
};

function quoteFid(q: QuoteRow): number | null {
  const n = Number(q.factory_id ?? q.factoryId);
  return Number.isFinite(n) ? n : null;
}

function quoteIdOf(q: QuoteRow): string {
  return String(q.quote_id ?? q.id ?? '');
}

function rfqStatusLabel(status: string): string {
  const s = status.toUpperCase();
  if (s === 'OP' || s === 'OPEN') return 'เปิดรับใบเสนอราคา';
  if (s === 'CL' || s === 'CLOSED') return 'ปิดแล้ว';
  if (s === 'CN' || s === 'CANCELLED') return 'ยกเลิก';
  if (s === 'CP' || s === 'COMPLETED') return 'เสร็จสิ้น';
  if (s === 'PD' || s === 'PENDING') return 'รออนุมัติ';
  return status || '—';
}

export function FactoryRfqDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
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
  const backPath = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from;
    if (typeof from === 'string' && from.startsWith('/factory/rfqs')) return from;
    return '/factory/rfqs';
  }, [location.state]);

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
    <div style={{ backgroundColor: '#F8F6FA' }} className="min-h-screen pb-24">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 h-14 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="flex items-center gap-1 text-sm font-medium"
          style={{ color: '#4338CA' }}
        >
          <ChevronLeft size={18} /> กลับ
        </button>
        <span className="flex-1 text-center text-sm font-bold" style={{ color: '#2E2252' }}>
          รายละเอียด RFQ
        </span>
        <span className="text-xs font-medium text-gray-400">#{id}</span>
      </div>

      <div className="w-full max-w-lg lg:max-w-5xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div
              className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#4F46E5', borderTopColor: 'transparent' }}
            />
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
        ) : null}

        {!loading ? (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {rfqStatusLabel(rfqStatus)}
                </span>
                <div className="flex items-center gap-2">
                  {deadlineIso ? <DeadlineBadge deadlineIso={deadlineIso} /> : null}
                  <span className="text-xs text-slate-400">#{id}</span>
                </div>
              </div>
              <h2 className="text-base font-bold mb-3 text-slate-900">{rfqTitle || '—'}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {budgetPerPiece != null ? (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">งบ/ชิ้น</p>
                    <p className="font-semibold text-slate-900">฿{budgetPerPiece.toLocaleString('th-TH')}</p>
                  </div>
                ) : null}
                {quantity != null ? (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">จำนวน</p>
                    <p className="font-semibold text-slate-900">{quantity.toLocaleString('th-TH')} ชิ้น</p>
                  </div>
                ) : null}
                {revenueApprox != null ? (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">รวมประเมิน</p>
                    <p className="font-semibold text-slate-900">≈ ฿{Math.round(revenueApprox).toLocaleString('th-TH')}</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* My quote status banner */}
            {myQuote ? (
              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">สถานะใบเสนอราคาของคุณ</p>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        myStatus === 'AC' ? '#D1FAE5' :
                        myStatus === 'PD' ? '#EDE9FE' :
                        '#F3F4F6',
                      color:
                        myStatus === 'AC' ? '#065F46' :
                        myStatus === 'PD' ? '#5B21B6' :
                        '#374151',
                    }}
                  >
                    {myStatus === 'PD'
                      ? 'รอลูกค้าตัดสินใจ'
                      : myStatus === 'AC'
                        ? 'ลูกค้ารับแล้ว'
                        : myStatus === 'RJ'
                          ? 'ปิด / ถูกปฏิเสธ'
                          : myStatus}
                  </span>
                </div>
              </section>
            ) : (
              <section className="rounded-2xl bg-white border border-amber-100 shadow-sm p-4">
                <p className="text-sm text-amber-800">คุณยังไม่ได้ส่งใบเสนอราคาสำหรับ RFQ นี้</p>
              </section>
            )}

            <div className={twoCol}>
              <div className="space-y-4 mb-4 lg:mb-0 min-w-0">
                {/* Reference images */}
                {imageUrls.length > 0 ? (
                  <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">รูปอ้างอิง</p>
                    <div className="flex flex-wrap gap-2">
                      {imageUrls.slice(0, 5).map((url, i) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => setLightbox(i)}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-gray-200 focus:outline-none"
                          style={{ outlineColor: '#4F46E5' }}
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

                {/* Product / requirements info */}
                <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">รายละเอียดสินค้า</p>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-gray-500">หมวดหมู่</span>
                    <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>{breadcrumb}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-gray-500">จำนวน</span>
                    <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>
                      {quantity != null ? `${quantity.toLocaleString('th-TH')} ชิ้น` : '—'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-gray-500">วัสดุ/เกรด</span>
                    <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>
                      {String(rfqBody.material_grade ?? '-')}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-gray-500">ต้องการตัวอย่าง</span>
                    <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>
                      {Boolean(rfqBody.sample_required) ? `ใช่${rfqBody.sample_qty ? ` (${String(rfqBody.sample_qty)} ชิ้น)` : ''}` : 'ไม่'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-gray-500">ประเภทการตรวจสอบ</span>
                    <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>
                      {String(rfqBody.inspection_type ?? '-')}
                    </span>
                  </div>
                  {Array.isArray(rfqBody.certifications_required) && rfqBody.certifications_required.length > 0 ? (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-gray-500">ใบรับรองที่ต้องการ</span>
                      <div className="flex flex-wrap justify-end gap-1">
                        {rfqBody.certifications_required.map((c) => (
                          <span
                            key={String(c)}
                            className="text-[11px] px-2 py-0.5 rounded-full border"
                            style={{ backgroundColor: '#F3E8FF', color: '#6B21A8', borderColor: '#E9D5FF' }}
                          >
                            {String(c)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {rfqBody.details ?? rfqBody.description ? (
                    <div className="pt-1 border-t border-gray-50">
                      <p className="text-xs text-gray-500 mb-1">รายละเอียดเพิ่มเติม</p>
                      <p className="text-sm break-words" style={{ color: '#2E2252' }}>
                        {String(rfqBody.details ?? rfqBody.description ?? '—')}
                      </p>
                    </div>
                  ) : null}
                </section>

                {/* Buyer requirements */}
                <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">เงื่อนไขลูกค้า</p>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-gray-500">งบประมาณรวม</span>
                    <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>
                      {rfqBody.target_unit_price != null ? `${Number(rfqBody.target_unit_price).toLocaleString('th-TH')} บาท` : '-'}
                    </span>
                  </div>
                  {targetDaysCustomer != null ? (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-gray-500">Lead time ที่ต้องการ</span>
                      <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>
                        {targetDaysCustomer} วัน
                      </span>
                    </div>
                  ) : null}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-gray-500">วันที่ต้องการรับสินค้า</span>
                    <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>
                      {deadlineIso ? new Date(deadlineIso).toLocaleDateString('th-TH') : '-'}
                    </span>
                  </div>
                  <div className="pt-1">
                    <ShippingMethodLockedField
                      label="วิธีจัดส่ง (ลูกค้าเลือก)"
                      methodName={customerShipLabel || '—'}
                      hint="ล็อกตาม RFQ — โรงงานเปลี่ยนไม่ได้"
                      emptyFallback="—"
                    />
                  </div>
                  {addressSummary ? (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-gray-500">ที่อยู่ปลายทาง</span>
                      <span className="text-sm font-medium text-right break-words" style={{ color: '#2E2252' }}>
                        {addressSummary}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-gray-500">ที่อยู่ปลายทาง</span>
                      <span className="text-sm font-medium text-right" style={{ color: '#2E2252' }}>—</span>
                    </div>
                  )}
                </section>

                {/* Competitor count */}
                <div
                  className="rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-xs text-gray-500">คู่แข่งที่เสนอราคา</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold" style={{ color: '#2E2252' }}>{competitorCount} ราย</span>
                    <span className="text-[11px] text-gray-400">(ซ่อนราคา)</span>
                  </div>
                </div>
              </div>

              {/* Quote form section */}
              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3 min-w-0 lg:sticky lg:top-20">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {myQuote && canEdit ? 'แก้ไขใบเสนอราคา' : myQuote ? 'ดูใบเสนอราคา' : 'ส่งใบเสนอราคา'}
                </p>
                <h2 className="font-bold" style={{ color: '#2E2252' }}>
                  {myQuote && canEdit ? 'แก้ไขใบเสนอราคา' : myQuote ? 'ใบเสนอราคาของคุณ' : 'กรอกใบเสนอราคา'}
                </h2>

                {fid != null ? (
                  <QuotationCreateForm
                    key={`quote-${id}-${myQuote ? quoteIdOf(myQuote) : 'new'}`}
                    ref={quoteFormRef}
                    rfqId={id}
                    factoryId={fid}
                    lockedShippingMethodId={rfqShipId ?? 0}
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
                            const urls = myQuote.image_urls;
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

                {canEdit ? (
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

            {/* Contact customer */}
            {customerId > 0 && fid != null ? (
              <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">ติดต่อลูกค้า</p>
                <h2 className="text-sm font-bold" style={{ color: '#2E2252' }}>ส่งข้อความ</h2>
                <p className="text-xs text-gray-500">
                  เปิดห้องแชทกับลูกค้า — ข้อความแรกจากโรงงานจะแนบบริบท RFQ ตามสเปก
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={chatBusy}
                    onClick={() => void openChatToCustomer()}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm disabled:opacity-50"
                  >
                    ส่งข้อความหาลูกค้า
                  </button>
                  <button
                    type="button"
                    disabled={chatBusy}
                    onClick={() => void sendQuoteMessageToCustomer()}
                    className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' }}
                  >
                    ส่งใบเสนอราคาในแชท (QT)
                  </button>
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">ประวัติการเสนอราคา</p>
              {quotes.length === 0 ? (
                <p className="text-sm text-gray-500">ยังไม่มีใบเสนอราคา</p>
              ) : (
                <ul className="space-y-2">
                  {quotes
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(String(b.create_time ?? '')).getTime() -
                        new Date(String(a.create_time ?? '')).getTime(),
                    )
                    .slice(0, 5)
                    .map((q) => {
                      const grandTotal = Number(q.grand_total ?? 0);
                      const vatAmt = Number(q.vat_amount ?? 0);
                      const netAmt = Number(q.factory_net_receivable ?? 0);
                      const hasBreakdown = grandTotal > 0;
                      return (
                        <li key={quoteIdOf(q)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-1.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800">
                                ฿{Number(q.price_per_piece ?? 0).toLocaleString('th-TH')} / ชิ้น
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {String(q.status ?? 'PD')} · Lead {String(q.lead_time_days ?? '-')} วัน
                              </p>
                            </div>
                            <p className="text-[11px] text-slate-500 shrink-0">
                              {q.create_time ? new Date(String(q.create_time)).toLocaleDateString('th-TH') : '-'}
                            </p>
                          </div>
                          {hasBreakdown ? (
                            <div className="rounded-lg bg-violet-50 border border-violet-100 px-2.5 py-2 space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">รวม VAT {Number(q.vat_rate ?? 7).toFixed(0)}%</span>
                                <span className="font-semibold text-slate-700">฿{grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                              </div>
                              {vatAmt > 0 ? (
                                <div className="flex justify-between text-[11px] text-slate-400">
                                  <span>VAT</span>
                                  <span>฿{vatAmt.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                                </div>
                              ) : null}
                              {netAmt > 0 ? (
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-violet-700">โรงงานได้รับ (หลังค่าบริการ)</span>
                                  <span className="font-semibold text-violet-700">฿{netAmt.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                                </div>
                              ) : null}
                              {q.payment_terms ? (
                                <div className="flex justify-between text-[11px] text-slate-400">
                                  <span>การชำระเงิน</span>
                                  <span>{q.payment_terms}</span>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </div>

      {/* Lightbox */}
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
