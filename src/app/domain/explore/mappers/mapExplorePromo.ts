import { apiListAsRecords, asRecord } from '@/lib/apiShape';
import { pickScalarString } from '@/utils/pickScalarString';

export type ExplorePromoSlide = {
  id: string;
  title: string;
  subtitle: string;
  code: string;
};

export function mapExplorePromoSlide(raw: unknown): ExplorePromoSlide | null {
  const row = asRecord(raw);
  const id = pickScalarString(row.slide_id, row.id);
  const title = pickScalarString(row.title);
  if (!id || !title) return null;
  return {
    id,
    title,
    subtitle: pickScalarString(row.subtitle),
    code: pickScalarString(row.code),
  };
}

export function mapExplorePromoSlides(raw: unknown): ExplorePromoSlide[] {
  return apiListAsRecords(raw).map(mapExplorePromoSlide).filter((s): s is ExplorePromoSlide => s != null);
}
