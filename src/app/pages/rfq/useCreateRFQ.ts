import { useMutation } from '@tanstack/react-query';
import { rfqsApi, type RFQCreateInput } from '../../services/api';

export function useCreateRFQ() {
  return useMutation({
    mutationFn: async (payload: RFQCreateInput) => {
      const addressId = payload.address_id ?? payload.delivery_address_id;
      if (!addressId || !Number.isFinite(Number(addressId)) || Number(addressId) <= 0) {
        throw new Error('กรุณาระบุที่อยู่จัดส่ง');
      }
      const shippingMethodId = payload.shipping_method_id;
      if (!shippingMethodId || !Number.isFinite(Number(shippingMethodId)) || Number(shippingMethodId) <= 0) {
        throw new Error('กรุณาเลือกวิธีจัดส่ง');
      }
      // backend handoff: allowlist only fields in docs/RFQ_FE_HANDOFF.md
      const body: Record<string, unknown> = {
        title: payload.title,
        description: payload.description,
        details: payload.description,
        category_id: Number(payload.category_id),
        quantity: Number(payload.qty),
        unit: payload.unit || 'ชิ้น',
        target_unit_price:
          payload.target_unit_price != null && Number.isFinite(Number(payload.target_unit_price))
            ? Number(payload.target_unit_price)
            : undefined,
        material_grade: payload.material_grade?.trim() || undefined,
        reference_images: Array.isArray(payload.reference_images)
          ? payload.reference_images.filter((u) => typeof u === 'string' && u.trim().length > 0).slice(0, 5)
          : [],
        address_id: Number(addressId),
        delivery_address_id: Number(addressId),
        shipping_method_id: Number(shippingMethodId),
        target_lead_time_days:
          payload.target_lead_time_days != null &&
          Number.isFinite(Number(payload.target_lead_time_days)) &&
          Number(payload.target_lead_time_days) > 0
            ? Number(payload.target_lead_time_days)
            : undefined,
        required_delivery_date: payload.required_delivery_date || undefined,
        certifications_required: Array.isArray(payload.certifications_required)
          ? payload.certifications_required.map(String).filter(Boolean)
          : [],
        sample_required: payload.sample_required === true,
        sample_qty:
          payload.sample_required === true &&
          payload.sample_qty != null &&
          Number.isFinite(Number(payload.sample_qty)) &&
          Number(payload.sample_qty) > 0
            ? Number(payload.sample_qty)
            : undefined,
        inspection_type: payload.inspection_type || undefined,
      };
      if (payload.sub_category_id != null && Number.isFinite(Number(payload.sub_category_id))) {
        body.sub_category_id = Number(payload.sub_category_id);
      }

      return rfqsApi.create(body);
    },
  });
}
