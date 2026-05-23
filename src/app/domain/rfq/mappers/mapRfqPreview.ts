import { asRecord } from '@/lib/apiShape';
import { pickScalarNumber } from '@/utils/pickScalarString';

export function mapPreviewFactoryMatchCount(raw: unknown): number {
  const row = asRecord(raw);
  const n = pickScalarNumber(
    row.match_count,
    row.count,
    row.total,
    row.matched_factory_count,
  );
  return n ?? 0;
}
