import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth, useAuthStore } from '@/stores/useAuthStore';
import { ApiHttpError } from '@/services/api/httpClient';
import { masterApi } from '@/services/api/masterApi';
import { mediaApi } from '@/services/api/factoryApi';

export interface FormState {
  factory_name: string;
  factory_type_id: number;
  tax_id: string;
  province_id: number;
  category_ids: number[];
  sub_category_ids: number[];
  cert_id: number;
  cert_file: File | null;
  cert_number: string;
  cert_expire_date: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const initial: FormState = {
  factory_name: '',
  factory_type_id: 0,
  tax_id: '',
  province_id: 0,
  category_ids: [],
  sub_category_ids: [],
  cert_id: 0,
  cert_file: null,
  cert_number: '',
  cert_expire_date: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
};

export type FactoryTypeOption = { factory_type_id: number; name_th: string };
export type ProvinceOption = { id: number; name: string };
export type CategoryOption = { id: number; name: string; scope?: string };
export type SubCategoryOption = { id: number; name: string };
export type CertTypeOption = { id: number; label: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0[6-9]\d{8}$/;

// Handles both plain arrays and { data: [...] } / { categories: [...] } wrappers
function unwrap(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.categories)) return o.categories;
  }
  return [];
}

function mapFactoryTypes(raw: unknown): FactoryTypeOption[] {
  const out: FactoryTypeOption[] = [];
  for (const r of unwrap(raw)) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    const id = Number(o.factory_type_id ?? o.id);
    const name_th = String(o.name_th ?? o.type_name ?? o.name ?? '').trim();
    if (!Number.isFinite(id) || id <= 0 || !name_th) continue;
    out.push({ factory_type_id: id, name_th });
  }
  return out.sort((a, b) => a.name_th.localeCompare(b.name_th, 'th'));
}

function mapRow(
  raw: unknown,
  idKeys: string[],
  nameKeys: string[],
): { id: number; name: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = Number(idKeys.map((k) => o[k]).find((v) => v != null));
  const name = String(nameKeys.map((k) => o[k]).find((v) => v != null) ?? '').trim();
  if (!Number.isFinite(id) || id <= 0 || !name) return null;
  return { id, name };
}

export type FormErrors = Partial<Record<keyof FormState, string>>;

const FIELD_ORDER_FULL: (keyof FormState)[] = [
  'factory_name',
  'factory_type_id',
  'tax_id',
  'province_id',
  'category_ids',
  'cert_id',
  'cert_file',
  'cert_expire_date',
  'email',
  'phone',
  'password',
  'confirmPassword',
  'acceptTerms',
];

export function useRegisterFactory() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect already-authenticated FT users away from registration page
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/factory', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [factoryTypes, setFactoryTypes] = useState<FactoryTypeOption[]>([]);
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [lbiCategories, setLbiCategories] = useState<CategoryOption[]>([]);
  const [lbiSubCategories, setLbiSubCategories] = useState<Record<number, SubCategoryOption[]>>({});
  const [certTypes, setCertTypes] = useState<CertTypeOption[]>([]);
  const [masterLoading, setMasterLoading] = useState(true);
  const [masterFailed, setMasterFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const fieldRefs = useRef<Partial<Record<keyof FormState, HTMLElement | null>>>({});

  const setFieldRef = useCallback(
    (key: keyof FormState) => (el: HTMLElement | null) => {
      fieldRefs.current[key] = el;
    },
    [],
  );

  const fetchMaster = useCallback(() => {
    setMasterLoading(true);
    setMasterFailed(false);

    Promise.all([
      masterApi.factoryTypes(),
      masterApi.provinces(),
      masterApi.lbiCategories('ALL'),
      masterApi.certificates(),
    ])
      .then(([types, provs, cats, certs]) => {
        setFactoryTypes(mapFactoryTypes(types));

        setProvinces(
          unwrap(provs)
            .map((r) => mapRow(r, ['province_id', 'row_id', 'id'], ['name_th', 'name']))
            .filter((x): x is ProvinceOption => x != null),
        );

        setLbiCategories(
          unwrap(cats)
            .map((r): CategoryOption | null => {
              const base = mapRow(r, ['category_id', 'id'], ['name_th', 'name']);
              if (!base) return null;
              const o = r as Record<string, unknown>;
              return { ...base, scope: String(o.scope ?? 'PD') };
            })
            .filter((x): x is CategoryOption => x != null),
        );

        setCertTypes(
          unwrap(certs)
            .map((r): CertTypeOption | null => {
              if (!r || typeof r !== 'object') return null;
              const o = r as Record<string, unknown>;
              const id = Number(o.cert_id ?? o.id);
              const label = String(o.name_th ?? o.cert_name ?? o.name ?? '').trim();
              if (!Number.isFinite(id) || id <= 0 || !label) return null;
              return { id, label };
            })
            .filter((x): x is CertTypeOption => x != null),
        );

        // Sub-categories: 1 non-blocking call, FE groups by category_id
        masterApi
          .lbiSubCategories('ALL')
          .then((subs) => {
            const subArr = (Array.isArray(subs) ? subs : []) as unknown[];
            const subMap: Record<number, SubCategoryOption[]> = {};
            for (const r of subArr) {
              const row = mapRow(r, ['sub_category_id', 'id'], ['name_th', 'name']);
              if (!row) continue;
              const catId = Number((r as Record<string, unknown>).category_id ?? 0);
              if (!catId) continue;
              (subMap[catId] ??= []).push(row);
            }
            setLbiSubCategories(subMap);
          })
          .catch(() => {
            /* sub-categories optional — don't block form */
          });
      })
      .catch(() => setMasterFailed(true))
      .finally(() => setMasterLoading(false));
  }, []);

  useEffect(() => {
    fetchMaster();
  }, [fetchMaster]);

  const setField = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setApiError(null);
  }, []);

  const validateField = useCallback(
    (k: keyof FormState, values: FormState = form): string | undefined => {
      const authOnly = ['email', 'phone', 'password', 'confirmPassword'] as (keyof FormState)[];
      if (isAuthenticated && authOnly.includes(k)) return undefined;

      switch (k) {
        case 'factory_name': {
          const t = values.factory_name.trim();
          if (t.length < 3) return 'กรุณากรอกชื่อโรงงาน (อย่างน้อย 3 ตัวอักษร)';
          if (t.length > 150) return 'ชื่อโรงงานยาวเกิน 150 ตัวอักษร';
          return undefined;
        }
        case 'factory_type_id':
          return !values.factory_type_id ? 'กรุณาเลือกประเภทโรงงาน' : undefined;
        case 'tax_id': {
          const id = values.tax_id.replace(/\D/g, '');
          return !/^\d{13}$/.test(id) ? 'เลขภาษีต้องเป็นตัวเลข 13 หลัก' : undefined;
        }
        case 'province_id':
          return !values.province_id ? 'กรุณาเลือกจังหวัดที่ตั้งโรงงาน' : undefined;
        case 'category_ids':
          return values.category_ids.length === 0
            ? 'กรุณาเลือกหมวดหมู่ที่รับผลิตอย่างน้อย 1 หมวด'
            : undefined;
        case 'cert_id':
          return !values.cert_id ? 'กรุณาเลือกประเภทใบรับรอง' : undefined;
        case 'cert_file':
          return !values.cert_file ? 'กรุณาอัปโหลดไฟล์เอกสาร' : undefined;
        case 'cert_expire_date':
          return !values.cert_expire_date ? 'กรุณาระบุวันหมดอายุ' : undefined;
        case 'email': {
          const e = values.email.trim();
          if (!e) return 'กรุณากรอกอีเมล';
          return !EMAIL_RE.test(e) ? 'รูปแบบอีเมลไม่ถูกต้อง' : undefined;
        }
        case 'phone': {
          const p = values.phone.replace(/\s/g, '');
          return !PHONE_RE.test(p) ? 'เบอร์โทรไม่ถูกต้อง (10 หลัก เริ่ม 06–09)' : undefined;
        }
        case 'password': {
          if (values.password.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัว';
          return !/\d/.test(values.password) || !/[a-zA-Z]/.test(values.password)
            ? 'รหัสผ่านต้องมีทั้งตัวเลขและตัวอักษร'
            : undefined;
        }
        case 'confirmPassword':
          return values.password !== values.confirmPassword ? 'รหัสผ่านไม่ตรงกัน' : undefined;
        case 'acceptTerms':
          return !values.acceptTerms ? 'กรุณายอมรับข้อตกลงก่อนสมัคร' : undefined;
        default:
          return undefined;
      }
    },
    [form, isAuthenticated],
  );

  const activeFieldOrder = FIELD_ORDER_FULL;

  const scrollToFirstError = useCallback(
    (err: FormErrors) => {
      for (const k of activeFieldOrder) {
        if (err[k]) {
          fieldRefs.current[k]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    },
    [activeFieldOrder],
  );

  const blurField = useCallback(
    (k: keyof FormState) => {
      const msg = validateField(k, form);
      setErrors((prev) => ({ ...prev, [k]: msg }));
    },
    [form, validateField],
  );

  const submit = async () => {
    setApiError(null);
    const e: FormErrors = {};
    for (const k of activeFieldOrder) {
      const msg = validateField(k, form);
      if (msg) e[k] = msg;
    }
    if (Object.keys(e).length > 0) {
      setErrors(e);
      scrollToFirstError(e);
      return;
    }

    setSubmitting(true);
    try {
      const taxDigits = form.tax_id.replace(/\D/g, '');

      // Upload cert file first (same for both paths)
      const { url: certUrl } = await mediaApi.upload(form.cert_file!);

      // Guest registration: factory + cert created atomically in one TX
      await register({
        role: 'FT',
        email: form.email.trim(),
        phone: form.phone.replace(/\s/g, ''),
        password: form.password,
        factory_name: form.factory_name.trim(),
        factory_type_id: form.factory_type_id,
        tax_id: taxDigits,
        province_id: form.province_id || undefined,
        category_ids: form.category_ids,
        sub_category_ids: form.sub_category_ids,
        cert_id: form.cert_id,
        document_url: certUrl,
        cert_number: form.cert_number.trim() || undefined,
        cert_expire_date: form.cert_expire_date || undefined,
      } as Parameters<typeof register>[0]);

      navigate('/factory', { replace: true });
    } catch (err) {
      if (err instanceof ApiHttpError) {
        if (err.status === 409) {
          setApiError(
            'เลขภาษีนี้ถูกใช้แล้ว หรืออีเมลนี้มีบัญชีอยู่แล้ว หรือโปรไฟล์โรงงานนี้มีอยู่แล้ว',
          );
        } else if (err.status === 422) {
          setErrors((prev) => ({ ...prev, password: 'รหัสผ่านไม่ตรงตามเงื่อนไขของระบบ' }));
          scrollToFirstError({ password: 'x' });
        } else {
          setApiError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        }
      } else {
        setApiError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    errors,
    factoryTypes,
    provinces,
    lbiCategories,
    lbiSubCategories,
    certTypes,
    masterLoading,
    masterFailed,
    retryMaster: fetchMaster,
    submitting,
    apiError,
    setField,
    submit,
    blurField,
    setFieldRef,
  };
}
