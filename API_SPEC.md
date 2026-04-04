# Wemake API Specification — Frontend Integration Guide

> สร้าง: 2026-04-01 | อ้างอิง: `wemake-server/api/routes.go` + DB migrations 001–007

---

## สารบัญ

1. [Base URL & Authentication](#base-url--authentication)
2. [สถานะการเชื่อมต่อ Frontend ↔ Backend](#สถานะการเชื่อมต่อ)
3. [Auth](#1-auth)
4. [Frontend Aggregated](#2-frontend-aggregated)
5. [Master / Lookup](#3-master--lookup)
6. [Catalog](#4-catalog)
7. [Factories](#5-factories)
8. [Showcases](#6-showcases)
9. [RFQs](#7-rfqs)
10. [Quotations](#8-quotations)
11. [Orders](#9-orders)
12. [Production Updates](#10-production-updates)
13. [Conversations](#11-conversations)
14. [Messages](#12-messages)
15. [Notifications](#13-notifications)
16. [Favorites](#14-favorites)
17. [Wallets](#15-wallets)
18. [Transactions](#16-transactions)
19. [Addresses](#17-addresses)
20. [Reviews](#18-reviews)
21. [Certificates](#19-certificates)
22. [Media Upload](#20-media-upload)
23. [Promo Slides](#21-promo-slides)
24. [DB Schema Summary](#db-schema-summary)

---

## Base URL & Authentication

```
Base URL: https://wemake-server.onrender.com/api/v1
Health:   GET https://wemake-server.onrender.com/health → { "status": "ok" }
```

**Auth header:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

> หมายเหตุ: `/auth/login` และ `/auth/register` ไม่ต้องแนบ Bearer

---

## สถานะการเชื่อมต่อ

### ✅ Frontend เชื่อมต่อแล้ว (มีใน api.ts)

| # | Endpoint | Frontend function | หน้าที่ใช้ |
|---|----------|-------------------|-----------|
| 1 | `POST /auth/login` | `authApi.login()` | Login |
| 2 | `POST /auth/register` | `authApi.register()` | Register |
| 3 | `POST /auth/forgot-password` | `authApi.forgotPassword()` | Forgot Password |
| 4 | `POST /auth/reset-password` | `authApi.resetPassword()` | Reset Password |
| 5 | `GET /frontend/mock-data` | `frontendApi.getMockData()` | DataContext (ทุกหน้า) |
| 6 | `GET /frontend/bootstrap` | `frontendApi.getBootstrap()` | DataContext |
| 7 | `GET /frontend/me` | `frontendApi.getMe()` | Profile |
| 8 | `GET /frontend/factories` | `frontendApi.getFactories()` | Factory List |
| 9 | `GET /frontend/factories/:id` | `frontendApi.getFactory()` | Factory Profile |
| 10 | `GET /frontend/rfqs/:id` | `frontendApi.getRfq()` | RFQ Detail |
| 11 | `GET /frontend/orders/:id` | `frontendApi.getOrder()` | Order Detail |
| 12 | `GET /frontend/messages/threads` | `frontendApi.getMessageThreads()` | Messages |
| 13 | `GET /categories` | `categoriesApi.list()` | Create RFQ |
| 14 | `GET /factories` | `factoriesApi.list()` | Factories CRUD |
| 15 | `POST /rfqs` | `rfqsApi.create()` | Create RFQ |
| 16 | `GET /rfqs` | `rfqsApi.list()` | RFQ List |
| 17 | `GET /rfqs/:id` | `rfqsApi.get()` | RFQ Detail |
| 18 | `POST /rfqs/:id/images` | `rfqsApi.addImage()` | RFQ Images |
| 19 | `PATCH /rfqs/:id/cancel` | `rfqsApi.cancel()` | Cancel RFQ |
| 20 | `POST /rfqs/:id/quotations` | `rfqsApi.createQuotation()` | Create Quotation |
| 21 | `GET /rfqs/:id/quotations` | `rfqsApi.listQuotations()` | List Quotations |
| 22 | `POST /orders` | `ordersApi.create()` | Create Order |
| 23 | `GET /orders` | `ordersApi.list()` | Order List |
| 24 | `GET /orders/:id` | `ordersApi.get()` | Order Detail |
| 25 | `PATCH /orders/:id/status` | `ordersApi.updateStatus()` | Update Order |
| 26 | `POST /orders/:id/production-updates` | `ordersApi.addProductionUpdate()` | Production |
| 27 | `GET /orders/:id/production-updates` | `ordersApi.listProductionUpdates()` | Production |
| 28 | `POST /messages` | `messagesApi.send()` | Chat Room |
| 29 | `GET /messages` | `messagesApi.list()` | Chat Room |
| 30 | `GET /messages/threads` | `messagesApi.threads()` | Messages List |
| 31 | `GET /wallets/me` | `walletApi.getMe()` | Profile/Wallet |
| 32 | `GET /master/provinces` | `masterApi.provinces()` | Address form |
| 33 | `GET /master/districts` | `masterApi.districts()` | Address form |
| 34 | `GET /master/sub-districts` | `masterApi.subDistricts()` | Address form |
| 35 | `GET /master/factory-types` | `masterApi.factoryTypes()` | Register Factory |
| 36 | `GET /master/product-categories` | `masterApi.productCategories()` | Create RFQ / Factory Ideas filter |
| 37 | `GET /master/production-steps` | `masterApi.productionSteps()` | Production tracking |
| 38 | `GET /master/units` | `masterApi.units()` | Create RFQ |
| 39 | `GET /master/shipping-methods` | `masterApi.shippingMethods()` | Quotation form |

### ✅ เพิ่งเชื่อมต่อใหม่ (อัพเดต 2026-04-01)

| # | Endpoint | Frontend function | หน้าที่ใช้ | สถานะ |
|---|----------|-------------------|-----------|-------|
| 40 | `GET /frontend/explore` | `frontendApi.getExplore()` | Explore (aggregated) | ✅ ต่อแล้ว + fallback |
| 41 | `GET /frontend/products` | `frontendApi.getProducts()` | Explore สินค้าแนะนำ | ✅ ต่อแล้ว (fallback) |
| 42 | `GET /frontend/promotions` | `frontendApi.getPromotions()` | Explore โปรโมชัน | ✅ ต่อแล้ว (fallback) |
| 43 | `GET /frontend/promo-codes` | `frontendApi.getPromoCodes()` | Explore โค้ดส่วนลด | ✅ ต่อแล้ว + Carousel |
| 44 | `GET /promo-slides` | `promoSlidesApi.list()` | Explore banner carousel | ✅ ต่อแล้ว |
| 45 | `GET /showcases` | `showcasesApi.list()` | Factory Ideas | ✅ api.ts พร้อม |
| 46 | `POST /showcases` | `showcasesApi.create()` | Factory Dashboard | ✅ api.ts พร้อม |
| 47 | `GET /conversations` | `conversationsApi.list()` | Messages | ✅ api.ts พร้อม |
| 48 | `GET /conversations/:id` | `conversationsApi.get()` | Chat Room | ✅ api.ts พร้อม |
| 49 | `POST /conversations` | `conversationsApi.create()` | Chat Room สร้างใหม่ | ✅ api.ts พร้อม |
| 50 | `GET /messages?conv_id=` | `messagesApi.listByConversation()` | Chat Room | ✅ api.ts พร้อม |
| 51 | `GET /notifications` | `notificationsApi.list()` | Notifications | ✅ api.ts พร้อม |
| 52 | `PATCH /notifications/:id/read` | `notificationsApi.markAsRead()` | Notifications | ✅ api.ts พร้อม |
| 53 | `GET /favorites` | `favoritesApi.list()` | Profile/Favorites | ✅ api.ts พร้อม |
| 54 | `POST /favorites` | `favoritesApi.add()` | Product/Idea Detail | ✅ api.ts พร้อม |
| 55 | `DELETE /favorites/:showcase_id` | `favoritesApi.remove()` | Favorites | ✅ api.ts พร้อม |
| 56 | `GET /factories/:id/reviews` | `reviewsApi.listByFactory()` | Factory Profile | ✅ api.ts พร้อม |
| 57 | `POST /factories/:id/reviews` | `reviewsApi.create()` | Order Complete | ✅ api.ts พร้อม |
| 58 | `GET /factories/:id/certificates` | `certificatesApi.listByFactory()` | Factory Profile | ✅ api.ts พร้อม |
| 59 | `POST /factories/:id/certificates` | `certificatesApi.create()` | Factory Dashboard | ✅ api.ts พร้อม |
| 60 | `GET /quotations/:id` | `quotationsApi.get()` | Quotation Detail | ✅ api.ts พร้อม |
| 61 | `PATCH /quotations/:id/status` | `quotationsApi.updateStatus()` | Accept/Reject | ✅ api.ts พร้อม |
| 62 | `GET /addresses` | `addressesApi.list()` | Profile/Create RFQ | ✅ api.ts พร้อม |
| 63 | `POST /addresses` | `addressesApi.create()` | Profile | ✅ api.ts พร้อม |
| 64 | `PATCH /addresses/:id` | `addressesApi.update()` | Profile | ✅ api.ts พร้อม |
| 65 | `POST /transactions` | `transactionsApi.create()` | Payment | ✅ api.ts พร้อม |
| 66 | `GET /transactions` | `transactionsApi.list()` | Wallet | ✅ api.ts พร้อม |
| 67 | `PATCH /transactions/:id/status` | `transactionsApi.updateStatus()` | Admin | ✅ api.ts พร้อม |
| 68 | `PATCH /production-updates/:id` | `productionUpdatesApi.patch()` | Edit Update | ✅ api.ts พร้อม |
| 69 | `POST /media/upload` | `mediaApi.upload()` | Upload รูปภาพ | ✅ api.ts พร้อม (multipart) |

> **หมายเหตุ**: "api.ts พร้อม" = function ถูกเพิ่มใน `api.ts` แล้ว พร้อมให้หน้า UI เรียกใช้ได้ทันที แต่ยังไม่ได้ wire เข้า component (เพราะบาง feature ยังไม่มี UI)

---

## 1. Auth

### `POST /auth/register`

**Customer (CT):**
```json
{
  "role": "CT",
  "email": "customer@example.com",
  "phone": "0812345678",
  "password": "P@ssw0rd123",
  "first_name": "Somchai",
  "last_name": "Jaidee"
}
```

**Factory (FT):**
```json
{
  "role": "FT",
  "email": "factory@example.com",
  "phone": "0899999999",
  "password": "P@ssw0rd123",
  "factory_name": "My Factory",
  "factory_type_id": 1,
  "tax_id": "0105555xxxxxx"
}
```

**Response:**
```json
{ "token": "JWT_TOKEN", "user": { "user_id": 1, "role": "CT", "email": "...", ... } }
```

### `POST /auth/login`

```json
{ "email": "user@example.com", "password": "your-password" }
```

Response: เหมือน register

### `POST /auth/forgot-password`

```json
{ "email": "user@example.com" }
```

### `POST /auth/reset-password`

```json
{ "token": "reset-token", "new_password": "N3wP@ssword123" }
```

---

## 2. Frontend Aggregated

### `GET /frontend/mock-data`

> ดึงข้อมูลทั้งหมดสำหรับ frontend ในเส้นเดียว (ปัจจุบันใช้เป็นหลัก)

**Response:**
```json
{
  "currentUser": { "id": "u1", "name": "...", "avatar": "...", ... },
  "categories": [{ "id": "1", "name": "อาหารสัตว์เลี้ยง", "icon": "🐱", "color": "#..." }],
  "factories": [{ "id": "f1", "name": "...", "location": "...", "rating": 4.8, "tags": [...], ... }],
  "factoryProfiles": [{ "factoryId": "f1", "address": "...", "acceptedProductTypes": [...], "certificates": [...] }],
  "factoryReviews": [{ "id": "r1", "factoryId": "f1", "reviewer": "...", "rating": 5, "comment": "...", "date": "..." }],
  "ideaArticles": [{ "id": "a1", "factoryId": "f1", "title": "...", "excerpt": "...", "image": "...", "tag": "..." }],
  "factoryShowcases": [{ "id": "s1", "factoryId": "f1", "title": "...", "contentType": "product|promotion|idea", "category": "...", "likes": 120, "minOrder": 500, "tags": [...] }],
  "rfqs": [{ "id": "rfq1", "projectName": "...", "category": "...", "status": "...", "offers": [...] }],
  "orders": [{ "id": "ord1", "projectName": "...", "status": "...", "progress": 60, "timeline": [...] }],
  "conversations": [{ "id": "c1", "factoryId": "f1", "factoryName": "...", "messages": [...] }],
  "notifications": [{ "id": "n1", "type": "RF", "title": "...", "message": "...", "read": false }]
}
```

### `GET /frontend/bootstrap`

> Aggregated dashboard — ข้อมูลหลักสำหรับ dashboard

```json
{
  "currentUser": { "id": 1, "role": "CT", "name": "...", ... },
  "categories": [{ "id": 1, "name": "..." }],
  "factories": [{ "id": 1, "name": "...", "location": "...", ... }],
  "rfqs": [{ "id": 1, "projectName": "...", "status": "...", ... }],
  "orders": [{ "id": 1, "projectName": "...", "status": "...", ... }],
  "threads": [{ "referenceType": "RFQ", "referenceId": "1", "counterpart": "...", ... }]
}
```

### `GET /frontend/me`

```json
{
  "id": 1, "role": "CT", "name": "Somchai Jaidee", "company": "...",
  "email": "...", "phone": "...", "avatar": "...",
  "walletBalance": 5000, "pendingBalance": 0, "memberSince": "2026"
}
```

### `GET /frontend/factories`

```json
[{ "id": 1, "name": "...", "location": "...", "rating": 4.8, "reviews": 120, "tags": [...], "verified": true, ... }]
```

### `GET /frontend/factories/:factory_id`

```json
{
  "factory": { "id": 1, "name": "...", "location": "...", ... },
  "profile": { "address": "...", "acceptedProductTypes": [...], "certificates": [...] },
  "reviews": [{ "id": "r1", "reviewer": "...", "rating": 5, ... }],
  "products": [{ "id": "s1", "title": "...", "contentType": "product", ... }],
  "promotions": [{ "id": "s2", "title": "...", "contentType": "promotion", ... }],
  "ideas": [{ "id": "s3", "title": "...", "contentType": "idea", ... }]
}
```

### `GET /frontend/rfqs/:rfq_id`

```json
{
  "rfq": { "id": 1, "projectName": "...", "category": "...", "status": "...", ... },
  "images": ["https://..."],
  "offers": [{ "id": 1, "factoryId": 1, "factoryName": "...", "price": 50000, ... }]
}
```

### `GET /frontend/orders/:order_id`

```json
{
  "order": { "id": 1, "projectName": "...", "status": "...", "totalAmount": 65000, ... },
  "timeline": [{ "id": 1, "title": "ยืนยันคำสั่งซื้อ", "date": "...", "status": "completed", "photo": "..." }]
}
```

### `GET /frontend/messages/threads`

```json
[{
  "referenceType": "RFQ", "referenceId": "1",
  "counterpartId": 2, "counterpart": "โรงงาน A",
  "projectName": "ผลิตอาหารแมว",
  "lastMessage": "...", "lastMessageAt": "...",
  "unread": 3, "hasQuote": true, "avatar": "..."
}]
```

### `GET /frontend/products` ❌ ยังไม่ได้ต่อ

> สินค้าแนะนำในหน้า Explore

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `limit` | int | 8 | จำนวนสินค้า |
| `category_id` | string | - | กรองตามหมวดหมู่ |

```json
[{
  "id": "p1", "title": "อาหารแมว Holistic สูตรไก่-แอปเปิล",
  "price": "฿1,200.00", "image_url": "https://...",
  "discount": "-15%", "factory_id": "f1"
}]
```

### `GET /frontend/promotions` ❌ ยังไม่ได้ต่อ

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `limit` | int | 4 | จำนวนโปรโมชัน |

```json
[{
  "id": "rp1", "title": "แพ็กเกจอาบน้ำ-ตัดขน VIP",
  "description": "บริการดูแลความสะอาดแบบพรีเมียม",
  "price": "฿850.00", "image_url": "https://...",
  "tag": "บริการ", "factory_id": "f1"
}]
```

### `GET /frontend/promo-codes` ❌ ยังไม่ได้ต่อ

```json
[{
  "id": "1", "title": "ลด 15% ค่าผลิตครั้งแรก",
  "subtitle": "ใช้โค้ดนี้เมื่อสร้าง RFQ ใหม่ หมดเขต 31 มี.ค. 2026",
  "code": "FIRST15", "valid_until": "2026-03-31"
}]
```

### `GET /frontend/explore` ❌ ยังไม่ได้ต่อ

> Aggregated endpoint — รวมทุกอย่างของหน้า Explore ในเส้นเดียว

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

---

## 3. Master / Lookup

> ใช้สำหรับ dropdown, filter, form ต่าง ๆ — ดึงข้อมูลจากตาราง `lbi_*`

### `GET /master/product-categories` ⭐ สำคัญ — ใช้ใน Explore + Factory Ideas

| Query Param | Type | Description |
|-------------|------|-------------|
| `parent_category_id` | int64 | กรอง sub-categories (ไม่ส่ง = ดึงทั้งหมด) |

```json
[
  { "category_id": 1, "parent_category_id": null, "category_name": "อาหารสัตว์เลี้ยง", "status": "1" },
  { "category_id": 2, "parent_category_id": null, "category_name": "อาหารเสริม", "status": "1" },
  { "category_id": 3, "parent_category_id": null, "category_name": "ของเล่น", "status": "1" },
  { "category_id": 4, "parent_category_id": null, "category_name": "เสื้อผ้า", "status": "1" },
  { "category_id": 6, "parent_category_id": null, "category_name": "แพ็คเกจจิ้ง", "status": "1" },
  { "category_id": 11, "parent_category_id": null, "category_name": "ขนมสัตว์เลี้ยง", "status": "1" }
]
```

> **หมายเหตุ**: ExploreCategories แสดง 6 หมวดหมู่ที่ hardcode ID ไว้ (3, 1, 11, 2, 4, 6) แต่ดึงชื่อจาก API

### `GET /master/provinces`

```json
[{ "row_id": 1, "name_th": "กรุงเทพมหานคร", "name_en": "Bangkok", "status": "1" }]
```

### `GET /master/districts?province_id={id}`

```json
[{ "row_id": 1001, "province_id": 1, "name_th": "เขตพระนคร", "name_en": "Phra Nakhon", "status": "1" }]
```

### `GET /master/sub-districts?district_id={id}`

```json
[{ "row_id": 100101, "district_id": 1001, "name_th": "พระบรมมหาราชวัง", "name_en": "...", "zip_code": "10200", "status": "1" }]
```

### `GET /master/factory-types`

```json
[{ "factory_type_id": 1, "type_name": "โรงพิมพ์บรรจุภัณฑ์", "status": "1" }]
```

### `GET /master/production-steps?factory_type_id={id}`

```json
[{ "step_id": 1, "factory_type_id": 1, "step_name": "ยืนยันคำสั่งซื้อ", "sequence": 1, "status": "1" }]
```

### `GET /master/units`

```json
[{ "unit_id": 1, "unit_name_th": "ชิ้น", "unit_name_en": "Piece", "status": "1" }]
```

### `GET /master/shipping-methods`

```json
[{ "shipping_method_id": 1, "method_name": "ลูกค้ารับเองที่โรงงาน", "status": "1" }]
```

---

## 4. Catalog

### `GET /categories`

> ดึงจากตาราง `categories` (003_marketplace.sql) — ไม่ใช่ `lbi_product_categories`

```json
[{ "category_id": 1, "name": "อาหารสัตว์" }]
```

### `GET /units`

```json
[{ "unit_id": 1, "name": "ชิ้น" }]
```

---

## 5. Factories

### `GET /factories`

```json
[{
  "id": "uuid", "name": "...", "email": "...", "phone": "...",
  "address": "...", "description": "...", "created_at": "...", "updated_at": "..."
}]
```

### `GET /factories/:id`

Response: single factory object

### `POST /factories`

```json
{ "name": "...", "email": "...", "phone": "...", "address": "...", "description": "..." }
```

### `PATCH /factories/:id`

Partial update — ส่งเฉพาะ field ที่ต้องการแก้

### `DELETE /factories/:id`

Response: `204 No Content`

### `GET /factories/:factory_id/reviews` ❌ ยังไม่ได้ต่อ

```json
[{ "review_id": 1, "factory_id": 1, "user_id": 2, "rating": 5, "comment": "...", "created_at": "..." }]
```

### `POST /factories/:factory_id/reviews` ❌ ยังไม่ได้ต่อ

```json
{ "rating": 5, "comment": "ดีมาก ส่งตรงเวลา" }
```

### `GET /factories/:factory_id/certificates` ❌ ยังไม่ได้ต่อ

```json
[{
  "map_id": 1, "factory_id": 1, "cert_id": 1,
  "document_url": "https://...", "expire_date": "2027-01-01",
  "cert_number": "GMP-001", "verify_status": "AC"
}]
```

### `POST /factories/:factory_id/certificates` ❌ ยังไม่ได้ต่อ

```json
{ "cert_id": 1, "document_url": "https://...", "expire_date": "2027-01-01", "cert_number": "GMP-001" }
```

---

## 6. Showcases ❌ ยังไม่ได้ต่อ

> ตาราง `factory_showcases` — สินค้า/โปรโมชัน/ไอเดียของโรงงาน

### `GET /showcases?type={content_type}`

| Query Param | Type | Description |
|-------------|------|-------------|
| `type` | string | `product`, `promotion`, `idea` หรือว่าง = ทั้งหมด |

```json
[{
  "showcase_id": 1, "factory_id": 1,
  "content_type": "PR", "title": "...", "excerpt": "...",
  "image_url": "https://...", "category_id": 3,
  "min_order": 500, "lead_time_days": 21, "likes_count": 45,
  "created_at": "..."
}]
```

### `POST /showcases`

```json
{
  "content_type": "PR",
  "title": "อาหารแมว Premium",
  "excerpt": "...",
  "image_url": "https://...",
  "category_id": 1,
  "min_order": 500,
  "lead_time_days": 21
}
```

---

## 7. RFQs

### `POST /rfqs`

```json
{
  "category_id": 1, "title": "ผลิตอาหารแมว",
  "quantity": 5000, "unit_id": 1,
  "budget_per_piece": 25.00, "details": "...",
  "address_id": 1
}
```

### `GET /rfqs?status={status}`

Status codes: `OP` (open), `CL` (closed), `CC` (cancelled)

### `GET /rfqs/:rfq_id`

```json
{ "rfq": { ... }, "images": [{ "image_id": "...", "image_url": "..." }] }
```

### `POST /rfqs/:rfq_id/images`

```json
{ "image_url": "https://..." }
```

### `PATCH /rfqs/:rfq_id/cancel`

Response: updated RFQ with status `CC`

---

## 8. Quotations

### `POST /rfqs/:rfq_id/quotations`

```json
{
  "price_per_piece": 22.50, "mold_cost": 5000,
  "lead_time_days": 21, "shipping_method_id": 1
}
```

### `GET /rfqs/:rfq_id/quotations`

```json
[{
  "quote_id": 1, "rfq_id": 1, "factory_id": 2,
  "price_per_piece": 22.50, "mold_cost": 5000,
  "lead_time_days": 21, "shipping_method_id": 1,
  "status": "PD", "create_time": "..."
}]
```

### `GET /quotations/:quotation_id` ❌ ยังไม่ได้ต่อ

### `PATCH /quotations/:quotation_id/status` ❌ ยังไม่ได้ต่อ

```json
{ "status": "AC" }
```

Status codes: `PD` (pending), `AC` (accepted), `RJ` (rejected)

---

## 9. Orders

### `POST /orders`

```json
{ "quote_id": 1 }
```

### `GET /orders?status={status}`

Status codes: `PR` (production), `QC` (quality check), `SH` (shipped), `CP` (completed)

### `GET /orders/:order_id`

### `PATCH /orders/:order_id/status`

```json
{ "status": "SH" }
```

---

## 10. Production Updates

### `POST /orders/:order_id/production-updates`

```json
{ "step_id": 2, "description": "เริ่มผลิตแล้ว", "image_url": "https://..." }
```

### `GET /orders/:order_id/production-updates`

```json
[{ "update_id": 1, "order_id": 1, "step_id": 2, "description": "...", "image_url": "...", "created_at": "..." }]
```

### `PATCH /production-updates/:update_id` ❌ ยังไม่ได้ต่อ

---

## 11. Conversations ❌ ยังไม่ได้ต่อ

### `GET /conversations`

```json
[{
  "conv_id": 1, "customer_id": 1, "factory_id": 2,
  "last_message": "...", "unread_customer": 2, "unread_factory": 0,
  "has_quote": true, "updated_at": "..."
}]
```

### `GET /conversations/:conv_id`

### `POST /conversations`

```json
{ "customer_id": 1, "factory_id": 2 }
```

---

## 12. Messages

### `POST /messages`

```json
{
  "reference_type": "RFQ", "reference_id": "1",
  "receiver_id": 2, "content": "สวัสดีครับ ขอรายละเอียดเพิ่มเติม",
  "attachment_url": "https://..."
}
```

> เพิ่มเติมจาก migration 007: messages มี `conv_id`, `message_type` (TX=text, QT=quote, IM=image), `quote_data` (JSONB), `is_read`

### `GET /messages?reference_type={type}&reference_id={id}`

### `GET /messages/threads`

---

## 13. Notifications ❌ ยังไม่ได้ต่อ

### `GET /notifications`

```json
[{
  "noti_id": 1, "user_id": 1, "type": "RF",
  "title": "ได้รับใบเสนอราคาใหม่", "message": "...",
  "link_to": "/rfqs/1", "is_read": false,
  "reference_id": 1, "created_at": "..."
}]
```

### `PATCH /notifications/:noti_id/read`

Response: `{ "success": true }`

---

## 14. Favorites ❌ ยังไม่ได้ต่อ

### `GET /favorites`

```json
[{ "fav_id": 1, "user_id": 1, "showcase_id": 5, "created_at": "..." }]
```

### `POST /favorites`

```json
{ "showcase_id": 5 }
```

### `DELETE /favorites/:showcase_id`

Response: `{ "success": true }`

---

## 15. Wallets

### `GET /wallets/me`

```json
{ "wallet_id": 1, "user_id": 1, "good_fund": 5000.00, "pending_fund": 2500.00 }
```

---

## 16. Transactions ❌ ยังไม่ได้ต่อ

### `POST /transactions`

```json
{ "wallet_id": 1, "order_id": 1, "type": "DP", "amount": 32500.00 }
```

Type codes: `DP` (deposit), `WD` (withdraw), `BU` (buy), `SC` (success), `RF` (refund)

### `GET /transactions`

### `PATCH /transactions/:tx_id/status`

```json
{ "status": "PT" }
```

Status codes: `ST` (start), `PT` (paid), `RJ` (rejected)

---

## 17. Addresses ❌ ยังไม่ได้ต่อ

### `GET /addresses`

```json
[{
  "address_id": 1, "user_id": 1, "address_type": "C",
  "address_detail": "123/45 ถ.สุขุมวิท",
  "sub_district_id": 100101, "district_id": 1001, "province_id": 1,
  "zip_code": "10200", "is_default": true
}]
```

Address type: `C` (customer), `M` (manufacturer)

### `POST /addresses`

```json
{
  "address_type": "C", "address_detail": "123/45 ถ.สุขุมวิท",
  "sub_district_id": 100101, "district_id": 1001, "province_id": 1,
  "zip_code": "10200", "is_default": true
}
```

### `PATCH /addresses/:address_id`

Partial update

---

## 18. Reviews ❌ ยังไม่ได้ต่อ

### `GET /factories/:factory_id/reviews`

### `POST /factories/:factory_id/reviews`

```json
{ "rating": 5, "comment": "ดีมาก ส่งตรงเวลา" }
```

---

## 19. Certificates ❌ ยังไม่ได้ต่อ

### `GET /factories/:factory_id/certificates`

### `POST /factories/:factory_id/certificates`

```json
{
  "cert_id": 1, "document_url": "https://...",
  "expire_date": "2027-01-01", "cert_number": "GMP-001"
}
```

Verify status: `PD` (pending), `AC` (accepted), `RJ` (rejected)

---

## 20. Media Upload ❌ ยังไม่ได้ต่อ

### `POST /media/upload`

```
Content-Type: multipart/form-data
Field: file (binary)
```

**Response:**
```json
{ "url": "/uploads/filename.jpg" }
```

> ไฟล์ถูกเก็บใน `./uploads/` และ serve ผ่าน `app.Static("/uploads", "./uploads")`

---

## 21. Promo Slides ❌ ยังไม่ได้ต่อ

### `GET /promo-slides`

> Banner carousel ในหน้า Explore — ดึงจากตาราง `promo_slides`

```json
[{
  "slide_id": 1, "title": "ลด 15% ค่าผลิตครั้งแรก",
  "subtitle": "ใช้โค้ดนี้เมื่อสร้าง RFQ ใหม่",
  "code": "FIRST15", "image_url": "https://...", "status": "1"
}]
```

---

## DB Schema Summary

### ความสัมพันธ์หลัก

```
users (user_id, role: CT|FT)
  ├── customers (1:1) → first_name, last_name
  ├── factory_profiles (1:1) → factory_name, factory_type_id → lbi_factory_types
  ├── wallets (1:1) → good_fund, pending_fund
  │     └── transactions (1:N) → type, amount, status
  ├── addresses (1:N) → address_type, sub_district → lbi_sub_districts → lbi_districts → lbi_provinces
  ├── rfqs (1:N) → category_id → categories
  │     ├── rfq_images (1:N)
  │     └── quotations (1:N) → factory_id (users), shipping_method_id → shipping_methods
  │           └── orders (1:1 per quotation)
  │                 └── production_updates (1:N) → step_id → production_steps
  ├── messages (sender/receiver) → reference_type (RFQ|ORDER), conv_id → conversations
  ├── conversations (customer_id, factory_id) → last_message, unread counts
  ├── notifications (1:N) → type, link_to
  └── favorites (1:N) → showcase_id → factory_showcases

factory_showcases (showcase_id)
  ├── factory_id → users (FT)
  ├── content_type: PR (product) | PM (promotion) | ID (idea)
  ├── category_id → lbi_product_categories (optional)
  ├── map_showcase_tags (M:N) → tag_id
  └── favorites (1:N)

factory_reviews
  ├── factory_id → users (FT)
  └── user_id → users (CT)

map_factory_certificates
  ├── factory_id → users (FT)
  └── cert_id, document_url, verify_status

-- Lookup tables (lbi_*) --
lbi_product_categories (category_id, parent_category_id → self, category_name)
lbi_factory_types (factory_type_id, type_name)
lbi_production (step_id, factory_type_id, step_name, sequence)
lbi_provinces → lbi_districts → lbi_sub_districts
lbi_units (unit_id, unit_name_th, unit_name_en)
lbi_shipping_methods (shipping_method_id, method_name)

-- Frontend content tables --
products (id, title, price, image_url, discount, factory_id, category_id)
promotions (id, title, description, price, image_url, tag, factory_id)
promo_codes (id, title, subtitle, code, valid_until)
promo_slides (slide_id, title, subtitle, code, image_url, status)
```

### ตาราง categories vs lbi_product_categories

| Table | Source | ใช้ที่ไหน |
|-------|--------|----------|
| `categories` (003) | `category_id`, `name` | RFQs (`rfqs.category_id`) |
| `lbi_product_categories` (005) | `category_id`, `parent_category_id`, `category_name` | Master lookup, Explore, Factory Ideas filter |

> **สำคัญ**: 2 ตารางนี้แยกกัน — `categories` ใช้ใน RFQ flow, `lbi_product_categories` ใช้ใน master/lookup

---

## สรุปลำดับความสำคัญในการเชื่อมต่อ

| Priority | กลุ่ม | Endpoints | เหตุผล |
|----------|-------|-----------|--------|
| 🔴 สูง | Explore content | `GET /frontend/explore` หรือ `/products` + `/promotions` + `/promo-codes` | แทน hardcoded data ในหน้า Explore |
| 🔴 สูง | Promo slides | `GET /promo-slides` | แทน PROMO_SLIDES ใน constants.ts |
| 🔴 สูง | Showcases | `GET /showcases` | ใช้ใน Factory Ideas แทน mock-data |
| 🟡 กลาง | Conversations | `GET/POST /conversations` | ระบบแชทเต็มรูปแบบ |
| 🟡 กลาง | Notifications | `GET /notifications` + `PATCH .../read` | ระบบแจ้งเตือน |
| 🟡 กลาง | Favorites | `GET/POST/DELETE /favorites` | ระบบรายการโปรด |
| 🟡 กลาง | Addresses | `GET/POST/PATCH /addresses` | จัดการที่อยู่ |
| 🟡 กลาง | Transactions | `GET/POST /transactions` | ระบบชำระเงิน |
| 🟢 ต่ำ | Reviews | `GET/POST /factories/:id/reviews` | รีวิวโรงงาน |
| 🟢 ต่ำ | Certificates | `GET/POST /factories/:id/certificates` | ใบรับรองโรงงาน |
| 🟢 ต่ำ | Media | `POST /media/upload` | อัปโหลดรูปภาพ |
| 🟢 ต่ำ | Quotation CRUD | `GET/PATCH /quotations/:id` | จัดการใบเสนอราคา |
