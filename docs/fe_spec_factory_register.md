# FE Spec — Factory Registration Flow (CTA "สมัครเลย" → Register Factory Page)

**โปรเจกต์:** Wemake Platform
**วันที่:** 7 เมษายน 2026
**ผู้วิเคราะห์:** System Analyst
**เวอร์ชัน:** 1.0
**อ้างอิง:**
- `docs/system_analysis_flow.md` §Step 2 "New user registers as factory user"
- `docs/factory_user_flow_analysis.md` §A Authentication & Onboarding
- `docs/API_SPEC.md` — `POST /auth/register`
- `src/app/services/api.ts` — `authApi.register()`
- `src/app/pages/explore/Explore.desktop.tsx` (บรรทัด 764-766)
- `src/app/pages/explore/Explore.mobile.tsx` (บรรทัด 330-332)

---

## 1. ภาพรวมงาน

ปัจจุบันปุ่ม **"สมัครเลย"** ในแบนเนอร์ "ลงทะเบียนข้อมูลธุรกิจกับ WeMake" หน้า Explore (ทั้ง desktop และ mobile) **เป็นปุ่ม static ไม่มี onClick handler** ต้องเพิ่ม:

1. สร้างหน้าใหม่ **`/register/factory`** — ฟอร์มสมัครโรงงาน
2. ต่อปุ่ม "สมัครเลย" ทั้งสองไฟล์ให้ `navigate('/register/factory')`
3. เรียก `POST /auth/register` ด้วย payload `role="FT"` + ข้อมูลโรงงาน
4. หลังสมัครสำเร็จ → เก็บ JWT → redirect ไป `/factory` (factory portal) หรือหน้า onboarding profile

---

## 2. Scope

### 2.1 ไฟล์ที่ต้องแก้ (existing)

| ไฟล์ | จุดที่แก้ | สิ่งที่ทำ |
|---|---|---|
| `src/app/pages/explore/Explore.desktop.tsx` | บรรทัด 764-766 | เพิ่ม `onClick={() => navigate('/register/factory')}` + import `useNavigate` |
| `src/app/pages/explore/Explore.mobile.tsx` | บรรทัด 330-332 | เหมือนกัน |
| `src/app/routes.ts` | เพิ่ม route | `{ path: 'register/factory', Component: RegisterFactoryPage }` |
| `src/app/services/api.ts` | ตรวจสอบ `authApi.register` | ถ้ายังไม่รองรับ field `factory_name/factory_type_id/tax_id` → ขยาย type (ไม่ต้องเพิ่ม endpoint ใหม่) |

### 2.2 ไฟล์ที่ต้องสร้างใหม่

| ไฟล์ | หน้าที่ |
|---|---|
| `src/app/pages/auth/RegisterFactoryPage.tsx` | Responsive page (desktop + mobile ในไฟล์เดียว ใช้ Tailwind) |
| `src/app/pages/auth/useRegisterFactory.ts` | Custom hook: state, validation, submit |
| `src/app/pages/auth/index.ts` | Barrel export |

---

## 3. API Contract

### 3.1 `POST /auth/register`

**Request body:**
```json
{
  "role": "FT",
  "email": "owner@factory.com",
  "phone": "0812345678",
  "password": "********",
  "factory_name": "บริษัท เอบีซี จำกัด",
  "factory_type_id": 1,
  "tax_id": "0105558000000"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "user_id": 123,
    "role": "FT",
    "email": "owner@factory.com",
    "phone": "0812345678"
  },
  "factory": {
    "factory_id": 45,
    "factory_name": "บริษัท เอบีซี จำกัด",
    "factory_type_id": 1,
    "tax_id": "0105558000000",
    "is_verified": false
  }
}
```

**Error cases:**
| Status | สถานการณ์ | UI handling |
|---|---|---|
| 400 | field ขาด/format ผิด | แสดง inline error ใต้ field |
| 409 | email หรือ tax_id ซ้ำ | toast "อีเมลหรือเลขภาษีนี้ถูกใช้แล้ว" |
| 422 | password weak | inline error ใต้ password |
| 500 | server error | toast "เกิดข้อผิดพลาด กรุณาลองใหม่" |

### 3.2 Dropdown data: `factory_type_id`

ใช้ **`masterApi.factoryTypes()`** (มีอยู่แล้วใน `api.ts`) หรือ `GET /master/factory-types`
Response:
```json
[
  { "factory_type_id": 1, "name_th": "โรงงานอาหารสัตว์", "name_en": "Pet Food Factory" },
  { "factory_type_id": 2, "name_th": "โรงงานอาหารเสริมสัตว์", ... },
  ...
]
```
โหลดด้วย `useEffect` ตอน mount; ถ้า fail → แสดง empty + ข้อความ "ไม่สามารถโหลดประเภทโรงงาน"

---

## 4. UI Spec — RegisterFactoryPage

### 4.1 Layout

**Desktop (≥ md):** 2-column card กึ่งกลางหน้าจอ width 960px
- ซ้าย: hero image + tagline "เริ่มต้นรับออเดอร์ที่ WeMake ฟรี"
- ขวา: ฟอร์ม

**Mobile (< md):** single column, padding 16px, full width

### 4.2 Form Fields (ลำดับ + validation)

| # | Field | Type | Required | Validation | Label |
|---|---|---|---|---|---|
| 1 | `factory_name` | text | ✅ | 3-150 chars | ชื่อโรงงาน / บริษัท |
| 2 | `factory_type_id` | select | ✅ | ต้องเลือก (ไม่เป็น 0) | ประเภทโรงงาน |
| 3 | `tax_id` | text | ✅ | ตัวเลข 13 หลัก | เลขประจำตัวผู้เสียภาษี |
| 4 | `email` | email | ✅ | regex email | อีเมล |
| 5 | `phone` | tel | ✅ | `^0[6-9]\d{8}$` | เบอร์โทรศัพท์ |
| 6 | `password` | password | ✅ | ≥ 8 chars, มีตัวเลข + ตัวอักษร | รหัสผ่าน |
| 7 | `confirmPassword` | password | ✅ | ต้องตรงกับ password | ยืนยันรหัสผ่าน |
| 8 | `acceptTerms` | checkbox | ✅ | ต้องติ๊ก | ยอมรับข้อตกลงและเงื่อนไขการใช้บริการ |

### 4.3 Validation Strategy

- **On blur**: validate field นั้น ๆ, แสดง error ใต้ input สีแดง
- **On submit**: validate ทั้งฟอร์ม, scroll ไป field แรกที่ error
- **tax_id checksum** (optional enhancement): verify ตามสูตรเลข 13 หลักของสรรพากร

### 4.4 Submit Flow (State machine)

```
idle → submitting → success → redirect('/factory')
                 ↘ error → idle (คง field value)
```

- ปุ่ม submit: แสดง spinner + disable ตอน `submitting`
- Success: save `token` ใน auth context (ผ่าน `authApi` flow ที่มีอยู่) → `navigate('/factory', { replace: true })`
- Error: toast ตามตาราง §3.1

### 4.5 สิ่งที่อยู่นอก page นี้ (ไม่ต้องทำตอนนี้)

- ❌ Email verification (ยังไม่มี BE endpoint)
- ❌ Phone OTP (ยังไม่มี BE endpoint)
- ❌ เลือก categories/sub_categories (ทำในหน้า Profile หลัง login)
- ❌ Upload เอกสารจดทะเบียน (Phase 2)
- ❌ Admin verification badge (แสดงเฉพาะ "รออนุมัติ" ใน dashboard)

---

## 5. Code Patches

### 5.1 `Explore.desktop.tsx` (รอบปุ่ม "สมัครเลย")

```tsx
// เพิ่ม import
import { useNavigate } from 'react-router';

// ใน component
const navigate = useNavigate();

// แก้ปุ่ม (บรรทัด 764-766)
<button
  onClick={() => navigate('/register/factory')}
  className="w-full sm:w-auto bg-[#A238FF] hover:bg-[#8B2BE2] text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-md text-sm md:text-base whitespace-nowrap"
>
  สมัครเลย
</button>
```

### 5.2 `Explore.mobile.tsx` (รอบปุ่ม "สมัครเลย")

```tsx
import { useNavigate } from 'react-router';
const navigate = useNavigate();

<button
  onClick={() => navigate('/register/factory')}
  className="w-full py-2.5 rounded-lg font-bold transition-colors shadow-md text-sm text-white"
  style={{ background: '#A238FF' }}
>
  สมัครเลย
</button>
```

### 5.3 `routes.ts`

```ts
import { RegisterFactoryPage } from './pages/auth';

// ใน children
{ path: 'register/factory', Component: RegisterFactoryPage },
```

### 5.4 `api.ts` — ขยาย type ของ `authApi.register`

```ts
export interface RegisterFactoryPayload {
  role: 'FT';
  email: string;
  phone: string;
  password: string;
  factory_name: string;
  factory_type_id: number;
  tax_id: string;
}

export interface RegisterCustomerPayload {
  role: 'CT';
  email: string;
  phone: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export type RegisterPayload = RegisterFactoryPayload | RegisterCustomerPayload;

export const authApi = {
  // ...
  register: (body: RegisterPayload) =>
    api.post<{ token: string; user: unknown; factory?: unknown }>('/auth/register', body),
};
```

### 5.5 `useRegisterFactory.ts` (skeleton)

```ts
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { authApi, masterApi } from '@/app/services/api';

interface FormState {
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
  factory_name: '', factory_type_id: 0, tax_id: '',
  email: '', phone: '', password: '', confirmPassword: '', acceptTerms: false,
};

export function useRegisterFactory() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [factoryTypes, setFactoryTypes] = useState<Array<{ factory_type_id: number; name_th: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    masterApi.factoryTypes()
      .then((res) => setFactoryTypes(res as any))
      .catch(() => setFactoryTypes([]));
  }, []);

  const setField = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }, []);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (form.factory_name.trim().length < 3) e.factory_name = 'กรุณากรอกชื่อโรงงาน (อย่างน้อย 3 ตัวอักษร)';
    if (!form.factory_type_id) e.factory_type_id = 'กรุณาเลือกประเภทโรงงาน';
    if (!/^\d{13}$/.test(form.tax_id)) e.tax_id = 'เลขภาษีต้องเป็นตัวเลข 13 หลัก';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (!/^0[6-9]\d{8}$/.test(form.phone)) e.phone = 'เบอร์โทรไม่ถูกต้อง (10 หลัก เริ่ม 06-09)';
    if (form.password.length < 8 || !/\d/.test(form.password) || !/[a-zA-Z]/.test(form.password))
      e.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัว มีทั้งตัวเลขและตัวอักษร';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    if (!form.acceptTerms) e.acceptTerms = 'กรุณายอมรับข้อตกลงก่อนสมัคร';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setApiError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await authApi.register({
        role: 'FT',
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        factory_name: form.factory_name.trim(),
        factory_type_id: form.factory_type_id,
        tax_id: form.tax_id.trim(),
      });
      // TODO: save token via auth context ที่มีอยู่
      localStorage.setItem('token', (res as any).token);
      navigate('/factory', { replace: true });
    } catch (err: any) {
      const status = err?.status ?? 0;
      if (status === 409) setApiError('อีเมลหรือเลขภาษีนี้ถูกใช้แล้ว');
      else if (status === 422) setErrors({ password: 'รหัสผ่านไม่ปลอดภัย' });
      else setApiError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  return { form, errors, factoryTypes, submitting, apiError, setField, submit };
}
```

### 5.6 `RegisterFactoryPage.tsx` (structure)

```tsx
import { useRegisterFactory } from './useRegisterFactory';

export default function RegisterFactoryPage() {
  const { form, errors, factoryTypes, submitting, apiError, setField, submit } = useRegisterFactory();
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F5FF] to-white py-8 px-4">
      <div className="max-w-[960px] mx-auto bg-white rounded-2xl shadow-lg overflow-hidden md:flex">
        {/* Hero (desktop only) */}
        <div className="hidden md:block md:w-1/2 bg-[#2D1B4E] text-white p-10">
          <h1 className="text-3xl font-bold mb-3">เริ่มต้นรับออเดอร์ที่ WeMake ฟรี</h1>
          <p className="opacity-90">สมัครภายใน 2 นาที เข้าถึง RFQ จากลูกค้าทั่วประเทศทันที</p>
        </div>
        {/* Form */}
        <form
          className="flex-1 p-6 md:p-10 space-y-4"
          onSubmit={(e) => { e.preventDefault(); submit(); }}
        >
          <h2 className="text-2xl font-bold text-[#2D1B4E] mb-2">สมัครบัญชีโรงงาน</h2>
          {apiError && <div className="bg-red-50 text-red-700 text-sm p-3 rounded">{apiError}</div>}

          {/* factory_name */}
          <Field label="ชื่อโรงงาน / บริษัท" error={errors.factory_name}>
            <input type="text" value={form.factory_name} onChange={(e) => setField('factory_name', e.target.value)} className="input" />
          </Field>

          {/* factory_type_id */}
          <Field label="ประเภทโรงงาน" error={errors.factory_type_id}>
            <select value={form.factory_type_id} onChange={(e) => setField('factory_type_id', Number(e.target.value))} className="input">
              <option value={0}>-- เลือก --</option>
              {factoryTypes.map((t) => (
                <option key={t.factory_type_id} value={t.factory_type_id}>{t.name_th}</option>
              ))}
            </select>
          </Field>

          {/* tax_id, email, phone, password, confirmPassword, acceptTerms ... */}
          {/* (ตามตาราง §4.2) */}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#A238FF] hover:bg-[#8B2BE2] disabled:opacity-50 text-white py-3 rounded-lg font-bold"
          >
            {submitting ? 'กำลังสมัคร...' : 'สมัครสมาชิกโรงงาน'}
          </button>

          <p className="text-sm text-center text-gray-600">
            มีบัญชีอยู่แล้ว? <a href="/login" className="text-[#A238FF] font-bold">เข้าสู่ระบบ</a>
          </p>
        </form>
      </div>
    </div>
  );
}

// helper Field component แยกไฟล์หรือ inline ก็ได้
```

---

## 6. Acceptance Criteria

- [ ] กดปุ่ม "สมัครเลย" ใน Explore (desktop) → ไปหน้า `/register/factory`
- [ ] กดปุ่ม "สมัครเลย" ใน Explore (mobile) → ไปหน้า `/register/factory`
- [ ] Dropdown ประเภทโรงงานโหลดจาก `masterApi.factoryTypes()` ได้
- [ ] Validation ทำงานครบทุก field ตาม §4.2
- [ ] Submit สำเร็จ → มี token ใน localStorage + redirect ไป `/factory`
- [ ] Error 409 → toast/inline แสดง "อีเมลหรือเลขภาษีนี้ถูกใช้แล้ว"
- [ ] Responsive: desktop 2-column, mobile 1-column
- [ ] ไม่มี console error / TypeScript error
- [ ] Tax ID ต้องเป็นตัวเลข 13 หลัก
- [ ] Password confirm ต้องตรงกัน
- [ ] ต้องติ๊ก accept terms ถึงจะ submit ได้

---

## 7. PR Checklist

- [ ] เพิ่ม `RegisterFactoryPage.tsx` + `useRegisterFactory.ts` + `index.ts`
- [ ] Register route ใน `routes.ts`
- [ ] แก้ปุ่ม `Explore.desktop.tsx` บรรทัด 764-766
- [ ] แก้ปุ่ม `Explore.mobile.tsx` บรรทัด 330-332
- [ ] ขยาย type `authApi.register` ใน `api.ts`
- [ ] Test flow: Explore → คลิก → กรอกฟอร์ม → submit → เข้า factory portal
- [ ] Test validation errors (empty, invalid format, mismatched password)
- [ ] Test error 409 (email ซ้ำ)
- [ ] Test responsive (resize 375px / 768px / 1280px)

---

## 8. Out of Scope (Phase ถัดไป)

- Email verification / Phone OTP
- Upload หนังสือรับรองจดทะเบียนบริษัท
- เลือก categories/sub_categories ตอนสมัคร (ทำในหน้า Profile)
- Admin approve flow (`is_verified`)
- Social login (Google/Facebook)
- Customer register flow (`role="CT"`) — ถ้าจะทำ ใช้ hook/page เดียวกันแต่แยก variant
