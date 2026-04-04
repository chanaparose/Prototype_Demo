# Create RFQ (สร้างคำขอใบเสนอราคา) — สรุปฟังก์ชันและ Mock Data

> สรุปทุกฟังก์ชัน, mock data, types, และโครงสร้างไฟล์ของหน้า **Create RFQ**
> เพื่อใช้เป็น reference สำหรับการปรับ UI ใหม่ทั้งหมด

---

## สารบัญ

1. [โครงสร้างไฟล์ (File Structure)](#1-โครงสร้างไฟล์)
2. [Types & Constants](#2-types--constants)
3. [Hook: useCreateRfqState](#3-hook-usecreaterfqstate)
4. [Mock Data ที่เกี่ยวข้อง](#4-mock-data-ที่เกี่ยวข้อง)
5. [Shared Components](#5-shared-components)
6. [Step Components (Feature Components)](#6-step-components)
7. [UI Desktop — CreateRfq.desktop.tsx](#7-ui-desktop)
8. [UI Mobile — CreateRfq.mobile.tsx](#8-ui-mobile)
9. [สรุปข้อมูลที่ต้องเรียก (Data Dependencies)](#9-สรุปข้อมูลที่ต้องเรียก)
10. [แผนผังการไหลของข้อมูล (Data Flow)](#10-แผนผังการไหลของข้อมูล)

---

## 1. โครงสร้างไฟล์

```
src/
├── app/
│   ├── components/
│   │   ├── features/
│   │   │   └── create-rfq/
│   │   │       ├── index.ts                    # barrel export
│   │   │       ├── types.ts                    # CreateRfqForm type + INITIAL_FORM + STEPS
│   │   │       ├── CreateRfqStep1.tsx          # Step 1: รายละเอียดโปรเจกต์
│   │   │       ├── CreateRfqStep2.tsx          # Step 2: ความต้องการและงบประมาณ
│   │   │       └── CreateRfqStep3Summary.tsx   # Step 3: สรุปและส่งคำขอ
│   │   └── shared/
│   │       ├── index.ts
│   │       └── ImageWithFallback.tsx           # รูปภาพ + fallback เมื่อ load ไม่สำเร็จ
│   ├── data/
│   │   └── mockData.ts                         # categories, factories, rfqs, orders, etc.
│   ├── hooks/
│   │   ├── useCreateRfqState.ts                # state management + logic ทั้งหมด
│   │   └── useIsDesktop.ts                     # responsive breakpoint hook
│   └── pages/
│       └── create-rfq/
│           ├── index.tsx                       # entry point — เลือก Desktop/Mobile
│           ├── CreateRfq.desktop.tsx            # UI Desktop
│           └── CreateRfq.mobile.tsx             # UI Mobile
└── lib/
    └── utils.ts                                # cn() utility (clsx + tailwind-merge)
```

---

## 2. Types & Constants

### ไฟล์: `components/features/create-rfq/types.ts`

#### `CreateRfqForm` (Type)

| Field         | Type     | คำอธิบาย                         |
| ------------- | -------- | -------------------------------- |
| `categoryId`  | `string` | ID หมวดหมู่สินค้า (จาก categories) |
| `factoryType` | `string` | ประเภทโรงงาน (จาก factory tags)   |
| `projectName` | `string` | ชื่อโปรเจกต์/สินค้า                |
| `description` | `string` | รายละเอียดเพิ่มเติม                |
| `quantity`    | `string` | จำนวนที่ต้องการ                    |
| `budget`      | `string` | งบประมาณ (บาท)                   |
| `material`    | `string` | วัสดุ/สเปกที่ต้องการ               |
| `deadline`    | `string` | วันกำหนดส่ง (YYYY-MM-DD)        |

#### `INITIAL_FORM` (Constant)

ค่าเริ่มต้นของฟอร์ม — ทุก field เป็น `''` (string ว่าง)

```ts
export const INITIAL_FORM: CreateRfqForm = {
  categoryId: '',
  factoryType: '',
  projectName: '',
  description: '',
  quantity: '',
  budget: '',
  material: '',
  deadline: '',
};
```

#### `STEPS` (Constant)

```ts
export const STEPS = [
  'รายละเอียดโปรเจกต์',        // Step 1
  'ความต้องการและงบประมาณ',    // Step 2
  'สรุปและส่งคำขอ',             // Step 3
] as const;
```

---

## 3. Hook: useCreateRfqState

### ไฟล์: `hooks/useCreateRfqState.ts`

#### Dependencies ที่ import

| Import           | Source                                 |
| ---------------- | -------------------------------------- |
| `useNavigate`    | `react-router`                         |
| `categories`     | `../data/mockData`                     |
| `factories`      | `../data/mockData`                     |
| `INITIAL_FORM`   | `../components/features/create-rfq`    |
| `STEPS`          | `../components/features/create-rfq`    |
| `CreateRfqForm`  | `../components/features/create-rfq`    |

#### Mock Data สำหรับ Step 3

เมื่อ user ยังไม่ได้กรอกฟอร์ม (form.projectName ว่าง) แต่ไปถึง step 3 จะแสดง mock:

```ts
const MOCK_FORM_STEP3: CreateRfqForm = {
  categoryId: 'pet_food',
  factoryType: 'อาหารสัตว์',
  projectName: 'อาหารสัตว์แห้งสูตรลูกสุนัข',
  description: 'ต้องการผลิตอาหารสัตว์แห้งสูตรลูกสุนัข จำนวน 1,000 กระสอบ ขนาด 2 กก./ถุง มาตรฐาน GMP และ อย. ต้องมีวันผลิตและวันหมดอายุบนบรรจุภัณฑ์',
  quantity: '1000',
  budget: '50000',
  material: 'เนื้อไก่, ข้าว, วิตามิน, โปรตีนจากพืช',
  deadline: '2026-03-15',
};
```

#### State ภายใน Hook

| State/Variable         | Type                                    | คำอธิบาย                                                                 |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `currentStep`          | `number` (1-3)                          | step ปัจจุบัน                                                            |
| `form`                 | `CreateRfqForm`                         | ข้อมูลฟอร์มที่ user กรอก                                                 |
| `displayForm`          | `CreateRfqForm`                         | ถ้า step=3 และ form.projectName ว่าง → ใช้ MOCK_FORM_STEP3, มิฉะนั้นใช้ form |
| `displayCategoryName`  | `string`                                | ชื่อหมวดหมู่จาก categories ที่ match กับ displayForm.categoryId            |
| `factoryTypes`         | `string[]`                              | รวม tag ทั้งหมดจาก factories (unique, sorted ภาษาไทย)                    |
| `matchedFactories`     | `Factory[]`                             | โรงงานที่ match กับ displayForm.factoryType (เทียบ tags + specialization) |

#### ฟังก์ชันทั้งหมด

| ฟังก์ชัน       | Signature                                           | คำอธิบาย                                                              |
| ------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| `updateForm`  | `(key: keyof CreateRfqForm, value: string) => void` | อัปเดต field ใดก็ได้ในฟอร์ม                                            |
| `handleNext`  | `() => void`                                        | ถ้า step < 3 → ไปขั้นถัดไป; ถ้า step = 3 → navigate ไปหน้า `/orders`   |
| `handleBack`  | `() => void`                                        | ถ้า step > 1 → ย้อนกลับ; ถ้า step = 1 → navigate(-1) กลับหน้าก่อนหน้า |

#### Return Value ทั้งหมด

```ts
return {
  STEPS,                  // readonly ['รายละเอียดโปรเจกต์', 'ความต้องการและงบประมาณ', 'สรุปและส่งคำขอ']
  currentStep,            // number (1-3)
  setCurrentStep,         // React.Dispatch<SetStateAction<number>>

  form,                   // CreateRfqForm — ข้อมูลจริงจาก user
  updateForm,             // (key, value) => void
  displayForm,            // CreateRfqForm — สำหรับแสดงผล (mock หรือ real)
  displayCategoryName,    // string — ชื่อหมวดหมู่ที่แสดง
  factoryTypes,           // string[] — ประเภทโรงงานทั้งหมด
  matchedFactories,       // Factory[] — โรงงานที่ match

  handleNext,             // () => void
  handleBack,             // () => void

  categories,             // Category[] — หมวดหมู่ทั้งหมดจาก mockData
};
```

---

## 4. Mock Data ที่เกี่ยวข้อง

### ไฟล์: `data/mockData.ts`

### 4.1 `categories` (ใช้ตรงในหน้า Create RFQ)

| Field   | Type     | ตัวอย่าง                            |
| ------- | -------- | ---------------------------------- |
| `id`    | `string` | `'pet_food'`, `'supplements'`      |
| `name`  | `string` | `'อาหารสัตว์'`, `'อาหารเสริม'`       |
| `icon`  | `string` | `'🐾'`, `'💊'`                      |
| `color` | `string` | `'#3B82F6'`, `'#8B5CF6'`          |

**ข้อมูลทั้งหมด (6 รายการ):**

| id                | name               | icon | color     |
| ----------------- | ------------------ | ---- | --------- |
| `pet_food`        | อาหารสัตว์          | 🐾   | `#3B82F6` |
| `supplements`     | อาหารเสริม          | 💊   | `#8B5CF6` |
| `pet_toys`        | ของเล่นสัตว์เลี้ยง   | 🎾   | `#22C55E` |
| `leash_equipment` | สายจูง อุปกรณ์       | 🦮   | `#F59E0B` |
| `pet_clothes`     | เสื้อผ้าสัตว์เลี้ยง   | 👕   | `#EC4899` |
| `other`           | อื่นๆ               | 📦   | `#6B7280` |

### 4.2 `factories` (ใช้คำนวณ factoryTypes + matchedFactories)

| Field             | Type       | คำอธิบาย                     |
| ----------------- | ---------- | --------------------------- |
| `id`              | `string`   | รหัสโรงงาน เช่น `'f1'`       |
| `name`            | `string`   | ชื่อโรงงาน                    |
| `location`        | `string`   | จังหวัดที่ตั้ง                  |
| `rating`          | `number`   | คะแนนรีวิว (0-5)             |
| `reviews`         | `number`   | จำนวนรีวิว                    |
| `specialization`  | `string`   | ความเชี่ยวชาญหลัก             |
| `tags`            | `string[]` | ประเภทงาน/ความสามารถ         |
| `minOrder`        | `number`   | จำนวนสั่งซื้อขั้นต่ำ            |
| `leadTime`        | `string`   | ระยะเวลาผลิต                 |
| `image`           | `string`   | URL รูปภาพโรงงาน             |
| `verified`        | `boolean`  | ยืนยันตัวตนแล้วหรือไม่          |
| `completedOrders` | `number`   | จำนวนคำสั่งซื้อที่ทำสำเร็จ      |
| `priceRange`      | `string`   | ระดับราคา (`'฿'` - `'฿฿฿'`)  |

**ข้อมูลทั้งหมด (6 รายการ):**

| id   | name                               | location       | rating | tags (sample)                              | verified |
| ---- | ---------------------------------- | -------------- | ------ | ------------------------------------------ | -------- |
| `f1` | โรงงานอาหารสัตว์เลี้ยงพรีเมี่ยม        | ปทุมธานี         | 4.9    | อาหารสัตว์, GMP, อย.                        | ✅       |
| `f2` | เสื้อผ้าสัตว์เลี้ยง สยาม              | นนทบุรี          | 4.7    | เสื้อผ้าสัตว์เลี้ยง, ผ้าคอตตอน, ISO 9001      | ✅       |
| `f3` | ของเล่นสัตว์เลี้ยง แฮปปี้             | กรุงเทพฯ        | 4.8    | ของเล่นสัตว์เลี้ยง, สายจูง, ยางปลอดภัย        | ✅       |
| `f4` | แพ็กเกจจิ้งสัตว์เลี้ยง โปร            | ชลบุรี           | 4.6    | แพ็กเกจจิ้ง, อาหารเสริม, อื่นๆ               | ❌       |
| `f5` | ฟาร์มาเพ็ท นิวทริชั่น               | สมุทรปราการ      | 4.8    | อาหารเสริม, GMP, HALAL                     | ✅       |
| `f6` | Smart Collar Tech                  | เชียงใหม่        | 4.7    | IoT, สายจูง อุปกรณ์, OEM                    | ✅       |

### 4.3 factoryTypes (คำนวณจาก factories.tags)

ค่าที่ได้จากการ flatten `factories[].tags` แล้ว unique + sort ภาษาไทย:

```
['GMP', 'HALAL', 'ISO 9001', 'IoT', 'OEM', 'ของเล่นสัตว์เลี้ยง', 'ผ้าคอตตอน', 
 'สายจูง', 'สายจูง อุปกรณ์', 'อย.', 'อาหารสัตว์', 'อาหารเสริม', 'อื่นๆ', 
 'เสื้อผ้าสัตว์เลี้ยง', 'แพ็กเกจจิ้ง', 'ยางปลอดภัย']
```

### 4.4 matchedFactories (คำนวณ runtime)

Logic การ match:
```ts
const matchedFactories = factories.filter((f) => {
  const q = displayForm.factoryType.trim().toLowerCase();
  const matchTag = (f.tags ?? []).some((x) => x.toLowerCase() === q);
  const matchSpec = f.specialization?.toLowerCase().includes(q);
  return matchTag || matchSpec;
});
```

**ใช้แสดงใน Step 3** — โรงงานที่ตรงกับประเภทที่เลือก

---

## 5. Shared Components

### 5.1 `ImageWithFallback`

- **ไฟล์:** `components/shared/ImageWithFallback.tsx`
- **ใช้ใน:** `CreateRfqStep3Summary` (แต่ปัจจุบันยังไม่ได้ใช้แสดงรูป factory จริง)
- **ทำหน้าที่:** แสดง `<img>` ปกติ ถ้า load ไม่สำเร็จจะแสดง fallback SVG (placeholder icon)

### 5.2 `useIsDesktop`

- **ไฟล์:** `hooks/useIsDesktop.ts`
- **Breakpoint:** ค่าเริ่มต้น `1024px`
- **ทำหน้าที่:** return `true` ถ้า `window.innerWidth >= 1024`, ใช้ตัดสินใจเลือก Desktop/Mobile component

### 5.3 `cn` (utility)

- **ไฟล์:** `lib/utils.ts`
- **ทำหน้าที่:** รวม `clsx()` + `twMerge()` สำหรับ conditional Tailwind CSS class names

---

## 6. Step Components (Feature Components)

### 6.1 CreateRfqStep1 — รายละเอียดโปรเจกต์

**ไฟล์:** `components/features/create-rfq/CreateRfqStep1.tsx`

#### Props

| Prop           | Type                                          | คำอธิบาย                |
| -------------- | --------------------------------------------- | ---------------------- |
| `form`         | `CreateRfqForm`                               | ข้อมูลฟอร์มปัจจุบัน      |
| `categories`   | `{ id: string; name: string }[]`              | รายการหมวดหมู่           |
| `factoryTypes` | `string[]`                                    | รายการประเภทโรงงาน      |
| `onUpdate`     | `(key: keyof CreateRfqForm, value: string) => void` | callback อัปเดตฟอร์ม |

#### ฟอร์มที่แสดง

| ลำดับ | Field              | Input Type   | Placeholder/Label                                                      |
| ---- | ------------------ | ------------ | ---------------------------------------------------------------------- |
| 1    | `categoryId`       | `<select>`   | "เลือกหมวดหมู่" — แสดง categories ทั้งหมด                                |
| 2    | `factoryType`      | `<select>`   | "เลือกประเภทโรงงาน" — แสดง factoryTypes ทั้งหมด                         |
| 3    | `projectName`      | `<input>`    | "เช่น อาหารสัตว์แห้งสูตรลูกสุนัข, เสื้อผ้าสัตว์เลี้ยงชุดฤดูร้อน"            |
| 4    | `description`      | `<textarea>` | "อธิบายความต้องการ เช่น ขนาด สี วัสดุ จำนวนขั้นต่ำ มาตรฐานที่ต้องการ..." |

#### Icons ที่ใช้
- `ChevronDown` — dropdown arrow
- `FileText` — ชื่อโปรเจกต์
- `Factory` — ประเภทโรงงาน

---

### 6.2 CreateRfqStep2 — ความต้องการและงบประมาณ

**ไฟล์:** `components/features/create-rfq/CreateRfqStep2.tsx`

#### Props

| Prop       | Type                                          | คำอธิบาย            |
| ---------- | --------------------------------------------- | ------------------ |
| `form`     | `CreateRfqForm`                               | ข้อมูลฟอร์มปัจจุบัน  |
| `onUpdate` | `(key: keyof CreateRfqForm, value: string) => void` | callback อัปเดตฟอร์ม |

#### ฟอร์มที่แสดง

| ลำดับ | Field      | Input Type        | Layout      | Placeholder/Label                                             |
| ---- | ---------- | ----------------- | ----------- | ------------------------------------------------------------- |
| 1    | `quantity` | `<input number>`  | grid col 1  | "หน่วย"                                                        |
| 2    | `budget`   | `<input text>`    | grid col 2  | "ไม่บังคับ" (inputMode="numeric")                               |
| 3    | `material` | `<input text>`    | full width  | "เช่น ผ้าคอตตอน 100%, ยางธรรมชาติปลอดภัย, เนื้อไก่ ข้าว วิตามิน"  |
| 4    | `deadline` | `<input date>`    | full width  | -                                                             |
| 5    | (upload)   | drag-drop area    | full width  | "แตะเพื่ออัปโหลด" PNG, JPG, PDF ไม่เกิน 10MB                    |

> **หมายเหตุ:** พื้นที่อัปโหลดไฟล์ยังเป็น UI-only (ไม่มี logic จริง)

#### Icons ที่ใช้
- `Package` — จำนวน
- `DollarSign` — งบประมาณ
- `Calendar` — deadline
- `Image (as ImageIcon)` — upload area

---

### 6.3 CreateRfqStep3Summary — สรุปและส่งคำขอ

**ไฟล์:** `components/features/create-rfq/CreateRfqStep3Summary.tsx`

#### Props

| Prop                | Type                | คำอธิบาย                    |
| ------------------- | ------------------- | -------------------------- |
| `form`              | `CreateRfqForm`     | ข้อมูลฟอร์ม (displayForm)   |
| `categoryName`      | `string`            | ชื่อหมวดหมู่ที่เลือก          |
| `matchedFactories`  | `MatchedFactory[]`  | โรงงานที่ match (ดู type ด้านล่าง) |

#### Type ของ matchedFactories item

```ts
{
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  verified?: boolean;
  specialization: string;
}
```

#### ส่วนแสดงผล

| ส่วน               | ข้อมูลที่แสดง                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| **โปรเจกต์**        | `form.projectName`, `categoryName`, `form.factoryType`                      |
| **รายละเอียด**      | `form.description` (แสดงเฉพาะเมื่อมีข้อมูล)                                  |
| **ความต้องการ**      | `form.quantity` (หน่วย), `form.budget` (฿ formatted), `form.material`, `form.deadline` (วันที่ไทย) |
| **ไฟล์แนบ**        | placeholder icon (ยังไม่มี logic จริง)                                         |
| **ข้อความแจ้ง**     | "คำขอของคุณจะถูกส่งไปยังโรงงานที่ตรงกับหมวดหมู่และความสามารถ..."                |

> **หมายเหตุ:** `matchedFactories` ถูก pass เข้ามาแต่ **ปัจจุบันยังไม่ได้แสดงในตัว component** (มีเฉพาะ type declaration)

#### Icons ที่ใช้
- `CheckCircle2` — ข้อความยืนยัน
- `Image (as ImageIcon)` — ไฟล์แนบ placeholder
- `BadgeCheck` — (import แล้วแต่ยังไม่ได้ใช้)
- `MapPin` — (import แล้วแต่ยังไม่ได้ใช้)
- `Star` — (import แล้วแต่ยังไม่ได้ใช้)

---

## 7. UI Desktop

### ไฟล์: `pages/create-rfq/CreateRfq.desktop.tsx`

#### Props

```ts
type CreateRfqState = ReturnType<typeof useCreateRfqState>;
type CreateRfqDesktopProps = { state: CreateRfqState };
```

#### State ที่ destructure จาก props

```ts
const {
  STEPS, currentStep, form, displayForm, displayCategoryName,
  categories, factoryTypes, matchedFactories,
  updateForm, handleNext, handleBack,
} = state;
```

#### โครงสร้าง Layout (Desktop)

```
┌─────────────────────────────────────────────────────────┐
│  Top Bar                                                │
│  [← Back]  สร้าง RFQ ใหม่              [Step Indicators]│
├─────────────────────────────────────┬───────────────────┤
│  Left: Form Area (max-w-2xl)        │  Right: Sidebar   │
│  ┌─────────────────────────────┐    │  (w-72)           │
│  │  Step 1/2/3 Content         │    │                   │
│  │  (AnimatePresence)          │    │  ┌──────────────┐ │
│  │                             │    │  │ สรุปคำขอ      │ │
│  │                             │    │  │ - หมวดหมู่     │ │
│  │                             │    │  │ - ปริมาณ      │ │
│  │                             │    │  │ - งบประมาณ    │ │
│  │                             │    │  │ - กำหนดส่ง    │ │
│  └─────────────────────────────┘    │  └──────────────┘ │
│  [← ย้อนกลับ]           [ถัดไป →]   │  ┌──────────────┐ │
│                                     │  │ ความคืบหน้า   │ │
│                                     │  │ Step 1/2/3   │ │
│                                     │  └──────────────┘ │
│                                     │  ┌──────────────┐ │
│                                     │  │ Tips         │ │
│                                     │  └──────────────┘ │
└─────────────────────────────────────┴───────────────────┘
```

#### ส่วนประกอบ Desktop

| ส่วน                     | คำอธิบาย                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| **Top Bar**              | ปุ่ม Back, ชื่อหน้า "สร้าง RFQ ใหม่", Step indicator pills                  |
| **Step Indicator Pills** | แสดง STEPS ทั้ง 3 ในรูปแบบ pill: done=สีม่วง, current=สีขาว/ม่วง, pending=สีเทา |
| **Form Area (Left)**     | AnimatePresence สลับ Step1/Step2/Step3 ด้วย animation (slide x: 24px)    |
| **Navigation Row**       | ปุ่ม "ย้อนกลับ" (ซ้าย) + ปุ่ม "ถัดไป →" หรือ "ส่งคำขอใบเสนอราคา" (ขวา)     |
| **Summary Sidebar**      | แสดงสรุปข้อมูลแบบ real-time: projectName, หมวดหมู่, ปริมาณ, งบประมาณ, กำหนดส่ง |
| **Progress Sidebar**     | แถบ progress bar + รายชื่อ step ที่ทำเสร็จ/กำลังทำ/รอทำ                    |
| **Tips Sidebar**         | คำแนะนำ 3 ข้อ (static text)                                              |

#### Sidebar — Summary Card (ข้อมูลที่แสดง)

| Label           | Value Source                                        | Format           |
| --------------- | --------------------------------------------------- | ---------------- |
| หมวดหมู่         | `displayCategoryName`                               | string           |
| ปริมาณโดยประมาณ  | `displayForm.quantity`                              | `{n} หน่วย`      |
| งบประมาณ         | `displayForm.budget`                                | `฿{n}` (localized) |
| กำหนดส่ง         | `displayForm.deadline`                              | string (raw)     |

#### CSS/Styling สำคัญ
- `hidden lg:flex` — ซ่อนบน mobile, แสดงเป็น flex บน desktop (≥1024px)
- Background: `bg-slate-50`
- Cards: `bg-white rounded-2xl border border-slate-100 shadow-sm`
- Gradient buttons: `linear-gradient(135deg, #5B21B6, #6C47FF)`
- Animation library: `motion/react` (Framer Motion)

#### Icons (Desktop)
- `ArrowLeft` — ปุ่มย้อนกลับ
- `CheckCircle2` — step ที่เสร็จแล้ว
- `FileText` — ปุ่มส่งคำขอ
- `Lightbulb` — Tips section

---

## 8. UI Mobile

### ไฟล์: `pages/create-rfq/CreateRfq.mobile.tsx`

#### Props

```ts
type CreateRfqState = ReturnType<typeof useCreateRfqState>;
type CreateRfqMobileProps = { state: CreateRfqState };
```

#### State ที่ destructure จาก props (เหมือน Desktop)

```ts
const {
  STEPS, currentStep, form, displayForm, displayCategoryName,
  categories, factoryTypes, matchedFactories,
  updateForm, handleNext, handleBack,
} = state;
```

#### โครงสร้าง Layout (Mobile)

```
┌─────────────────────────────┐
│  Header (sticky top)        │
│  [←] สร้าง RFQ ใหม่  [1/3] │
│  ████████░░░░░░░  (progress)│
│  ● Step1  ○ Step2  ○ Step3  │
├─────────────────────────────┤
│                             │
│  Form Content               │
│  (scrollable, pb-32)        │
│                             │
│  Step 1/2/3 (AnimatePresence)│
│                             │
│                             │
├─────────────────────────────┤
│  Fixed Bottom CTA           │
│  [  ถัดไป →  ]              │
│  หรือ                        │
│  [  ส่งคำขอใบเสนอราคา  ]     │
└─────────────────────────────┘
```

#### ส่วนประกอบ Mobile

| ส่วน                      | คำอธิบาย                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| **Header (Sticky)**       | ปุ่ม Back, ชื่อหน้า, badge แสดง step (e.g. "1/3"), progress bar, step dots  |
| **Progress Bar**          | แถบ gradient ม่วง ขยายตาม currentStep                                     |
| **Step Indicators**       | วงกลมเล็ก + label ของแต่ละ step                                           |
| **Form Content (Main)**   | AnimatePresence สลับ Step1/Step2/Step3 ด้วย animation (slide x: 20px)     |
| **Fixed Bottom CTA**      | ปุ่มเดียว: "ถัดไป →" (step 1-2) หรือ "ส่งคำขอใบเสนอราคา" (step 3)         |

#### ความแตกต่างจาก Desktop

| Feature              | Desktop                           | Mobile                             |
| -------------------- | --------------------------------- | ---------------------------------- |
| Layout               | 2 columns (form + sidebar)        | Single column                      |
| Summary sidebar      | มี — แสดง real-time summary        | ไม่มี                               |
| Progress sidebar     | มี — step list + progress bar      | มีเฉพาะ progress bar + step dots    |
| Tips section         | มี                                 | ไม่มี                               |
| Navigation           | ปุ่ม Back + Next แยก               | Header back + Fixed bottom CTA      |
| Step indicators      | Pill style (horizontal)            | Circle dots (horizontal)            |
| Header               | Top bar ธรรมดา                     | Sticky header with shadow           |
| CTA position         | ล่างของ form area                   | Fixed bottom (ทับ content)           |
| Visibility class     | `hidden lg:flex`                   | ไม่มี class ซ่อน (แสดงเสมอ)          |
| Content padding      | `px-8 py-7`                        | `px-4 py-6 pb-32`                  |

#### CSS/Styling สำคัญ (Mobile)
- Background: `bg-gray-50`
- Header: `sticky top-0 z-10 shadow-sm`
- Bottom CTA: `fixed bottom-0 left-0 w-full z-20`
- Content padding bottom: `pb-32` (เผื่อพื้นที่ให้ fixed bottom)
- Animation: slide x: 20px (เล็กกว่า desktop ที่ 24px)

#### Icons (Mobile)
- `ArrowLeft` — ปุ่มย้อนกลับ
- `CheckCircle2` — step ที่เสร็จแล้ว
- `FileText` — ปุ่มส่งคำขอ

---

## 9. สรุปข้อมูลที่ต้องเรียก (Data Dependencies)

### ข้อมูลที่ต้องมี (จาก API จริง)

| ข้อมูล                   | ใช้ที่                | ปัจจุบันมาจาก         | คำอธิบาย                            |
| ----------------------- | -------------------- | -------------------- | ---------------------------------- |
| **categories**          | Step1, Hook          | `mockData.categories` | รายการหมวดหมู่สินค้าทั้งหมด           |
| **factories**           | Hook (คำนวณ)          | `mockData.factories`  | ข้อมูลโรงงานทั้งหมด (ใช้คำนวณ types + match) |
| **factoryTypes**        | Step1                | คำนวณจาก factories    | ประเภทโรงงานสำหรับ dropdown          |
| **matchedFactories**    | Step3                | คำนวณจาก factories    | โรงงานที่ match กับ factoryType      |
| **form data (user input)** | Step1, Step2, Step3 | local state          | ข้อมูลที่ user กรอก                  |

### ข้อมูลที่ไม่ต้องเรียก (Static/Local)

| ข้อมูล            | คำอธิบาย                      |
| ---------------- | ---------------------------- |
| `STEPS`          | ชื่อ step คงที่ 3 ค่า          |
| `INITIAL_FORM`   | ค่าเริ่มต้น form (string ว่าง)  |
| `MOCK_FORM_STEP3` | ข้อมูลตัวอย่างสำหรับ demo      |

### API Endpoints ที่ควรมี (สำหรับ Production)

| Endpoint                     | Method | คำอธิบาย                              |
| ---------------------------- | ------ | ------------------------------------ |
| `GET /categories`            | GET    | ดึงรายการหมวดหมู่                      |
| `GET /factories`             | GET    | ดึงรายการโรงงาน                       |
| `GET /factory-types`         | GET    | ดึงประเภทโรงงาน (หรือคำนวณจากโรงงาน)  |
| `GET /factories?type={type}` | GET    | ค้นหาโรงงานตามประเภท                  |
| `POST /rfqs`                 | POST   | สร้าง RFQ ใหม่ (ส่ง form data)        |
| `POST /rfqs/{id}/files`      | POST   | อัปโหลดไฟล์แนบ                        |

---

## 10. แผนผังการไหลของข้อมูล (Data Flow)

```
┌──────────────────────────────────────────────────────┐
│                    index.tsx (Entry)                  │
│  useIsDesktop() → เลือก Desktop หรือ Mobile           │
│  useCreateRfqState() → สร้าง state ทั้งหมด            │
│  ส่ง state เป็น props ไปยัง component ที่เลือก          │
└───────────────┬──────────────────────┬───────────────┘
                │                      │
    ┌───────────▼──────────┐  ┌───────▼──────────────┐
    │  CreateRfqDesktop    │  │  CreateRfqMobile      │
    │  destructure state   │  │  destructure state    │
    │                      │  │                       │
    │  Step1/Step2/Step3   │  │  Step1/Step2/Step3    │
    │  + Summary Sidebar   │  │  (no sidebar)         │
    │  + Progress Sidebar  │  │                       │
    │  + Tips              │  │                       │
    └──────────────────────┘  └───────────────────────┘
                │                      │
    ┌───────────▼──────────────────────▼───────────────┐
    │              Shared Step Components               │
    │                                                   │
    │  CreateRfqStep1                                   │
    │    ← form, categories, factoryTypes, onUpdate     │
    │                                                   │
    │  CreateRfqStep2                                   │
    │    ← form, onUpdate                               │
    │                                                   │
    │  CreateRfqStep3Summary                            │
    │    ← displayForm, categoryName, matchedFactories  │
    └───────────────────────────────────────────────────┘
                        │
    ┌───────────────────▼───────────────────────────────┐
    │              useCreateRfqState (Hook)              │
    │                                                   │
    │  State: currentStep, form                         │
    │  Computed: displayForm, displayCategoryName,      │
    │           factoryTypes, matchedFactories           │
    │  Actions: updateForm, handleNext, handleBack      │
    │                                                   │
    │  Data Sources:                                    │
    │    mockData.categories → categories dropdown       │
    │    mockData.factories  → factoryTypes + matching   │
    └───────────────────────────────────────────────────┘
```

---

## สรุป

- **ทั้งหมด 10 ไฟล์** ที่เกี่ยวข้อง
- **1 Hook** (`useCreateRfqState`) จัดการ state + logic ทั้งหมด
- **3 Step Components** ที่ใช้ร่วมกันระหว่าง Desktop และ Mobile
- **2 Layout Components** (Desktop + Mobile) ที่แตกต่างกันเฉพาะ UI
- **Mock Data** ที่ใช้: `categories` (6 items) + `factories` (6 items)
- **Form fields**: 8 fields ใน `CreateRfqForm`
- **ยังไม่มี logic จริง**: file upload, submit RFQ to API, matchedFactories display ใน Step3
