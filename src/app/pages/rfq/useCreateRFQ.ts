import { useMutation } from '@tanstack/react-query';
import { rfqsApi, type RFQCreateInput } from '../../services/api';

export function useCreateRFQ() {
  return useMutation({
    mutationFn: async (payload: RFQCreateInput) => {
      const unitId = Number(payload.unit_id ?? payload.unit);
      if (!Number.isFinite(unitId) || unitId <= 0) {
        throw new Error('unit_id ไม่ถูกต้อง กรุณาเลือกหน่วยจากรายการ');
      }
      const addressId = payload.address_id ?? payload.delivery_address_id;
      if (!addressId || !Number.isFinite(Number(addressId)) || Number(addressId) <= 0) {
        throw new Error('กรุณาระบุที่อยู่จัดส่ง');
      }
      const shippingMethodId = payload.shipping_method_id;
      if (!shippingMethodId || !Number.isFinite(Number(shippingMethodId)) || Number(shippingMethodId) <= 0) {
        throw new Error('กรุณาเลือกวิธีจัดส่ง');
      }
      // strip FE-only / hidden fields before sending to BE
      const {
        qty,
        unit,
        unit_id: _uid,
        delivery_address_id: _da,
        incoterms: _inc,      // domestic only — not sent
        payment_terms: _pt,   // 100% upfront enforced by platform — not sent
        ...rest
      } = payload;

      const body: Record<string, unknown> = {
        ...rest,
        quantity: qty,
        unit_id: unitId,
        address_id: Number(addressId),
        shipping_method_id: Number(shippingMethodId),
      };
      // include unit name for display (BE may store it)
      if (unit) body.unit = unit;

      return rfqsApi.create(body);
    },
  });
}
