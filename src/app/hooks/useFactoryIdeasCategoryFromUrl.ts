import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

type Cat = { id: string; name: string };

function decodeCategoryParam(raw: string): string {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

// URL เป็น single source of truth สำหรับ category ที่เลือก
// - ไม่มี useState แยก — อ่าน/เขียนผ่าน searchParams โดยตรง
// - ไม่มี useEffect ที่ sync state ⟵ แก้ race-condition ที่ dropdown
// เคยไฮไลต์ id ผิดเมื่อ async deps เปลี่ยน
export function useFactoryIdeasCategorySelection(
  _contextCategories: Cat[],
  _masterCategories: Cat[],
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryIdFromUrl = useMemo(() => {
    const raw = searchParams.get('category_id') ?? searchParams.get('categoryId') ?? '';
    return raw === '' ? '' : decodeCategoryParam(raw);
  }, [searchParams]);

  const effectiveCategoryId = categoryIdFromUrl !== '' ? categoryIdFromUrl : 'all';

  const applyCategory = useCallback(
    (catId: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (catId === 'all') {
            next.delete('category_id');
            next.delete('categoryId');
            next.delete('category');
          } else {
            next.set('category_id', catId);
            next.delete('categoryId');
            next.delete('category');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return {
    selectedCategory: effectiveCategoryId,
    effectiveCategoryId,
    applyCategory,
    categoryIdFromUrl,
  };
}
