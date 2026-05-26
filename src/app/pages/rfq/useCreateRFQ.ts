import { useMutation } from '@tanstack/react-query';
import { rfqsApi } from '@/services/api/rfqApi';
import {
  type IRfqCreateRequest,
  type IRfqWizardCreateInput,
} from '@/services/api/types/rfq.types';

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

        request_kind: kind,
        source_showcase_id:
          payload.source_showcase_id != null && Number.isFinite(Number(payload.source_showcase_id))
            ? Number(payload.source_showcase_id)
            : undefined,
      };
      if (payload.sub_category_id != null && Number.isFinite(Number(payload.sub_category_id))) {
        body.sub_category_id = Number(payload.sub_category_id);
      }

      const targeting = payload.targeting ?? 'all';
      body.targeting = targeting;
      if (targeting === 'specific' && Array.isArray(payload.factory_ids)) {
        const ids = payload.factory_ids
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0);
        if (ids.length > 0) body.factory_ids = ids;
      }

      return rfqsApi.create(body as IRfqCreateRequest);
    },
  });
}
