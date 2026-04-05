# Phase 1: Backend Tasks — Sub-Category Routing & Shipping Method

> สรุปงานฝั่ง Backend ที่ต้องทำเพื่อรองรับ Phase 1 ของ Create-RFQ
> Frontend พร้อมแล้ว — รอ Backend deploy แล้วเชื่อมต่อได้ทันที

---

## ปัญหาที่แก้

ปัจจุบัน RFQ broadcast ไปหาโรงงาน **ทุกราย** ในหมวดหมู่เดียวกัน เช่น ลูกค้าต้องการ "อาหารแมว" แต่โรงงานที่ผลิตอาหารสุนัขก็ได้รับ RFQ ด้วย → dirty data / spam

**Solution:** เพิ่ม `sub-category` เป็นตัวกรอง ให้ลูกค้าเลือกประเภทย่อย → ระบบ route RFQ ไปเฉพาะโรงงานที่ลงทะเบียนรับงาน sub-category นั้น

---

## 1. Database Migration

### 1.1 สร้างตาราง `lbi_sub_categories`

```sql
CREATE TABLE IF NOT EXISTS lbi_sub_categories (
    sub_category_id  BIGSERIAL PRIMARY KEY,
    category_id      BIGINT NOT NULL REFERENCES categories(category_id),
    name             VARCHAR(100) NOT NULL,
    status           CHAR(1) NOT NULL DEFAULT '1' CHECK (status IN ('1','0')),
    sort_order       INT NOT NULL DEFAULT 0,
    UNIQUE(category_id, name)
);

CREATE INDEX idx_lbi_sub_categories_cat ON lbi_sub_categories(category_id);
```

### 1.2 สร้างตาราง `map_factory_sub_categories`

```sql
-- โรงงานลงทะเบียนว่ารับทำ sub-category ไหนบ้าง
CREATE TABLE IF NOT EXISTS map_factory_sub_categories (
    factory_id       BIGINT NOT NULL REFERENCES factories(factory_id) ON DELETE CASCADE,
    sub_category_id  BIGINT NOT NULL REFERENCES lbi_sub_categories(sub_category_id) ON DELETE CASCADE,
    PRIMARY KEY (factory_id, sub_category_id)
);
```

### 1.3 ALTER ตาราง `rfqs`

```sql
-- เพิ่ม sub_category_id (nullable — backward compatible กับ RFQ เก่า)
ALTER TABLE rfqs
  ADD COLUMN sub_category_id BIGINT NULL
  REFERENCES lbi_sub_categories(sub_category_id);

-- เพิ่ม shipping_method_id (nullable — preference ของลูกค้า)
ALTER TABLE rfqs
  ADD COLUMN shipping_method_id BIGINT NULL
  REFERENCES lbi_shipping_methods(shipping_method_id);

CREATE INDEX idx_rfqs_sub_category ON rfqs(sub_category_id);
```

---

## 2. Seed Data

```sql
INSERT INTO lbi_sub_categories (category_id, name, sort_order) VALUES
-- 1: อาหารสัตว์
(1, 'อาหารสุนัข', 1),
(1, 'อาหารแมว', 2),
(1, 'อาหารนก/สัตว์เล็ก', 3),
(1, 'อาหารสัตว์ทุกชนิด', 99),

-- 2: อาหารเสริม
(2, 'อาหารเสริมสุนัข', 1),
(2, 'อาหารเสริมแมว', 2),
(2, 'อาหารเสริมสัตว์ทุกชนิด', 99),

-- 3: ของเล่นสัตว์เลี้ยง
(3, 'ของเล่นสุนัข', 1),
(3, 'ของเล่นแมว', 2),
(3, 'ของเล่นสัตว์ทุกชนิด', 99),

-- 4: เสื้อผ้าสัตว์เลี้ยง
(4, 'เสื้อผ้าสุนัข', 1),
(4, 'เสื้อผ้าแมว', 2),
(4, 'เสื้อผ้าสัตว์ทุกชนิด', 99),

-- 5: อุปกรณ์สัตว์เลี้ยง
(5, 'อุปกรณ์สุนัข', 1),
(5, 'อุปกรณ์แมว', 2),
(5, 'อุปกรณ์สัตว์ทุกชนิด', 99),

-- 6: บรรจุภัณฑ์
(6, 'ถุง/Pouch', 1),
(6, 'กล่องกระดาษ', 2),
(6, 'ขวด/กระป๋อง', 3),
(6, 'ฉลาก/สติกเกอร์', 4),
(6, 'บรรจุภัณฑ์อื่นๆ', 99),

-- 7: เครื่องสำอาง (สัตว์เลี้ยง)
(7, 'แชมพู/ครีมนวด', 1),
(7, 'สบู่/โฟมอาบน้ำ', 2),
(7, 'สเปรย์/โลชั่น', 3),
(7, 'ผลิตภัณฑ์ดูแลทุกชนิด', 99),

-- 8: เสื้อผ้า/สิ่งทอ
(8, 'ผ้าทอ/ผ้าถัก', 1),
(8, 'ผ้าสำเร็จรูป', 2),
(8, 'สิ่งทอทุกชนิด', 99),

-- 9: เฟอร์นิเจอร์
(9, 'คอนโดแมว/ที่ลับเล็บ', 1),
(9, 'บ้าน/กรงสัตว์เลี้ยง', 2),
(9, 'เฟอร์นิเจอร์สัตว์ทุกชนิด', 99),

-- 10: พลาสติก
(10, 'ชิ้นงานพลาสติกฉีด', 1),
(10, 'ชิ้นงานพลาสติกเป่า', 2),
(10, 'งานพลาสติกทุกชนิด', 99),

-- 11: ขนมสัตว์เลี้ยง
(11, 'ขนมสุนัข', 1),
(11, 'ขนมแมว', 2),
(11, 'ขนมสัตว์ทุกชนิด', 99)

ON CONFLICT DO NOTHING;
```

---

## 3. API ที่ต้องเพิ่ม/แก้ไข

### 3.1 API ใหม่: `GET /categories/:id/sub-categories`

**ไฟล์ที่ต้องแก้:**
- `api/routes.go` — เพิ่ม route
- `internal/handler/catalog_handler.go` — เพิ่ม handler
- `internal/service/catalog_service.go` — เพิ่ม service method
- `internal/repository/catalog_repository.go` — เพิ่ม query

**Response format:**
```json
[
  { "sub_category_id": 1, "name": "อาหารสุนัข", "sort_order": 1 },
  { "sub_category_id": 2, "name": "อาหารแมว", "sort_order": 2 },
  { "sub_category_id": 3, "name": "อาหารนก/สัตว์เล็ก", "sort_order": 3 },
  { "sub_category_id": 4, "name": "อาหารสัตว์ทุกชนิด", "sort_order": 99 }
]
```

**SQL:**
```sql
SELECT sub_category_id, name, sort_order
FROM lbi_sub_categories
WHERE category_id = $1 AND status = '1'
ORDER BY sort_order ASC, name ASC;
```

**หมายเหตุ:** ไม่ต้อง auth — เป็น public data เหมือน `/categories`

---

### 3.2 แก้ไข: `POST /rfqs/`

**ไฟล์ที่ต้องแก้:**
- `internal/handler/rfq_handler.go` — เพิ่มรับ field ใน request struct
- `internal/repository/rfq_repository.go` — เพิ่ม column ใน INSERT

**Request body (เพิ่ม 2 fields):**
```json
{
  "category_id": 1,
  "sub_category_id": 2,          // ← ใหม่ (nullable)
  "title": "อาหารแมว Indoor",
  "quantity": 1000,
  "unit_id": 1,
  "budget_per_piece": 42.5,
  "details": "สูตร Indoor ลดกลิ่น...",
  "address_id": 1,
  "shipping_method_id": 2        // ← ใหม่ (nullable)
}
```

**Validation:**
- `sub_category_id` — ถ้ามี ต้อง exist ใน `lbi_sub_categories` + match `category_id`
- `shipping_method_id` — ถ้ามี ต้อง exist ใน `lbi_shipping_methods`
- ทั้ง 2 fields เป็น nullable (backward compatible)

---

### 3.3 (เสริม) RFQ Routing Logic

เมื่อสร้าง RFQ แล้ว ระบบควร route notification ไปยังโรงงานที่ match:

```sql
-- ดึงโรงงานที่ match sub-category
SELECT DISTINCT f.factory_id
FROM map_factory_sub_categories mfs
JOIN factories f ON f.factory_id = mfs.factory_id
WHERE mfs.sub_category_id = :sub_category_id;

-- ถ้า sub_category_id = NULL → fallback ส่งทุกโรงงานใน category (เหมือนเดิม)
```

---

### 3.4 (เสริม) Factory Registration API

ให้โรงงานลงทะเบียน sub-categories ที่รับทำ:

```
POST /factories/:id/sub-categories
Body: { "sub_category_ids": [1, 2, 4] }

GET /factories/:id/sub-categories
Response: [{ "sub_category_id": 1, "name": "อาหารสุนัข" }, ...]

DELETE /factories/:id/sub-categories/:sub_category_id
```

---

## 4. Frontend สถานะ

| รายการ | สถานะ |
|--------|--------|
| `types.ts` — เพิ่ม SubCategory, ShippingMethod, form fields | ✅ Done |
| `CreateRfqStep1.tsx` — sub-category radio selector + smart placeholder | ✅ Done |
| `CreateRfqStep3Summary.tsx` — shipping method selector + summary | ✅ Done |
| `useCreateRfqState.ts` — load sub-categories + shipping methods | ✅ Done |
| `api.ts` — เพิ่ม `categoriesApi.subCategories()` | ✅ Done |
| Mobile + Desktop pages — pass new props | ✅ Done |
| Build test | ✅ Passed |

**Frontend พร้อมเชื่อมต่อทันทีที่ Backend deploy API ใหม่**

---

## 5. สรุป Priority

| # | งาน | ความสำคัญ | เหตุผล |
|---|------|-----------|--------|
| 1 | Migration: `lbi_sub_categories` + seed | **สูง** | Frontend เรียก API นี้แล้ว |
| 2 | API: `GET /categories/:id/sub-categories` | **สูง** | ใช้แสดง radio buttons ใน Step 1 |
| 3 | Migration: ALTER `rfqs` + 2 columns | **สูง** | submit ส่ง fields ใหม่แล้ว |
| 4 | แก้ `POST /rfqs/` รับ fields ใหม่ | **สูง** | ถ้าไม่แก้ fields ใหม่จะถูก ignore |
| 5 | Migration: `map_factory_sub_categories` | ปานกลาง | ใช้สำหรับ routing (ทำทีหลังได้) |
| 6 | RFQ routing logic | ปานกลาง | ให้ RFQ ไปถูกโรงงาน |
| 7 | Factory registration API | ต่ำ | ให้โรงงานจัดการ sub-categories ตัวเอง |
