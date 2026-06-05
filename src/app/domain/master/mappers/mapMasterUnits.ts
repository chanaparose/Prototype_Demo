export type MasterUnit = {
  id: number;
  name: string;
  groupKey: string;
  groupLabel: string;
};

export type UnitGroup = {
  key: string;
  label: string;
  units: { id: number; name: string }[];
};

const UNGROUPED_KEY = '__ungrouped__';
const UNGROUPED_LABEL = 'อื่นๆ';

export function parseMasterUnitRow(row: unknown): MasterUnit | null {
  if (!row || typeof row !== 'object') return null;
  const o = row as Record<string, unknown>;
  const id = Number(o.unit_id ?? o.id);
  const name = String(o.unit_name_th ?? o.name_th ?? o.unit_name ?? o.name ?? '').trim();
  const groupLabel = String(o.group_th ?? o.group_name ?? '').trim();
  if (!Number.isFinite(id) || id <= 0 || !name) return null;
  return {
    id,
    name,
    groupKey: groupLabel || UNGROUPED_KEY,
    groupLabel: groupLabel || UNGROUPED_LABEL,
  };
}

export function parseMasterUnits(raw: unknown[]): MasterUnit[] {
  return raw.map(parseMasterUnitRow).filter((u): u is MasterUnit => u != null);
}

export function buildUnitGroups(units: MasterUnit[]): UnitGroup[] {
  const map = new Map<string, { label: string; units: { id: number; name: string }[] }>();
  for (const u of units) {
    const bucket = map.get(u.groupKey);
    if (bucket) {
      bucket.units.push({ id: u.id, name: u.name });
    } else {
      map.set(u.groupKey, { label: u.groupLabel, units: [{ id: u.id, name: u.name }] });
    }
  }
  return Array.from(map.entries())
    .map(([key, { label, units: groupUnits }]) => ({
      key,
      label,
      units: groupUnits.sort((a, b) => a.name.localeCompare(b.name, 'th')),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'th'));
}

export function flattenUnitGroups(groups: UnitGroup[]): { id: number; name: string; groupTh?: string }[] {
  return groups.flatMap((g) =>
    g.units.map((u) => ({
      id: u.id,
      name: u.name,
      groupTh: g.key === UNGROUPED_KEY ? undefined : g.label,
    })),
  );
}

export function buildMasterUnitMap(raw: unknown[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const unit of parseMasterUnits(raw)) {
    map.set(unit.id, unit.name);
  }
  return map;
}

const DEFAULT_UNIT_LABEL = 'ชิ้น';

/** Resolve display label from API name and/or unit_id + master map */
export function resolveUnitLabel(
  unitId: number | null | undefined,
  unitName?: string | null,
  unitMap?: Map<number, string> | null,
  fallback = DEFAULT_UNIT_LABEL,
): string {
  const fromApi = String(unitName ?? '').trim();
  if (fromApi) return fromApi;
  const id = Number(unitId);
  if (Number.isFinite(id) && id > 0) {
    const fromMap = unitMap?.get(id);
    if (fromMap) return fromMap;
  }
  return fallback;
}
