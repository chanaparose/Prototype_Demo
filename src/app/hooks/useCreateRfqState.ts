/**
 * useCreateRfqState — Manages entire RFQ creation flow
 *
 * Loads:
 *   - categories (from DataContext)
 *   - sub-categories (GET /categories/:id/sub-categories)
 *   - units (GET /master/units)
 *   - shipping methods (GET /master/shipping-methods)
 *   - addresses (GET /addresses)
 *
 * Submits: POST /rfqs/ → then POST /rfqs/:id/images for each image
 */
import React from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../contexts/DataContext';
import {
  INITIAL_FORM,
  STEPS,
  FALLBACK_UNITS,
  FALLBACK_SHIPPING_METHODS,
  type CreateRfqForm,
  type SubCategory,
  type Unit,
  type ShippingMethod,
  type Address,
} from '../components/features/create-rfq';
import { type AddressFormPayload } from '../components/factory/AddressFormModal';
import { rfqsApi, masterApi, addressesApi, categoriesApi } from '../services/api';

export function useCreateRfqState() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [form, setForm] = React.useState<CreateRfqForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const data = useData();
  const categories = data.categories;

  /* ── Load units from API (lbi_units) ── */
  const [units, setUnits] = React.useState<Unit[]>(FALLBACK_UNITS);
  React.useEffect(() => {
    masterApi.units()
      .then((raw) => {
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        const mapped = arr.map((r) => ({
          id: String(r.unit_id ?? r.id ?? ''),
          name: String(r.unit_name_th ?? r.name ?? ''),
        })).filter((u) => u.id && u.name);
        if (mapped.length > 0) setUnits(mapped);
      })
      .catch(() => {});
  }, []);

  /* ── Load shipping methods from API (lbi_shipping_methods) ── */
  const [shippingMethods, setShippingMethods] = React.useState<ShippingMethod[]>(FALLBACK_SHIPPING_METHODS);
  React.useEffect(() => {
    masterApi.shippingMethods()
      .then((raw) => {
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        const mapped = arr.map((r) => ({
          id: String(r.shipping_method_id ?? r.id ?? ''),
          name: String(r.method_name ?? r.name ?? ''),
        })).filter((s) => s.id && s.name);
        if (mapped.length > 0) setShippingMethods(mapped);
      })
      .catch(() => {});
  }, []);

  /* ── Load sub-categories when category changes ── */
  const [subCategories, setSubCategories] = React.useState<SubCategory[]>([]);
  const [subCategoriesLoading, setSubCategoriesLoading] = React.useState(false);
  const [subCategoriesError, setSubCategoriesError] = React.useState<string | null>(null);

  const reloadSubCategories = React.useCallback(async () => {
    if (!form.categoryId) {
      setSubCategories([]);
      setSubCategoriesError(null);
      return;
    }
    setSubCategoriesLoading(true);
    setSubCategoriesError(null);
    try {
      const raw = await categoriesApi.subCategories(form.categoryId);
      const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
      const mapped: SubCategory[] = arr
        .map((r) => ({
          id: String(r.sub_category_id ?? r.id ?? ''),
          name: String(r.name ?? ''),
          sortOrder: Number(r.sort_order ?? 0),
        }))
        .filter((s) => s.id && s.name);
      mapped.sort((a, b) => a.sortOrder - b.sortOrder);
      setSubCategories(mapped);
    } catch (e) {
      setSubCategories([]);
      setSubCategoriesError(
        e instanceof Error ? e.message : 'โหลดประเภทย่อยไม่สำเร็จ',
      );
    } finally {
      setSubCategoriesLoading(false);
    }
  }, [form.categoryId]);

  React.useEffect(() => {
    void reloadSubCategories();
  }, [reloadSubCategories]);

  /* ── Load addresses from API ── */
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = React.useState(true);
  const [addressModalOpen, setAddressModalOpen] = React.useState(false);
  const [addressModalSaving, setAddressModalSaving] = React.useState(false);

  const loadAddresses = React.useCallback(async (): Promise<Address[]> => {
    setAddressesLoading(true);
    try {
      const raw = await addressesApi.list();
      const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
      const mapped: Address[] = arr
        .map((r) => ({
          id: String(r.address_id ?? r.id ?? ''),
          addressDetail: String(r.address_detail ?? ''),
          subDistrict: String(r.sub_district_name ?? r.sub_district ?? ''),
          district: String(r.district_name ?? r.district ?? ''),
          province: String(r.province_name ?? r.province ?? ''),
          zipCode: String(r.zip_code ?? ''),
          isDefault: Boolean(r.is_default ?? false),
        }))
        .filter((a) => a.id);
      setAddresses(mapped);

      // Auto-select default address
      if (!form.addressId) {
        const def = mapped.find((a) => a.isDefault) ?? mapped[0];
        if (def) setForm((prev) => ({ ...prev, addressId: def.id }));
      }
      return mapped;
    } catch {
      setAddresses([]);
      return [];
    } finally {
      setAddressesLoading(false);
    }
  }, [form.addressId]);

  React.useEffect(() => { loadAddresses(); }, []);

  const openAddressModal = React.useCallback(() => {
    setAddressModalOpen(true);
  }, []);

  const closeAddressModal = React.useCallback(() => {
    if (addressModalSaving) return;
    setAddressModalOpen(false);
  }, [addressModalSaving]);

  const submitAddress = React.useCallback(
    async (payload: AddressFormPayload) => {
      setAddressModalSaving(true);
      try {
        const created = (await addressesApi.create(payload)) as Record<string, unknown>;
        const createdId = String(created.address_id ?? created.id ?? '').trim();
        const latest = await loadAddresses();
        const nextId = createdId || latest.find((a) => a.isDefault)?.id || latest[latest.length - 1]?.id || '';
        if (nextId) {
          setForm((prev) => ({ ...prev, addressId: nextId }));
        }
        setAddressModalOpen(false);
      } finally {
        setAddressModalSaving(false);
      }
    },
    [loadAddresses],
  );

  /* ── Derived ── */
  const displayCategoryName =
    categories.find((c) => c.id === form.categoryId)?.name ?? '-';
  const displaySubCategoryName =
    subCategories.find((s) => s.id === form.subCategoryId)?.name ?? '-';

  /* ── Form update ── */
  const updateForm = <K extends keyof CreateRfqForm>(key: K, value: CreateRfqForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
  };

  /* ── Validation per step ── */
  const canProceed = React.useMemo(() => {
    if (currentStep === 1) {
      if (!form.categoryId || !form.title.trim()) return false;
      if (subCategoriesLoading) return false;
      if (subCategoriesError) return false;
      const needsSub = subCategories.length > 0;
      const hasSubIfNeeded = needsSub ? Boolean(form.subCategoryId) : true;
      return hasSubIfNeeded;
    }
    if (currentStep === 2) {
      return Boolean(form.quantity && Number(form.quantity) > 0 && form.unitId && form.budgetPerPiece);
    }
    if (currentStep === 3) {
      return Boolean(form.addressId && form.shippingMethodId);
    }
    return false;
  }, [currentStep, form, subCategories.length, subCategoriesLoading, subCategoriesError]);

  /* ── Submit to API ── */
  const submitRfq = React.useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // 1) Create RFQ
      const payload: Record<string, unknown> = {
        category_id: Number(form.categoryId),
        title: form.title.trim(),
        quantity: Number(form.quantity),
        unit_id: Number(form.unitId),
        budget_per_piece: Number(form.budgetPerPiece) || 0,
        details: form.details.trim() || null,
        address_id: Number(form.addressId),
      };
      // Phase 1 new fields — ส่งถ้ามี (backend ต้องรองรับ)
      if (form.subCategoryId) {
        payload.sub_category_id = Number(form.subCategoryId);
      }
      if (form.shippingMethodId) {
        payload.shipping_method_id = Number(form.shippingMethodId);
      }

      const imageUrls = [...new Set(form.imageUrls.map((u) => u.trim()).filter(Boolean))].slice(0, 5);
      if (imageUrls.length > 0) {
        (payload as Record<string, unknown>).image_urls = imageUrls;
      }

      await rfqsApi.create(payload);

      // Navigate to success / orders page (รูปส่งใน POST เดียว — FACTORY_UI_SPEC §1.2)
      navigate('/orders');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด ลองอีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  }, [form, navigate]);

  /* ── Navigation ── */
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      submitRfq();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
    else navigate(-1);
  };

  return {
    // steps
    STEPS,
    currentStep,
    setCurrentStep,

    // form
    form,
    updateForm,
    displayCategoryName,
    displaySubCategoryName,
    canProceed,

    // data
    categories,
    subCategories,
    subCategoriesLoading,
    subCategoriesError,
    reloadSubCategories,
    units,
    shippingMethods,
    addresses,
    addressesLoading,
    loadAddresses,
    addressModalOpen,
    addressModalSaving,
    openAddressModal,
    closeAddressModal,
    submitAddress,

    // submit
    submitting,
    submitError,

    // navigation
    handleNext,
    handleBack,
  };
}
