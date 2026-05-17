import { useMutation } from '@tanstack/react-query';
import { rfqsApi } from '@/services/api/rfqApi';
import { type IRfqWizardCreateInput } from '@/services/api/types/rfq.types';

export function useCreateRFQ() {
  return useMutation({
    mutationFn: async (payload: IRfqWizardCreateInput) => {
      const kind = payload.request_kind ?? 'PR';
      const isSample = kind === 'PS' || kind === 'MS';
      const addressId = payload.address_id ?? payload.delivery_address_id;
      if (!addressId || !Number.isFinite(Number(addressId)) || Number(addressId) <= 0) {
        throw new Error('กรุณาระบุที่อยู่จัดส่ง');
      }
      const shippingMethodId = payload.shipping_method_id;
      if (
        !shippingMethodId ||
        !Number.isFinite(Number(shippingMethodId)) ||
        Number(shippingMethodId) <= 0
      ) {
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
        target_price:
          payload.target_price != null && Number.isFinite(Number(payload.target_price))
            ? Number(payload.target_price)
            : undefined,
        material_grade: payload.material_grade?.trim() || undefined,
        reference_images: Array.isArray(payload.reference_images)
          ? payload.reference_images
              .filter((u) => typeof u === 'string' && u.trim().length > 0)
              .slice(0, 5)
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
        certifications_required: isSample
          ? []
          : Array.isArray(payload.certifications_required)
            ? payload.certifications_required.map(String).filter(Boolean)
            : [],

        // → ใช้ tab "ขอซื้อตัวอย่าง" (request_kind=PS/MS) แทน
        // ส่ง sample_required: false เสมอ และไม่ส่ง sample_qty
        sample_required: false,
        sample_qty: undefined,
        inspection_type: isSample ? undefined : payload.inspection_type || undefined,
        request_kind: kind,
        source_showcase_id:
          payload.source_showcase_id != null && Number.isFinite(Number(payload.source_showcase_id))
            ? Number(payload.source_showcase_id)
            : undefined,
      };
      if (payload.sub_category_id != null && Number.isFinite(Number(payload.sub_category_id))) {
        body.sub_category_id = Number(payload.sub_category_id);
      }

      return rfqsApi.create(body);
    },
  });
}
