import { pickScalarString } from '@/utils/pickScalarString';

// สรุปที่อยู่ปลายทางจาก RFQ / nested address (FACTORY_RFQ_BOARD_UX_SPEC)
export function summarizeRfqAddress(rfq: Record<string, unknown>): string {
  const a = rfq.address;
  if (a && typeof a === 'object') {
    const o = a as Record<string, unknown>;
    const line = pickScalarString(o.address_line, o.address_detail, o.detail);
    const parts = [
      pickScalarString(o.sub_district_name, o.subdistrict_name),
      pickScalarString(o.district_name, o.amphoe_name),
      pickScalarString(o.province_name, o.provinceName, o.province),
      pickScalarString(o.zip_code, o.zipCode),
    ].filter(Boolean);
    if (line && parts.length) return `${line} · ${parts.join(' / ')}`;
    if (parts.length) return parts.join(' / ');
    if (line) return line;
  }
  const flat = pickScalarString(
    rfq.address_summary,
    rfq.shipping_address_summary,
    rfq.destination_summary,
  );
  if (flat) return flat;
  const prov = pickScalarString(rfq.province_name, rfq.provinceName, rfq.shipping_province);
  const dist = pickScalarString(rfq.district_name, rfq.districtName);
  if (prov && dist) return `${prov} · ${dist}`;
  return prov || dist;
}
