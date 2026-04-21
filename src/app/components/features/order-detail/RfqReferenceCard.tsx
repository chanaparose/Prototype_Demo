import React, { useState } from 'react';
import { ChevronDown, Calendar, Package, Tag } from 'lucide-react';
import type { RfqNestedDTO } from '../../../types/api';
import { OrderPhotoGallery } from './OrderPhotoGallery';

interface Props {
  rfq: RfqNestedDTO;
  variant: 'accordion' | 'panel';
  defaultOpen?: boolean;
}

export function RfqReferenceCard({ rfq, variant, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(variant === 'panel' ? true : defaultOpen);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const body = (
    <div className="space-y-3">
      {rfq.details ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{rfq.details}</p> : null}
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <MetaRow icon={<Package size={12} />} label="จำนวน" value={`${rfq.quantity.toLocaleString()} ${rfq.unit_name}`} />
        <MetaRow icon={<Tag size={12} />} label="หมวดหมู่" value={rfq.category_name} />
        <MetaRow icon={null} label="งบประมาณ/ชิ้น" value={`฿${rfq.budget_per_piece.toFixed(2)}`} />
        {rfq.deadline_date ? (
          <MetaRow
            icon={<Calendar size={12} />}
            label="กำหนดส่ง"
            value={new Date(rfq.deadline_date).toLocaleDateString('th-TH')}
          />
        ) : null}
      </dl>
      {rfq.images.length > 0 ? (
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
      ) : null}
      <OrderPhotoGallery photoUrl={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );

  if (variant === 'panel') {
    return (
      <section className="rounded-2xl border border-gray-100 bg-white p-4 sticky top-4">
        <h3 className="text-sm text-gray-900 mb-3" style={{ fontWeight: 700 }}>
          ใบขอราคาต้นทาง
        </h3>
        {body}
      </section>
    );
  }

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
