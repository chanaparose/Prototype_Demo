import { useEffect, useMemo, useState } from 'react';
import { useLbiCategoriesByScope } from '@/hooks/master/useLbiCategoriesByScope';
import { useSubCategoriesByCategories } from '@/hooks/master/useSubCategoriesByCategory';
import type { ShowcaseSubmitStatus, ShowcaseType } from '@/constants/showcase';

export type { ShowcaseSubmitStatus };

type MaybeNumber = number | string | null | undefined;

export type ShowcasePayloadValues = {
  content_type?: ShowcaseType;
  title?: string;
  excerpt?: string;
  content?: string;
  category_id?: MaybeNumber;
  sub_category_id?: MaybeNumber;
  moq?: MaybeNumber;
  lead_time_days?: MaybeNumber;
  base_price?: MaybeNumber;
  promo_price?: MaybeNumber;
  start_date?: string;
  end_date?: string;
};

type BuildPayloadOptions = {
  contentType: ShowcaseType;
  status: ShowcaseSubmitStatus;
  values: ShowcasePayloadValues;
  imageUrls: string[];
  selectedShowcaseIds: number[];
};

function optionalNumber(value: MaybeNumber): number | undefined {
  if (value === '' || value == null) return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = String(value ?? '').trim();
  return trimmed || undefined;
}

export function buildShowcasePayload({
  contentType,
  status,
  values,
  imageUrls,
  selectedShowcaseIds,
}: BuildPayloadOptions): Record<string, unknown> {
  const base = {
    content_type: contentType,
    status,
    title: String(values.title ?? '').trim(),
    excerpt: contentType !== 'ID' ? optionalText(values.excerpt) : undefined,
    content: optionalText(values.content),
    image_url: imageUrls[0] || undefined,
    category_id: optionalNumber(values.category_id),
    sub_category_id: optionalNumber(values.sub_category_id),
    lead_time_days: optionalNumber(values.lead_time_days),
    linked_showcases: [...imageUrls, ...selectedShowcaseIds],
  };

  if (contentType === 'ID') return base;

  const withPrice = {
    ...base,
    moq: optionalNumber(values.moq),
    base_price: optionalNumber(values.base_price),
  };

  if (contentType !== 'PM') return withPrice;

  return {
    ...withPrice,
    promo_price: optionalNumber(values.promo_price),
    start_date: optionalText(values.start_date),
    end_date: optionalText(values.end_date),
  };
}

export function validateShowcaseSubmission(
  values: ShowcasePayloadValues,
  opts: {
    contentType: ShowcaseType;
    status: ShowcaseSubmitStatus;
    imageCount: number;
    requireTitle?: boolean;
  },
): string | null {
  if (opts.requireTitle && !String(values.title ?? '').trim()) {
    return 'กรุณากรอกชื่อรายการ';
  }

  if (opts.status === 'AC' && opts.contentType !== 'ID' && opts.imageCount === 0) {
    return 'กรุณาอัปโหลดภาพปกอย่างน้อย 1 รูปก่อนเผยแพร่';
  }

  if (opts.contentType !== 'PM') return null;

  if (opts.status === 'AC' && !optionalNumber(values.promo_price)) {
    return 'กรุณากรอกราคาโปรโมชันให้มากกว่า 0';
  }

  const basePrice = optionalNumber(values.base_price);
  const promoPrice = optionalNumber(values.promo_price);
  if (opts.status === 'AC' && basePrice && promoPrice && promoPrice > basePrice) {
    return 'ราคาโปรโมชันต้องไม่มากกว่าราคาปกติ';
  }

  if (!values.start_date || !values.end_date) {
    return 'โปรโมชันต้องมีวันเริ่มและวันสิ้นสุด';
  }
  if (values.end_date < values.start_date) {
    return 'วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่ม';
  }

  return null;
}

export function useShowcaseCategoryOptions({
  contentType,
  selectedCategoryId,
}: {
  contentType: ShowcaseType;
  selectedCategoryId: number | null;
}) {
  const [idScope, setIdScope] = useState<'PD' | 'MT'>('PD');
  const [pmScope, setPmScope] = useState<'PD' | 'MT'>('PD');

  const categoryScope: 'PD' | 'MT' =
    contentType === 'MT'
      ? 'MT'
      : contentType === 'ID'
        ? idScope
        : contentType === 'PM'
          ? pmScope
          : 'PD';

  const categoriesQ = useLbiCategoriesByScope(categoryScope);
  const pdCategoriesQ = useLbiCategoriesByScope('PD');
  const mtCategoriesQ = useLbiCategoriesByScope('MT');
  const subIds = useMemo(
    () => (contentType !== 'MT' && selectedCategoryId != null ? [selectedCategoryId] : []),
    [contentType, selectedCategoryId],
  );
  const subsResult = useSubCategoriesByCategories(subIds);
  const subOptions =
    selectedCategoryId != null ? (subsResult.byCategory.get(selectedCategoryId) ?? []) : [];

  useEffect(() => {
    if (selectedCategoryId == null) return;

    const pdIds = new Set((pdCategoriesQ.data ?? []).map((category) => category.id));
    const mtIds = new Set((mtCategoriesQ.data ?? []).map((category) => category.id));

    if (contentType === 'ID') {
      if (mtIds.has(selectedCategoryId) && idScope !== 'MT') setIdScope('MT');
      else if (pdIds.has(selectedCategoryId) && idScope !== 'PD') setIdScope('PD');
      return;
    }

    if (contentType === 'PM') {
      if (mtIds.has(selectedCategoryId) && pmScope !== 'MT') setPmScope('MT');
      else if (pdIds.has(selectedCategoryId) && pmScope !== 'PD') setPmScope('PD');
    }
  }, [contentType, idScope, mtCategoriesQ.data, pdCategoriesQ.data, pmScope, selectedCategoryId]);

  return {
    idScope,
    pmScope,
    setIdScope,
    setPmScope,
    categoriesQ,
    subOptions,
    subsResult,
  };
}
