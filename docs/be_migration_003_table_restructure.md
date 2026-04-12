# Backend Migration Guide — 003 Table Restructure

**วันที่ดำเนินการ DB:** 8 เมษายน 2026
**อัปเดตล่าสุด:** 11 เมษายน 2026 (v2 — เพิ่ม §E-I จากผลตรวจ API)
**ผู้ดำเนินการ:** DBA + System Analyst
**สถานะ DB:** ✅ เสร็จแล้ว — Backend ต้องแก้โค้ดให้ตรง

---

## สรุปสิ่งที่เปลี่ยนในฐานข้อมูล

### A. ตารางที่ RENAME

| เดิม | ใหม่ | คอลัมน์ที่เปลี่ยน | FK ใหม่ |
|---|---|---|---|
| `map_factory_tags` | **`map_factory_categories`** | `tag_id` → **`category_id`** | `category_id → categories.category_id` + `factory_id → users.user_id` |
| `map_showcase_tags` | **`map_showcase_categories`** | `tag_id` → **`category_id`** | `category_id → categories.category_id` + `showcase_id → factory_showcases.showcase_id ON DELETE CASCADE` |

### B. ตารางที่ DROP

| ตาราง | เหตุผล |
|---|---|
| `lbi_tags` | ไม่ใช้แล้ว — tag ถูกแทนด้วย categories |
| `shipping_methods` | ซ้ำซ้อนกับ `lbi_shipping_methods` |
| `units` | ซ้ำซ้อนกับ `lbi_units` |

### C. FK ที่เปลี่ยน

| ตาราง.คอลัมน์ | FK เดิม | FK ใหม่ |
|---|---|---|
| `quotations.shipping_method_id` | `shipping_methods.shipping_method_id` | **`lbi_shipping_methods.shipping_method_id`** |
| `rfqs.unit_id` | `units.unit_id` | **`lbi_units.unit_id`** |

### D. คอลัมน์ใหม่

| ตาราง | คอลัมน์ | Type | Nullable | FK |
|---|---|---|---|---|
| `factory_showcases` | `sub_category_id` | BIGINT | YES | `lbi_sub_categories.sub_category_id` |

---

## โครงสร้างตารางปัจจุบัน (หลัง migration)

### `map_factory_categories` (เดิม map_factory_tags)

```
map_id       BIGSERIAL PRIMARY KEY
factory_id   BIGINT NOT NULL  → FK users.user_id
category_id  BIGINT NOT NULL  → FK categories.category_id
UNIQUE (factory_id, category_id)
```

**วัตถุประสงค์:** เชื่อมโรงงานกับหมวดสินค้าที่รับผลิต ใช้สำหรับ:
- RFQ Matching (ดึงโรงงานที่ match category ของ RFQ)
- Filter โรงงานในหน้า Explore
- Profile page แสดง categories ที่โรงงานรับ

### `map_showcase_categories` (เดิม map_showcase_tags)

```
map_id       BIGSERIAL PRIMARY KEY
showcase_id  BIGINT NOT NULL  → FK factory_showcases.showcase_id ON DELETE CASCADE
category_id  BIGINT NOT NULL  → FK categories.category_id
UNIQUE (showcase_id, category_id)
```

**วัตถุประสงค์:** เชื่อม showcase กับ categories (many-to-many) สำหรับ:
- Filter showcases ตาม category ในหน้า Explore/Factory Ideas
- ใช้คู่กับ `factory_showcases.category_id` (primary category)

### `factory_showcases` (เพิ่มคอลัมน์)

```
... (คอลัมน์เดิม)
sub_category_id  BIGINT NULL  → FK lbi_sub_categories.sub_category_id   ← ใหม่
```

**วัตถุประสงค์:** PD (Product) type ต้องระบุ sub_category ด้วย (เช่น อาหารสุนัข, อาหารแมว)

---

## ไฟล์ Backend ที่ต้องแก้

### 1. Repository Layer — เปลี่ยนชื่อตาราง + คอลัมน์

ค้นหาและแทนที่ในทุกไฟล์ `.go`:

| ค้นหา | แทนที่ด้วย | ไฟล์ที่น่าจะกระทบ |
|---|---|---|
| `map_factory_tags` | `map_factory_categories` | `factory_repository.go`, `catalog_repository.go` |
| `tag_id` (ในบริบท map_factory) | `category_id` | เดียวกัน |
| `map_showcase_tags` | `map_showcase_categories` | `showcase_repository.go` |
| `tag_id` (ในบริบท showcase) | `category_id` | เดียวกัน |
| `lbi_tags` | **ลบ reference ทิ้ง** | ทุกที่ที่อ้าง |
| `FROM shipping_methods` | `FROM lbi_shipping_methods` | `quotation_repository.go` |
| `FROM units` | `FROM lbi_units` | `rfq_repository.go` |
| `JOIN shipping_methods` | `JOIN lbi_shipping_methods` | ทุก query ที่ JOIN |
| `JOIN units` | `JOIN lbi_units` | ทุก query ที่ JOIN |

### 2. Model/Struct — เปลี่ยนชื่อ field

```go
// เดิม
type MapFactoryTag struct {
    MapID     int64 `db:"map_id"`
    FactoryID int64 `db:"factory_id"`
    TagID     int64 `db:"tag_id"`        // ← ลบ
}

// ใหม่
type MapFactoryCategory struct {
    MapID      int64 `db:"map_id"`
    FactoryID  int64 `db:"factory_id"`
    CategoryID int64 `db:"category_id"`  // ← เปลี่ยน
}
```

```go
// เดิม
type MapShowcaseTag struct { ... TagID int64 }

// ใหม่
type MapShowcaseCategory struct { ... CategoryID int64 }
```

```go
// FactoryShowcase — เพิ่ม field
type FactoryShowcase struct {
    // ... existing fields
    SubCategoryID *int64 `db:"sub_category_id" json:"sub_category_id"` // ← ใหม่
}
```

### 3. Handler Layer — เปลี่ยน request/response

```go
// เดิม: GET /factories/:id/tags → return tag_id, tag_name
// ใหม่: GET /factories/:id/categories → return category_id, name

// เดิม: POST /factories/:id/tags  body: { tag_id }
// ใหม่: POST /factories/:id/categories  body: { category_id }
```

### 4. API Routes — เปลี่ยน path

| เดิม | ใหม่ |
|---|---|
| `GET /factories/:id/tags` | **`GET /factories/:id/categories`** |
| `POST /factories/:id/tags` | **`POST /factories/:id/categories`** |
| `DELETE /factories/:id/tags/:tag_id` | **`DELETE /factories/:id/categories/:category_id`** |
| (ถ้ามี) `GET /showcases/:id/tags` | **`GET /showcases/:id/categories`** |

### 5. RFQ Matching Query — สำคัญ

```sql
-- เดิม (ถ้ามี)
SELECT factory_id FROM map_factory_tags
WHERE tag_id = ?

-- ใหม่
SELECT factory_id FROM map_factory_categories
WHERE category_id = ?
```

### 6. Showcase INSERT/UPDATE — เพิ่ม sub_category_id

```sql
-- เดิม
INSERT INTO factory_showcases (factory_id, content_type, title, ..., category_id)
VALUES (?, ?, ?, ..., ?)

-- ใหม่ — เพิ่ม sub_category_id
INSERT INTO factory_showcases (factory_id, content_type, title, ..., category_id, sub_category_id)
VALUES (?, ?, ?, ..., ?, ?)
```

### 7. ลบโค้ดที่เกี่ยวกับ lbi_tags

ค้นหาและลบ:
- `lbi_tags` ทุก reference (model, repository, handler, route)
- struct `LbiTag` / `Tag`
- handler `GetTags`, `CreateTag` etc. (ถ้ามี)
- route `/tags` (ถ้ามี)

---

## Unit ID / Shipping Method ID — Mapping Reference

เนื่องจาก FK เปลี่ยนจาก `units` → `lbi_units` และ `shipping_methods` → `lbi_shipping_methods` ค่า ID อาจไม่ตรงกัน:

### lbi_units (ตารางใหม่ที่ใช้)

| unit_id | unit_name_th | unit_name_en |
|---|---|---|
| 1 | ชิ้น | Piece |
| 2 | กล่อง | Box |
| 3 | กิโลกรัม | Kilogram |
| 4 | แพ็ค | Pack |
| 5 | ถุง | Bag |
| 6 | ขวด | Bottle |
| 7 | แผ่น | Sheet |
| 8 | ซอง | Pouch |
| 9 | กระป๋อง | Can |
| 10 | กรัม | Gram |
| 11 | ลิตร | Liter |
| 12 | มิลลิลิตร | Milliliter |
| 13 | โหล | Dozen |
| 14 | เมตร | Meter |

> **คอลัมน์ต่างจาก units:** `unit_name_th` + `unit_name_en` + `status` (ไม่ใช่ `name` + `unit_name_en`)

### lbi_shipping_methods (ตารางใหม่ที่ใช้)

| shipping_method_id | method_name |
|---|---|
| 1 | ลูกค้ารับเองที่โรงงาน |
| 2 | ขนส่งเอกชน |
| 3 | ขนส่งหมู่บ้าน/ไปรษณีย์ |
| 4 | รถบรรทุกโรงงาน |
| 5 | ขนส่งแช่เย็น |
| 6 | ส่งออกต่างประเทศ (Sea) |
| 7 | ส่งออกต่างประเทศ (Air) |

> **คอลัมน์ต่างจาก shipping_methods:** `method_name` + `status` (ไม่ใช่ `name`)

---

## Checklist สำหรับ Backend

- [ ] แก้ชื่อตาราง `map_factory_tags` → `map_factory_categories` ในทุก query
- [ ] แก้คอลัมน์ `tag_id` → `category_id` ในทุก query ที่เกี่ยวข้อง
- [ ] แก้ชื่อตาราง `map_showcase_tags` → `map_showcase_categories`
- [ ] แก้ struct/model ให้ตรง (MapFactoryCategory, MapShowcaseCategory)
- [ ] เปลี่ยน API routes `/tags` → `/categories`
- [ ] แก้ query ที่อ้าง `shipping_methods` → `lbi_shipping_methods`
- [ ] แก้ query ที่อ้าง `units` → `lbi_units`
- [ ] แก้ column name: `name` → `method_name` (shipping), `name` → `unit_name_th` (units)
- [ ] ลบ code ทั้งหมดที่เกี่ยวกับ `lbi_tags`
- [ ] เพิ่ม `sub_category_id` ใน showcase INSERT/UPDATE/SELECT
- [ ] อัปเดต API response สำหรับ `/master/units` ให้ใช้ `unit_name_th`, `unit_name_en`
- [ ] อัปเดต API response สำหรับ `/master/shipping-methods` ให้ใช้ `method_name`
- [ ] ทดสอบ: สร้าง RFQ, สร้าง quotation, สร้าง showcase — ไม่มี FK error

---

## DB Tables Summary (หลัง migration — 34 ตาราง)

```
addresses                    lbi_districts              map_factory_certificates
categories                   lbi_factory_types          map_factory_sub_categories
conversations                lbi_production             map_showcase_categories      ← renamed
customers                    lbi_provinces              messages
factory_profiles             lbi_shipping_methods       notifications
factory_reviews              lbi_sub_categories         orders
factory_showcases  +sub_cat  lbi_sub_districts          password_reset_tokens
favorites                    lbi_units                  production_steps
map_factory_categories       promo_slides               production_updates
                             quotations                 rfq_images
                             rfqs                       transactions
                             users                      wallets

DROPPED: lbi_tags, map_factory_tags, map_showcase_tags, shipping_methods, units
```

---

## E. API Health Check หลัง Migration (ตรวจสอบ 11 เม.ย. 2026)

> ทดสอบ production server: `https://wemake-server.onrender.com/api/v1/`

### E.1 Endpoints ที่ทำงานปกติ ✅

| Endpoint | Status | Data |
|----------|--------|------|
| `GET /master/units` | 200 | 14 records — `lbi_units` ใช้งานได้ |
| `GET /master/shipping-methods` | 200 | 7 records — `lbi_shipping_methods` ใช้งานได้ |
| `GET /master/factory-types` | 200 | 11 records — `lbi_factory_types` ใช้งานได้ |
| `GET /master/provinces` | 200 | 10 records — `lbi_provinces` ใช้งานได้ |

### E.2 Endpoints ที่ ERROR ❌

| Endpoint | Status | Error | สาเหตุ | Priority |
|----------|--------|-------|--------|----------|
| **`GET /showcases`** | **500** | `{"error":"failed to fetch showcases"}` | SQL query อ้างตาราง/คอลัมน์เก่า (ดู §F) | 🔴 **Critical** |
| `GET /master/categories` | 404 | Route ไม่มี | ยังไม่ได้สร้าง endpoint | 🔴 Critical |
| `GET /master/certificates` | 404 | Route ไม่มี | ยังไม่ได้สร้าง endpoint | 🟡 Medium |
| `GET /factories` | 404 | Route ไม่มี | ยังไม่ได้สร้าง endpoint | 🔴 Critical |
| `GET /master/tags` | 404 | Route ไม่มี | **ปกติ** — `lbi_tags` ถูก DROP แล้ว ลบ route ออก | 🟢 Expected |

### E.3 สรุปผลกระทบต่อ Frontend

```
FE Explore Page (หน้าหลัก):
  ├── GET /showcases?type=PD  ← 🔴 500 ใช้งานไม่ได้
  ├── GET /showcases?type=PM  ← 🔴 500 ใช้งานไม่ได้
  ├── GET /showcases?type=ID  ← 🔴 500 ใช้งานไม่ได้
  └── GET /master/product-categories ← ❓ ยังไม่ได้ทดสอบ (FE ใช้ fallback)

FE Create RFQ:
  ├── GET /master/units           ← ✅ ใช้งานได้
  ├── GET /master/shipping-methods ← ✅ ใช้งานได้
  └── GET /master/product-categories ← ❓

FE Factory Profile:
  ├── GET /factories/:id          ← ❌ 404
  ├── GET /factories/:id/categories ← ❌ ยังไม่มี
  └── GET /factories/:id/showcases  ← ❌ ยังไม่มี
```

---

## F. Showcase Endpoint Fix (🔴 Critical — HTTP 500)

### F.1 Root Cause Analysis

`GET /showcases` คืน 500 ทุก variant (PD/PM/ID/all) — ปัญหาอยู่ใน **SQL query ของ BE handler** ที่น่าจะยังอ้างตาราง/คอลัมน์เก่า:

| สิ่งที่ BE อาจอ้างผิด | ตารางเก่า (ไม่มีแล้ว) | ตารางใหม่ (ใช้อันนี้) |
|---|---|---|
| JOIN showcase tags | `map_showcase_tags` | **`map_showcase_categories`** |
| SELECT tag column | `mst.tag_id` | **`msc.category_id`** |
| JOIN tag names | `lbi_tags` | **ลบออก** (ใช้ `categories` แทน) |
| column alias | `tag_name` | **`name`** (from categories) |

### F.2 SQL Query — แก้จาก (ผิด) เป็น (ถูก)

```sql
-- ❌ BEFORE (คาดว่า BE ใช้อยู่ — ทำให้ 500)
SELECT fs.*,
       COALESCE(array_agg(t.tag_name), '{}') AS tags
FROM factory_showcases fs
LEFT JOIN map_showcase_tags mst ON fs.showcase_id = mst.showcase_id
LEFT JOIN lbi_tags t ON mst.tag_id = t.tag_id
WHERE ($1 = '' OR fs.content_type = $1)
GROUP BY fs.showcase_id;


-- ✅ AFTER (แก้ให้ใช้ตารางใหม่ + เพิ่ม fields ใหม่)
SELECT
  fs.showcase_id,
  fs.factory_id,
  fs.content_type,
  fs.title,
  fs.excerpt,
  fs.image_url,
  fs.category_id,
  fs.sub_category_id,           -- ← คอลัมน์ใหม่ (Migration 003 §D)
  fs.min_order,
  fs.lead_time_days,
  fs.likes_count,               -- ← ต้อง SELECT ด้วย
  fs.created_at,
  -- JOIN factory info สำหรับแสดงใน Explore
  fp.factory_name,
  fp.image_url       AS factory_image_url,
  fp.rating          AS factory_rating,
  fp.is_verified     AS factory_verified,
  -- JOIN category name
  c.name             AS category_name,
  -- JOIN sub_category name (nullable)
  sc.name            AS sub_category_name
FROM factory_showcases fs
  JOIN  factory_profiles fp   ON fs.factory_id    = fp.user_id
  LEFT JOIN categories c      ON fs.category_id   = c.category_id
  LEFT JOIN lbi_sub_categories sc ON fs.sub_category_id = sc.sub_category_id
WHERE ($1 = '' OR fs.content_type = $1)
ORDER BY fs.created_at DESC;
```

> **หมายเหตุ:** ถ้าต้องการส่ง `categories` (array) ใน response ด้วย ให้ JOIN กับ `map_showcase_categories`:

```sql
-- Optional: ดึง multi-category เป็น array
SELECT
  fs.showcase_id,
  COALESCE(
    array_agg(DISTINCT mc.category_id)
      FILTER (WHERE mc.category_id IS NOT NULL),
    '{}'
  ) AS category_ids
FROM factory_showcases fs
LEFT JOIN map_showcase_categories mc ON fs.showcase_id = mc.showcase_id
GROUP BY fs.showcase_id;
```

### F.3 Go Struct Update

```go
// FactoryShowcase — response struct (อัปเดตหลัง migration)
type ShowcaseResponse struct {
    ShowcaseID      int64   `json:"showcase_id"       db:"showcase_id"`
    FactoryID       int64   `json:"factory_id"        db:"factory_id"`
    ContentType     string  `json:"content_type"      db:"content_type"`
    Title           string  `json:"title"             db:"title"`
    Excerpt         *string `json:"excerpt"           db:"excerpt"`
    ImageURL        *string `json:"image_url"         db:"image_url"`
    CategoryID      *int64  `json:"category_id"       db:"category_id"`
    SubCategoryID   *int64  `json:"sub_category_id"   db:"sub_category_id"`   // ← ใหม่
    MinOrder        *int    `json:"min_order"         db:"min_order"`
    LeadTimeDays    *int    `json:"lead_time_days"    db:"lead_time_days"`
    LikesCount      int     `json:"likes_count"       db:"likes_count"`       // ← ต้องมี
    CreatedAt       string  `json:"created_at"        db:"created_at"`

    // JOIN fields
    FactoryName     string  `json:"factory_name"      db:"factory_name"`
    FactoryImage    *string `json:"factory_image_url" db:"factory_image_url"`
    FactoryRating   *float64`json:"factory_rating"    db:"factory_rating"`
    FactoryVerified bool    `json:"factory_verified"  db:"factory_verified"`
    CategoryName    *string `json:"category_name"     db:"category_name"`
    SubCategoryName *string `json:"sub_category_name" db:"sub_category_name"`
}
```

---

## G. Missing Endpoints — ต้องสร้างใหม่

### G.1 `GET /master/product-categories` (หรือ `/master/categories`)

FE เรียก `masterApi.productCategories()` → `GET /master/product-categories`

```sql
-- Query
SELECT category_id, name
FROM categories
ORDER BY category_id;
```

```json
// Response
[
  { "category_id": 1,  "name": "อาหารสัตว์" },
  { "category_id": 2,  "name": "อาหารเสริม" },
  { "category_id": 3,  "name": "ของเล่นสัตว์เลี้ยง" },
  ...
]
```

**Go Handler:**
```go
// GET /master/product-categories
func (h *MasterHandler) GetProductCategories(c echo.Context) error {
    rows, err := h.db.Query("SELECT category_id, name FROM categories ORDER BY category_id")
    if err != nil {
        return c.JSON(500, map[string]string{"error": "failed to fetch categories"})
    }
    defer rows.Close()
    // ... scan and return JSON array
}
```

---

### G.2 `GET /categories/:id/sub-categories`

FE เรียก `categoriesApi.subCategories(categoryId)` → dropdown หมวดย่อย

```sql
SELECT sub_category_id, category_id, name
FROM lbi_sub_categories
WHERE category_id = $1
  AND status = '1'
ORDER BY sort_order, sub_category_id;
```

```json
// Response (category_id = 1)
[
  { "sub_category_id": 1, "category_id": 1, "name": "อาหารสุนัข" },
  { "sub_category_id": 2, "category_id": 1, "name": "อาหารแมว" },
  { "sub_category_id": 3, "category_id": 1, "name": "อาหารนก/สัตว์เล็ก" },
  { "sub_category_id": 4, "category_id": 1, "name": "อาหารสัตว์ทุกชนิด" }
]
```

---

### G.3 `GET /master/certificates`

```sql
SELECT cert_id, cert_name, description
FROM lbi_certificates
WHERE status = '1'
ORDER BY cert_id;
```

```json
[
  { "cert_id": 1, "cert_name": "ISO 9001", "description": "ระบบบริหารงานคุณภาพ" },
  { "cert_id": 2, "cert_name": "GMP", "description": "หลักเกณฑ์วิธีการที่ดีในการผลิต" },
  ...
]
```

---

### G.4 `GET /factories` — Factory Listing (หน้า Explore)

```sql
SELECT
  fp.user_id        AS factory_id,
  fp.factory_name,
  fp.factory_type_id,
  ft.type_name      AS factory_type_name,
  fp.specialization,
  fp.rating,
  fp.review_count,
  fp.min_order,
  fp.lead_time_desc,
  fp.is_verified,
  fp.completed_orders,
  fp.image_url,
  fp.description,
  fp.price_range,
  fp.province_id,
  p.name_th          AS province_name
FROM factory_profiles fp
  LEFT JOIN lbi_factory_types ft ON fp.factory_type_id = ft.factory_type_id
  LEFT JOIN lbi_provinces p      ON fp.province_id     = p.province_id
WHERE fp.is_verified = true
ORDER BY fp.rating DESC NULLS LAST;
```

---

### G.5 `GET /factories/:id` — Factory Detail

```sql
-- Main profile
SELECT
  fp.user_id AS factory_id,
  fp.factory_name, fp.factory_type_id, fp.tax_id,
  fp.specialization, fp.min_order, fp.lead_time_desc,
  fp.is_verified, fp.rating, fp.review_count, fp.completed_orders,
  fp.image_url, fp.description, fp.price_range, fp.province_id,
  ft.type_name AS factory_type_name,
  p.name_th AS province_name
FROM factory_profiles fp
  LEFT JOIN lbi_factory_types ft ON fp.factory_type_id = ft.factory_type_id
  LEFT JOIN lbi_provinces p ON fp.province_id = p.province_id
WHERE fp.user_id = $1;

-- Categories
SELECT c.category_id, c.name
FROM map_factory_categories mfc
  JOIN categories c ON mfc.category_id = c.category_id
WHERE mfc.factory_id = $1;

-- Sub-categories
SELECT sc.sub_category_id, sc.name, sc.category_id
FROM map_factory_sub_categories mfs
  JOIN lbi_sub_categories sc ON mfs.sub_category_id = sc.sub_category_id
WHERE mfs.factory_id = $1;

-- Certificates
SELECT lc.cert_id, lc.cert_name, mfc.verify_status
FROM map_factory_certificates mfc
  JOIN lbi_certificates lc ON mfc.cert_id = lc.cert_id
WHERE mfc.factory_id = $1;

-- Reviews (latest 10)
SELECT fr.review_id, fr.user_id, fr.rating, fr.comment, fr.created_at,
       c.first_name, c.last_name
FROM factory_reviews fr
  LEFT JOIN customers c ON fr.user_id = c.user_id
WHERE fr.factory_id = $1
ORDER BY fr.created_at DESC
LIMIT 10;
```

---

## H. Column Name Mapping — CRITICAL Reference

เมื่อ DROP ตาราง `units` / `shipping_methods` แล้วใช้ `lbi_units` / `lbi_shipping_methods` แทน **ชื่อคอลัมน์ไม่เหมือนกัน**:

### H.1 units → lbi_units

| ตารางเก่า `units` | ตารางใหม่ `lbi_units` | หมายเหตุ |
|---|---|---|
| `id` | `unit_id` | PK ชื่อต่างกัน |
| `name` | **`unit_name_th`** | 🔴 ชื่อต่างกัน! |
| `unit_name_en` | `unit_name_en` | เหมือนกัน |
| *(ไม่มี)* | `status` | เพิ่มมา |

**Go code ที่ต้องแก้:**
```go
// ❌ เดิม (อ้าง units)
row.Scan(&u.ID, &u.Name, &u.NameEn)
// SQL: SELECT id, name, unit_name_en FROM units

// ✅ ใหม่ (อ้าง lbi_units)
row.Scan(&u.UnitID, &u.UnitNameTh, &u.UnitNameEn)
// SQL: SELECT unit_id, unit_name_th, unit_name_en FROM lbi_units WHERE status = '1'
```

> **สถานะปัจจุบัน:** `GET /master/units` คืน 200 ✅ — แสดงว่า BE อาจแก้ไปแล้ว
> แต่ต้อง **ตรวจสอบ field name ใน JSON response** ว่าส่ง `unit_name_th` หรือ `name`
> FE รองรับทั้งสอง: `r.unit_name_th ?? r.name` (useCreateRfqState.ts:44)

### H.2 shipping_methods → lbi_shipping_methods

| ตารางเก่า `shipping_methods` | ตารางใหม่ `lbi_shipping_methods` | หมายเหตุ |
|---|---|---|
| `id` | `shipping_method_id` | PK ชื่อต่างกัน |
| `name` | **`method_name`** | 🔴 ชื่อต่างกัน! |
| *(ไม่มี)* | `status` | เพิ่มมา |

**Go code ที่ต้องแก้:**
```go
// ❌ เดิม
// SQL: SELECT id, name FROM shipping_methods

// ✅ ใหม่
// SQL: SELECT shipping_method_id, method_name FROM lbi_shipping_methods WHERE status = '1'
```

> **สถานะปัจจุบัน:** `GET /master/shipping-methods` คืน 200 ✅
> FE รองรับ: `r.method_name ?? r.name` (useCreateRfqState.ts:59)

### H.3 map_factory_tags → map_factory_categories

| ตารางเก่า | ตารางใหม่ | หมายเหตุ |
|---|---|---|
| `map_factory_tags` | **`map_factory_categories`** | RENAME |
| `tag_id` | **`category_id`** | คอลัมน์ RENAME |
| FK → `lbi_tags.tag_id` | FK → **`categories.category_id`** | FK เปลี่ยน |

### H.4 map_showcase_tags → map_showcase_categories

| ตารางเก่า | ตารางใหม่ | หมายเหตุ |
|---|---|---|
| `map_showcase_tags` | **`map_showcase_categories`** | RENAME |
| `tag_id` | **`category_id`** | คอลัมน์ RENAME |
| FK → `lbi_tags.tag_id` | FK → **`categories.category_id`** | FK เปลี่ยน |

### H.5 lbi_tags → DROPPED (ไม่มีแล้ว)

| สิ่งที่ต้องทำ | รายละเอียด |
|---|---|
| ลบ struct `LbiTag` / `Tag` | ไม่ใช้แล้ว |
| ลบ route `GET /master/tags` | ลบ handler + route registration |
| ลบ repository `TagRepository` | ทั้ง interface + implementation |
| แก้ showcase query | เอา `JOIN lbi_tags` ออก |
| แก้ factory query | เอา `JOIN lbi_tags` ออก |

---

## I. API Response Format — FE คาดหวัง

### I.1 GET /showcases Response

FE `useShowcases.ts` → `normShowcase()` คาดหวัง fields เหล่านี้:

```json
{
  "showcase_id": 1,
  "factory_id": 2,
  "content_type": "PD",
  "title": "อาหารสุนัขพรีเมียม สูตรเนื้อแกะ",
  "excerpt": "อาหารเม็ดสุนัขโต...",
  "image_url": "https://images.unsplash.com/...",
  "category_id": 1,
  "sub_category_id": 1,
  "min_order": 1000,
  "lead_time_days": 14,
  "likes_count": 156,
  "created_at": "2026-01-15T09:00:00Z",

  "factory_name": "PawFresh Premium",
  "factory_image_url": "https://...",
  "factory_rating": 4.83,
  "factory_verified": true,
  "category_name": "อาหารสัตว์",
  "sub_category_name": "อาหารสุนัข"
}
```

> **FE Fallback:** useShowcases.ts รองรับทั้ง snake_case และ camelCase
> เช่น `r.likes_count ?? r.likesCount ?? r.likes ?? 0`

### I.2 GET /factories Response

```json
{
  "factory_id": 2,
  "factory_name": "PawFresh Premium",
  "factory_type_id": 2,
  "factory_type_name": "โรงงานอาหารสัตว์",
  "specialization": "ผลิตอาหารสัตว์เลี้ยงพรีเมียม OEM/ODM",
  "rating": 4.83,
  "review_count": 12,
  "min_order": 1000,
  "lead_time_desc": "14-21 วัน",
  "is_verified": true,
  "completed_orders": 45,
  "image_url": "https://...",
  "description": "โรงงานผลิตอาหารสัตว์เลี้ยง...",
  "price_range": "15-120 บาท/กก.",
  "province_id": 5,
  "province_name": "สมุทรปราการ"
}
```

### I.3 GET /master/product-categories Response

```json
[
  { "category_id": 1,  "name": "อาหารสัตว์" },
  { "category_id": 2,  "name": "อาหารเสริม" },
  { "category_id": 3,  "name": "ของเล่นสัตว์เลี้ยง" },
  { "category_id": 4,  "name": "ที่นอนและบ้าน" },
  { "category_id": 5,  "name": "กระเป๋าและรถเข็น" },
  { "category_id": 6,  "name": "บรรจุภัณฑ์" },
  { "category_id": 7,  "name": "ผลิตภัณฑ์บำรุง" },
  { "category_id": 8,  "name": "เสื้อผ้าสัตว์เลี้ยง" },
  { "category_id": 9,  "name": "ห้องน้ำและทราย" },
  { "category_id": 10, "name": "ตู้ปลาและกรง" },
  { "category_id": 11, "name": "ขนมสัตว์เลี้ยง" },
  { "category_id": 12, "name": "ผลิตภัณฑ์ทําความสะอาด" },
  { "category_id": 13, "name": "อุปกรณ์สัตว์เลี้ยง" }
]
```

---

## Updated Checklist สำหรับ Backend (v2)

### 🔴 CRITICAL (แก้ก่อน — FE ใช้งานไม่ได้)

- [ ] **แก้ `GET /showcases` ให้หยุด 500** — อัปเดต SQL query ตาม §F.2
  - [ ] เปลี่ยน `map_showcase_tags` → `map_showcase_categories`
  - [ ] เปลี่ยน `tag_id` → `category_id`
  - [ ] เอา `JOIN lbi_tags` ออก
  - [ ] เพิ่ม SELECT `sub_category_id`, `likes_count`
  - [ ] เพิ่ม JOIN `factory_profiles` (ส่ง factory_name กลับ)
  - [ ] เพิ่ม JOIN `categories` (ส่ง category_name กลับ)
- [ ] **สร้าง `GET /master/product-categories`** — ตาม §G.1
- [ ] **สร้าง `GET /factories`** — ตาม §G.4 (factory listing สำหรับ Explore)

### 🟡 MEDIUM (ต้องมีสำหรับ flow ครบ)

- [ ] สร้าง `GET /factories/:id` — ตาม §G.5 (factory detail page)
- [ ] สร้าง `GET /categories/:id/sub-categories` — ตาม §G.2
- [ ] สร้าง `GET /master/certificates` — ตาม §G.3
- [ ] แก้ `map_factory_tags` → `map_factory_categories` ในทุก query
- [ ] แก้ `tag_id` → `category_id` ในทุก query ที่เกี่ยวข้อง
- [ ] แก้ struct/model (MapFactoryCategory, MapShowcaseCategory) ตาม §2
- [ ] เปลี่ยน API routes `/tags` → `/categories` (ถ้ามี)
- [ ] อัปเดต ShowcaseResponse struct ตาม §F.3

### 🟢 CLEANUP (ลบของเก่า)

- [ ] ลบ route `GET /master/tags` (lbi_tags ถูก DROP)
- [ ] ลบ struct `LbiTag` / `Tag`
- [ ] ลบ repository/handler ที่เกี่ยวกับ `lbi_tags`
- [ ] ลบ reference ทั้งหมดที่อ้าง `shipping_methods` (ตารางเก่า)
- [ ] ลบ reference ทั้งหมดที่อ้าง `units` (ตารางเก่า)

### ✅ VERIFIED (ทำเสร็จแล้ว)

- [x] `GET /master/units` → 200 OK (ใช้ `lbi_units` ถูกต้อง)
- [x] `GET /master/shipping-methods` → 200 OK (ใช้ `lbi_shipping_methods` ถูกต้อง)
- [x] `GET /master/factory-types` → 200 OK
- [x] `GET /master/provinces` → 200 OK
- [x] DB: `quotations.shipping_method_id` FK → `lbi_shipping_methods` ✅
- [x] DB: `rfqs.unit_id` FK → `lbi_units` ✅
- [x] DB: `factory_showcases.sub_category_id` column added ✅
- [x] DB: `map_factory_tags` → `map_factory_categories` renamed ✅
- [x] DB: `map_showcase_tags` → `map_showcase_categories` renamed ✅
- [x] DB: `lbi_tags`, `shipping_methods`, `units` dropped ✅
