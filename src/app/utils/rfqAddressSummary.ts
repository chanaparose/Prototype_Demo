/** สรุปที่อยู่ปลายทางจาก RFQ / nested address (FACTORY_RFQ_BOARD_UX_SPEC) */
export function summarizeRfqAddress(rfq: Record<string, unknown>): string {
  const a = rfq.address;
  if (a && typeof a === 'object') {
    const o = a as Record<string, unknown>;
    const line = String(o.address_line ?? o.address_detail ?? o.detail ?? '').trim();
    const parts = [
      o.sub_district_name ?? o.subdistrict_name,
      o.district_name ?? o.amphoe_name,
      o.province_name ?? o.provinceName ?? o.province,
      o.zip_code ?? o.zipCode,
    ]
      .filter((x) => x != null && String(x).trim() !== '')
      .map((x) => String(x).trim());
    if (line && parts.length) return `${line} · ${parts.join(' / ')}`;
    if (parts.length) return parts.join(' / ');
    if (line) return line;
  }
  const flat = String(
    rfq.address_summary ??
      rfq.shipping_address_summary ??
      rfq.destination_summary ??
      '',
  ).trim();
  if (flat) return flat;
  const prov = String(
    rfq.province_name ?? rfq.provinceName ?? rfq.shipping_province ?? '',
  ).trim();
  const dist = String(rfq.district_name ?? rfq.districtName ?? '').trim();
  if (prov && dist) return `${prov} · ${dist}`;
  return prov || dist;
}
