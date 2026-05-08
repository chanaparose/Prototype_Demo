import React, { useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { rfqsApi } from '../../services/api';
import { openChatSession } from '../../utils/openChatSession';
import { getCurrentUserId } from '../../utils/chatContract';
import type { OfferItem } from '../../components/features/rfq-detail/RfqDetailOffersSection';
import { ChevronLeft } from 'lucide-react';
import { useRfqDetail } from '../../hooks/useRfqDetail';
import {
  RfqDetailStatusCard,
  RfqDetailSpecs,
  RfqDetailOffersSection,
  QuotationHistoryPanel,
  HISTORY_STATUSES,
  STATUS_LABEL,
} from '../../components/features/rfq-detail';

const CLOSEABLE_STATUSES = new Set(['pending', 'offers_received', 'reviewing']);

const COLORS = {
  purple: '#7A4B94',
  orange: '#E38844',
  blue: '#2E2252',
  lightPurpleBg: '#F8F6FA',
};

export function RFQDetailMobile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rfq, relatedOrder, quoteOrderMap: _quoteOrderMap, loading, error, refetch } = useRfqDetail(id);
  const [specsOpen, setSpecsOpen] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const requestedQuoteId = String(searchParams.get('quote_id') || '').trim();
  const requestedFactoryId = String(searchParams.get('factory_id') || '').trim();

  React.useEffect(() => {
    if (!rfq?.offers?.length) return;
    if (selectedOffer) return;
    const byQuote = requestedQuoteId
      ? rfq.offers.find((o) => String(o.id) === requestedQuoteId)
      : undefined;
    const byFactory = !byQuote && requestedFactoryId
      ? rfq.offers.find((o) => String(o.factoryId) === requestedFactoryId)
      : undefined;
    const matched = byQuote ?? byFactory;
    if (matched?.id) setSelectedOffer(String(matched.id));
  }, [rfq?.offers, requestedQuoteId, requestedFactoryId, selectedOffer]);

  const handleChatWithOffer = useCallback(
    async (offer: OfferItem) => {
      if (!rfq) return;
      const my = getCurrentUserId(user);
      const fid = Number(offer.factoryId);
      const rid = Number(id);
      if (my == null || !Number.isFinite(fid) || fid <= 0 || !Number.isFinite(rid) || rid <= 0) return;
      const ref = { type: 'RQ' as const, id: rid, title: rfq.projectName };
      await openChatSession(navigate, user, {
        customerUserId: my,
        factoryEntityId: fid,
        pendingReference: ref,
      });
    },
    [user, navigate, id, rfq?.projectName],
  );

  if (!rfq) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.lightPurpleBg }}>
        <div className="flex items-center px-4 pt-5 pb-4 bg-white border-b border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="w-10 h-10 rounded-xl shadow-sm flex items-center justify-center"
            style={{ backgroundColor: COLORS.lightPurpleBg }}
          >
            <ChevronLeft size={22} style={{ color: COLORS.blue }} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24 text-center">
          {loading ? (
            <>
              <div
                className="w-10 h-10 rounded-full border-3 animate-spin mb-3"
                style={{ borderColor: COLORS.purple, borderTopColor: 'transparent' }}
              />
              <p className="text-sm font-semibold" style={{ color: COLORS.blue }}>
                กำลังโหลด RFQ...
              </p>
            </>
          ) : error ? (
            <>
              <p className="text-sm font-semibold text-red-600 mb-2">{error}</p>
              <button
                type="button"
                className="text-sm font-semibold underline"
                style={{ color: COLORS.purple }}
                onClick={() => refetch()}
              >
                ลองใหม่
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold" style={{ color: COLORS.blue }}>
                ไม่พบคำขอนี้ หรือคุณไม่มีสิทธิ์ดู
              </p>
              <button
                type="button"
                className="mt-4 text-sm font-semibold underline"
                style={{ color: COLORS.purple }}
                onClick={() => navigate('/orders')}
              >
                กลับไป คำขอราคา & คำสั่งซื้อ
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const isClosedRequest = rfq.status === 'completed' || rfq.status === 'cancelled';
  const isHistoryView = HISTORY_STATUSES.includes(
    rfq.status as (typeof HISTORY_STATUSES)[number],
  ) && !isClosedRequest;
  const canClose = CLOSEABLE_STATUSES.has(rfq.status);

  const statusBadgeStyle = isHistoryView
    ? rfq.status === 'completed'
      ? { background: '#D1FAE5', color: '#059669' }
      : rfq.status === 'cancelled'
        ? { background: '#F1F5F9', color: '#64748B' }
        : { background: '#FEF3C7', color: '#B45309' }
    : isClosedRequest
      ? rfq.status === 'completed'
        ? { background: '#E8F7EE', color: '#0F9F6E' }
        : { background: '#F1F5F9', color: '#64748B' }
    : { background: COLORS.lightPurpleBg, color: COLORS.purple };

  const statusLabel = isClosedRequest
    ? rfq.status === 'completed'
      ? 'ปิดคำขอแล้ว'
      : 'ยกเลิกคำขอแล้ว'
    : isHistoryView
    ? STATUS_LABEL[rfq.status] ?? rfq.status
    : `${rfq.offerCount} ใบเสนอราคา`;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.lightPurpleBg }}>
      <div className="flex items-center justify-between px-4 pt-5 pb-4 bg-white border-b border-gray-100">
        <button
          onClick={() => navigate('/orders')}
          className="w-10 h-10 rounded-xl shadow-sm flex items-center justify-center"
          style={{ backgroundColor: COLORS.lightPurpleBg }}
        >
          <ChevronLeft size={22} style={{ color: COLORS.blue }} />
        </button>
        <div className="text-center">
          <p className="text-[10px]" style={{ color: COLORS.orange }}>RFQ Detail</p>
          <h1
            className="text-sm max-w-[200px] truncate"
            style={{ fontWeight: 700, color: COLORS.blue }}
          >
            {rfq.projectName}
          </h1>
        </div>
        <div className="w-10 h-10" aria-hidden />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4 space-y-4">
        {canClose ? (
          <div className="flex gap-2">
            {canClose ? (
              <button
                type="button"
                disabled={closing}
                onClick={async () => {
                  const ok = window.confirm('ปิดรับคำขอราคานี้? โรงงานจะไม่สามารถส่งใบเสนอราคาใหม่ได้ แต่คำสั่งซื้อที่ยืนยันแล้วยังคงดำเนินต่อไป');
                  if (!ok) return;
                  setClosing(true);
                  try {
                    await rfqsApi.close(rfq.id);
                    toast.success('ปิดรับคำขอราคาเรียบร้อย');
                    await refetch();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'ไม่สามารถปิดคำขอได้');
                  } finally {
                    setClosing(false);
                  }
                }}
                className="flex-1 rounded-xl border text-sm font-semibold py-2.5 disabled:opacity-60"
                style={{ borderColor: COLORS.purple, color: COLORS.purple, backgroundColor: COLORS.lightPurpleBg }}
              >
                {closing ? 'กำลังปิด...' : 'ปิดรับคำขอ'}
              </button>
            ) : null}
          </div>
        ) : null}
        {(rfq.subCategoryName || rfq.shippingMethodName) ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2 text-sm">
            {rfq.subCategoryName ? (
              <p>
                <span className="text-gray-500">ประเภทย่อย: </span>
                <span style={{ fontWeight: 600, color: COLORS.blue }}>{rfq.subCategoryName}</span>
              </p>
            ) : null}
            {rfq.shippingMethodName ? (
              <p>
                <span className="text-gray-500">วิธีส่งของ: </span>
                <span style={{ fontWeight: 600, color: COLORS.blue }}>{rfq.shippingMethodName}</span>
              </p>
            ) : null}
          </div>
        ) : null}
        <RfqDetailStatusCard
          rfq={rfq}
          isHistoryView={isHistoryView}
          statusBadgeStyle={statusBadgeStyle}
          statusLabel={statusLabel}
        />

        <RfqDetailSpecs
          rfq={rfq}
          open={specsOpen}
          onToggle={() => setSpecsOpen(!specsOpen)}
        />

        <RfqDetailOffersSection
          rfqStatus={rfq.status}
          offers={rfq.offers ?? []}
          isHistoryView={isHistoryView}
          orderForRfq={relatedOrder ?? undefined}
          selectedOfferId={selectedOffer}
          onSelectOffer={setSelectedOffer}
          onChatWithOffer={handleChatWithOffer}
          rfqQuantity={rfq.quantity}
          onOfferFlowComplete={async () => {
            // Multi-factory: refetch เพื่ออัปเดต status ทุก card — ไม่ navigate ออก
            await refetch();
          }}
        />
        {selectedOffer ? (
          <div className="px-1">
            <QuotationHistoryPanel quotationId={selectedOffer} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
