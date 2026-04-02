-- ============================================================
-- Seed data for Explore page — ย้ายจาก frontend mock → ฐานข้อมูลจริง
-- Run: psql -d wemake -f seed-explore-data.sql
-- ============================================================

-- ─── 1. Promo Slides (carousel ส่วนลด) ──────────────────────
INSERT INTO promo_slides (slide_id, title, subtitle, code, image_url, status)
VALUES
  (1, 'ลด 15% ค่าผลิตครั้งแรก',  'ใช้โค้ดนี้เมื่อสร้าง RFQ ใหม่ หมดเขต 31 มี.ค. 2026',        'FIRST15',  '', '1'),
  (2, 'ส่วนลด 500 บาท',           'เมื่อสั่งซื้อขั้นต่ำ 5,000 บาท หมดเขต 30 เม.ย. 2026',       'PET500',   '', '1'),
  (3, 'ฟรีค่าจัดส่ง',              'ออเดอร์แรกเท่านั้น หมดเขต 15 พ.ค. 2026',                     'FREESHIP', '', '1')
ON CONFLICT (slide_id) DO UPDATE SET
  title    = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  code     = EXCLUDED.code,
  status   = EXCLUDED.status;

-- ─── 2. Promo Codes (โค้ดส่วนลด) ────────────────────────────
INSERT INTO promo_codes (id, title, subtitle, code, valid_until)
VALUES
  (1, 'ลด 15% ค่าผลิตครั้งแรก',  'ใช้โค้ดนี้เมื่อสร้าง RFQ ใหม่',                'FIRST15',  '2026-03-31'),
  (2, 'ส่วนลด 500 บาท',           'เมื่อสั่งซื้อขั้นต่ำ 5,000 บาท',              'PET500',   '2026-04-30'),
  (3, 'ฟรีค่าจัดส่ง',              'ออเดอร์แรกเท่านั้น',                          'FREESHIP', '2026-05-15')
ON CONFLICT (id) DO UPDATE SET
  title      = EXCLUDED.title,
  subtitle   = EXCLUDED.subtitle,
  code       = EXCLUDED.code,
  valid_until = EXCLUDED.valid_until;

-- ─── 3. Factory Showcases (สินค้า / โปรโมชัน / ไอเดีย) ──────
-- content_type: PR = product, PM = promotion, ID = idea
-- category_id อ้างอิง lbi_product_categories
--   1=อาหารสัตว์เลี้ยง, 2=อาหารเสริม, 3=ของเล่น, 4=เสื้อผ้า, 6=แพ็คเกจจิ้ง
--   (สายจูง อุปกรณ์ สมมติ category_id = 5)

INSERT INTO factory_showcases
  (showcase_id, factory_id, content_type, title, excerpt, image_url, category_id, min_order, lead_time_days, likes_count, created_at)
VALUES
  -- show1: product — อาหารสัตว์ (cat 1)
  (1, 1, 'PR',
   'อาหารเม็ดสูตร Grain-Free สำหรับแบรนด์ใหม่',
   'รับผลิต OEM พร้อมช่วยปรับสูตร เริ่ม MOQ 500 ถุง เหมาะสำหรับเริ่มทำแบรนด์',
   'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&h=300&fit=crop',
   1, 500, 10, 124, '2026-02-28'),

  -- show2: promotion — เสื้อผ้า (cat 4)
  (2, 2, 'PM',
   'โปรฯ เปิดตัวคอลเลกชัน Summer Pet Wear ลด 12%',
   'รับผลิตครบแพตเทิร์น เสื้อทีมสัตว์เลี้ยงพร้อมปักโลโก้ หมดเขต 31 มี.ค.',
   'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=300&fit=crop',
   4, 100, 7, 98, '2026-02-27'),

  -- show3: idea — ของเล่น (cat 3)
  (3, 3, 'ID',
   'ไอเดียชุดของเล่นยางธรรมชาติขายหน้าร้อน',
   'รวม 3 แบบขายดี: เชือกกัด, บอลยาง, แท่งขัดฟัน พร้อมแนะนำต้นทุนต่อชิ้น',
   'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500&h=300&fit=crop',
   3, 200, 14, 210, '2026-02-26'),

  -- show4: promotion — แพ็คเกจจิ้ง (cat 6)
  (4, 4, 'PM',
   'โปรแพ็กเกจจิ้งซองสแตนดี้ เริ่มต้น 300 ชิ้น',
   'ฟรีปรับไฟล์พิมพ์ 1 รอบ เหมาะสำหรับอาหารเสริมสัตว์เลี้ยงและขนมขบเคี้ยว',
   'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=300&fit=crop',
   6, 300, 12, 76, '2026-02-24'),

  -- show5: idea — อาหารสัตว์ (cat 1)
  (5, 1, 'ID',
   'ไอเดียทำขนม Freeze-dried สำหรับตลาดพรีเมียม',
   'แนะนำวัตถุดิบและแพ็กที่เหมาะกับช่องทางออนไลน์ พร้อมตัวอย่างราคา',
   'https://images.unsplash.com/photo-1579784340946-55a7bbd51d57?w=500&h=300&fit=crop',
   1, 500, 10, 167, '2026-02-22'),

  -- show6: product — เสื้อผ้า (cat 4)
  (6, 2, 'PR',
   'รับผลิตเสื้อกันฝนสุนัขแบบสะท้อนแสง',
   'วัสดุกันน้ำพร้อมแถบสะท้อนแสง เหมาะกับแบรนด์สาย Outdoor',
   'https://images.unsplash.com/photo-1684259499086-93cb3e555803?w=500&h=300&fit=crop',
   4, 150, 8, 88, '2026-02-20'),

  -- show7: product — อาหารเสริม (cat 2)
  (7, 5, 'PR',
   'วิตามินเคี้ยวสำหรับสุนัขสูตร Skin & Coat',
   'สูตรยอดนิยมช่วยเรื่องขนเงาและลดขนร่วง รองรับทำแบรนด์แบบ OEM',
   'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&h=300&fit=crop',
   2, 400, 12, 132, '2026-02-19'),

  -- show8: promotion — อาหารเสริม (cat 2)
  (8, 5, 'PM',
   'โปรเปิดไลน์ผลิตใหม่ รับส่วนลดค่า Setup 20%',
   'สำหรับลูกค้าใหม่ที่เริ่มผลิตอาหารเสริมสัตว์เลี้ยงภายในเดือนนี้',
   'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&h=300&fit=crop',
   2, 350, 14, 91, '2026-02-17'),

  -- show9: product — สายจูง อุปกรณ์ (cat 5)
  (9, 6, 'PR',
   'ปลอกคอ GPS + Activity Tracker สำหรับแบรนด์ Pet Tech',
   'รองรับ Bluetooth และแอป White-label เหมาะกับตลาดพรีเมียม',
   'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=500&h=300&fit=crop',
   5, 80, 20, 115, '2026-02-16'),

  -- show10: idea — สายจูง อุปกรณ์ (cat 5)
  (10, 6, 'ID',
   'ไอเดียขายชุดปลอกคออัจฉริยะ + แอปสมาชิก',
   'เพิ่ม recurring revenue ด้วยค่าสมาชิกแอปติดตามสุขภาพสัตว์เลี้ยง',
   'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&h=300&fit=crop',
   5, 100, 21, 173, '2026-02-15'),

  -- show11: promotion — ของเล่น (cat 3)
  (11, 3, 'PM',
   'โปรเซ็ตของเล่นฝึกพฤติกรรม ลด 10% สำหรับล็อตแรก',
   'เหมาะกับร้านออนไลน์ที่ต้องการชุดสินค้าหลากหลาย เริ่มได้ที่ MOQ 200',
   'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=500&h=300&fit=crop',
   3, 200, 12, 102, '2026-02-13'),

  -- show12: idea — แพ็คเกจจิ้ง (cat 6)
  (12, 4, 'ID',
   'ไอเดียรีแบรนด์แพ็กเกจให้ดูพรีเมียมแต่คุมต้นทุน',
   'ตัวอย่างโทนสีและวัสดุที่ช่วยเพิ่ม perceived value สำหรับแบรนด์ใหม่',
   'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=500&h=300&fit=crop',
   6, 500, 12, 145, '2026-02-12')

ON CONFLICT (showcase_id) DO UPDATE SET
  factory_id     = EXCLUDED.factory_id,
  content_type   = EXCLUDED.content_type,
  title          = EXCLUDED.title,
  excerpt        = EXCLUDED.excerpt,
  image_url      = EXCLUDED.image_url,
  category_id    = EXCLUDED.category_id,
  min_order      = EXCLUDED.min_order,
  lead_time_days = EXCLUDED.lead_time_days,
  likes_count    = EXCLUDED.likes_count;

-- ─── 4. Showcase Tags (M:N) ─────────────────────────────────
-- ถ้ายังไม่มีตาราง tags สามารถ skip ส่วนนี้ได้ หรือ run เฉพาะเมื่อตาราง tags พร้อม
-- INSERT INTO map_showcase_tags (showcase_id, tag_id) VALUES ...;
-- (Skip for now — tags สามารถเพิ่มทีหลังได้)

-- ─── 5. Products (frontend content table) ────────────────────
-- ข้อมูลเดียวกับ factory_showcases content_type = PR แต่อยู่ในรูปแบบ products table
INSERT INTO products (id, title, price, image_url, discount, factory_id, category_id)
VALUES
  (1, 'อาหารเม็ดสูตร Grain-Free สำหรับแบรนด์ใหม่',          'MOQ 500',   'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&h=300&fit=crop', NULL,     1, 1),
  (2, 'รับผลิตเสื้อกันฝนสุนัขแบบสะท้อนแสง',                 'MOQ 150',   'https://images.unsplash.com/photo-1684259499086-93cb3e555803?w=500&h=300&fit=crop', NULL,     2, 4),
  (3, 'วิตามินเคี้ยวสำหรับสุนัขสูตร Skin & Coat',            'MOQ 400',   'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&h=300&fit=crop', NULL,     5, 2),
  (4, 'ปลอกคอ GPS + Activity Tracker สำหรับแบรนด์ Pet Tech', 'MOQ 80',    'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=500&h=300&fit=crop', NULL,     6, 5),
  (5, 'ชุดของเล่นยางธรรมชาติ 3 แบบขายดี',                    'MOQ 200',   'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500&h=300&fit=crop', '-10%',   3, 3),
  (6, 'ขนม Freeze-dried สำหรับตลาดพรีเมียม',                'MOQ 500',   'https://images.unsplash.com/photo-1579784340946-55a7bbd51d57?w=500&h=300&fit=crop', NULL,     1, 1),
  (7, 'ซองสแตนดี้สำหรับอาหารเสริมสัตว์เลี้ยง',               'MOQ 300',   'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=300&fit=crop', NULL,     4, 6),
  (8, 'เสื้อทีมสัตว์เลี้ยงพร้อมปักโลโก้',                     'MOQ 100',   'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=300&fit=crop', '-12%',   2, 4)
ON CONFLICT (id) DO UPDATE SET
  title      = EXCLUDED.title,
  price      = EXCLUDED.price,
  image_url  = EXCLUDED.image_url,
  discount   = EXCLUDED.discount,
  factory_id = EXCLUDED.factory_id,
  category_id = EXCLUDED.category_id;

-- ─── 6. Promotions (frontend content table) ──────────────────
INSERT INTO promotions (id, title, description, price, image_url, tag, factory_id)
VALUES
  (1, 'โปรฯ เปิดตัวคอลเลกชัน Summer Pet Wear ลด 12%',
      'รับผลิตครบแพตเทิร์น เสื้อทีมสัตว์เลี้ยงพร้อมปักโลโก้ หมดเขต 31 มี.ค.',
      'MOQ 100', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=300&fit=crop', 'ส่วนลด', 2),
  (2, 'โปรแพ็กเกจจิ้งซองสแตนดี้ เริ่มต้น 300 ชิ้น',
      'ฟรีปรับไฟล์พิมพ์ 1 รอบ เหมาะสำหรับอาหารเสริมสัตว์เลี้ยงและขนมขบเคี้ยว',
      'MOQ 300', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=300&fit=crop', 'ฟรี', 4),
  (3, 'โปรเปิดไลน์ผลิตใหม่ รับส่วนลดค่า Setup 20%',
      'สำหรับลูกค้าใหม่ที่เริ่มผลิตอาหารเสริมสัตว์เลี้ยงภายในเดือนนี้',
      'MOQ 350', 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&h=300&fit=crop', 'ส่วนลด', 5),
  (4, 'โปรเซ็ตของเล่นฝึกพฤติกรรม ลด 10% สำหรับล็อตแรก',
      'เหมาะกับร้านออนไลน์ที่ต้องการชุดสินค้าหลากหลาย เริ่มได้ที่ MOQ 200',
      'MOQ 200', 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=500&h=300&fit=crop', 'ส่วนลด', 3)
ON CONFLICT (id) DO UPDATE SET
  title       = EXCLUDED.title,
  description = EXCLUDED.description,
  price       = EXCLUDED.price,
  image_url   = EXCLUDED.image_url,
  tag         = EXCLUDED.tag,
  factory_id  = EXCLUDED.factory_id;

-- ============================================================
-- เมื่อ run SQL นี้แล้ว frontend จะดึงข้อมูลจาก API โดยตรง:
--   GET /promo-slides       → promo_slides
--   GET /frontend/promo-codes → promo_codes
--   GET /showcases           → factory_showcases
--   GET /frontend/explore    → aggregated (products + promotions + factories + idea_articles + categories)
-- ============================================================
