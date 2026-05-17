import * as React from 'react';

import { cn } from '@lib/utils';
import { Label } from '@/components/ui/label';

type FormFieldProps = React.ComponentProps<'div'> & {
  label?: React.ReactNode;
  error?: React.ReactNode;
  helperText?: React.ReactNode;
  required?: boolean;
  labelClassName?: string;
  contentClassName?: string;
};

function FormField({
  className,
  label,
  error,
  helperText,
  required,
  labelClassName,
  contentClassName,
  children,
  ...props
}: FormFieldProps) {
  return (
    <div data-slot='form-field' className={cn('flex flex-col gap-1.5', className)} {...props}>
      {label ? (
        <Label
          data-slot='form-field-label'
          className={cn('text-[13px] font-semibold', labelClassName)}
        >
          {label}
          {required ? <span className='ml-1 text-status-danger'>*</span> : null}
        </Label>
      ) : null}
      <div data-slot='form-field-control' className={contentClassName}>
        {children}
      </div>
      {error ? (
        <p data-slot='form-field-error' className='text-xs font-medium text-status-danger'>
          {error}
        </p>
      ) : helperText ? (
        <p data-slot='form-field-helper' className='text-xs text-gray-500'>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export { FormField };
