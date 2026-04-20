import React from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

interface LookupSelectProps<Option> {
  label: string;
  value: number | string | null;
  onChange: (id: number | null) => void;
  queryResult: UseQueryResult<Option[]>;
  getId: (opt: Option) => number;
  getLabel: (opt: Option) => string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function LookupSelect<Option>({
  label,
  value,
  onChange,
  queryResult,
  getId,
  getLabel,
  placeholder = '— เลือก —',
  required,
  disabled,
  className = '',
}: LookupSelectProps<Option>) {
  const { data, isLoading, isError, refetch } = queryResult;
  const opts = data ?? [];
  const selected = value != null && String(value).trim() !== '' ? String(value) : '';

  return (
    <label className={`block ${className}`}>
      <span className="text-xs text-gray-500">
        {label}
        {required ? ' *' : ''}
      </span>
      <div className="relative">
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:opacity-60"
          value={selected}
          disabled={disabled || isLoading}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v ? Number(v) : null);
          }}
        >
          <option value="">{isLoading ? 'กำลังโหลด…' : placeholder}</option>
          {opts.map((o) => {
            const id = getId(o);
            return (
              <option key={id} value={String(id)}>
                {getLabel(o)}
              </option>
            );
          })}
        </select>
        {isError ? (
          <button
            type="button"
            onClick={() => void refetch()}
            className="absolute right-2 top-2 text-xs text-red-600 underline"
            title="โหลดใหม่"
          >
            โหลดใหม่
          </button>
        ) : null}
      </div>
    </label>
  );
}
