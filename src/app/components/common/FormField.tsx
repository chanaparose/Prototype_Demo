import React, { type ReactNode } from 'react';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  helperText?: string;
}

export function FormField({
  label,
  error,
  required,
  children,
  className = '',
  helperText,
}: Readonly<FormFieldProps>) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className='block text-sm font-medium text-brand-navy-deep'>
        {label}
        {required && <span className='text-red-500 ml-0.5'>*</span>}
      </Label>
      {children}
      {helperText && !error && <p className='text-xs text-gray-500 mt-1'>{helperText}</p>}
      {error && <p className='text-xs md:text-sm text-red-600 mt-1'>{error}</p>}
    </div>
  );
}

import type { FormState } from '@/pages/auth/useRegisterFactory';

type FieldBlockProps = {
  label: string;
  error?: string;
  fieldKey: keyof FormState | 'acceptTerms';
  setFieldRef: (key: keyof FormState) => (el: HTMLElement | null) => void;
  children: ReactNode;
  className?: string;
  required?: boolean;
};

export function FieldBlock({
  label,
  error,
  fieldKey,
  setFieldRef,
  children,
  className = '',
  required,
}: Readonly<FieldBlockProps>) {
  return (
    <div ref={setFieldRef(fieldKey)} className={className}>
      <FormField label={label} error={error} required={required}>
        {children}
      </FormField>
    </div>
  );
}

interface SectionHeadingProps {
  num: number;
  label: string;
}

export function SectionHeading({ num, label }: Readonly<SectionHeadingProps>) {
  return (
    <h3 className='text-base font-semibold text-brand-purple mb-4 flex items-center gap-2'>
      <span className='w-6 h-6 rounded-full bg-brand-purple/10 flex items-center justify-center text-xs'>
        {num}
      </span>
      {label}
    </h3>
  );
}
