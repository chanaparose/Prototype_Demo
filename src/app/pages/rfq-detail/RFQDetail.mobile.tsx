import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  RfqDetailStatusCard,
  RfqDetailSpecs,
  RfqDetailOffersSection,
  HISTORY_STATUSES,
  STATUS_LABEL,
} from '../../components/features/rfq-detail';

const COLORS = {
  purple: '#7A4B94',
  orange: '#E38844',
  blue: '#2E2252',
  lightPurpleBg: '#F8F6FA',
};

export function RFQDetailMobile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const data = useData();
  const { refetchRfq, refetchOrders } = data;
  const { isAuthenticated } = useAuth();
  const [specsOpen, setSpecsOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  const needsDetailFetch = Boolean(id && isAuthenticated);
  const [detailSynced, setDetailSynced] = useState(!needsDetailFetch);

  React.useEffect(() => {
    if (!id || !isAuthenticated) {
      setDetailSynced(true);
      return;
    }
    setDetailSynced(false);
    let cancelled = false;
    void refetchRfq(id).finally(() => {
      if (!cancelled) setDetailSynced(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated, refetchRfq]);

  const rfq = id ? data.rfqs.find((r) => r.id === id) : undefined;

  if (!rfq) {
    const showLoading = data.isLoading || !detailSynced;
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
          <p className="text-sm font-semibold" style={{ color: COLORS.blue }}>
            {showLoading ? 'กำลังโหลด RFQ...' : 'ไม่พบคำขอนี้ หรือคุณไม่มีสิทธิ์ดู'}
          </p>
          {!showLoading && (
            <button
              type="button"
              className="mt-4 text-sm font-semibold underline"
              style={{ color: COLORS.purple }}
              onClick={() => navigate('/orders')}
            >
              กลับไป RFQ & คำสั่งซื้อ
            </button>
          )}
        </div>
      </div>
    );
  }

  const isHistoryView = HISTORY_STATUSES.includes(
    rfq.status as (typeof HISTORY_STATUSES)[number],
  );
  const orderForRfq = data.orders.find((o) => o.rfqId === rfq.id);

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
          orderForRfq={orderForRfq ?? undefined}
          selectedOfferId={selectedOffer}
          onSelectOffer={setSelectedOffer}
          onNavigateToMessages={() => navigate('/messages/conv1')}
          rfqQuantity={rfq.quantity}
          onOfferFlowComplete={async ({ orderId }) => {
            if (id) await refetchRfq(id);
            await refetchOrders();
            if (orderId) navigate(`/orders/${orderId}`);
          }}
        />
      </div>
    </div>
  );
}
