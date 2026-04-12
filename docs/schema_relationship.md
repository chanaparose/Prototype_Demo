# WeMake Platform — Schema Relationship Documentation

**Version:** 1.0
**Date:** 11 เมษายน 2026
**Database:** PostgreSQL (Render)
**Total Tables:** 34

---

## 1. System Overview & Workflow Mapping

WeMake เป็นแพลตฟอร์ม B2B Matching ที่เชื่อม **Customer (CT)** กับ **Factory (FT)** ผ่าน 19 ขั้นตอน ฐานข้อมูลออกแบบเป็น 8 กลุ่มหลัก:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WORKFLOW → TABLE MAPPING                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Step 1-2.5   Register & Verify                                    │
│  ┌──────┐   ┌───────────┐   ┌──────────────────┐                  │
│  │ users │──▶│ customers │   │ factory_profiles │                  │
│  └──┬───┘   └───────────┘   └────────┬─────────┘                  │
│     │                                │                              │
│  Step 3      Profile + Categories    │                              │
│     │   ┌────────────────────────────┼──────────────────┐          │
│     │   │ map_factory_categories     │                  │          │
│     │   │ map_factory_sub_categories │                  │          │
│     │   │ map_factory_certificates   │                  │          │
│     │   └────────────────────────────┘                  │          │
│     │                                                    │          │
│  Step 4      Showcases                                   │          │
│     │   ┌────────────────────┐   ┌────────────────────┐ │          │
│     │   │ factory_showcases  │──▶│map_showcase_categories│          │
│     │   └────────────────────┘   └────────────────────┘ │          │
│     │                                                    │          │
│  Step 5-10.5 RFQ → Quotation → Accept                   │          │
│     │   ┌──────┐   ┌────────────┐   ┌────────────┐     │          │
│     ├──▶│ rfqs │──▶│ quotations │──▶│   orders   │     │          │
│     │   └──────┘   └────────────┘   └─────┬──────┘     │          │
│     │                                      │            │          │
│  Step 8      Chat                          │            │          │
│     │   ┌───────────────┐   ┌──────────┐  │            │          │
│     ├──▶│ conversations │──▶│ messages │  │            │          │
│     │   └───────────────┘   └──────────┘  │            │          │
│     │                                      │            │          │
│  Step 12-17  Production                    │            │          │
│     │   ┌──────────────────┐  ┌──────────────────┐     │          │
│     │   │production_updates│◀─┤ production_steps  │     │          │
│     │   └──────────────────┘  └──────────────────┘     │          │
│     │                                      │            │          │
│  Step 17.5   Review                        │            │          │
│     │   ┌─────────────────┐               │            │          │
│     │   │ factory_reviews │               │            │          │
│     │   └─────────────────┘               │            │          │
│     │                                      │            │          │
│  Step 11.5-19 Finance                      │            │          │
│     │   ┌─────────┐   ┌──────────────┐    │            │          │
│     └──▶│ wallets │──▶│ transactions │◀───┘            │          │
│         └─────────┘   └──────────────┘                  │          │
│                                                          │          │
│  Master Data (Reference)                                 │          │
│  ┌──────────────┐ ┌──────────────────┐ ┌─────────────┐ │          │
│  │ categories   │ │lbi_sub_categories│ │lbi_units    │ │          │
│  │lbi_factory_  │ │lbi_shipping_     │ │lbi_certifi- │ │          │
│  │  types       │ │  methods         │ │  cates      │ │          │
│  │lbi_production│ │lbi_provinces     │ │lbi_districts│ │          │
│  └──────────────┘ └──────────────────┘ └─────────────┘ │          │
└─────────────────────────────────────────────────────────────────────┘
```

### Step-to-Table Quick Reference

| Step | รายละเอียด | ตารางหลัก | ตารางเชื่อม |
|------|-----------|-----------|-------------|
| 1 | Register user (CT/FT) | **users**, **customers** | **wallets** (auto-create) |
| 2 | Register factory | **factory_profiles** | **lbi_factory_types** |
| 2.5 | Admin verify | **factory_profiles**.is_verified | — |
| 3 | Fill profile + categories | **factory_profiles** | **map_factory_categories**, **map_factory_sub_categories**, **map_factory_certificates**, **addresses** |
| 4 | Add showcases | **factory_showcases** | **map_showcase_categories**, **categories**, **lbi_sub_categories** |
| 5 | Create RFQ | **rfqs**, **rfq_images** | **categories**, **lbi_sub_categories**, **lbi_units**, **lbi_shipping_methods**, **addresses** |
| 6 | Match RFQ → factories | **map_factory_categories** JOIN **rfqs** | **map_factory_sub_categories** |
| 6.5 | Factory views matched RFQs | **rfqs** filtered by category match | **notifications** |
| 7 | Send quotation | **quotations** | **lbi_shipping_methods** |
| 8 | Chat | **conversations**, **messages** | — |
| 9 | Edit quotation | **quotations** (UPDATE) | — |
| 10 | Accept offer | **quotations**.status → `AC` | — |
| 10.5 | Auto-reject + close RFQ | **quotations** → `RJ`, **rfqs** → `CL` | — |
| 11 | Create order | **orders** | **quotations** |
| 11.5 | Payment | **transactions** | **wallets** |
| 12 | Enter production | **orders**.status → `PR` | — |
| 12.5 | Auto-create steps | **production_updates** | **production_steps** / **lbi_production** |
| 13-14 | Update production | **production_updates** (INSERT/UPDATE) | — |
| 13.5 | Trigger payment | **transactions** | **wallets** |
| 15 | Final payment | **transactions** (type=`DP`) | **wallets** |
| 16 | Update status | **orders**.status → `CP` | — |
| 17 | Close job | **orders**.status → `CP` | — |
| 17.5 | Review | **factory_reviews** | **factory_profiles** (update rating) |
| 18 | Settlement | **transactions** (type=`SC`) | **wallets**.good_fund += |
| 19 | Withdraw | **transactions** (type=`WD`) | **wallets**.good_fund -= |

---

## 2. Users, Authentication & Factory Verification (Steps 1, 2, 2.5, 3)

### 2.1 Core Tables

#### **`users`** — ตารางกลาง ทุก entity ในระบบ

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | BIGSERIAL PK | รหัสผู้ใช้ (ใช้เป็น FK ทุกที่) |
| `role` | CHAR(2) | **`CT`** = Customer, **`FT`** = Factory |
| `email` | VARCHAR(100) UNIQUE | อีเมล (ใช้ login) |
| `phone` | VARCHAR(20) | เบอร์โทร |
| `password_hash` | TEXT | bcrypt hash |
| `is_active` | BOOLEAN | สถานะ active/inactive |
| `created_at` | TIMESTAMP | วันสมัคร |
| `updated_at` | TIMESTAMP | วันอัปเดตล่าสุด |

**CHECK:** `role IN ('CT', 'FT')`

> **Design Decision:** `users` เป็น single table สำหรับทั้ง CT และ FT แยกข้อมูลเพิ่มเติมไปที่ **customers** (สำหรับ CT) และ **factory_profiles** (สำหรับ FT)

---

#### **`customers`** — ข้อมูลเฉพาะ Customer

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | BIGINT PK, FK→users | 1:1 กับ users |
| `first_name` | VARCHAR(100) | ชื่อ |
| `last_name` | VARCHAR(100) | นามสกุล |

---

#### **`factory_profiles`** — ข้อมูลเฉพาะ Factory

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | BIGINT PK, FK→users | 1:1 กับ users |
| `factory_name` | VARCHAR(150) | ชื่อโรงงาน/บริษัท |
| `factory_type_id` | BIGINT FK→lbi_factory_types | ประเภทโรงงาน |
| `tax_id` | VARCHAR(20) | เลขประจำตัวผู้เสียภาษี |
| `rating` | NUMERIC | คะแนนเฉลี่ย (คำนวณจาก reviews) |
| `review_count` | INTEGER | จำนวนรีวิว |
| `specialization` | VARCHAR(200) | ความเชี่ยวชาญ |
| `min_order` | INTEGER | MOQ (Minimum Order Quantity) |
| `lead_time_desc` | VARCHAR(50) | ระยะเวลาผลิตโดยประมาณ |
| **`is_verified`** | **BOOLEAN** | **สถานะการยืนยันจาก Admin (Step 2.5)** |
| `completed_orders` | INTEGER | จำนวน order ที่ทำสำเร็จ |
| `image_url` | TEXT | รูปโปรไฟล์โรงงาน |
| `description` | TEXT | คำอธิบาย |
| `price_range` | VARCHAR(50) | ช่วงราคา |
| `province_id` | BIGINT FK→lbi_provinces | จังหวัดที่ตั้ง |

---

### 2.2 Relationship Diagram — Users

```
                        ┌──────────────────┐
                        │      users       │
                        │ (user_id PK)     │
                        │ role: CT | FT    │
                        └────────┬─────────┘
                                 │
                    ┌────────────┼────────────┐
                    │ (role=CT)  │ (role=FT)  │
                    ▼            │            ▼
            ┌───────────┐       │    ┌──────────────────┐
            │ customers │       │    │ factory_profiles  │
            │ (1:1)     │       │    │ (1:1)             │
            └───────────┘       │    │ is_verified ◄─────── Step 2.5
                                │    │ factory_type_id ──── FK → lbi_factory_types
                                │    │ province_id ──────── FK → lbi_provinces
                                │    └────────┬───────────┘
                                │             │
                                ▼             │ Step 3: Profile setup
                        ┌───────────┐         │
                        │ addresses │         ├──▶ map_factory_categories
                        │ (N:1)     │         ├──▶ map_factory_sub_categories
                        └───────────┘         └──▶ map_factory_certificates
                                │
                                │
                        ┌───────────┐
                        │  wallets  │ ◄── auto-create on register
                        │ (1:1)    │
                        └───────────┘
```

### 2.3 Factory Expertise Mapping (Step 3)

#### **`map_factory_categories`** — โรงงานรับผลิตหมวดไหน

| Column | Type | Description |
|--------|------|-------------|
| `map_id` | BIGSERIAL PK | |
| `factory_id` | BIGINT FK→users | user_id ของโรงงาน |
| `category_id` | BIGINT FK→categories | หมวดสินค้าที่รับผลิต |

**UNIQUE:** `(factory_id, category_id)` — ไม่ซ้ำ

**ใช้สำหรับ:** RFQ Matching (Step 6) — `WHERE rfqs.category_id IN (SELECT category_id FROM map_factory_categories WHERE factory_id = ?)`

---

#### **`map_factory_sub_categories`** — ความเชี่ยวชาญย่อย

| Column | Type | Description |
|--------|------|-------------|
| `factory_id` | BIGINT FK→users | PK (composite) |
| `sub_category_id` | BIGINT FK→lbi_sub_categories | PK (composite) |

**PK:** `(factory_id, sub_category_id)` — composite primary key

**ใช้สำหรับ:** RFQ Matching ระดับย่อย (Step 6) — ถ้า RFQ ระบุ sub_category ระบบจะ match เฉพาะโรงงานที่ลงทะเบียนรับ sub_category นั้น

---

#### **`map_factory_certificates`** — ใบรับรองที่โรงงานมี

| Column | Type | Description |
|--------|------|-------------|
| `map_id` | BIGSERIAL PK | |
| `factory_id` | BIGINT | user_id ของโรงงาน |
| `cert_id` | BIGINT FK→lbi_certificates | ใบรับรอง |
| `document_url` | TEXT | URL เอกสาร |
| `expire_date` | DATE | วันหมดอายุ |
| `cert_number` | VARCHAR(100) | เลขที่ใบรับรอง |
| `verify_status` | CHAR(2) | `AP` = Approved |
| `uploaded_at` | TIMESTAMP | วันอัปโหลด |

---

#### **`addresses`** — ที่อยู่ (ทั้ง Customer และ Factory)

| Column | Type | Description |
|--------|------|-------------|
| `address_id` | BIGSERIAL PK | |
| `user_id` | BIGINT FK→users | เจ้าของที่อยู่ |
| `address_type` | VARCHAR(1) | **`C`** = Contact, **`M`** = Manufacturing |
| `address_detail` | VARCHAR(255) | ที่อยู่ |
| `sub_district_id` | BIGINT | ตำบล |
| `district_id` | BIGINT | อำเภอ |
| `province_id` | BIGINT | จังหวัด |
| `zip_code` | VARCHAR(10) | รหัสไปรษณีย์ |
| `is_default` | BOOLEAN | ที่อยู่หลัก |

**CHECK:** `address_type IN ('C', 'M')`
**ใช้โดย:** `rfqs.address_id` — ที่อยู่จัดส่งของ RFQ

---

## 3. Master Data (Reference Tables)

Master data เป็นตาราง **read-only** สำหรับ dropdown / lookup ทั้งหมดขึ้นต้น `lbi_` (Lookup/Label) + `categories`

### 3.1 Product Taxonomy

```
categories (13 หมวด)
    │
    └──▶ lbi_sub_categories (65 หมวดย่อย)
              │
              ├── FK: category_id → categories.category_id
              ├── UNIQUE: (category_id, name)
              └── ใช้โดย: rfqs.sub_category_id,
                           factory_showcases.sub_category_id,
                           map_factory_sub_categories.sub_category_id
```

#### **`categories`** — หมวดสินค้าหลัก

| category_id | name |
|---|---|
| 1 | อาหารสัตว์ |
| 2 | อาหารเสริม |
| 3 | ของเล่นสัตว์เลี้ยง |
| 4 | ที่นอนและบ้าน |
| 5 | กระเป๋าและรถเข็น |
| 6 | บรรจุภัณฑ์ |
| 7 | ผลิตภัณฑ์บำรุง |
| 8 | เสื้อผ้าสัตว์เลี้ยง |
| 9 | ห้องน้ำและทราย |
| 10 | ตู้ปลาและกรง |
| 11 | ขนมสัตว์เลี้ยง |
| 12 | ผลิตภัณฑ์ทําความสะอาด |
| 13 | อุปกรณ์สัตว์เลี้ยง |

**ใช้โดย:** `rfqs.category_id`, `factory_showcases.category_id`, `map_factory_categories.category_id`

#### **`lbi_sub_categories`** — หมวดย่อย (65 รายการ)

| Column | Type | Description |
|--------|------|-------------|
| `sub_category_id` | BIGSERIAL PK | |
| `category_id` | BIGINT FK→categories | หมวดแม่ |
| `name` | VARCHAR(100) | ชื่อหมวดย่อย |
| `status` | CHAR(1) | `1` = Active, `0` = Inactive |
| `sort_order` | INTEGER | ลำดับแสดง (99 = "ทุกชนิด" fallback) |

**ตัวอย่าง:** category_id=1 (อาหารสัตว์) → อาหารสุนัข, อาหารแมว, อาหารนก/สัตว์เล็ก, อาหารสัตว์ทุกชนิด

---

### 3.2 Factory Classification

#### **`lbi_factory_types`** — ประเภทโรงงาน (11 ประเภท)

| Column | Type | Description |
|--------|------|-------------|
| `factory_type_id` | BIGSERIAL PK | |
| `type_name` | VARCHAR(150) UNIQUE | ชื่อประเภท เช่น "โรงงานอาหารสัตว์" |
| `status` | CHAR(1) | `1` / `0` |

**ใช้โดย:** `factory_profiles.factory_type_id`, `lbi_production.factory_type_id`

#### **`lbi_certificates`** — ใบรับรองมาตรฐาน (10 ใบ)

| Column | Type | Description |
|--------|------|-------------|
| `cert_id` | BIGSERIAL PK | |
| `cert_name` | VARCHAR(150) | ชื่อ เช่น ISO 9001, GMP, HACCP, อย. |
| `description` | TEXT | คำอธิบาย |
| `status` | CHAR(1) | `1` / `0` |

**ใช้โดย:** `map_factory_certificates.cert_id`

---

### 3.3 Measurement & Logistics

#### **`lbi_units`** — หน่วยนับ (14 หน่วย)

| Column | Type | Description |
|--------|------|-------------|
| `unit_id` | BIGSERIAL PK | |
| `unit_name_th` | VARCHAR(50) | ชื่อไทย (ชิ้น, กล่อง, กก.) |
| `unit_name_en` | VARCHAR(50) | ชื่ออังกฤษ (Piece, Box, Kilogram) |
| `status` | CHAR(1) | `1` / `0` |

**ใช้โดย:** `rfqs.unit_id`

#### **`lbi_shipping_methods`** — วิธีจัดส่ง (7 วิธี)

| Column | Type | Description |
|--------|------|-------------|
| `shipping_method_id` | BIGSERIAL PK | |
| `method_name` | VARCHAR(100) UNIQUE | ชื่อ เช่น "ลูกค้ารับเองที่โรงงาน" |
| `status` | CHAR(1) | `1` / `0` |

**ใช้โดย:** `rfqs.shipping_method_id`, `quotations.shipping_method_id`

---

### 3.4 Production Templates

#### **`lbi_production`** — template ขั้นตอนผลิตต่อประเภทโรงงาน (63 rows)

| Column | Type | Description |
|--------|------|-------------|
| `step_id` | BIGSERIAL PK | |
| `factory_type_id` | BIGINT FK→lbi_factory_types | ประเภทโรงงาน |
| `step_name` | VARCHAR(150) | ชื่อขั้นตอน เช่น "ยืนยันคำสั่งซื้อ", "QC" |
| `sequence` | INTEGER | ลำดับ (1, 2, 3, ...) |
| `status` | CHAR(1) | `1` / `0` |

**UNIQUE:** `(factory_type_id, sequence)`

**ใช้สำหรับ:** Step 12.5 — เมื่อ order เข้าสู่การผลิต ระบบดึง template จากตารางนี้ตาม `factory_type_id` แล้วสร้าง `production_updates` อัตโนมัติ

**ตัวอย่าง:** factory_type_id=2 (โรงงานอาหารสัตว์):
```
seq 1: ยืนยันคำสั่งซื้อ
seq 2: จัดเตรียมวัตถุดิบ
seq 3: ผสมและอัดเม็ด
seq 4: QC
seq 5: บรรจุภัณฑ์
seq 6: จัดส่ง
```

---

### 3.5 Location Master

```
lbi_provinces (10 จังหวัด)
    │
    └──▶ lbi_districts (12 อำเภอ)
              │
              └──▶ lbi_sub_districts (12 ตำบล + zip_code)
```

ใช้สำหรับ **addresses** — cascading dropdown: จังหวัด → อำเภอ → ตำบล → zip_code auto-fill

---

### 3.6 Master Data Relationship Map

```
                  ┌──────────────┐
                  │  categories  │◀─────────────────────────┐
                  │  (13 rows)   │                          │
                  └──────┬───────┘                          │
                         │ 1:N                              │
                         ▼                                  │
              ┌──────────────────────┐                      │
              │ lbi_sub_categories   │                      │
              │ (65 rows)            │                      │
              └──────────────────────┘                      │
                         │                                  │
          ┌──────────────┼──────────────┐                   │
          ▼              ▼              ▼                   │
   rfqs.sub_       factory_       map_factory_        rfqs.category_id
   category_id     showcases.     sub_categories      factory_showcases.
                   sub_category_id                    category_id
                                                      map_factory_categories
                                                      map_showcase_categories

  ┌──────────────────┐      ┌───────────────────┐
  │ lbi_factory_types│◀─────│  lbi_production   │
  │ (11 rows)        │ 1:N  │  (63 rows)        │
  └────────┬─────────┘      └───────────────────┘
           │
           ▼
    factory_profiles.factory_type_id

  ┌──────────────────┐      ┌───────────────────┐
  │ lbi_certificates │◀─────│map_factory_       │
  │ (10 rows)        │ 1:N  │  certificates     │
  └──────────────────┘      └───────────────────┘

  ┌──────────────────┐      ┌───────────────────┐
  │ lbi_units        │◀─────│ rfqs.unit_id      │
  │ (14 rows)        │      └───────────────────┘
  └──────────────────┘

  ┌──────────────────┐      ┌───────────────────┐
  │lbi_shipping_     │◀─────│ rfqs.shipping_    │
  │  methods (7)     │◀─────│ quotations.       │
  └──────────────────┘      │  shipping_method_id│
                            └───────────────────┘
```

---

## 4. Factory Showcases (Step 4)

### 4.1 Core Table

#### **`factory_showcases`** — ผลงาน/โปรโมชั่นของโรงงาน

| Column | Type | Description |
|--------|------|-------------|
| `showcase_id` | BIGSERIAL PK | |
| `factory_id` | BIGINT | FK→users (user_id ของโรงงาน) |
| `content_type` | CHAR(2) | **`ID`** = Idea, **`PD`** = Product, **`PM`** = Promotion |
| `title` | VARCHAR(200) | ชื่อ |
| `excerpt` | TEXT | คำอธิบายสั้น |
| `image_url` | TEXT | รูปภาพ |
| `category_id` | BIGINT | FK→categories (หมวดหลัก) |
| `sub_category_id` | BIGINT | FK→lbi_sub_categories (หมวดย่อย, สำหรับ PD) |
| `min_order` | INTEGER | MOQ |
| `lead_time_days` | INTEGER | ระยะเวลาผลิต (วัน) |
| `likes_count` | INTEGER | จำนวนถูกใจ |
| `created_at` | TIMESTAMP | วันสร้าง |

### 4.2 Content Types

| Type | ชื่อ | ลักษณะ | Fields ที่ใช้ |
|------|------|--------|-------------|
| `ID` | **Idea** | ไอเดีย/บทความ ไม่มีราคา | title, excerpt, image_url, category_id |
| `PD` | **Product** | สินค้าที่ผลิตได้ มี MOQ | title, excerpt, image_url, **category_id**, **sub_category_id**, min_order, lead_time_days |
| `PM` | **Promotion** | โปรโมชั่น/ส่วนลด | title, excerpt, image_url, category_id, min_order |

### 4.3 Category Mapping

#### **`map_showcase_categories`** — showcase สามารถอยู่ใน multiple categories

| Column | Type | Description |
|--------|------|-------------|
| `map_id` | BIGSERIAL PK | |
| `showcase_id` | BIGINT FK→factory_showcases (CASCADE) | |
| `category_id` | BIGINT FK→categories | |

**UNIQUE:** `(showcase_id, category_id)`

> **Note:** `factory_showcases.category_id` คือ primary category (แสดงเป็นหลัก), ส่วน `map_showcase_categories` รองรับ multi-category filtering ในหน้า Explore

### 4.4 Related Tables

#### **`favorites`** — ผู้ใช้กดถูกใจ showcase

| Column | Type | Description |
|--------|------|-------------|
| `fav_id` | BIGSERIAL PK | |
| `user_id` | BIGINT | ผู้กดถูกใจ |
| `showcase_id` | BIGINT | showcase ที่กด |
| `created_at` | TIMESTAMP | |

#### **`promo_slides`** — Carousel โปรโมชั่นหน้า Explore

| Column | Type | Description |
|--------|------|-------------|
| `slide_id` | BIGSERIAL PK | |
| `title` | VARCHAR(200) | หัวข้อ |
| `subtitle` | VARCHAR(255) | รายละเอียดย่อย |
| `code` | VARCHAR(50) | promo code |
| `image_url` | TEXT | รูปภาพ |
| `status` | CHAR(1) | `1` = Active |

### 4.5 Showcase Relationship Diagram

```
┌──────────────────────┐
│  factory_showcases   │
│  showcase_id PK      │
│  factory_id ─────────│──▶ users.user_id (โรงงาน)
│  content_type: ID/PD/PM
│  category_id ────────│──▶ categories.category_id
│  sub_category_id ────│──▶ lbi_sub_categories.sub_category_id (PD only)
└──────────┬───────────┘
           │ 1:N
           ├──────────▶ map_showcase_categories (multi-category)
           │                 └──▶ categories.category_id
           │
           └──────────▶ favorites
                             └──▶ users.user_id (ผู้กดถูกใจ)
```

---

## 5. RFQ & Quoting Engine (Steps 5, 6, 6.5, 7, 9, 10, 10.5)

### 5.1 Core Tables

#### **`rfqs`** — Request for Quotation (ใบขอเสนอราคา)

| Column | Type | Description |
|--------|------|-------------|
| `rfq_id` | BIGSERIAL PK | |
| `user_id` | BIGINT FK→users | ลูกค้าที่สร้าง RFQ |
| `category_id` | BIGINT FK→categories | หมวดสินค้า |
| `sub_category_id` | BIGINT FK→lbi_sub_categories | หมวดย่อย (nullable) |
| `title` | VARCHAR(100) | หัวข้อ |
| `quantity` | BIGINT | จำนวนที่ต้องการ |
| `unit_id` | BIGINT FK→lbi_units | หน่วยนับ |
| `budget_per_piece` | NUMERIC | งบต่อชิ้น |
| `details` | TEXT | รายละเอียด |
| `address_id` | BIGINT FK→addresses | ที่อยู่จัดส่ง |
| `shipping_method_id` | BIGINT FK→lbi_shipping_methods | วิธีส่ง (nullable) |
| `deadline_date` | DATE | วันที่ต้องการสินค้า |
| **`status`** | **CHAR(2)** | **`OP`** = Open, **`CL`** = Closed, **`CC`** = Cancelled |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### **`rfq_images`** — รูปประกอบ RFQ

| Column | Type | Description |
|--------|------|-------------|
| `image_id` | VARCHAR(64) PK | UUID |
| `rfq_id` | BIGINT FK→rfqs (CASCADE) | |
| `image_url` | TEXT | URL รูปภาพ |

#### **`quotations`** — ใบเสนอราคาจากโรงงาน

| Column | Type | Description |
|--------|------|-------------|
| `quote_id` | BIGSERIAL PK | |
| `rfq_id` | BIGINT FK→rfqs (CASCADE) | RFQ ที่ตอบ |
| `factory_id` | BIGINT FK→users (CASCADE) | โรงงานที่เสนอ |
| `price_per_piece` | NUMERIC | ราคาต่อชิ้น |
| `mold_cost` | NUMERIC | ค่าแม่พิมพ์ |
| `lead_time_days` | INTEGER | ระยะเวลาผลิต (วัน) |
| `shipping_method_id` | BIGINT FK→lbi_shipping_methods | วิธีส่ง |
| **`status`** | **CHAR(2)** | **`PD`** = Pending, **`AC`** = Accepted, **`RJ`** = Rejected |
| `create_time` | TIMESTAMP | |
| `log_timestamp` | TIMESTAMP | |

---

### 5.2 RFQ Matching Logic (Step 6)

เมื่อ Customer สร้าง RFQ ระบบ match โรงงานที่เกี่ยวข้องด้วย query:

```sql
-- Step 1: Match by category (required)
SELECT DISTINCT mfc.factory_id
FROM map_factory_categories mfc
WHERE mfc.category_id = :rfq_category_id

-- Step 2: If RFQ has sub_category, narrow down
INTERSECT
SELECT mfs.factory_id
FROM map_factory_sub_categories mfs
WHERE mfs.sub_category_id = :rfq_sub_category_id  -- nullable

-- Step 3: Only verified factories
AND mfc.factory_id IN (
    SELECT user_id FROM factory_profiles WHERE is_verified = true
);
```

ผลลัพธ์: สร้าง **notifications** ให้โรงงานที่ match

---

### 5.3 Status Transitions

```
RFQ Status Flow:
─────────────────────────────────────────────────
  OP (Open)  ──────▶  CL (Closed)    ← Customer เลือก offer แล้ว (Step 10.5)
     │                                  หรือ RFQ หมดอายุ
     └─────────────▶  CC (Cancelled)  ← Customer ยกเลิกเอง

Quotation Status Flow:
─────────────────────────────────────────────────
  PD (Pending)  ───▶  AC (Accepted)  ← Customer เลือก offer นี้ (Step 10)
     │                                  → trigger สร้าง order
     └──────────────▶  RJ (Rejected) ← Customer เลือก offer อื่น (Step 10.5 auto)
                                        หรือ Factory ถอน offer
```

### 5.4 Relationship Diagram — RFQ & Quotation

```
users (CT)
    │
    │ 1:N
    ▼
┌──────────────┐      ┌──────────────────┐
│    rfqs      │ 1:N  │   rfq_images     │
│  rfq_id PK   │─────▶│   image_id PK    │
│  user_id FK  │      │   rfq_id FK      │
│  category_id │──▶ categories
│  sub_cat_id  │──▶ lbi_sub_categories
│  unit_id     │──▶ lbi_units
│  address_id  │──▶ addresses
│  shipping_id │──▶ lbi_shipping_methods
│  status: OP  │
└──────┬───────┘
       │ 1:N (หลายโรงงานเสนอราคาได้)
       ▼
┌──────────────────┐
│   quotations     │
│  quote_id PK     │
│  rfq_id FK ──────│──▶ rfqs
│  factory_id FK ──│──▶ users (FT)
│  shipping_id ────│──▶ lbi_shipping_methods
│  status: PD      │
└──────┬───────────┘
       │
       │ เมื่อ status=AC (Step 10)
       │ UNIQUE(quote_id) on orders
       ▼
┌──────────────┐
│    orders    │ ◄── 1 quotation = 1 order (Step 11)
└──────────────┘
```

### 5.5 Business Rules

1. **1 RFQ : N Quotations** — หลายโรงงานเสนอราคาได้
2. **1 Quotation = 1 Order** — เมื่อ accept แล้ว สร้าง order (UNIQUE quote_id on orders)
3. **Step 10.5 Auto-reject:** เมื่อ accept 1 quotation → UPDATE ทุก quotation อื่นของ RFQ เป็น `RJ` → UPDATE rfq.status เป็น `CL`
4. **CASCADE:** ลบ RFQ → ลบ quotations + rfq_images ตามไปด้วย

---

## 6. Chat & Communication (Step 8)

### 6.1 Core Tables

#### **`conversations`** — Thread แชทระหว่าง Customer กับ Factory

| Column | Type | Description |
|--------|------|-------------|
| `conv_id` | SERIAL PK | |
| `customer_id` | INTEGER | user_id ของ Customer |
| `factory_id` | INTEGER | user_id ของ Factory |
| `last_message` | TEXT | ข้อความล่าสุด (denormalized สำหรับ list view) |
| `unread_customer` | INTEGER | จำนวนข้อความที่ Customer ยังไม่อ่าน |
| `unread_factory` | INTEGER | จำนวนข้อความที่ Factory ยังไม่อ่าน |
| `has_quote` | BOOLEAN | มีใบเสนอราคาในแชทหรือไม่ |
| `updated_at` | TIMESTAMP | อัปเดตเมื่อมีข้อความใหม่ |

> **Design:** 1 conversation per (customer, factory) pair — ไม่สร้างซ้ำ

#### **`messages`** — ข้อความในแชท

| Column | Type | Description |
|--------|------|-------------|
| `message_id` | VARCHAR(50) PK | UUID |
| `conv_id` | INTEGER | FK→conversations (nullable สำหรับ legacy) |
| `reference_type` | VARCHAR(2) | **`RQ`** = RFQ context, **`OD`** = Order context |
| `reference_id` | BIGINT | rfq_id หรือ order_id |
| `sender_id` | BIGINT FK→users | ผู้ส่ง |
| `receiver_id` | BIGINT FK→users | ผู้รับ |
| `content` | TEXT | ข้อความ |
| `attachment_url` | TEXT | ไฟล์แนบ |
| `message_type` | CHAR(2) | **`TX`** = Text, อื่น ๆ |
| `quote_data` | JSONB | ข้อมูลใบเสนอราคา (ถ้าเป็นข้อความส่ง quote) |
| `is_read` | BOOLEAN | อ่านแล้วหรือยัง |
| `created_at` | TIMESTAMP | |

**CHECK:** `reference_type IN ('RQ', 'OD')`

### 6.2 Relationship Diagram

```
┌─────────────────────┐
│   conversations     │
│   conv_id PK        │
│   customer_id ──────│──▶ users (CT)
│   factory_id ───────│──▶ users (FT)
│   unread_customer   │
│   unread_factory    │
│   has_quote         │
└─────────┬───────────┘
          │ 1:N
          ▼
┌─────────────────────┐
│     messages        │
│   message_id PK     │
│   conv_id FK        │
│   sender_id ────────│──▶ users
│   receiver_id ──────│──▶ users
│   reference_type    │ ─── 'RQ' → rfqs, 'OD' → orders
│   reference_id      │ ─── rfq_id or order_id
│   quote_data (JSONB)│ ─── inline quotation snapshot
└─────────────────────┘
```

### 6.3 How Chat Links to RFQ/Order

- **`reference_type = 'RQ'`** + **`reference_id = rfq_id`**: ข้อความเกี่ยวกับ RFQ (Step 5-10)
- **`reference_type = 'OD'`** + **`reference_id = order_id`**: ข้อความเกี่ยวกับ Order (Step 11+)
- **`quote_data`** (JSONB): เมื่อโรงงานส่ง quotation ในแชท ข้อมูลราคาจะ embed เป็น JSON ใน message

---

## 7. Order & Production Tracking (Steps 11, 12, 12.5, 13, 14, 16, 17, 17.5)

### 7.1 Core Tables

#### **`orders`** — คำสั่งซื้อ (สร้างเมื่อ quotation ถูก accept)

| Column | Type | Description |
|--------|------|-------------|
| `order_id` | BIGSERIAL PK | |
| `quote_id` | BIGINT FK→quotations **UNIQUE** | 1 quote = 1 order |
| `user_id` | BIGINT FK→users | Customer |
| `factory_id` | BIGINT FK→users | Factory |
| `total_amount` | NUMERIC | ยอดรวม |
| `deposit_amount` | NUMERIC | เงินมัดจำ |
| **`status`** | **CHAR(2)** | **`PR`** = Production, **`QC`** = Quality Check, **`SH`** = Shipping, **`CP`** = Completed |
| `estimated_delivery` | DATE | วันส่งมอบโดยประมาณ |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### 7.2 How a Quote Becomes an Order (Step 10 → 11)

```
Step 10: Customer accepts quotation
         UPDATE quotations SET status = 'AC' WHERE quote_id = ?

Step 10.5: System auto-rejects other quotations
           UPDATE quotations SET status = 'RJ'
           WHERE rfq_id = ? AND quote_id != ?
           UPDATE rfqs SET status = 'CL' WHERE rfq_id = ?

Step 11: System creates order
         INSERT INTO orders (quote_id, user_id, factory_id, total_amount, ...)
         SELECT quote_id, rfqs.user_id, quotations.factory_id,
                (quotations.price_per_piece * rfqs.quantity) + quotations.mold_cost
         FROM quotations JOIN rfqs ON quotations.rfq_id = rfqs.rfq_id
         WHERE quote_id = ?
```

### 7.3 Order Status Flow

```
                   ┌──── Step 11 ────┐
                   │                 │
                   ▼                 │
    ┌────┐  deposit  ┌────┐  all steps  ┌────┐  shipped  ┌────┐
    │ PP │──────────▶│ PR │───────────▶│ QC │──────────▶│ SH │───▶ CP
    └────┘  paid     └────┘  completed  └────┘  & QC OK  └────┘  delivered
   (Pending         (Production)      (Quality         (Shipping)
    Payment)                           Check)

    PP: Pending Payment  ← order สร้างแล้ว รอจ่ายเงินมัดจำ
    PR: Production       ← กำลังผลิต (Step 12-14)
    QC: Quality Check    ← ตรวจคุณภาพ
    SH: Shipping         ← กำลังจัดส่ง
    CP: Completed        ← ปิดงาน (Step 17)
```

> **Note:** สถานะ `PP` ยังไม่มีใน CHECK constraint ปัจจุบัน (มีเฉพาะ PR, QC, SH, CP) — ต้องเพิ่มเมื่อ implement payment flow

---

### 7.4 Production Tracking

#### **`production_steps`** — ขั้นตอนผลิตมาตรฐาน (generic, ใช้ร่วมกันทุกโรงงาน)

| step_id | name | sort_order |
|---------|------|------------|
| 1 | deposit_confirmed | 1 |
| 2 | raw_material | 2 |
| 3 | production | 3 |
| 4 | qc | 4 |
| 5 | shipping | 5 |
| 6 | completed | 6 |

> **Note:** ตารางนี้เป็น generic steps สำหรับ tracking ปัจจุบัน ส่วน **lbi_production** (63 rows) เป็น template ละเอียดต่อ factory_type — ใช้สำหรับ auto-generate ใน Step 12.5

#### **`production_updates`** — บันทึกความคืบหน้าการผลิต

| Column | Type | Description |
|--------|------|-------------|
| `update_id` | BIGSERIAL PK | |
| `order_id` | BIGINT FK→orders (CASCADE) | |
| `step_id` | BIGINT FK→production_steps | ขั้นตอนที่อัปเดต |
| `description` | TEXT | รายละเอียด |
| `image_url` | TEXT | รูปประกอบ |
| **`status`** | **CHAR(2)** | **`CR`** = Created, **`PD`** = Pending, **`CD`** = Completed |
| `update_date` | TIMESTAMP | วันที่อัปเดต |
| `created_at` | TIMESTAMP | |

### 7.5 Review (Step 17.5)

#### **`factory_reviews`** — ลูกค้ารีวิวโรงงาน

| Column | Type | Description |
|--------|------|-------------|
| `review_id` | BIGSERIAL PK | |
| `factory_id` | BIGINT | user_id ของโรงงาน |
| `user_id` | BIGINT | user_id ของ Customer |
| `rating` | INTEGER | คะแนน 1-5 |
| `comment` | TEXT | ความคิดเห็น |
| `created_at` | TIMESTAMP | |

**Side effect:** เมื่อ INSERT review → UPDATE `factory_profiles` SET `rating` = AVG, `review_count` += 1

### 7.6 Relationship Diagram — Orders & Production

```
quotations (status=AC)
       │
       │ 1:1 (UNIQUE quote_id)
       ▼
┌──────────────────┐
│     orders       │
│  order_id PK     │
│  quote_id FK ────│──▶ quotations (1:1)
│  user_id FK ─────│──▶ users (Customer)
│  factory_id FK ──│──▶ users (Factory)
│  status: PR→CP   │
└──────┬───────────┘
       │
       ├──── 1:N ─────▶ production_updates
       │                    │
       │                    └──▶ production_steps (FK step_id)
       │
       ├──── 1:N ─────▶ transactions (การเงิน)
       │
       └──── 1:1 ─────▶ factory_reviews (หลังปิดงาน)
                              │
                              └──▶ factory_profiles (update rating)
```

---

## 8. Finance, Wallet & Settlement (Steps 11.5, 13.5, 15, 18, 19)

### 8.1 Core Tables

#### **`wallets`** — กระเป๋าเงิน (1 wallet per user)

| Column | Type | Description |
|--------|------|-------------|
| `wallet_id` | BIGSERIAL PK | |
| `user_id` | BIGINT FK→users **UNIQUE** | 1:1 กับ user |
| **`good_fund`** | **NUMERIC** | **เงินที่ถอนได้** (Settlement แล้ว) |
| **`pending_fund`** | **NUMERIC** | **เงินที่รอ Settlement** (ยังอยู่ในระบบ) |

#### **`transactions`** — บันทึกธุรกรรมการเงิน

| Column | Type | Description |
|--------|------|-------------|
| `tx_id` | VARCHAR(50) PK | UUID |
| `wallet_id` | BIGINT FK→wallets (CASCADE) | กระเป๋าเงิน |
| `order_id` | BIGINT FK→orders (SET NULL) | order ที่เกี่ยวข้อง (nullable) |
| **`type`** | **CHAR(2)** | ประเภทธุรกรรม (ดูตาราง) |
| `amount` | NUMERIC | จำนวนเงิน |
| **`status`** | **CHAR(2)** | **`ST`** = Success, **`PT`** = Pending, **`RJ`** = Rejected |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### 8.2 Transaction Types

| Code | ชื่อ | ทิศทาง | เกิดที่ Step | รายละเอียด |
|------|------|--------|-------------|------------|
| `DP` | **Deposit** | Customer → Platform | 11.5, 15 | ลูกค้าจ่ายเงิน (มัดจำ/งวด/สุดท้าย) |
| `BU` | **Buy/Purchase** | Platform → Escrow | 11.5 | ระบบล็อคเงินเข้า escrow |
| `SC` | **Settlement** | Escrow → Factory Wallet | 18 | ระบบโอนเงินเข้า good_fund ของโรงงาน |
| `WD` | **Withdrawal** | Factory Wallet → Bank | 19 | โรงงานถอนเงินออก (PromptPay) |
| `RF` | **Refund** | Platform → Customer | — | คืนเงินลูกค้า (กรณียกเลิก/ปัญหา) |

### 8.3 Fund Flow Diagram

```
 Customer                    Platform                     Factory
─────────────────────────────────────────────────────────────────────

Step 11.5
  จ่ายมัดจำ ──── DP ────▶ ┌──────────┐
                          │  Escrow  │  (pending_fund += amount)
Step 13.5                 │ (ระบบ)   │
  จ่ายงวด ───── DP ────▶ │          │
                          │          │
Step 15                   │          │
  จ่ายงวดสุดท้าย DP ───▶ │          │
                          │          │
Step 18                   │          │
  Settlement              │          │── SC ──▶ ┌──────────┐
                          │          │          │  Wallet   │
                          └──────────┘          │ good_fund │
                                                │  += net   │
Step 19                                         │           │
  Withdrawal                                    │           │── WD ──▶ PromptPay
                                                │ good_fund │           (เงินออก)
                                                │  -= amt   │
                                                └──────────┘

กรณี Refund:
  Escrow ──── RF ────▶ Customer (คืนเงิน)
```

### 8.4 Wallet Balance Equations

```
pending_fund = SUM(DP ที่ status=ST) - SUM(SC ที่ status=ST) - SUM(RF ที่ status=ST)
               ↑ เงินที่ลูกค้าจ่ายเข้า    ↑ เงินที่ settle แล้ว   ↑ เงินที่คืนลูกค้า

good_fund    = SUM(SC ที่ status=ST) - SUM(WD ที่ status=ST)
               ↑ เงินที่ settle เข้า wallet    ↑ เงินที่ถอนออกแล้ว
```

### 8.5 Relationship Diagram — Finance

```
┌──────────────┐
│    orders    │
│  order_id PK │
└──────┬───────┘
       │ 1:N
       ▼
┌──────────────────┐       ┌──────────────┐
│  transactions    │       │   wallets    │
│  tx_id PK        │       │ wallet_id PK │
│  order_id FK ────│──▶    │ user_id FK   │──▶ users (1:1)
│  wallet_id FK ───│──────▶│ good_fund    │
│  type: DP/BU/SC/ │       │ pending_fund │
│        WD/RF     │       └──────────────┘
│  status: ST/PT/RJ│
└──────────────────┘
```

---

## 9. Notifications (Cross-cutting)

#### **`notifications`** — การแจ้งเตือนผู้ใช้

| Column | Type | Description |
|--------|------|-------------|
| `noti_id` | BIGSERIAL PK | |
| `user_id` | BIGINT | ผู้รับแจ้งเตือน |
| `type` | CHAR(2) | **`SY`** = System, อื่น ๆ |
| `title` | VARCHAR(150) | หัวข้อ |
| `message` | TEXT | เนื้อหา |
| `link_to` | VARCHAR(255) | URL ที่ลิงก์ไป (เช่น /rfqs/123) |
| `is_read` | BOOLEAN | อ่านแล้วหรือยัง |
| `reference_id` | BIGINT | rfq_id / order_id |
| `created_at` | TIMESTAMP | |

**สร้างเมื่อ:** RFQ match (Step 6), quotation received (Step 7), quotation accepted/rejected (Step 10), order status change (Step 12-17), payment required (Step 13.5)

---

## 10. Full Entity-Relationship Summary

### 10.1 Table Count by Domain

| Domain | ตาราง | จำนวน |
|--------|-------|-------|
| **Users & Auth** | users, customers, factory_profiles, addresses, password_reset_tokens | 5 |
| **Factory Mapping** | map_factory_categories, map_factory_sub_categories, map_factory_certificates | 3 |
| **Master Data** | categories, lbi_sub_categories, lbi_factory_types, lbi_certificates, lbi_units, lbi_shipping_methods, lbi_production | 7 |
| **Location** | lbi_provinces, lbi_districts, lbi_sub_districts | 3 |
| **Showcases** | factory_showcases, map_showcase_categories, favorites, promo_slides | 4 |
| **RFQ & Quoting** | rfqs, rfq_images, quotations | 3 |
| **Chat** | conversations, messages | 2 |
| **Orders & Production** | orders, production_steps, production_updates, factory_reviews | 4 |
| **Finance** | wallets, transactions | 2 |
| **System** | notifications | 1 |
| **Total** | | **34** |

### 10.2 FK Dependency Tree (ลำดับ DELETE ที่ปลอดภัย)

```
Level 0 (ไม่มี FK ขาเข้า — ลบก่อน):
  ├── production_updates
  ├── transactions
  ├── factory_reviews
  ├── favorites
  ├── notifications
  ├── password_reset_tokens
  ├── rfq_images
  ├── messages
  ├── map_factory_categories
  ├── map_factory_sub_categories
  ├── map_factory_certificates
  └── map_showcase_categories

Level 1:
  ├── production_steps (← production_updates)
  ├── conversations
  ├── orders (← transactions, production_updates)
  └── promo_slides

Level 2:
  ├── quotations (← orders)
  └── factory_showcases (← map_showcase_categories, favorites)

Level 3:
  ├── rfqs (← quotations, rfq_images)
  ├── wallets (← transactions)
  └── addresses (← rfqs)

Level 4:
  ├── customers (← ไม่มี)
  └── factory_profiles (← ไม่มี)

Level 5:
  └── users (← ทุกอย่าง CASCADE)

Master (ไม่ควรลบ):
  ├── categories, lbi_sub_categories
  ├── lbi_factory_types, lbi_certificates
  ├── lbi_units, lbi_shipping_methods
  ├── lbi_production
  └── lbi_provinces, lbi_districts, lbi_sub_districts
```

### 10.3 CASCADE Rules Summary

| Parent Table | Child Tables | ON DELETE |
|---|---|---|
| **users** | customers, factory_profiles, addresses, wallets, rfqs, quotations, orders, messages, map_factory_sub_categories, password_reset_tokens | **CASCADE** |
| **rfqs** | rfq_images, quotations | **CASCADE** |
| **quotations** | orders | **CASCADE** |
| **orders** | production_updates, transactions (SET NULL) | **CASCADE / SET NULL** |
| **wallets** | transactions | **CASCADE** |
| **factory_showcases** | map_showcase_categories | **CASCADE** |
| **lbi_sub_categories** | map_factory_sub_categories | **CASCADE** |
