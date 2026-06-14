import React from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { showcasesApi } from '@/services/api/factoryApi';
import type { ChatReference } from '@/utils/chatContract';

type Props = {
  reference: ChatReference;
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
      return `/product-detail?showcase_id=${id}`;
  }
}

export function labelFor(ref: ChatReference, titleFallback?: string): string {
  const idText = Number.isFinite(ref.id) && ref.id > 0 ? `#${ref.id}` : 'รายการอ้างอิง';
  switch (ref.type) {
    case 'PD': {
      const t = ref.title?.trim() || titleFallback?.trim() || `สินค้า ${idText}`;
      return `สินค้า: ${t}`;
    }
    case 'PM': {
      const t = ref.title?.trim() || titleFallback?.trim() || `โปรโมชัน ${idText}`;
      return `โปรโมชัน: ${t}`;
    }
    case 'ID': {
      const t = ref.title?.trim() || titleFallback?.trim() || `ไอเดีย ${idText}`;
      return `ไอเดีย: ${t}`;
    }
    case 'RQ': {
      const t = ref.title?.trim() || titleFallback?.trim() || `RFQ ${idText}`;
      return `RFQ: ${t}`;
    }
    case 'OD': {
      const t = ref.title?.trim() || titleFallback?.trim() || `Order ${idText}`;
      return `Order: ${t}`;
    }
    default:
      return ref.title?.trim() || titleFallback?.trim() || idText;
  }
}

/** Fetch showcase title only when no title provided and reference_id is a showcase */
function useShowcaseTitle(referenceId: number, skip: boolean) {
  return useQuery({
    queryKey: ['showcase-title', referenceId],
    queryFn: async () => {
      const res = await showcasesApi.get(referenceId);
      return (res as { title?: string }).title ?? '';
    },
    enabled: !skip && referenceId > 0,
    staleTime: 10 * 60 * 1000,
  });
}

export function ReferenceChip({ reference, titleFallback }: Props) {
  const hasTitle = Boolean(reference.title?.trim() || titleFallback?.trim());
  // Fetch from API only for showcase types (PD, PM, ID) or unknown type when no title
  const isShowcaseType =
    !reference.type || ['PD', 'PM', 'ID'].includes(reference.type);
  const { data: fetchedTitle } = useShowcaseTitle(
    reference.id,
    hasTitle || !isShowcaseType,
  );

  if (!Number.isFinite(reference.id) || reference.id <= 0) {
    return null;
  }

  const resolvedTitle = reference.title?.trim() || titleFallback?.trim() || fetchedTitle;
  const to = hrefFor(reference);
  const label = labelFor({ ...reference, title: resolvedTitle }, resolvedTitle);

  return (
    <Link
      to={to}
      className='mt-1 inline-flex max-w-full items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-900 hover:bg-violet-100 truncate'
    >
      {label}
    </Link>
  );
}
