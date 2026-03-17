import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Bell } from 'lucide-react';
import { rfqs, orders } from '../../data/mockData';
import {
  RfqDetailStatusCard,
  RfqDetailSpecs,
  RfqDetailOffersSection,
  HISTORY_STATUSES,
  STATUS_LABEL,
} from '../../components/features/rfq-detail';

export function RFQDetailMobile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [specsOpen, setSpecsOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  const rfq = rfqs.find((r) => r.id === id) || rfqs[0];
  const isHistoryView = HISTORY_STATUSES.includes(
    rfq.status as (typeof HISTORY_STATUSES)[number],
  );
  const orderForRfq = orders.find((o) => o.rfqId === rfq.id);

  const statusBadgeStyle = isHistoryView
    ? rfq.status === 'completed'
      ? { background: '#D1FAE5', color: '#059669' }
      : rfq.status === 'cancelled'
        ? { background: '#F1F5F9', color: '#64748B' }
        : { background: '#FEF3C7', color: '#B45309' }
    : { background: '#EDE9FF', color: '#6C47FF' };

  const statusLabel = isHistoryView
    ? STATUS_LABEL[rfq.status] ?? rfq.status
    : `${rfq.offerCount} ใบเสนอราคา`;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center"
        >
          <ChevronLeft size={22} className="text-gray-700" />
        </button>
        <div className="text-center">
          <p className="text-[10px] text-gray-400">RFQ Detail</p>
          <h1
            className="text-sm text-gray-900 max-w-[200px] truncate"
            style={{ fontWeight: 700 }}
          >
            {rfq.projectName}
          </h1>
        </div>
        <button className="relative w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
          <Bell size={20} style={{ color: '#6C47FF' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4">
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
        />
      </div>
    </div>
  );
}

