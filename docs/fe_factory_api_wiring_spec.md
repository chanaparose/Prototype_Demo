# FE Spec — Factory Portal API Wiring Gaps

**โปรเจกต์:** Wemake Platform — Factory Portal (`src/app/pages/factory-portal/*`)
**วันที่:** 7 เมษายน 2026
**ผู้วิเคราะห์:** System Analyst
**เวอร์ชัน:** 1.1 (FE-only pivot)
**อ้างอิง:**
- `docs/factory_user_flow_analysis.md` v1.3 (single source of truth สำหรับ flow)
- `docs/system_analysis_flow.md` v2.2 (DB + API gaps)
- `src/app/services/api.ts` (client methods ปัจจุบัน)

**ขอบเขต:** วิเคราะห์เฉพาะฝั่ง **frontend** ว่า code หน้า factory ปัจจุบันยังไม่ได้ wire API ส่วนไหนบ้างเทียบกับ flow ที่ออกแบบไว้ พร้อมระบุ:
- ต้องเพิ่ม client method ใน `api.ts` หรือไม่
- ต้องสร้าง component/page ใหม่หรือปรับของเดิม
- ลำดับ priority

---

## สารบัญ
1. [Executive Summary](#1-executive-summary)
2. [Page-by-Page Audit](#2-page-by-page-audit)
3. [Missing API Client Methods](#3-missing-api-client-methods-ที่ต้องเพิ่มใน-apits)
4. [New Components / Pages ที่ต้องสร้าง](#4-new-components--pages-ที่ต้องสร้าง)
5. [Implementation Priority](#5-implementation-priority)
6. [PR Checklist](#6-pr-checklist)

---

## 0. Addendum v1.1 — FE-only Scope (สำคัญที่สุด อ่านก่อน)

> **นโยบายล่าสุด:** Backend **ยังไม่เพิ่ม endpoint ใหม่** ในรอบนี้
> Frontend ต้องทำเท่าที่ใช้ **endpoint ที่มีอยู่แล้วใน `src/app/services/api.ts`** เท่านั้น
> ส่วนที่ต้องรอ BE ให้ "พักไว้" (ใส่ TODO comment + ไม่สร้าง UI ที่ค้าง)

### 0.1 สิ่งที่ทำได้ทันที (FE-only, ไม่ต้องแตะ BE)

| # | งาน | หน้าที่กระทบ | API ที่ใช้ (มีอยู่แล้ว) |
|---|-----|-------------|------------------------|
| A1 | แทน `FACTORY_ANALYTICS_MOCK` ด้วยสถิติคำนวณฝั่ง client | `FactoryDashboardPage` | `rfqsApi.list('OP')`, `ordersApi.list()`, `quotationsApi.listMine()` (graceful 404 → []), `walletApi.getMe()` |
| A2 | สร้างหน้า `FactoryQuotationsPage` (รายการใบเสนอราคาของฉัน) + route `/factory/quotations` | ใหม่ | `quotationsApi.listMine()` (Phase 1.5 เพิ่มแล้ว) — fallback empty ถ้า 404 |
| A3 | เพิ่ม Status Tabs (PR / QC / SH / CP) ใน Orders | `FactoryOrdersPage` | `ordersApi.list()` + filter ฝั่ง client |
| A4 | Auto-create conversation หลังกดส่งใบเสนอราคาสำเร็จ | `FactoryRfqDetailPage` | `conversationsApi.create()` (มีอยู่) |
| A5 | แสดง verify badge + ที่อยู่จาก `addressesApi` | `FactoryProfilePage` | `factoriesApi.get`, `addressesApi.list/create/update` |
| A6 | กรอง showcase เฉพาะของโรงงานปัจจุบัน (client-side) | `FactoryShowcasesPage` | `showcasesApi.list()` |
| A7 | ใส่ disclaimer "PromptPay flow กำลังพัฒนา" + คงประวัติธุรกรรม | `FactoryWalletPage` | `transactionsApi.list()`, `walletApi.getMe()` |

### 0.2 สิ่งที่ "พักไว้" รอ BE (อย่าเพิ่งทำ)

ห้ามสร้าง UI ที่จะค้างเพราะไม่มี endpoint รองรับ — ให้ใส่ `// TODO(BE):` comment ไว้ในจุดเดิมเท่านั้น:

- ❌ PromptPay top-up modal / withdraw form (ต้องรอ `/wallet/topup-intents`, `/withdrawals`)
- ❌ RFQ Matching score (ต้องรอ `/rfqs/matching`)
- ❌ Factory Dashboard endpoint รวม (`/factories/me/dashboard`)
- ❌ Factory categories editor (PUT `/factories/:id/categories`)
- ❌ Order activity timeline (`/orders/:id/activity`)
- ❌ Create shipment / Cancel order request (`/orders/:id/shipments`, `/cancel-request`)
- ❌ Delete certificate (`DELETE /factories/:id/certificates/:id`)

### 0.3 หลักการสำคัญ

1. **ไม่เพิ่ม method ใหม่ใน `api.ts`** ในรอบนี้ (ยกเว้นที่เพิ่มไปแล้วใน Phase 1.5: `quotationsApi.listMine`, `quotationsApi.history`)
2. **Graceful fallback:** ถ้า endpoint คืน 404/501 → แสดง empty state + ข้อความ "ฟีเจอร์นี้กำลังพัฒนา" ห้าม crash
3. **คำนวณฝั่ง client** สำหรับ stats / filters / matching อย่างง่าย (จำนวน RFQ ที่เปิด, รายได้รวมจาก orders CP, จำนวน orders ตาม status)
4. **Section 2-6 ด้านล่าง** ของเอกสารนี้ยังเก็บไว้เป็น **reference สำหรับเฟสถัดไป** เมื่อ BE พร้อม — ไม่ต้อง implement ตอนนี้

### 0.4 Implementation Order (FE-only)

1. **A1** Dashboard de-mock — ผลกระทบสูงสุด ผู้ใช้เห็นข้อมูลจริงทันที
2. **A3** Orders tabs — ใช้งานได้เลย
3. **A2** FactoryQuotationsPage — ปลดล็อกการใช้ Phase 1.5 edit page
4. **A4** Auto-conversation — UX ดีขึ้นหลังเสนอราคา
5. **A6** Showcases filter — แก้ noise ในหน้า
6. **A5** Profile addresses — งานเสริม
7. **A7** Wallet disclaimer — งานเสริม

### 0.5 PR Checklist (FE-only round)

- [ ] A1 Dashboard ใช้ข้อมูลจริง ไม่มี import `FACTORY_ANALYTICS_MOCK`
- [ ] A2 `/factory/quotations` route + page ทำงาน, edit link ไป Phase 1.5 page ได้
- [ ] A3 Orders มี tabs PR/QC/SH/CP filter ถูกต้อง
- [ ] A4 ส่งใบเสนอราคาแล้วเปิด conversation อัตโนมัติ
- [ ] A5 Profile แสดง addresses + verify badge
- [ ] A6 Showcases เห็นเฉพาะของ factory ตัวเอง
- [ ] A7 Wallet มี disclaimer PromptPay
- [ ] ทุกหน้ามี graceful 404 handling
- [ ] ไม่มี method ใหม่ใน `api.ts` (นอกจาก Phase 1.5)
- [ ] TODO(BE) comment ครบทุกจุดที่พักไว้

---

> ส่วนด้านล่าง (Section 1-6) เป็น **reference สำหรับเฟสถัดไป** เมื่อ BE พร้อมเพิ่ม endpoint ใหม่ — **ไม่ต้อง implement ในรอบนี้**

---

## 1. Executive Summary

ปัจจุบัน factory portal มี 9 หน้าใน `src/app/pages/factory-portal/`:

| ไฟล์ | API wiring สถานะ | Critical gap |
|------|------------------|--------------|
| `FactoryPortalLayout.tsx` | N/A (layout) | — |
| `FactoryDashboardPage.tsx` | ❌ ใช้ `FACTORY_ANALYTICS_MOCK` ทั้งหน้า | ไม่เรียก API จริงเลย |
| `FactoryRfqBoardPage.tsx` | ⚠️ ใช้ `rfqsApi.list('OP')` แต่ไม่ได้กรองตาม category/sub_category ของ factory | ไม่มี matching |
| `FactoryRfqDetailPage.tsx` | ✅ wire ดีแล้ว (get, listQuotations, createQuotation, patch, delete) | — |
| `FactoryEditQuotationPage.tsx` | ✅ wire ดีแล้ว (Phase 1.5) | รอ BE PATCH/history endpoint |
| `FactoryOrdersPage.tsx` | ⚠️ `ordersApi.list()` แล้ว filter `factory_id` ฝั่ง FE | ควรใช้ `?factory_id=me` |
| `FactoryOrderDetailPage.tsx` | ⚠️ ดี แต่ไม่มี shipment / activity log / cancel-request | ขาดหลายส่วนใน flow |
| `FactoryProfilePage.tsx` | ⚠️ มีแค่ basic info + certs ขาด categories, sub-categories, addresses | ผิด flow Step 2 |
| `FactoryShowcasesPage.tsx` | ✅ wire CRUD แล้ว | ขาด `sub_category_id` field (รอ BE) |
| `FactoryWalletPage.tsx` | ❌ ใช้ `transactionsApi.create('WD')` แทน PromptPay flow | ผิด policy v2.2 |

**สรุป gap หลัก:**
1. **Dashboard** ยังเป็น mock ทั้งหน้า — ต้องเปลี่ยนไปใช้ API จริง
2. **RFQ Board** ไม่มี matching — ต้องใช้ `GET /rfqs/matching` หรือ `?for_factory=me` (BE ต้องสร้าง)
3. **Orders** ใช้ filter ฝั่ง FE — ควรใช้ query param ฝั่ง BE
4. **Profile** ขาดส่วน category/sub-category mapping (PUT endpoint), addresses
5. **Wallet** ใช้ `transactions` แบบเก่า — ต้องเปลี่ยนเป็น **PromptPay flow** (top-up QR + withdrawal request) ตาม `system_analysis_flow.md` §11
6. **Order Detail** ขาด audit log timeline (`/orders/:id/activity`) + shipment + cancel-request
7. **My Quotations list** ไม่มีหน้า — ต้องสร้าง (F2 ใน flow doc) ใช้ `quotationsApi.listMine()` ที่เพิ่มไว้แล้วใน Phase 1.5

---

## 2. Page-by-Page Audit

### 2.1 `FactoryDashboardPage.tsx` ❌ Mock ทั้งหน้า

**สถานะปัจจุบัน:**
```ts
import { FACTORY_ANALYTICS_MOCK } from '../../data/factoryAnalyticsMock';
```
ไม่มีการเรียก API ใดเลย ใช้ mock object ตรงๆ ในการ render charts

**Flow ที่ควรเป็น (`factory_user_flow_analysis.md` §3 Screen 5):**
- Dashboard ดึง: ยอด RFQ ใหม่, จำนวน quotations ที่ pending, จำนวน orders active, รายได้รวม, settlement pending
- Endpoint: **`GET /factories/me/dashboard`** — ❌ BE ยังไม่มี (ระบุใน §5 ตาราง Missing API)

**ที่ต้องทำใน FE:**
- เพิ่ม `factoriesApi.getDashboard()` ใน `api.ts` (GET `/factories/me/dashboard`)
- สร้าง hook `useFactoryDashboard()` ใน `pages/factory-portal/hooks/`
- เปลี่ยน `FactoryDashboardPage.tsx` ให้:
  - เรียก hook → loading/error state
  - Map response → chart data
  - **Fallback:** ถ้า BE 404 ให้แสดง empty state + hint "ฟีเจอร์อยู่ระหว่างพัฒนา" แทน mock
- ลบการ import `FACTORY_ANALYTICS_MOCK`
- ลบไฟล์ `src/app/data/factoryAnalyticsMock.ts` (หรือ keep ไว้เป็น dev fixture แต่อย่า import จากหน้า)

**Priority:** High (เป็นหน้าแรกที่ user เห็นหลัง login)

---

### 2.2 `FactoryRfqBoardPage.tsx` ⚠️ ขาด matching

**สถานะปัจจุบัน:**
```ts
const raw = await rfqsApi.list('OP');  // ดึง RFQ ทุกใบที่สถานะ Open
```
ไม่กรองตาม category/sub-category ของโรงงาน → factory เห็น RFQ ทุกใบในระบบ ผิด business logic

**Flow ที่ควรเป็น (Step 6 ใน system_analysis):**
- BE ต้อง implement `GET /rfqs/matching` หรือ `GET /rfqs?for_factory=me` ที่ใช้ JWT แล้ว join `map_factory_categories` → คืนเฉพาะ RFQ ที่ category ตรง
- FE เรียก endpoint นี้แทน

**ที่ต้องทำใน FE:**
- เพิ่ม `rfqsApi.matching()` ใน `api.ts`:
  ```ts
  matching: () => api.get<unknown[]>('/rfqs/matching'),
  ```
- ใน `FactoryRfqBoardPage.tsx` ให้เรียก `rfqsApi.matching()` ก่อน, ถ้า 404 fallback `rfqsApi.list('OP')` พร้อมแสดง warning banner "ระบบ matching ยังไม่พร้อม — แสดง RFQ ทั้งหมด"
- เพิ่ม dropdown filter sub-category (อ่านจาก `categoriesApi.subCategories` ตาม category ของ factory)
- เพิ่ม empty state ที่บอกชัดว่า "ไม่มี RFQ ที่ตรงกับหมวดของโรงงาน"

**Priority:** Critical (ผิด business rule ตอนนี้)

---

### 2.3 `FactoryRfqDetailPage.tsx` ✅ OK

**สถานะปัจจุบัน:** wire ครบ (`get`, `listQuotations`, `createQuotation`, `patch`, `delete`, `updateStatus`, `shippingMethods`)

**ส่วนที่ยังขาด (minor):**
- เมื่อ submit quote ใหม่แล้ว ไม่ trigger conversation creation อัตโนมัติ — ตาม flow ควร `POST /conversations { customer_id, factory_id }` เพื่อเปิดห้องแชท
- ไม่มีปุ่ม "Decline RFQ" (F8 ใน factory_user_flow_analysis.md §8.1)

**ที่ต้องทำใน FE:**
- เพิ่ม `conversationsApi.create()` call หลัง createQuotation สำเร็จ (มี method แล้วใน api.ts)
- เพิ่มปุ่ม Decline → เรียก endpoint ใหม่ `POST /rfqs/:id/decline` (BE ต้องสร้าง)

**Priority:** Medium

---

### 2.4 `FactoryEditQuotationPage.tsx` ✅ Phase 1.5 Done

**สถานะปัจจุบัน:** wire `quotationsApi.get`, `patch`, `history` พร้อม audit timeline + lock UI ครบ

**ส่วนที่รอ:** BE implement `PATCH /quotations/:id` + `GET /quotations/:id/history` (ดู `factory_user_flow_analysis.md` §9.2)

**ที่ต้องทำใน FE:** ไม่มีเพิ่มเติม

---

### 2.5 `FactoryOrdersPage.tsx` ⚠️ filter ฝั่ง FE

**สถานะปัจจุบัน:**
```ts
const raw = await ordersApi.list();   // ดึงทุก order
const mine = normalized.filter((r) => orderFactoryId(r.raw) === fid);  // filter ฝั่ง FE
```
สิ้นเปลือง bandwidth + อาจ leak ข้อมูล order ของโรงงานอื่นถ้า BE ไม่ได้กรองสิทธิ์

**Flow ที่ควรเป็น (Step 11):**
- BE ต้องมี `GET /orders?factory_id=me` (ระบุใน Missing API)

**ที่ต้องทำใน FE:**
- เพิ่ม `ordersApi.listMine()` ใน `api.ts`:
  ```ts
  listMine: () => api.get<unknown[]>('/orders?factory_id=me'),
  ```
- เปลี่ยน `FactoryOrdersPage.tsx` เรียก `ordersApi.listMine()` แล้ว fallback `list()` + filter ฝั่ง FE ถ้า BE ยังไม่รองรับ
- เพิ่ม filter status (PR/QC/SH/CP) เป็น tabs

**Priority:** Critical (security/perf)

---

### 2.6 `FactoryOrderDetailPage.tsx` ⚠️ ขาดหลายส่วน

**สถานะปัจจุบัน:** wire `ordersApi.get`, `listProductionUpdates`, `addProductionUpdate`, `updateStatus`, `factoriesApi.get`, `masterApi.productionSteps`, `mediaApi.upload`

**ที่ขาดเทียบ flow:**
| ฟีเจอร์ | Endpoint | สถานะ FE |
|---------|----------|---------|
| Activity log timeline | `GET /orders/:id/activity` | ❌ ไม่มี |
| Shipment + tracking | `POST /orders/:id/shipments` | ❌ ไม่มี |
| Cancel order request | `POST /orders/:id/cancel-request` | ❌ ไม่มี |
| Edit production update | `PATCH /production-updates/:id` | ⚠️ มี client method แต่ไม่มี UI |
| Production update history | `GET /production-updates/:id/history` | ❌ ไม่มี |

**ที่ต้องทำใน FE:**
- เพิ่ม `ordersApi.activity(id)`, `ordersApi.createShipment(id, data)`, `ordersApi.cancelRequest(id, reason)` ใน `api.ts`
- เพิ่ม section "ประวัติการกระทำ" ใต้หน้า order — แสดง timeline จาก `/orders/:id/activity`
- เพิ่มปุ่ม "บันทึกการจัดส่ง" → modal กรอก tracking_no + courier
- เพิ่มปุ่ม "ขอยกเลิก order" (เฉพาะ status PR) → modal กรอกเหตุผล
- เพิ่มปุ่ม edit production update (pencil icon) → เรียก `productionUpdatesApi.patch()` ที่มีอยู่แล้ว

**Priority:** High

---

### 2.7 `FactoryProfilePage.tsx` ⚠️ ขาด categories/addresses

**สถานะปัจจุบัน:** wire `factoriesApi.get/update`, `certificatesApi.listByFactory/create`, `mediaApi.upload`
มี form: name, email, phone, address (string), description, certificates

**ที่ขาดเทียบ flow (Step 2 + 4):**
| ฟีเจอร์ | Endpoint | สถานะ |
|---------|----------|------|
| Categories ที่รับผลิต | `PUT /factories/:id/categories` | ❌ BE ไม่มี + FE ไม่มี UI |
| Sub-categories | `PUT /factories/:id/sub-categories` | ❌ BE ไม่มี + FE ไม่มี UI |
| Address แบบ structured | `addressesApi.list/create/update` | ⚠️ มี client method แต่ Profile ใช้ string ธรรมดา |
| Verify status display | `factory_profiles.is_verified` | ❌ ไม่แสดง |
| Delete certificate | `DELETE /factories/:id/certificates/:cert_id` | ❌ ไม่มี |

**ที่ต้องทำใน FE:**
- เพิ่ม `factoriesApi.setCategories(fid, ids)`, `factoriesApi.setSubCategories(fid, ids)` ใน `api.ts`
- เพิ่ม section "หมวดหมู่ที่รับผลิต" ใน Profile:
  - โหลด categories ทั้งหมดจาก `categoriesApi.list()` (ต้องเพิ่ม)
  - แสดงเป็น multi-select / chip
  - submit → `factoriesApi.setCategories`
  - cascade sub-categories จาก `categoriesApi.subCategories`
- เพิ่ม section "ที่อยู่" ใช้ `addressesApi` (มี client method ครบแล้ว)
- เพิ่ม badge "✅ Verified" / "⏳ รอแอดมินตรวจ" บน header
- เพิ่มปุ่มลบใบรับรอง (ต้องเพิ่ม `certificatesApi.delete()` ใน api.ts)

**Priority:** Critical (โรงงานที่ไม่มี category จะไม่ปรากฏใน matching)

---

### 2.8 `FactoryShowcasesPage.tsx` ✅ พื้นฐาน OK

**สถานะปัจจุบัน:** wire `showcasesApi.list/create/update/delete`, `masterApi.productCategories`, `mediaApi.upload`

**ส่วนที่ยังขาด:**
- `sub_category_id` field ในฟอร์ม (รอ BE เพิ่ม column ใน `factory_showcases`)
- Filter ตาม `factory_id=me` — ปัจจุบันอาจดึง showcase ทุกโรงงาน

**ที่ต้องทำใน FE:**
- เพิ่ม dropdown sub-category ในฟอร์ม create/edit (จะทำงานเมื่อ BE พร้อม)
- เปลี่ยน `showcasesApi.list(type)` เป็น `showcasesApi.listMine(type)` (ต้องเพิ่ม method + BE endpoint)

**Priority:** Medium

---

### 2.9 `FactoryWalletPage.tsx` ❌ ผิด policy v2.2

**สถานะปัจจุบัน:**
```ts
await transactionsApi.create({ wallet_id, type: 'WD', amount });
```
ใช้ `transactions.create` ตรงๆ ในการถอนเงิน — **ผิด** PromptPay-only policy ของ `system_analysis_flow.md` §11

**Flow ที่ควรเป็น:**
- **Top-up:** ผู้ใช้กดเติมเงิน → `POST /wallet/topup-intents { amount }` → แสดง QR → polling status
- **Withdraw:** ผู้ใช้กรอก promptpay_target + amount → `POST /withdrawals` → admin approve → status update

**ที่ต้องทำใน FE:**
- เพิ่ม API client methods (ดู §3 ของเอกสารนี้):
  - `walletApi.createTopupIntent(amount)`
  - `walletApi.getTopupIntent(id)`
  - `withdrawalsApi.create(...)`
  - `withdrawalsApi.listMine()`
  - `withdrawalsApi.get(id)`
- สร้าง 2 component ใหม่ใน `pages/factory-portal/components/`:
  - `TopupQRModal.tsx` — รับ amount → call createTopupIntent → render QR (ใช้ lib `qrcode.react`) → polling 3s → success
  - `WithdrawRequestForm.tsx` — radio (เบอร์/บัตรประชาชน) + target + account_name + amount → submit
- ใน `FactoryWalletPage.tsx`:
  - ลบฟอร์ม withdraw แบบเก่าที่เรียก `transactionsApi.create`
  - เพิ่มปุ่ม "เติมเงิน" เปิด TopupQRModal
  - เพิ่มปุ่ม "ถอนเงิน" เปิด WithdrawRequestForm
  - เพิ่ม section "ประวัติคำขอถอน" จาก `withdrawalsApi.listMine()`
- เก็บ `transactionsApi.list()` ไว้สำหรับ section "รายการเคลื่อนไหว wallet" เหมือนเดิม

**Priority:** Critical (ใช้งานจริงแล้วจะถอนเงินผิดวิธี + ผิด policy)

---

## 3. Missing API Client Methods ที่ต้องเพิ่มใน `api.ts`

ทั้งหมดนี้ **frontend ต้องเพิ่ม** (BE มี/ไม่มี endpoint จะ handle ด้วย try/catch fallback)

```ts
// ─── factoriesApi (เพิ่ม) ─────────────────────────────────────────
export const factoriesApi = {
  // ... methods เดิม
  getDashboard: () => api.get<Record<string, unknown>>('/factories/me/dashboard'),
  setCategories: (fid: number | string, categoryIds: number[]) =>
    api.put<unknown>(`/factories/${fid}/categories`, { category_ids: categoryIds }),
  setSubCategories: (fid: number | string, subCategoryIds: number[]) =>
    api.put<unknown>(`/factories/${fid}/sub-categories`, { sub_category_ids: subCategoryIds }),
};

// ─── rfqsApi (เพิ่ม) ──────────────────────────────────────────────
export const rfqsApi = {
  // ... methods เดิม
  matching: () => api.get<unknown[]>('/rfqs/matching'),
};

// ─── ordersApi (เพิ่ม) ────────────────────────────────────────────
export const ordersApi = {
  // ... methods เดิม
  listMine: () => api.get<unknown[]>('/orders?factory_id=me'),
  activity: (orderId: number | string) =>
    api.get<unknown[]>(`/orders/${orderId}/activity`),
  createShipment: (
    orderId: number | string,
    data: { courier: string; tracking_no: string; note?: string },
  ) => api.post<Record<string, unknown>>(`/orders/${orderId}/shipments`, data),
  listShipments: (orderId: number | string) =>
    api.get<unknown[]>(`/orders/${orderId}/shipments`),
  cancelRequest: (orderId: number | string, reason: string) =>
    api.post<unknown>(`/orders/${orderId}/cancel-request`, { reason }),
};

// ─── showcasesApi (เพิ่ม) ─────────────────────────────────────────
export const showcasesApi = {
  // ... methods เดิม
  listMine: (type?: string) =>
    api.get<unknown[]>(`/showcases?factory_id=me${type ? `&type=${type}` : ''}`),
};

// ─── certificatesApi (เพิ่ม) ──────────────────────────────────────
export const certificatesApi = {
  // ... methods เดิม
  delete: (factoryId: number | string, certId: number | string) =>
    api.delete(`/factories/${factoryId}/certificates/${certId}`),
};

// ─── walletApi (ขยาย) ─────────────────────────────────────────────
export const walletApi = {
  getMe: () => api.get<Record<string, unknown>>('/wallets/me'),
  // PromptPay top-up
  createTopupIntent: (amount: number) =>
    api.post<Record<string, unknown>>('/wallet/topup-intents', { amount }),
  getTopupIntent: (id: string) =>
    api.get<Record<string, unknown>>(`/wallet/topup-intents/${id}`),
  cancelTopupIntent: (id: string) =>
    api.post<unknown>(`/wallet/topup-intents/${id}/cancel`, {}),
};

// ─── withdrawalsApi (ใหม่ทั้งหมด) ────────────────────────────────
export const withdrawalsApi = {
  create: (data: {
    amount: number;
    promptpay_type: 'PH' | 'CI';
    promptpay_target: string;
    account_name: string;
  }) => api.post<Record<string, unknown>>('/withdrawals', data),
  listMine: () => api.get<unknown[]>('/withdrawals/me'),
  get: (id: number | string) =>
    api.get<Record<string, unknown>>(`/withdrawals/${id}`),
  cancel: (id: number | string) =>
    api.post<unknown>(`/withdrawals/${id}/cancel`, {}),
};

// ─── categoriesApi (เพิ่ม list ถ้ายังไม่มี) ──────────────────────
export const categoriesApi = {
  list: () => api.get<unknown[]>('/categories'),  // ถ้ายังไม่มี
  subCategories: (categoryId: string | number) =>
    api.get<unknown[]>(`/categories/${categoryId}/sub-categories`),  // มีแล้ว
};
```

---

## 4. New Components / Pages ที่ต้องสร้าง

| ไฟล์ | จุดประสงค์ | ใช้ใน |
|------|----------|------|
| `pages/factory-portal/FactoryQuotationsPage.tsx` | List ใบเสนอราคาทั้งหมดของ factory (F2) | route `/factory/quotations` |
| `pages/factory-portal/components/TopupQRModal.tsx` | Modal เติมเงิน PromptPay (F23) | `FactoryWalletPage` |
| `pages/factory-portal/components/WithdrawRequestForm.tsx` | Form ถอนเงิน PromptPay (F24) | `FactoryWalletPage` |
| `pages/factory-portal/components/OrderActivityTimeline.tsx` | Timeline แสดง activity log | `FactoryOrderDetailPage` |
| `pages/factory-portal/components/CreateShipmentModal.tsx` | กรอก tracking + courier | `FactoryOrderDetailPage` |
| `pages/factory-portal/components/CancelOrderModal.tsx` | กรอกเหตุผลขอยกเลิก | `FactoryOrderDetailPage` |
| `pages/factory-portal/components/FactoryCategoriesEditor.tsx` | Multi-select categories + sub-categories | `FactoryProfilePage` |
| `pages/factory-portal/hooks/useFactoryDashboard.ts` | Hook ดึง dashboard data | `FactoryDashboardPage` |

### Route registration ที่ต้องเพิ่มใน `routes.ts`

```ts
// ใน factory-portal children
{ path: 'quotations', Component: FactoryQuotationsPage },
// route 'quotations/:id/edit' มีอยู่แล้วจาก Phase 1.5
```

---

## 5. Implementation Priority

### 🔴 Phase A — Critical Fixes (Sprint 1, ~3 วัน)
ทำได้เลยโดยไม่รอ BE เพิ่ม endpoint:

1. **FactoryWalletPage** — เปลี่ยนเป็น PromptPay flow
   - เพิ่ม `walletApi.createTopupIntent/getTopupIntent` + `withdrawalsApi.*`
   - สร้าง `TopupQRModal`, `WithdrawRequestForm`
   - ลบโค้ด `transactionsApi.create('WD')` แบบเก่า
   - **Fallback:** ถ้า BE ยังไม่มี endpoint → แสดง toast "ฟีเจอร์ใกล้พร้อม" + disable ปุ่ม

2. **FactoryOrdersPage** — ใช้ `?factory_id=me`
   - เพิ่ม `ordersApi.listMine()`
   - try `listMine()` → catch fallback `list()` + filter

3. **FactoryProfilePage** — เพิ่ม categories editor + verify badge
   - เพิ่ม `factoriesApi.setCategories/setSubCategories`
   - สร้าง `FactoryCategoriesEditor`
   - แสดง verify badge จาก `is_verified`

### 🟡 Phase B — High Priority (Sprint 2, ~3 วัน)

4. **FactoryDashboardPage** — เปลี่ยนจาก mock เป็น API
   - เพิ่ม `factoriesApi.getDashboard()`
   - สร้าง `useFactoryDashboard` hook
   - แสดง empty state ถ้า BE ยังไม่พร้อม
   - ลบ import `FACTORY_ANALYTICS_MOCK`

5. **FactoryRfqBoardPage** — ใช้ matching
   - เพิ่ม `rfqsApi.matching()`
   - try matching → catch fallback list + warning banner
   - เพิ่ม sub-category filter dropdown

6. **FactoryOrderDetailPage** — เพิ่ม activity timeline + shipment + cancel
   - เพิ่ม `ordersApi.activity/createShipment/cancelRequest`
   - สร้าง `OrderActivityTimeline`, `CreateShipmentModal`, `CancelOrderModal`

### 🟢 Phase C — Medium (Sprint 3)

7. **FactoryQuotationsPage** ใหม่ — ใช้ `quotationsApi.listMine()` ที่มีอยู่แล้ว
8. **FactoryRfqDetailPage** — auto-create conversation + decline button
9. **FactoryShowcasesPage** — `listMine()` + sub_category dropdown
10. **FactoryProfilePage** — addresses section + delete cert button

---

## 6. PR Checklist

### Phase A
- [ ] `api.ts` มี `walletApi.createTopupIntent`, `getTopupIntent`, `cancelTopupIntent`
- [ ] `api.ts` มี `withdrawalsApi.create/listMine/get/cancel`
- [ ] `api.ts` มี `ordersApi.listMine`
- [ ] `api.ts` มี `factoriesApi.setCategories`, `setSubCategories`
- [ ] `TopupQRModal.tsx` render QR + polling status + countdown
- [ ] `WithdrawRequestForm.tsx` validate PromptPay format (`^0[6-9]\d{8}$` หรือ 13-digit citizen)
- [ ] `FactoryWalletPage` ไม่เรียก `transactionsApi.create('WD')` อีก
- [ ] `FactoryOrdersPage` try `listMine` → fallback `list`
- [ ] `FactoryProfilePage` มี section "หมวดหมู่ที่รับผลิต" พร้อม cascading
- [ ] `FactoryProfilePage` แสดง verify badge

### Phase B
- [ ] `api.ts` มี `factoriesApi.getDashboard`, `rfqsApi.matching`
- [ ] `api.ts` มี `ordersApi.activity`, `createShipment`, `cancelRequest`
- [ ] `FactoryDashboardPage` ไม่ import `FACTORY_ANALYTICS_MOCK`
- [ ] `FactoryDashboardPage` แสดง empty/loading/error state ถูกต้อง
- [ ] `FactoryRfqBoardPage` มี warning banner ถ้า fallback
- [ ] `FactoryOrderDetailPage` มี activity timeline + 2 modals (shipment/cancel)

### Phase C
- [ ] Route `/factory/quotations` register แล้ว
- [ ] `FactoryQuotationsPage` แสดง list จาก `quotationsApi.listMine()` พร้อม link ไปหน้า edit
- [ ] `showcasesApi.listMine` + dropdown sub_category
- [ ] `certificatesApi.delete` ใช้งานได้

### ทั่วไป
- [ ] `npm run build` ผ่าน
- [ ] ทุก fetch ใหม่มี try/catch + fallback ที่ไม่ทำให้หน้าพัง
- [ ] ไม่มี import จาก `factoryAnalyticsMock` หรือ mockData อื่นใน factory-portal

---

## 7. Notes สำหรับ Dev

1. **ห้ามลบ API client method เดิม** ใน `api.ts` แม้ว่าจะ deprecated เพราะหน้าอื่นอาจยังใช้
2. **ทุก endpoint ใหม่** ต้องมี try/catch fallback graceful — เพราะ BE อาจยังไม่ implement ตอนที่ FE merge
3. **อย่าเอา business logic ไปไว้ฝั่ง FE** — เช่น filter `factory_id` ฝั่ง client เป็นแค่ workaround ระยะสั้น เมื่อ BE พร้อมต้อง remove
4. **Phase 1.5 ที่ทำเสร็จแล้ว** (`FactoryEditQuotationPage` + `quotationsApi.history/listMine`) ไม่ต้องแตะ
5. PromptPay QR render: แนะนำ lib `qrcode.react` (`npm i qrcode.react`) — รับ `value={qr_payload}` ตรงๆ

---

*สิ้นสุด spec v1.0 — พร้อม implement ตามลำดับ Phase A → B → C*
