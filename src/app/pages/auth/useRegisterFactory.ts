import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/stores';
import { ApiHttpError, masterApi, factoriesApi } from '@/services/api';

export interface FormState {
  factory_name: string;
  factory_type_id: number;
  tax_id: string;
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
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
};

export type FactoryTypeOption = { factory_type_id: number; name_th: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0[6-9]\d{8}$/;

/** Thai corporate tax ID: 13 digits + checksum (weights 13..2 on first 12 digits). */
function isValidThaiTaxIdDigits(taxId: string): boolean {
  if (!/^\d{13}$/.test(taxId)) return false;
  const d = taxId.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += d[i] * (13 - i);
  const check = (11 - (sum % 11)) % 10;
  return check === d[12];
}

function mapFactoryTypes(raw: unknown): FactoryTypeOption[] {
  if (!Array.isArray(raw)) return [];
  const out: FactoryTypeOption[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    const id = Number(o.factory_type_id ?? o.id);
    const name_th = String(o.name_th ?? o.type_name ?? o.name ?? '').trim();
    if (!Number.isFinite(id) || id <= 0 || !name_th) continue;
    out.push({ factory_type_id: id, name_th });
  }
  return out.sort((a, b) => a.name_th.localeCompare(b.name_th, 'th'));
}

export type FormErrors = Partial<Record<keyof FormState, string>>;

const FIELD_ORDER_FULL: (keyof FormState)[] = [
  'factory_name',
  'factory_type_id',
  'tax_id',
  'email',
  'phone',
  'password',
  'confirmPassword',
  'acceptTerms',
];

const FIELD_ORDER_LOGGED_IN: (keyof FormState)[] = [
  'factory_name',
  'factory_type_id',
  'tax_id',
  'acceptTerms',
];

export function useRegisterFactory() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [factoryTypes, setFactoryTypes] = useState<FactoryTypeOption[]>([]);
  const [factoryTypesLoading, setFactoryTypesLoading] = useState(true);
  const [factoryTypesLoadFailed, setFactoryTypesLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const fieldRefs = useRef<Partial<Record<keyof FormState, HTMLElement | null>>>({});

  const setFieldRef = useCallback(
    (key: keyof FormState) => (el: HTMLElement | null) => {
      fieldRefs.current[key] = el;
    },
    [],
  );

  const fetchFactoryTypes = useCallback(() => {
    setFactoryTypesLoading(true);
    setFactoryTypesLoadFailed(false);
    masterApi
      .factoryTypes()
      .then((res) => {
        setFactoryTypes(mapFactoryTypes(res));
        setFactoryTypesLoadFailed(false);
      })
      .catch(() => {
        setFactoryTypes([]);
        setFactoryTypesLoadFailed(true);
      })
      .finally(() => setFactoryTypesLoading(false));
  }, []);

  useEffect(() => {
    fetchFactoryTypes();
  }, [fetchFactoryTypes]);

  const setField = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setApiError(null);
  }, []);

  const validateField = useCallback(
    (k: keyof FormState, values: FormState = form): string | undefined => {
      if (
        isAuthenticated &&
        (k === 'email' || k === 'phone' || k === 'password' || k === 'confirmPassword')
      ) {
        return undefined;
      }
      const t = values.factory_name.trim();
      switch (k) {
        case 'factory_name': {
          if (t.length < 3) return 'กรุณากรอกชื่อโรงงาน (อย่างน้อย 3 ตัวอักษร)';
          if (t.length > 150) return 'ชื่อโรงงานยาวเกิน 150 ตัวอักษร';
          return undefined;
        }
        case 'factory_type_id': {
          if (!values.factory_type_id) return 'กรุณาเลือกประเภทโรงงาน';
          return undefined;
        }
        case 'tax_id': {
          const id = values.tax_id.replace(/\D/g, '');
          if (!/^\d{13}$/.test(id)) return 'เลขภาษีต้องเป็นตัวเลข 13 หลัก';
          // ปิดการตรวจเลขควบคุมชั่วคราว — validate เฉพาะ 13 หลักก่อน
          // if (!isValidThaiTaxIdDigits(id)) return 'เลขประจำตัวผู้เสียภาษีไม่ถูกต้อง (ตรวจสอบเลขควบคุม)';
          return undefined;
        }
        case 'email': {
          const e = values.email.trim();
          if (!e) return 'กรุณากรอกอีเมล';
          if (!EMAIL_RE.test(e)) return 'รูปแบบอีเมลไม่ถูกต้อง';
          return undefined;
        }
        case 'phone': {
          const p = values.phone.replace(/\s/g, '');
          if (!PHONE_RE.test(p)) return 'เบอร์โทรไม่ถูกต้อง (10 หลัก เริ่ม 06–09)';
          return undefined;
        }
        case 'password': {
          if (values.password.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัว';
          if (!/\d/.test(values.password) || !/[a-zA-Z]/.test(values.password)) {
            return 'รหัสผ่านต้องมีทั้งตัวเลขและตัวอักษร';
          }
          return undefined;
        }
        case 'confirmPassword': {
          if (values.password !== values.confirmPassword) return 'รหัสผ่านไม่ตรงกัน';
          return undefined;
        }
        case 'acceptTerms': {
          if (!values.acceptTerms) return 'กรุณายอมรับข้อตกลงก่อนสมัคร';
          return undefined;
        }
        default:
          return undefined;
      }
    },
    [form, isAuthenticated],
  );

  const activeFieldOrder = isAuthenticated ? FIELD_ORDER_LOGGED_IN : FIELD_ORDER_FULL;

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
      if (isAuthenticated) {
        // Logged-in path: JWT carries user identity — just create the factory record
        await factoriesApi.create({
          factory_name: form.factory_name.trim(),
          factory_type_id: form.factory_type_id,
          tax_id: taxDigits,
        });
      } else {
        // Guest path: full registration creates user + factory together
        await register({
          role: 'FT',
          email: form.email.trim(),
          phone: form.phone.replace(/\s/g, ''),
          password: form.password,
          factory_name: form.factory_name.trim(),
          factory_type_id: form.factory_type_id,
          tax_id: taxDigits,
        });
      }
      navigate('/factory', { replace: true });
    } catch (err) {
      if (err instanceof ApiHttpError) {
        if (err.status === 409) {
          setApiError('เลขภาษีนี้ถูกใช้แล้ว');
        } else if (err.status === 422) {
          const pwErr = {
            password: 'รหัสผ่านไม่ปลอดภัยหรือไม่ตรงตามเงื่อนไขของระบบ',
          };
          setErrors((prev) => ({ ...prev, ...pwErr }));
          scrollToFirstError(pwErr);
        } else if (err.status === 400) {
          setApiError(err.message || 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
        } else {
          setApiError('เกิดข้อผิดพลาด กรุณาลองใหม่');
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
    factoryTypesLoading,
    factoryTypesLoadFailed,
    retryFactoryTypes: fetchFactoryTypes,
    submitting,
    apiError,
    isAuthenticated,
    authLoading,
    setField,
    submit,
    blurField,
    setFieldRef,
  };
}
