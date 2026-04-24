import React from 'react';

type Props = {
  label: string;
  before: React.ReactNode;
  after: React.ReactNode;
  changed?: boolean;
};

export function DiffRow({ label, before, after, changed }: Props) {
  return (
    <div className={`grid grid-cols-3 gap-3 px-3 py-2 rounded-lg ${changed ? 'bg-amber-50' : ''}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-700">{before}</p>
      <p className={`text-sm ${changed ? 'font-semibold text-amber-900' : 'text-gray-700'}`}>{after}</p>
    </div>
  );
}
