# Explore Page — API & Data Spec (สั้น)

> อ้างอิง: `src/app/pages/explore/*`, `src/app/hooks/useExploreData.ts`, `API_SPEC.md` (DB schema summary)

## สรุป

- **Mobile และ Desktop** ใช้ hook เดียวกัน (`useExploreData` ใน `Explore/index.tsx`) → **ชุด API เหมือนกัน**
- **Auth:** `Authorization: Bearer <JWT>` (ยกเว้น dev ที่อาจใช้ flow ทดสอบ)
- **Dev:** `?manualApi=1` → ยังไม่ยิง API ของหน้านี้จนกว่าจะกดโหลดใน `ManualApiDevGate`

---

## Section บนหน้า ↔ แหล่งข้อมูล

| Section (คร่าว ๆ) | ข้อมูลจาก | Endpoint / แหล่ง |
|-------------------|-----------|------------------|
| Hero / Search | — | ไม่มี API |
| Carousel โปรโม / โค้ดส่วนลด | `promoSlides` + `explorePromoCodes` (+ merge จาก explore) | `GET /promo-slides`, `GET /frontend/explore` (หรือ `GET /frontend/promo-codes` ตอน fallback) |
| หมวดหมู่ (tiles) | merge ชื่อหมวดจาก API + fallback จาก context | `GET /categories` **และ** `GET /master/product-categories` (คู่ขนาน) |
| สินค้าแนะนำ / โปรโมชันแนะนำ (จาก showcases) | `factoryShowcases` | **ไม่ใช่** `/frontend/explore` โดยตรง — มาจาก `DataContext` → `GET /frontend/mock-data` |
| โรงงานแนะนำ | `factories` | เช่นเดียวกัน — `GET /frontend/mock-data` |
| บทความ Idea | `ideaArticles` | เช่นเดียวกัน — `GET /frontend/mock-data` |
| Footer / CTA | — | ไม่มี API |

> **หมายเหตุ UI:** ค่า `products` / `promotions` จาก `GET /frontend/explore` (และ fallback `/frontend/products`, `/frontend/promotions`) ถูกเก็บใน state แล้ว แต่ section “สินค้าแนะนำ / โปรโมชันแนะนำ” ปัจจุบันยังผูกกับ **`factoryShowcases`** จาก mock-data bundle

---

## API ที่หน้า Explore ยิงโดยตรง

### 1) `GET /categories`

- **Request:** ไม่มี body; header Bearer
- **Response (ตัวอย่าง):** `[{ "category_id": 1, "name": "อาหารสัตว์" }, ...]`
- **DB:** ตาราง `categories` (marketplace — ดู `API_SPEC.md` § Catalog)
- **เชื่อมใน FE:** รวมกับ master ใน `fetchExploreCategoriesMerged()` → ใช้ตั้งชื่อ tile หมวดบน Explore

### 2) `GET /master/product-categories`

- **Query (optional):** `parent_category_id` — กรอง sub-categories
- **Response (ตัวอย่าง):** `[{ "category_id": 1, "parent_category_id": null, "category_name": "อาหารสัตว์เลี้ยง", "status": "1" }, ...]`
- **DB:** `lbi_product_categories` (`category_id`, `parent_category_id`, `category_name`, …)
- **เชื่อมใน FE:** merge กับ `/categories` — tile Explore ใช้ `category_id` จาก config จับคู่ชื่อจาก API

### 3) `GET /frontend/explore`

- **Request:** ไม่มี body
- **Response (รูปรวมที่ FE คาด):**

```json
{
  "products": [],
  "promotions": [],
  "promo_codes": [],
  "factories": [],
  "idea_articles": [],
  "categories": []
}
```

- **DB (ตามสรุป backend ใน `API_SPEC.md`):** ขึ้นกับ implementation — มักอ้างอิงตารางเช่น `products`, `promotions`, `promo_codes` และข้อมูลที่เกี่ยวข้อง
- **FE:** ใช้ `products`, `promotions`, `promo_codes` ใน `useExploreData`; ถ้า error จะ fallback แยกเส้น

### 4) Fallback เมื่อ `/frontend/explore` ล้ม (ยิงพร้อมกัน)

| Endpoint | Response (โดยสาร) |
|----------|-------------------|
| `GET /frontend/products?limit=8` | array สินค้าแนะนำ |
| `GET /frontend/promotions?limit=4` | array โปรโมชัน |
| `GET /frontend/promo-codes` | array โค้ดส่วนลด (`id`, `title`, `subtitle`, `code`, …) |

### 5) `GET /promo-slides`

- **Response (ตัวอย่าง):**

```json
[{
  "slide_id": 1,
  "title": "...",
  "subtitle": "...",
  "code": "FIRST15",
  "image_url": "https://...",
  "status": "1"
}]
```

- **DB:** `promo_slides` — ฟิลด์หลัก: `slide_id`, `title`, `subtitle`, `code`, `image_url`, `status`
- **FE:** แสดงใน carousel; normalize ฟิลด์ `slide_id` / `id` ให้เป็น `id` ใน UI

---

## API ระดับแอป (ไม่ใช่เฉพาะ Explore แต่ป้อนข้อมูล section ด้านบน)

### `GET /frontend/mock-data`

- **Response:** object ใหญ่รวม `factories`, `ideaArticles`, `factoryShowcases`, `categories`, … (รูปแบบใกล้ `mockData.ts`)
- **เรียกจาก:** `DataProvider` เมื่อ login สำเร็จ
- **DB (เชิงความสัมพันธ์):** `factory_showcases` → `factory_id` (โรงงาน), `category_id` → `lbi_product_categories`; รายการโรงงาน/บทความมาจาก bundle รวมของ backend

---

## ความสัมพันธ์ DB (สรุปสำหรับ Explore)

```
lbi_product_categories (category_id, parent_category_id, category_name)
       ↑
       │ optional FK
factory_showcases (showcase_id, factory_id, content_type, category_id, …)
       │
       └── favorites, …

categories (category_id, name)     ← ใช้คนละ flow กับ lbi_* (ดู API_SPEC § DB Schema Summary)

promo_slides (slide_id, title, subtitle, code, image_url, status)

products / promotions / promo_codes  ← ให้บริการผ่าน /frontend/explore หรือเส้น granular
```

---

## เอกสารเต็ม

รายละเอียด endpoint เพิ่มเติมและสถานะ backend: ดู **`API_SPEC.md`** ที่ root โปรเจกต์
