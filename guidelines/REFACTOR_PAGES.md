# แนวทางแยก Component ตามหน้า (นอกจาก RfqAndOrders)

หลังจากแยก **RfqAndOrders** เป็น RfqSection + OrderSection แล้ว หน้าต่อไปนี้ควรพิจารณาแยกตามลำดับความสำคัญ (ตามขนาดและความซับซ้อนของหน้า)

---

## สรุปลำดับความสำคัญ

| หน้า               | บรรทัด   | ความสำคัญ | โฟลเดอร์ feature ที่แนะนำ    |
| ------------------ | -------- | --------- | ---------------------------- |
| **OrderDetail**    | 524      | สูงมาก    | `features/order-detail`      |
| **Explore**        | 381      | สูง       | `features/explore`           |
| **RFQDetail**      | 376      | ปานกลาง   | `features/rfq-detail`        |
| **CreateRfq**      | 366      | ปานกลาง   | `features/create-rfq`        |
| **FactoryProfile** | 324      | ปานกลาง   | `features/factory-profile`   |
| **ChatRoom**       | 274      | ต่ำ       | (แยกเฉพาะส่วนใหญ่ถ้าต้องการ) |
| **Profile**        | 253      | ต่ำ       | (แยกเฉพาะส่วนใหญ่ถ้าต้องการ) |
| **FactoryIdeas**   | 226      | ต่ำ       | (แยก filters + list ได้)     |
| หน้าที่เหลือ       | &lt; 175 | ไม่จำเป็น | -                            |

---

## 1. OrderDetail (~524 บรรทัด) — แนะนำแยกสูงสุด

**โครงสร้างปัจจุบัน:** Header → Order Summary Card → แท็บ (ภาพรวม | ความคืบหน้า) → เนื้อหาแต่ละแท็บ → Modal รูปภาพ → ปุ่มลอย

**ส่วนที่แยกได้:**

| Component                | หน้าที่                                                                   | ไฟล์ที่แนะนำ                                     |
| ------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------ |
| **OrderSummaryCard**     | การ์ดสรุปคำสั่งซื้อ (สถานะ, โรงงาน, ความคืบหน้า, มูลค่า, จำนวน, กำหนดส่ง) | `features/order-detail/OrderSummaryCard.tsx`     |
| **OrderOverviewSection** | สถานะการชำระเงิน + RFQ ที่เกี่ยวข้อง + รายการโรงงานที่เคยเสนอราคา         | `features/order-detail/OrderOverviewSection.tsx` |
| **OrderTimelineSection** | รายการความคืบหน้า (timeline)                                              | `features/order-detail/OrderTimelineSection.tsx` |
| **OrderPhotoGallery**    | Modal แสดงรูป / รายการรูป (ถ้ามี)                                         | `features/order-detail/OrderPhotoGallery.tsx`    |

**หน้า OrderDetail.tsx เหลือ:** Header, state (selectedPhoto, activeSection), แท็บภาพรวม/ความคืบหน้า, เรียก component ด้านบน + FAB

**ผลลัพธ์:** แก้ไข overview / timeline / สรุป แยกกันได้ ไม่กระทบกัน

---

## 2. Explore (~381 บรรทัด) — แนะนำแยกสูง

**โครงสร้างปัจจุบัน:** Header (user + ปุ่มแจ้งเตือน) → Search → Promo Carousel → หมวดหมู่ → โรงงานแนะนำ → บทความ Idea → กิจกรรมล่าสุด (RFQ + Orders) → FAB

**ส่วนที่แยกได้:**

| Component                 | หน้าที่                                     | ไฟล์ที่แนะนำ                                 |
| ------------------------- | ------------------------------------------- | -------------------------------------------- |
| **ExplorePromoCarousel**  | สไลด์โปรโมชัน + ปุ่มคัดลอกโค้ด + indicators | `features/explore/ExplorePromoCarousel.tsx`  |
| **ExploreCategories**     | แถวหมวดหมู่เลื่อนได้                        | `features/explore/ExploreCategories.tsx`     |
| **ExploreFactoryGrid**    | กริดโรงงานแนะนำ (การ์ดโรงงาน)               | `features/explore/ExploreFactoryGrid.tsx`    |
| **ExploreIdeaArticles**   | แถวบทความ Idea เลื่อนได้                    | `features/explore/ExploreIdeaArticles.tsx`   |
| **ExploreRecentActivity** | บล็อกกิจกรรมล่าสุด (RFQ + Orders cards)     | `features/explore/ExploreRecentActivity.tsx` |

**constants/utils:** ย้าย `PROMO_SLIDES`, `statusConfig` ไปที่ `features/explore/constants.ts` (หรือในไฟล์ที่ใช้)

**หน้า Explore.tsx เหลือ:** Header, Search, state (searchText, promoIndex, copiedId), เรียก section components + FAB

**ผลลัพธ์:** แต่ละบล็อกแก้/ทดสอบแยกได้ นำ ExploreFactoryGrid / ExploreIdeaArticles ไปใช้ที่อื่นได้

---

## 3. RFQDetail (~376 บรรทัด) — แนะนำแยกปานกลาง

**โครงสร้างปัจจุบัน:** Header → RFQ Status Card → รายละเอียด (specs collapsible) → รายการใบเสนอราคา (offers) → ปุ่มดำเนินการ

**ส่วนที่แยกได้:**

| Component               | หน้าที่                                                                | ไฟล์ที่แนะนำ                                  |
| ----------------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| **RfqDetailStatusCard** | การ์ดสถานะ RFQ (หมวด, ชื่อ, สถานะ/จำนวนใบเสนอราคา)                     | `features/rfq-detail/RfqDetailStatusCard.tsx` |
| **RfqDetailSpecs**      | ส่วน collapsible รายละเอียด (คำอธิบาย, งบ, จำนวน, วัสดุ, deadline ฯลฯ) | `features/rfq-detail/RfqDetailSpecs.tsx`      |
| **RfqDetailOffersList** | รายการโรงงานที่เสนอราคา + การเลือกโรงงาน                               | `features/rfq-detail/RfqDetailOffersList.tsx` |

**หน้า RFQDetail.tsx เหลือ:** Header, state (specsOpen, selectedOffer), data (rfq, orderForRfq), เรียก component ด้านบน + CTA

---

## 4. CreateRfq (~366 บรรทัด) — แนะนำแยกปานกลาง

**โครงสร้างปัจจุบัน:** Header → Stepper (3 steps) → Step 1 (รายละเอียดโปรเจกต์) → Step 2 (ความต้องการและงบประมาณ) → Step 3 (สรุปและส่งคำขอ)

**ส่วนที่แยกได้:**

| Component                 | หน้าที่                                   | ไฟล์ที่แนะนำ                                    |
| ------------------------- | ----------------------------------------- | ----------------------------------------------- |
| **CreateRfqStep1**        | ฟอร์ม step 1 (หมวด, ชื่อสินค้า, คำอธิบาย) | `features/create-rfq/CreateRfqStep1.tsx`        |
| **CreateRfqStep2**        | ฟอร์ม step 2 (จำนวน, งบ, วัสดุ, deadline) | `features/create-rfq/CreateRfqStep2.tsx`        |
| **CreateRfqStep3Summary** | แสดงสรุป + ปุ่มส่งคำขอ                    | `features/create-rfq/CreateRfqStep3Summary.tsx` |

**หน้า CreateRfq.tsx เหลือ:** Header, Stepper, state (currentStep, form), updateForm, handleNext/handleBack, เลือกแสดง step ตาม currentStep

**ผลลัพธ์:** แก้แต่ละ step แยกกัน ลดความยาวหน้าได้มาก

---

## 5. FactoryProfile (~324 บรรทัด) — แนะนำแยกปานกลาง

**โครงสร้างปัจจุบัน:** Hero (รูป + ปุ่มกลับ/แชท + ชื่อ/เรตติ้ง) → Stats strip (ขั้นต่ำ, Lead time, งานสำเร็จ) → Tabs (สินค้า | โปรโมชัน | บทความ | โรงงาน) → เนื้อหาแต่ละแท็บ

**ส่วนที่แยกได้:**

| Component                    | หน้าที่                                                         | ไฟล์ที่แนะนำ                                                                                                            |
| ---------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **FactoryProfileHero**       | รูป cover + ปุ่มกลับ/แชท + ชื่อโรงงาน + เรตติ้ง/ที่อยู่         | `features/factory-profile/FactoryProfileHero.tsx`                                                                       |
| **FactoryProfileStats**      | แถวสถิติ 3 ช่อง (ขั้นต่ำผลิต, Lead time, งานสำเร็จ)             | `features/factory-profile/FactoryProfileStats.tsx`                                                                      |
| **FactoryProfileTabContent** | เนื้อหา 4 แท็บ: สินค้า, โปรโมชัน, บทความ, เกี่ยวกับโรงงาน+รีวิว | `features/factory-profile/FactoryProfileTabContent.tsx` (หรือแยกเป็น TabProducts, TabPromotions, TabArticles, TabAbout) |

**utils:** `formatThaiDate` → `features/factory-profile/utils.ts`

**หน้า FactoryProfile.tsx เหลือ:** useParams, state (activeTab), data (factory, profile, productItems, promotionItems, articleItems, reviews), เรียก Hero + Stats + Tabs + TabContent

---

## 6. หน้าที่เหลือ (แยกเมื่อจำเป็น)

- **ChatRoom (274), Profile (253):** ถ้ามีบล็อกใหญ่ชัดเจน (เช่น รายการข้อความ, บล็อกตั้งค่า) ค่อยแยกเป็น section
- **FactoryIdeas (226):** แยกได้เป็น FactoryIdeasFilters + FactoryIdeasList (หรือ FactoryIdeaCard) ถ้าต้องการ reuse การ์ด
- **ProductDetail, PromotionDetail, IdeaDetail, Messages, Notifications (~137–170):** ขนาดพอใช้ แยกเฉพาะเมื่อมี logic ซ้ำหรือบล็อกใหญ่ชัดเจน

---

## โครงสร้างโฟลเดอร์ที่แนะนำ (สอดคล้องกับ RfqAndOrders)

```
src/app/components/features/
├── rfq-and-orders/     ✅ ทำแล้ว
├── order-detail/       (OrderSummaryCard, OrderOverviewSection, OrderTimelineSection, …)
├── explore/            (ExplorePromoCarousel, ExploreCategories, …)
├── rfq-detail/         (RfqDetailStatusCard, RfqDetailSpecs, RfqDetailOffersList)
├── create-rfq/         (CreateRfqStep1, CreateRfqStep2, CreateRfqStep3Summary)
└── factory-profile/    (FactoryProfileHero, FactoryProfileStats, FactoryProfileTabContent)
```

แต่ละ feature ควรมี `index.ts` export หลัก และใช้จาก `pages/xxx.tsx` เท่านั้น (หน้าเป็นจุดรวม state และ composition).
