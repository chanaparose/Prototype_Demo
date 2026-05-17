import { ApiHttpError } from '@/services/api';

export function productionErrorToThai(code: string, details?: Record<string, unknown>): string {
  switch (code) {
    case 'NOT_ORDER_FACTORY':
      return 'คุณไม่มีสิทธิ์แก้ไขคำสั่งซื้อนี้';
    case 'NOT_ORDER_CUSTOMER':
      return 'คุณไม่ใช่เจ้าของคำสั่งซื้อนี้';
    case 'ORDER_LOCKED':
      return 'ไม่สามารถอัปเดตได้ — รอการชำระเงินจากลูกค้า';
    case 'DEPOSIT_EXPIRED':
      return 'ครบกำหนดชำระแล้ว — กรุณาติดต่อโรงงาน';
    case 'DEPOSIT_ALREADY_PAID':
      return '';
    case 'NOT_ORDER_PARTICIPANT':
      return 'คุณไม่มีสิทธิ์ดูคำสั่งซื้อนี้';
    case 'ANOTHER_STEP_IN_PROGRESS':
      return 'มีขั้นตอนอื่นกำลังดำเนินการอยู่ กรุณาทำให้เสร็จก่อน';
    case 'INVALID_STATE_TRANSITION':
      return 'ไม่สามารถเปลี่ยนสถานะนี้ได้';
    case 'DOWNSTREAM_IN_FLIGHT':
      return 'ไม่สามารถปฏิเสธได้ เนื่องจากขั้นตอนถัดไปเริ่มไปแล้ว';
    case 'STEP_ORDER_VIOLATION':
      return 'กรุณาทำขั้นตอนก่อนหน้าให้เสร็จก่อน';
    case 'INSUFFICIENT_EVIDENCE': {
      const req = details?.required;
      return typeof req === 'number'
        ? `ต้องแนบภาพอย่างน้อย ${req} ภาพ`
        : 'ต้องแนบภาพหลักฐานให้ครบตามที่กำหนด';
    }
    case 'PAYMENT_CONFIRMATION_REQUIRED':
      return 'กรุณายืนยันการชำระเงินก่อนดำเนินการ';
    case 'INVALID_STEP':
      return 'ขั้นตอนไม่ถูกต้อง';
    case 'INVALID_IMAGE_URL':
      return 'ลิงก์ภาพไม่ถูกต้อง (ต้องเป็น https)';
    case 'DESCRIPTION_TOO_LONG':
      return 'หมายเหตุยาวเกิน 500 ตัวอักษร';
    case 'REASON_REQUIRED':
      return 'กรุณาระบุเหตุผล';
    default:
      return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
  }
}

export function getProductionErrorMeta(err: unknown): {
  code: string | null;
  details?: Record<string, unknown>;
} {
  if (!(err instanceof ApiHttpError) || err.body == null || typeof err.body !== 'object') {
    return { code: null };
  }
  const body = err.body as Record<string, unknown>;
  const errObj = body.error;
  if (errObj && typeof errObj === 'object') {
    const e = errObj as Record<string, unknown>;
    const code = typeof e.code === 'string' ? e.code : null;
    const details =
      e.details && typeof e.details === 'object'
        ? (e.details as Record<string, unknown>)
        : undefined;
    return { code, details };
  }
  return { code: null };
}

export function productionErrorMessage(err: unknown): string {
  const { code, details } = getProductionErrorMeta(err);
  if (code === 'DEPOSIT_ALREADY_PAID') return '';
  if (code) return productionErrorToThai(code, details);
  if (err instanceof Error) return err.message;
  return productionErrorToThai('');
}
