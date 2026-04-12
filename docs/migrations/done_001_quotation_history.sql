-- =====================================================================
-- Migration 001: Quotation Audit Log + Edit Lock + Order Activity Log
-- Wemake Platform — Phase 1.5
-- Date: 2026-04-07
-- Dialect: PostgreSQL
-- =====================================================================

BEGIN;

-- ─── 1) เพิ่ม fields ใน quotations ─────────────────────────────────────
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS version        INTEGER     NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_locked      BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP   NULL,
  ADD COLUMN IF NOT EXISTS last_edited_by INTEGER     NULL
    REFERENCES users(user_id);

COMMENT ON COLUMN quotations.version        IS 'เวอร์ชันใบเสนอราคา bump ทุกครั้งที่ PATCH';
COMMENT ON COLUMN quotations.is_locked      IS 'TRUE หลัง customer accept (status=AC) — ห้ามแก้';
COMMENT ON COLUMN quotations.last_edited_at IS 'เวลาที่แก้ไขล่าสุด';
COMMENT ON COLUMN quotations.last_edited_by IS 'user ที่แก้ไขล่าสุด';

-- ─── 2) ตาราง quotation_history (audit log การแก้ไข) ──────────────────
CREATE TABLE IF NOT EXISTS quotation_history (
  history_id   SERIAL      PRIMARY KEY,
  quote_id     INTEGER     NOT NULL REFERENCES quotations(quote_id) ON DELETE CASCADE,
  version      INTEGER     NOT NULL,
  changed_by   INTEGER     NOT NULL REFERENCES users(user_id),
  change_type  CHAR(2)     NOT NULL,  -- CR=Create, UP=Update, ST=StatusChange, DL=Delete
  field_name   VARCHAR(50) NULL,
  old_value    TEXT        NULL,
  new_value    TEXT        NULL,
  snapshot     JSONB       NULL,
  reason       TEXT        NULL,
  ip_address   VARCHAR(45) NULL,
  user_agent   TEXT        NULL,
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qhist_quote ON quotation_history (quote_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qhist_user  ON quotation_history (changed_by, created_at DESC);

COMMENT ON COLUMN quotation_history.change_type IS 'CR=Create, UP=Update, ST=StatusChange, DL=Delete';
COMMENT ON COLUMN quotation_history.field_name  IS 'field ที่เปลี่ยน (NULL = snapshot ทั้งใบ)';
COMMENT ON COLUMN quotation_history.snapshot    IS 'snapshot ทั้งใบเสนอราคา ณ เวลานั้น';
COMMENT ON COLUMN quotation_history.reason      IS 'เหตุผลที่ผู้ใช้ระบุตอนแก้ไข';

-- ─── 3) ตาราง order_activity_log (audit log ฝั่ง order) ───────────────
CREATE TABLE IF NOT EXISTS order_activity_log (
  log_id       SERIAL      PRIMARY KEY,
  order_id     INTEGER     NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  actor_id     INTEGER     NOT NULL REFERENCES users(user_id),
  actor_role   CHAR(2)     NOT NULL,  -- CU=Customer, FT=Factory, AD=Admin, SY=System
  action_type  VARCHAR(40) NOT NULL,  -- CREATE, STATUS_CHANGE, PRODUCTION_UPDATE, SHIPPING, PAYMENT, NOTE
  from_value   VARCHAR(255) NULL,
  to_value     VARCHAR(255) NULL,
  metadata     JSONB       NULL,
  note         TEXT        NULL,
  ip_address   VARCHAR(45) NULL,
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oalog_order ON order_activity_log (order_id, created_at DESC);

COMMENT ON COLUMN order_activity_log.actor_role  IS 'CU=Customer, FT=Factory, AD=Admin, SY=System';
COMMENT ON COLUMN order_activity_log.action_type IS 'CREATE, STATUS_CHANGE, PRODUCTION_UPDATE, SHIPPING, PAYMENT, NOTE';

-- ─── 4) Trigger function: บันทึก quotation_history อัตโนมัติ ──────────
CREATE OR REPLACE FUNCTION trg_quotation_log_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO quotation_history (quote_id, version, changed_by, change_type, snapshot)
    VALUES (
      NEW.quote_id,
      1,
      NEW.factory_id,
      'CR',
      jsonb_build_object(
        'price_per_piece',    NEW.price_per_piece,
        'mold_cost',          NEW.mold_cost,
        'lead_time_days',     NEW.lead_time_days,
        'shipping_method_id', NEW.shipping_method_id,
        'status',             NEW.status
      )
    );
    RETURN NEW;
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.price_per_piece     IS DISTINCT FROM NEW.price_per_piece)
    OR (OLD.mold_cost           IS DISTINCT FROM NEW.mold_cost)
    OR (OLD.lead_time_days      IS DISTINCT FROM NEW.lead_time_days)
    OR (OLD.shipping_method_id  IS DISTINCT FROM NEW.shipping_method_id)
    OR (OLD.status              IS DISTINCT FROM NEW.status) THEN
      INSERT INTO quotation_history (quote_id, version, changed_by, change_type, snapshot)
      VALUES (
        NEW.quote_id,
        NEW.version,
        COALESCE(NEW.last_edited_by, NEW.factory_id),
        CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'ST' ELSE 'UP' END,
        jsonb_build_object(
          'price_per_piece',    NEW.price_per_piece,
          'mold_cost',          NEW.mold_cost,
          'lead_time_days',     NEW.lead_time_days,
          'shipping_method_id', NEW.shipping_method_id,
          'status',             NEW.status
        )
      );
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quotation_after_change ON quotations;
CREATE TRIGGER trg_quotation_after_change
AFTER INSERT OR UPDATE ON quotations
FOR EACH ROW
EXECUTE FUNCTION trg_quotation_log_changes();

COMMIT;

-- =====================================================================
-- Backend endpoints ที่ต้อง implement หลัง migration นี้:
--   PATCH  /api/v1/quotations/:id              — เช็ค is_locked, bump version, set last_edited_*
--   GET    /api/v1/quotations/:id/history      — list quotation_history (DESC)
--   GET    /api/v1/quotations/me               — list quotations ของ factory
--   GET    /api/v1/orders/:id/activity         — list order_activity_log
-- =====================================================================
