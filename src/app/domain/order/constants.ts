const ORDER_API_STATUS_LABEL_TH: Record<string, string> = {
  WS: 'รอแนบสลีป',
  WA: 'รอยืนยันสลีป',
  PP: 'รอชำระเงิน',
  PE: 'หมดกำหนดชำระ',
  PD: 'ชำระเงินแล้ว รอเริ่มผลิต',
  PR: 'กำลังผลิต',
  QC: 'ตรวจสอบคุณภาพ',
  SH: 'จัดส่งแล้ว',
  CP: 'เสร็จสิ้น',
  CN: 'ยกเลิก',
  WF: 'รอดำเนินการ',
};

export function orderStatusLabelTh(apiStatus: string, statusLabelFromApi?: string): string {
  const fromApi = statusLabelFromApi?.trim();
  if (fromApi) return fromApi;
  const u = String(apiStatus ?? '').toUpperCase();
  return ORDER_API_STATUS_LABEL_TH[u] ?? 'คำสั่งซื้อ';
}
