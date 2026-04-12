# Factory User Flow Analysis — Wemake Platform

**โปรเจกต์:** Wemake Platform (ฝั่งโรงงาน / Factory User)
**วันที่วิเคราะห์:** 7 เมษายน 2026
**ผู้วิเคราะห์:** System Analyst
**เวอร์ชัน:** 1.3 (PromptPay-only wallet flow)
**เอกสารอ้างอิง:**
- `docs/system_analysis_flow.md` v2.0 (ฝั่ง Customer + DB schema)
- `docs/new_api_specs_for_fe.md`
- `docs/missing_api_endpoints.md`
- `src/app/pages/factory-portal/*`

**Legend:** ✅ มีอยู่แล้ว (exists) · ⚠️ มีบางส่วน (partial) · ❌ ขาด (missing)

---

## สารบัญ

1. [Executive Summary](#1-executive-summary)
2. [Complete Factory User Flow Diagram](#2-complete-factory-user-flow-diagram)
3. [Screen-by-Screen Analysis](#3-screen-by-screen-analysis)
4. [Missing DB Tables / Fields Summary](#4-missing-db-tables--fields-summary)
5. [Missing API Endpoints Summary](#5-missing-api-endpoints-summary)
6. [New Proposed Flow Summary](#6-new-proposed-flow-summary)
7. [Recommended Implementation Phases](#7-recommended-implementation-phases)

---

## 1. Executive Summary

Factory User คือบทบาท `users.role = 'FT'` ที่ใช้ระบบเพื่อ:
1. ตั้งค่าโปรไฟล์โรงงาน + categories/sub-categories ที่รับผลิต
2. รอ admin verify (`factory_profiles.is_verified`)
3. ดู RFQ ที่ระบบ match ตาม category → ส่ง quotation (BOQ)
4. รับ order เมื่อลูกค้าเลือก → ผลิต → อัปเดต production steps
5. รับเงินเข้า wallet (settlement) → ถอนเข้าบัญชีธนาคาร
6. โพสต์ showcase / ตอบรีวิว / แชทกับลูกค้า

### ภาพรวมหน้าจอที่มีอยู่ในโค้ด (`src/app/pages/factory-portal/`)

| หน้า | สถานะ |
|------|------|
| `FactoryPortalLayout.tsx` | ✅ Layout + sidebar |
| `FactoryDashboardPage.tsx` | ✅ Dashboard |
| `FactoryRfqBoardPage.tsx` | ⚠️ matching RFQ list (ใช้ filter ฝั่ง FE) |
| `FactoryRfqDetailPage.tsx` | ⚠️ RFQ detail + submit quote |
| `FactoryOrdersPage.tsx` | ⚠️ Order list |
| `FactoryOrderDetailPage.tsx` | ⚠️ Order detail + production updates |
| `FactoryShowcasesPage.tsx` | ⚠️ Showcase CRUD (มี POST แต่ขาด PATCH/DELETE BE) |
| `FactoryProfilePage.tsx` | ⚠️ Profile (ไม่ครอบคลุม categories/certificates) |
| `FactoryWalletPage.tsx` | ⚠️ Wallet (ยังไม่มี PromptPay top-up / withdraw) |

### Findings สำคัญ

- **Critical:** ไม่มี API ให้โรงงานดู "RFQ ที่ match กับฉัน" (`GET /rfqs/matching` หรือ `GET /rfqs?factory_id=me`)
- **Critical:** ไม่มี API ให้โรงงานดู "order ของฉัน" (`GET /orders?factory_id=me`)
- **Critical:** ไม่มี settlement API (เงินไม่เข้า wallet จริง)
- **Critical:** ไม่มี PromptPay top-up / withdrawal flow (ระบบใช้ PromptPay เท่านั้น)
- **High:** Showcase ขาด `PATCH` / `DELETE` endpoint และฟิลด์ `sub_category_id`
- **High:** Quotation ขาด `PATCH` (แก้ไขเนื้อหา ไม่ใช่แค่ status)
- **High:** ไม่มี API จัดการ category/sub-category mapping ของโรงงาน
- **High:** ไม่มี admin verify flow (โรงงานติดอยู่ใน "pending" ตลอดไป)
- **Medium:** ไม่มี notification trigger เมื่อมี RFQ ใหม่ match
- **Medium:** ไม่มี read receipt / mark all read สำหรับ chat

ระบบรองรับ Factory User Flow ได้ประมาณ **55-60%**

---

## 2. Complete Factory User Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FACTORY USER LIFECYCLE                       │
└──────────────────────────────────────────────────────────────────────┘

(A) AUTH & ONBOARDING
   [1] Register (role=FT) ──► [2] Login ──► [3] Pending Verification
                                                  │
                                       (admin verifies in admin panel)
                                                  ▼
                                    [4] Onboarding Wizard
                                        ├── Profile (factory_profiles)
                                        ├── Categories (map_factory_categories)
                                        ├── Sub-categories (map_factory_sub_categories)
                                        ├── Certificates (factory_certificates)
                                        └── Address (address)
                                                  │
                                                  ▼
(B) DASHBOARD
                                          [5] Dashboard
                  ┌──────────────┬─────────┴────────┬──────────────┐
                  ▼              ▼                  ▼              ▼
(C) RFQ          (D) ORDERS    (E) SHOWCASES   (F) PROFILE     (G) WALLET
                                                                 (H) CHAT
                                                                 (I) REVIEWS

(C) RFQ MANAGEMENT (Inbound work)
   [6] Matching RFQ List ──► [7] RFQ Detail ──► [8] Submit Quotation (BOQ)
                                                       │
                                                       ▼
                                              [9] My Quotations List
                                                       │
                                          ┌────────────┼─────────────┐
                                          ▼            ▼             ▼
                                       PD (Pending) AC (Accepted) RJ (Rejected)
                                          │            │
                                  [10] Edit Quote      └──► creates Order
                                                                 │
(D) ORDER MANAGEMENT                                             ▼
   [11] My Orders List ──► [12] Order Detail
                                  │
                                  ├──► [13] Add Production Update (photo, status)
                                  └──► [14] Mark Shipped / Final Delivery
                                              │
                                              ▼
                                  Customer closes order
                                              │
                                              ▼
                                  Settlement → Wallet (G)

(E) SHOWCASE MANAGEMENT
   [15] My Showcases List
        ├──► [16] Create Showcase (PD requires sub_category_id)
        ├──► [17] Edit Showcase
        ├──► [18] Delete Showcase
        └──► [19] Showcase Analytics (likes/views)

(F) PROFILE MANAGEMENT
   [20] View / Edit Profile
        ├──► [21] Manage Categories & Sub-categories
        ├──► [22] Manage Certificates (upload, expiry)
        ├──► [23] Manage Addresses
        └──► [24] Edit Description / Image / Specialization

(G) WALLET & FINANCE  (PromptPay-only)
   [25] Wallet Overview (good_fund / pending_fund)
        ├──► [26] Transaction History / Top-up (PromptPay QR)
        └──► [27] Withdraw via PromptPay (target = phone / citizen_id)

(H) COMMUNICATION
   [29] Conversations List ──► [30] Chat Detail (TX / QT messages)
   [31] Notifications (RFQ matched, order paid, payment due, review)

(I) REVIEWS
   [32] Reviews from customers ──► [33] Reply (optional)
```

---

## 3. Screen-by-Screen Analysis

### A. Authentication & Onboarding

#### Screen 1 — Register as Factory (role=FT)

1. **Purpose:** สมัครสมาชิกใหม่ในฐานะโรงงาน
2. **Data needed (read):** `lbi_factory_types` (dropdown ประเภทโรงงาน)
3. **Actions:** สร้าง `users` (role='FT') + `factory_profiles` (factory_name, factory_type_id, tax_id, is_verified=false)
4. **APIs:** ✅ `POST /auth/register` (รับ role='FT')
5. **Missing DB:** ❌ `users.avatar_url`, ❌ `factory_profiles.verified_at`, `verified_by`
6. **Missing API:** ❌ Email/Phone OTP verification
7. **Gaps:** ไม่มี validation tax_id format / ไม่มี duplicate check

---

#### Screen 2 — Login

1. **Purpose:** เข้าสู่ระบบ
2. **Data needed:** `users` (auth)
3. **Actions:** issue JWT
4. **APIs:** ✅ `POST /auth/login`
5. **Missing DB:** —
6. **Missing API:** ❌ refresh token, ❌ forgot password
7. **Gaps:** ต้องเช็ค `factory_profiles.is_verified` แล้ว redirect เข้า "Pending" ถ้ายังไม่ verify

---

#### Screen 3 — Pending Verification

1. **Purpose:** แสดง state รออนุมัติ — block การเสนอราคา / สร้าง showcase จนกว่าจะ verify
2. **Data needed:** `factory_profiles.is_verified`, `verified_at`
3. **Actions:** read-only
4. **APIs:** ✅ `GET /factories/me` (ใช้ดู status)
5. **Missing DB:** ❌ `verified_at`, `verified_by`, `rejection_reason`
6. **Missing API:** ❌ `PATCH /admin/factories/:id/verify`, ❌ `GET /admin/factories?status=pending`
7. **Gaps:** ไม่มี role admin ใน `users.role` (มีแค่ CT/FT) → admin panel ทำไม่ได้

---

#### Screen 4 — Onboarding Wizard (Profile + Categories + Sub-categories + Certificates + Address)

1. **Purpose:** ตั้งค่าข้อมูลครั้งแรกหลัง register
2. **Data needed (read):**
   - `lbi_categories`, `lbi_sub_categories`, `lbi_factory_types`, `lbi_certificates`
3. **Actions (write):**
   - `PATCH factory_profiles` (location, specialization, min_order, lead_time_desc, description, price_range, image_url)
   - `INSERT map_factory_categories` (factory_id, **category_id**)
   - `INSERT map_factory_sub_categories` (factory_id, **sub_category_id**)
   - `INSERT factory_certificates`
   - `POST address`
4. **APIs:**
   - ✅ `PATCH /factories/:id`
   - ✅ `POST /addresses/`
   - ✅ `POST /factories/:factory_id/certificates`
   - ❌ `PUT /factories/:id/categories` (set categories ทั้งชุด)
   - ❌ `PUT /factories/:id/sub-categories`
   - ✅ `POST /media/upload` (รูป profile + cert files)
5. **Missing DB:** —
6. **Missing API:** ❌ `PUT /factories/:id/categories`, ❌ `PUT /factories/:id/sub-categories`
7. **Gaps:** ไม่มี validation ขั้นต่ำ 1 category / ไม่มี wizard progress tracker / ไม่มี draft state

---

### B. Dashboard / Home

#### Screen 5 — Factory Dashboard

1. **Purpose:** ภาพรวม KPI ของโรงงาน
2. **Data needed:**
   - Pending RFQ count → JOIN `rfqs` × `map_factory_categories` WHERE `rfqs.status='OP'`
   - Active orders → `orders` WHERE `factory_id=me` AND `status IN (PR,WF,SH)`
   - Wallet balance → `wallets.good_fund`, `pending_fund`
   - Pending production updates → `production_updates.status='CR'`
   - Unread messages → `conversations.unread_factory`
   - Unread notifications → `notifications.is_read=false`
3. **Actions:** read-only
4. **APIs:**
   - ❌ `GET /factories/me/dashboard` (aggregated)
   - ⚠️ ใช้ `GET /wallets/me` ✅, `GET /conversations` ✅, `GET /notifications` ✅ แล้ว aggregate ฝั่ง FE
5. **Missing DB:** —
6. **Missing API:** ❌ `GET /factories/me/dashboard` (รวบยอด KPI)
7. **Gaps:** หลาย API call ทำให้ช้า — ควรมี aggregated endpoint คล้าย `/frontend/explore`

---

### C. RFQ Management

#### Screen 6 — Matching RFQ List

1. **Purpose:** ดู RFQ ที่ category/sub-category ตรงกับโรงงาน
2. **Data needed:** JOIN `rfqs` × `map_factory_categories` × `map_factory_sub_categories`, filter `status='OP'` และ `deadline_date >= NOW()`
3. **Actions:** filter, sort, pagination, click → detail
4. **APIs:**
   - ❌ `GET /rfqs/matching` หรือ `GET /rfqs?for_factory=me`
   - ⚠️ ปัจจุบันใช้ `GET /rfqs?status=OP` แล้ว filter ฝั่ง FE (ไม่ scalable)
5. **Missing DB:** ❌ `rfqs.sub_category_id` (Critical)
6. **Missing API:** ❌ `GET /rfqs/matching` ที่ใช้ JWT จับ factory_id อัตโนมัติ
7. **Gaps:** ไม่มี matching score / ไม่มี "new since last visit" badge

---

#### Screen 7 — RFQ Detail Page

1. **Purpose:** ดูรายละเอียด RFQ ก่อนตัดสินใจเสนอราคา
2. **Data needed:** `rfqs`, `rfq_images`, `customers` (ชื่อลูกค้า), `address`, `lbi_units`, `lbi_categories`, `lbi_sub_categories`
3. **Actions:** เปิดแชท, กดเสนอราคา
4. **APIs:** ✅ `GET /rfqs/:id`, ✅ `GET /rfqs/:id/images`, ✅ `POST /conversations`
5. **Missing DB:** ❌ `rfqs.sub_category_id`
6. **Missing API:** —
7. **Gaps:** ไม่ควรเปิดเผย customer's full contact ก่อน accept quotation (privacy)

---

#### Screen 8 — Submit Quotation (BOQ)

1. **Purpose:** สร้างใบเสนอราคา
2. **Data needed:** `lbi_shipping_methods`
3. **Actions (write):** `INSERT quotations` (rfq_id, factory_id, price_per_piece, mold_cost, lead_time_days, shipping_method_id, **payment_type**, **payment_terms**, **deposit_percent**, status='PD')
4. **APIs:**
   - ✅ `POST /rfqs/:rfq_id/quotations`
   - ⚠️ ขาด field: `payment_type`, `payment_terms`, `deposit_percent`, `total_price`, `notes`, `validity_days`
5. **Missing DB:** ❌ `quotations.payment_type`, `payment_terms`, `deposit_percent`, `total_price`, `notes`, `validity_days`
6. **Missing API:** —
7. **Gaps:** ไม่ validate "1 quotation per RFQ per factory" / ไม่เช็ค `rfqs.status='OP'` ก่อนรับ

---

#### Screen 9 — My Quotations List

1. **Purpose:** ดู quotation ที่ตัวเองส่งทั้งหมด (PD/AC/RJ)
2. **Data needed:** `quotations` WHERE `factory_id=me` JOIN `rfqs`
3. **Actions:** filter by status, click → detail/edit
4. **APIs:**
   - ❌ `GET /quotations?factory_id=me`
   - ⚠️ ปัจจุบันต้อง loop ผ่าน RFQ ทีละใบ → ไม่มี endpoint รวม
5. **Missing DB:** —
6. **Missing API:** ❌ `GET /quotations?factory_id=me&status=PD,AC,RJ`
7. **Gaps:** ไม่มี timeline / ไม่มี winrate analytics

---

#### Screen 10 — Edit Quotation (status=PD only)

1. **Purpose:** แก้ไขใบเสนอราคาก่อนลูกค้าเลือก
2. **Data needed:** `quotations` (เฉพาะ PD)
3. **Actions:** update price, lead_time, mold_cost, shipping_method, payment_terms
4. **APIs:**
   - ⚠️ `PATCH /quotations/:id/status` (เปลี่ยนแค่ status)
   - ❌ `PATCH /quotations/:id` สำหรับแก้ไข data จริง
5. **Missing DB:** —
6. **Missing API:** ❌ `PATCH /quotations/:id` (update full body)
7. **Gaps:** ต้อง validate `status='PD'` ก่อนแก้ + แจ้ง notification ลูกค้า

---

### D. Order Management

#### Screen 11 — My Orders List

1. **Purpose:** ดู order ที่โรงงานต้องผลิต
2. **Data needed:** `orders` WHERE `factory_id=me`, JOIN `customers`, `quotations`
3. **Actions:** filter by status (PP/PR/WF/SH/CP/CC), search, click → detail
4. **APIs:**
   - ❌ `GET /orders?factory_id=me`
   - ⚠️ ปัจจุบัน `GET /orders/` ไม่มี filter `factory_id`
5. **Missing DB:** ❌ `orders.status` ขาด PP, WF, DL, AC, CC, RF
6. **Missing API:** ❌ `GET /orders?factory_id=me&status=...`
7. **Gaps:** —

---

#### Screen 12 — Order Detail Page

1. **Purpose:** ดูรายละเอียด order + production timeline + payment status
2. **Data needed:** `orders`, `quotations`, `customers`, `address`, `production_updates`, `transactions`, `payment_schedules`
3. **Actions:** เพิ่ม production update, mark shipped, เปิดแชทลูกค้า
4. **APIs:**
   - ✅ `GET /orders/:id`
   - ✅ `GET /orders/:order_id/production-updates`
   - ❌ `GET /orders/:id/payment-schedule`
   - ❌ `GET /orders/:id/remaining-balance`
5. **Missing DB:** ❌ `payment_schedules` table, ❌ `orders.paid_amount`, `payment_type`
6. **Missing API:** ❌ payment-schedule endpoints
7. **Gaps:** ไม่มี timeline view ของ payment milestones

---

#### Screen 13 — Production Updates

1. **Purpose:** เพิ่ม update production step ใหม่ (ใส่รูป + status)
2. **Data needed:** `lbi_production` (template steps), `production_updates`
3. **Actions:**
   - `POST production_updates` (step_id, status=CR/CP, description, image_url)
   - `PATCH production_updates/:id`
4. **APIs:**
   - ✅ `POST /orders/:order_id/production-updates`
   - ✅ `PATCH /production-updates/:update_id`
   - ✅ `POST /media/upload`
5. **Missing DB:** ❌ `lbi_production.is_payment_trigger` (สำหรับ installment)
6. **Missing API:** —
7. **Gaps:** ไม่มี validation บังคับ sequence / ไม่มี auto-notify customer / ไม่มี trigger payment ถัดไป

---

#### Screen 14 — Final Delivery / Mark Shipped

1. **Purpose:** ปิด step สุดท้าย → mark order ว่าจัดส่ง
2. **Data needed:** `orders`
3. **Actions:** `PATCH orders/:id/status` → SH หรือ DL
4. **APIs:** ✅ `PATCH /orders/:order_id/status`
5. **Missing DB:** ❌ status SH/DL ยังไม่มีใน enum
6. **Missing API:** ❌ `POST /orders/:id/ship` (รับ tracking_no, courier)
7. **Gaps:** ไม่มีฟิลด์ tracking_no, courier, shipped_at

---

### E. Showcase Management

#### Screen 15 — My Showcases List

1. **Purpose:** ดู showcase ทั้งหมดของโรงงาน (PD/PM/ID)
2. **Data needed:** `factory_showcases` WHERE `factory_id=me`
3. **Actions:** filter by content_type, click → edit/delete
4. **APIs:**
   - ⚠️ `GET /showcases` (ต้อง filter factory_id) → ❌ `GET /showcases?factory_id=me`
5. **Missing DB:** —
6. **Missing API:** ❌ `GET /showcases?factory_id=me`
7. **Gaps:** —

---

#### Screen 16 — Create Showcase

1. **Purpose:** สร้าง showcase ใหม่ (PD ต้องเลือก sub_category_id)
2. **Data needed:** `lbi_categories`, `lbi_sub_categories`
3. **Actions:** `INSERT factory_showcases` (content_type, title, excerpt, image_url, category_id, **sub_category_id**, min_order, lead_time_days)
4. **APIs:**
   - ✅ `POST /showcases`
   - ⚠️ ขาด field `sub_category_id` ใน body
5. **Missing DB:** ❌ `factory_showcases.sub_category_id`
6. **Missing API:** —
7. **Gaps:** ไม่ validate `sub_category_id required` เมื่อ `content_type='PD'`

---

#### Screen 17 — Edit Showcase

1. **Purpose:** แก้ไข showcase
2. **APIs:** ❌ `PATCH /showcases/:id`
3. **Missing API:** ❌ `PATCH /showcases/:id`
4. **Gaps:** —

---

#### Screen 18 — Delete Showcase

1. **APIs:** ❌ `DELETE /showcases/:id`
2. **Missing API:** ❌ `DELETE /showcases/:id`
3. **Gaps:** soft-delete vs hard-delete

---

#### Screen 19 — Showcase Analytics

1. **Purpose:** ดูยอด like/view ของแต่ละ showcase
2. **Data needed:** `favorites` count, view count
3. **Missing DB:** ❌ `factory_showcases.view_count` หรือ ตาราง `showcase_views`
4. **Missing API:** ❌ `GET /showcases/:id/analytics`
5. **Gaps:** ไม่มี tracking view เลย

---

### F. Profile Management

#### Screen 20 — View / Edit Factory Profile

1. **Purpose:** ดู/แก้ไขข้อมูลโรงงาน
2. **Data needed:** `factory_profiles`, `users`
3. **Actions:** `PATCH factory_profiles`
4. **APIs:** ✅ `PATCH /factories/:id`, ✅ `GET /factories/:id`
5. **Missing DB:** —
6. **Missing API:** —
7. **Gaps:** —

---

#### Screen 21 — Manage Categories & Sub-categories

1. **Purpose:** เพิ่ม/ลบ category ที่โรงงานรับผลิต
2. **Data needed:** `lbi_categories`, `lbi_sub_categories`, `map_factory_categories`, `map_factory_sub_categories`
3. **Actions:** add/remove category, add/remove sub_category
4. **APIs:** ❌ `PUT /factories/:id/categories`, ❌ `PUT /factories/:id/sub-categories`
5. **Missing API:** ❌ ทั้งคู่
6. **Gaps:** —

---

#### Screen 22 — Manage Certificates

1. **Purpose:** อัปโหลดใบรับรอง (ISO, GMP, etc.)
2. **Data needed:** `lbi_certificates`, `factory_certificates`
3. **Actions:** upload, view, set expire_date
4. **APIs:**
   - ✅ `GET /factories/:id/certificates`
   - ✅ `POST /factories/:id/certificates`
   - ❌ `DELETE /factories/:id/certificates/:cert_id`
   - ❌ `PATCH /factories/:id/certificates/:cert_id`
5. **Missing API:** ❌ DELETE / PATCH
6. **Gaps:** ไม่มี expiry reminder notification

---

#### Screen 23 — Manage Addresses

1. **APIs:**
   - ✅ `POST /addresses/`
   - ⚠️ `GET /addresses?user_id=me` (ตรวจสอบว่ามี)
   - ❌ `PATCH /addresses/:id`, `DELETE /addresses/:id`
2. **Missing API:** ❌ PATCH/DELETE addresses
3. **Gaps:** —

---

#### Screen 24 — Edit description / image / specialization

ครอบคลุมโดย Screen 20 (PATCH /factories/:id) ✅

---

### G. Wallet & Finance

#### Screen 25 — Wallet Overview

1. **Purpose:** ดู good_fund + pending_fund
2. **Data needed:** `wallets` WHERE `user_id=me`
3. **APIs:** ✅ `GET /wallets/me`
4. **Missing DB:** —
5. **Gaps:** ไม่มี breakdown ว่า pending จาก order ไหนบ้าง

---

#### Screen 26 — Transaction History

1. **Purpose:** ดู settlement, withdrawal, fee
2. **Data needed:** `transactions` WHERE `wallet_id=me`
3. **APIs:** ⚠️ `GET /transactions?wallet_id=me` (ตรวจสอบว่ารองรับ)
4. **Missing DB:** ❌ `transactions.type` ขาด SL (Settlement), PF (Platform Fee), FP (Final Payment)
5. **Missing API:** ❌ `GET /wallets/me/transactions`
6. **Gaps:** ไม่มี filter, ไม่มี export

---

#### Screen 27 — Withdraw via PromptPay

1. **Purpose:** ถอนเงินจาก wallet → PromptPay (เบอร์โทร/เลขบัตรประชาชน)
2. **Data needed:** `wallets.balance`, `withdrawal_requests`
3. **Actions:** `POST /withdrawals` (amount, promptpay_type, promptpay_target, account_name)
4. **APIs:** ❌ `POST /withdrawals`, `GET /withdrawals/me`, `GET /withdrawals/:id`
5. **Missing DB:** ❌ ตาราง `withdrawal_requests` (PromptPay schema — ดู §8.2 (7))
6. **Flow:** factory submit → admin approve & โอน PromptPay → upload slip → status CP
7. **Gaps:** ไม่มี minimum withdraw / ต้องมี admin approval flow

---

### H. Communication

#### Screen 29 — Conversations List

1. **Data needed:** `conversations` WHERE `factory_id=me`
2. **APIs:** ✅ `GET /conversations`
3. **Gaps:** ไม่มี search, ไม่มี mark all read

---

#### Screen 30 — Chat Detail

1. **Purpose:** อ่าน/ส่งข้อความ + แนบ quotation
2. **APIs:**
   - ✅ `GET /messages?conv_id=...`
   - ✅ `POST /messages` (รองรับ message_type=TX/QT)
3. **Gaps:** ❌ ไม่มี real-time (WebSocket), ❌ ไม่มี read receipt PATCH, ❌ ไม่มี typing indicator

---

#### Screen 31 — Notifications

1. **Data needed:** `notifications` WHERE `user_id=me`
2. **APIs:** ✅ `GET /notifications`, ✅ `PATCH /notifications/:id/read`
3. **Missing API:** ❌ `PATCH /notifications/read-all`
4. **Gaps:** ไม่มี notification ประเภท: RFQ matched, payment received, review received

---

### I. Reviews

#### Screen 32 — Reviews from Customers

1. **Data needed:** `factory_reviews` WHERE `factory_id=me`
2. **APIs:** ✅ `GET /factories/:factory_id/reviews`
3. **Gaps:** ไม่มี filter by rating

---

#### Screen 33 — Reply to Review

1. **Purpose:** โรงงานตอบกลับรีวิว (optional)
2. **Missing DB:** ❌ `factory_reviews.reply`, `replied_at`
3. **Missing API:** ❌ `POST /reviews/:review_id/reply`
4. **Gaps:** —

---

## 4. Missing DB Tables / Fields Summary

### 4.1 Missing Fields

| ตาราง | ฟิลด์ | จุดประสงค์ | Priority |
|------|------|-----------|----------|
| `factory_profiles` | `verified_at`, `verified_by`, `rejection_reason` | Admin verify audit | High |
| `factory_showcases` | `sub_category_id` | PD ต้องผูก sub-category | High |
| `factory_showcases` | `view_count` | analytics | Medium |
| `factory_reviews` | `reply`, `replied_at` | factory ตอบรีวิว | Medium |
| `quotations` | `payment_type`, `payment_terms`, `deposit_percent` | Installment | Critical |
| `quotations` | `total_price`, `notes`, `validity_days` | BOQ detail | Low |
| `orders` | `factory_id` filter index | Performance | High |
| `orders` | `paid_amount`, `payment_type` | Installment | Critical |
| `orders` | `tracking_no`, `courier`, `shipped_at` | Delivery tracking | High |
| `orders` | `closed_at`, `closed_by` | Audit | Medium |
| `lbi_production` | `is_payment_trigger` | Installment trigger | High |
| `transactions` | `payment_method`, `reference_code` | Payment gateway | High |
| `users` | `role` ขาด admin | Admin role | High |
| `users` | `avatar_url` | profile pic | Low |

### 4.2 Missing Tables

| ตาราง | จุดประสงค์ | Priority |
|------|-----------|----------|
| `topup_intents` | PromptPay QR intents สำหรับเติมเงิน | Critical |
| `withdrawal_requests` | คำขอถอนเงินผ่าน PromptPay | Critical |
| `settlements` | track เงินที่จ่ายให้โรงงาน (order_id, gross, fee, net, status) | Critical |
| `payment_schedules` | installment plan งวดชำระ | Critical |
| `showcase_views` | tracking ยอด view (หรือใช้ counter ในตาราง showcase) | Low |

### 4.3 Missing Status Values

| ตาราง | สถานะที่ขาด | Priority |
|------|------------|----------|
| `orders.status` | PP, WF, DL, AC, CC, RF | Critical |
| `transactions.type` | SL (Settlement), PF (Platform Fee), FP (Final Payment) | High |

---

## 5. Missing API Endpoints Summary

| Endpoint | Module | Screen | Priority |
|---------|--------|--------|---------|
| `GET /factories/me/dashboard` | Factory | 5 | High |
| `GET /rfqs/matching` หรือ `GET /rfqs?for_factory=me` | RFQ | 6 | **Critical** |
| `PUT /factories/:id/categories` | Factory | 4, 21 | High |
| `PUT /factories/:id/sub-categories` | Factory | 4, 21 | High |
| `PATCH /quotations/:id` (full body) | Quotation | 10 | High |
| `GET /quotations?factory_id=me` | Quotation | 9 | High |
| `GET /orders?factory_id=me` | Order | 11 | **Critical** |
| `GET /orders/:id/payment-schedule` | Order | 12 | Critical |
| `GET /orders/:id/remaining-balance` | Order | 12 | High |
| `POST /orders/:id/ship` | Order | 14 | High |
| `GET /showcases?factory_id=me` | Showcase | 15 | High |
| `PATCH /showcases/:id` | Showcase | 17 | High |
| `DELETE /showcases/:id` | Showcase | 18 | High |
| `GET /showcases/:id/analytics` | Showcase | 19 | Low |
| `DELETE /factories/:id/certificates/:cert_id` | Cert | 22 | Medium |
| `PATCH /factories/:id/certificates/:cert_id` | Cert | 22 | Medium |
| `PATCH /addresses/:id` / `DELETE /addresses/:id` | Address | 23 | Medium |
| `GET /wallets/me/transactions` | Wallet | 26 | High |
| `POST /wallet/topup-intents` | Wallet | 26 | **Critical** |
| `GET /wallet/topup-intents/:id` | Wallet | 26 | **Critical** |
| `POST /withdrawals` | Wallet | 27 | **Critical** |
| `GET /withdrawals/me` | Wallet | 27 | **Critical** |
| `POST /settlements` (auto-trigger เมื่อ order CP) | Settlement | — | **Critical** |
| `PATCH /admin/factories/:id/verify` | Admin | 3 | High |
| `GET /admin/factories?status=pending` | Admin | 3 | High |
| `PATCH /notifications/read-all` | Notification | 31 | Medium |
| `POST /reviews/:id/reply` | Review | 33 | Medium |
| `POST /factories/:id/categories` body validation | Factory | 4 | High |
| WebSocket / SSE for chat & notifications | Realtime | 30, 31 | Medium |

### Backend Automation ที่ขาด

| Logic | Trigger | Priority |
|-------|---------|---------|
| Auto-match RFQ → notify factories ที่ category ตรง | RFQ created | **Critical** |
| Auto-create production_updates จาก template | Order PP → PR | High |
| Auto-trigger settlement | Order CP/AC | **Critical** |
| Auto-update factory rating + review_count | Review created | Medium |
| Auto-notify factory เมื่อ order ใหม่ / payment เข้า | Order/Tx event | High |

---

## 6. New Proposed Flow Summary

```
Factory user สมัคร (FT)
   │
   ▼
Admin verify (is_verified=true) ──► Onboarding wizard (profile, categories, certs, address)
   │
   ▼
Dashboard (KPI: pending RFQ, active orders, wallet, unread)
   │
   ├──► RFQ Board (matching) ──► RFQ Detail ──► Submit Quote (BOQ + payment_type)
   │                                                       │
   │                                          (PD)─────►(AC by customer)
   │                                                       │
   │                                                       ▼
   │                                              Order created (PP)
   │                                                       │
   ├──► Orders ──► Order Detail ──► Production Updates ──► Mark Shipped
   │                                       │
   │                                       └─► (is_payment_trigger) → notify customer pay next
   │                                                       │
   │                                       Customer pays final → Customer closes order
   │                                                       │
   │                                                       ▼
   │                                          Settlement → factory wallet (good_fund)
   │
   ├──► Wallet ──► Top-up (PromptPay QR) / Withdraw (PromptPay target)
   │
   ├──► Showcases ──► Create/Edit/Delete (PD requires sub_category_id)
   │
   ├──► Profile ──► Categories / Sub-categories / Certs / Addresses
   │
   ├──► Chat / Notifications
   │
   └──► Reviews ──► (optional) Reply
```

---

## 7. Recommended Implementation Phases

### Phase 1 — Unblock Core Factory Flow (Week 1-2) — Critical

**เป้าหมาย:** โรงงานสามารถดู RFQ → ส่ง quote → รับ order → อัปเดต production ได้

1. **DB:**
   - เพิ่ม `rfqs.sub_category_id`
   - เพิ่ม `orders.status` enum (PP, WF, DL, AC, CC, RF)
   - เพิ่ม `orders.factory_id` index
2. **API:**
   - ❌ `GET /rfqs/matching` (filter by factory's categories จาก JWT)
   - ❌ `GET /orders?factory_id=me`
   - ❌ `GET /quotations?factory_id=me`
   - ❌ `PATCH /quotations/:id` (full edit)
3. **Backend logic:**
   - Auto-match RFQ → notify factories
   - Auto-reject quotations อื่นเมื่อ accept

### Phase 2 — Profile, Showcase & Onboarding (Week 3) — High

1. **DB:**
   - `factory_showcases.sub_category_id`
   - `factory_profiles.verified_at`, `verified_by`
   - `users.role` = admin
2. **API:**
   - ❌ `PUT /factories/:id/categories` + sub-categories
   - ❌ `PATCH /showcases/:id`, `DELETE /showcases/:id`
   - ❌ `GET /showcases?factory_id=me`
   - ❌ `DELETE /factories/:id/certificates/:cert_id`
   - ❌ `PATCH /admin/factories/:id/verify`

### Phase 3 — Wallet, Settlement & Withdrawal (Week 4-5) — Critical (Money flow)

1. **DB:**
   - ตาราง `topup_intents` (PromptPay QR)
   - ตาราง `withdrawal_requests` (PromptPay target)
   - ตาราง `settlements`
   - `transactions.type` += SL, PF, FP
   - `transactions.payment_method`, `reference_code`
2. **API:**
   - ❌ `POST /wallet/topup-intents`, `GET /wallet/topup-intents/:id`
   - ❌ `POST /withdrawals`, `GET /withdrawals/me`, `GET /withdrawals/:id`
   - ❌ `GET /wallets/me/transactions`
   - ❌ Admin: `GET/POST /admin/withdrawals/:id/{approve,reject}`
3. **Backend logic:**
   - Auto-trigger settlement เมื่อ order CP/AC (gross - fee → good_fund)

### Phase 4 — Installment, Realtime, Polish (Week 6+) — Medium

1. **DB:**
   - ตาราง `payment_schedules`
   - `quotations.payment_type/payment_terms/deposit_percent`
   - `orders.payment_type/paid_amount`
   - `lbi_production.is_payment_trigger`
   - `factory_reviews.reply`
   - `orders.tracking_no`, `courier`, `shipped_at`
2. **API:**
   - Payment schedule endpoints
   - `POST /orders/:id/ship`
   - `POST /reviews/:id/reply`
   - `PATCH /notifications/read-all`
   - WebSocket / SSE for chat
3. **Polish:**
   - `GET /factories/me/dashboard` (aggregated)
   - Showcase analytics
   - Notification trigger ครบทุก event

---

**สรุป:** โดยรวมระบบมีโครง backend สำหรับ factory user แล้ว แต่ขาด **(1) RFQ matching API** **(2) factory-scoped filters** **(3) settlement & withdrawal flow** ทั้งหมด ซึ่งเป็น blocker ใหญ่ของ factory user lifecycle ควรลงมือ Phase 1 + Phase 3 เป็นอันดับแรก

---

## 8. ส่วนที่ขาดเพิ่มเติม (Update v1.1 — 7 เม.ย. 2026)

ผู้ใช้ชี้ให้เห็นว่า v1.0 ยังขาด **(1) หน้า Factory แก้ไข quotation** และ **(2) ตาราง log สำหรับ track การแก้ไข** ซึ่งสำคัญมากเพราะ:
- โรงงานต้องสามารถปรับราคา/lead time ได้ก่อน customer accept
- ระบบต้องเก็บ audit trail เพื่อตรวจสอบย้อนหลังเมื่อเกิดข้อพิพาท

ในการทบทวนรอบนี้ พบหน้าจอและตารางอื่นๆ ที่ยังขาดอีกหลายรายการ:

### 8.1 หน้าจอ Factory ที่ขาด (เพิ่มเติมจาก v1.0)

| # | หน้า | Path ที่เสนอ | Purpose | สถานะ |
|---|------|-------------|---------|------|
| **F1** | **Edit Quotation** | `/factory/rfqs/:rfqId/quotations/:quoteId/edit` | แก้ไข BOQ ที่ส่งไปแล้ว (เฉพาะเมื่อ status=PD) | ❌ ขาด |
| **F2** | **My Quotations List** | `/factory/quotations` | รายการ quotation ทั้งหมดที่โรงงานส่ง (filter PD/AC/RJ) | ❌ ขาด |
| **F3** | **Quotation Detail (Factory view)** | `/factory/quotations/:id` | ดูใบเสนอราคาที่ส่ง พร้อมประวัติแก้ไข | ❌ ขาด |
| **F4** | **Quotation History / Audit Log** | `/factory/quotations/:id/history` | timeline การแก้ไข (ใคร แก้อะไร เมื่อไหร่) | ❌ ขาด |
| **F5** | **Order Activity Log** | `/factory/orders/:id/activity` | timeline การเปลี่ยนแปลงทั้งหมดของ order | ❌ ขาด |
| **F6** | **Production Update Edit / History** | (modal) | แก้ไข production update + ดูประวัติการแก้ | ⚠️ มี API แต่ไม่มี UI |
| **F7** | **Decline / Reject RFQ** | `/factory/rfqs/:id/decline` | โรงงานปฏิเสธ RFQ ที่ไม่อยากเสนอราคา | ❌ ขาด |
| **F8** | **Quotation Templates** | `/factory/templates` | บันทึก template ของ BOQ ไว้ใช้ซ้ำ | ❌ ขาด |
| **F9** | **Production Step Templates** | `/factory/production-templates` | กำหนด default production steps ของโรงงานตัวเอง (override `lbi_production`) | ❌ ขาด |
| **F10** | **Calendar / Capacity Planning** | `/factory/calendar` | ดูภาระงานในแต่ละวัน (ควรรับ RFQ เพิ่มได้ไหม) | ❌ ขาด |
| **F11** | **Bulk Production Update** | (modal) | อัปเดตหลาย step พร้อมกัน + แนบรูปหลายรูป | ❌ ขาด |
| **F12** | **Shipping / Delivery Confirmation** | `/factory/orders/:id/ship` | กรอกเลข tracking, แนบใบส่งของ, mark shipped | ❌ ขาด |
| **F13** | **Settlement History** | `/factory/wallet/settlements` | ดูประวัติเงินที่เข้า wallet จากแต่ละ order | ❌ ขาด |
| **F14** | **Withdrawal Request Status** | `/factory/wallet/withdrawals` | ดูสถานะคำขอถอนเงิน (pending/approved/transferred) | ❌ ขาด |
| **F15** | **Tax Documents / e-Invoice** | `/factory/documents` | ดาวน์โหลดใบกำกับภาษี / ใบเสร็จ | ❌ ขาด |
| **F16** | **Reports / Analytics** | `/factory/reports` | สรุปยอดขาย จำนวนงาน rating ตามช่วงเวลา | ❌ ขาด |
| **F17** | **Notifications Center** | `/factory/notifications` | ดู noti ทั้งหมด + filter type | ⚠️ มี API แต่ไม่มี dedicated page |
| **F18** | **Account Settings** | `/factory/settings` | เปลี่ยนรหัสผ่าน, เปลี่ยน email/phone, 2FA | ❌ ขาด |
| **F19** | **Notification Preferences** | `/factory/settings/notifications` | เลือกประเภท noti ที่จะรับ (email, push, in-app) | ❌ ขาด |
| **F20** | **Onboarding Progress / Checklist** | `/factory/onboarding` | checklist ว่ากรอกอะไรครบยัง (profile, categories, certs, address) | ❌ ขาด |
| **F21** | **Dispute / Issue Management** | `/factory/disputes` | ดูข้อพิพาทที่ลูกค้าเปิด + ตอบกลับ | ❌ ขาด |
| **F22** | **Cancel Order Request** | (modal) | โรงงานขอยกเลิก order (ก่อนเริ่มผลิต) | ❌ ขาด |

### 8.2 ตารางใหม่ที่ต้องเพิ่มใน Database

#### (1) `quotation_history` — Audit log การแก้ไข quotation ⭐ Critical

```sql
CREATE TABLE quotation_history (
  history_id        INT AUTO_INCREMENT PRIMARY KEY,
  quote_id          INT NOT NULL REFERENCES quotations(quote_id),
  changed_by        INT NOT NULL REFERENCES users(user_id),  -- factory user
  change_type       CHAR(2) NOT NULL,  -- CR=Created, UP=Updated, ST=StatusChange, DL=Deleted
  field_name        VARCHAR(50),       -- ฟิลด์ที่แก้ (price_per_piece, lead_time_days, etc.)
  old_value         TEXT,              -- ค่าเดิม
  new_value         TEXT,              -- ค่าใหม่
  snapshot          JSON,              -- snapshot ของ quotation ทั้ง record (optional)
  reason            TEXT,              -- เหตุผลการแก้ (optional)
  ip_address        VARCHAR(45),
  user_agent        TEXT,
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qh_quote_id ON quotation_history(quote_id);
CREATE INDEX idx_qh_created_at ON quotation_history(created_at);
```

**วัตถุประสงค์:** เก็บประวัติการแก้ไข quotation ทุกครั้งเพื่อ:
- ป้องกันโรงงานเปลี่ยนราคาแล้วปฏิเสธ
- ใช้ในกรณีข้อพิพาท
- แสดง timeline ให้ลูกค้าเห็น (transparency)

**Trigger:** ทุกครั้งที่เรียก `PATCH /quotations/:id` หรือ `PATCH /quotations/:id/status` ต้องสร้าง record ใน `quotation_history`

---

#### (2) `order_activity_log` — Audit log การเปลี่ยนแปลงของ order ⭐ Critical

```sql
CREATE TABLE order_activity_log (
  log_id        INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT NOT NULL REFERENCES orders(order_id),
  actor_id      INT REFERENCES users(user_id),    -- ใครเป็นคนทำ (null = system)
  actor_type    CHAR(2),                           -- CT=Customer, FT=Factory, SY=System, AD=Admin
  action        VARCHAR(50) NOT NULL,              -- StatusChange, Payment, ProductionUpdate, Note, etc.
  field_name    VARCHAR(50),
  old_value     TEXT,
  new_value     TEXT,
  description   TEXT,
  metadata      JSON,                              -- ข้อมูลเพิ่มเติม
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_oal_order_id ON order_activity_log(order_id);
```

**ใช้บันทึก:** สร้าง order, เปลี่ยน status, จ่ายเงินงวด, อัปเดต production, ส่ง shipping, ปิดงาน, settlement ฯลฯ

---

#### (3) `production_update_history` — Audit log การแก้ไข production update

```sql
CREATE TABLE production_update_history (
  history_id    INT AUTO_INCREMENT PRIMARY KEY,
  update_id     INT NOT NULL REFERENCES production_updates(update_id),
  changed_by    INT NOT NULL REFERENCES users(user_id),
  field_name    VARCHAR(50),
  old_value     TEXT,
  new_value     TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);
```

---

#### (4) `quotation_templates` — Template ของ BOQ สำหรับโรงงานใช้ซ้ำ

```sql
CREATE TABLE quotation_templates (
  template_id        INT AUTO_INCREMENT PRIMARY KEY,
  factory_id         INT NOT NULL REFERENCES users(user_id),
  template_name      VARCHAR(150) NOT NULL,
  category_id        INT REFERENCES categories(category_id),
  price_per_piece    DECIMAL(10,2),
  mold_cost          DECIMAL(10,2),
  lead_time_days     INT,
  payment_type       VARCHAR(15),     -- FULL / INSTALLMENT
  payment_terms      TEXT,
  deposit_percent    DECIMAL(5,2),
  notes              TEXT,
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP
);
```

---

#### (5) `factory_production_steps` — Override default production template ของแต่ละโรงงาน

```sql
CREATE TABLE factory_production_steps (
  step_id          INT AUTO_INCREMENT PRIMARY KEY,
  factory_id       INT NOT NULL REFERENCES users(user_id),
  step_name        VARCHAR(150) NOT NULL,
  sequence         INT NOT NULL,
  estimated_days   INT,
  is_payment_trigger BOOLEAN DEFAULT FALSE,
  status           CHAR(1) DEFAULT '1',
  created_at       TIMESTAMP DEFAULT NOW()
);
```

**ใช้แทน:** `lbi_production` (ซึ่งเป็น template by factory_type) — ให้แต่ละโรงงานปรับแต่ง steps ของตัวเองได้

---

#### (6) `order_shipments` — ข้อมูลการจัดส่ง

```sql
CREATE TABLE order_shipments (
  shipment_id        INT AUTO_INCREMENT PRIMARY KEY,
  order_id           INT NOT NULL REFERENCES orders(order_id),
  shipping_method_id INT REFERENCES lbi_shipping_methods(shipping_method_id),
  tracking_number    VARCHAR(100),
  carrier_name       VARCHAR(100),
  shipped_at         TIMESTAMP,
  estimated_arrival  DATE,
  delivered_at       TIMESTAMP,
  proof_image_url    TEXT,             -- รูปใบส่งของ
  status             CHAR(2),          -- PD=Pending, IT=InTransit, DL=Delivered, FL=Failed
  notes              TEXT,
  created_at         TIMESTAMP DEFAULT NOW()
);
```

---

#### (7) `withdrawal_requests` — คำขอถอนเงินของโรงงาน

```sql
CREATE TABLE withdrawal_requests (
  withdrawal_id      INT AUTO_INCREMENT PRIMARY KEY,
  factory_id         INT NOT NULL REFERENCES users(user_id),
  amount             DECIMAL(12,2) NOT NULL,
  fee                DECIMAL(10,2) DEFAULT 0,
  net_amount         DECIMAL(12,2),
  promptpay_type     CHAR(2) NOT NULL,      -- PH=Phone, CI=CitizenID
  promptpay_target   VARCHAR(20) NOT NULL,
  account_name       VARCHAR(150) NOT NULL,
  status             CHAR(2) DEFAULT 'PD',  -- PD=Pending, AP=Approved, CP=Completed, RJ=Rejected
  approved_by        INT REFERENCES users(user_id),  -- admin
  approved_at        TIMESTAMP,
  slip_url           VARCHAR(255),
  rejection_reason   TEXT,
  requested_at       TIMESTAMP DEFAULT NOW(),
  completed_at       TIMESTAMP
);
```

---

#### (8) `topup_intents` — คำสั่งเติมเงินผ่าน PromptPay QR

```sql
CREATE TABLE topup_intents (
  intent_id      VARCHAR(32) PRIMARY KEY,       -- "ti_xxxxx"
  user_id        INT NOT NULL REFERENCES users(user_id),
  amount         DECIMAL(12,2) NOT NULL,
  qr_payload     TEXT NOT NULL,                 -- EMVCo PromptPay QR string
  status         CHAR(2) DEFAULT 'PD',          -- PD=Pending, CF=Confirmed, EX=Expired, CC=Cancelled
  reference_code VARCHAR(50),                   -- ref จาก bank webhook
  paid_at        TIMESTAMP,
  expires_at     TIMESTAMP NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW()
);
```

---

#### (9) `notification_preferences` — การตั้งค่า notification ของแต่ละ user

```sql
CREATE TABLE notification_preferences (
  pref_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL REFERENCES users(user_id),
  noti_type      CHAR(2) NOT NULL,    -- RQ, OD, MS, SY, PM
  email_enabled  BOOLEAN DEFAULT TRUE,
  push_enabled   BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE (user_id, noti_type)
);
```

---

#### (10) `disputes` — ข้อพิพาทระหว่าง customer กับ factory

```sql
CREATE TABLE disputes (
  dispute_id     INT AUTO_INCREMENT PRIMARY KEY,
  order_id       INT NOT NULL REFERENCES orders(order_id),
  opened_by      INT NOT NULL REFERENCES users(user_id),
  reason         TEXT NOT NULL,
  evidence_urls  JSON,                 -- array of URLs
  status         CHAR(2) DEFAULT 'OP', -- OP=Open, IR=InReview, RS=Resolved, CL=Closed
  resolution     TEXT,
  resolved_by    INT REFERENCES users(user_id),  -- admin
  resolved_at    TIMESTAMP,
  refund_amount  DECIMAL(12,2),
  created_at     TIMESTAMP DEFAULT NOW()
);
```

### 8.3 ฟิลด์ที่ต้องเพิ่มในตารางเดิม

| ตาราง | ฟิลด์ | เหตุผล |
|-------|------|--------|
| `quotations` | `version` (INT, default 1) | track version หลังแก้ไข |
| `quotations` | `last_edited_at` (TIMESTAMP) | เวลาแก้ไขล่าสุด |
| `quotations` | `last_edited_by` (INT FK users) | ใครแก้ครั้งล่าสุด |
| `quotations` | `is_locked` (BOOLEAN) | lock เมื่อ customer accept แล้ว ห้ามแก้ |
| `production_updates` | `last_edited_at`, `last_edited_by` | สำหรับ audit |
| `orders` | `cancelled_at`, `cancelled_by`, `cancel_reason` | สำหรับ cancel flow |

### 8.4 API ใหม่ที่ต้องสร้าง

#### Quotation Edit + History

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| `PATCH` | `/api/v1/quotations/:id` | แก้ไขเนื้อหา quotation (price, lead_time, ฯลฯ) — เฉพาะ PD | **Critical** |
| `GET` | `/api/v1/quotations/:id/history` | ดูประวัติการแก้ไข | **Critical** |
| `GET` | `/api/v1/quotations/me` | รายการ quotation ทั้งหมดของโรงงาน (filter status) | **Critical** |
| `POST` | `/api/v1/quotations/:id/duplicate` | duplicate เป็น quotation ใหม่ (สำหรับ RFQ อื่น) | Low |

#### Quotation Templates

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| `GET` | `/api/v1/quotation-templates` | ดู templates ของโรงงาน | Medium |
| `POST` | `/api/v1/quotation-templates` | สร้าง template | Medium |
| `PATCH` | `/api/v1/quotation-templates/:id` | แก้ไข template | Medium |
| `DELETE` | `/api/v1/quotation-templates/:id` | ลบ template | Medium |

#### Order Activity & Production History

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| `GET` | `/api/v1/orders/:id/activity` | ดู activity log ของ order | **High** |
| `GET` | `/api/v1/production-updates/:id/history` | ดูประวัติการแก้ไข production update | High |
| `POST` | `/api/v1/orders/:id/production-updates/bulk` | bulk update หลาย step | Medium |

#### Order Cancel & Decline

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| `POST` | `/api/v1/rfqs/:id/decline` | โรงงานปฏิเสธ RFQ (ไม่อยากเสนอราคา) | Medium |
| `POST` | `/api/v1/orders/:id/cancel-request` | โรงงานขอยกเลิก order | High |
| `POST` | `/api/v1/orders/:id/dispute` | เปิด dispute | Medium |

#### Shipment

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| `POST` | `/api/v1/orders/:id/shipments` | สร้างข้อมูลการจัดส่ง | **High** |
| `GET` | `/api/v1/orders/:id/shipments` | ดูข้อมูลการจัดส่ง | **High** |
| `PATCH` | `/api/v1/shipments/:id` | อัปเดตสถานะการจัดส่ง | High |

#### PromptPay Top-up & Withdrawal

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| `POST` | `/api/v1/wallet/topup-intents` | สร้าง PromptPay QR สำหรับเติมเงิน | **Critical** |
| `GET` | `/api/v1/wallet/topup-intents/:id` | Polling สถานะ topup | **Critical** |
| `POST` | `/api/v1/wallet/topup-intents/:id/confirm` | Admin/webhook ยืนยันการโอน | **Critical** |
| `POST` | `/api/v1/withdrawals` | ขอถอนเงินไปยัง PromptPay target | **Critical** |
| `GET` | `/api/v1/withdrawals/me` | ดูประวัติการถอนของตัวเอง | High |
| `GET` | `/api/v1/withdrawals/:id` | รายละเอียด + slip_url | High |
| `POST` | `/api/v1/withdrawals/:id/cancel` | ยกเลิกก่อน admin approve | Medium |
| `GET` | `/api/v1/admin/withdrawals?status=PD` | Admin รายการรอตรวจ | High (admin) |
| `POST` | `/api/v1/admin/withdrawals/:id/approve` | Admin approve + upload slip | High (admin) |
| `POST` | `/api/v1/admin/withdrawals/:id/reject` | Admin ปฏิเสธ + reason | High (admin) |
| `GET` | `/api/v1/wallets/settlements` | ดูประวัติ settlement | High |

#### Production Step Templates (Factory-specific)

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| `GET` | `/api/v1/factories/me/production-steps` | ดู production steps ของโรงงาน | Medium |
| `PUT` | `/api/v1/factories/me/production-steps` | กำหนด/แก้ไข production steps | Medium |

#### Capacity / Calendar

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| `GET` | `/api/v1/factories/me/capacity?from=&to=` | ดูภาระงานในช่วงเวลา | Low |

#### Reports

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| `GET` | `/api/v1/factories/me/reports/sales?period=` | รายงานยอดขาย | Medium |
| `GET` | `/api/v1/factories/me/reports/orders?period=` | สรุปจำนวน orders | Medium |
| `GET` | `/api/v1/factories/me/reports/ratings` | สรุป rating | Low |

#### Account Settings

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| `PATCH` | `/api/v1/auth/change-password` | เปลี่ยนรหัสผ่าน | High |
| `PATCH` | `/api/v1/auth/change-email` | เปลี่ยน email (+ verify) | Medium |
| `GET` | `/api/v1/notification-preferences` | ดู preferences | Medium |
| `PATCH` | `/api/v1/notification-preferences` | แก้ไข preferences | Medium |

#### Documents / e-Invoice

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| `GET` | `/api/v1/orders/:id/invoice` | ดาวน์โหลดใบกำกับภาษี (PDF) | Medium |
| `GET` | `/api/v1/orders/:id/receipt` | ดาวน์โหลดใบเสร็จ | Medium |

### 8.5 สรุปหน้า + ตาราง + API ที่เพิ่มใน v1.1

| ประเภท | จำนวนที่เพิ่ม |
|--------|--------------|
| หน้าจอ Factory | **22 หน้า** (F1-F22) |
| ตาราง DB ใหม่ | **10 ตาราง** |
| ฟิลด์เพิ่มในตารางเดิม | **9 ฟิลด์** |
| API endpoints ใหม่ | **30+ endpoints** |

### 8.6 ลำดับความสำคัญสำหรับการแก้เพิ่มเติม (Phase 1.5)

ก่อนทำ Phase 2 ของแผนเดิม ควรเสริม **Phase 1.5** ดังนี้ (เน้นเฉพาะที่ user ชี้):

1. ✨ **`PATCH /quotations/:id`** + หน้า Edit Quotation (F1) — Critical
2. ✨ **ตาราง `quotation_history`** + auto-trigger ทุก PATCH — Critical
3. ✨ **`GET /quotations/:id/history`** + UI timeline (F4) — Critical
4. ✨ **`GET /quotations/me`** + หน้า My Quotations (F2, F3) — Critical
5. ✨ **ตาราง `order_activity_log`** + `GET /orders/:id/activity` (F5) — High
6. ✨ **field `is_locked` ใน `quotations`** — lock หลัง customer accept — Critical

หลังทำ Phase 1.5 เสร็จแล้วค่อยต่อ Phase 2 (Profile Mgmt) และ Phase 3 (Wallet/Settlement) ตามแผนเดิม

---

*สิ้นสุด v1.1 — เพิ่ม 22 หน้า + 10 ตาราง + 30+ API*

---

## 9. Phase 1.5 Implementation Status (v1.2 — 7 เมษายน 2026)

ส่วนนี้บันทึกสถานะการ implement Phase 1.5 ตามรายการใน §8.6 รอบล่าสุด

### 9.1 สิ่งที่ deliver แล้ว ✅

| รายการ | ไฟล์ / Path | สถานะ |
|--------|------------|------|
| SQL migration: `quotation_history` + `order_activity_log` + 4 fields ใน `quotations` + triggers | `docs/migrations/001_quotation_history.sql` | ✅ พร้อมส่งให้ BE รัน |
| API client: `quotationsApi.history()`, `quotationsApi.listMine()` | `src/app/services/api.ts:378` | ✅ |
| หน้า Edit Quotation (F1) แบบ standalone + แสดง audit log timeline (F4) | `src/app/pages/factory-portal/FactoryEditQuotationPage.tsx` | ✅ |
| Route: `/factory/quotations/:id/edit` | `src/app/routes.ts` | ✅ |
| Lock UI เมื่อ `is_locked = true` หรือ `status = 'AC'` | ในหน้า Edit | ✅ |
| ช่อง "เหตุผลที่แก้ไข" → ส่ง `reason` ไปกับ PATCH | ในหน้า Edit | ✅ |

### 9.2 รอ Backend implement

| Endpoint | คำอธิบาย | ใช้โดย |
|----------|---------|--------|
| `PATCH /api/v1/quotations/:id` | รับ body `{ price_per_piece, mold_cost, lead_time_days, shipping_method_id, reason }`, เช็ค `is_locked`, bump `version`, set `last_edited_at`/`last_edited_by` | F1 (Edit Quotation) |
| `GET /api/v1/quotations/:id/history` | คืน array จาก `quotation_history` เรียง `created_at DESC` | F4 (Audit timeline) |
| `GET /api/v1/quotations/me` | คืน quotations ทั้งหมดของ factory จาก JWT | F2 My Quotations |
| `GET /api/v1/orders/:id/activity` | คืน array จาก `order_activity_log` | F5 |

### 9.3 Flow ใหม่หลัง Phase 1.5

```
Factory ส่ง quote (CR ลง history v1)
   │
   ▼
อยู่สถานะ PD (Pending) — แก้ไขได้
   │
   ├── PATCH /quotations/:id  (เหตุผล: "ลดราคาตามเจรจา")
   │     │
   │     ├── BE: เช็ค is_locked = false → ผ่าน
   │     ├── BE: bump version (1→2)
   │     ├── BE: set last_edited_by, last_edited_at
   │     ├── Trigger: insert quotation_history (UP, snapshot v2)
   │     └── 200 OK → FE reload + แสดงใน timeline
   │
   ▼
Customer accept → status = AC
   │
   ├── BE: set is_locked = TRUE
   ├── Trigger: insert quotation_history (ST, AC)
   │
   ▼
Factory เข้าหน้า Edit อีกครั้ง
   └── UI badge "ถูกล็อก" + ทุก input disabled + ปุ่มบันทึกซ่อน
```

### 9.4 จุดที่ต้องเทสต์ก่อน sign-off

- [ ] PATCH ส่ง `reason` แล้ว BE บันทึกลง `quotation_history.reason` ได้จริง
- [ ] เมื่อ status เปลี่ยนเป็น AC, FE refresh แล้ว `is_locked` = true, ปุ่มบันทึกหายไป
- [ ] `version` เพิ่มขึ้นจริงทุก PATCH
- [ ] `quotation_history` แสดงผลแบบ reverse-chronological บนหน้า Edit
- [ ] ถ้า `GET /history` 404 (BE ยังไม่เสร็จ) → แสดง "ยังไม่มีประวัติการแก้ไข" ไม่ทำให้หน้าพัง (handled แล้วใน try/catch)

---

*สิ้นสุด v1.2 — Phase 1.5 implementation logged*

---

## 10. PromptPay Wallet Flow (Top-up & Withdrawal)

**Policy:** ระบบ Wemake **ไม่เก็บข้อมูลบัญชีธนาคารของผู้ใช้** ทุกการเคลื่อนเงินเข้า/ออก wallet ใช้ **PromptPay** เท่านั้น — top-up = สแกน QR ที่ระบบสร้าง, withdraw = admin โอน PromptPay กลับไปยังเบอร์โทร/เลขบัตรประชาชนที่ระบุในคำขอ
รายละเอียดสคีมาเต็มอยู่ใน `system_analysis_flow.md` §11

### 10.1 หน้าจอ Wallet

#### F23 — Top-up Wallet (PromptPay QR Modal) — ใหม่
- **Path:** modal เปิดจาก `FactoryWalletPage` (และ Customer Wallet ในอนาคต)
- **Flow:**
  1. ผู้ใช้กรอกจำนวนเงิน
  2. กด "สร้าง QR" → `POST /wallet/topup-intents`
  3. แสดง QR (render จาก `qr_payload`) + countdown ตาม `expires_at`
  4. Polling `GET /wallet/topup-intents/:id` ทุก 3 วินาที
  5. status = `CF` → ปิด modal + refresh wallet balance
- **APIs:** `POST /wallet/topup-intents`, `GET /wallet/topup-intents/:id`

### 10.2 F24 — Withdraw via PromptPay — ใหม่
- **Path:** modal/page เปิดจาก `FactoryWalletPage`
- **Form fields:**
  - `amount` (number, ≤ wallet balance − fee)
  - `promptpay_type` (radio: เบอร์โทร / เลขบัตรประชาชน)
  - `promptpay_target` (input — validate format ตาม type)
  - `account_name` (input — ชื่อเจ้าของ PromptPay)
  - แสดงค่าธรรมเนียม + ยอดสุทธิที่จะได้รับ
- **Submit:** `POST /withdrawals` → แสดง pending status พร้อม withdrawal_id
- **History:** ลิสต์จาก `GET /withdrawals/me` แสดง status PD/AP/CP/RJ + slip url ถ้า CP
- **APIs:** `POST /withdrawals`, `GET /withdrawals/me`, `GET /withdrawals/:id`

### 10.3 ตาราง DB

ดูสคีมาเต็มที่ `system_analysis_flow.md` §11.4 และ §8.2 ของเอกสารนี้:
- `topup_intents` — เก็บ QR + status สำหรับเติมเงิน
- `withdrawal_requests` — ใช้ `promptpay_type` + `promptpay_target` + `account_name`

### 10.4 API endpoints

| Method | Endpoint | Priority |
|--------|---------|---------|
| `POST` | `/api/v1/wallet/topup-intents` | **Critical** |
| `GET` | `/api/v1/wallet/topup-intents/:id` | **Critical** |
| `POST` | `/api/v1/wallet/topup-intents/:id/confirm` (admin/webhook) | **Critical** |
| `POST` | `/api/v1/withdrawals` | **High** |
| `GET` | `/api/v1/withdrawals/me` | **High** |
| `GET` | `/api/v1/withdrawals/:id` | **High** |
| `POST` | `/api/v1/withdrawals/:id/cancel` | Medium |
| `GET` | `/api/v1/admin/withdrawals?status=PD` | High (admin) |
| `POST` | `/api/v1/admin/withdrawals/:id/approve` | High (admin) |
| `POST` | `/api/v1/admin/withdrawals/:id/reject` | High (admin) |

### 10.5 Validation rules

- **`promptpay_target`:**
  - ถ้า `promptpay_type = PH` → ต้อง match `^0[6-9]\d{8}$` (เบอร์มือถือไทย)
  - ถ้า `promptpay_type = CI` → ต้อง match `^\d{13}$` + ต้องผ่าน checksum เลขบัตรประชาชน
- **Top-up:** จำนวนขั้นต่ำ 100 บาท, สูงสุดต่อครั้ง 50,000 บาท (ปรับได้ใน config)
- **Withdraw:** จำนวนขั้นต่ำ 200 บาท, ต้องมี `wallets.balance >= amount + fee`, ค่าธรรมเนียมเริ่มต้น 10 บาท/รายการ (กำหนดใน config)

---

*สิ้นสุด v1.3*
