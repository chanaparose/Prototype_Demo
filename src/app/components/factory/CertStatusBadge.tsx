import React from 'react';

type Props = {
  status?: string | null;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  PD: {
    label: 'รอตรวจสอบ',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  AP: {
    label: 'อนุมัติแล้ว',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  RJ: {
    label: 'ถูกปฏิเสธ',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

export function CertStatusBadge({ status }: Props) {
  const key = String(status ?? '').toUpperCase();
  const meta = STATUS_META[key] ?? {
    label: key || '—',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
