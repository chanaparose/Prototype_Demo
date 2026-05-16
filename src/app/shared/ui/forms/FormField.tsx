import React from 'react';

type FormFieldProps = {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
};

export function FormField({
  label,
  error,
  helperText,
  required,
  children,
  className = '',
  labelClassName = '',
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className={`text-[13px] font-bold text-gray-700 ${labelClassName}`}>
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
