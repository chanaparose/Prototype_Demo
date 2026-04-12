# System Analysis: Business Flow vs Database Schema & API Spec

**Project:** Wemake Platform
**วันที่วิเคราะห์:** 6 เมษายน 2026
**ผู้วิเคราะห์:** System Analyst
**เวอร์ชัน:** 2.2 (PromptPay-only wallet policy)

---

## สารบัญ

1. [บทสรุปผู้บริหาร](#1-บทสรุปผู้บริหาร)
2. [Flow ฉบับสมบูรณ์ (25 Steps)](#2-flow-ฉบับสมบูรณ์-25-steps)
3. [การวิเคราะห์ทีละขั้นตอน](#3-การวิเคราะห์ทีละขั้นตอน)
4. [ปัญหาด้าน Database](#4-ปัญหาด้าน-database-ที่พบ)
5. [ช่องว่างด้าน API](#5-ช่องว่างด้าน-api-ที่พบ)
6. [ข้อเสนอ Installment Payment](#6-ข้อเสนอแนะสำหรับ-installment-payment-feature)
7. [Flows ที่ขาดทั้ง flow](#7-flows-ที่ขาดทั้ง-flow)
8. [ตารางสรุปปัญหา](#8-ตารางสรุปปัญหาทั้งหมด)
9. [ลำดับการแก้ไข](#9-ลำดับความสำคัญในการแก้ไข)

---

## 1. บทสรุปผู้บริหาร

จากการวิเคราะห์ Business Flow ฉบับปรับปรุง (25 ขั้นตอน จากเดิม 18) เทียบกับ Database Schema และ API Spec พบประเด็นสำคัญ:

### การเปลี่ยนแปลงจากเวอร์ชัน 1.0

| รายการ | เวอร์ชัน 1.0 | เวอร์ชัน 2.0 |
|--------|-------------|-------------|
| จำนวน Steps | 18 | 25 (เพิ่ม 7 steps ใหม่) |
| `map_showcase_tags` | ยังอยู่ (ไม่ชัด FK) | **ลบทิ้ง** — ไม่ใช้แล้ว |
| `map_factory_categories` | FK ใช้ `tag_id` | FK เปลี่ยนเป็น **`category_id`** |
| `map_factory_sub_categories` | FK ใช้ `tag_id` | FK เปลี่ยนเป็น **`sub_category_id`** |
| `lbi_tags` | ยังอยู่ (NOT USED) | **ลบทิ้ง** — ไม่ใช้แล้ว |
| Missing Flows | ไม่ได้ระบุ | เพิ่ม 6 flows (cancel, dispute, expire, top-up, etc.) |

### สรุปประเด็น

**ประเด็นวิกฤต (Critical):** 6 รายการ
- ไม่มีฟิลด์ `sub_category_id` ในตาราง `rfqs` ทำให้ matching ระดับ sub-category ทำไม่ได้
- ไม่มีฟิลด์ `payment_type` ในตาราง `orders` ทำให้ไม่รองรับจ่ายเต็ม/ผ่อนชำระ
- สถานะ `orders.status` ขาดสถานะสำคัญ (PP, WF, DL, AC, CC)
- ไม่มี API สำหรับ settlement/โอนเงินเข้า wallet โรงงาน
- ไม่มี API/mechanism สำหรับ auto-close order
- ไม่มีตาราง `payment_schedules` สำหรับ installment

**ประเด็นสำคัญ (High):** 10 รายการ
**ประเด็นปานกลาง (Medium):** 7 รายการ
**ประเด็นต่ำ (Low):** 3 รายการ

**สรุป:** ระบบรองรับ flow ได้ ~60-65% ขาดส่วนสำคัญเรื่อง payment flow, installment, auto-matching, settlement

---

## 2. Flow ฉบับสมบูรณ์ (25 Steps)

```
 1.   Register user (CT หรือ FT)
 2.   Register as factory user (role=FT)
 2.5  Admin verify โรงงาน ✨ ใหม่
 3.   Factory กรอก Profile + categories/sub_categories
 4.   Factory เพิ่ม showcases (ID, PD, PM)
 5.   Customer สร้าง RFQ
 6.   ระบบ match RFQ → notify โรงงานที่ match
 6.5  Factory ดู RFQ ที่ match กับตัวเอง ✨ ใหม่
 7.   Factory ส่ง BOQ/quotation
 8.   Customer ↔ Factory แชทคุยกัน
 9.   Factory แก้ไข quotation
10.   Customer เลือก offer
10.5  ระบบ auto-reject offer อื่น + ปิด RFQ ✨ ใหม่
11.   ระบบสร้าง order (status=PP) + แสดงช่องทางจ่ายเงิน
11.5  ระบบ generate payment (QR/wallet) + verify ✨ ใหม่
12.   Payment verified → order เข้าสู่การผลิต
12.5  ระบบ auto-สร้าง production steps จาก template ✨ ใหม่
13.   Factory update production
13.5  ระบบ trigger แจ้งจ่ายเงินงวดถัดไป (ถ้า installment) ✨ ใหม่
14.   Factory update production ต่อจนถึง step สุดท้าย
15.   Customer จ่ายเงินงวดสุดท้าย
16.   ระบบ update production status
17.   Customer ปิดงาน / ระบบ auto-close
17.5  Customer รีวิวโรงงาน ✨ ใหม่
18.   ระบบ settlement → โอนเงินเข้า factory wallet
19.   Factory ถอนเงินจาก wallet ✨ ใหม่
```

### DB Table ที่เปลี่ยนแปลง (ยืนยันจากผู้ใช้)

**`map_factory_categories`** (เดิมชื่อ map_factory_tags) — โครงสร้างใหม่:
| Field | Type | Remark |
|-------|------|--------|
| map_id | int auto increment | PK |
| factory_id | int | FK → users.user_id |
| category_id | int | FK → categories.category_id |

**`map_factory_sub_categories`** — แก้ไข FK:
| Field | Type | Remark |
|-------|------|--------|
| map_id | int auto increment | PK |
| factory_id | int | FK → users.user_id |
| sub_category_id | int | FK → lbi_sub_categories.sub_category_id |

**ลบทิ้ง:**
- ~~`map_showcase_tags`~~ — ไม่ใช้แล้ว
- ~~`lbi_tags`~~ — ไม่ใช้แล้ว

---

## 3. การวิเคราะห์ทีละขั้นตอน

### Step 1: Register user — new user

**Flow:** ผู้ใช้ใหม่สมัครสมาชิกเข้าระบบ

**Database:**
- `users` — รองรับแล้ว (user_id, role, email, phone, password_hash, is_active)
- `customers` — รองรับสำหรับ role CT (first_name, last_name)
- **ข้อสังเกต:** ไม่มีฟิลด์ `avatar_url` ในตาราง users/customers แต่ FE `/frontend/me` คืน `avatar`

**API:**
- `POST /auth/register` — รองรับแล้ว (role CT/FT, email, phone, password)
- คืน JWT token + user object

**Business Logic Gap:**
- ไม่มี email verification / phone OTP verification

**สถานะ: ✅ PASS (มีข้อสังเกตเล็กน้อย)**

---

### Step 2: New user registers as factory user

**Flow:** ผู้ใช้สมัครเป็น user ฝั่งโรงงาน (role=FT)

**Database:**
- `users` (role='FT') + `factory_profiles` (user_id FK)

**API:**
- `POST /auth/register` — รับ role="FT", factory_name, factory_type_id, tax_id

**Business Logic Gap:**
- `factory_profiles.is_verified` มีในตาราง แต่ไม่มี admin API สำหรับ verify → นำไปสู่ Step 2.5

**สถานะ: ✅ PASS (มีข้อสังเกต)**

---

### Step 2.5: Admin verify โรงงาน ✨ ใหม่

**Flow:** Admin ตรวจสอบข้อมูลโรงงานแล้วอนุมัติ → `is_verified = true` → เริ่มรับงานได้

**Database:**
- `factory_profiles.is_verified` — มีฟิลด์แล้ว
- **ขาด:** ไม่มีฟิลด์ `verified_at`, `verified_by` สำหรับ audit

**API:**
- **ขาดทั้งหมด:**
  - ไม่มี `PATCH /admin/factories/:id/verify` (admin approve/reject)
  - ไม่มี `GET /admin/factories?status=pending` (admin ดูรายการรอ verify)
  - ไม่มี admin role ใน `users.role` (มีแค่ CT/FT)

**Business Logic Gap:**
- ต้องกำหนดว่า: auto-verify ทันทีเมื่อสมัคร? หรือต้องรอ admin approve?
- ถ้ายังไม่ verify → โรงงานควรถูก block จากการเสนอราคา / สร้าง showcase

**สถานะ: ❌ FAIL — ขาด Admin role, API, และ verification flow**

---

### Step 3: Factory user กรอก Profile + categories/sub_categories

**Flow:** โรงงานกรอกข้อมูล เลือก categories และ sub_categories ที่ตนเองรับผลิต

**Database:**
- `factory_profiles` — มีฟิลด์ครบ (location, specialization, min_order, lead_time_desc, description, price_range, image_url)
- `map_factory_categories` — เชื่อมโรงงานกับ categories (map_id, factory_id, **category_id** → categories.category_id) ✅ แก้ไขแล้ว
- `map_factory_sub_categories` — เชื่อมโรงงานกับ sub_categories (map_id, factory_id, **sub_category_id** → lbi_sub_categories.sub_category_id) ✅ แก้ไขแล้ว
- `address` — ที่อยู่โรงงาน

**API:**
- `PATCH /factories/:id` — มีแล้ว
- `POST /addresses/` — มีแล้ว
- **ขาด:** ไม่มี API สำหรับจัดการ mapping tables:
  - ไม่มี `PUT /factories/:id/categories` (set categories ทั้งหมดในครั้งเดียว)
  - ไม่มี `PUT /factories/:id/sub-categories` (set sub-categories)

**Business Logic Gap:**
- ไม่ชัดว่า categories ถูก set ตอน register หรือ update profile ภายหลัง
- ควรมี validation: ต้องเลือกอย่างน้อย 1 category

**สถานะ: ❌ FAIL — ขาด API จัดการ category/sub-category mapping**

---

### Step 4: เพิ่ม Showcases (ID, PD, PM) — PD มี sub_categories

**Flow:** โรงงานเพิ่ม showcase โดย PD (Product) ต้องมี sub_categories ด้วย

**Database:**
- `factory_showcases` — มี content_type (PD/PM/ID), title, excerpt, image_url, category_id, min_order, lead_time_days
- ~~`map_showcase_tags`~~ — **ลบทิ้งแล้ว** ไม่ใช้อีกต่อไป
- **ขาด:** ไม่มีฟิลด์ `sub_category_id` ใน `factory_showcases` สำหรับ PD type

**API:**
- `POST /showcases` — มีแล้ว
- `PATCH /showcases/:id` — **ขาด** (แก้ไข showcase)
- `DELETE /showcases/:id` — **ขาด** (ลบ showcase)
- **ขาด:** ไม่มี `sub_category_id` ใน request body

**สถานะ: ❌ FAIL — ขาด sub_category support สำหรับ PD, CRUD ไม่ครบ**

---

### Step 5: Customer สร้าง RFQ

**Flow:** ลูกค้าสร้างใบขอราคา (Request for Quotation)

**Database:**
- `rfqs` — มี: rfq_id, user_id, category_id, title, quantity, unit_id, budget_per_piece, details, address_id, status, deadline_date
- `rfq_images` — รูปภาพประกอบ
- **ขาด (Critical):** ไม่มี `sub_category_id` ในตาราง `rfqs`

**API:**
- `POST /rfqs/` — มีแล้ว
- `POST /rfqs/:rfq_id/images` — มีแล้ว
- **ขาด:** ไม่มี `sub_category_id` ใน request body
- **ขาด:** ไม่มี `deadline_date` ใน request body (แต่มีในตาราง)

**Business Logic Gap:**
- RFQ ไม่มี sub_category → matching ทำได้แค่ระดับ category ใหญ่ → ไม่ตรง requirement

**สถานะ: ❌ FAIL (Critical) — ขาด sub_category_id**

---

### Step 6: ระบบ match RFQ → notify โรงงานที่ match

**Flow:** ระบบ auto-match RFQ กับโรงงาน ตาม categories/sub_categories แล้วส่ง notification

**Database:**
- Matching query: `rfqs.category_id` JOIN `map_factory_categories.category_id`
- ถ้ามี sub_category: JOIN `map_factory_sub_categories.sub_category_id`
- `notifications` — type='RQ' สำหรับแจ้งเตือนโรงงาน

**API:**
- **ขาดทั้งหมด:**
  - ไม่มี backend logic สำหรับ auto-match เมื่อสร้าง RFQ
  - ไม่มี background job/trigger สำหรับ auto-notify

**Matching Algorithm ที่ควรจะเป็น:**
1. Customer สร้าง RFQ (category_id + sub_category_id)
2. Backend query: `SELECT factory_id FROM map_factory_categories WHERE category_id = ?`
3. ถ้ามี sub_category: `INTERSECT map_factory_sub_categories WHERE sub_category_id = ?`
4. สร้าง `notifications` record ให้แต่ละโรงงานที่ match
5. (อนาคต) Push notification / real-time event

**สถานะ: ❌ FAIL (Critical) — ขาด matching logic + notification automation**

---

### Step 6.5: Factory ดู RFQ ที่ match กับตัวเอง ✨ ใหม่

**Flow:** โรงงานเปิดดูรายการ RFQ ที่ระบบ match ให้ (หรือ RFQ ที่ category ตรงกับที่โรงงานรับผลิต)

**Database:**
- ใช้ `map_factory_categories` + `map_factory_sub_categories` JOIN `rfqs`

**API:**
- **ขาดทั้งหมด:**
  - ไม่มี `GET /rfqs?for_factory=true` หรือ `GET /rfqs/matching`
  - `GET /rfqs/` ปัจจุบัน filter ได้แค่ `status` ไม่มี `category_id` / matching mode
- ควรมี: API ที่ auto-filter RFQ ตาม factory's categories จาก token (factory_id)

**Business Logic:**
- Backend ต้อง: ดึง factory_id จาก JWT → query `map_factory_categories` → filter `rfqs` ที่ `category_id` match → return list
- แสดงเฉพาะ RFQ ที่ status=OP (Open) + ยังไม่เลย deadline

**สถานะ: ❌ FAIL — ขาด API ให้โรงงานดู matching RFQs**

---

### Step 7: Factory ส่ง BOQ/quotation

**Flow:** โรงงานส่ง quotation ตอบกลับ RFQ

**Database:**
- `quotations` — quote_id, rfq_id, factory_id, price_per_piece, mold_cost, lead_time_days, shipping_method_id, status (PD/AC/RJ)
- **ขาด:** ไม่มีฟิลด์:
  - `total_price` (ราคารวม)
  - `notes` / `description` (หมายเหตุ)
  - `validity_days` (อายุใบเสนอราคา)
  - `payment_type` (FULL/INSTALLMENT) — สำหรับ installment feature
  - `payment_terms` (เงื่อนไขการชำระ)
  - `deposit_percent` (เปอร์เซ็นต์มัดจำ)

**API:**
- `POST /rfqs/:rfq_id/quotations` — มีแล้ว
- `GET /rfqs/:rfq_id/quotations` — มีแล้ว
- `GET /quotations/:quotation_id` — มีแล้ว

**Business Logic Gap:**
- ไม่มี validation: โรงงานส่ง quotation ได้กี่ครั้งต่อ RFQ?
- ไม่มีเช็คว่า RFQ status=OP ก่อนรับ quotation

**สถานะ: ✅ PASS (มีข้อสังเกตเรื่อง missing fields)**

---

### Step 8: Customer ↔ Factory แชทคุยกัน

**Flow:** ทั้งสองฝ่ายสนทนาเกี่ยวกับ RFQ/quotation

**Database:**
- `conversations` — conv_id, customer_id, factory_id, last_message, unread_customer, unread_factory, has_quote, updated_at
- `messages` — message_id, reference_type (RQ/OD), reference_id, sender_id, receiver_id, content, attachment_url, conv_id, message_type (TX/QT), quote_data, is_read

**API:**
- `POST /conversations` — มีแล้ว
- `GET /conversations` — มีแล้ว
- `POST /messages/` — มีแล้ว
- `GET /messages/` — มีแล้ว
- `GET /messages/threads` — มีแล้ว

**Business Logic Gap:**
- ไม่มี real-time messaging (WebSocket)
- ไม่มี read receipt API (PATCH message is_read)
- ไม่มี mark all as read

**สถานะ: ✅ PASS (รองรับพื้นฐาน แต่ขาด real-time)**

---

### Step 9: Factory แก้ไข quotation

**Flow:** โรงงานแก้ไขรายละเอียดใบเสนอราคา (ราคา, lead time ฯลฯ)

**API:**
- `PATCH /quotations/:id/status` — มีแล้ว แต่เปลี่ยนได้แค่ **status**
- **ขาด:** `PATCH /quotations/:id` สำหรับแก้ไขข้อมูลจริง (price_per_piece, mold_cost, lead_time_days, shipping_method_id)

**Business Logic Gap:**
- ควร validate: แก้ไขได้เฉพาะเมื่อ status = PD (Pending)
- ควรส่ง notification ให้ลูกค้าเมื่อ quotation ถูกแก้ไข

**สถานะ: ❌ FAIL — ขาด PATCH endpoint สำหรับแก้ไขข้อมูล**

---

### Step 10: Customer เลือก offer

**Flow:** ลูกค้ากดรับ quotation จากโรงงาน

**Database:**
- `quotations.status` → AC (Accepted)
- `rfqs.status` → CL (Closed) เมื่อเลือกแล้ว

**API:**
- `PATCH /quotations/:id/status` — มีแล้ว (เปลี่ยนเป็น AC)

**Business Logic Gap:**
- ไม่ชัดว่า quotation อื่นจะถูก auto-reject หรือไม่ → นำไปสู่ Step 10.5

**สถานะ: ✅ PASS (มี API แต่ขาด automation)**

---

### Step 10.5: ระบบ auto-reject offer อื่น + ปิด RFQ ✨ ใหม่

**Flow:** เมื่อ customer accept 1 quotation → ระบบ auto-reject ที่เหลือทั้งหมด → ปิด RFQ

**Database:**
- `quotations` — ทุก record ที่ rfq_id เดียวกันและ status=PD → เปลี่ยนเป็น RJ
- `rfqs.status` → CL (Closed)

**API:**
- **ขาด:** ไม่มี business logic ฝั่ง backend ที่ทำ auto-reject + auto-close
- ควรทำใน backend เมื่อ `PATCH /quotations/:id/status` เป็น AC:
  1. Accept quotation ที่เลือก (PD→AC)
  2. Reject quotation อื่นทั้งหมดใน RFQ เดียวกัน (PD→RJ)
  3. Close RFQ (OP→CL)
  4. สร้าง notification ให้โรงงานที่ถูก accept
  5. สร้าง notification ให้โรงงานที่ถูก reject ทุกราย

**สถานะ: ❌ FAIL — ขาด backend automation logic**

---

### Step 11: ระบบสร้าง order (status=PP) + แสดงช่องทางจ่ายเงิน

**Flow:** หลัง accept quotation → ระบบสร้าง order → รอการชำระเงิน

**Database:**
- `orders` — มี: order_id, quote_id, user_id, factory_id, total_amount, deposit_amount, status, estimated_delivery
- **ขาด (Critical):**
  - `payment_type` (FULL/INSTALLMENT) — ไม่มีฟิลด์แยกรูปแบบการชำระ
  - สถานะ `PP` (Pending Payment) ไม่มี — มีแค่ PR/SH/CP
- `wallets` — good_fund, pending_fund
- `transactions` — type (DP/WD/BU/SC/RF), status (ST/PT/RJ)
- **ขาด:** ไม่มีฟิลด์สำหรับ QR payment (payment_method, reference_code)

**API:**
- `POST /orders/` — มีแล้ว (รับ quote_id)
- **ขาด:** `payment_type` parameter ใน POST /orders
- **ขาด:** Payment gateway integration APIs → ดู Step 11.5

**สถานะ: ❌ FAIL (Critical) — ขาด payment_type, สถานะ PP, payment fields**

---

### Step 11.5: ระบบ generate payment (QR/wallet) + verify ✨ ใหม่

**Flow:** ระบบสร้างช่องทางชำระเงิน → ลูกค้าจ่าย → ระบบ verify

**QR Code Path:**
1. FE เรียก `POST /payments/qr-generate` (order_id, amount)
2. Backend สร้าง QR code จาก payment gateway → คืน QR URL
3. Customer scan จ่ายเงิน
4. Payment gateway callback → `POST /payments/callback`
5. Backend verify → update transaction + order status

**Wallet Path:**
1. FE เรียก `POST /payments/wallet-pay` (order_id, amount)
2. Backend เช็ค `wallets.good_fund` >= amount
3. หัก `good_fund` → ย้ายเข้า platform escrow (or `pending_fund`)
4. สร้าง `transactions` record (type=BU, status=ST)
5. Update order status PP→PR

**Database ที่ขาด:**
- `transactions.payment_method` — (QR/WALLET/BANK)
- `transactions.reference_code` — อ้างอิง payment gateway

**API ที่ขาด:**
- `POST /payments/qr-generate`
- `POST /payments/callback`
- `POST /payments/wallet-pay`
- `GET /payments/:order_id/status`

**สถานะ: ❌ FAIL — ขาดทั้ง DB fields + Payment API module ทั้งหมด**

---

### Step 12: Payment verified → order เข้าสู่การผลิต

**Flow:** ระบบ verify payment → เปลี่ยน order status → เริ่ม production

**Database:**
- `transactions.status` = ST → `orders.status` = PR
- `lbi_production` — production steps template (by factory_type_id)
- `production_updates` — order_id, step_id, status (CP/CR/PD)

**API:**
- `PATCH /orders/:order_id/status` — มีแล้ว
- `PATCH /transactions/:tx_id/status` — มีแล้ว

**Business Logic Gap:**
- ต้องเป็น atomic: verify payment → update order → create production steps → notify
- ไม่มี auto-create production_updates → ดู Step 12.5

**สถานะ: ✅ PASS (มี API แต่ขาด automation)**

---

### Step 12.5: ระบบ auto-สร้าง production steps จาก template ✨ ใหม่

**Flow:** เมื่อ order status เปลี่ยนเป็น PR → ระบบดึง template จาก `lbi_production` → สร้าง `production_updates` ให้ order

**Logic ที่ควรจะเป็น:**
1. ดึง `factory_type_id` จาก `factory_profiles` ของโรงงานใน order
2. Query `lbi_production WHERE factory_type_id = ? AND status = '1' ORDER BY sequence`
3. สร้าง `production_updates` record ต่อ step:
   - step แรก: status = CR (Current)
   - step อื่นๆ: status = PD (Pending)
4. Notify customer: "เริ่มผลิตแล้ว"

**API ที่ขาด:**
- ไม่มี API/trigger สำหรับ auto-init production steps
- ควรเป็น backend logic ที่ trigger เมื่อ order status → PR

**สถานะ: ❌ FAIL — ขาด auto-init logic**

---

### Step 13: Factory update production

**Flow:** โรงงานอัปเดต progress การผลิตทีละ step

**Database:**
- `production_updates` — update_id, order_id, step_id, status (CP/CR/PD), description, image_url, update_date

**API:**
- `POST /orders/:order_id/production-updates` — มีแล้ว
- `GET /orders/:order_id/production-updates` — มีแล้ว
- `PATCH /production-updates/:update_id` — มีแล้ว

**Business Logic Gap:**
- ไม่มี validation ว่า step ต้องอัปเดตตาม sequence
- ไม่มี auto-notify customer เมื่อมี update

**สถานะ: ✅ PASS (รองรับพื้นฐาน)**

---

### Step 13.5: ระบบ trigger แจ้งจ่ายเงินงวดถัดไป (installment) ✨ ใหม่

**Flow:** เมื่อ production ถึง step ที่มี `is_payment_trigger = true` → ระบบแจ้ง customer ให้จ่ายงวดถัดไป

**Database:**
- **ขาด:** `lbi_production.is_payment_trigger` (BOOLEAN) — ระบุ step ที่ trigger payment
- **ขาด:** ตาราง `payment_schedules` — เก็บ installment plan

**Logic ที่ควรจะเป็น:**
1. Factory อัปเดต production step X เป็น CP (Completed)
2. Backend เช็ค: step X มี `is_payment_trigger = true`?
3. ถ้าใช่ → หา `payment_schedules` งวดถัดไปที่ status=PD
4. สร้าง notification → customer: "ถึงกำหนดจ่ายเงินงวดที่ N"
5. Order status → WF (Waiting Final Payment)

**สถานะ: ❌ FAIL — ขาด DB fields + payment_schedules table + trigger logic**

---

### Step 14: Factory update production ต่อจนถึง step สุดท้าย

**Flow:** โรงงานอัปเดต production จนครบทุก step

**API:** ใช้เดียวกับ Step 13 (production-updates CRUD) — มีแล้ว

**Business Logic Gap:**
- เมื่อ step สุดท้ายเป็น CP → ควร auto-update order status (PR→SH หรือ complete ขึ้นกับ payment)

**สถานะ: ✅ PASS**

---

### Step 15: Customer จ่ายเงินงวดสุดท้าย

**Flow:** ลูกค้าชำระเงินส่วนที่เหลือ

**Database:**
- `transactions` — สร้าง record ใหม่
- **ขาด:** `orders.paid_amount` สำหรับ track ยอดที่จ่ายแล้ว
- **ขาด:** `payment_schedules` สำหรับ installment tracking
- **ขาด:** `transactions.type` ไม่มี FP (Final Payment)

**API:**
- `POST /transactions/` — มีแล้ว
- **ขาด:** `GET /orders/:id/remaining-balance`
- **ขาด:** `GET /orders/:id/payment-schedule`

**สถานะ: ❌ FAIL — ขาด installment tracking + final payment flow**

---

### Step 16: ระบบ update production status

**Flow:** หลังจ่ายเงินงวดสุดท้าย → ระบบอัปเดต

**Database:**
- `orders.status` → SH (Shipping) หรือ DL (Delivered)

**API:**
- `PATCH /orders/:order_id/status` — มีแล้ว

**Business Logic Gap:**
- ไม่มี auto-update เมื่อ final payment verified

**สถานะ: ✅ PASS (มี API แต่ขาด automation)**

---

### Step 17: Customer ปิดงาน / ระบบ auto-close

**Flow:** ลูกค้ากดปิดงาน หรือระบบปิดอัตโนมัติเมื่อถึง deadline

**Database:**
- `orders.status` → CP (Completed) หรือ AC (Auto-Closed)
- **ขาด:** `closed_at`, `closed_by` (user/system)
- **ขาด:** สถานะ AC (Auto-Closed)

**API:**
- `PATCH /orders/:order_id/status` — manual close ได้ (→CP)
- **ขาด:**
  - `POST /orders/:id/close` (close + trigger settlement ใน atomic)
  - Cron job สำหรับ auto-close (scan orders ที่เลย deadline)

**สถานะ: ❌ FAIL — ขาด auto-close + close-with-settlement flow**

---

### Step 17.5: Customer รีวิวโรงงาน ✨ ใหม่

**Flow:** หลังปิดงาน → ระบบเชิญ customer ให้รีวิว

**Database:**
- `factory_reviews` — review_id, factory_id, user_id, rating, comment, created_at
- `factory_profiles.rating` + `review_count` — ต้อง auto-update

**API:**
- `POST /factories/:factory_id/reviews` — มีแล้ว ✅
- `GET /factories/:factory_id/reviews` — มีแล้ว ✅

**Business Logic Gap:**
- ไม่มี trigger: เมื่อปิดงาน → สร้าง notification เชิญ review
- ไม่มี auto-update `factory_profiles.rating` + `review_count` เมื่อมี review ใหม่
- ควร validate: review ได้เฉพาะ order ที่ CP/AC แล้ว + customer ที่เป็นเจ้าของ order

**สถานะ: ✅ PASS (มี API แล้ว แต่ขาด trigger + auto-update rating)**

---

### Step 18: ระบบ settlement → โอนเงินเข้า factory wallet

**Flow:** ระบบโอนเงินจาก escrow ไปให้โรงงาน

**Database:**
- `wallets` — good_fund, pending_fund
- `transactions` — type WD (Withdrawal)
- **ขาด:**
  - ไม่มี type "settlement" (SL?) ใน transactions
  - ไม่มีฟิลด์ `platform_fee` สำหรับหัก commission
  - ไม่มีตาราง `settlements` สำหรับ track

**API:**
- **ขาดทั้งหมด:**
  - `POST /settlements` หรือ `POST /wallets/settle`
  - API สำหรับ transfer pending → good_fund ของโรงงาน

**Settlement Flow ที่ควรจะเป็น:**
1. Order CP/AC → trigger settlement
2. คำนวณ: total_amount - platform_fee = net_amount
3. สร้าง `transactions` (type=SL, factory's wallet_id, amount=+net_amount)
4. อัปเดต factory's `wallets.good_fund` += net_amount
5. สร้าง notification ให้โรงงาน: "เงินเข้า wallet แล้ว"

**สถานะ: ❌ FAIL (Critical) — ขาดทั้ง DB, API, business logic**

---

### Step 19: Factory ถอนเงินจาก wallet ผ่าน PromptPay ✨ ใหม่

**Flow:** โรงงานกรอกปลายทาง PromptPay (เบอร์โทร หรือ เลขบัตรประชาชน) + จำนวนเงิน → admin โอน PromptPay จากบัญชีกลาง → upload slip → mark เสร็จ

**Database:**
- `wallets.good_fund` — ยอดที่ถอนได้
- `transactions` — type WD (Withdrawal)
- **ขาด:** ตาราง `withdrawal_requests` (PromptPay target) — ดู §11.4

**API:**
- **ขาดทั้งหมด:**
  - `POST /withdrawals` (factory ขอถอน)
  - `GET /withdrawals/me`, `GET /withdrawals/:id`
  - `POST /admin/withdrawals/:id/approve` / `reject`

**สถานะ: ❌ FAIL — ขาด withdrawal flow (PromptPay)**

---

## 4. ปัญหาด้าน Database ที่พบ

### 4.1 ฟิลด์ที่ขาด (Missing Fields)

| ตาราง | ฟิลด์ที่ขาด | เหตุผล | Priority |
|-------|------------|--------|----------|
| `rfqs` | `sub_category_id` | matching RFQ กับโรงงานระดับ sub-category | **Critical** |
| `orders` | `payment_type` (FULL/INSTALLMENT) | installment feature | **Critical** |
| `orders` | `paid_amount` | track ยอดที่จ่ายแล้ว | **Critical** |
| `orders` | `closed_at`, `closed_by` | track ว่าใครปิดงาน | Medium |
| `factory_showcases` | `sub_category_id` | PD type ต้องมี sub_categories | **High** |
| `quotations` | `payment_type`, `payment_terms`, `deposit_percent` | installment feature | **High** |
| `quotations` | `total_price`, `notes` | BOQ detail | Low |
| `quotations` | `validity_days` | อายุใบเสนอราคา | Low |
| `lbi_production` | `is_payment_trigger` | ระบุ step ที่ trigger payment | **High** |
| `transactions` | `payment_method` (QR/WALLET/BANK) | วิธีชำระเงิน | **High** |
| `transactions` | `reference_code` | อ้างอิง payment gateway | **High** |
| `factory_profiles` | `verified_at`, `verified_by` | audit trail สำหรับ verify | Medium |
| `users` | `avatar_url` | FE ใช้อยู่แล้ว | Low |

### 4.2 ตารางที่ขาด (Missing Tables)

| ตารางที่ควรมี | วัตถุประสงค์ | Priority |
|--------------|-------------|----------|
| `payment_schedules` | installment plan (งวดที่, จำนวนเงิน, กำหนดชำระ, สถานะ) | **Critical** |
| `settlements` | track การโอนเงินให้โรงงาน (order_id, amount, fee, net_amount, status) | **High** |
| `topup_intents` | PromptPay QR intents สำหรับเติมเงิน | **High** |
| `withdrawal_requests` | คำขอถอนเงินผ่าน PromptPay (ดู §11.4) | **High** |

### 4.3 ตารางที่ลบ/เปลี่ยน

| ตาราง | สถานะ | หมายเหตุ |
|-------|-------|---------|
| ~~`map_showcase_tags`~~ | **ลบทิ้ง** | ไม่ใช้แล้ว |
| ~~`lbi_tags`~~ | **ลบทิ้ง** | ไม่ใช้แล้ว |
| `map_factory_categories` | **แก้ FK** | `tag_id` → `category_id` |
| `map_factory_sub_categories` | **แก้ FK** | `tag_id` → `sub_category_id` |

### 4.4 สถานะที่ขาด (Missing Status Values)

| ตาราง | ปัจจุบัน | ที่ขาด | Priority |
|-------|---------|--------|----------|
| `orders.status` | PR, SH, CP | PP (Pending Payment), WF (Waiting Final), DL (Delivered), AC (Auto-Closed), CC (Cancelled), RF (Refunded) | **Critical** |
| `transactions.type` | DP, WD, BU, SC, RF | FP (Final Payment), SL (Settlement), PF (Platform Fee) | **High** |
| `rfqs.status` | OP, CL, CC | EX (Expired) | Low |

### 4.5 ตารางซ้ำซ้อน (Duplicate Tables)

| คู่ที่ซ้ำ | ข้อเสนอ |
|----------|---------|
| `shipping_methods` vs `lbi_shipping_methods` | เหลือแค่ `lbi_shipping_methods` (มี status) |
| `units` vs `lbi_units` | เหลือแค่ `lbi_units` (มี name_th, name_en, status) |

---

## 5. ช่องว่างด้าน API ที่พบ

### 5.1 API ที่ขาดทั้งหมด (Missing Endpoints)

| API ที่ควรมี | Module | Step | Priority |
|-------------|--------|------|----------|
| `PATCH /admin/factories/:id/verify` | Admin (ใหม่) | 2.5 | **High** |
| `GET /admin/factories?status=pending` | Admin (ใหม่) | 2.5 | **High** |
| `PUT /factories/:id/categories` | Module 2 | 3 | **High** |
| `PUT /factories/:id/sub-categories` | Module 2 | 3 | **High** |
| `GET /rfqs/matching` หรือ `GET /rfqs?for_factory=true` | Module 3 | 6, 6.5 | **Critical** |
| `PATCH /quotations/:id` (แก้ไขข้อมูล) | Module 3 | 9 | **High** |
| `POST /payments/qr-generate` | Payment (ใหม่) | 11.5, 15 | **Critical** |
| `POST /payments/callback` | Payment (ใหม่) | 11.5 | **Critical** |
| `POST /payments/wallet-pay` | Payment (ใหม่) | 11.5, 15 | **Critical** |
| `GET /payments/:order_id/status` | Payment (ใหม่) | 11.5 | **High** |
| `GET /orders/:id/payment-schedule` | Module 4 | 11-15 | **Critical** |
| `GET /orders/:id/remaining-balance` | Module 4 | 15 | **High** |
| `POST /orders/:id/close` | Module 4 | 17 | **High** |
| `POST /settlements` | Settlement (ใหม่) | 18 | **Critical** |
| `POST /wallet/topup-intents` | Wallet (ใหม่) | — | **High** |
| `GET /wallet/topup-intents/:id` | Wallet (ใหม่) | — | **High** |
| `POST /withdrawals` | Wallet (ใหม่) | 19 | **High** |
| `GET /withdrawals/me` | Wallet (ใหม่) | 19 | **High** |
| `POST /admin/withdrawals/:id/approve` | Admin | 19 | **High** |
| Cron: auto-close expired orders | Module 4 | 17 | **High** |
| `GET /orders?factory_id=me` | Module 4 | 12-16 | **High** |

### 5.2 API ที่มีแต่ขาด Parameter/Field

| API | สิ่งที่ขาด | Priority |
|-----|-----------|----------|
| `POST /rfqs/` | `sub_category_id`, `deadline_date` | **Critical** |
| `POST /orders/` | `payment_type` (FULL/INSTALLMENT) | **Critical** |
| `POST /showcases` | `sub_category_id` | **High** |
| `GET /rfqs/` | Filter: `category_id`, `sub_category_id` | **High** |
| `GET /orders/` | Filter: `factory_id` | **High** |
| `POST /rfqs/:id/quotations` | `payment_type`, `payment_terms`, `deposit_percent` | **High** |
| `POST /transactions/` | `payment_method`, `reference_code` | **High** |

### 5.3 Backend Automation Logic ที่ขาด

| Logic | รายละเอียด | Step | Priority |
|-------|-----------|------|----------|
| Auto-match RFQ to factories | สร้าง RFQ → match categories → notify โรงงาน | 6 | **Critical** |
| Auto-reject quotations | Accept 1 → reject ที่เหลือ → close RFQ | 10.5 | **High** |
| Payment verification | Gateway callback → verify → update order | 11.5 | **Critical** |
| Auto-init production | Payment verified → สร้าง production steps จาก template | 12.5 | **High** |
| Payment trigger | Production step complete (is_payment_trigger) → notify customer | 13.5 | **High** |
| Auto-close order | Cron: scan expired orders → close + settle | 17 | **High** |
| Settlement automation | Close → calculate fee → transfer to factory wallet | 18 | **Critical** |
| Auto-update factory rating | New review → recalculate avg rating + count | 17.5 | Medium |

---

## 6. ข้อเสนอแนะสำหรับ Installment Payment Feature

### 6.1 ภาพรวม

โรงงานกำหนดรูปแบบการชำระเงินตั้งแต่ตอนเสนอราคา:
- **จ่ายเต็มจำนวน (FULL):** ลูกค้าจ่าย 100% ก่อนเริ่มผลิต
- **ผ่อนชำระ (INSTALLMENT):** ลูกค้าจ่ายเป็นงวด (เช่น 50% มัดจำ + 50% เมื่อส่งมอบ)

### 6.2 DB Changes

#### ตาราง `quotations` — เพิ่มฟิลด์:
```sql
payment_type    ENUM('FULL','INSTALLMENT')   -- โรงงานระบุตอนเสนอราคา
payment_terms   TEXT                          -- "50% มัดจำ, 50% เมื่อส่งมอบ"
deposit_percent DECIMAL(5,2)                  -- 50.00
```

#### ตาราง `orders` — เพิ่มฟิลด์:
```sql
payment_type     ENUM('FULL','INSTALLMENT')  NOT NULL
paid_amount      DECIMAL(12,2)  DEFAULT 0
remaining_amount DECIMAL(12,2)               -- computed or stored
```

#### ตารางใหม่ `payment_schedules`:
```sql
CREATE TABLE payment_schedules (
  schedule_id     INT PRIMARY KEY AUTO_INCREMENT,
  order_id        INT NOT NULL REFERENCES orders(order_id),
  installment_no  INT NOT NULL,               -- งวดที่ (1, 2, 3...)
  amount          DECIMAL(12,2) NOT NULL,
  percentage      DECIMAL(5,2),               -- เช่น 50.00
  due_date        DATE,
  trigger_step_id INT REFERENCES lbi_production(step_id),
  status          CHAR(2) DEFAULT 'PD',        -- PD=Pending, PA=Paid, OD=Overdue
  tx_id           INT REFERENCES transactions(tx_id),
  paid_at         TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

#### ตาราง `lbi_production` — เพิ่มฟิลด์:
```sql
is_payment_trigger  BOOLEAN DEFAULT FALSE
```

### 6.3 Orders Status ที่แนะนำ (ฉบับสมบูรณ์)

```
PP  - Pending Payment (รอชำระเงินงวดแรก)
DP  - Deposit Paid (จ่ายมัดจำแล้ว — สำหรับ installment)
PR  - In Production (กำลังผลิต)
WF  - Waiting Final Payment (รอชำระเงินงวดสุดท้าย)
QC  - Quality Check (ตรวจสอบคุณภาพ)
SH  - Shipping (กำลังจัดส่ง)
DL  - Delivered (ส่งมอบแล้ว)
CP  - Completed (ปิดงานแล้ว)
AC  - Auto-Closed (ระบบปิดอัตโนมัติ)
CC  - Cancelled (ยกเลิก)
RF  - Refunded (คืนเงินแล้ว)
```

### 6.4 Flow Diagrams

#### Full Payment:
```
Accept quote (FULL) → Order (PP)
  → Customer pays 100% (QR/wallet) → Transaction (BU, ST)
  → Order (PR) → Auto-init production steps
  → Production... → Order (SH) → Order (DL)
  → Customer close / auto-close → Order (CP)
  → Settlement → Factory wallet
```

#### Installment Payment:
```
Accept quote (INSTALLMENT, 50%) → Order (PP)
  → System creates 2 payment_schedules:
    งวด 1: 50% (immediate)
    งวด 2: 50% (trigger_step_id = last step)
  → Customer pays งวด 1 → Order (DP → PR)
  → Production...
  → Production reaches trigger step → Order (WF)
  → Notify customer → Customer pays งวด 2
  → Order (PR → SH → DL)
  → Customer close → Order (CP)
  → Settlement → Factory wallet
```

---

## 7. Flows ที่ขาดทั้ง flow

นอกจาก 25 steps หลักแล้ว ยังมี flow สำคัญที่ยังไม่มีในระบบ:

### 7.1 ยกเลิก Order

| สิ่งที่ต้องมี | รายละเอียด |
|-------------|-----------|
| **เมื่อไหร่:** | ก่อนจ่ายเงิน (status=PP) หรือก่อนเริ่มผลิต |
| **DB:** | `orders.status` = CC (Cancelled) |
| **API:** | `PATCH /orders/:id/cancel` หรือ `PATCH /orders/:id/status` → CC |
| **Logic:** | ถ้าจ่ายเงินแล้ว → refund flow (RF), ถ้ายังไม่จ่าย → cancel ทันที |
| **Notification:** | แจ้งทั้งสองฝ่าย |

### 7.2 Dispute / ข้อพิพาท

| สิ่งที่ต้องมี | รายละเอียด |
|-------------|-----------|
| **เมื่อไหร่:** | Customer ไม่พอใจงาน ก่อนปิดงาน |
| **DB ที่ขาด:** | ตาราง `disputes` (dispute_id, order_id, reason, status, resolved_by, resolved_at) |
| **API ที่ขาด:** | `POST /disputes`, `PATCH /disputes/:id/resolve` |
| **Logic:** | Customer เปิด dispute → Admin ตัดสิน → refund บางส่วน/ทั้งหมด หรือ ให้โรงงานแก้ไข |

### 7.3 RFQ หมดอายุ

| สิ่งที่ต้องมี | รายละเอียด |
|-------------|-----------|
| **เมื่อไหร่:** | `rfqs.deadline_date` ผ่านแล้ว + ยังไม่มี accepted quote |
| **DB:** | `rfqs.status` = EX (Expired) — ยังไม่มีสถานะนี้ |
| **Logic:** | Cron job scan → OP + deadline < now → EX, notify customer |

### 7.4 Quotation หมดอายุ

| สิ่งที่ต้องมี | รายละเอียด |
|-------------|-----------|
| **เมื่อไหร่:** | `quotations.validity_days` หมดอายุ + status=PD |
| **DB ที่ขาด:** | `quotations.validity_days` + `quotations.expired_at` (computed) |
| **Logic:** | Cron job scan → PD + expired → EX, notify both parties |

### 7.5 Top-up Wallet

| สิ่งที่ต้องมี | รายละเอียด |
|-------------|-----------|
| **เมื่อไหร่:** | Customer ต้องเติมเงินก่อนจ่าย wallet |
| **API ที่ขาด:** | `POST /wallets/top-up` (via QR/bank transfer) |
| **Logic:** | Generate QR → customer pays → callback → add to good_fund |

### 7.6 Factory ดู Orders ตัวเอง

| สิ่งที่ต้องมี | รายละเอียด |
|-------------|-----------|
| **เมื่อไหร่:** | โรงงานต้องการดู orders ที่ตัวเองรับผลิต |
| **API ที่ขาด:** | `GET /orders?factory_id=me` หรือ auto-filter จาก JWT |
| **ปัจจุบัน:** | `GET /orders` filter ได้แค่ status |

---

## 8. ตารางสรุปปัญหาทั้งหมด

### Issues by Priority

| # | ประเด็น | ประเภท | Step | Priority |
|---|---------|--------|------|----------|
| 1 | `rfqs` ไม่มี `sub_category_id` | DB - Missing Field | 5, 6 | **Critical** |
| 2 | `orders` ไม่มี `payment_type` | DB - Missing Field | 11, 14, 15 | **Critical** |
| 3 | `orders.status` ขาด PP, WF, DL, AC, CC, RF | DB - Missing Status | 11-17 | **Critical** |
| 4 | ไม่มี API settlement/โอนเงินให้โรงงาน | API - Missing | 18 | **Critical** |
| 5 | ไม่มี API/mechanism auto-close order | API - Missing | 17 | **Critical** |
| 6 | ไม่มีตาราง `payment_schedules` | DB - Missing Table | 11, 13.5, 15 | **Critical** |
| 7 | ไม่มี API ให้โรงงานดู matching RFQs | API - Missing | 6, 6.5 | **High** |
| 8 | ไม่มี `PATCH /quotations/:id` แก้ไขข้อมูล | API - Missing | 9 | **High** |
| 9 | `factory_showcases` ไม่มี `sub_category_id` | DB - Missing Field | 4 | **High** |
| 10 | ตาราง `shipping_methods` ซ้ำ `lbi_shipping_methods` | DB - Duplicate | ทั่วไป | **High** |
| 11 | ตาราง `units` ซ้ำ `lbi_units` | DB - Duplicate | 5 | **High** |
| 12 | ไม่มี API โรงงานดู orders ตัวเอง | API - Missing | 12-16 | **High** |
| 13 | `lbi_production` ไม่มี `is_payment_trigger` | DB - Missing Field | 13.5, 14 | **High** |
| 14 | ไม่มี Payment Gateway API (QR, callback) | API - Missing | 11.5, 15 | **High** |
| 15 | ไม่มี API จัดการ factory categories/sub-categories | API - Missing | 3 | **High** |
| 16 | `transactions` ไม่มี `payment_method`, `reference_code` | DB - Missing Field | 11, 15 | **High** |
| 17 | ไม่มี Admin verify API + admin role | API - Missing | 2.5 | **High** |
| 18 | ไม่มี auto-match + auto-notify เมื่อสร้าง RFQ | Logic - Missing | 6 | **Medium** |
| 19 | ไม่มี auto-reject quotations เมื่อ accept 1 ใบ | Logic - Missing | 10.5 | **Medium** |
| 20 | ไม่มี auto-init production steps | Logic - Missing | 12.5 | **Medium** |
| 21 | `POST /rfqs/` ไม่รับ `deadline_date` | API - Missing Param | 5 | **Medium** |
| 22 | `orders` ไม่มี `closed_at`, `closed_by` | DB - Missing Field | 17 | **Medium** |
| 23 | ไม่มี real-time messaging (WebSocket) | Infra - Missing | 8 | **Medium** |
| 24 | ไม่มี auto-update factory rating เมื่อมี review | Logic - Missing | 17.5 | **Medium** |
| 25 | `quotations` ไม่มี `total_price`, `notes`, `validity_days` | DB - Missing Field | 7 | **Low** |
| 26 | `users` ไม่มี `avatar_url` | DB - Missing Field | 1 | **Low** |
| 27 | ไม่มีตาราง `withdrawal_requests` + `topup_intents` (PromptPay) | DB - Missing Table | 19 | **High** |

### สรุปจำนวนปัญหา

| Priority | จำนวน | สัดส่วน |
|----------|-------|---------|
| Critical | 6 | 22% |
| High | 11 | 41% |
| Medium | 7 | 26% |
| Low | 3 | 11% |
| **รวม** | **27** | **100%** |

---

## 9. ลำดับความสำคัญในการแก้ไข

### Phase 1: Critical Fixes (ต้องทำก่อน — เป็นแกนหลักของ business)
1. เพิ่ม `sub_category_id` ใน `rfqs` + อัปเดต API `POST /rfqs/`
2. เพิ่ม `payment_type`, `paid_amount` ใน `orders` + อัปเดต API `POST /orders/`
3. เพิ่มสถานะ orders (PP, WF, DL, AC, CC, RF)
4. สร้างตาราง `payment_schedules`
5. สร้าง Payment Module API (QR generate, callback, wallet-pay)
6. สร้าง Settlement API + automation

### Phase 2: High Priority (ทำให้ flow ครบ)
7. สร้าง API matching RFQ กับ factories (`GET /rfqs/matching`)
8. สร้าง `PATCH /quotations/:id` endpoint
9. เพิ่ม `sub_category_id` ใน `factory_showcases`
10. รวมตารางซ้ำ (shipping_methods, units)
11. สร้าง Factory categories/sub-categories management API
12. เพิ่ม factory_id filter ใน `GET /orders`
13. สร้าง Admin verify API + admin role
14. เพิ่ม `payment_method`, `reference_code` ใน `transactions`
15. เพิ่ม `is_payment_trigger` ใน `lbi_production`

### Phase 3: Medium Priority (automation + UX)
16. Auto-match + auto-notify logic (Step 6)
17. Auto-reject quotations logic (Step 10.5)
18. Auto-init production steps (Step 12.5)
19. Payment trigger automation (Step 13.5)
20. Auto-close cron job (Step 17)
21. Auto-update factory rating (Step 17.5)
22. WebSocket real-time messaging

### Phase 4: Low Priority / Nice-to-have
23. เพิ่ม fields ใน quotations (total_price, notes, validity_days)
24. เพิ่ม avatar_url ใน users
25. สร้างตาราง `topup_intents` + `withdrawal_requests` (PromptPay — ดู §11)
26. Dispute flow
27. RFQ/Quotation expiration cron

---

*สิ้นสุดเอกสารวิเคราะห์ระบบ v2.0*

---

## 10. Sync v2.1 — รวมจาก factory_user_flow_analysis v1.1/1.2

หลังจากวิเคราะห์ฝั่ง Factory user (เอกสาร `factory_user_flow_analysis.md`) พบว่ามีตาราง/ฟิลด์/API ใหม่ที่ควรรวมเข้า master document นี้เพื่อให้ทั้ง 2 ฝั่ง (Customer + Factory) มีภาพระบบเดียวกัน

### 10.1 ตาราง DB ใหม่ (เพิ่มจาก v2.0)

| ตาราง | วัตถุประสงค์ | Priority | ไฟล์ migration |
|------|------------|---------|-------------|
| `quotation_history` | Audit log การแก้ไข quotation (snapshot ทุก version) | **Critical** | `docs/migrations/001_quotation_history.sql` |
| `order_activity_log` | Audit log ทุกการกระทำกับ order | **Critical** | `docs/migrations/001_quotation_history.sql` |
| `production_update_history` | Audit log แก้ไข production updates | High | (รอเขียน) |
| `quotation_templates` | Template ใบเสนอราคาสำหรับ factory | Medium | (รอเขียน) |
| `factory_production_steps` | Template production steps ต่อ factory | Medium | (รอเขียน) |
| `order_shipments` | รายการการจัดส่ง (tracking, courier) | High | (รอเขียน) |
| `topup_intents` | PromptPay QR intents สำหรับเติมเงิน (ดู §11.4) | High | (รอเขียน) |
| `withdrawal_requests` | คำขอถอนเงินผ่าน PromptPay (ดู §11.4) | High | (รอเขียน) |
| `notification_preferences` | ตั้งค่าการแจ้งเตือนรายผู้ใช้ | Low | (รอเขียน) |
| `disputes` | ข้อพิพาท order | Medium | (รอเขียน) |

### 10.2 ฟิลด์ใหม่ในตารางเดิม

| ตาราง | ฟิลด์ | ใช้ทำ | Priority |
|------|------|------|---------|
| `quotations` | `version` (INT, default 1) | track เวอร์ชันใบเสนอราคา | Critical |
| `quotations` | `is_locked` (BOOLEAN, default false) | ล็อกห้ามแก้หลัง customer accept | Critical |
| `quotations` | `last_edited_at` (TIMESTAMP) | เวลาแก้ไขล่าสุด | Critical |
| `quotations` | `last_edited_by` (FK users) | ผู้แก้ไขล่าสุด | Critical |
| `quotations` | `total_price`, `notes`, `validity_days` | (จาก v2.0 Phase 4) | Low |
| `users` | `avatar_url` | (จาก v2.0 Phase 4) | Low |

### 10.3 API endpoints ใหม่ (Phase 1.5 + ที่เหลือจาก factory v1.1)

#### Quotation domain (Phase 1.5 — Critical)
- `PATCH /api/v1/quotations/:id` — แก้ไข + bump version + audit
- `GET /api/v1/quotations/:id/history` — list `quotation_history`
- `GET /api/v1/quotations/me` — list quotations ของ factory ที่ login

#### Order domain
- `GET /api/v1/orders/:id/activity` — list `order_activity_log`
- `POST /api/v1/orders/:id/cancel-request` — ขอยกเลิก order
- `POST /api/v1/orders/:id/shipments` — สร้าง shipment + tracking
- `POST /api/v1/disputes` — เปิด dispute

#### Production domain
- `PATCH /api/v1/production-updates/:id` — แก้ไข + log
- `GET /api/v1/production-updates/:id/history`
- `GET /api/v1/factories/me/production-step-templates`
- `POST /api/v1/orders/:id/init-production-from-template`

#### Wallet / Settlement domain (PromptPay — ดู §11)
- `POST /api/v1/wallet/topup-intents` — สร้าง PromptPay QR สำหรับเติมเงิน
- `GET /api/v1/wallet/topup-intents/:id` — polling สถานะ
- `POST /api/v1/withdrawals` — สร้างคำขอถอนผ่าน PromptPay
- `GET /api/v1/withdrawals/me` — list ของตัวเอง
- `GET /api/v1/settlements/me`

#### Templates / Capacity / Reports
- `GET|POST|DELETE /api/v1/quotation-templates`
- `GET /api/v1/factories/me/capacity?from=&to=`
- `GET /api/v1/factories/me/reports/summary`

#### Account / Notifications
- `GET|PATCH /api/v1/users/me`
- `POST /api/v1/users/me/change-password`
- `GET|PATCH /api/v1/users/me/notification-preferences`
- `GET /api/v1/users/me/documents` (tax docs)

### 10.4 Status Phase 1.5 (Implementation)

| งาน | Layer | สถานะ |
|----|------|------|
| SQL migration `001_quotation_history.sql` | DB | ✅ พร้อมส่ง BE |
| `quotationsApi.history()` / `listMine()` | FE client | ✅ |
| `FactoryEditQuotationPage` (route `/factory/quotations/:id/edit`) | FE page | ✅ |
| `PATCH /quotations/:id` (รองรับ `reason`, `is_locked` check) | BE | ⏳ รอ |
| `GET /quotations/:id/history` | BE | ⏳ รอ |
| `GET /quotations/me` | BE | ⏳ รอ |
| `GET /orders/:id/activity` | BE | ⏳ รอ |

### 10.5 ลำดับการแก้ไข (revised)

แทรก **Phase 1.5** ระหว่าง Phase 1 และ Phase 2 ของแผน v2.0:

**Phase 1.5 — Audit & Edit Foundation** (Critical, ทำก่อน Phase 2)
1. รัน `001_quotation_history.sql` บน BE
2. Implement `PATCH /quotations/:id` + lock check
3. Implement `GET /quotations/:id/history`
4. Implement `GET /quotations/me`
5. Implement `GET /orders/:id/activity`
6. ทดสอบ end-to-end กับหน้า `FactoryEditQuotationPage` ที่ deploy แล้ว

หลัง Phase 1.5 สำเร็จค่อยกลับเข้าลำดับ Phase 2 → 3 → 4 ตามแผนเดิม

---

*สิ้นสุดเอกสารวิเคราะห์ระบบ v2.1 — sync กับ factory v1.2*

---

## 11. PromptPay Wallet Policy

**Decision (2026-04-07, ผู้ใช้ระบุ):** ระบบจะ **ไม่เก็บข้อมูลบัญชีธนาคารของผู้ใช้** ทั้งฝั่ง customer และ factory ทุกการเคลื่อนเงินใช้ **PromptPay** เท่านั้น โดยมี 2 ทิศทาง:

1. **Top-up (เติมเงินเข้า wallet):** customer/factory สแกน PromptPay QR ที่ระบบสร้างให้ → โอนเข้าบัญชีกลางของ Wemake → ระบบ confirm แล้วเครดิตเข้า `wallets.balance`
2. **Withdraw (ถอนเงินออก):** factory ขอถอน → admin โอน PromptPay กลับไปยัง **เบอร์โทร / เลขบัตรประชาชน** ที่ factory ระบุไว้ใน `withdrawal_requests` (ไม่ persist เป็น master record)

### 11.1 โครงสร้าง — Top-up (เติมเงินด้วย PromptPay)

```
Customer/Factory → กดเติมเงิน X บาท
  │
  ▼
POST /api/v1/wallet/topup-intents { amount }
  │
  ▼ BE สร้าง topup_intent + generate PromptPay QR payload
{
  intent_id: "ti_...",
  amount: 1000.00,
  qr_payload: "00020101021229370016A000...",  // EMVCo QR string
  expires_at: "2026-04-07T15:30:00Z",
  status: "PENDING"
}
  │
  ▼ FE แสดง QR + countdown timer
  │
  ▼ ผู้ใช้สแกนโอน → bank webhook / admin manual confirm
  │
  ▼ POST /api/v1/wallet/topup-intents/:id/confirm  (admin หรือ webhook)
  │
  ▼ BE: insert transaction (type=DP), update wallets.balance, mark intent CONFIRMED
  │
  ▼ FE polling GET /api/v1/wallet/topup-intents/:id → CONFIRMED → toast สำเร็จ
```

### 11.2 โครงสร้าง — Withdraw (ถอนผ่าน PromptPay)

```
Factory → กดถอนเงิน X บาท จาก wallet
  │
  ▼ ฟอร์ม:
   - amount
   - promptpay_type: "PHONE" | "CITIZEN_ID"
   - promptpay_target: "0812345678" หรือ "1100xxxxxxxxx"
   - account_name: "ชื่อ-นามสกุลผู้รับ"
  │
  ▼
POST /api/v1/withdrawals { amount, promptpay_type, promptpay_target, account_name }
  │
  ▼ BE: เช็ค wallets.balance >= amount + ค่าธรรมเนียม
       insert withdrawal_requests (status='PENDING'), หัก wallets.balance ทันที (escrow)
  │
  ▼ Admin เห็นใน /admin/withdrawals → ตรวจ → โอน PromptPay จากบัญชีกลาง Wemake
  │
  ▼ Admin กด CONFIRM พร้อมแนบ slip → status='COMPLETED'
       insert transaction (type=WD)
  │
  ▼ ถ้า reject → status='REJECTED', คืน wallets.balance
```

### 11.3 ตาราง DB

#### `topup_intents` (ใหม่)

```sql
CREATE TABLE topup_intents (
  intent_id      VARCHAR(32) PRIMARY KEY,        -- "ti_xxxxx"
  user_id        INT NOT NULL,
  amount         DECIMAL(12,2) NOT NULL,
  qr_payload     TEXT NOT NULL,                  -- EMVCo PromptPay QR string
  status         CHAR(2) NOT NULL DEFAULT 'PD',  -- PD=Pending, CF=Confirmed, EX=Expired, CC=Cancelled
  reference_code VARCHAR(50) NULL,               -- ref จาก bank webhook
  paid_at        TIMESTAMP NULL,
  expires_at     TIMESTAMP NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_topup_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  INDEX idx_topup_user_status (user_id, status, created_at DESC)
);
```

#### `withdrawal_requests`

```sql
CREATE TABLE withdrawal_requests (
  withdrawal_id     INT AUTO_INCREMENT PRIMARY KEY,
  factory_id        INT NOT NULL,
  amount            DECIMAL(12,2) NOT NULL,
  fee               DECIMAL(12,2) NOT NULL DEFAULT 0,
  promptpay_type    CHAR(2) NOT NULL COMMENT 'PH=Phone, CI=CitizenID',
  promptpay_target  VARCHAR(20) NOT NULL,
  account_name      VARCHAR(100) NOT NULL,
  status            CHAR(2) NOT NULL DEFAULT 'PD' COMMENT 'PD=Pending, AP=Approved, CP=Completed, RJ=Rejected',
  admin_id          INT NULL,
  slip_url          VARCHAR(255) NULL,
  reject_reason     TEXT NULL,
  requested_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at      TIMESTAMP NULL,

  CONSTRAINT fk_wd_factory FOREIGN KEY (factory_id) REFERENCES factories(factory_id),
  CONSTRAINT fk_wd_admin   FOREIGN KEY (admin_id)   REFERENCES users(user_id),
  INDEX idx_wd_factory (factory_id, status, requested_at DESC),
  INDEX idx_wd_status  (status, requested_at DESC)
);
```

### 11.4 API endpoints

#### Top-up domain
- `POST /api/v1/wallet/topup-intents` — body `{ amount }` → คืน `{ intent_id, qr_payload, expires_at }`
- `GET /api/v1/wallet/topup-intents/:id` — polling status
- `POST /api/v1/wallet/topup-intents/:id/confirm` — admin/webhook confirm + reference_code
- `POST /api/v1/wallet/topup-intents/:id/cancel` — ยกเลิกก่อนหมดเวลา

#### Withdrawal domain
- `POST /api/v1/withdrawals` — body `{ amount, promptpay_type, promptpay_target, account_name }`
- `GET /api/v1/withdrawals/me` — list ของ factory ที่ login
- `GET /api/v1/withdrawals/:id` — รายละเอียด + slip_url
- `POST /api/v1/withdrawals/:id/cancel` — ยกเลิกก่อน admin approve
- `(Admin) GET /api/v1/admin/withdrawals?status=PD`
- `(Admin) POST /api/v1/admin/withdrawals/:id/approve` — body `{ slip_url }`
- `(Admin) POST /api/v1/admin/withdrawals/:id/reject` — body `{ reason }`

### 11.5 หน้าจอ Frontend ที่กระทบ

| หน้า | การเปลี่ยนแปลง |
|------|-------------|
| `FactoryWalletPage.tsx` | เพิ่มปุ่ม **เติมเงิน** (เปิด modal QR) + ปุ่ม **ถอนเงิน** (เปิดฟอร์ม PromptPay) |
| Customer Wallet (ในอนาคต) | เพิ่มปุ่มเติมเงิน PromptPay เหมือนกัน |
| Modal `TopupQRModal` (ใหม่) | แสดง QR + countdown + auto-poll status |
| Modal/Page `WithdrawRequestForm` (ใหม่) | input PromptPay target + amount + ยืนยัน |

### 11.6 Roadmap — PromptPay work items

- สร้างตาราง `topup_intents` + PromptPay QR generator (BE library: เช่น `promptpay-qr`)
- สร้างตาราง `withdrawal_requests` (PromptPay-target schema)
- สร้าง admin withdrawal approval flow + slip upload
- Bank webhook / manual confirm สำหรับ topup_intents

---

*สิ้นสุดเอกสารวิเคราะห์ระบบ v2.2 — PromptPay-only*
