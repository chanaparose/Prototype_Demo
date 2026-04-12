# FE Update Spec — Category Dropdown & Messages API Wiring

**โปรเจกต์:** Wemake Platform
**วันที่:** 7 เมษายน 2026
**ผู้วิเคราะห์:** System Analyst
**เวอร์ชัน:** 1.0
**ขอบเขต:** ปรับ frontend 2 จุด (ไม่แตะ backend)
1. Dropdown category/sub-category บนหน้า `factory-ideas`
2. โฟลเดอร์ `pages/messages` ให้ดึงข้อมูลจาก API จริง (ไม่ผ่าน `DataContext.conversations` ที่เป็น mock)

---

## สารบัญ

1. [สถานะปัจจุบัน (As-is)](#1-สถานะปัจจุบัน-as-is)
2. [Requirement](#2-requirement)
3. [Part A — Factory Ideas Category Dropdown](#3-part-a--factory-ideas-category-dropdown)
4. [Part B — Messages Folder API Wiring](#4-part-b--messages-folder-api-wiring)
5. [Checklist สำหรับ PR](#5-checklist-สำหรับ-pr)

---

## 1. สถานะปัจจุบัน (As-is)

### 1.1 Factory Ideas (`src/app/pages/factory-ideas/`)

ไฟล์ที่เกี่ยวข้อง:
- `FactoryIdeas.desktop.tsx` (line 85–230)
- `FactoryIdeas.mobile.tsx` (line 82–227)

พฤติกรรมปัจจุบัน:
- โหลดหมวดจาก `fetchExploreCategoriesMerged()` + fallback `masterApi.productCategories()` → ได้ **flat list** ของ `{ id, name }`
- มี **dropdown เดียว** (`categoryOpen` / `categoryFilters`) ทำหน้าที่ filter รายการ showcase/factory
- **ไม่มี sub-category** ให้เลือก → user กรองได้แค่ระดับหมวดหลัก
- `useShowcases` และ logic filter ไม่รองรับ `sub_category_id` เลย

### 1.2 Messages (`src/app/pages/messages/`)

ไฟล์ที่เกี่ยวข้อง:
- `index.tsx` — ใช้ `useData()` แล้วอ่าน `data.conversations` ตรงๆ
- `Messages.desktop.tsx` / `Messages.mobile.tsx` — รับ `filtered: any[]` เป็น prop

พฤติกรรมปัจจุบัน:
- **ไม่เรียก API ใดเลย** อ่าน `data.conversations` ซึ่งฝั่ง `DataContext` คืน `[]` เพราะถูกลบ mockData ออกแล้ว → ผลคือ list ว่างตลอด
- ไม่มีการดึง unread count / last_message / has_quote จาก API
- `messagesApi` / `conversationsApi` มี method ใน `src/app/services/api.ts` ครบแล้วแต่ **ไม่ได้ถูกเรียกใช้**

---

## 2. Requirement

### 2.1 Part A — Category Dropdown
ปรับหน้า `factory-ideas` ให้มี dropdown **2 ตัวแบบ cascading**:
- **Dropdown 1:** Category (จาก `GET /categories`)
- **Dropdown 2:** Sub-category (จาก `GET /categories/:id/sub-categories`) — แสดงเฉพาะเมื่อเลือก category แล้ว
- ต้อง filter รายการ showcase ตามทั้ง `category_id` และ `sub_category_id`

### 2.2 Part B — Messages API Wiring
ปรับโฟลเดอร์ `pages/messages` ให้:
- เรียก `conversationsApi.list()` เอง (ไม่ผ่าน `DataContext`)
- รองรับ field ตาม `API_SPEC.md §11` (`conv_id`, `customer_id`, `factory_id`, `last_message`, `unread_customer`, `unread_factory`, `has_quote`, `updated_at`)
- เมื่อเลือก conversation → เรียก `messagesApi.listByConversation(conv_id)` เพื่อโหลดข้อความ (หรือ navigate ไป `ChatRoom` ซึ่งโหลดเอง)

---

## 3. Part A — Factory Ideas Category Dropdown

### 3.1 Data Model ที่จะใช้

จาก DB schema ที่ user ระบุ:

```sql
-- ตารางหลัก (มีอยู่แล้ว)
categories (
  category_id  INT PK,
  name         VARCHAR(150)
)

lbi_sub_categories (
  sub_category_id  INT PK,
  category_id      INT FK → categories.category_id,
  name             VARCHAR(100),
  status           CHAR(1),    -- 'A' = active, 'I' = inactive
  sort_order       INT
)
```

### 3.2 API endpoints ที่จะเรียก

| # | Endpoint | ใช้ตอนไหน | หมายเหตุ |
|---|----------|----------|---------|
| 1 | `GET /categories` (ผ่าน `fetchExploreCategoriesMerged` หรือ `categoriesApi.list()`) | mount | ได้ `[{ category_id, name }]` |
| 2 | `GET /categories/:category_id/sub-categories` (ผ่าน `categoriesApi.subCategories(id)`) | หลังเลือก category | ได้ `[{ sub_category_id, category_id, name, status, sort_order }]` |

ทั้งสอง endpoint มี client method ใน `src/app/services/api.ts` (`categoriesApi.subCategories` — line 224–226) **ไม่ต้องเพิ่ม endpoint ใหม่**

### 3.3 ตัว showcase ต้องมี `sub_category_id`

ใน `useShowcases` hook ให้ปรับ type ของ `ShowcaseRow` เพิ่ม:
```ts
sub_category_id?: number | null;
sub_category_name?: string | null;  // optional display
```

หมายเหตุ: BE ยัง **ไม่มี** `sub_category_id` ในตาราง `factory_showcases` (ดู `system_analysis_flow.md` §4.1 — เป็น Critical gap) FE อ่านค่าแบบ optional ก่อน เมื่อ BE เพิ่ม field ค่อยเริ่ม filter จริง ระหว่างนี้ให้ fallback เป็น "ไม่กรอง sub"

### 3.4 State & Component Changes

ในแต่ละไฟล์ (`FactoryIdeas.desktop.tsx`, `FactoryIdeas.mobile.tsx`) เพิ่ม state:

```tsx
// state เดิม (คง)
const [apiCategoriesAll, setApiCategoriesAll] = useState<
  { id: string; name: string }[]
>([]);
const [categoryOpen, setCategoryOpen] = useState(false);
const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

// state ใหม่
const [subCategories, setSubCategories] = useState<
  { id: string; name: string; sortOrder: number }[]
>([]);
const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
const [subCategoryOpen, setSubCategoryOpen] = useState(false);
const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
const subCategoryDropdownRef = useRef<HTMLDivElement>(null);
```

### 3.5 Cascading Load Effect

```tsx
useEffect(() => {
  // reset เมื่อเปลี่ยน category
  setSelectedSubCategoryId(null);
  setSubCategories([]);

  if (!selectedCategoryId) return;

  let cancelled = false;
  setSubCategoriesLoading(true);

  categoriesApi
    .subCategories(selectedCategoryId)
    .then((raw) => {
      if (cancelled) return;
      const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
      const mapped = arr
        .filter((r) => String(r.status ?? 'A').toUpperCase() === 'A')
        .map((r) => ({
          id: String(r.sub_category_id ?? r.id ?? ''),
          name: String(r.name ?? ''),
          sortOrder: Number(r.sort_order ?? 0),
        }))
        .filter((r) => r.id && r.name)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      setSubCategories(mapped);
    })
    .catch(() => {
      if (!cancelled) setSubCategories([]);
    })
    .finally(() => {
      if (!cancelled) setSubCategoriesLoading(false);
    });

  return () => {
    cancelled = true;
  };
}, [selectedCategoryId]);
```

### 3.6 Filter Logic Update

```tsx
const filteredItems = useMemo(() => {
  return items.filter((item) => {
    // ... text search, type filter เดิม

    // filter by category (เดิม)
    if (selectedCategoryId && String(item.categoryId) !== selectedCategoryId) {
      return false;
    }

    // filter by sub-category (ใหม่)
    if (
      selectedSubCategoryId &&
      item.sub_category_id != null &&
      String(item.sub_category_id) !== selectedSubCategoryId
    ) {
      return false;
    }

    return true;
  });
}, [items, selectedCategoryId, selectedSubCategoryId, searchText, selectedType]);
```

### 3.7 UI Structure

```tsx
<div className="flex items-center gap-2">
  {/* Category dropdown (เดิม — แค่ wire selectedCategoryId) */}
  <div ref={categoryDropdownRef} className="relative flex-1 min-w-0">
    <button onClick={() => setCategoryOpen((v) => !v)}>
      {categoryFilters.find((c) => c.id === selectedCategoryId)?.name ?? 'ทุกหมวด'}
    </button>
    {categoryOpen && (
      <ul>
        <li onClick={() => { setSelectedCategoryId(null); setCategoryOpen(false); }}>
          ทุกหมวด
        </li>
        {categoryFilters.map((c) => (
          <li key={c.id} onClick={() => { setSelectedCategoryId(c.id); setCategoryOpen(false); }}>
            {c.name}
          </li>
        ))}
      </ul>
    )}
  </div>

  {/* Sub-category dropdown (ใหม่) — แสดงเมื่อเลือก category */}
  {selectedCategoryId && (
    <div ref={subCategoryDropdownRef} className="relative flex-1 min-w-0">
      <button
        onClick={() => setSubCategoryOpen((v) => !v)}
        disabled={subCategoriesLoading || subCategories.length === 0}
      >
        {subCategoriesLoading
          ? 'กำลังโหลด...'
          : subCategories.length === 0
            ? 'ไม่มีหมวดย่อย'
            : (subCategories.find((s) => s.id === selectedSubCategoryId)?.name ?? 'ทุกหมวดย่อย')}
      </button>
      {subCategoryOpen && subCategories.length > 0 && (
        <ul>
          <li onClick={() => { setSelectedSubCategoryId(null); setSubCategoryOpen(false); }}>
            ทุกหมวดย่อย
          </li>
          {subCategories.map((s) => (
            <li key={s.id} onClick={() => { setSelectedSubCategoryId(s.id); setSubCategoryOpen(false); }}>
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )}
</div>
```

### 3.8 Click-outside สำหรับ dropdown ที่ 2

เพิ่ม `useEffect` สำหรับ `subCategoryDropdownRef` คู่ขนานกับของ category เดิม (copy pattern จาก line 129–141)

### 3.9 ไฟล์ที่ต้องแก้

| ไฟล์ | การแก้ไข |
|------|---------|
| `src/app/pages/factory-ideas/FactoryIdeas.desktop.tsx` | เพิ่ม state + effect + dropdown ที่ 2 ตาม §3.4–3.7 |
| `src/app/pages/factory-ideas/FactoryIdeas.mobile.tsx` | เหมือน desktop (mobile-friendly layout) |
| `src/app/utils/exploreCategoriesFromApi.ts` | (ไม่จำเป็น) |
| `src/app/services/api.ts` | **ไม่ต้องแก้** — `categoriesApi.subCategories()` มีแล้ว |

---

## 4. Part B — Messages Folder API Wiring

### 4.1 ปัญหา

`pages/messages/index.tsx` ปัจจุบันอ่าน `useData().conversations` แต่หลังจากลบ mockData ใน `DataContext` แล้ว ค่านี้เป็น `[]` เสมอ → หน้า Messages แสดง empty state ตลอด

### 4.2 API endpoints ที่จะเรียก

อ้างอิง `API_SPEC.md` §11 + §12:

| # | Endpoint | Client method | Response shape |
|---|----------|---------------|----------------|
| 1 | `GET /conversations` | `conversationsApi.list()` | `Conversation[]` (ดู §4.3) |
| 2 | `GET /conversations/:conv_id` | `conversationsApi.get(convId)` | รายละเอียด conversation เดี่ยว |
| 3 | `GET /messages?conv_id=:id` | `messagesApi.listByConversation(convId)` | `Message[]` |
| 4 | `POST /messages/` | `messagesApi.send(body)` | เมื่อกดส่งจาก ChatRoom |

หมายเหตุ: `API_SPEC.md` ระบุว่า `/conversations` มีสถานะ ❌ "ยังไม่ได้ต่อ" — ฝั่ง FE ให้ wire ไว้ก่อน ถ้า BE คืน 404/500 ให้ fallback เป็น empty state พร้อม toast

### 4.3 Type ที่ต้องสร้าง

สร้างไฟล์ `src/app/pages/messages/types.ts` (ใหม่):

```ts
export type ApiConversation = {
  conv_id: number;
  customer_id: number;
  factory_id: number;
  factory_name?: string;
  factory_image?: string;
  rfq_id?: number | null;
  rfq_title?: string | null;
  last_message?: string;
  last_message_at?: string;
  unread_customer: number;
  unread_factory: number;
  has_quote: boolean;
  updated_at: string;
};

export type UiConversation = {
  id: string;               // = String(conv_id)
  factoryId: string;
  factoryName: string;
  factoryImage: string;
  rfqName: string;          // = rfq_title ?? ''
  lastMessage: string;
  lastMessageAt: string;
  unread: number;           // customer POV: unread_customer
  hasQuote: boolean;
};

export function normalizeConversation(
  row: ApiConversation,
  viewerRole: 'CU' | 'FT',
): UiConversation {
  return {
    id: String(row.conv_id),
    factoryId: String(row.factory_id),
    factoryName: row.factory_name ?? '',
    factoryImage: row.factory_image ?? '',
    rfqName: row.rfq_title ?? '',
    lastMessage: row.last_message ?? '',
    lastMessageAt: row.last_message_at ?? row.updated_at ?? '',
    unread: viewerRole === 'CU' ? row.unread_customer : row.unread_factory,
    hasQuote: Boolean(row.has_quote),
  };
}
```

### 4.4 Hook ใหม่ `useConversations`

สร้างไฟล์ `src/app/pages/messages/useConversations.ts`:

```ts
import { useEffect, useState, useCallback } from 'react';
import { conversationsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ApiConversation, UiConversation, normalizeConversation } from './types';

export function useConversations() {
  const { user } = useAuth();
  const role = (user?.role === 'FT' ? 'FT' : 'CU') as 'CU' | 'FT';

  const [items, setItems] = useState<UiConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await conversationsApi.list();
      const arr = (Array.isArray(raw) ? raw : []) as ApiConversation[];
      setItems(arr.map((r) => normalizeConversation(r, role)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อความไม่สำเร็จ');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, reload: load };
}
```

### 4.5 ปรับ `pages/messages/index.tsx`

```tsx
import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { MessagesMobile } from './Messages.mobile';
import { MessagesDesktop } from './Messages.desktop';
import { useConversations } from './useConversations';

export function Messages() {
  const isDesktop = useIsDesktop();
  const { items, loading, error, reload } = useConversations();
  const [searchText, setSearchText] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // auto-select first conversation เมื่อโหลดเสร็จ
  React.useEffect(() => {
    if (!selectedId && items.length > 0) setSelectedId(items[0].id);
  }, [items, selectedId]);

  const filtered = React.useMemo(() => {
    const q = searchText.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.factoryName.toLowerCase().includes(q) ||
        c.rfqName.toLowerCase().includes(q),
    );
  }, [searchText, items]);

  const totalUnread = React.useMemo(
    () => items.reduce((s, c) => s + c.unread, 0),
    [items],
  );

  const commonProps = {
    searchText,
    setSearchText,
    filtered,
    totalUnread,
    loading,
    error,
    onReload: reload,
  };

  if (isDesktop) {
    return (
      <MessagesDesktop
        {...commonProps}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
      />
    );
  }

  return <MessagesMobile {...commonProps} />;
}
```

### 4.6 ปรับ Props Type ของ Mobile/Desktop

ใน `Messages.desktop.tsx` และ `Messages.mobile.tsx` เปลี่ยน `filtered: any[]` เป็น `UiConversation[]` และเพิ่ม `loading: boolean; error: string | null; onReload: () => void`

- เพิ่ม loading state: แสดง skeleton 3 แถว
- เพิ่ม error state: แสดง error + ปุ่ม reload
- ใช้ field ใหม่: `c.factoryImage`, `c.lastMessage`, `c.lastMessageAt` (format timeago), `c.unread`, `c.hasQuote` (แสดง badge)

### 4.7 ลบการใช้ `DataContext.conversations`

- **ห้าม** อ่าน `useData().conversations` ใน `pages/messages/*` อีกต่อไป
- ถ้าหน้าอื่นยังใช้อยู่ (เช่น Notifications badge) ให้คง field ไว้ใน `DataContext` แต่ `pages/messages` จะโหลดเอง

### 4.8 ChatRoom integration

`ChatRoomEmbedded` (ที่ import อยู่แล้วใน `Messages.desktop.tsx`) ควรรับ prop `convId: number` แทนชื่อแบบ mock แล้วภายในใช้ `messagesApi.listByConversation(convId)`

หากยังไม่พร้อม ให้ส่ง `convId = Number(selectedId)` ให้ก่อน แล้วให้ `ChatRoomEmbedded` handle เอง

### 4.9 ไฟล์ที่ต้องแก้/สร้าง

| ไฟล์ | การแก้ไข |
|------|---------|
| `src/app/pages/messages/types.ts` | **สร้างใหม่** |
| `src/app/pages/messages/useConversations.ts` | **สร้างใหม่** |
| `src/app/pages/messages/index.tsx` | เปลี่ยนจาก `useData` → `useConversations`, เพิ่ม loading/error |
| `src/app/pages/messages/Messages.desktop.tsx` | ปรับ type + แสดง loading/error/empty state |
| `src/app/pages/messages/Messages.mobile.tsx` | ปรับ type + แสดง loading/error/empty state |
| `src/app/pages/chat-room/*` (optional) | รับ `convId` เป็น prop แล้วเรียก `messagesApi.listByConversation` |
| `src/app/services/api.ts` | **ไม่ต้องแก้** — `conversationsApi` และ `messagesApi` มีครบแล้ว |

---

## 5. Checklist สำหรับ PR

### Part A — Category Dropdown
- [ ] `FactoryIdeas.desktop.tsx` มี dropdown sub-category ที่โหลดจาก `categoriesApi.subCategories(catId)`
- [ ] `FactoryIdeas.mobile.tsx` มี dropdown sub-category เช่นกัน
- [ ] Dropdown sub แสดงเฉพาะเมื่อเลือก category แล้ว
- [ ] เลือก category ใหม่ → reset `selectedSubCategoryId` อัตโนมัติ
- [ ] Sub-category filter ทำงานกับ `sub_category_id` ของ showcase (fallback = ไม่กรองถ้า field ไม่มา)
- [ ] Sort sub-category ตาม `sort_order`
- [ ] กรองเฉพาะ `status = 'A'`
- [ ] Click-outside ปิด dropdown sub ได้
- [ ] Loading / empty state ของ sub-category ถูกต้อง

### Part B — Messages API
- [ ] สร้างไฟล์ `types.ts` + `useConversations.ts`
- [ ] `pages/messages/index.tsx` ไม่อ้าง `useData().conversations` อีก
- [ ] เรียก `conversationsApi.list()` ทุกครั้งที่เข้าหน้า
- [ ] แสดง loading state (skeleton)
- [ ] แสดง error state พร้อมปุ่ม retry
- [ ] Normalize field ตาม API_SPEC §11 (`conv_id`, `unread_customer/factory`, `has_quote`, ฯลฯ)
- [ ] Unread badge ใช้ค่า `unread` ตาม role ของ user
- [ ] เลือก conversation → ChatRoom โหลดข้อความด้วย `messagesApi.listByConversation(convId)`
- [ ] ถ้า BE `/conversations` ยังไม่พร้อม → หน้าไม่พัง (empty + toast)

### ทั่วไป
- [ ] `npm run build` ผ่าน
- [ ] ไม่เพิ่ม endpoint ใน `api.ts` (ทุก method ที่ต้องใช้มีแล้ว)
- [ ] ไม่แตะ backend

---

*สิ้นสุด spec v1.0 — พร้อม implement ได้ทันที*
