-- ============================================================
-- Migration: RFQ Factory Targeting
-- ชื่อไฟล์: add_rfq_targeting.sql
-- วัตถุประสงค์: เพิ่ม targeting mode + junction table สำหรับ
--              เลือกโรงงานเฉพาะเจาะจงตอนสร้าง RFQ
-- ============================================================

-- ── 1. เพิ่ม targeting column ใน rfqs ────────────────────────────────────────
--   DEFAULT 'all' → backward compatible กับ RFQ เก่าทุกรายการ
--   CHECK constraint กัน invalid value

ALTER TABLE rfqs
  ADD COLUMN IF NOT EXISTS targeting VARCHAR(10) NOT NULL DEFAULT 'all'
  CHECK (targeting IN ('all', 'specific'));

-- ── 2. Junction table สำหรับโรงงานที่ถูกเลือก ───────────────────────────────
--   PRIMARY KEY (rfq_id, factory_id) → กัน duplicate อัตโนมัติ
--   ON DELETE CASCADE → ลบ rfq ปุ๊บ rows นี้หายตาม

CREATE TABLE IF NOT EXISTS rfq_target_factories (
  rfq_id     BIGINT NOT NULL REFERENCES rfqs(rfq_id) ON DELETE CASCADE,
  factory_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (rfq_id, factory_id)
);

-- Index บน factory_id สำหรับ query "โรงงาน X ได้รับ RFQ อะไรบ้าง"
CREATE INDEX IF NOT EXISTS idx_rfq_target_factories_factory
  ON rfq_target_factories(factory_id);

-- ============================================================
-- Rollback (ถ้าต้องการย้อน):
--
--   DROP TABLE IF EXISTS rfq_target_factories;
--   ALTER TABLE rfqs DROP COLUMN IF EXISTS targeting;
--
-- ============================================================
