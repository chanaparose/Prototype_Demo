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
  contentType: 'product' | 'promotion' | 'idea';
  category: string;
  postedAt: string;
  likes: number;
  minOrder: number;
  leadTime: string;
  tags: string[];
};

const CT_MAP: Record<string, NormalisedShowcase['contentType']> = {
  PR: 'product', PM: 'promotion', ID: 'idea',
  product: 'product', promotion: 'promotion', idea: 'idea',
};

function normShowcase(r: Record<string, unknown>): NormalisedShowcase {
  return {
    id: String(r.showcase_id ?? r.id ?? ''),
    factoryId: String(r.factory_id ?? ''),
    factoryName: String(r.factory_name ?? r.factoryName ?? ''),
    title: String(r.title ?? ''),
    excerpt: String(r.excerpt ?? ''),
    image: String(r.image_url ?? r.image ?? ''),
    contentType: CT_MAP[String(r.content_type ?? '')] ?? 'product',
    category: String(r.category_name ?? r.category ?? ''),
    postedAt: String(r.created_at ?? r.postedAt ?? ''),
    likes: Number(r.likes_count ?? r.likes ?? 0),
    minOrder: Number(r.min_order ?? r.minOrder ?? 0),
    leadTime: String(r.lead_time ?? r.leadTime ?? ''),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
  };
}

type NormFactory = {
  id: string; name: string; image: string; location: string;
  rating: number; reviews: number; minOrder: number;
  priceRange: string; verified: boolean;
};

function normFactory(r: Record<string, unknown>): NormFactory {
  return {
    id: String(r.factory_id ?? r.id ?? ''),
    name: String(r.factory_name ?? r.name ?? ''),
    image: String(r.image_url ?? r.image ?? r.logo_url ?? ''),
    location: String(r.province_name ?? r.location ?? ''),
    rating: Number(r.avg_rating ?? r.rating ?? 0),
    reviews: Number(r.review_count ?? r.reviews ?? 0),
    minOrder: Number(r.min_order ?? r.minOrder ?? 0),
    priceRange: String(r.price_range ?? r.priceRange ?? ''),
    verified: Boolean(r.is_verified ?? r.verified ?? false),
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

  const [showcases, setShowcases] = React.useState<NormalisedShowcase[]>([]);
  const [factories, setFactories] = React.useState<NormFactory[]>([]);
  const [ideaArticles, setIdeaArticles] = React.useState<NormArticle[]>([]);
  const [promoSlides, setPromoSlides] = React.useState<NormSlide[]>([]);
  const [promoCodes, setPromoCodes] = React.useState<NormSlide[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!enablePageApis) {
      setShowcases([]); setFactories([]); setIdeaArticles([]);
      setPromoSlides([]); setPromoCodes([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function fetchAll() {
      // 1) Showcases → /showcases
      const p1 = showcasesApi.list().then((raw) => {
        if (cancelled) return;
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        setShowcases(arr.map(normShowcase).filter((s) => s.id && s.title));
      }).catch(() => {});

      // 2) Explore aggregate → factories, idea_articles, promo_codes
      const p2 = frontendApi.getExplore().then((data) => {
        if (cancelled) return;
        const f = (Array.isArray(data.factories) ? data.factories : []) as Record<string, unknown>[];
        setFactories(f.map(normFactory).filter((v) => v.id && v.name));
        const i = (Array.isArray(data.idea_articles) ? data.idea_articles : []) as Record<string, unknown>[];
        setIdeaArticles(i.map(normArticle).filter((v) => v.id && v.title));
        const c = (Array.isArray(data.promo_codes) ? data.promo_codes : []) as Record<string, unknown>[];
        setPromoCodes(c.map(normSlide).filter((v) => v.id && v.title));
      }).catch(() => {
        // fallback: try individual factory endpoint
        if (!cancelled) {
          frontendApi.getFactories().then((raw) => {
            if (cancelled) return;
            const f = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
            setFactories(f.map(normFactory).filter((v) => v.id && v.name));
          }).catch(() => {});
        }
      });

      // 3) Promo slides → /promo-slides
      const p3 = promoSlidesApi.list().then((raw) => {
        if (cancelled) return;
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        setPromoSlides(arr.map(normSlide).filter((s) => s.id && s.title));
      }).catch(() => {});

      await Promise.allSettled([p1, p2, p3]);
      if (!cancelled) setIsLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [enablePageApis]);

  const productShowcases = React.useMemo(
    () => showcases.filter((s) => s.contentType === 'product'),
    [showcases],
  );

  const promotionShowcases = React.useMemo(
    () => showcases.filter((s) => s.contentType === 'promotion'),
    [showcases],
  );

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

    // API-only data
    factories,
    ideaArticles,
    productShowcases,
    promotionShowcases,
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
