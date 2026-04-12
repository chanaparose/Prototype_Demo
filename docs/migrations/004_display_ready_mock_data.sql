-- =====================================================================
-- 004_display_ready_mock_data.sql
-- PostgreSQL — WeMake Platform
-- Purpose:
--   Display-Ready Mock Data สำหรับ Explore Feed + Factory Profile Demo
--   4 โรงงานสัตว์เลี้ยง:
--     1) PawFresh Premium — Premium Pet Food & Treats
--     2) PetPlay Innovation — Pet Toys & Gadgets
--     3) PetNest Craft — Pet Furniture / Condos
--     4) PackPet Solutions — Pet Product Packaging
--
-- Prerequisite: Master data จาก 002_reset_and_seed_master.sql ต้องมีอยู่แล้ว
-- DB Migration: 003 เสร็จแล้ว (map_factory_tags → map_factory_categories,
--               map_showcase_tags → map_showcase_categories, lbi_tags DROPPED)
--
-- ⚠️  หมายเหตุ: ตาราง map_factory_tags และ map_showcase_tags ถูก RENAME
--     เป็น map_factory_categories และ map_showcase_categories ตาม Migration 003
--     Script นี้ใช้ชื่อใหม่ถูกต้องแล้ว
--
-- Date: 11 เมษายน 2026
-- =====================================================================

BEGIN;

-- =====================================================================
-- SECTION A — TRUNCATE DEMO DATA (เก็บ Master Data ไว้)
-- =====================================================================
-- ลบเฉพาะข้อมูล demo — ไม่แตะตาราง master (categories, lbi_*)

TRUNCATE TABLE
  -- Level 0: ไม่มี FK ขาเข้า
  production_updates,
  transactions,
  factory_reviews,
  favorites,
  notifications,
  password_reset_tokens,
  rfq_images,
  messages,
  map_factory_categories,
  map_factory_sub_categories,
  map_factory_certificates,
  map_showcase_categories,

  -- Level 1
  production_steps,
  conversations,
  orders,
  promo_slides,

  -- Level 2
  quotations,
  factory_showcases,

  -- Level 3
  rfqs,
  wallets,
  addresses,

  -- Level 4
  customers,
  factory_profiles,

  -- Level 5: root
  users
RESTART IDENTITY CASCADE;


-- =====================================================================
-- SECTION B — USERS
-- =====================================================================
-- password_hash = bcrypt("password123") — demo only
-- 4 Factories (user_id 2-5) + 12 Customers (user_id 1, 6-16)

INSERT INTO users (role, email, phone, password_hash, is_active) VALUES
  -- Main customer
  ('CT', 'customer@wemake.com',      '0917052627', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 1

  -- 4 Factories
  ('FT', 'pawfresh@factory.com',     '0811111111', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 2
  ('FT', 'petplay@factory.com',      '0822222222', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 3
  ('FT', 'petnest@factory.com',      '0833333333', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 4
  ('FT', 'packpet@factory.com',      '0844444444', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 5

  -- 11 Additional customers (for diverse reviews)
  ('CT', 'somchai@gmail.com',        '0855555555', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 6
  ('CT', 'wichai@gmail.com',         '0866666666', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 7
  ('CT', 'nantana@gmail.com',        '0877777777', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 8
  ('CT', 'prapas@gmail.com',         '0888888888', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 9
  ('CT', 'thanita@gmail.com',        '0899999999', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 10
  ('CT', 'kitti@gmail.com',          '0900000001', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 11
  ('CT', 'pimjai@gmail.com',         '0900000002', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 12
  ('CT', 'arnon@gmail.com',          '0900000003', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 13
  ('CT', 'rujira@gmail.com',         '0900000004', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 14
  ('CT', 'tanya@gmail.com',          '0900000005', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),   -- 15
  ('CT', 'sutin@gmail.com',          '0900000006', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true);   -- 16


-- =====================================================================
-- SECTION C — CUSTOMERS
-- =====================================================================

INSERT INTO customers (user_id, first_name, last_name) VALUES
  (1,  'ปิยะ',     'วงศ์สุข'),
  (6,  'สมชาย',    'มั่งมี'),
  (7,  'วิชัย',    'สุขใจ'),
  (8,  'นันทนา',   'ดีจริง'),
  (9,  'ประภาส',   'เจริญกิจ'),
  (10, 'ธนิตา',    'มีสุข'),
  (11, 'กิตติ',    'ทองดี'),
  (12, 'พิมพ์ใจ',  'สว่างจิต'),
  (13, 'อานนท์',   'ก้าวหน้า'),
  (14, 'รุจิรา',   'งามวงศ์'),
  (15, 'ธัญญา',    'พัฒนา'),
  (16, 'สุทิน',    'มั่นคง');


-- =====================================================================
-- SECTION D — FACTORY PROFILES
-- =====================================================================
-- factory_type_id ref: 1=โรงพิมพ์บรรจุภัณฑ์, 2=อาหารสัตว์, 8=เฟอร์นิเจอร์, 9=ของเล่น
-- province_id ref: 1=กรุงเทพฯ, 5=สมุทรปราการ, 7=ปทุมธานี

INSERT INTO factory_profiles (
  user_id, factory_name, factory_type_id, tax_id,
  specialization, min_order, lead_time_desc, is_verified,
  rating, review_count, completed_orders,
  description, price_range, image_url, province_id
) VALUES
  -- Factory 1: PawFresh Premium — Premium Pet Food & Treats
  (2, 'PawFresh Premium', 2, '0105569000101',
   'ผลิตอาหารสัตว์เลี้ยงพรีเมียม OEM/ODM อาหารเม็ด ขนมสุนัข ขนมแมว',
   1000, '14-21 วัน', true,
   4.83, 12, 45,
   'โรงงานผลิตอาหารสัตว์เลี้ยงพรีเมียมมาตรฐาน GMP/HACCP ผ่าน อย. รับผลิต OEM/ODM อาหารสุนัข อาหารแมว ขนมสัตว์เลี้ยง ทั้งแบบเม็ด แบบเปียก และ Freeze-Dried ทีม R&D พัฒนาสูตรเฉพาะให้ทุกแบรนด์',
   '15-120 บาท/กก.',
   'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400',
   5),   -- สมุทรปราการ

  -- Factory 2: PetPlay Innovation — Pet Toys & Gadgets
  (3, 'PetPlay Innovation', 9, '0105569000202',
   'ออกแบบและผลิตของเล่นสัตว์เลี้ยง ของเล่นฝึกทักษะ อุปกรณ์เสริมพัฒนาการ',
   300, '10-14 วัน', true,
   4.63, 8, 28,
   'โรงงานออกแบบและผลิตของเล่นสัตว์เลี้ยงครบวงจร ตั้งแต่ Interactive Puzzle Toys, ของเล่นเชือกถัก, อุปกรณ์ฝึกทักษะ ไปจนถึง Smart Pet Gadgets มีทีมดีไซเนอร์ และ 3D Printer สำหรับทำ Prototype',
   '25-350 บาท/ชิ้น',
   'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400',
   7),   -- ปทุมธานี

  -- Factory 3: PetNest Craft — Pet Furniture / Condos
  (4, 'PetNest Craft', 8, '0105569000303',
   'ออกแบบและผลิตเฟอร์นิเจอร์สัตว์เลี้ยง คอนโดแมว ที่นอนสุนัข บ้านสัตว์เลี้ยง',
   30, '14-30 วัน', true,
   4.70, 10, 35,
   'โรงงานเฟอร์นิเจอร์สัตว์เลี้ยงดีไซน์สไตล์มินิมอล ใช้ไม้ยางพาราแท้ วัสดุรักษ์โลก ผลิตคอนโดแมว ที่นอนสุนัข เบาะ Memory Foam บ้านสัตว์เลี้ยง และกรงพับได้ ทุกชิ้นออกแบบให้กลมกลืนกับการตกแต่งบ้าน',
   '150-3,500 บาท/ชิ้น',
   'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400',
   1),   -- กรุงเทพฯ

  -- Factory 4: PackPet Solutions — Pet Product Packaging
  (5, 'PackPet Solutions', 1, '0105569000404',
   'ออกแบบและผลิตบรรจุภัณฑ์สินค้าสัตว์เลี้ยง ถุง ซอง กล่อง ฉลาก',
   500, '7-14 วัน', true,
   4.50, 6, 52,
   'โรงงานผลิตบรรจุภัณฑ์เฉพาะทางสำหรับสินค้าสัตว์เลี้ยง ซองฟอยล์ซิปล็อค ถุง Kraft กล่องกระดาษ Premium ฉลากกันน้ำ และสติกเกอร์ทุกชนิด พิมพ์ออฟเซ็ท/ดิจิทัล ออกแบบกราฟิกให้ฟรี',
   '0.50-25 บาท/ชิ้น',
   'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
   5);   -- สมุทรปราการ


-- =====================================================================
-- SECTION E — WALLETS
-- =====================================================================

INSERT INTO wallets (user_id, good_fund, pending_fund) VALUES
  (1,  0, 0),       -- Customer 1
  (2,  45000, 8500), -- PawFresh
  (3,  18000, 4200), -- PetPlay
  (4,  32000, 6800), -- PetNest
  (5,  56000, 3500), -- PackPet
  (6,  0, 0), (7,  0, 0), (8,  0, 0), (9,  0, 0), (10, 0, 0),
  (11, 0, 0), (12, 0, 0), (13, 0, 0), (14, 0, 0), (15, 0, 0), (16, 0, 0);


-- =====================================================================
-- SECTION F — ADDRESSES
-- =====================================================================
-- address_type CHECK: 'C' = Contact, 'M' = Manufacturing
-- district/sub_district refs from 002 seed:
--   dist 3=จตุจักร(กทม), 7=เมืองสมุทรปราการ, 8=บางพลี, 11=เมืองปทุมธานี
--   sub_dist 5=ลาดยาว, 7=ปากน้ำ, 9=บางพลีใหญ่, 11=บางปรอก

INSERT INTO addresses (user_id, address_type, address_detail, sub_district_id, district_id, province_id, zip_code, is_default) VALUES
  -- Customer main address
  (1, 'C', '99/5 ซอยสุขุมวิท 39 คลองเตยเหนือ วัฒนา',     5, 3, 1, '10110', true),

  -- Factory addresses (Manufacturing)
  (2, 'M', '168/9 หมู่ 4 นิคมอุตสาหกรรมบางพลี ซ.6',        9, 8, 5, '10540', true),
  (3, 'M', '55/12 หมู่ 2 ถ.รังสิต-นครนายก ต.บางปรอก',      11,11, 7, '12000', true),
  (4, 'M', '88 ซ.วิภาวดีรังสิต 25 แขวงจตุจักร',             5, 3, 1, '10900', true),
  (5, 'M', '222/1 ถ.สุขสวัสดิ์ ต.ปากน้ำ',                   7, 7, 5, '10270', true);


-- =====================================================================
-- SECTION G — MAP_FACTORY_CATEGORIES
-- =====================================================================
-- หมวดที่โรงงานรับผลิต (ใช้สำหรับ RFQ matching + Explore filter)
-- ⚠️ ตารางนี้เดิมชื่อ map_factory_tags → RENAME เป็น map_factory_categories (Migration 003)
--
-- categories ref:
--   1=อาหารสัตว์, 2=อาหารเสริม, 3=ของเล่นสัตว์เลี้ยง, 4=ที่นอนและบ้าน,
--   5=กระเป๋าและรถเข็น, 6=บรรจุภัณฑ์, 10=ตู้ปลาและกรง,
--   11=ขนมสัตว์เลี้ยง, 13=อุปกรณ์สัตว์เลี้ยง

INSERT INTO map_factory_categories (factory_id, category_id) VALUES
  -- PawFresh Premium: อาหารสัตว์ + ขนมสัตว์เลี้ยง + อาหารเสริม
  (2, 1),   -- อาหารสัตว์
  (2, 11),  -- ขนมสัตว์เลี้ยง
  (2, 2),   -- อาหารเสริม

  -- PetPlay Innovation: ของเล่นสัตว์เลี้ยง + อุปกรณ์สัตว์เลี้ยง
  (3, 3),   -- ของเล่นสัตว์เลี้ยง
  (3, 13),  -- อุปกรณ์สัตว์เลี้ยง

  -- PetNest Craft: ที่นอนและบ้าน + ตู้ปลาและกรง
  (4, 4),   -- ที่นอนและบ้าน
  (4, 10),  -- ตู้ปลาและกรง

  -- PackPet Solutions: บรรจุภัณฑ์
  (5, 6);   -- บรรจุภัณฑ์


-- =====================================================================
-- SECTION H — MAP_FACTORY_SUB_CATEGORIES
-- =====================================================================
-- ความเชี่ยวชาญย่อย — composite PK (factory_id, sub_category_id)
--
-- sub_category_id ref (จาก INSERT order ใน 002):
--   cat=1:  1=อาหารสุนัข, 2=อาหารแมว, 3=อาหารนก/สัตว์เล็ก, 4=อาหารสัตว์ทุกชนิด
--   cat=2:  5=อาหารเสริมสุนัข, 6=อาหารเสริมแมว
--   cat=3:  8=ของเล่นสุนัข, 9=ของเล่นแมว, 10=ของเล่นสัตว์ทุกชนิด
--   cat=4:  11=ที่นอนสุนัข, 12=ที่นอนแมว, 13=บ้านสัตว์เลี้ยง
--   cat=6:  19=ถุง/Pouch, 20=กล่องกระดาษ, 21=ขวด/กระป๋อง, 22=ฉลาก/สติกเกอร์
--   cat=10: 39=ตู้ปลา, 41=กรงสัตว์เลี้ยง
--   cat=11: 43=ขนมสุนัข, 44=ขนมแมว
--   cat=13: 49=สายจูง/ปลอกคอ, 50=ชามอาหาร/น้ำ, 51=แปรงขน/อุปกรณ์กรูมมิ่ง

INSERT INTO map_factory_sub_categories (factory_id, sub_category_id) VALUES
  -- PawFresh Premium
  (2, 1),   -- อาหารสุนัข
  (2, 2),   -- อาหารแมว
  (2, 43),  -- ขนมสุนัข
  (2, 44),  -- ขนมแมว
  (2, 5),   -- อาหารเสริมสุนัข
  (2, 6),   -- อาหารเสริมแมว

  -- PetPlay Innovation
  (3, 8),   -- ของเล่นสุนัข
  (3, 9),   -- ของเล่นแมว
  (3, 10),  -- ของเล่นสัตว์ทุกชนิด
  (3, 49),  -- สายจูง/ปลอกคอ
  (3, 50),  -- ชามอาหาร/น้ำ
  (3, 51),  -- แปรงขน/อุปกรณ์กรูมมิ่ง

  -- PetNest Craft
  (4, 11),  -- ที่นอนสุนัข
  (4, 12),  -- ที่นอนแมว
  (4, 13),  -- บ้านสัตว์เลี้ยง
  (4, 41),  -- กรงสัตว์เลี้ยง

  -- PackPet Solutions
  (5, 19),  -- ถุง/Pouch
  (5, 20),  -- กล่องกระดาษ
  (5, 21),  -- ขวด/กระป๋อง
  (5, 22);  -- ฉลาก/สติกเกอร์


-- =====================================================================
-- SECTION I — MAP_FACTORY_CERTIFICATES
-- =====================================================================
-- cert_id ref: 1=ISO 9001, 2=GMP, 3=HACCP, 4=อย., 5=HALAL,
--              6=ISO 22716, 7=มอก., 8=ISO 14001, 9=ISO 22000, 10=BRC

INSERT INTO map_factory_certificates (factory_id, cert_id, verify_status, uploaded_at) VALUES
  -- PawFresh Premium: GMP, HACCP, อย., ISO 22000
  (2, 2, 'AP', '2025-06-15'),  -- GMP
  (2, 3, 'AP', '2025-06-15'),  -- HACCP
  (2, 4, 'AP', '2025-07-01'),  -- อย.
  (2, 9, 'AP', '2025-08-10'),  -- ISO 22000

  -- PetPlay Innovation: ISO 9001, มอก.
  (3, 1, 'AP', '2025-05-20'),  -- ISO 9001
  (3, 7, 'AP', '2025-09-01'),  -- มอก.

  -- PetNest Craft: ISO 9001, ISO 14001, มอก.
  (4, 1, 'AP', '2025-04-10'),  -- ISO 9001
  (4, 8, 'AP', '2025-04-10'),  -- ISO 14001
  (4, 7, 'AP', '2025-06-20'),  -- มอก.

  -- PackPet Solutions: ISO 9001, ISO 14001, BRC
  (5, 1, 'AP', '2025-03-15'),  -- ISO 9001
  (5, 8, 'AP', '2025-03-15'),  -- ISO 14001
  (5,10, 'AP', '2025-05-01');  -- BRC


-- =====================================================================
-- SECTION J — FACTORY SHOWCASES
-- =====================================================================
-- content_type: 'ID' = Idea, 'PD' = Product, 'PM' = Promotion
-- category_id + sub_category_id ใช้ตาม ref ข้างบน
-- likes_count = denormalized count สำหรับ display

-- ─────────────────────────────────────────────────────────────────────
-- J.1 PawFresh Premium (factory_id = 2) — 7 showcases
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO factory_showcases (
  factory_id, content_type, title, excerpt, image_url,
  category_id, sub_category_id, min_order, lead_time_days, likes_count, created_at
) VALUES
  -- PD 1: อาหารสุนัขพรีเมียม
  (2, 'PD', 'อาหารสุนัขพรีเมียม สูตรเนื้อแกะและข้าวกล้อง',
   'อาหารเม็ดสุนัขโต สูตร Holistic โปรตีน 28% ไขมัน 15% ไม่เติมสี ไม่ใส่สารกันเสีย เสริม Omega 3-6 บำรุงขนและผิวหนัง เหมาะสำหรับสุนัขทุกสายพันธุ์',
   'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
   1, 1, 1000, 14, 156,
   '2026-01-15 09:00:00'),

  -- PD 2: อาหารแมว Indoor
  (2, 'PD', 'อาหารแมว Indoor สูตรควบคุมน้ำหนัก',
   'อาหารเม็ดสำหรับแมวเลี้ยงในบ้าน สูตรแคลอรี่ต่ำ เสริมไฟเบอร์ช่วยขับก้อนขน โปรตีนจากปลาทะเล DHA บำรุงสมอง มาตรฐาน GMP',
   'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400',
   1, 2, 1000, 14, 128,
   '2026-01-20 10:30:00'),

  -- PD 3: ขนมสุนัข Jerky
  (2, 'PD', 'ขนมสุนัข Chicken Jerky อบแห้ง 100%',
   'ขนมสุนัขเนื้อไก่อบแห้งแท้ 100% ไม่ผสมแป้ง ไม่เติมเกลือ โปรตีนสูง 65% เหมาะสำหรับฝึกและให้รางวัล ผ่าน อย.',
   'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?w=400',
   11, 43, 500, 10, 89,
   '2026-02-01 11:00:00'),

  -- PD 4: ขนมแมว Freeze-Dried
  (2, 'PD', 'ขนมแมว Freeze-Dried กุ้งแม่น้ำ',
   'ขนมแมว Freeze-Dried จากกุ้งแม่น้ำแท้ คงคุณค่าสารอาหาร รสชาติเข้มข้น แมวชอบมาก เหมาะทุกวัย ไม่เติมสารปรุงแต่ง',
   'https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=400',
   11, 44, 500, 10, 74,
   '2026-02-10 14:00:00'),

  -- PD 5: อาหารสุนัข Grain-Free
  (2, 'PD', 'อาหารสุนัข Grain-Free สูตรปลาแซลมอนและมันหวาน',
   'สูตร Grain-Free สำหรับสุนัขที่แพ้ธัญพืช โปรตีนจากปลาแซลมอนแท้ เสริมกลูโคซามีนบำรุงข้อ เหมาะกับสุนัขทุกวัย ทุกสายพันธุ์',
   'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400',
   1, 1, 1500, 21, 203,
   '2026-02-20 09:30:00'),

  -- ID 6: เทรนด์อาหารสัตว์
  (2, 'ID', 'เทรนด์อาหารสัตว์ 2026: Superfood สำหรับสัตว์เลี้ยง',
   'สำรวจเทรนด์ล่าสุดในอุตสาหกรรมอาหารสัตว์เลี้ยง ตั้งแต่ Insect Protein, Functional Ingredients ไปจนถึง Personalized Nutrition ที่กำลังเปลี่ยนวงการอาหารสัตว์',
   'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400',
   1, NULL, 0, 0, 312,
   '2026-03-01 08:00:00'),

  -- PM 7: โปรโมชั่น OEM
  (2, 'PM', 'โปรฯ OEM อาหารสัตว์ สั่ง 5 ตัน ฟรีออกแบบซอง!',
   'สั่งผลิตอาหารสัตว์ OEM ตั้งแต่ 5,000 กก.ขึ้นไป ฟรี! ออกแบบบรรจุภัณฑ์ + ขึ้นทะเบียน อย. พร้อมทีม R&D พัฒนาสูตรเฉพาะแบรนด์คุณ',
   'https://images.unsplash.com/photo-1583337130417-13104dec14a3?w=400',
   1, NULL, 5000, 21, 67,
   '2026-03-15 10:00:00');


-- ─────────────────────────────────────────────────────────────────────
-- J.2 PetPlay Innovation (factory_id = 3) — 7 showcases
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO factory_showcases (
  factory_id, content_type, title, excerpt, image_url,
  category_id, sub_category_id, min_order, lead_time_days, likes_count, created_at
) VALUES
  -- PD 1: Puzzle Toy สุนัข
  (3, 'PD', 'ของเล่นฝึกทักษะสุนัข Interactive Puzzle Feeder',
   'ของเล่นฝึก IQ สุนัข 3 ระดับความยาก ซ่อนขนมในช่องต่างๆ ช่วยลดความเครียด ทำจากพลาสติก ABS ปลอดสาร BPA ทนทานต่อการกัดแทะ',
   'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400',
   3, 8, 300, 14, 187,
   '2026-01-10 09:00:00'),

  -- PD 2: ของเล่นแมว Laser Tower
  (3, 'PD', 'ของเล่นแมว Laser Tower อัตโนมัติ 360°',
   'เลเซอร์หมุนอัตโนมัติ 360 องศา ตั้งเวลาได้ 15/30/60 นาที ชาร์จ USB-C ช่วยให้แมวออกกำลังกายแม้เจ้าของไม่อยู่บ้าน',
   'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400',
   3, 9, 200, 10, 145,
   '2026-01-25 11:00:00'),

  -- PD 3: สายจูง LED
  (3, 'PD', 'สายจูงสุนัข Retractable พร้อมไฟ LED',
   'สายจูงยืดหดได้ 5 เมตร พร้อมไฟ LED 3 โหมด (กะพริบ/นิ่ง/ปิด) สำหรับพาเดินตอนกลางคืน ล็อคระยะได้ ด้ามจับ Ergonomic กันลื่น',
   'https://images.unsplash.com/photo-1601758124277-f0086d5ab253?w=400',
   13, 49, 500, 10, 98,
   '2026-02-05 10:00:00'),

  -- PD 4: ชามอาหาร Anti-Ant
  (3, 'PD', 'ชามอาหารสัตว์เลี้ยง Anti-Ant ยกสูง Ergonomic',
   'ชามอาหารสแตนเลส 2 ใบ ยกสูง 15° ลดอาการกรดไหลย้อน ฐานกันมด ซิลิโคนกันลื่น ถอดล้างง่าย มี 3 ขนาด S/M/L',
   'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400',
   13, 50, 300, 7, 112,
   '2026-02-15 13:00:00'),

  -- PD 5: ของเล่นเชือก
  (3, 'PD', 'ของเล่นสุนัข เชือกถัก Cotton Rope ชุด 5 ชิ้น',
   'เซ็ตของเล่นเชือกถัก 5 แบบ ทำจาก Cotton 100% ย้อมสีธรรมชาติ ปลอดภัย ช่วยทำความสะอาดฟัน ทนทานต่อการกัดแทะ เหมาะกับสุนัขทุกขนาด',
   'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400',
   3, 8, 500, 7, 76,
   '2026-02-28 09:00:00'),

  -- ID 6: เทรนด์ Smart Pet
  (3, 'ID', 'เทรนด์ Smart Pet 2026: IoT และ AI สำหรับสัตว์เลี้ยง',
   'พาส่องนวัตกรรมของเล่นสัตว์เลี้ยงยุคใหม่ ตั้งแต่กล้อง AI จดจำพฤติกรรม, Feeder อัตโนมัติ, Wearable Tracker ไปจนถึง Robot เล่นกับแมว ที่กำลังเติบโตอย่างรวดเร็ว',
   'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
   3, NULL, 0, 0, 234,
   '2026-03-10 08:00:00'),

  -- PM 7: โปรโมชั่น Puzzle Toy
  (3, 'PM', 'โปรฯ สั่งผลิต Puzzle Toy 500+ ชิ้น ลด 15%!',
   'โปรโมชั่นพิเศษ! สั่งผลิตของเล่นฝึกทักษะ Interactive Puzzle ตั้งแต่ 500 ชิ้นขึ้นไป ลดทันที 15% พร้อมออกแบบโลโก้แบรนด์บนชิ้นงานฟรี',
   'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
   3, NULL, 500, 14, 45,
   '2026-03-20 10:00:00');


-- ─────────────────────────────────────────────────────────────────────
-- J.3 PetNest Craft (factory_id = 4) — 7 showcases
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO factory_showcases (
  factory_id, content_type, title, excerpt, image_url,
  category_id, sub_category_id, min_order, lead_time_days, likes_count, created_at
) VALUES
  -- PD 1: คอนโดแมว 4 ชั้น
  (4, 'PD', 'คอนโดแมว 4 ชั้น ไม้ยางพารา Premium',
   'คอนโดแมว 4 ชั้น สูง 150 ซม. ไม้ยางพาราแท้ เสาลับเล็บเชือกปอ ห้องนอนบุผ้า Fleece ถอดซักได้ สไตล์ Scandinavian กลมกลืนกับทุกห้อง',
   'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400',
   4, 13, 30, 21, 267,
   '2026-01-08 09:00:00'),

  -- PD 2: เบาะ Memory Foam
  (4, 'PD', 'เบาะนอนสุนัข Memory Foam ทรง Donut',
   'เบาะนอนสุนัข Memory Foam หนา 10 ซม. ทรง Donut กอดได้ ช่วยลดความวิตกกังวล ปลอกผ้ากำมะหยี่ถอดซักได้ มีขอบสูงวางศีรษะ ผ่านมาตรฐาน มอก.',
   'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
   4, 11, 50, 14, 189,
   '2026-01-22 10:00:00'),

  -- PD 3: บ้านแมว Capsule
  (4, 'PD', 'บ้านแมว Capsule House สไตล์มินิมอล',
   'บ้านแมวทรง Capsule ไม้ยางพารา เคลือบสีขาวด้าน หน้าต่างกลมขอบมน เบาะผ้า Cotton ถอดซักได้ ดีไซน์เรียบหรู เหมาะกับการตกแต่งบ้าน',
   'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400',
   4, 13, 20, 21, 156,
   '2026-02-05 11:00:00'),

  -- PD 4: ที่นอนแมว Heated Bed
  (4, 'PD', 'ที่นอนแมว Heated Bed อุ่นสบายทุกฤดู',
   'ที่นอนแมวอุ่นไฟฟ้า ปรับอุณหภูมิ 3 ระดับ (25/30/35°C) ปิดอัตโนมัติ 8 ชม. ปลอกผ้ากันน้ำถอดซักได้ ประหยัดไฟ 15W ปลอดภัยมาตรฐาน มอก.',
   'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400',
   4, 12, 50, 14, 98,
   '2026-02-18 14:00:00'),

  -- PD 5: กรงพับได้
  (4, 'PD', 'กรงสัตว์เลี้ยง พับได้ พกพาสะดวก',
   'กรงเหล็กเคลือบ Epoxy กันสนิม พับแบนได้ มีถาดรองล้างง่าย ประตูล็อค 2 จุด มี 4 ขนาด S/M/L/XL เหมาะกับสุนัข แมว กระต่าย',
   'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
   10, 41, 100, 14, 87,
   '2026-03-01 09:30:00'),

  -- ID 6: ไอเดียแต่งบ้าน Pet-Friendly
  (4, 'ID', 'ไอเดียแต่งห้องสไตล์ Pet-Friendly 2026',
   'รวมไอเดียตกแต่งบ้านที่เป็นมิตรกับสัตว์เลี้ยง ตั้งแต่เฟอร์นิเจอร์ Dual-Purpose ที่มนุษย์ใช้ได้ สัตว์เลี้ยงก็ชอบ ไปจนถึงการจัดสรรพื้นที่ Play Zone ในคอนโด',
   'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400',
   4, NULL, 0, 0, 345,
   '2026-03-12 08:00:00'),

  -- PM 7: โปรโมชั่น คอนโดแมว
  (4, 'PM', 'โปรฯ สั่งคอนโดแมว 50+ ชุด แถมเบาะนอนฟรี!',
   'สั่งผลิตคอนโดแมวไม้ยางพารา ตั้งแต่ 50 ชุดขึ้นไป แถมเบาะนอน Memory Foam ทุกชุด! พร้อมบริการออกแบบสีและโลโก้แบรนด์ตามต้องการ',
   'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400',
   4, NULL, 50, 30, 56,
   '2026-03-25 10:00:00');


-- ─────────────────────────────────────────────────────────────────────
-- J.4 PackPet Solutions (factory_id = 5) — 7 showcases
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO factory_showcases (
  factory_id, content_type, title, excerpt, image_url,
  category_id, sub_category_id, min_order, lead_time_days, likes_count, created_at
) VALUES
  -- PD 1: ซองฟอยล์
  (5, 'PD', 'ซองฟอยล์ซิปล็อค Stand-Up สำหรับอาหารสัตว์',
   'ซองฟอยล์อลูมิเนียม ตั้งได้ ซิปล็อคเปิด-ปิดได้ กันความชื้น กันแสง เก็บความสดอาหารสัตว์ได้นาน พิมพ์ลายได้ถึง 10 สี Rotogravure',
   'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
   6, 19, 1000, 7, 134,
   '2026-01-12 09:00:00'),

  -- PD 2: กล่อง Premium
  (5, 'PD', 'กล่องกระดาษ Premium Gift Box สำหรับขนมสัตว์',
   'กล่องกระดาษแข็ง 350 แกรม พิมพ์ออฟเซ็ท 4 สี เคลือบ Soft-Touch ลามิเนต ปั๊มฟอยล์ทอง ดีไซน์หรูหรา เหมาะสำหรับขนมสัตว์เลี้ยง Gift Set',
   'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400',
   6, 20, 500, 10, 98,
   '2026-01-28 10:30:00'),

  -- PD 3: ขวด PET
  (5, 'PD', 'ขวด PET สำหรับแชมพูและครีมสัตว์เลี้ยง',
   'ขวดพลาสติก PET ใส เกรดอาหาร พร้อมฝา Pump/Flip-top ขนาด 250ml-1L สกรีนโลโก้ได้ ปลอดภัย BPA-Free ทนสารเคมีในผลิตภัณฑ์ดูแลสัตว์',
   'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
   6, 21, 1000, 10, 76,
   '2026-02-10 11:00:00'),

  -- PD 4: ฉลากกันน้ำ
  (5, 'PD', 'ฉลากสติกเกอร์กันน้ำ สำหรับผลิตภัณฑ์สัตว์เลี้ยง',
   'สติกเกอร์กันน้ำ PP/PE พิมพ์ดิจิทัล UV ทนแสงแดด ไม่ซีดจาง กาวแน่นไม่ลอก เหมาะกับผลิตภัณฑ์ที่ต้องสัมผัสน้ำ เช่น แชมพู น้ำยาทำความสะอาด',
   'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
   6, 22, 2000, 5, 67,
   '2026-02-22 09:00:00'),

  -- PD 5: ถุง Kraft
  (5, 'PD', 'ถุงกระดาษ Kraft รักษ์โลก สำหรับอาหารสัตว์',
   'ถุงกระดาษ Kraft เคลือบ PE ด้านใน กันความชื้น หน้าต่างใสดูสินค้าได้ ซิปล็อคเปิด-ปิด พิมพ์ Flexo 6 สี รองรับ 500g-5kg วัสดุ Recycle ได้',
   'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
   6, 19, 1000, 7, 89,
   '2026-03-05 10:00:00'),

  -- ID 6: เทรนด์ Eco-Friendly Packaging
  (5, 'ID', 'เทรนด์บรรจุภัณฑ์ Eco-Friendly สำหรับสินค้าสัตว์เลี้ยง',
   'สำรวจเทรนด์ Sustainable Packaging ในอุตสาหกรรมสัตว์เลี้ยง ตั้งแต่ Compostable Pouch, Mono-Material Design ไปจนถึง Refill Station ที่ผู้บริโภคยุคใหม่ให้ความสำคัญ',
   'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
   6, NULL, 0, 0, 198,
   '2026-03-15 08:00:00'),

  -- PM 7: โปรโมชั่น ซอง
  (5, 'PM', 'โปรฯ สั่งซองฟอยล์ 10,000+ ชิ้น ฟรีออกแบบกราฟิก!',
   'โปรโมชั่นพิเศษ! สั่งผลิตซองฟอยล์ตั้งแต่ 10,000 ชิ้นขึ้นไป ฟรี! ออกแบบกราฟิกโดยทีมดีไซเนอร์มืออาชีพ + ทำ Proof สี 1 รอบ + จัดส่งฟรีในเขต กทม.-ปริมณฑล',
   'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
   6, NULL, 10000, 14, 34,
   '2026-03-28 10:00:00');


-- =====================================================================
-- SECTION K — MAP_SHOWCASE_CATEGORIES (Multi-category mapping)
-- =====================================================================
-- ⚠️ ตารางนี้เดิมชื่อ map_showcase_tags → RENAME เป็น map_showcase_categories (Migration 003)
-- showcase_id ตรงกับลำดับ INSERT ข้างบน (BIGSERIAL เริ่มที่ 1)
--
-- Showcase IDs:
--   PawFresh:  1-7  (factory_id=2)
--   PetPlay:   8-14 (factory_id=3)
--   PetNest:   15-21 (factory_id=4)
--   PackPet:   22-28 (factory_id=5)

INSERT INTO map_showcase_categories (showcase_id, category_id) VALUES
  -- PawFresh showcases → primary + secondary categories
  (1, 1),   -- อาหารสุนัข → อาหารสัตว์
  (1, 2),   -- อาหารสุนัข → อาหารเสริม (มี Omega)
  (2, 1),   -- อาหารแมว → อาหารสัตว์
  (3, 11),  -- ขนมสุนัข → ขนมสัตว์เลี้ยง
  (3, 1),   -- ขนมสุนัข → อาหารสัตว์
  (4, 11),  -- ขนมแมว → ขนมสัตว์เลี้ยง
  (5, 1),   -- อาหารสุนัข Grain-Free → อาหารสัตว์
  (6, 1),   -- เทรนด์ → อาหารสัตว์
  (6, 2),   -- เทรนด์ → อาหารเสริม
  (7, 1),   -- โปรโมชั่น OEM → อาหารสัตว์

  -- PetPlay showcases
  (8, 3),   -- Puzzle Toy → ของเล่นสัตว์เลี้ยง
  (9, 3),   -- Laser Tower → ของเล่นสัตว์เลี้ยง
  (10, 13), -- สายจูง → อุปกรณ์สัตว์เลี้ยง
  (11, 13), -- ชาม → อุปกรณ์สัตว์เลี้ยง
  (12, 3),  -- เชือกถัก → ของเล่นสัตว์เลี้ยง
  (13, 3),  -- เทรนด์ Smart Pet → ของเล่น
  (13, 13), -- เทรนด์ Smart Pet → อุปกรณ์
  (14, 3),  -- โปรโมชั่น → ของเล่น

  -- PetNest showcases
  (15, 4),  -- คอนโดแมว → ที่นอนและบ้าน
  (16, 4),  -- เบาะ Memory Foam → ที่นอนและบ้าน
  (17, 4),  -- Capsule House → ที่นอนและบ้าน
  (18, 4),  -- Heated Bed → ที่นอนและบ้าน
  (19, 10), -- กรงพับได้ → ตู้ปลาและกรง
  (20, 4),  -- ไอเดีย Pet-Friendly → ที่นอนและบ้าน
  (20, 10), -- ไอเดีย Pet-Friendly → ตู้ปลาและกรง
  (21, 4),  -- โปรโมชั่นคอนโด → ที่นอนและบ้าน

  -- PackPet showcases
  (22, 6),  -- ซองฟอยล์ → บรรจุภัณฑ์
  (22, 1),  -- ซองฟอยล์ → อาหารสัตว์ (ใช้กับอาหารสัตว์)
  (23, 6),  -- กล่อง Premium → บรรจุภัณฑ์
  (23, 11), -- กล่อง Premium → ขนมสัตว์เลี้ยง (ใช้กับขนม)
  (24, 6),  -- ขวด PET → บรรจุภัณฑ์
  (24, 7),  -- ขวด PET → ผลิตภัณฑ์บำรุง (ใช้กับแชมพู)
  (25, 6),  -- ฉลาก → บรรจุภัณฑ์
  (26, 6),  -- ถุง Kraft → บรรจุภัณฑ์
  (26, 1),  -- ถุง Kraft → อาหารสัตว์
  (27, 6),  -- เทรนด์ Eco → บรรจุภัณฑ์
  (28, 6);  -- โปรโมชั่น → บรรจุภัณฑ์


-- =====================================================================
-- SECTION L — FACTORY REVIEWS
-- =====================================================================
-- rating: INTEGER 1-5, ค่าเฉลี่ยต้อง match factory_profiles.rating
--
-- Factory 1 (PawFresh, id=2): 12 reviews, avg ≈ 4.83 (10×5 + 2×4 = 58/12)
-- Factory 2 (PetPlay,  id=3): 8 reviews,  avg ≈ 4.63 (5×5 + 3×4 = 37/8)
-- Factory 3 (PetNest,  id=4): 10 reviews, avg = 4.70 (7×5 + 3×4 = 47/10)
-- Factory 4 (PackPet,  id=5): 6 reviews,  avg = 4.50 (3×5 + 3×4 = 27/6)

INSERT INTO factory_reviews (factory_id, user_id, rating, comment, created_at) VALUES
  -- ──── PawFresh Premium (factory_id = 2) — 12 reviews ────
  (2, 1,  5, 'อาหารคุณภาพมาก น้องหมากินแล้วขนสวย สุขภาพดีขึ้นเห็นได้ชัด ประทับใจมาก',
   '2026-01-20 14:30:00'),
  (2, 6,  5, 'สั่ง OEM ครั้งแรก ทีมงานให้คำปรึกษาดีมาก ตั้งแต่สูตรจนถึงบรรจุภัณฑ์ ครบวงจร',
   '2026-01-28 10:00:00'),
  (2, 7,  5, 'ส่งตรงเวลา คุณภาพคงที่ทุกล็อต สั่งซ้ำมา 3 รอบแล้ว ไว้วางใจได้',
   '2026-02-05 16:00:00'),
  (2, 8,  5, 'ขนมสุนัข Jerky ขายดีมาก ลูกค้า repeat สั่งตลอด ขอบคุณโรงงานที่ทำคุณภาพดี',
   '2026-02-12 11:00:00'),
  (2, 9,  5, 'มาตรฐาน GMP ผ่าน อย. ครบ ลูกค้าเชื่อมั่นในแบรนด์เรา ขอบคุณ PawFresh',
   '2026-02-20 09:00:00'),
  (2, 10, 5, 'ให้คำปรึกษาเรื่องสเปกถุงอาหารแมวได้ดีมาก ทีม R&D เก่งจริงๆ',
   '2026-02-28 15:00:00'),
  (2, 11, 5, 'MOQ ไม่สูง เหมาะกับแบรนด์ใหม่ที่เพิ่งเริ่มต้น เราเริ่มจาก 1,000 กก. ได้เลย',
   '2026-03-05 10:30:00'),
  (2, 12, 5, 'สูตร Grain-Free ที่เราสั่งทำ ขายดีเกินคาด ขอบคุณทีมวิจัยของโรงงาน',
   '2026-03-10 14:00:00'),
  (2, 13, 5, 'Packaging สวย เรียบร้อย ได้มาตรฐาน ลูกค้าประทับใจ ยอดขายเพิ่ม 30%',
   '2026-03-18 11:00:00'),
  (2, 14, 5, 'งานเนี๊ยบมาก QC เข้มงวด ไม่ต้องห่วงเรื่องคุณภาพ สั่งทีไรก็มั่นใจ',
   '2026-03-25 09:00:00'),
  (2, 15, 4, 'คุณภาพดี แต่ Lead time ค่อนข้างนาน ประมาณ 3 สัปดาห์ อยากให้เร็วกว่านี้',
   '2026-04-01 16:00:00'),
  (2, 16, 4, 'โดยรวมดีมาก อยากให้เพิ่มตัวเลือกขนาดบรรจุภัณฑ์ 100g สำหรับ sample',
   '2026-04-05 10:00:00'),

  -- ──── PetPlay Innovation (factory_id = 3) — 8 reviews ────
  (3, 1,  5, 'ของเล่น Puzzle ขายดีมากๆ ลูกค้าชอบ ดีไซน์สวย ทนทาน น้องหมาชอบเล่นไม่เบื่อ',
   '2026-01-22 14:00:00'),
  (3, 6,  5, 'สายจูง LED สุดเจ๋ง คุณภาพวัสดุดีมาก ตลาดตอบรับดี สีสดใส ไม่หลุดง่าย',
   '2026-02-08 11:30:00'),
  (3, 7,  5, 'ชามอาหาร Anti-Ant เป็นไอเดียที่ดีมาก ลูกค้าชอบมาก แก้ปัญหามดได้จริง',
   '2026-02-18 10:00:00'),
  (3, 8,  5, 'ทีมออกแบบเก่งมาก ช่วยพัฒนาโปรดักท์จนสำเร็จ Prototype ออกมาเร็ว',
   '2026-03-01 15:00:00'),
  (3, 9,  5, 'สั่งของเล่นเชือกถักมา 500 ชิ้น คุณภาพสม่ำเสมอทุกชิ้น ไม่มีชิ้นเสีย',
   '2026-03-12 09:30:00'),
  (3, 10, 4, 'สินค้าดี แต่ราคาค่อนข้างสูงเมื่อเทียบกับตลาด อยากได้ราคาที่แข่งขันได้กว่านี้',
   '2026-03-22 16:00:00'),
  (3, 11, 4, 'ดีไซน์สวย แต่อยากให้มีสีให้เลือกมากกว่านี้ ตอนนี้มีแค่ 3 สี',
   '2026-04-01 11:00:00'),
  (3, 12, 4, 'งานดี ส่งตรงเวลา แต่ MOQ ค่อนข้างสูงสำหรับร้านเล็กๆ อยากให้ลด MOQ หน่อย',
   '2026-04-08 10:00:00'),

  -- ──── PetNest Craft (factory_id = 4) — 10 reviews ────
  (4, 1,  5, 'คอนโดแมวไม้ยางพารา สวยมาก แข็งแรง แมวชอบมาก ขนาดพอดี ไม่เทอะทะ',
   '2026-01-18 14:30:00'),
  (4, 6,  5, 'เบาะ Memory Foam คุณภาพเยี่ยม น้องหมานอนหลับสบาย ไม่ยุบง่าย',
   '2026-01-30 10:00:00'),
  (4, 7,  5, 'งานฝีมือดีมาก ตรงปกทุกชิ้น ลูกค้าไม่เคยคอมเพลน สั่งซ้ำทุกเดือน',
   '2026-02-10 16:00:00'),
  (4, 8,  5, 'สั่ง Capsule House มา 50 ชิ้น ขายหมดใน 2 สัปดาห์ ลูกค้าชอบดีไซน์มาก',
   '2026-02-22 11:00:00'),
  (4, 9,  5, 'ทีมออกแบบช่วยปรับแบบตามที่เราต้องการ ประทับใจมาก ได้ตรงสเปกเป๊ะ',
   '2026-03-05 09:00:00'),
  (4, 10, 5, 'ใช้วัสดุรักษ์โลก ตอบโจทย์ลูกค้ากลุ่ม eco-conscious ขายได้ราคาดี',
   '2026-03-15 15:00:00'),
  (4, 11, 5, 'ส่งไวตามกำหนด บรรจุหีบห่อดีมาก สินค้าไม่เสียหาย ไม่มีรอยขีดข่วน',
   '2026-03-25 10:30:00'),
  (4, 12, 4, 'คุณภาพดี แต่ Lead time นานหน่อยสำหรับออเดอร์ใหญ่ ต้องสั่งล่วงหน้า 1 เดือน',
   '2026-04-02 16:00:00'),
  (4, 13, 4, 'สินค้าสวย แต่น้ำหนักค่อนข้างมาก ค่าส่งสูง อยากให้มีรุ่นน้ำหนักเบา',
   '2026-04-06 11:00:00'),
  (4, 14, 4, 'โดยรวมประทับใจ อยากให้มีขนาดเล็กลงสำหรับแมวตัวเล็กหรือลูกแมว',
   '2026-04-10 09:00:00'),

  -- ──── PackPet Solutions (factory_id = 5) — 6 reviews ────
  (5, 1,  5, 'ซองฟอยล์คุณภาพดีมาก เก็บรักษาอาหารสัตว์ได้นาน พิมพ์สวย สีคมชัด',
   '2026-02-01 14:00:00'),
  (5, 6,  5, 'ฉลากกันน้ำคุณภาพเยี่ยม ติดทนไม่ลอก ถึงเปียกน้ำ ทนแดดได้ดี',
   '2026-02-20 10:30:00'),
  (5, 7,  5, 'ออกแบบกล่องให้สวยมาก ลูกค้าชมไม่หยุด เพิ่มมูลค่าให้แบรนด์เราได้เยอะ',
   '2026-03-10 15:00:00'),
  (5, 8,  4, 'คุณภาพงานพิมพ์ดี แต่บางครั้งสีไม่ตรง Pantone 100% ต้องปรับ proof อีกรอบ',
   '2026-03-25 11:00:00'),
  (5, 9,  4, 'ถุง Kraft สวยดี แต่ MOQ ค่อนข้างสูงสำหรับแบรนด์ใหม่ อยากให้เริ่มที่ 500 ชิ้น',
   '2026-04-03 09:30:00'),
  (5, 10, 4, 'งานเรียบร้อยดี ถ้า Lead time ลดได้อีก 2-3 วันจะดีมาก ตอนนี้ต้องรอนานหน่อย',
   '2026-04-09 16:00:00');


-- =====================================================================
-- SECTION M — FAVORITES (ตัวอย่าง — ลูกค้ากดถูกใจ Showcase)
-- =====================================================================

INSERT INTO favorites (user_id, showcase_id, created_at) VALUES
  -- Customer 1 favorites
  (1, 1,  '2026-01-16 12:00:00'),  -- ชอบอาหารสุนัข PawFresh
  (1, 6,  '2026-03-02 10:00:00'),  -- ชอบบทความ Superfood
  (1, 15, '2026-01-10 14:00:00'),  -- ชอบคอนโดแมว
  (1, 22, '2026-01-15 09:00:00'),  -- ชอบซองฟอยล์

  -- Customer 6 favorites
  (6, 5,  '2026-02-22 11:00:00'),  -- Grain-Free
  (6, 8,  '2026-01-12 10:00:00'),  -- Puzzle Toy
  (6, 16, '2026-01-24 15:00:00'),  -- เบาะ Memory Foam
  (6, 27, '2026-03-18 08:30:00'),  -- เทรนด์ Eco Packaging

  -- Customer 7 favorites
  (7, 2,  '2026-01-22 09:00:00'),  -- อาหารแมว Indoor
  (7, 9,  '2026-01-28 14:00:00'),  -- Laser Tower
  (7, 17, '2026-02-08 11:00:00'),  -- Capsule House
  (7, 20, '2026-03-14 10:00:00'),  -- ไอเดีย Pet-Friendly

  -- Customer 8 favorites
  (8, 3,  '2026-02-05 16:00:00'),  -- Chicken Jerky
  (8, 11, '2026-02-18 09:00:00'),  -- ชาม Anti-Ant
  (8, 15, '2026-01-12 11:00:00'),  -- คอนโดแมว
  (8, 23, '2026-02-01 14:00:00'),  -- กล่อง Premium

  -- Customer 9-10 favorites (ปะปนกัน)
  (9,  4,  '2026-02-14 10:00:00'),
  (9,  13, '2026-03-12 08:00:00'),
  (10, 6,  '2026-03-05 12:00:00'),
  (10, 20, '2026-03-15 11:00:00');


-- =====================================================================
-- SECTION N — PROMO SLIDES (Carousel หน้า Explore)
-- =====================================================================

INSERT INTO promo_slides (title, subtitle, code, image_url, status) VALUES
  ('ผลิตอาหารสัตว์ OEM ครบวงจร',
   'เริ่มต้นแบรนด์อาหารสัตว์เลี้ยงของคุณ MOQ เริ่มเพียง 1,000 กก.',
   'PETFOOD2026',
   'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=800',
   '1'),

  ('ของเล่นสัตว์เลี้ยง สั่งผลิตดีไซน์ใหม่',
   'ออกแบบ + ผลิต + แพ็ค ครบจบในที่เดียว ฟรีออกแบบ Prototype',
   'TOYNEW500',
   'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=800',
   '1'),

  ('เฟอร์นิเจอร์สัตว์เลี้ยง ดีไซน์สั่งได้',
   'คอนโดแมว ที่นอนสุนัข สั่งทำตามแบบ วัสดุรักษ์โลก',
   'PETNEST30',
   'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800',
   '1'),

  ('บรรจุภัณฑ์สินค้าสัตว์เลี้ยง ราคาโรงงาน',
   'ซอง ถุง กล่อง ฉลาก ออกแบบฟรี MOQ เริ่มที่ 500 ชิ้น',
   'PACK500FREE',
   'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
   '1');


-- =====================================================================
-- SECTION O — PRODUCTION STEPS (generic 6 steps — required for system)
-- =====================================================================

INSERT INTO production_steps (name, sort_order) VALUES
  ('deposit_confirmed', 1),
  ('raw_material',      2),
  ('production',        3),
  ('qc',                4),
  ('shipping',          5),
  ('completed',         6);


-- =====================================================================
-- SECTION P — VERIFY & SYNC (ตรวจสอบข้อมูลหลัง INSERT)
-- =====================================================================

-- Verify factory_profiles.rating matches reviews
-- Factory 2: 10×5 + 2×4 = 58/12 = 4.83
-- Factory 3: 5×5 + 3×4 = 37/8 = 4.63
-- Factory 4: 7×5 + 3×4 = 47/10 = 4.70
-- Factory 5: 3×5 + 3×4 = 27/6 = 4.50
-- (Already inserted correct values in Section D — this comment is for verification)


COMMIT;


-- =====================================================================
-- VERIFICATION QUERIES (ไม่ต้อง RUN — ใช้ตรวจสอบ)
-- =====================================================================
/*
-- ตรวจสอบ Rating vs Reviews
SELECT
  fp.user_id,
  fp.factory_name,
  fp.rating AS profile_rating,
  fp.review_count AS profile_count,
  COUNT(fr.review_id) AS actual_count,
  ROUND(AVG(fr.rating)::numeric, 2) AS actual_avg
FROM factory_profiles fp
LEFT JOIN factory_reviews fr ON fp.user_id = fr.factory_id
GROUP BY fp.user_id, fp.factory_name, fp.rating, fp.review_count
ORDER BY fp.user_id;

-- ตรวจสอบ Showcases per factory
SELECT
  fp.factory_name,
  fs.content_type,
  COUNT(*) AS cnt
FROM factory_showcases fs
JOIN factory_profiles fp ON fs.factory_id = fp.user_id
GROUP BY fp.factory_name, fs.content_type
ORDER BY fp.factory_name, fs.content_type;

-- ตรวจสอบ Categories mapping
SELECT
  fp.factory_name,
  c.name AS category
FROM map_factory_categories mfc
JOIN factory_profiles fp ON mfc.factory_id = fp.user_id
JOIN categories c ON mfc.category_id = c.category_id
ORDER BY fp.factory_name;

-- ตรวจสอบ Sub-categories mapping
SELECT
  fp.factory_name,
  sc.name AS sub_category
FROM map_factory_sub_categories mfs
JOIN factory_profiles fp ON mfs.factory_id = fp.user_id
JOIN lbi_sub_categories sc ON mfs.sub_category_id = sc.sub_category_id
ORDER BY fp.factory_name;

-- ตรวจสอบ Certificates
SELECT
  fp.factory_name,
  lc.cert_name,
  mfc.verify_status
FROM map_factory_certificates mfc
JOIN factory_profiles fp ON mfc.factory_id = fp.user_id
JOIN lbi_certificates lc ON mfc.cert_id = lc.cert_id
ORDER BY fp.factory_name;

-- ตรวจสอบ Showcase categories (multi-category)
SELECT
  fs.title,
  c.name AS category
FROM map_showcase_categories msc
JOIN factory_showcases fs ON msc.showcase_id = fs.showcase_id
JOIN categories c ON msc.category_id = c.category_id
ORDER BY fs.showcase_id;

-- นับรวมทุกตาราง
SELECT 'users' AS tbl, COUNT(*) FROM users
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'factory_profiles', COUNT(*) FROM factory_profiles
UNION ALL SELECT 'wallets', COUNT(*) FROM wallets
UNION ALL SELECT 'addresses', COUNT(*) FROM addresses
UNION ALL SELECT 'factory_showcases', COUNT(*) FROM factory_showcases
UNION ALL SELECT 'map_factory_categories', COUNT(*) FROM map_factory_categories
UNION ALL SELECT 'map_factory_sub_categories', COUNT(*) FROM map_factory_sub_categories
UNION ALL SELECT 'map_factory_certificates', COUNT(*) FROM map_factory_certificates
UNION ALL SELECT 'map_showcase_categories', COUNT(*) FROM map_showcase_categories
UNION ALL SELECT 'factory_reviews', COUNT(*) FROM factory_reviews
UNION ALL SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL SELECT 'promo_slides', COUNT(*) FROM promo_slides
UNION ALL SELECT 'production_steps', COUNT(*) FROM production_steps;
*/
