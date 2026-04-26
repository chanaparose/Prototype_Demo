import React from 'react';
import { Link } from 'react-router';
import type { ChatReference } from '../../utils/chatContract';

type Props = {
  reference: ChatReference;
  /** When missing, chip shows generic label (never show raw id) */
  titleFallback?: string;
};

function hrefFor(ref: ChatReference): string {
  const id = ref.id;
  switch (ref.type) {
    case 'PD':
      return `/product-detail?showcase_id=${id}`;
    case 'PM':
      return `/promotion-detail?showcase_id=${id}`;
    case 'ID':
      return `/idea-detail?showcase_id=${id}`;
    case 'RQ':
      return `/rfqs/${id}`;
    case 'OD':
      return `/orders/${id}`;
    default:
      return '#';
  }
}

function labelFor(ref: ChatReference, titleFallback?: string): string {
  const t = ref.title?.trim() || titleFallback?.trim() || 'รายการอ้างอิง';
  switch (ref.type) {
    case 'PD':
      return `สินค้า: ${t}`;
    case 'PM':
      return `โปรโมชัน: ${t}`;
    case 'ID':
      return `ไอเดีย: ${t}`;
    case 'RQ':
      return `RFQ: ${t}`;
    case 'OD':
      return `Order: ${t}`;
    default:
      return t;
  }
}

export function ReferenceChip({ reference, titleFallback }: Props) {
  const rt = reference.type;
  if (!['PD', 'PM', 'ID', 'RQ', 'OD'].includes(rt) || !Number.isFinite(reference.id) || reference.id <= 0) {
    return null;
  }
  const to = hrefFor(reference);
  const label = labelFor(reference, titleFallback);
  return (
    <Link
      to={to}
      className="mt-1 inline-flex max-w-full items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-900 hover:bg-violet-100 truncate"
    >
      {label}
    </Link>
  );
}
