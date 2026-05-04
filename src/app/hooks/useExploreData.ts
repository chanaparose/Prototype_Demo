import React from 'react';
import { frontendApi, promoSlidesApi, showcasesApi } from '../services/api';
import { useExploreCategoriesFromApi } from './useExploreCategoriesFromApi';

type UseExploreDataOptions = { enablePageApis?: boolean };

/* ─── normaliser helpers ─── */

type NormalisedShowcase = {
  id: string;
  factoryId: string;
  factoryName: string;
  title: string;
  excerpt: string;
  image: string;
  contentType: 'product' | 'promotion' | 'idea' | 'material';
  category: string;
  subCategoryName: string;
  postedAt: string;
  likes: number;
  minOrder: number;
  leadTime: string;
  tags: string[];
};

const CT_MAP: Record<string, NormalisedShowcase['contentType']> = {
  PD: 'product',
  PR: 'product',
  PM: 'promotion',
  ID: 'idea',
  MT: 'material',
  product: 'product',
  promotion: 'promotion',
  idea: 'idea',
  material: 'material',
};

function parseImageUrls(raw: unknown): string[] {
  const src = Array.isArray(raw)
    ? raw
    : typeof raw === 'string' && raw.trim().startsWith('[')
      ? (() => {
          try {
            const p = JSON.parse(raw) as unknown;
            return Array.isArray(p) ? p : [];
          } catch {
            return [];
          }
        })()
      : [];
  return src
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (!item || typeof item !== 'object') return '';
      const row = item as Record<string, unknown>;
      return String(row.url ?? row.image_url ?? row.public_url ?? '').trim();
    })
    .filter((u) => u !== '')
    .slice(0, 5);
}

function firstImageFromUnknown(raw: unknown): string {
  if (typeof raw === 'string') {
    return raw.trim();
  }
  if (!raw || typeof raw !== 'object') return '';
  const row = raw as Record<string, unknown>;
  const direct = String(
    row.image_url ??
      row.image ??
      row.url ??
      row.public_url ??
      row.thumbnail_url ??
      row.cover_image_url ??
      '',
  ).trim();
  if (direct) return direct;
  const nested = parseImageUrls(row.images ?? row.image_urls ?? row.imageUrls);
  return nested[0] ?? '';
}

function parseLinkedShowcasesFirstImage(raw: unknown): string {
  const arr = Array.isArray(raw)
    ? raw
    : typeof raw === 'string' && raw.trim().startsWith('[')
      ? (() => {
          try {
            const parsed = JSON.parse(raw) as unknown;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];
  for (const item of arr) {
    const u = firstImageFromUnknown(item);
    if (u) return u;
  }
  return '';
}

function normShowcase(r: Record<string, unknown>): NormalisedShowcase {
  const imageUrls = parseImageUrls(r.images ?? r.image_urls ?? r.imageUrls);
  const linkedFirstImage = parseLinkedShowcasesFirstImage(
    r.linked_showcases ?? r.linkedShowcases,
  );
  const ctRaw = String(r.content_type ?? r.type ?? '').trim().toUpperCase();
  return {
    id: String(r.showcase_id ?? r.id ?? ''),
    factoryId: String(r.factory_id ?? ''),
    factoryName: String(r.factory_name ?? r.factoryName ?? ''),
    title: String(r.title ?? ''),
    excerpt: String(r.excerpt ?? ''),
    image:
      ctRaw === 'PD' || ctRaw === 'PR' || ctRaw === 'PM' || ctRaw === 'MT'
        ? linkedFirstImage || imageUrls[0] || String(r.image_url ?? r.image ?? '')
        : imageUrls[0] || linkedFirstImage || String(r.image_url ?? r.image ?? ''),
    contentType: CT_MAP[String(r.content_type ?? '')] ?? 'product',
    category: String(r.category_name ?? r.category ?? ''),
    subCategoryName: String(r.sub_category_name ?? r.subCategoryName ?? ''),
    postedAt: String(r.created_at ?? r.postedAt ?? ''),
    likes: Number(r.likes_count ?? r.likes ?? 0),
    minOrder: Number(r.moq ?? r.min_order ?? r.minOrder ?? 0),
    leadTime: String(r.lead_time ?? r.leadTime ?? ''),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
  };
}

type NormArticle = {
  id: string; title: string; excerpt: string;
  image: string; tag: string; factoryName: string;
};

function normArticle(r: Record<string, unknown>): NormArticle {
  return {
    id: String(r.showcase_id ?? r.id ?? ''),
    title: String(r.title ?? ''),
    excerpt: String(r.excerpt ?? r.description ?? ''),
    image: String(r.image_url ?? r.image ?? ''),
    tag: String(r.tag ?? r.category_name ?? r.category ?? ''),
    factoryName: String(r.factory_name ?? r.factoryName ?? ''),
  };
}

type NormSlide = { id: string; title: string; subtitle: string; code: string };

function normSlide(r: Record<string, unknown>): NormSlide {
  return {
    id: String(r.slide_id ?? r.id ?? ''),
    title: String(r.title ?? ''),
    subtitle: String(r.subtitle ?? ''),
    code: String(r.code ?? ''),
  };
}

/* ─── hook ─── */

export function useExploreData(options?: UseExploreDataOptions) {
  const enablePageApis = options?.enablePageApis !== false;
  const {
    merged: exploreCategoriesMerged,
    loading: exploreCategoriesLoading,
    error: exploreCategoriesError,
    reload: reloadExploreCategories,
  } = useExploreCategoriesFromApi({ enabled: enablePageApis });

  const [searchText, setSearchText] = React.useState('');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  /** รวม PD+PM+ID+MT สำหรับ prop factoryShowcases (เผื่อใช้ในอนาคต) */
  const [pdShowcases, setPdShowcases] = React.useState<NormalisedShowcase[]>([]);
  const [pmShowcases, setPmShowcases] = React.useState<NormalisedShowcase[]>([]);
  const [idShowcases, setIdShowcases] = React.useState<NormalisedShowcase[]>([]);
  const [mtShowcases, setMtShowcases] = React.useState<NormalisedShowcase[]>([]);
  const [promoSlides, setPromoSlides] = React.useState<NormSlide[]>([]);
  const [promoCodes, setPromoCodes] = React.useState<NormSlide[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!enablePageApis) {
      setPdShowcases([]);
      setPmShowcases([]);
      setIdShowcases([]);
      setMtShowcases([]);
      setPromoSlides([]);
      setPromoCodes([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function fetchAll() {
      const mapRows = (raw: unknown) => {
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        return arr.map(normShowcase).filter((s) => s.id && s.title);
      };

      // สินค้าแนะนำ → GET /showcases?type=PD
      const pPd = showcasesApi
        .list('PD')
        .then((raw) => {
          if (cancelled) return;
          setPdShowcases(mapRows(raw));
        })
        .catch(() => {
          if (!cancelled) setPdShowcases([]);
        });

      // โปรโมชันแนะนำ → GET /showcases?type=PM
      const pPm = showcasesApi
        .list('PM')
        .then((raw) => {
          if (cancelled) return;
          setPmShowcases(mapRows(raw));
        })
        .catch(() => {
          if (!cancelled) setPmShowcases([]);
        });

      // บทความ idea → GET /showcases?type=ID
      const pId = showcasesApi
        .list('ID')
        .then((raw) => {
          if (cancelled) return;
          setIdShowcases(mapRows(raw));
        })
        .catch(() => {
          if (!cancelled) setIdShowcases([]);
        });

      // วัตถุดิบ → GET /showcases?type=MT
      const pMt = showcasesApi
        .list('MT')
        .then((raw) => {
          if (cancelled) return;
          setMtShowcases(mapRows(raw));
        })
        .catch(() => {
          if (!cancelled) setMtShowcases([]);
        });

      // 2) Explore aggregate → promo_codes เท่านั้น (การ์ดโรงงานมาจาก GET /frontend/bootstrap ใน DataContext)
      const p2 = frontendApi
        .getExplore()
        .then((data) => {
          if (cancelled) return;
          const c = (Array.isArray(data.promo_codes) ? data.promo_codes : []) as Record<string, unknown>[];
          setPromoCodes(c.map(normSlide).filter((v) => v.id && v.title));
        })
        .catch(() => {});

      // 3) Promo slides → /promo-slides
      const p3 = promoSlidesApi.list().then((raw) => {
        if (cancelled) return;
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        setPromoSlides(arr.map(normSlide).filter((s) => s.id && s.title));
      }).catch(() => {});

      await Promise.allSettled([pPd, pPm, pId, pMt, p2, p3]);
      if (!cancelled) setIsLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [enablePageApis]);

  const productShowcases = React.useMemo(() => pdShowcases, [pdShowcases]);

  const promotionShowcases = React.useMemo(() => pmShowcases, [pmShowcases]);

  const materialShowcases = React.useMemo(() => mtShowcases, [mtShowcases]);

  const ideaArticles = React.useMemo(
    () =>
      idShowcases.map(
        (s): NormArticle => ({
          id: s.id,
          title: s.title,
          excerpt: s.excerpt,
          image: s.image,
          tag: s.category,
          factoryName: s.factoryName,
        }),
      ),
    [idShowcases],
  );

  const showcases = React.useMemo(() => {
    const byId = new Map<string, NormalisedShowcase>();
    for (const s of [...pdShowcases, ...pmShowcases, ...idShowcases, ...mtShowcases]) {
      if (!byId.has(s.id)) byId.set(s.id, s);
    }
    return [...byId.values()];
  }, [pdShowcases, pmShowcases, idShowcases, mtShowcases]);

  const allPromoSlides = React.useMemo(() => {
    const merged = [...promoSlides, ...promoCodes];
    const seen = new Set<string>();
    return merged.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [promoSlides, promoCodes]);

  return {
    searchText, setSearchText,
    copiedId, setCopiedId,

    // API-only data (โรงงานบน Explore → useData().factories จาก bootstrap)
    ideaArticles,
    productShowcases,
    promotionShowcases,
    materialShowcases,
    showcases,
    promoSlides: allPromoSlides,

    // Categories
    categories: exploreCategoriesMerged,
    exploreCategoriesMerged,
    exploreCategoriesLoading,
    exploreCategoriesError,
    reloadExploreCategories,

    isLoading,
  };
}
