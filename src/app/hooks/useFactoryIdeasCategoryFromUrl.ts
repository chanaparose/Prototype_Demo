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

/**
 * URL เป็น single source of truth สำหรับ category / sub-category ที่เลือก
 *
 * - ไม่มี useState แยก — อ่าน/เขียนผ่าน searchParams โดยตรง
 * - ไม่มี useEffect ที่ sync state ⟵ แก้ race-condition ที่ dropdown
 *   เคยไฮไลต์ id ผิดเมื่อ async deps เปลี่ยน
 */
export function useFactoryIdeasCategorySelection(
  _contextCategories: Cat[],
  _masterCategories: Cat[],
) {
  const [searchParams, setSearchParams] = useSearchParams();

  /** category id จาก ?category_id= หรือ ?categoryId= — '' ถ้าไม่มี */
  const categoryIdFromUrl = useMemo(() => {
    const raw = searchParams.get('category_id') ?? searchParams.get('categoryId') ?? '';
    return raw === '' ? '' : decodeCategoryParam(raw);
  }, [searchParams]);

  /** ถ้า URL มี category_id ใช้ค่านั้น ไม่งั้นแสดงทุกหมวด */
  const effectiveCategoryId = categoryIdFromUrl !== '' ? categoryIdFromUrl : 'all';

  /** sub-category id จาก ?sub_category_id= — null ถ้าไม่มี */
  const selectedSubCategoryId = useMemo(() => {
    const raw =
      searchParams.get('sub_category_id') ?? searchParams.get('subCategoryId') ?? '';
    return raw === '' ? null : decodeCategoryParam(raw);
  }, [searchParams]);

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
          // Changing category clears sub-filter
          next.delete('sub_category_id');
          next.delete('subCategoryId');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setSelectedSubCategoryId = useCallback(
    (subId: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (subId) {
            next.set('sub_category_id', subId);
            next.delete('subCategoryId');
          } else {
            next.delete('sub_category_id');
            next.delete('subCategoryId');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /** Set category + sub in one URL update (avoids race when picking a sub under a new category). */
  const applyCategoryAndSub = useCallback(
    (catId: string, subId: string | null) => {
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
          if (subId) {
            next.set('sub_category_id', subId);
            next.delete('subCategoryId');
          } else {
            next.delete('sub_category_id');
            next.delete('subCategoryId');
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
    applyCategoryAndSub,
    categoryIdFromUrl,
    selectedSubCategoryId,
    setSelectedSubCategoryId,
  };
}
