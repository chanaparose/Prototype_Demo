import React, { useState } from 'react';
import { ChevronDown, Calendar, Package, Tag, DollarSign, Clock, Wrench } from 'lucide-react';
import type { RfqNestedDTO, QuoteNestedDTO } from '../../../types/api';
import { OrderPhotoGallery } from './OrderPhotoGallery';

interface Props {
  rfq: RfqNestedDTO;
  variant?: 'accordion';
  defaultOpen?: boolean;
  /** Optional quotation details to show alongside the RFQ spec */
  quotation?: QuoteNestedDTO | null;
}

export function RfqReferenceCard({ rfq, defaultOpen = false, quotation }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const body = (
    <div className="space-y-4">
      {/* RFQ details text */}
      {rfq.details ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{rfq.details}</p> : null}

      {/* RFQ spec grid */}
      <div>
        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">รายละเอียดใบขอราคา</p>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <MetaRow icon={<Package size={12} />} label="จำนวน" value={`${rfq.quantity.toLocaleString()} ${rfq.unit_name}`} />
          <MetaRow icon={<Tag size={12} />} label="หมวดหมู่" value={rfq.category_name} />
          
          {rfq.deadline_date ? (
            <MetaRow
              icon={<Calendar size={12} />}
              label="กำหนดส่ง"
              value={new Date(rfq.deadline_date).toLocaleDateString('th-TH')}
            />
          ) : null}
        </dl>
      </div>

      {/* Quotation details (factory offer) */}
      {quotation ? (
        <div>
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">รายละเอียดใบเสนอราคา</p>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <MetaRow
              icon={<DollarSign size={12} />}
              label="ราคา/ชิ้น"
              value={`฿${quotation.price_per_piece.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
            />
            {quotation.mold_cost > 0 ? (
              <MetaRow
                icon={<Wrench size={12} />}
                label="ค่าแม่พิมพ์"
                value={`฿${quotation.mold_cost.toLocaleString('th-TH')}`}
              />
            ) : null}
            <MetaRow
              icon={<Clock size={12} />}
              label="ระยะเวลาผลิต"
              value={`${quotation.lead_time_days} วัน`}
            />
            <MetaRow
              icon={<DollarSign size={12} />}
              label="มูลค่ารวม"
              value={`฿${(quotation.price_per_piece * rfq.quantity).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
            />
          </dl>
        </div>
      ) : null}

      {/* Images */}
      {rfq.images.length > 0 ? (
        <div>
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">รูปภาพประกอบ</p>
          <div className="grid grid-cols-3 gap-2">
            {rfq.images.map((img) => (
              <button
                key={img.image_id}
                type="button"
                onClick={() => setLightbox(img.image_url)}
                className="aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <OrderPhotoGallery photoUrl={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );

  return (
    <section className="rounded-2xl border border-gray-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
          รายละเอียดใบขอราคา
        </span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="px-4 pb-4">{body}</div> : null}
    </section>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500 flex items-center gap-1">{icon}{label}</dt>
      <dd className="text-gray-900" style={{ fontWeight: 600 }}>{value}</dd>
    </div>
  );
}
