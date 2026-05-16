/**
 * API Error Handler — Handle and format API errors
 */

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isValidationError(): boolean {
    return this.status === 422;
  }

  isConflict(): boolean {
    return this.status === 409;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}

export function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;

  const d = data as Record<string, unknown>;

  if (typeof d.message === 'string' && d.message) return d.message;
  if (typeof d.detail === 'string' && d.detail) return d.detail;
  if (typeof d.error === 'string' && d.error) return d.error;

  if (Array.isArray(d.errors) && d.errors.length > 0) {
    const first = d.errors[0];
    if (typeof first === 'string') return first;
    if (
      typeof first === 'object' &&
      first &&
      typeof (first as Record<string, unknown>).msg === 'string'
    ) {
      return (first as Record<string, string>).msg;
    }
  }

  return fallback;
}

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
}

export function getApiErrorStatus(error: unknown): number | null {
  if (error instanceof ApiError) {
    return error.status;
  }
  return null;
}
