# Missing / Incomplete API Endpoints

รายการ API ที่ Frontend เรียกใช้แต่ Backend อาจยังไม่พร้อมหรือส่งข้อมูลไม่ครบ

---

## 1. Factory Profiles & Reviews (DataContext)

**ปัญหา:** `factoryProfiles` และ `factoryReviews` เดิมใช้ mock data, ตอนนี้เป็น `[]` (ว่างเปล่า)

**Endpoint ที่ต้องการ:**
- `GET /api/v1/factories/:id` — ควรคืน `profile` (address, acceptedProductTypes, certificates)
- `GET /api/v1/factories/:id/reviews` — ควรคืน array ของ reviews

**สถานะ:** Endpoint มีอยู่แล้วใน api.ts (`factoriesApi.get()`, `reviewsApi.list()`), แต่ DataContext ยังไม่ได้ดึงมาเก็บใน global state — ใช้ `useFactoryProfile` hook ที่โหลดแต่ละหน้า factory แทน

---

## 2. Conversations (Chat)

**ปัญหา:** ถ้า `GET /api/v1/conversations` คืน `[]` หรือ error จะแสดงหน้า chat ว่างเปล่า

**Endpoint ที่ต้องการ:**
- `GET /api/v1/conversations` — ต้องคืนรายการ conversation ที่ user มีสิทธิ์ดู
- `GET /api/v1/conversations/:id` — รายละเอียด conversation + messages

**สถานะ:** Endpoint มีอยู่ใน api.ts, ตรวจสอบว่า backend ส่ง data ถูกต้อง

---

## 3. Notifications

**ปัญหา:** ถ้า `GET /api/v1/notifications` คืน `[]` จะแสดงว่าไม่มี notification

**Endpoint ที่ต้องการ:**
- `GET /api/v1/notifications` — ต้องคืน notifications ของ user (filtered by user_id จาก token)

**สถานะ:** Endpoint มีอยู่ใน api.ts, ตรวจสอบว่า backend สร้าง notification events ได้จริง

---

## 4. Wallet Balance (currentUser)

**ปัญหา:** `walletBalance` และ `pendingBalance` เดิมมาจาก mock user data

**Endpoint ที่ต้องการ:**
- `GET /api/v1/wallets/me` — คืน `{ balance, pending_balance }`

**สถานะ:** Endpoint มีอยู่ใน api.ts (`walletApi.getMyWallet()`), แต่ยังไม่ได้ merge เข้า `currentUser` ใน DataContext — ต้องเรียกแยกที่หน้า wallet

---

## 5. Bootstrap Endpoint — Fields ที่ควรส่งครบ

`GET /api/v1/frontend/bootstrap` ควรคืน:

```json
{
  "currentUser": {
    "id": 1,
    "name": "...",
    "avatar": "...",
    "company": "...",
    "email": "...",
    "phone": "...",
    "memberSince": "2023"
  },
  "categories": [
    { "id": 1, "name": "อาหารสัตว์", "icon": "🐾", "color": "#3B82F6" }
  ],
  "factories": [
    { "id": 1, "name": "...", "location": "...", "rating": 4.9, ... }
  ],
  "rfqs": [...],
  "orders": [...]
}
```

**สิ่งที่ต้องตรวจสอบ:**
- `currentUser.avatar` — ต้องเป็น URL ที่ใช้ได้จริง
- `categories[].icon` — ถ้าไม่ส่งมา FE จะ guess จากชื่อ category (ใช้ emoji mapping)
- `factories[].rating`, `reviews`, `completedOrders` — ถ้าไม่ส่งมาจะเป็น 0

---

## สรุป

หลังจากเอา mockData.ts ออกแล้ว ทุกข้อมูลมาจาก API เท่านั้น:
- ถ้า API ยังไม่พร้อม → แสดงเป็น empty state (ว่างเปล่า)
- ถ้า API error → แสดง error message พร้อมปุ่ม retry
- ไม่มี fallback เป็น mock data อีกต่อไป
