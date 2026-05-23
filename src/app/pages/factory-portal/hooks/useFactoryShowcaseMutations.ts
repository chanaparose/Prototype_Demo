import { useQueryClient } from '@tanstack/react-query';
import { mediaApi, showcasesApi } from '@/services/api/factoryApi';
import { showcaseKeys } from '@/lib/queryKeys';
import { useAppMutation } from '@/hooks/useAppMutation';
import { mapLinkedShowcasesErrorToThai } from '@/utils/linkedShowcases';

export function useFactoryShowcaseMutations() {
  const qc = useQueryClient();

  const createShowcase = useAppMutation({
    mutationFn: (payload: Parameters<typeof showcasesApi.create>[0]) =>
      showcasesApi.create(payload),
    fallbackMessage: 'สร้างไม่สำเร็จ',
  });

  const uploadShowcaseImage = useAppMutation({
    mutationFn: (file: File) => mediaApi.upload(file),
    fallbackMessage: 'อัปโหลดรูปไม่สำเร็จ',
  });

  const deleteShowcaseImage = useAppMutation({
    mutationFn: ({ showcaseId, imageId }: { showcaseId: string; imageId: number }) =>
      showcasesApi.deleteImage(showcaseId, imageId),
    fallbackMessage: 'ลบรูปไม่สำเร็จ',
  });

  const updateShowcase = useAppMutation({
    mutationFn: async ({
      id,
      payload,
      imageUrls,
    }: {
      id: string;
      payload: Record<string, unknown>;
      imageUrls: string[];
    }) => {
      await showcasesApi.update(id, payload);
      const existingRaw = await showcasesApi.listImages(id).catch(() => []);
      const existing = (Array.isArray(existingRaw) ? existingRaw : [])
        .map((r) => {
          const row = (r ?? {}) as Record<string, unknown>;
          const imageId = Number(row.image_id ?? row.id ?? 0);
          const imageUrl = String(row.image_url ?? row.url ?? '').trim();
          const sortOrder = Number(row.sort_order ?? 0);
          if (!Number.isFinite(imageId) || imageId <= 0 || !imageUrl) return null;
          return { imageId, imageUrl, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0 };
        })
        .filter((x): x is { imageId: number; imageUrl: string; sortOrder: number } => x != null);

      const desiredUrls = imageUrls.slice(0, 5);
      const desiredSet = new Set(desiredUrls);
      const existingSet = new Set(existing.map((x) => x.imageUrl));

      await Promise.all(
        existing
          .filter((x) => !desiredSet.has(x.imageUrl))
          .map((x) => showcasesApi.deleteImage(id, x.imageId).catch(() => undefined)),
      );

      await Promise.all(
        desiredUrls
          .filter((url) => !existingSet.has(url))
          .map((url, idx) =>
            showcasesApi.addImage(id, { image_url: url, sort_order: idx + 1 }).catch(() => undefined),
          ),
      );

      const refreshedRaw = await showcasesApi.listImages(id).catch(() => []);
      const refreshed = (Array.isArray(refreshedRaw) ? refreshedRaw : [])
        .map((r) => {
          const row = (r ?? {}) as Record<string, unknown>;
          const imageId = Number(row.image_id ?? row.id ?? 0);
          const imageUrl = String(row.image_url ?? row.url ?? '').trim();
          const sortOrder = Number(row.sort_order ?? 0);
          if (!Number.isFinite(imageId) || imageId <= 0 || !imageUrl) return null;
          return { imageId, imageUrl, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0 };
        })
        .filter((x): x is { imageId: number; imageUrl: string; sortOrder: number } => x != null);

      await Promise.all(
        desiredUrls.map((url, idx) => {
          const row = refreshed.find((x) => x.imageUrl === url);
          if (!row) return Promise.resolve();
          const nextSort = idx + 1;
          if (row.sortOrder === nextSort) return Promise.resolve();
          return showcasesApi.updateImage(id, row.imageId, { sort_order: nextSort }).catch(() => undefined);
        }),
      );

      await Promise.all([
        qc.invalidateQueries({ queryKey: showcaseKeys.detail(id) }),
        qc.invalidateQueries({ queryKey: showcaseKeys.lists() }),
      ]);
    },
    fallbackMessage: 'บันทึกไม่สำเร็จ',
  });

  return {
    createShowcase,
    uploadShowcaseImage,
    deleteShowcaseImage,
    updateShowcase,
    mapLinkedError: mapLinkedShowcasesErrorToThai,
  };
}
