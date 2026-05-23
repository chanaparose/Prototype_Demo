import { unwrapApiEntity, type ApiRecord } from '@/lib/apiShape';

export function unwrapOrderFromApi(raw: unknown): ApiRecord {
  return unwrapApiEntity(raw, ['order']);
}
