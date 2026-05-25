# Spec: Detail Pages — Product / Promotion / Idea

> เอกสารนี้ครอบคลุม 3 หน้า: `/product-detail`, `/promotion-detail`, `/idea-detail`  
> จุดประสงค์: ให้ Designer ออกแบบ UI ใหม่ได้โดยไม่ต้องอ่านโค้ด  
> ทุกฟังก์ชันและ data field ที่มีอยู่จริงถูกระบุครบ

---

## 1. ภาพรวมของทั้ง 3 หน้า

| หน้า | Route | ข้อมูลที่แสดง | ผู้ใช้งานหลัก |
|---|---|---|---|
| Product Detail | `/product-detail?showcase_id=:id` | สินค้า OEM / วัตถุดิบ | Buyer ที่ต้องการผลิตสินค้า |
| Promotion Detail | `/promotion-detail?showcase_id=:id` | โปรโมชันราคาพิเศษจากโรงงาน | Buyer ที่มองหาข้อเสนอ |
| Idea Detail | `/idea-detail?showcase_id=:id` | บทความไอเดียการผลิต | Buyer / ผู้ที่อยากได้แรงบันดาลใจ |

ทั้ง 3 หน้าใช้ข้อมูลจาก **ตาราง `factory_showcases`** เดียวกัน แยกกันด้วย `content_type`:
- `PD` / `MT` → Product Detail
- `PM` → Promotion Detail  
- `ID` → Idea Detail

---

## 2. Data Model (ข้อมูลที่ได้จาก API)

### 2.1 ข้อมูลหลัก (FactoryShowcase)

| Field | Type | ใช้ใน | คำอธิบาย |
|---|---|---|---|
| `id` | string | ทุกหน้า | showcase ID |
| `factoryId` | string | ทุกหน้า | ใช้ navigate ไปหน้าโรงงาน / เริ่มแชท |
| `factoryName` | string | ทุกหน้า | ชื่อโรงงาน |
| `factoryImageUrl` | string? | ทุกหน้า | รูปโรงงาน (fallback) |
| `factoryRating` | number? | PD, PM | rating จาก showcase |
| `factoryVerified` | boolean? | ทุกหน้า | badge "Preferred" |
| `title` | string | ทุกหน้า | ชื่อสินค้า/โปรโมชัน/ไอเดีย |
| `excerpt` | string | ทุกหน้า | คำอธิบายสั้น |
| `content` | string? | ทุกหน้า | เนื้อหา Markdown (รายละเอียดเต็ม) |
| `description` | string? | ทุกหน้า | คำอธิบายเพิ่มเติม |
| `image` | string | ทุกหน้า | รูปหลัก (fallback ถ้าไม่มี imageUrls) |
| `imageUrls` | string[]? | ทุกหน้า | gallery รูป (max 8 รูป) |
| `images` | ShowcaseImageRow[]? | PD, PM | โครงสร้าง image row จาก DB |
| `contentType` | 'product'/'promotion'/'idea'/'material' | ทุกหน้า | ประเภท |
| `category` | string | ทุกหน้า | หมวดหมู่หลัก เช่น "อาหารสัตว์เลี้ยง" |
| `categoryId` | string? | ทุกหน้า | ID หมวดหมู่หลัก |
| `sub_category_id` | number? | PD, PM | ID หมวดย่อย |
| `sub_category_name` | string? | PD, PM | ชื่อหมวดย่อย เช่น "อาหารเม็ด" |
| `tags` | string[] | PD | แท็กสินค้า |
| `postedAt` | string | ทุกหน้า | วันที่เผยแพร่ (ISO date) |
| `likes` | number | ทุกหน้า | จำนวนคนกดสนใจ |
| `minOrder` | number | PD, PM | MOQ ขั้นต่ำ |
| `leadTime` | string | PD | ระยะเวลาผลิต |
| `basePrice` | number? | PD, PM | ราคาปกติ (บาท) |
| `promoPrice` | number? | PM | ราคาโปรโมชัน (บาท) |
| `priceRange` | string? | PD, PM | ช่วงราคาแบบ text เช่น "500-1,000 บาท" |
| `startDate` | string? | PM | วันเริ่มโปร (ISO date) |
| `endDate` | string? | PM | วันหมดโปร (ISO date) |
| `status` | string? | PM | สถานะโปรโมชัน |
| `specs` | ShowcaseSpecRow[]? | PD | คุณสมบัติเฉพาะ (key-value) |
| `sections` | ShowcaseSection[]? | PD, PM | เนื้อหาแบ่งเป็น section (highlight/checklist) |
| `linkedShowcases` | (string\|number)[]? | ID | showcase ที่อ้างอิงในไอเดีย |
| `location` | string? | ทุกหน้า | จังหวัดที่ตั้ง |

### 2.2 ข้อมูลโรงงาน (Factory — embedded ใน API response)

| Field | Type | คำอธิบาย |
|---|---|---|
| `id` | string | factory ID |
| `name` | string | ชื่อโรงงาน |
| `image` | string | รูปโรงงาน |
| `verified` | boolean | โรงงานมี badge Preferred |
| `rating` | number | คะแนนเฉลี่ย (0-5) |
| `reviews` | number | จำนวนรีวิว |
| `specialization` | string | ประเภทโรงงาน |
| `location` | string | จังหวัด |
| `provinceName` | string | จังหวัด (alias) |
| `minOrder` | number | MOQ |
| `leadTime` | string | ระยะเวลาผลิต |

### 2.3 ข้อมูลรีวิว (Reviews — embedded ใน API response)

```
reviews.summary.average     → คะแนนเฉลี่ย
reviews.summary.total       → จำนวนรีวิวทั้งหมด
reviews.summary.breakdown   → { "5": n, "4": n, "3": n, "2": n, "1": n }
reviews.items[]             → รายการรีวิวล่าสุด
  .id, .reviewer, .rating, .comment, .createdAt
```

---

## 3. API Calls ที่ใช้

### 3.1 หน้า Product Detail & Promotion Detail

```
[1] GET /api/v1/showcases/:id
    → ดึงข้อมูล showcase + factory + reviews ใน 1 request
    → triggered: ทันที เมื่อมี showcase_id และไม่มีข้อมูล rich sections ใน store

[2] POST /api/v1/showcases/:id/view
    → fire & forget (ไม่รอ response)
    → triggered: เมื่อ item โหลดสำเร็จครั้งแรก (ไม่นับซ้ำถ้า ID เดิม)

[3] GET /api/v1/showcases?types=PD,PM,MT&sub_category_id=X&limit=8&exclude=:id
    หรือ GET /api/v1/showcases?types=PD,PM,MT&category_id=X&limit=8&exclude=:id
    → ดึง related products
    → triggered: หลัง item โหลดสำเร็จ, ใช้ sub_category_id ก่อน ถ้าไม่มีใช้ category_id
```

### 3.2 หน้า Idea Detail

```
[1] GET /api/v1/showcases/:id
    → เหมือนกัน

[2] POST /api/v1/showcases/:id/view
    → เหมือนกัน

[3] GET /api/v1/showcases?type=ID
    → ดึง related ideas ทั้งหมด แล้ว filter เอา id ที่ไม่ใช่ตัวเอง (max 5)
    → triggered: หลัง item โหลดสำเร็จ

[4] GET /api/v1/showcases/:linkedId (ผ่าน useRelatedShowcases)
    → ดึง linked showcases ที่อ้างอิงใน item.linkedShowcases
    → แสดงใน section "อ้างอิงในไอเดียนี้"
```

---

## 4. States ที่ต้องรองรับ

| State | ทุกหน้า | Product | Promotion | Idea |
|---|---|---|---|---|
| **Loading** | spinner กลางหน้า | ✓ | ✓ | ✓ |
| **Error / Not found** | card แสดง error + ปุ่มกลับ | ✓ | ✓ | ✓ |
| **ไม่มีรูป** | fallback ImageIcon | ✓ | ✓ | ✓ |
| **ไม่มีราคา** | แสดง "สอบถามราคากับโรงงาน" | ✓ | ✓ | — |
| **โปรหมดแล้ว** | badge "หมดโปรแล้ว" + วันที่ | — | ✓ | — |
| **โปรยังไม่เริ่ม** | badge "โปรใกล้เริ่ม" + countdown | — | ✓ | — |
| **กำลังจัดโปร** | badge "กำลังจัดโปร" + เหลือ X วัน | — | ✓ | — |
| **ตัวเองเป็นเจ้าของโรงงาน** | ซ่อนปุ่มแชท แสดงแค่ "ดูโปรไฟล์" | ✓ | ✓ | ✓ |
| **ไม่มี factoryId** | ปุ่มแชทถูก disable | ✓ | ✓ | ✓ |
| **กำลังเริ่มแชท** | spinner บนปุ่มแชท | ✓ | ✓ | ✓ |

---

## 5. ฟังก์ชันทั้งหมดแยกตามหน้า

---

### 5.1 Product Detail (`/product-detail`)

#### 5.1.1 Layout Sections (Mobile — เรียงจากบนลงล่าง)

```
┌─────────────────────────────────────────────┐
│  [1] Hero Gallery                           │
│      - รูปหลัก aspect-ratio 4:3            │
│      - ปุ่มกลับ (top-left, overlay)        │
│      - ปุ่มแชร์ (top-right, overlay)       │
│      - counter "X/Y" (bottom-right overlay) │
├─────────────────────────────────────────────┤
│  [2] Thumbnail Strip (ถ้ามี > 1 รูป)       │
│      - scroll horizontal, tap เปลี่ยนรูป  │
│      - highlight รูปที่ active             │
├─────────────────────────────────────────────┤
│  [3] Title & Price Block                    │
│      - Badge "Preferred" (ถ้า verified)    │
│      - Badge ประเภท (สินค้า/วัตถุดิบ)     │
│      - ชื่อหมวดหมู่ + SubCategoryTag       │
│      - ชื่อสินค้า (h1)                     │
│      - ราคา / "สอบถามราคากับโรงงาน"        │
│      - ราคาปกติขีดฆ่า (ถ้ามี promoPrice)  │
│      - Rating + จำนวนรีวิว + ❤ จำนวนสนใจ │
├─────────────────────────────────────────────┤
│  [4] Tags Block (ถ้ามี tags)               │
│      - chip สีม่วงอ่อน                     │
├─────────────────────────────────────────────┤
│  [5] ข้อมูลจำเพาะสินค้า (Specs Table)     │
│      - MOQ ขั้นต่ำ                         │
│      - Lead time (วัน)                     │
│      - สถานที่ผลิต (จังหวัด)               │
│      - หมวดหมู่, ประเภทย่อย               │
│      - Custom specs (key-value) จาก DB     │
├─────────────────────────────────────────────┤
│  [6] รายละเอียดสินค้า (Markdown)           │
│      - render จาก item.content             │
│      - fallback: "ยังไม่มีรายละเอียด"     │
├─────────────────────────────────────────────┤
│  [7] Factory Card (tap → /factories/:id)   │
│      - รูปโรงงาน (rounded, border)        │
│      - ชื่อ + badge verified               │
│      - specialization text                 │
│      - Rating + สถานที่                    │
│      - arrow icon ขวา                      │
├─────────────────────────────────────────────┤
│  [8] Rating & Reviews Section              │
│      - คะแนนตัวใหญ่ (X.X)                 │
│      - bar chart 5-4-3-2-1 ดาว            │
│      - รายการรีวิวล่าสุด (max 2 รายการ)  │
├─────────────────────────────────────────────┤
│  [9] Related Products Grid                 │
│      - grid 2 คอลัมน์                     │
│      - card: รูป + badge type + ชื่อ      │
│      - จังหวัด + rating + MOQ             │
│      - tap → /product-detail หรือ         │
│              /promotion-detail             │
├─────────────────────────────────────────────┤
│  [FIXED BOTTOM BAR]                        │
│      ┌──────┬──────┬──────────────────┐   │
│      │Store │ ❤ N  │  💬 แชทกับโรงงาน│   │
│      └──────┴──────┴──────────────────┘   │
└─────────────────────────────────────────────┘
```

#### 5.1.2 Layout Sections (Desktop)

```
┌──────────────────────────────────────────────────────────┐
│  [HEADER] ปุ่มกลับ + Breadcrumb                         │
├───────────────────────────┬──────────────────────────────┤
│  [LEFT COLUMN]            │  [RIGHT COLUMN]              │
│                           │                              │
│  ShowcaseHeroGallery      │  • Badge ประเภท + หมวด       │
│  - Carousel arrow nav     │  • ชื่อสินค้า (h1)           │
│  - thumbnail 5 รูป        │  • ราคา / priceRange         │
│  - image counter          │  • Rating + Likes            │
│                           │  • SubCategoryTag            │
│                           │  • Tags                      │
│                           │                              │
│                           │  ─────────────────────────   │
│                           │  Specs Table:                │
│                           │  • MOQ, Lead time            │
│                           │  • สถานที่ผลิต               │
│                           │  • Custom specs              │
│                           │                              │
│                           │  ─────────────────────────   │
│                           │  Action Buttons:             │
│                           │  • ❤ ถูกใจ (toggle)         │
│                           │  • 🔗 แชร์                  │
│                           │  • 💬 แชทกับโรงงาน (primary)│
│                           │                              │
│                           │  Factory mini-card           │
│                           │  (ชื่อ, rating, จังหวัด)    │
├───────────────────────────┴──────────────────────────────┤
│  [FULL WIDTH] รายละเอียดสินค้า (Markdown)               │
├──────────────────────────────────────────────────────────┤
│  [FULL WIDTH] Rating & Reviews (2-column layout)        │
│  left: score + bar chart | right: review cards           │
├──────────────────────────────────────────────────────────┤
│  [FULL WIDTH] Related Products (3-4 columns grid)        │
└──────────────────────────────────────────────────────────┘
```

#### 5.1.3 ฟังก์ชันทั้งหมด

| ฟังก์ชัน | Trigger | Action |
|---|---|---|
| **กลับ** | tap Back button | `navigate(-1)` |
| **แชร์** | tap Share icon | Web Share API → fallback copy URL |
| **เปลี่ยนรูปหลัก** | tap thumbnail / swipe gallery | `setActiveImage(idx)` |
| **ถูกใจ / บันทึก** | tap ❤ (header หรือ bottom bar) | `toggleFavorite(item.id)` — optimistic UI |
| **แชทกับโรงงาน** | tap ปุ่มหลัก | `startChat(factoryId, { type:'PD', id, title })` → navigate ไปหน้า chat |
| **ดูโปรไฟล์โรงงาน** | tap Factory Card หรือ Store icon | `navigate('/factories/:factoryId')` |
| **ไปสินค้าที่ใกล้เคียง** | tap Related Card | `navigate('/product-detail?showcase_id=:id')` หรือ `/promotion-detail` |

---

### 5.2 Promotion Detail (`/promotion-detail`)

#### 5.2.1 ความแตกต่างจาก Product Detail

Promotion Detail มีโครงสร้างคล้ายกัน แต่เพิ่ม/เปลี่ยน:

| ส่วน | Product | Promotion |
|---|---|---|
| Badge ประเภท | สินค้า/วัตถุดิบ | โปรโมชัน (สีส้ม) |
| ราคา | basePrice | promoPrice (ใหญ่) + basePrice ขีดฆ่า |
| Promotion Status | — | ✅ Status badge พิเศษ |
| วันที่โปร | — | ✅ startDate → endDate |
| Related | Related Products | Related Promotions |

#### 5.2.2 Promotion Status Logic

```
ฟังก์ชัน promoMeta(startDate, endDate):

ถ้า startDate หรือ endDate ไม่ valid:
  → status: "โปรโมชัน", hint: "กรุณาตรวจสอบวันเริ่มและวันสิ้นสุด"

ถ้า now < startDate:
  → status: "โปรใกล้เริ่ม", hint: "เริ่มในอีก X วัน"

ถ้า now > endDate:
  → status: "หมดโปรแล้ว", hint: "สิ้นสุดเมื่อ {formatThaiDate(endDate)}"

ถ้า now อยู่ระหว่าง start-end:
  → status: "กำลังจัดโปร", hint: "เหลืออีก X วัน" | "วันสุดท้าย" | "หมดคืนนี้"
```

#### 5.2.3 Layout Sections เพิ่มเติม (Mobile)

```
Section [3] Title & Price Block (Promotion version):
  - Badge status: "กำลังจัดโปร" (สีเขียว) | "โปรใกล้เริ่ม" (สีฟ้า) | "หมดโปรแล้ว" (สีเทา)
  - ราคาโปร (ใหญ่, สีส้ม)
  - ราคาปกติ (ขีดฆ่า, เล็กกว่า)
  - ไอคอน % (TicketPercent)
  - hint text เช่น "เหลืออีก 3 วัน"

Section [DATE BAR] (ระหว่าง Title Block กับ Tags):
  - ไอคอน CalendarClock
  - "โปรนี้มีผล: {formatThaiDate(startDate)} – {formatThaiDate(endDate)}"
```

#### 5.2.4 ฟังก์ชันที่ต่างจาก Product

| ฟังก์ชัน | คำอธิบาย |
|---|---|
| **Promo status indicator** | คำนวณแบบ real-time จาก startDate/endDate |
| **Countdown hint** | แสดงจำนวนวันที่เหลือหรือผ่านมา |
| **ราคาโปร vs ราคาปกติ** | แสดง discount เปรียบเทียบ |

---

### 5.3 Idea Detail (`/idea-detail`)

#### 5.3.1 ความแตกต่างจาก Product/Promotion

Idea Detail เป็น **article page** ไม่ใช่ product page:
- ไม่มีราคา, MOQ, Lead time, Specs
- ไม่มี Related Products grid
- เน้น **content (Markdown)** เป็นหลัก
- มี **linked showcases** (อ้างอิงสินค้าในบทความ)

#### 5.3.2 Layout Sections (Mobile — เรียงจากบนลงล่าง)

```
┌─────────────────────────────────────────────┐
│  [1] Header Bar (sticky)                    │
│      - ปุ่มกลับ (วงกลม, border)            │
│      - ชื่อบทความ (h1, truncate 2 บรรทัด) │
│      - วันที่เผยแพร่ + CalendarDays icon   │
│      - Badge "บทความไอเดีย" (สีม่วง)       │
│      - ชื่อหมวดหมู่                        │
│      - ปุ่มแชร์ (วงกลม, border)            │
├─────────────────────────────────────────────┤
│  [2] Article Body (Markdown)                │
│      - render item.content เต็มๆ           │
│      - font-size 14px ทุก element          │
│      - bg-white, rounded-2xl, shadow       │
├─────────────────────────────────────────────┤
│  [3] Factory Author Card                    │
│      - รูปโรงงาน (avatar 40x40)           │
│      - ชื่อโรงงาน + badge verified         │
│      - จังหวัด (MapPin icon)               │
│      - ❤ จำนวน likes (toggle)             │
│      ─────────────────────────             │
│      Action buttons:                        │
│      - 💬 แชทกับโรงงาน (gradient, ถ้า canChat) │
│      - โปรไฟล์ ↗ (border, outline)        │
├─────────────────────────────────────────────┤
│  [4] Linked Showcases Section              │
│      - "อ้างอิงในไอเดียนี้"               │
│      - grid 2 คอลัมน์                     │
│      - แสดงเฉพาะเมื่อ item.linkedShowcases มีค่า │
│      - tap → navigate ตาม contentType     │
├─────────────────────────────────────────────┤
│  [5] Related Ideas Section                 │
│      - "บทความที่น่าสนใจให้อ่านต่อ"       │
│      - article card: badge + title + excerpt │
│      - ชื่อโรงงาน + verified badge        │
│      - MOQ + ❤ likes                      │
│      - tap → /idea-detail?showcase_id=X    │
└─────────────────────────────────────────────┘

[ไม่มี Fixed Bottom Bar บน Idea Detail]
```

#### 5.3.3 Layout Sections (Desktop)

```
┌──────────────────────────────────────────────────────────┐
│  [HEADER] ปุ่มกลับ + ชื่อบทความ + วันที่ + ปุ่มแชร์   │
├───────────────────────────┬──────────────────────────────┤
│  [LEFT - MAIN CONTENT]    │  [RIGHT SIDEBAR]             │
│                           │                              │
│  Article Body (Markdown)  │  Factory Card                │
│  - full width content     │  - รูป โรงงาน (square)      │
│  - bg-white card          │  - ชื่อ + verified badge     │
│                           │  - specialization            │
│  Linked Showcases Grid    │  - rating, จังหวัด           │
│  (2-4 columns)            │  - ❤ likes                  │
│                           │  - 💬 แชทกับโรงงาน          │
│  Related Ideas (vertical) │  - โปรไฟล์โรงงาน ↗          │
└───────────────────────────┴──────────────────────────────┘
```

#### 5.3.4 ฟังก์ชันทั้งหมด (Idea)

| ฟังก์ชัน | Trigger | Action |
|---|---|---|
| **กลับ** | tap Back button | `navigate(-1)` |
| **แชร์** | tap Share icon | Web Share API → fallback copy URL |
| **ถูกใจ** | tap ❤ ใน Factory Card | `toggleFavorite(item.id)` |
| **ถูกใจ related idea** | tap ❤ ใน related card | `toggleFavorite(next.id)` — stop propagation |
| **แชทกับโรงงาน** | tap ปุ่มแชท | `startChat(factoryId, { type:'ID', id, title })` |
| **ดูโปรไฟล์โรงงาน** | tap ปุ่ม "โปรไฟล์" | `navigate('/factories/:factoryId')` |
| **ดูโรงงาน (related)** | tap ชื่อโรงงานใน related card | `navigate('/factories/:factoryId')` — stop propagation |
| **ไปบทความ related** | tap related card | `navigate('/idea-detail?showcase_id=:id')` |
| **ไป linked showcase** | tap linked card | `navigate('/factory-ideas/promotions/:id')` หรือ `/products/:id` |

---

## 6. Shared Functions / Utilities

### 6.1 ฟังก์ชันที่ใช้ร่วมกันทั้ง 3 หน้า (`showcaseDetailShared.ts`)

| ฟังก์ชัน | Input | Output | ใช้ที่ |
|---|---|---|---|
| `formatShowcaseTHB(value)` | number | "฿1,500" หรือ null (ถ้า ≤0) | ราคา |
| `formatShowcaseThaiDate(date)` | ISO string | "9 ส.ค. 2567" | วันที่ |
| `normalizeShowcaseMarkdown(raw)` | string/unknown | markdown string (clean) | content rendering |
| `daysBetween(a, b)` | Date, Date | number (วัน) | promo countdown |
| `SHOWCASE_DETAIL_BRAND` | — | color tokens | สีทั้งหน้า |

### 6.2 Hooks ที่ใช้

| Hook | ใช้ใน | ทำอะไร |
|---|---|---|
| `useProductDetailShowcase()` | ProductDetail | `useShowcaseDetailPage('product')` + isIdea/isMaterial flags |
| `usePromotionDetailShowcase()` | PromotionDetail | `useShowcaseDetailPage('promotion')` |
| `useIdeaDetailShowcase()` | IdeaDetail | `useShowcaseDetailPage('idea')` |
| `useFavorites()` | ทุกหน้า | `isLiked(id)`, `toggleFavorite(id)` |
| `useStartChatWithFactory()` | ทุกหน้า | `startChat(factoryId, ref)`, `starting` (boolean) |
| `useAuth()` | ทุกหน้า | `user.id` สำหรับ isSelfFactory check |
| `useData()` | ทุกหน้า | `data.factories`, `data.factoryShowcases` (store cache) |
| `useRelatedShowcases(ids)` | IdeaDetail | ดึง linked showcase objects จาก IDs |

### 6.3 Components ที่ Reusable

| Component | Props หลัก | ใช้ใน |
|---|---|---|
| `ShowcaseHeroGallery` | gallery, activeImage, onActiveImageChange, accentColor, badge | ProductDetail Desktop, PromotionDetail Desktop |
| `RelatedShowcasesSection` | linkedShowcases, onItemClick | IdeaDetail (linked อ้างอิง) |
| `MarkdownBody` | source, className | ทุกหน้า (content section) |
| `StrictSpecsBlock` | showcase.moq, showcase.lead_time_days | ProductDetail (specs) |
| `SubCategoryTag` | name, size, showSubPrefix | ProductDetail |
| `ImageWithFallback` | src, fallbackSrc, alt | ทุกหน้า |

---

## 7. Navigation Flow

```
Explore / Factory Ideas / Favorites
        │
        ├── /product-detail?showcase_id=X
        │         │
        │         ├── /factories/:factoryId  (factory profile)
        │         ├── /promotion-detail?showcase_id=Y  (related)
        │         └── /messages  (start chat → redirect)
        │
        ├── /promotion-detail?showcase_id=X
        │         │
        │         ├── /factories/:factoryId
        │         ├── /product-detail?showcase_id=Y  (related)
        │         └── /messages
        │
        └── /idea-detail?showcase_id=X
                  │
                  ├── /factories/:factoryId
                  ├── /factory-ideas/products/:id  (linked showcase)
                  ├── /factory-ideas/promotions/:id  (linked showcase)
                  ├── /idea-detail?showcase_id=Y  (related idea)
                  └── /messages
```

---

## 8. Responsive Behavior

| Breakpoint | Layout | Bottom Bar |
|---|---|---|
| Mobile (`< md`) | Single column, scroll | Fixed bottom CTA bar (Product/Promotion) |
| Desktop (`≥ md`) | 2-column (gallery left, info right) | Action buttons ใน right column |
| Desktop (Idea) | 2-column (article left, sidebar right) | ไม่มี fixed bar |

---

## 9. Brand Colors (Reference)

```
BRAND.purple      = var(--brand-purple)      → Primary action, badges
BRAND.orange      = var(--brand-orange)      → Rating stars, price, accent
BRAND.ink         = var(--brand-ink)         → ชื่อสินค้า, headers
BRAND.purpleSoft  = #F5F3FF                  → Tag background
BRAND.border      = #E7E2F0                  → Card borders
BRAND.divider     = (ใช้แทน border ใน section)

Promotion status colors:
  กำลังจัดโปร  → green
  โปรใกล้เริ่ม → blue  
  หมดโปรแล้ว  → gray/muted

Gradient (primary CTA button):
  linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-orange) 100%)
```

---

## 10. สิ่งที่ Designer ควรคำนึง

1. **Bottom bar (Mobile)** — fixed position, ต้องเพิ่ม `pb-[72px]` ใน page container
2. **Gallery thumbnails** — click + hover เปลี่ยน active image
3. **Promo countdown** — ต้องแสดงเวลา real-time ไม่ใช่ static
4. **isSelfFactory** — ถ้า user เป็นเจ้าของ factory นั้น ซ่อนปุ่มแชท แสดงแค่ "ดูโปรไฟล์"
5. **Markdown content** — ต้องรองรับ h1-h3, list, blockquote, link
6. **Linked showcases (Idea)** — แสดงเฉพาะเมื่อ `item.linkedShowcases` มีข้อมูล
7. **Safe area** — bottom bar ต้อง support `env(safe-area-inset-bottom)` สำหรับ notch
8. **Skeleton/Loading** — ทุกหน้ามี loading state ก่อน item พร้อม
