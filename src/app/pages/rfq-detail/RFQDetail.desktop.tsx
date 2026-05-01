import React, { useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useRfqDetail } from '../../hooks/useRfqDetail';
import { rfqsApi } from '../../services/api';
import { openChatSession } from '../../utils/openChatSession';
import { getCurrentUserId } from '../../utils/chatContract';
import type { OfferItem } from '../../components/features/rfq-detail/RfqDetailOffersSection';
import {
  HISTORY_STATUSES,
  RfqDetailOffersSection,
  RfqDetailSpecs,
  RfqDetailStatusCard,
  STATUS_LABEL,
} from '../../components/features/rfq-detail';

const COLORS = {
  purple: '#7A4B94',
  purpleLight: '#9D77B2',
  orange: '#E38844',
  blue: '#2E2252',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  lightPurpleBg: '#F8F6FA',
};
const CANCELLABLE_STATUSES = new Set(['pending', 'offers_received', 'reviewing']);

export function RFQDetailDesktop() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rfq, relatedOrder, loading, error, refetch } = useRfqDetail(id);

  const [specsOpen, setSpecsOpen] = React.useState(true);
  const [selectedOffer, setSelectedOffer] = React.useState<string | null>(null);
  const [cancelling, setCancelling] = React.useState(false);
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
      <div className="hidden lg:block min-h-[60vh]" style={{ backgroundColor: COLORS.lightPurpleBg }}>
        <div className="max-w-6xl mx-auto px-8 py-14 flex flex-col items-center gap-4 text-center">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 bg-white self-start"
          >
            <ArrowLeft size={18} style={{ color: COLORS.blue }} />
          </button>
          {loading ? (
            <>
              <div
                className="w-10 h-10 rounded-full border-3 animate-spin"
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
                className="text-sm font-semibold underline"
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

  const isHistoryView = HISTORY_STATUSES.includes(
    rfq.status as (typeof HISTORY_STATUSES)[number],
  );

  const statusBadgeStyle = isHistoryView
    ? rfq.status === 'completed'
      ? { background: '#D1FAE5', color: '#059669' }
      : rfq.status === 'cancelled'
        ? { background: '#F1F5F9', color: '#64748B' }
        : { background: '#FEF3C7', color: '#B45309' }
    : { background: COLORS.lightPurpleBg, color: COLORS.purple };

  const statusLabel = isHistoryView
    ? STATUS_LABEL[rfq.status] ?? rfq.status
    : `${rfq.offerCount} ใบเสนอราคา`;
  const canCancel = CANCELLABLE_STATUSES.has(rfq.status);

  return (
    <div className="hidden lg:block" style={{ backgroundColor: COLORS.lightPurpleBg }}>
      <div className="max-w-6xl mx-auto px-8 py-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-gray-200 hover:border-gray-300 transition-colors"
                style={{ backgroundColor: COLORS.white }}
              >
                <ArrowLeft size={18} style={{ color: COLORS.blue }} />
              </button>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: COLORS.orange }}>
                  RFQ Detail
                </p>
                <h1 className="text-2xl font-bold truncate" style={{ color: COLORS.blue }}>
                  {rfq.projectName}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm ml-[52px]" style={{ color: COLORS.blue }}>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={statusBadgeStyle}>
                {statusLabel}
              </span>
              <span className="text-gray-300">•</span>
              <span>หมวด: {rfq.category}</span>
              <span className="text-gray-300">•</span>
              <span>งบ: ฿{rfq.budget.toLocaleString()}</span>
            </div>
          </div>
          {canCancel ? (
            <button
              type="button"
              disabled={cancelling}
              onClick={async () => {
                const ok = window.confirm('ยืนยันการยกเลิก RFQ นี้? การกระทำนี้ไม่สามารถย้อนกลับได้');
                if (!ok) return;
                setCancelling(true);
                try {
                  await rfqsApi.cancel(rfq.id);
                  toast.success('ยกเลิก RFQ สำเร็จ');
                  await refetch();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'ไม่สามารถยกเลิก RFQ ได้');
                } finally {
                  setCancelling(false);
                }
              }}
              className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold disabled:opacity-60"
            >
              {cancelling ? 'กำลังยกเลิก...' : 'ยกเลิก RFQ'}
            </button>
          ) : null}
        </div>

        {/* Content */}
        <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
          {/* Main */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-bold" style={{ color: COLORS.blue }}>สรุปสถานะ</p>
                <p className="text-xs text-gray-500 mt-1">
                  ดูความคืบหน้าและข้อเสนอจากโรงงานในที่เดียว
                </p>
              </div>
              <div className="p-4">
                <RfqDetailStatusCard
                  rfq={rfq}
                  isHistoryView={isHistoryView}
                  statusBadgeStyle={statusBadgeStyle}
                  statusLabel={statusLabel}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold" style={{ color: COLORS.blue }}>ใบเสนอราคา</p>
                  <p className="text-xs text-gray-500 mt-1">
                    เลือกข้อเสนอเพื่อเปรียบเทียบราคาและ lead time
                  </p>
                </div>
              </div>
              <div className="p-4">
                <RfqDetailOffersSection
                  rfqStatus={rfq.status}
                  offers={rfq.offers ?? []}
                  isHistoryView={isHistoryView}
                  orderForRfq={relatedOrder ?? undefined}
                  selectedOfferId={selectedOffer}
                  onSelectOffer={setSelectedOffer}
                  onChatWithOffer={handleChatWithOffer}
                  rfqQuantity={rfq.quantity}
                  onOfferFlowComplete={async ({ orderId }) => {
                    await refetch();
                    if (orderId) navigate(`/orders/${orderId}`);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sticky top-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-bold mb-3" style={{ color: COLORS.blue }}>ข้อมูล RFQ</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {rfq.subCategoryName ? (
                  <div className="rounded-xl p-3 col-span-2" style={{ backgroundColor: COLORS.lightPurpleBg }}>
                    <p className="text-[11px] text-gray-400">ประเภทย่อย</p>
                    <p className="font-semibold mt-0.5" style={{ color: COLORS.blue }}>
                      {rfq.subCategoryName}
                    </p>
                  </div>
                ) : null}
                {rfq.shippingMethodName ? (
                  <div className="rounded-xl p-3 col-span-2" style={{ backgroundColor: COLORS.lightPurpleBg }}>
                    <p className="text-[11px] text-gray-400">วิธีส่งของ</p>
                    <p className="font-semibold mt-0.5" style={{ color: COLORS.blue }}>
                      {rfq.shippingMethodName}
                    </p>
                  </div>
                ) : null}
                <div className="rounded-xl p-3" style={{ backgroundColor: COLORS.lightPurpleBg }}>
                  <p className="text-[11px] text-gray-400">จำนวน</p>
                  <p className="font-semibold mt-0.5" style={{ color: COLORS.blue }}>
                    {rfq.quantity.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: COLORS.lightPurpleBg }}>
                  <p className="text-[11px] text-gray-400">Deadline</p>
                  <p className="font-semibold mt-0.5" style={{ color: COLORS.blue }}>
                    {rfq.deadline || '-'}
                  </p>
                </div>
                <div className="rounded-xl p-3 col-span-2" style={{ backgroundColor: COLORS.lightPurpleBg }}>
                  <p className="text-[11px] text-gray-400">รายละเอียด</p>
                  <p className="font-semibold mt-0.5 line-clamp-3 text-xs" style={{ color: COLORS.blue }}>
                    {rfq.description || rfq.material || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold" style={{ color: COLORS.blue }}>สเปกงาน</p>
                  <p className="text-xs text-gray-500 mt-1">
                    เปิด/ปิดเพื่อดูรายละเอียดสเปก
                  </p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-100 hover:bg-gray-100"
                  style={{ backgroundColor: COLORS.lightPurpleBg, color: COLORS.blue }}
                  onClick={() => setSpecsOpen((v) => !v)}
                >
                  {specsOpen ? 'ซ่อน' : 'แสดง'}
                </button>
              </div>
              <div className="p-4">
                <RfqDetailSpecs
                  rfq={rfq}
                  open={specsOpen}
                  onToggle={() => setSpecsOpen((v) => !v)}
                />
              </div>
            </div>

            <div
              className="rounded-2xl p-5 text-white shadow-sm relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #4A267D 100%)' }}
            >
              <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-40 blur-2xl mix-blend-screen" style={{ backgroundColor: '#FF7A00' }} />
              <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full opacity-30 blur-xl mix-blend-screen" style={{ backgroundColor: '#A238FF' }} />
              <div className="relative z-10">
                <p className="text-sm font-bold">ต้องการ RFQ ใหม่?</p>
                <p className="text-xs mt-1" style={{ color: '#EBD3FF' }}>
                  สร้างคำขอใหม่เพื่อรับใบเสนอราคาจากโรงงานได้ทันที
                </p>
                <button
                  type="button"
                  className="mt-4 w-full py-3 rounded-xl bg-white/95 text-sm font-bold"
                  style={{ color: COLORS.purple }}
                  onClick={() => navigate('/create-rfq')}
                >
                  + สร้างคำขอราคา
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
