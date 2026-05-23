export function mapOrderStatusFromApi(code: string): string {
  const u = String(code ?? '').toUpperCase();
  if (u === 'PP') return 'pending_payment';
  if (u === 'PR' || u === 'QC' || u === 'WF') return 'in_production';
  if (u === 'SH') return 'shipped';
  if (u === 'CP') return 'completed';
  if (u === 'CC' || u === 'CN' || u === 'CL' || u === 'PE' || u === 'EX')
    return 'cancelled_expired';
  return u.toLowerCase() || 'pending';
}

export function guessOrderProgress(status: string): number {
  switch (status) {
    case 'pending_payment':
      return 10;
    case 'in_production':
      return 35;
    case 'shipped':
      return 85;
    case 'completed':
      return 100;
    default:
      return 0;
  }
}

// คำนวณความคืบหน้าจาก production step (0–5)
// step 0 = 0%, step 5 = 100%
// `current_step_id` จาก BE = ขั้นที่กำลัง active
// (เช่น step 4 = CD แล้ว step 5 = IP รอยืนยันลูกค้า → ส่ง 4 ไม่ใช่ 5)
export function guessOrderProgressFromStep(
  currentStepId: number | null | undefined,
  statusFallback?: string,
): number {
  if (Number.isFinite(currentStepId)) {
    const step = Math.max(0, Math.min(5, Number(currentStepId)));
    return Math.round((step / 5) * 100);
  }
  return guessOrderProgress(String(statusFallback ?? ''));
}

type ProductionStepLike = { step_id: number; status: string };

// สอดคล้องกับ BE `current_step_id`: ขั้นที่กำลัง active (0–5)
// — step 5 = รอยืนยันลูกค้า: ไม่นับเป็น active → ใช้ CD สูงสุด (เช่น 4 เมื่อ step 4 CD + step 5 IP)
// — ขั้นอื่น IP อยู่ระหว่างทำ → ใช้ IP สูงสุดถ้ามากกว่า CD สูงสุด
export function deriveCurrentStepIdFromProductionUpdates(
  updates: ProductionStepLike[] | undefined,
): number | undefined {
  if (!updates?.length) return undefined;

  const inRange = (id: number) => Number.isFinite(id) && id >= 0 && id <= 5;

  const cdIds = updates
    .filter((u) => String(u.status).toUpperCase() === 'CD')
    .map((u) => u.step_id)
    .filter(inRange);
  const ipIds = updates
    .filter((u) => String(u.status).toUpperCase() === 'IP')
    .map((u) => u.step_id)
    .filter(inRange);

  const highestCd = cdIds.length ? Math.max(...cdIds) : undefined;
  const highestIp = ipIds.length ? Math.max(...ipIds) : undefined;

  if (highestCd != null) {
    if (highestIp === 5) return highestCd;
    if (highestIp != null && highestIp > highestCd) return highestIp;
    return highestCd;
  }
  return highestIp;
}

export function parseCurrentStepId(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 5) return undefined;
  return n;
}
