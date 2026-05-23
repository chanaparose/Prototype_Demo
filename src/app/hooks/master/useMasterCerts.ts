import { useQuery } from '@tanstack/react-query';
import { apiListAsRecords, type ApiRecord } from '@/lib/apiShape';
import { masterKeys } from '@/lib/queryKeys';
import { masterApi } from '@/services/api/masterApi';

export interface CertTypeOption {
  id: number;
  label: string;
}

export function useMasterCerts() {
  return useQuery({
    queryKey: masterKeys.certificates(),
    queryFn: async () => {
      const raw = await masterApi.certificates();
      return apiListAsRecords(raw)
        .map((r: ApiRecord): CertTypeOption | null => {
          const id = Number(r.cert_id ?? r.id);
          const label = String(r.name_th ?? r.name ?? r.cert_name ?? '').trim();
          if (!Number.isFinite(id) || id <= 0 || !label) return null;
          return { id, label };
        })
        .filter((x): x is CertTypeOption => x != null);
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}
