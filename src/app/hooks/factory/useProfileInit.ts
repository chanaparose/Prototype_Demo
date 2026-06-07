import { useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/services/api/httpClient';
import { masterKeys } from '@/lib/queryKeys';
import type { CategoryOption } from '@/hooks/master/useLbiCategoriesByScope';
import type { CertTypeOption } from '@/hooks/master/useMasterCerts';
import type { SubCategoryOption } from '@/hooks/master/useSubCategoriesByCategory';

type Row = Record<string, unknown>;

interface ProfileInitData {
  factory: Row;
  lbi_categories: Row[];
  addresses: Row[];
  certificate_types: Row[];
  sub_categories: Row[];
}

export const profileInitKey = ['factory', 'me', 'profile-init'] as const;

export function useProfileInit() {
  const qc = useQueryClient();

  return useQuery({
    queryKey: profileInitKey,
    queryFn: async (): Promise<ProfileInitData> => {
      const data = await httpClient.get<ProfileInitData>('/factories/me/profile-init');

      // lbi_categories → split into ALL (with scope), PD, MT, productCategories
      type CategoryWithScope = CategoryOption & { scope: string };
      const allCats: CategoryWithScope[] = (data.lbi_categories ?? [])
        .map((r): CategoryWithScope | null => {
          const id = Number(r.category_id ?? r.id);
          const name = String(r.name ?? r.category_name ?? '').trim();
          const scope = String(r.scope ?? '');
          if (!Number.isFinite(id) || id <= 0 || !name) return null;
          return { id, name, scope };
        })
        .filter((x): x is CategoryWithScope => x != null)
        .sort((a, b) => a.name.localeCompare(b.name, 'th'));

      qc.setQueryData(masterKeys.lbiCategories('ALL'), allCats);
      qc.setQueryData(
        masterKeys.lbiCategories('PD'),
        allCats.filter((c) => c.scope === 'PD').map(({ id, name }) => ({ id, name })),
      );
      qc.setQueryData(
        masterKeys.lbiCategories('MT'),
        allCats.filter((c) => c.scope === 'MT').map(({ id, name }) => ({ id, name })),
      );
      qc.setQueryData(
        masterKeys.productCategories(),
        allCats.map(({ id, name }) => ({ id, name })),
      );

      // addresses → raw rows
      qc.setQueryData(['addresses', 'me'], data.addresses ?? []);

      // certificate_types → CertTypeOption[]
      const certs: CertTypeOption[] = (data.certificate_types ?? [])
        .map((r): CertTypeOption | null => {
          const id = Number(r.cert_id ?? r.id);
          const label = String(r.name_th ?? r.name ?? r.cert_name ?? '').trim();
          if (!Number.isFinite(id) || id <= 0 || !label) return null;
          return { id, label };
        })
        .filter((x): x is CertTypeOption => x != null);
      qc.setQueryData(masterKeys.certificates(), certs);

      // sub_categories → SubCategoryOption[] per categoryId
      const byCat = new Map<string, SubCategoryOption[]>();
      for (const s of data.sub_categories ?? []) {
        const id = Number(s.sub_category_id ?? s.id);
        const categoryId = Number(s.category_id);
        const name = String(s.name ?? s.sub_category_name ?? '').trim();
        if (
          !Number.isFinite(id) ||
          id <= 0 ||
          !name ||
          !Number.isFinite(categoryId) ||
          categoryId <= 0
        )
          continue;
        const cid = String(categoryId);
        const list = byCat.get(cid) ?? [];
        list.push({ id, name, categoryId });
        byCat.set(cid, list);
      }
      for (const [cid, subs] of byCat) {
        qc.setQueryData(
          masterKeys.subCategories(Number(cid)),
          subs.sort((a, b) => a.name.localeCompare(b.name, 'th')),
        );
      }

      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
