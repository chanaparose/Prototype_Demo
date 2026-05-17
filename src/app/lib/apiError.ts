import { ApiHttpError } from '@/services/api/httpClient';
import { ZodError } from 'zod';

export type FormFieldErrors = Record<string, string>;

export type FormErrorsResult = {
  root?: string;
  fields?: FormFieldErrors;
};

function extractApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const d = data as Record<string, unknown>;

  if (typeof d.message === 'string' && d.message) return d.message;
  if (typeof d.detail === 'string' && d.detail) return d.detail;
  if (typeof d.error === 'string' && d.error) return d.error;

  if (Array.isArray(d.errors) && d.errors.length > 0) {
    const first = d.errors[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      const o = first as Record<string, unknown>;
      const loc = Array.isArray(o.loc) ? o.loc.filter((x) => x !== 'body').join('.') : '';
      const msg = String(o.msg ?? o.message ?? '').trim();
      if (msg) return loc ? `${loc}: ${msg}` : msg;
    }
  }

  return fallback;
}

export function getErrorMessage(error: unknown, fallback = 'ดำเนินการไม่สำเร็จ'): string {
  if (error instanceof ApiHttpError) {
    return extractApiErrorMessage(error.body, error.message || fallback);
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function zodFieldErrors(error: ZodError): FormFieldErrors {
  const fields: FormFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'root';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function toFormErrors(
  error: unknown,
  fallback = 'ดำเนินการไม่สำเร็จ',
): FormErrorsResult {
  if (error instanceof ZodError) {
    const fields = zodFieldErrors(error);
    const keys = Object.keys(fields);
    if (keys.length === 1 && keys[0] === 'root') {
      return { root: fields.root };
    }
    return {
      root: keys.length > 0 ? 'กรุณาตรวจสอบข้อมูลในฟอร์ม' : fallback,
      fields,
    };
  }

  return { root: getErrorMessage(error, fallback) };
}
