import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { Bell, ChevronLeft, MessageCircle } from 'lucide-react';
import { orders, rfqs } from '../../data/mockData';
import {
  HISTORY_STATUSES,
  RfqDetailOffersSection,
  RfqDetailSpecs,
  RfqDetailStatusCard,
  STATUS_LABEL,
} from '../../components/features/rfq-detail';

export function RFQDetailDesktop() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [specsOpen, setSpecsOpen] = React.useState(true);
  const [selectedOffer, setSelectedOffer] = React.useState<string | null>(null);

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
    <div className="hidden lg:block bg-white">
      <div className="max-w-6xl mx-auto px-8 py-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center"
              >
                <ChevronLeft size={22} className="text-gray-700" />
              </button>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  RFQ Detail
                </p>
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {rfq.projectName}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 pl-[52px]">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={statusBadgeStyle}>
                {statusLabel}
              </span>
              <span className="text-gray-300">•</span>
              <span>หมวด: {rfq.category}</span>
              <span className="text-gray-300">•</span>
              <span>งบ: ฿{rfq.budget.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50"
              onClick={() => navigate('/messages/conv1')}
            >
              <span className="inline-flex items-center gap-2">
                <MessageCircle size={16} className="text-[#6C47FF]" />
                แชทกับโรงงาน
              </span>
            </button>
            <button
              type="button"
              className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center"
            >
              <Bell size={18} style={{ color: '#6C47FF' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
          {/* Main */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">สรุปสถานะ</p>
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
                  <p className="text-sm font-bold text-gray-900">ใบเสนอราคา</p>
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
                  orderForRfq={orderForRfq ?? undefined}
                  selectedOfferId={selectedOffer}
                  onSelectOffer={setSelectedOffer}
                  onNavigateToMessages={() => navigate('/messages/conv1')}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sticky top-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-bold text-gray-900 mb-3">ข้อมูล RFQ</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-400">จำนวน</p>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {rfq.quantity.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-400">Deadline</p>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {rfq.deadline}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 col-span-2">
                  <p className="text-[11px] text-gray-400">วัตถุดิบ/วัสดุ</p>
                  <p className="font-semibold text-gray-800 mt-0.5 line-clamp-2">
                    {rfq.material}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">สเปกงาน</p>
                  <p className="text-xs text-gray-500 mt-1">
                    เปิด/ปิดเพื่อดูรายละเอียดสเปก
                  </p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 border border-gray-100 hover:bg-gray-100"
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

            <div className="bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl p-5 text-white shadow-sm">
              <p className="text-sm font-bold">ต้องการ RFQ ใหม่?</p>
              <p className="text-xs opacity-90 mt-1">
                สร้างคำขอใหม่เพื่อรับใบเสนอราคาจากโรงงานได้ทันที
              </p>
              <button
                type="button"
                className="mt-4 w-full py-3 rounded-xl bg-white/95 text-sm font-bold"
                style={{ color: '#6C47FF' }}
                onClick={() => navigate('/create-rfq')}
              >
                + สร้าง RFQ ใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

