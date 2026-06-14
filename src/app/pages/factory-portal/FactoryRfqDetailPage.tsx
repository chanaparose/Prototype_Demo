import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ChevronLeft, ClipboardList, MessageCircle, X } from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import { useData } from '@/stores/useDataStore';
import type { IConversationResponse } from '@/services/api/types/chat.types';
import type { IQuotationResponse } from '@/services/api/types/rfq.types';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { factoryRfqsApi, quotationsApi } from '@/services/api/rfqApi';
import { conversationsApi, messagesApi } from '@/services/api/chatApi';
import { buildSendPayload, chatRoomPath, getCurrentUserId } from '@/utils/chatContract';
import type { ApiConversation } from '@/utils/chatContract';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FactoryNoteInline } from '@/components/factory/FactoryNoteInline';
import { DeadlineBadge } from '@/components/factory/DeadlineBadge';
import { ShippingMethodLockedField } from '@/components/factory/ShippingMethodLockedField';
import {
  QuotationCreateForm,
  type QuotationCreateFormHandle,
} from '@/components/factory/QuotationCreateForm';
import { QuotationHistoryPanel } from '@/components/features/rfq-detail/QuotationHistoryPanel';
import { summarizeRfqAddress } from '@/utils/rfqAddressSummary';
import { DismissRfqButton } from '@/components/features/factory-rfq/DismissRfqButton';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import {
  FactoryStatusBadge,
  type FactoryStatusTone,
} from '@/pages/factory-portal/components/FactoryStatusBadge';
import {
  factoryBadgeClass,
  factoryBoxClass,
  factoryButtonClass,
  factoryCardClass,
} from '@/pages/factory-portal/factoryUi';
import {
  formatCompactNumber,
  formatCurrency,
  formatCurrencyNoDecimals,
} from '@/utils/formatting/formatCurrency';

type QuoteRow = IQuotationResponse & {
  factoryId?: number | string;
  id?: number | string;
  mold_cost?: number | string;
  image_urls?: unknown;
};

function quoteFid(q: QuoteRow): number | null {
  const qRecord = q as unknown as Record<string, unknown>;
  const factoryRaw = qRecord.factory;
  const factoryObj =
    factoryRaw && typeof factoryRaw === 'object' ? (factoryRaw as Record<string, unknown>) : null;
  const n = Number(
    q.factory_id ??
      q.factoryId ??
      qRecord.user_id ??
      qRecord.factory_user_id ??
      factoryObj?.user_id ??
      factoryObj?.id,
  );
  return Number.isFinite(n) ? n : null;
}

function normalizeConversationList(raw: unknown): IConversationResponse[] {
  if (Array.isArray(raw)) return raw as IConversationResponse[];
  if (raw && typeof raw === 'object') {
    const root = raw as Record<string, unknown>;
    for (const key of ['conversations', 'data', 'items', 'results'] as const) {
      const nested = root[key];
      if (Array.isArray(nested)) return nested as unknown as IConversationResponse[];
    }
  }
  return [];
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

function quoteStatusLabel(status: string): string {
  if (status === 'PD') return 'รอลูกค้าตัดสินใจ';
  if (status === 'AC') return 'ลูกค้ารับแล้ว';
  if (status === 'RJ') return 'ปิด / ถูกปฏิเสธ';
  return status;
}

function quoteStatusVariant(status: string): React.ComponentProps<typeof StatusBadge>['variant'] {
  if (status === 'AC') return 'success';
  if (status === 'PD') return 'active';
  if (status === 'RJ') return 'inactive';
  return 'default';
}

function rfqStatusTone(status: string): FactoryStatusTone {
  const s = status.toUpperCase();
  if (s === 'OP' || s === 'OPEN') return 'success';
  if (s === 'PD' || s === 'PENDING') return 'warning';
  if (s === 'CN' || s === 'CANCELLED') return 'danger';
  if (s === 'CP' || s === 'COMPLETED') return 'brand';
  return 'neutral';
}

export function FactoryRfqDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const data = useData();
  const fid = getFactoryEntityId(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqBody, setRfqBody] = useState<Record<string, unknown>>({});
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [subCategoryName, setSubCategoryName] = useState('');
  const [commissionConfig, setCommissionConfig] = useState<{
    vat_rate: number;
    commission_rate: number;
  } | null>(null);

  const quoteFormRef = useRef<QuotationCreateFormHandle>(null);

  const [cancelBusy, setCancelBusy] = useState(false);
  const [dismissBusy, setDismissBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const detail = await factoryRfqsApi.getRFQDetail(id);
      const rfq = (detail.rfq ?? {}) as Record<string, unknown>;
      setRfqTitle(String(rfq.title ?? ''));
      setRfqBody(rfq);
      setQuotes(
        Array.isArray(detail.quotations) ? (detail.quotations as unknown as QuoteRow[]) : [],
      );
      setSubCategoryName(String(rfq.sub_category_name ?? '').trim());
      if (detail.commission_config) setCommissionConfig(detail.commission_config);
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
  const canDismiss = useMemo(() => {
    if (!myQuote) return true;
    if (myStatus === 'AC') return false;
    if (myStatus === 'PD') return false;
    return true;
  }, [myQuote, myStatus]);
  const dismissDisabledReason =
    myStatus === 'PD'
      ? 'มีใบเสนอราคาที่รอการตอบรับ — ถอนใบเสนอก่อน'
      : myStatus === 'AC'
        ? 'ลูกค้ายืนยันข้อเสนอแล้ว ไม่สามารถข้าม RFQ ได้'
        : undefined;

  const rfqShipId = useMemo(() => {
    const n = Number(rfqBody.shipping_method_id ?? 0);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [rfqBody]);

  const customerShipLabel = useMemo(
    () => String(rfqBody.shipping_method_name ?? '').trim(),
    [rfqBody],
  );

  const deadlineIso = useMemo(() => {
    const raw = String(rfqBody.required_delivery_date ?? '').trim();
    return raw || null;
  }, [rfqBody]);

  const targetDaysCustomer = useMemo(() => {
    const n = Number(rfqBody.target_lead_time_days ?? 0);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [rfqBody]);

  const addressSummary = useMemo(() => summarizeRfqAddress(rfqBody), [rfqBody]);

  const imageUrls = useMemo(() => {
    const urls = Array.isArray(rfqBody.reference_images)
      ? rfqBody.reference_images
      : rfqBody.image_urls;
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
      rfqBody.target_price ?? rfqBody.budget_total ?? rfqBody.total_budget ?? 0,
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

  const unitName = useMemo(() => {
    const name = String(rfqBody.unit_name ?? '').trim();
    return name || 'ชิ้น';
  }, [rfqBody]);

  const revenueApprox = useMemo(() => {
    const totalBudget = Number(
      rfqBody.target_price ?? rfqBody.budget_total ?? rfqBody.total_budget ?? 0,
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

  const findExistingConvId = async (): Promise<number | null> => {
    const convs = normalizeConversationList(await conversationsApi.list());

    let hit = convs.find((c) => c.customer_id === customerId && c.factory_id === fid);

    if (!hit && customerId > 0) {
      hit = convs.find((c) => c.customer_id === customerId);
    }

    const convId = hit?.conv_id ?? 0;

    return Number.isFinite(convId) && convId > 0 ? convId : null;
  };

  const ensureConversationId = async (): Promise<number> => {
    const existing = await findExistingConvId();
    if (existing) return existing;

    const created = await conversationsApi.create({
      customer_id: customerId,
      factory_id: fid as number,
    });

    const root = (created && typeof created === 'object' ? created : {}) as Record<string, unknown>;
    const row = (root.data && typeof root.data === 'object' ? root.data : null) as Record<
      string,
      unknown
    > | null;
    const convId = Number(
      root.conv_id ??
        root.conversation_id ??
        root.id ??
        row?.conv_id ??
        row?.conversation_id ??
        row?.id ??
        0,
    );
    if (!Number.isFinite(convId) || convId <= 0) {
      throw new Error('สร้างห้องแชทไม่สำเร็จ (ไม่พบ conv_id)');
    }

    return convId;
  };

  const openChatToCustomer = async () => {
    if (fid == null || !Number.isFinite(customerId) || customerId <= 0) {
      setError('ไม่พบรหัสลูกค้าใน RFQ');
      return;
    }
    setChatBusy(true);
    setError('');
    try {
      const convId = await ensureConversationId();
      navigate(chatRoomPath(convId), {
        state: {
          reference: { type: 'RQ', id: Number(id), title: rfqTitle || `RFQ #${id}` },
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
      const convId = await ensureConversationId();
      const apiConv: ApiConversation = {
        conv_id: convId,
        customer_id: customerId,
        factory_id: fid,
        unread_customer: 0,
        unread_factory: 0,
        has_quote: false,
        updated_at: new Date().toISOString(),
      };
      await messagesApi.send(
        convId,
        buildSendPayload({
          conv: apiConv,
          currentUserId: uid,
          content: 'ใบเสนอราคา',
          messageType: 'QT',
          reference: { type: 'RQ', id: Number(id), title: rfqTitle || `RFQ #${id}` },
          quoteData,
        }),
      );
      navigate(chatRoomPath(convId));
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
      await quotationsApi.delete(qid);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ยกเลิกใบเสนอราคาไม่สำเร็จ');
    } finally {
      setCancelBusy(false);
    }
  };

  const dismissRfq = async () => {
    if (!id) return;
    setDismissBusy(true);
    setError('');
    try {
      await factoryRfqsApi.dismiss(id);
      navigate(backPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ซ่อน RFQ ไม่สำเร็จ');
      throw e;
    } finally {
      setDismissBusy(false);
    }
  };

  const undismissRfq = async () => {
    if (!id) return;
    setDismissBusy(true);
    setError('');
    try {
      await factoryRfqsApi.undismiss(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'คืน RFQ ไม่สำเร็จ');
      throw e;
    } finally {
      setDismissBusy(false);
    }
  };

  const categoryIdNum = Number(rfqBody.category_id ?? 0);
  const customerCat =
    String(rfqBody.category_name ?? '').trim() ||
    data.categories.find((c) => Number(c.id) === categoryIdNum)?.name ||
    '';
  const customerSub = String(rfqBody.sub_category_name ?? '').trim() || subCategoryName;
  const breadcrumb =
    customerCat && customerSub
      ? `${customerCat} › ${customerSub}`
      : customerSub || customerCat || '—';
  const myQuoteBannerVariant =
    myStatus === 'AC' ? 'emerald' : myStatus === 'RJ' ? 'neutral' : 'amber';

  if (!id) {
    return null;
  }

  return (
    <div className='min-h-screen pb-24'>
      <header className='sticky top-0 z-40 -mx-3 -mt-4 border-b border-slate-200 bg-white sm:-mx-4 sm:-mt-5 md:-mx-6 lg:-mx-8 lg:-mt-6 2xl:-mx-10'>
        <div className='flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 2xl:px-10'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate(backPath)}
            className={factoryButtonClass({ variant: 'toolbar', size: 'sm' })}
          >
            <ChevronLeft size={18} />
            กลับ
          </Button>
        </div>
      </header>

      <div className='w-full max-w-[1500px] mx-auto px-0 py-5'>
        {loading ? (
          <div className='flex justify-center py-16'>
            <div className='w-10 h-10 border-[3px] border-brand-purple border-t-transparent rounded-full animate-spin' />
          </div>
        ) : null}

        {!loading ? (
          <div className='flex flex-col gap-5'>
            {/* My-quote status banner */}
            {myQuote ? (
              <div
                className={factoryBoxClass({
                  variant: myQuoteBannerVariant,
                  className: 'flex items-center gap-3 px-4 py-3',
                })}
              >
                <StatusBadge variant={quoteStatusVariant(myStatus)} size='md'>
                  {quoteStatusLabel(myStatus)}
                </StatusBadge>
                <p className='text-xs text-gray-600'>สถานะใบเสนอราคาของคุณ</p>
              </div>
            ) : (
              <div
                className={factoryBoxClass({
                  variant: 'amber',
                  className: 'flex items-center gap-3 px-4 py-3',
                })}
              >
                <ClipboardList size={18} className='shrink-0 text-amber-700' />
                <p className='text-sm font-medium text-amber-800'>
                  คุณยังไม่ได้ส่งใบเสนอราคาสำหรับ RFQ นี้
                </p>
              </div>
            )}

            {/* RFQ card + quote form — equal height on lg */}
            <div className='grid min-w-0 gap-5 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] lg:items-stretch [&>*]:min-h-0'>
              {/* ── Main RFQ card (merged: overview + detail + conditions) ── */}
              <section
                className={factoryCardClass({
                  variant: 'shell',
                  className: 'flex min-h-0 flex-col',
                })}
              >
                {/* Card header */}
                <div className='flex items-center justify-between border-b border-slate-100 px-5 py-4'>
                  <div className='flex items-center gap-2'>
                    <FactoryStatusBadge tone={rfqStatusTone(rfqStatus)}>
                      {rfqStatusLabel(rfqStatus)}
                    </FactoryStatusBadge>
                    {rfqBody.isTargeted || rfqBody.is_targeted ? (
                      <span className={factoryBadgeClass({ variant: 'warning' })}>
                        ส่งตรงถึงคุณ
                      </span>
                    ) : null}
                  </div>
                  {customerId > 0 && fid != null ? (
                    <Button
                      variant='unstyled'
                      type='button'
                      disabled={chatBusy}
                      onClick={() => void openChatToCustomer()}
                      className={factoryButtonClass({ variant: 'toolbar', size: 'sm' })}
                    >
                      <MessageCircle size={15} />
                      แชทลูกค้า
                    </Button>
                  ) : null}
                </div>

                <div className='flex flex-1 flex-col px-5 pt-4 pb-5 space-y-5'>
                  {/* Title */}
                  <h1 className='text-lg font-bold text-slate-900 leading-snug'>
                    {rfqTitle || '—'}
                  </h1>
                  <div className='flex flex-wrap items-center gap-3'>
                    {deadlineIso ? <DeadlineBadge deadlineIso={deadlineIso} /> : null}
                    <span className='text-xs text-slate-400'>#{id}</span>
                  </div>

                  {/* Highlight metric boxes */}
                  <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                    {budgetPerPiece != null ? (
                      <div
                        className={factoryBoxClass({ variant: 'violet', className: 'px-4 py-3' })}
                      >
                        <p className='mb-1 text-[10px] font-semibold uppercase tracking-wide text-brand-purple'>
                          งบ / {unitName}
                        </p>
                        <p className='text-base font-bold text-brand-violet-ink'>
                          {formatCurrency(budgetPerPiece)}
                        </p>
                      </div>
                    ) : null}
                    {quantity != null ? (
                      <div
                        className={factoryBoxClass({ variant: 'emerald', className: 'px-4 py-3' })}
                      >
                        <p className='mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600'>
                          จำนวน
                        </p>
                        <p className='text-base font-bold text-emerald-800'>
                          {formatCompactNumber(quantity)} {unitName}
                        </p>
                      </div>
                    ) : null}
                    {revenueApprox != null ? (
                      <div
                        className={factoryBoxClass({ variant: 'amber', className: 'px-4 py-3' })}
                      >
                        <p className='mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600'>
                          รวมประเมิน
                        </p>
                        <p className='text-base font-bold text-amber-800'>
                          ≈ {formatCurrencyNoDecimals(Math.round(revenueApprox))}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* Product + Customer detail rows */}
                  <div
                    className={factoryBoxClass({
                      variant: 'neutral',
                      className: 'divide-y divide-slate-100',
                    })}
                  >
                    <div className='flex items-center justify-between gap-4 px-4 py-2.5'>
                      <span className='text-xs text-slate-500 shrink-0'>หมวดหมู่</span>
                      <span className='text-xs font-medium text-right text-slate-900'>
                        {breadcrumb}
                      </span>
                    </div>
                    <div className='flex items-center justify-between gap-4 px-4 py-2.5'>
                      <span className='text-xs text-slate-500 shrink-0'>วัสดุ / เกรด</span>
                      <span className='text-xs font-medium text-right text-slate-900'>
                        {String(rfqBody.material_grade ?? '—')}
                      </span>
                    </div>
                    {rfqBody.target_price != null ? (
                      <div className='flex items-center justify-between gap-4 px-4 py-2.5'>
                        <span className='text-xs text-slate-500 shrink-0'>งบประมาณรวม</span>
                        <span className='text-xs font-medium text-right text-slate-900'>
                          {formatCompactNumber(Number(rfqBody.target_price))} บาท
                        </span>
                      </div>
                    ) : null}
                    {targetDaysCustomer != null ? (
                      <div className='flex items-center justify-between gap-4 px-4 py-2.5'>
                        <span className='text-xs text-slate-500 shrink-0'>
                          Lead time ที่ต้องการ
                        </span>
                        <span className='text-xs font-medium text-right text-slate-900'>
                          {targetDaysCustomer} วัน
                        </span>
                      </div>
                    ) : null}
                    <div className='flex items-center justify-between gap-4 px-4 py-2.5'>
                      <span className='text-xs text-slate-500 shrink-0'>วิธีจัดส่ง</span>
                      <span className='text-xs font-medium text-right text-slate-900'>
                        {customerShipLabel || '—'}
                      </span>
                    </div>
                    {addressSummary || true ? (
                      <div className='flex items-center justify-between gap-4 px-4 py-2.5'>
                        <span className='text-xs text-slate-500 shrink-0'>ที่อยู่ปลายทาง</span>
                        <span className='text-xs font-medium text-right break-words text-slate-900'>
                          {addressSummary || '—'}
                        </span>
                      </div>
                    ) : null}
                    <div className='flex items-center justify-between gap-4 px-4 py-2.5'>
                      <span className='text-xs text-slate-500 shrink-0'>คู่แข่งที่เสนอราคา</span>
                      <div className='flex items-center gap-1.5'>
                        <span className='text-sm font-bold text-brand-purple'>
                          {competitorCount} ราย
                        </span>
                        <span className='text-[11px] text-slate-400'>(ซ่อนราคา)</span>
                      </div>
                    </div>
                  </div>

                  {/* Certifications */}
                  {Array.isArray(rfqBody.certifications_required) &&
                  rfqBody.certifications_required.length > 0 ? (
                    <div className='flex items-start gap-3'>
                      <span className='text-xs text-slate-500 shrink-0 mt-0.5'>
                        ใบรับรองที่ต้องการ
                      </span>
                      <div className='flex flex-wrap gap-1.5'>
                        {rfqBody.certifications_required.map((c) => (
                          <span key={String(c)} className={factoryBadgeClass({ variant: 'meta' })}>
                            {String(c)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Description */}
                  {(rfqBody.details ?? rfqBody.description) ? (
                    <div>
                      <p className='text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2'>
                        รายละเอียดเพิ่มเติม
                      </p>
                      <div
                        className={factoryBoxClass({ variant: 'violet', className: 'px-4 py-3' })}
                      >
                        <p className='text-sm leading-relaxed text-slate-800 break-words'>
                          {String(rfqBody.details ?? rfqBody.description ?? '—')}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Reference images */}
                  {imageUrls.length > 0 ? (
                    <div>
                      <p className='text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2'>
                        รูปอ้างอิง
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {imageUrls.slice(0, 5).map((url, i) => (
                          <Button
                            key={url}
                            variant='unstyled'
                            type='button'
                            onClick={() => setLightbox(i)}
                            className='h-16 w-16 overflow-hidden rounded-lg border border-slate-200 shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple sm:h-20 sm:w-20'
                          >
                            <Image src={url} alt='' className='w-full h-full object-cover' />
                          </Button>
                        ))}
                        {imageUrls.length > 5 ? (
                          <div className='flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 sm:h-20 sm:w-20'>
                            +{imageUrls.length - 5}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              {/* Quote form card */}
              <section
                className={factoryCardClass({
                  variant: 'section',
                  className: 'flex min-h-0 flex-col space-y-3',
                })}
              >
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-gray-400'>
                    {myQuote && canEdit
                      ? 'แก้ไขใบเสนอราคา'
                      : myQuote
                        ? 'ดูใบเสนอราคา'
                        : 'ส่งใบเสนอราคา'}
                  </p>
                  <div className='w-full max-w-[6rem] shrink-0 sm:max-w-[8rem]'>
                    {!dismissBusy ? (
                      <DismissRfqButton
                        rfqId={Number(id)}
                        rfqCode={`#${id}`}
                        canDismiss={canDismiss}
                        disabledReason={dismissDisabledReason}
                        onDismiss={dismissRfq}
                        onUndismiss={undismissRfq}
                      />
                    ) : null}
                  </div>
                </div>
                <h2 className='font-bold text-brand-navy text-sm'>
                  {myQuote && canEdit
                    ? 'แก้ไขใบเสนอราคา'
                    : myQuote
                      ? 'ใบเสนอราคาของคุณ'
                      : 'กรอกใบเสนอราคา'}
                </h2>

                <div className='flex min-h-0 flex-1 flex-col gap-3'>
                  {error && fid == null ? <ErrorAlert size='sm'>{error}</ErrorAlert> : null}
                  {fid != null ? (
                    <QuotationCreateForm
                      key={`quote-${id}-${myQuote ? quoteIdOf(myQuote) : 'new'}`}
                      ref={quoteFormRef}
                      rfqId={id}
                      factoryId={fid}
                      lockedShippingMethodId={rfqShipId ?? 0}
                      lockedShippingMethodName={customerShipLabel || undefined}
                      rfqQuantity={quantity}
                      rfqUnitName={unitName}
                      patchQuotationId={
                        myQuote && canEdit && quoteIdOf(myQuote) ? quoteIdOf(myQuote) : undefined
                      }
                      initial={
                        myQuote
                          ? {
                              price_per_piece: String(myQuote.price_per_piece ?? ''),
                              tooling_mold_cost: String(
                                myQuote.tooling_mold_cost ?? myQuote.mold_cost ?? '',
                              ),
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
                              if (Array.isArray(urls))
                                return urls.filter((u): u is string => typeof u === 'string');
                              return [];
                            })()
                          : undefined
                      }
                      initialFactoryHighlight={
                        myQuote
                          ? String(
                              (myQuote as unknown as Record<string, unknown>).factory_highlight ??
                                (myQuote as unknown as Record<string, unknown>).highlight ??
                                '',
                            )
                          : ''
                      }
                      submitLabel={myQuote && canEdit ? 'อัปเดตใบเสนอราคา' : 'ส่งใบเสนอราคา'}
                      pageError={error || undefined}
                      readOnly={Boolean(myQuote && !canEdit)}
                      showHeading={false}
                      budgetPerPiece={budgetPerPiece}
                      targetDaysCustomer={targetDaysCustomer}
                      deadlineIso={deadlineIso}
                      commissionConfig={commissionConfig}
                      onSubmitted={async () => {
                        await load();
                      }}
                    />
                  ) : null}

                  {canEdit ? (
                    <Button
                      variant='unstyled'
                      type='button'
                      disabled={cancelBusy}
                      onClick={() => void cancelQuote()}
                      className={factoryButtonClass({
                        variant: 'dangerOutline',
                        size: 'md',
                        className: 'w-full',
                      })}
                    >
                      ถอนใบเสนอราคา
                    </Button>
                  ) : null}
                </div>
              </section>
            </div>

            {/* Factory Note — always visible when quotation exists, all statuses */}
            {myQuote && quoteIdOf(myQuote) ? (
              <FactoryNoteInline
                quotationId={quoteIdOf(myQuote)}
                initialNote={
                  String((myQuote as unknown as Record<string, unknown>).factory_note ?? '') || null
                }
                onSaved={load}
              />
            ) : null}

            {/* Send QT in chat + Quotation history */}
            {(customerId > 0 && fid != null) || (myQuote && quoteIdOf(myQuote)) ? (
              <div className='flex flex-col lg:flex-row gap-5 items-start'>
                {/* Send QT in chat — fixed height, ไม่ยืดตาม history */}
                {customerId > 0 && fid != null ? (
                  <div
                    className={factoryBoxClass({
                      variant: 'violet',
                      className: 'w-full self-start p-3 lg:flex-1',
                    })}
                  >
                    <div className='flex items-center justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='text-[13px] font-semibold text-slate-800'>
                          ส่งใบเสนอราคาให้ลูกค้า
                        </p>
                        <p className='text-[11px] text-slate-500'>
                          แชร์ BOQ ล่าสุดเข้าแชทลูกค้าโดยตรง
                        </p>
                      </div>
                      <Button
                        variant='unstyled'
                        type='button'
                        disabled={chatBusy || !myQuote}
                        onClick={() => void sendQuoteMessageToCustomer()}
                        className={factoryButtonClass({ variant: 'primary', size: 'md' })}
                      >
                        <MessageCircle size={15} />
                        ส่งในแชท
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* Quotation history — ขยายได้อิสระ */}
                {myQuote && quoteIdOf(myQuote) ? (
                  <div className='w-full lg:flex-1 min-w-0'>
                    <QuotationHistoryPanel quotationId={quoteIdOf(myQuote)} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Lightbox */}
      {lightbox != null && imageUrls[lightbox] ? (
        <div
          role='presentation'
          className='fixed inset-0 z-[60] bg-black/75 flex items-center justify-center p-4'
          onClick={() => setLightbox(null)}
        >
          <Button
            variant='unstyled'
            type='button'
            className='absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/15 text-white shadow-none hover:bg-white/25'
            onClick={() => setLightbox(null)}
            aria-label='ปิด'
          >
            <X size={22} />
          </Button>
          <Image
            src={imageUrls[lightbox]}
            alt=''
            className='max-w-full max-h-[85vh] object-contain rounded-lg pointer-events-none'
            loading='eager'
          />
        </div>
      ) : null}
    </div>
  );
}
