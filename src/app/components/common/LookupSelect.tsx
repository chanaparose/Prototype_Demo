import React from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
}: Readonly<LookupSelectProps<Option>>) {
  const { data, isLoading, isError, refetch } = queryResult;
  const opts = data ?? [];
  const selected = value != null && String(value).trim() !== '' ? String(value) : '';

  return (
    <Label className={`block ${className}`}>
      <span className='text-xs text-gray-500'>
        {label}
        {required ? ' *' : ''}
      </span>
      <div className='relative'>
        <Select
          value={selected}
          disabled={disabled || isLoading}
          onValueChange={(next) => {
            // Radix fires onValueChange("") when value doesn't match any option yet — ignore it
            if (!next) return;
            onChange(next === '__empty' ? null : Number(next));
          }}
        >
          <SelectTrigger className='mt-1 w-full'>
            <SelectValue placeholder={isLoading ? 'กำลังโหลด…' : placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__empty'>{isLoading ? 'กำลังโหลด…' : placeholder}</SelectItem>
            {opts.map((o) => {
              const id = getId(o);
              return (
                <SelectItem key={id} value={String(id)}>
                  {getLabel(o)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {isError ? (
          <Button
            onClick={() => void refetch()}
            variant='link'
            size='xs'
            className='absolute right-2 top-2 text-xs text-red-600 underline'
            title='โหลดใหม่'
          >
            โหลดใหม่
          </Button>
        ) : null}
      </div>
    </Label>
  );
}
