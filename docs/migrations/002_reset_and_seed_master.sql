-- =====================================================================
-- 002_reset_and_seed_master.sql
-- PostgreSQL — Wemake Platform
-- Purpose:
--   (A) ล้างข้อมูลทั้งหมดในทุกตาราง (TRUNCATE ... RESTART IDENTITY CASCADE)
--       เพื่อรีเซ็ต SERIAL/BIGSERIAL sequence ให้เริ่มที่ 1 ใหม่
--   (B) INSERT master data + demo data ตาม flow ที่ออกแบบไว้
--
-- Schema ตรวจสอบจากฐานข้อมูลจริง (Render) วันที่ 8 เมษายน 2026
-- =====================================================================

BEGIN;

-- =====================================================================
-- SECTION A — TRUNCATE ALL TABLES
-- =====================================================================
-- ลำดับ: ลูกก่อน → แม่ทีหลัง, ใช้ CASCADE เผื่อ FK dependency

TRUNCATE TABLE
  -- Notifications / Password tokens
  notifications,
  password_reset_tokens,

  -- Communication
  messages,
  conversations,

  -- Reviews / Favorites
  factory_reviews,
  favorites,

  -- Production
  production_updates,
  production_steps,

  -- Orders
  transactions,
  orders,

  -- Quotations
  quotations,

  -- RFQ
  rfq_images,
  rfqs,

  -- Showcases + Promo
  map_showcase_tags,
  factory_showcases,
  promo_slides,

  -- Factory mapping
  map_factory_certificates,
  map_factory_sub_categories,
  map_factory_tags,

  -- Factory profile
  factory_profiles,

  -- Wallet
  wallets,

  -- Address
  addresses,

  -- Users
  customers,
  users,

  -- Master data (ล้างก่อน re-seed)
  lbi_sub_categories,
  categories,
  lbi_production,
  lbi_certificates,
  lbi_factory_types,
  lbi_shipping_methods,
  lbi_units,
  lbi_tags,

  -- Location master
  lbi_sub_districts,
  lbi_districts,
  lbi_provinces,

  -- Duplicate tables (shipping_methods, units)
  shipping_methods,
  units
RESTART IDENTITY CASCADE;


-- =====================================================================
-- SECTION B — MASTER DATA
-- =====================================================================

-- ---------------------------------------------------------------------
-- B.1 lbi_units (unit_id BIGSERIAL, unit_name_th, unit_name_en, status)
-- ---------------------------------------------------------------------
INSERT INTO lbi_units (unit_name_th, unit_name_en, status) VALUES
  ('ชิ้น',      'Piece',     '1'),
  ('กล่อง',     'Box',       '1'),
  ('กิโลกรัม',  'Kilogram',  '1'),
  ('แพ็ค',      'Pack',      '1'),
  ('ถุง',       'Bag',       '1'),
  ('ขวด',       'Bottle',    '1'),
  ('แผ่น',      'Sheet',     '1'),
  ('ซอง',       'Pouch',     '1'),
  ('กระป๋อง',   'Can',       '1'),
  ('กรัม',      'Gram',      '1'),
  ('ลิตร',      'Liter',     '1'),
  ('มิลลิลิตร', 'Milliliter','1'),
  ('โหล',       'Dozen',     '1'),
  ('เมตร',      'Meter',     '1');

-- Sync ตาราง units (duplicate) ด้วย
INSERT INTO units (name, unit_name_en) VALUES
  ('ชิ้น',      'Piece'),
  ('กล่อง',     'Box'),
  ('กิโลกรัม',  'Kilogram'),
  ('แพ็ค',      'Pack'),
  ('ถุง',       'Bag'),
  ('ขวด',       'Bottle'),
  ('แผ่น',      'Sheet');


-- ---------------------------------------------------------------------
-- B.2 lbi_shipping_methods (shipping_method_id BIGSERIAL, method_name, status)
-- ---------------------------------------------------------------------
INSERT INTO lbi_shipping_methods (method_name, status) VALUES
  ('ลูกค้ารับเองที่โรงงาน',   '1'),
  ('ขนส่งเอกชน',               '1'),
  ('ขนส่งหมู่บ้าน/ไปรษณีย์',  '1'),
  ('รถบรรทุกโรงงาน',           '1'),
  ('ขนส่งแช่เย็น',             '1'),
  ('ส่งออกต่างประเทศ (Sea)',   '1'),
  ('ส่งออกต่างประเทศ (Air)',   '1');

-- Sync ตาราง shipping_methods (duplicate) ด้วย
INSERT INTO shipping_methods (name) VALUES
  ('pickup'),
  ('courier'),
  ('freight'),
  ('factory_truck'),
  ('post');


-- ---------------------------------------------------------------------
-- B.3 lbi_factory_types (factory_type_id BIGSERIAL, type_name, status)
-- ---------------------------------------------------------------------
INSERT INTO lbi_factory_types (type_name, status) VALUES
  ('โรงพิมพ์บรรจุภัณฑ์',       '1'),   -- 1
  ('โรงงานอาหารสัตว์',          '1'),   -- 2
  ('โรงงานเครื่องสำอาง',        '1'),   -- 3
  ('โรงงานอาหารเสริม',          '1'),   -- 4
  ('โรงงานเสื้อผ้า/สิ่งทอ',    '1'),   -- 5
  ('โรงงานพลาสติก',             '1'),   -- 6
  ('โรงงานอาหารและเครื่องดื่ม', '1'),   -- 7
  ('โรงงานเฟอร์นิเจอร์',       '1'),   -- 8
  ('โรงงานของเล่น',             '1'),   -- 9
  ('โรงงานขนมสัตว์เลี้ยง',     '1'),   -- 10
  ('โรงงานอุปกรณ์สัตว์เลี้ยง', '1');   -- 11


-- ---------------------------------------------------------------------
-- B.4 lbi_certificates (cert_id BIGSERIAL, cert_name, description, status)
-- ---------------------------------------------------------------------
INSERT INTO lbi_certificates (cert_name, description, status) VALUES
  ('ISO 9001',   'ระบบบริหารงานคุณภาพ',                              '1'),
  ('GMP',        'หลักเกณฑ์วิธีการที่ดีในการผลิต',                    '1'),
  ('HACCP',      'ระบบวิเคราะห์อันตรายและจุดวิกฤตที่ต้องควบคุม',      '1'),
  ('อย.',        'สำนักงานคณะกรรมการอาหารและยา',                      '1'),
  ('HALAL',      'มาตรฐานฮาลาล',                                     '1'),
  ('ISO 22716', 'มาตรฐานเครื่องสำอาง',                                '1'),
  ('มอก.',       'มาตรฐานผลิตภัณฑ์อุตสาหกรรม',                       '1'),
  ('ISO 14001', 'ระบบจัดการสิ่งแวดล้อม',                              '1'),
  ('ISO 22000', 'ระบบจัดการความปลอดภัยอาหาร',                         '1'),
  ('BRC',       'มาตรฐานความปลอดภัยอาหาร (British Retail Consortium)','1');


-- ---------------------------------------------------------------------
-- B.5 categories (category_id BIGSERIAL, name)
-- หมวดสินค้าหลัก 13 หมวด — ตรงกับข้อมูลเดิมในระบบ
-- ---------------------------------------------------------------------
INSERT INTO categories (name) VALUES
  ('อาหารสัตว์'),             -- 1
  ('อาหารเสริม'),             -- 2
  ('ของเล่นสัตว์เลี้ยง'),     -- 3
  ('ที่นอนและบ้าน'),           -- 4
  ('กระเป๋าและรถเข็น'),       -- 5
  ('บรรจุภัณฑ์'),             -- 6
  ('ผลิตภัณฑ์บำรุง'),         -- 7
  ('เสื้อผ้าสัตว์เลี้ยง'),    -- 8
  ('ห้องน้ำและทราย'),          -- 9
  ('ตู้ปลาและกรง'),           -- 10
  ('ขนมสัตว์เลี้ยง'),         -- 11
  ('ผลิตภัณฑ์ทําความสะอาด'),  -- 12
  ('อุปกรณ์สัตว์เลี้ยง');     -- 13


-- ---------------------------------------------------------------------
-- B.6 lbi_sub_categories (sub_category_id BIGSERIAL, category_id, name, status, sort_order)
-- หมวดย่อย — อ้างอิง category_id ข้างบน
-- ---------------------------------------------------------------------
INSERT INTO lbi_sub_categories (category_id, name, sort_order, status) VALUES
  -- 1: อาหารสัตว์
  (1, 'อาหารสุนัข',               1,  '1'),
  (1, 'อาหารแมว',                 2,  '1'),
  (1, 'อาหารนก/สัตว์เล็ก',        3,  '1'),
  (1, 'อาหารสัตว์ทุกชนิด',        99, '1'),

  -- 2: อาหารเสริม
  (2, 'อาหารเสริมสุนัข',          1,  '1'),
  (2, 'อาหารเสริมแมว',            2,  '1'),
  (2, 'อาหารเสริมสัตว์ทุกชนิด',   99, '1'),

  -- 3: ของเล่นสัตว์เลี้ยง
  (3, 'ของเล่นสุนัข',             1,  '1'),
  (3, 'ของเล่นแมว',               2,  '1'),
  (3, 'ของเล่นสัตว์ทุกชนิด',      99, '1'),

  -- 4: ที่นอนและบ้าน
  (4, 'ที่นอนสุนัข',              1,  '1'),
  (4, 'ที่นอนแมว',                2,  '1'),
  (4, 'บ้านสัตว์เลี้ยง',          3,  '1'),
  (4, 'ที่นอน/บ้านทุกชนิด',       99, '1'),

  -- 5: กระเป๋าและรถเข็น
  (5, 'กระเป๋าสุนัข',             1,  '1'),
  (5, 'กระเป๋าแมว',               2,  '1'),
  (5, 'รถเข็นสัตว์เลี้ยง',        3,  '1'),
  (5, 'กระเป๋า/รถเข็นทุกชนิด',    99, '1'),

  -- 6: บรรจุภัณฑ์
  (6, 'ถุง/Pouch',                1,  '1'),
  (6, 'กล่องกระดาษ',              2,  '1'),
  (6, 'ขวด/กระป๋อง',              3,  '1'),
  (6, 'ฉลาก/สติกเกอร์',           4,  '1'),
  (6, 'บรรจุภัณฑ์อื่นๆ',          99, '1'),

  -- 7: ผลิตภัณฑ์บำรุง
  (7, 'แชมพู/ครีมนวด',            1,  '1'),
  (7, 'สบู่/โฟมอาบน้ำ',           2,  '1'),
  (7, 'สเปรย์/โลชั่น',            3,  '1'),
  (7, 'วิตามิน',                  4,  '1'),
  (7, 'ผลิตภัณฑ์ดูแลช่องปาก',     5,  '1'),
  (7, 'ผลิตภัณฑ์ดูแลทุกชนิด',     99, '1'),

  -- 8: เสื้อผ้าสัตว์เลี้ยง
  (8, 'เสื้อผ้าสุนัข',            1,  '1'),
  (8, 'เสื้อผ้าแมว',              2,  '1'),
  (8, 'ผ้าทอ/ผ้าถัก',             3,  '1'),
  (8, 'ผ้าสำเร็จรูป',             4,  '1'),
  (8, 'เสื้อผ้า/สิ่งทอทุกชนิด',   99, '1'),

  -- 9: ห้องน้ำและทราย
  (9, 'ห้องน้ำแมว',               1,  '1'),
  (9, 'ทรายแมว',                  2,  '1'),
  (9, 'แผ่นรองฉี่สุนัข',          3,  '1'),
  (9, 'ห้องน้ำ/ทรายทุกชนิด',      99, '1'),

  -- 10: ตู้ปลาและกรง
  (10, 'ตู้ปลา',                   1,  '1'),
  (10, 'กรงนก',                    2,  '1'),
  (10, 'กรงสัตว์เลี้ยง',           3,  '1'),
  (10, 'ตู้ปลา/กรงทุกชนิด',        99, '1'),

  -- 11: ขนมสัตว์เลี้ยง
  (11, 'ขนมสุนัข',                1,  '1'),
  (11, 'ขนมแมว',                  2,  '1'),
  (11, 'ขนมสัตว์ทุกชนิด',         99, '1'),

  -- 12: ผลิตภัณฑ์ทําความสะอาด
  (12, 'น้ำยาทำความสะอาดพื้น',    1,  '1'),
  (12, 'น้ำยาดับกลิ่น',           2,  '1'),
  (12, 'ผลิตภัณฑ์ทำความสะอาดทุกชนิด', 99, '1'),

  -- 13: อุปกรณ์สัตว์เลี้ยง
  (13, 'สายจูง/ปลอกคอ',           1,  '1'),
  (13, 'ชามอาหาร/น้ำ',            2,  '1'),
  (13, 'แปรงขน/อุปกรณ์กรูมมิ่ง',   3,  '1'),
  (13, 'อุปกรณ์สัตว์เลี้ยงทุกชนิด', 99, '1');


-- ---------------------------------------------------------------------
-- B.7 lbi_production (step_id BIGSERIAL, factory_type_id, step_name, sequence, status)
-- *** ไม่มี is_payment_trigger ในตารางจริง — ลบออก ***
-- template production steps ต่อ factory_type
-- ---------------------------------------------------------------------
INSERT INTO lbi_production (factory_type_id, step_name, sequence, status) VALUES
  -- factory_type_id = 1 : โรงพิมพ์บรรจุภัณฑ์
  (1, 'ยืนยันคำสั่งซื้อ',           1, '1'),
  (1, 'ออกแบบและทำ artwork',         2, '1'),
  (1, 'ลูกค้าอนุมัติแบบ',            3, '1'),
  (1, 'พิมพ์ลายและปั้มไดคัท',        4, '1'),
  (1, 'QC',                          5, '1'),
  (1, 'จัดส่ง',                      6, '1'),

  -- factory_type_id = 2 : โรงงานอาหารสัตว์
  (2, 'ยืนยันคำสั่งซื้อ',           1, '1'),
  (2, 'จัดเตรียมวัตถุดิบ',           2, '1'),
  (2, 'ผสมและอัดเม็ด',               3, '1'),
  (2, 'QC',                          4, '1'),
  (2, 'บรรจุภัณฑ์',                  5, '1'),
  (2, 'จัดส่ง',                      6, '1'),

  -- factory_type_id = 3 : โรงงานเครื่องสำอาง
  (3, 'ยืนยันคำสั่งซื้อ',           1, '1'),
  (3, 'พัฒนาสูตร',                   2, '1'),
  (3, 'ผลิตจริง',                    3, '1'),
  (3, 'QC/ทดสอบ',                    4, '1'),
  (3, 'บรรจุภัณฑ์',                  5, '1'),
  (3, 'จัดส่ง',                      6, '1'),

  -- factory_type_id = 4 : โรงงานอาหารเสริม
  (4, 'ยืนยันคำสั่งซื้อ',           1, '1'),
  (4, 'จัดเตรียมวัตถุดิบ',           2, '1'),
  (4, 'ผลิตและอัดเม็ด/แคปซูล',       3, '1'),
  (4, 'QC/ทดสอบ',                    4, '1'),
  (4, 'บรรจุภัณฑ์',                  5, '1'),
  (4, 'จัดส่ง',                      6, '1'),

  -- factory_type_id = 5 : โรงงานเสื้อผ้า/สิ่งทอ
  (5, 'ยืนยันคำสั่งซื้อ',           1, '1'),
  (5, 'ตัดแพทเทิร์นและเตรียมผ้า',    2, '1'),
  (5, 'เย็บประกอบ',                  3, '1'),
  (5, 'QC',                          4, '1'),
  (5, 'รีดและบรรจุ',                 5, '1'),
  (5, 'จัดส่ง',                      6, '1'),

  -- factory_type_id = 6 : โรงงานพลาสติก
  (6, 'ยืนยันคำสั่งซื้อ',           1, '1'),
  (6, 'สร้างแม่พิมพ์',               2, '1'),
  (6, 'ฉีดพลาสติก',                  3, '1'),
  (6, 'QC',                          4, '1'),
  (6, 'บรรจุและจัดส่ง',              5, '1'),

  -- factory_type_id = 7 : โรงงานอาหารและเครื่องดื่ม
  (7, 'ยืนยันคำสั่งซื้อ',           1, '1'),
  (7, 'จัดเตรียมวัตถุดิบ',           2, '1'),
  (7, 'ผลิต',                        3, '1'),
  (7, 'QC',                          4, '1'),
  (7, 'บรรจุภัณฑ์',                  5, '1'),
  (7, 'จัดส่ง',                      6, '1'),

  -- factory_type_id = 8 : โรงงานเฟอร์นิเจอร์
  (8, 'ยืนยันคำสั่งซื้อ',           1, '1'),
  (8, 'ตัดไม้/เตรียมวัสดุ',          2, '1'),
  (8, 'ประกอบชิ้นงาน',               3, '1'),
  (8, 'ทำสี/เคลือบ',                 4, '1'),
  (8, 'QC',                          5, '1'),
  (8, 'จัดส่ง',                      6, '1'),

  -- factory_type_id = 9 : โรงงานของเล่น
  (9, 'ยืนยันคำสั่งซื้อ',           1, '1'),
  (9, 'จัดเตรียมวัตถุดิบ',           2, '1'),
  (9, 'ผลิต/ขึ้นรูป',                3, '1'),
  (9, 'QC',                          4, '1'),
  (9, 'บรรจุและจัดส่ง',              5, '1'),

  -- factory_type_id = 10 : โรงงานขนมสัตว์เลี้ยง
  (10, 'ยืนยันคำสั่งซื้อ',          1, '1'),
  (10, 'จัดเตรียมวัตถุดิบ',          2, '1'),
  (10, 'ผลิตและอบ',                  3, '1'),
  (10, 'QC',                         4, '1'),
  (10, 'บรรจุภัณฑ์',                 5, '1'),
  (10, 'จัดส่ง',                     6, '1'),

  -- factory_type_id = 11 : โรงงานอุปกรณ์สัตว์เลี้ยง
  (11, 'ยืนยันคำสั่งซื้อ',          1, '1'),
  (11, 'จัดเตรียมวัตถุดิบ',          2, '1'),
  (11, 'ผลิต/ประกอบ',                3, '1'),
  (11, 'QC',                         4, '1'),
  (11, 'บรรจุและจัดส่ง',             5, '1');


-- ---------------------------------------------------------------------
-- B.8 lbi_tags — แท็กสำหรับโรงงาน/showcase
-- ---------------------------------------------------------------------
INSERT INTO lbi_tags (tag_name, status) VALUES
  ('OEM',            '1'),
  ('Private Label',  '1'),
  ('Eco-Friendly',   '1'),
  ('GMP',            '1'),
  ('HACCP',          '1'),
  ('ISO 9001',       '1'),
  ('อย.',            '1'),
  ('MOQ ต่ำ',        '1'),
  ('ส่งเร็ว',        '1'),
  ('มีทีม R&D',      '1'),
  ('ออกแบบให้ฟรี',   '1'),
  ('Small Batch',    '1'),
  ('Organic',        '1'),
  ('Vegan',          '1'),
  ('Cotton 100%',    '1');


-- ---------------------------------------------------------------------
-- B.9 lbi_provinces — จังหวัดหลักที่มีโรงงาน
-- ---------------------------------------------------------------------
INSERT INTO lbi_provinces (name_th, name_en, status) VALUES
  ('กรุงเทพมหานคร', 'Bangkok',            '1'),
  ('เชียงใหม่',      'Chiang Mai',         '1'),
  ('ชลบุรี',         'Chon Buri',          '1'),
  ('นครราชสีมา',     'Nakhon Ratchasima',  '1'),
  ('สมุทรปราการ',    'Samut Prakan',       '1'),
  ('นนทบุรี',        'Nonthaburi',         '1'),
  ('ปทุมธานี',       'Pathum Thani',       '1'),
  ('สมุทรสาคร',      'Samut Sakhon',       '1'),
  ('ขอนแก่น',        'Khon Kaen',          '1'),
  ('สุราษฎร์ธานี',   'Surat Thani',        '1');

-- B.9.1 lbi_districts — ตัวอย่างอำเภอ (เฉพาะ กรุงเทพฯ + สมุทรปราการ)
INSERT INTO lbi_districts (province_id, name_th, name_en, status) VALUES
  (1, 'พระนคร',        'Phra Nakhon',     '1'),
  (1, 'บางรัก',        'Bang Rak',        '1'),
  (1, 'จตุจักร',       'Chatuchak',       '1'),
  (1, 'บางเขน',        'Bang Khen',       '1'),
  (1, 'ลาดพร้าว',      'Lat Phrao',       '1'),
  (1, 'บางกะปิ',       'Bang Kapi',       '1'),
  (5, 'เมืองสมุทรปราการ','Mueang Samut Prakan','1'),
  (5, 'บางพลี',        'Bang Phli',       '1'),
  (5, 'บางบ่อ',        'Bang Bo',         '1'),
  (5, 'พระประแดง',     'Phra Pradaeng',   '1'),
  (7, 'เมืองปทุมธานี',  'Mueang Pathum Thani','1');

-- B.9.2 lbi_sub_districts — ตัวอย่างตำบล
INSERT INTO lbi_sub_districts (district_id, name_th, name_en, zip_code, status) VALUES
  (1, 'พระบรมมหาราชวัง', 'Phra Borom Maha Ratchawang', '10200', '1'),
  (1, 'วังบูรพาภิรมย์',  'Wang Burapha Phirom',         '10200', '1'),
  (2, 'มหาพฤฒาราม',      'Maha Phruettharam',           '10500', '1'),
  (2, 'สีลม',            'Si Lom',                      '10500', '1'),
  (3, 'ลาดยาว',          'Lat Yao',                     '10900', '1'),
  (3, 'จตุจักร',          'Chatuchak',                   '10900', '1'),
  (7, 'ปากน้ำ',           'Pak Nam',                     '10270', '1'),
  (7, 'บางเมือง',         'Bang Mueang',                 '10270', '1'),
  (8, 'บางพลีใหญ่',       'Bang Phli Yai',               '10540', '1'),
  (8, 'บางแก้ว',          'Bang Kaeo',                   '10540', '1'),
  (11, 'บางปรอก',         'Bang Parok',                  '12000', '1');


-- =====================================================================
-- SECTION C — DEMO DATA (Users, Factories, Showcases, RFQs, etc.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- C.1 users (user_id BIGSERIAL, role, email, phone, password_hash, is_active)
-- password_hash = bcrypt("password123") — demo only
-- ---------------------------------------------------------------------
INSERT INTO users (role, email, phone, password_hash, is_active) VALUES
  ('CT', 'customer@wemake.com',      '0917052627', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),
  ('FT', 'aplus@factory.com',        '0811111111', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),
  ('FT', 'petfood@factory.com',      '0822222222', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),
  ('FT', 'beautylab@factory.com',    '0833333333', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),
  ('FT', 'vitaplus@factory.com',     '0844444444', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),
  ('FT', 'thaitextile@factory.com',  '0855555555', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true),
  ('CT', 'customer2@wemake.com',     '0866666666', '$2a$10$xQHRfE5UHd6e8GqkDl9RZ.9J3K7q5g6F5e4X3u2v1w0y8z7x6w5v4', true);

-- C.2 customers
INSERT INTO customers (user_id, first_name, last_name) VALUES
  (1, 'สมชาย',   'มั่งมี'),
  (7, 'สมศรี',   'รวยดี');

-- C.3 factory_profiles
INSERT INTO factory_profiles (
  user_id, factory_name, factory_type_id, tax_id,
  specialization, min_order, lead_time_desc, is_verified,
  description, price_range, image_url
) VALUES
  (2, 'โรงพิมพ์ A Plus Packaging', 1, '0105560000001',
   'พิมพ์กล่อง ซอง ฉลาก', 500, '7-14 วัน', true,
   'รับพิมพ์บรรจุภัณฑ์ทุกชนิด กล่อง ซอง ฉลาก สติกเกอร์ ด้วยเครื่องพิมพ์ทันสมัย', '2-15 บาท/ชิ้น',
   'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400'),

  (3, 'PetFood Pro', 2, '0105560000002',
   'อาหารสุนัข อาหารแมว OEM', 1000, '14-21 วัน', true,
   'โรงงานผลิตอาหารสัตว์เลี้ยงมาตรฐาน GMP รับผลิต OEM ทุกสูตร', '15-80 บาท/กก.',
   'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400'),

  (4, 'BeautyLab Cosmetics', 3, '0105560000003',
   'ครีม เซรั่ม แชมพูสัตว์', 300, '14-21 วัน', true,
   'ผลิตเครื่องสำอางสำหรับสัตว์เลี้ยง แชมพู ครีมนวด สเปรย์ มาตรฐาน อย.', '20-120 บาท/ขวด',
   'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400'),

  (5, 'VitaPlus Supplement', 4, '0105560000004',
   'วิตามินสัตว์ อาหารเสริม', 500, '14-28 วัน', true,
   'ผลิตอาหารเสริมและวิตามินสำหรับสัตว์เลี้ยง ทั้งแบบเม็ด แคปซูล และผง', '30-200 บาท/ขวด',
   'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=400'),

  (6, 'Thai Textile Manufacturing', 5, '0105560000005',
   'เสื้อผ้าสัตว์ ปลอกคอ สายจูง', 200, '7-14 วัน', true,
   'รับตัดเย็บเสื้อผ้าและอุปกรณ์สิ่งทอสำหรับสัตว์เลี้ยง ปลอกคอ สายจูง เบาะนอน', '20-300 บาท/ชิ้น',
   'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400');

-- C.4 wallets
INSERT INTO wallets (user_id, good_fund, pending_fund) VALUES
  (1, 0, 0),
  (2, 15000, 5000),
  (3, 28000, 12000),
  (4, 8000,  3000),
  (5, 12000, 0),
  (6, 6000,  2000);

-- C.5 addresses
-- address_type CHECK: 'C' = Customer/Contact, 'M' = Manufacturing/Factory
INSERT INTO addresses (user_id, address_type, address_detail, sub_district_id, district_id, province_id, zip_code, is_default) VALUES
  (1, 'C', '123/45 ซอยสุขุมวิท 55',           5, 3, 1, '10900', true),
  (2, 'M', '88 หมู่ 5 นิคมอุตสาหกรรมบางพลี',  9, 8, 5, '10540', true),
  (3, 'M', '199/1 ถนนพหลโยธิน',                6, 3, 1, '10900', true),
  (4, 'M', '55/2 ซอยเพชรเกษม 69',             7, 7, 5, '10270', true),
  (5, 'M', '77 หมู่ 3 ถนนรังสิต-นครนายก',     11,11, 7, '12000', true),
  (6, 'M', '120/8 ซอยลาดพร้าว 71',             5, 5, 1, '10230', true);

-- C.6 map_factory_tags (เชื่อมโรงงาน → tags)
INSERT INTO map_factory_tags (factory_id, tag_id) VALUES
  -- A Plus Packaging (user_id=2)
  (2, 1), (2, 8), (2, 11),
  -- PetFood Pro (user_id=3)
  (3, 1), (3, 2), (3, 4), (3, 5), (3, 7), (3, 10),
  -- BeautyLab (user_id=4)
  (4, 1), (4, 2), (4, 7), (4, 10), (4, 12),
  -- VitaPlus (user_id=5)
  (5, 1), (5, 4), (5, 5), (5, 7),
  -- Thai Textile (user_id=6)
  (6, 1), (6, 2), (6, 3), (6, 8), (6, 15);

-- C.7 map_factory_certificates
INSERT INTO map_factory_certificates (factory_id, cert_id, verify_status) VALUES
  (2, 1, 'AP'), (2, 7, 'AP'),
  (3, 1, 'AP'), (3, 2, 'AP'), (3, 3, 'AP'), (3, 4, 'AP'),
  (4, 2, 'AP'), (4, 4, 'AP'), (4, 6, 'AP'),
  (5, 1, 'AP'), (5, 2, 'AP');


-- C.8 promo_slides
INSERT INTO promo_slides (title, subtitle, code, image_url, status) VALUES
  ('แจกโค้ดส่วนลด 500 บาท',
   'สำหรับลูกค้าใหม่ที่สั่งผลิตครั้งแรก',
   'WEMAKE500',
   'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800', '1'),

  ('ผลิตแบรนด์สกินแคร์ เริ่มต้นเพียง 15,000',
   'MOQ 300 ชิ้น พร้อมออกแบบบรรจุภัณฑ์',
   'BEAUTY15K',
   'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', '1'),

  ('โปรฯ OEM อาหารสัตว์ ครบจบในที่เดียว',
   'ผลิต+ออกแบบซอง+ขึ้น อย. ในราคาเดียว',
   'PET2569',
   'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=800', '1');


-- C.9 factory_showcases (ตัวอย่าง)
INSERT INTO factory_showcases (
  factory_id, content_type, title, excerpt, image_url, category_id, min_order, lead_time_days, likes_count
) VALUES
  -- PetFood Pro showcases
  (3, 'PD', 'อาหารสุนัข OEM สูตรไก่และข้าว',
   'รับผลิตอาหารสุนัขแบบเม็ด สูตรไก่และข้าว โปรตีน 26% มาตรฐาน GMP',
   'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
   1, 1000, 14, 25),

  (3, 'PD', 'อาหารแมว OEM สูตรปลาทูน่า',
   'อาหารแมวเม็ด สูตรปลาทูน่า ไม่เติมสี บำรุงขน',
   'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400',
   1, 500, 14, 18),

  (3, 'ID', 'ไอเดีย: สูตรอาหารสัตว์ Grain-Free',
   'เทรนด์อาหารสัตว์ Grain-Free กำลังมาแรง สำหรับสัตว์ที่แพ้ธัญพืช',
   'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400',
   1, 0, 0, 42),

  -- A Plus Packaging showcases
  (2, 'PD', 'กล่องกระดาษพิมพ์ลาย 4 สี',
   'รับพิมพ์กล่องกระดาษทุกขนาด ออฟเซ็ท 4 สี เคลือบ UV/ลามิเนต',
   'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
   6, 500, 7, 31),

  (2, 'PD', 'ซองฟอยล์ซิปล็อค สำหรับอาหารสัตว์',
   'ซองฟอยล์อลูมิเนียม ซิปล็อค เก็บความสดอาหารสัตว์ พิมพ์ลายได้',
   'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
   6, 1000, 10, 15),

  -- BeautyLab showcases
  (4, 'PD', 'แชมพูสุนัข สูตรอ่อนโยน',
   'แชมพูสุนัขสูตรอ่อนโยน pH สมดุล สำหรับผิวแพ้ง่าย',
   'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=400',
   7, 300, 14, 20),

  (4, 'PM', 'โปรฯ ผลิตแชมพูสัตว์เลี้ยง 300 ขวดขึ้นไป',
   'ลด 15% ทุกสูตร! สำหรับออเดอร์ใหม่เดือนนี้',
   'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
   7, 300, 14, 8),

  -- VitaPlus showcases
  (5, 'PD', 'วิตามินบำรุงข้อสุนัข กลูโคซามีน',
   'วิตามินบำรุงข้อต่อ กลูโคซามีน + คอนดรอยติน สำหรับสุนัขสูงวัย',
   'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=400',
   2, 500, 21, 12),

  -- Thai Textile showcases
  (6, 'PD', 'เสื้อยืดสุนัข Cotton 100%',
   'เสื้อยืดสุนัข ผ้า Cotton 100% นุ่ม ระบายอากาศดี ไซส์ XS-XL',
   'https://images.unsplash.com/photo-1583511666372-62fc211f8377?w=400',
   8, 200, 7, 35),

  (6, 'PD', 'ปลอกคอสุนัข ผ้าทอลายไทย',
   'ปลอกคอสุนัข ผ้าทอลายไทย ทนทาน สีสดไม่ตก ขนาดปรับได้',
   'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
   13, 100, 7, 28);


-- C.10 rfqs (ตัวอย่าง)
INSERT INTO rfqs (
  user_id, category_id, title, quantity, unit_id, budget_per_piece,
  details, address_id, status, sub_category_id, shipping_method_id
) VALUES
  (1, 1, 'ผลิตอาหารสุนัขแบบเม็ด สูตรไก่', 2000, 3, 45.00,
   'ต้องการผลิตอาหารสุนัขโตเต็มวัย สูตรไก่และข้าวกล้อง โปรตีนไม่ต่ำกว่า 26% บรรจุถุง 1 กก.',
   1, 'OP', 1, 2),

  (1, 6, 'สั่งพิมพ์ซองฟอยล์อาหารสัตว์ 1 กก.', 5000, 1, 3.50,
   'ซองฟอยล์อลูมิเนียม ซิปล็อค ขนาดบรรจุ 1 กก. พิมพ์ 4 สี ลามิเนตด้าน',
   1, 'OP', NULL, 2),

  (7, 7, 'ผลิตแชมพูสุนัข สูตรอ่อนโยน', 500, 6, 65.00,
   'แชมพูสุนัข pH 6.5-7.0 กลิ่นลาเวนเดอร์ ขนาด 250ml ฉลากตามที่ออกแบบ',
   1, 'OP', NULL, 1),

  (7, 8, 'ตัดเย็บเสื้อยืดสุนัข ไซส์ S-L', 300, 1, 85.00,
   'เสื้อยืดสุนัข ผ้า Cotton 100% พิมพ์ลาย 3 แบบ ไซส์ S M L อย่างละ 100 ตัว',
   1, 'OP', NULL, 2),

  (1, 2, 'ผลิตวิตามินบำรุงขนแมว แบบเม็ด', 1000, 6, 120.00,
   'วิตามินบำรุงขนแมว สูตร Biotin + Omega-3 ขนาดขวด 60 เม็ด',
   1, 'OP', 6, 1);


-- C.11 quotations
INSERT INTO quotations (
  rfq_id, factory_id, price_per_piece, mold_cost, lead_time_days, shipping_method_id, status
) VALUES
  (1, 3, 42.00, 0,    14, 2, 'PD'),
  (2, 2, 3.20,  5000, 10, 4, 'PD'),
  (3, 4, 58.00, 0,    14, 2, 'PD'),
  (4, 6, 78.00, 0,    7,  2, 'PD'),
  (5, 5, 110.00,0,    21, 2, 'PD');


-- C.12 conversations + messages (ตัวอย่าง 1 thread)
INSERT INTO conversations (customer_id, factory_id, last_message, unread_customer, unread_factory, has_quote) VALUES
  (1, 3, 'ส่งใบเสนอราคาให้แล้วครับ ลองดูรายละเอียดได้เลย', 1, 0, true),
  (7, 4, 'สนใจสั่งผลิตแชมพูสุนัขครับ', 0, 1, false);

INSERT INTO messages (message_id, reference_type, sender_id, receiver_id, content, conv_id, message_type, reference_id) VALUES
  ('msg-001', 'RQ', 1, 3, 'สนใจสั่งผลิตอาหารสุนัข ขอรายละเอียดเพิ่มเติมครับ', 1, 'TX', 1),
  ('msg-002', 'RQ', 3, 1, 'ยินดีครับ โรงงานเราผลิตอาหารสุนัขมาตรฐาน GMP สูตรที่ต้องการมีพร้อมครับ', 1, 'TX', 1),
  ('msg-003', 'RQ', 3, 1, 'ส่งใบเสนอราคาให้แล้วครับ ลองดูรายละเอียดได้เลย', 1, 'TX', 1),
  ('msg-004', 'RQ', 7, 4, 'สนใจสั่งผลิตแชมพูสุนัขครับ', 2, 'TX', 3);


COMMIT;


-- =====================================================================
-- VERIFY — รันแยกหลัง commit
-- =====================================================================
SELECT 'lbi_units'            AS tbl, COUNT(*) AS cnt FROM lbi_units
UNION ALL SELECT 'lbi_shipping_methods', COUNT(*) FROM lbi_shipping_methods
UNION ALL SELECT 'lbi_factory_types',    COUNT(*) FROM lbi_factory_types
UNION ALL SELECT 'lbi_certificates',     COUNT(*) FROM lbi_certificates
UNION ALL SELECT 'categories',           COUNT(*) FROM categories
UNION ALL SELECT 'lbi_sub_categories',   COUNT(*) FROM lbi_sub_categories
UNION ALL SELECT 'lbi_production',       COUNT(*) FROM lbi_production
UNION ALL SELECT 'lbi_tags',             COUNT(*) FROM lbi_tags
UNION ALL SELECT 'lbi_provinces',        COUNT(*) FROM lbi_provinces
UNION ALL SELECT 'users',                COUNT(*) FROM users
UNION ALL SELECT 'factory_profiles',     COUNT(*) FROM factory_profiles
UNION ALL SELECT 'factory_showcases',    COUNT(*) FROM factory_showcases
UNION ALL SELECT 'rfqs',                 COUNT(*) FROM rfqs
UNION ALL SELECT 'quotations',           COUNT(*) FROM quotations
UNION ALL SELECT 'conversations',        COUNT(*) FROM conversations
ORDER BY tbl;
