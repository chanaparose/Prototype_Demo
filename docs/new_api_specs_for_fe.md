# 🚀 New API Specifications (For Frontend)

นี่คือรายการ API Endpoints ใหม่ทั้งหมดที่คุณเพิ่งเพิ่มและสามารถนำไปให้ทีม Frontend (FE) ใช้อ้างอิงเพื่อนำไปเชื่อมต่อได้ทันทีครับ

**Base URL:** `https://wemake-server.onrender.com/api/v1`

---

## 1. Media Upload Endpoints

### `POST /media/upload`

อัปโหลดไฟล์ (รูปภาพ, เอกสาร ฯลฯ) เข้าสู่ Server

- **Header:** `Content-Type: multipart/form-data`
- **Body:** `file=<binary_data>`

**Response:**

```json
{
  "url": "http://SERVER_URL/uploads/xyz123.jpg",
  "file_name": "xyz123.jpg",
  "size": 102400
}
```

---

## 2. Dynamic Frontend Data Endpoints (หน้า Explore / Home)

### `GET /frontend/products`

ดึงรายการสินค้ายอดนิยม

- **Query Params:** `limit` (Default: 8)

### `GET /frontend/promotions`

ดึงรายการโปรโมชันแนะนำ

- **Query Params:** `limit` (Default: 4)

### `GET /frontend/promo-codes`

ดึงรายการโค้ดส่วนลดที่ยังเปิดแคมเปญอยู่

### `GET /frontend/explore`

`[แนะนำ]` ดึงข้อมูลภาพรวมหน้าบ้านทั้งหมดใน 1 Request (Aggregated Payload) คืนค่า Products, Promotions, PromoCodes, Factories, Categories, IdeaArticles รวมมาให้แล้ว

---

## 3. Factory Reviews Endpoints

*(การยิงแบบ POST จำเป็นต้องมีการแนบ Authentication Header)*

### `GET /factories/:factory_id/reviews`

ดึงรายการรีวิวทั้งหมดของโรงงาน

### `POST /factories/:factory_id/reviews`

ส่งรีวิวและให้คะแนนโรงงาน

```json
{
  "rating": 5,
  "comment": "โรงงานนี้บริการดีมาก ส่งงานตรงเวลาครับ!"
}
```

---

## 4. Factory Certificates Endpoints

*(การยิงแบบ POST จำเป็นต้องมีการแนบ Authentication Header และต้องเป็นเจ้าของโรงงาน)*

### `GET /factories/:factory_id/certificates`

ดึงรายการใบรับรองและใบอนุญาตของโรงงานแห่งนี้

### `POST /factories/:factory_id/certificates`

อัปโหลด/เชื่อมโยงใบรับรองของโรงงาน

```json
{
  "cert_id": 1,
  "document_url": "http://SERVER_URL/uploads/cert.pdf",
  "expire_date": "2027-12-31",
  "cert_number": "TH12/3456"
}
```

---

## 5. Conversations / Chat Endpoints

*(จำเป็นต้องมีการแนบ Authentication Header)*

### `GET /conversations`

ดึงรายการห้องสนทนาแชท (Threads) ของผู้ใช้งานปัจจุบันทั้งหมด (เรียงตามอัปเดตล่าสุด)

### `GET /conversations/:conv_id`

ดึงรายละเอียดของห้องแชท

### `POST /conversations`

เริ่มต้นรับส่งข้อความและเปิดห้องแชทใหม่

```json
{
  "customer_id": 1,
  "factory_id": 2
}
```

### `GET /messages`

ดึงรายการข้อความแชทภายในห้องสนทนา

- **Query Params:** `?conv_id=1` (ดึงจาก Conversation) หรือ `?reference_type=RFQ&reference_id=1` (ดึงจากเอกสารอ้างอิง)

### `POST /messages`

ส่งข้อความแชทใหม่ (รองรับการแนบแพ็คเกจใบเสนอราคาเข้าแชท)

```json
{
  "reference_type": "RFQ",
  "reference_id": "1",
  "receiver_id": 2,
  "content": "ให้ทำบล็อกไหมครับ?",
  "conv_id": 1,
  "message_type": "TX", 
  "quote_data": null
}
```

*(ประเภท `message_type` สามารถเป็น `TX` (แชทปกติ) หรือ `QT` (ใบเสนอราคาทางการ) ได้ หากเป็นตีราคา ให้ใส่ JSON String ไว้ในฟิลด์ `quote_data`)*

---

## 6. Notifications Endpoints

*(จำเป็นต้องมีการแนบ Authentication Header)*

### `GET /notifications`

ดึงรายการแจ้งเตือนทั้งหมดของผู้ใช้งานปัจจุบัน

### `PATCH /notifications/:noti_id/read`

อัปเดตสถานะของแจ้งเตือนให้เป็น อ่านแล้ว (Is Read)

---

## 7. Showcases Endpoints

### `GET /showcases`

ดึงรายการ Showcases ทั้งหมดของระบบ (ผลงาน, สินค้า, ไอเดีย)

- **Query Params (ประเภท):** `?type=PD` (Product), `?type=PM` (Promotion), `?type=ID` (Idea)

### `POST /showcases`

*(จำเป็นต้องมีการแนบ Authentication Header และเป็น Account ฝั่งโรงงาน)*
สร้างผลงานโชว์เคสใหม่บนโปรไฟล์โรงงาน

```json
{
  "content_type": "PD",
  "title": "กล่องกระดาษคราฟต์ รักษ์โลก",
  "excerpt": "ใส่กล่องอาหาร พร้อมพิมพ์โลโก้",
  "image_url": "http://SERVER_URL/img.jpg",
  "category_id": 1,
  "min_order": 1000,
  "lead_time_days": 14
}
```

---

## 8. Promo Slides Endpoints

### `GET /promo-slides`

ดึงแบนเนอร์หรือสไลด์โปรโมชันที่ Active เพื่อไปแสดงบน Carousel โฆษณาหน้าแรก

---

## 9. Favorites Endpoints

*(จำเป็นต้องมีการแนบ Authentication Header)*

### `GET /favorites`

ดึงรายการผลงานโชว์เคสที่ผู้ใช้ปัจจุบันกด Favorite / Like เอาไว้

### `POST /favorites`

กดถูกใจผลงานโชว์เคส (Like)

```json
{
  "showcase_id": 1
}
```

### `DELETE /favorites/:showcase_id`

กดยกเลิกการถูกใจผลงานโชว์เคส (Unlike)