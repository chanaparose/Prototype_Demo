BEGIN;

ALTER TABLE factory_showcases
  ADD COLUMN IF NOT EXISTS unit_id BIGINT REFERENCES lbi_units(unit_id);

CREATE INDEX IF NOT EXISTS idx_factory_showcases_unit_id
  ON factory_showcases(unit_id);

COMMIT;
