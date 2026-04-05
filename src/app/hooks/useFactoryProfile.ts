import React from 'react';
import { useParams } from 'react-router';
import { useData } from '../contexts/DataContext';
import type {
  Factory,
  FactoryProfile,
  FactoryReview,
  FactoryShowcase,
  IdeaArticle,
} from '../contexts/DataContext';
import type { TabId } from '../components/features/factory-profile';
import { conversationsApi, frontendApi } from '../services/api';
import { normShowcase } from './useShowcases';

function mapFactoryFromApi(row: Record<string, unknown>, id: string, fallback?: Factory | null): Factory {
  const b = fallback ?? undefined;
  return {
    id: String(row.id ?? row.factory_id ?? id),
    name: String(row.name ?? row.factory_name ?? b?.name ?? ''),
    location: String(row.province_name ?? row.location ?? row.city ?? b?.location ?? ''),
    rating: Number(row.avg_rating ?? row.rating ?? b?.rating ?? 0),
    reviews: Number(row.review_count ?? row.reviews ?? b?.reviews ?? 0),
    specialization: String(row.specialization ?? row.description ?? b?.specialization ?? ''),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : (b?.tags ?? []),
    minOrder: Number(row.min_order ?? row.minOrder ?? b?.minOrder ?? 0),
    leadTime: String(row.lead_time ?? row.leadTime ?? b?.leadTime ?? ''),
    image: String(row.image_url ?? row.image ?? row.logo_url ?? row.cover_url ?? b?.image ?? ''),
    verified: Boolean(row.is_verified ?? row.verified ?? b?.verified ?? false),
    completedOrders: Number(row.completed_orders ?? row.completedOrders ?? b?.completedOrders ?? 0),
    priceRange: String(row.price_range ?? row.priceRange ?? b?.priceRange ?? ''),
  };
}

function mapProfileFromApi(
  p: Record<string, unknown>,
  factoryId: string,
  fallback?: FactoryProfile | null,
): FactoryProfile {
  const b = fallback;
  const addr = String(p.address ?? p.address_detail ?? b?.address ?? '');
  const types = Array.isArray(p.accepted_product_types)
    ? p.accepted_product_types.map(String)
    : Array.isArray(p.acceptedProductTypes)
      ? p.acceptedProductTypes.map(String)
      : (b?.acceptedProductTypes ?? []);
  const certs = Array.isArray(p.certificates) ? p.certificates.map(String) : (b?.certificates ?? []);
  return {
    factoryId: String(p.factory_id ?? factoryId),
    address: addr,
    acceptedProductTypes: types,
    certificates: certs,
  };
}

function mapReviewFromApi(r: Record<string, unknown>, factoryId: string): FactoryReview | null {
  const rid = String(r.id ?? r.review_id ?? '');
  if (!rid) return null;
  return {
    id: rid,
    factoryId,
    reviewer: String(r.reviewer_name ?? r.reviewer ?? r.user_name ?? ''),
    rating: Number(r.rating ?? 0),
    comment: String(r.comment ?? r.text ?? ''),
    date: String(r.created_at ?? r.date ?? ''),
  };
}

type ApiDetailState =
  | { status: 'loading' }
  | {
      status: 'ok';
      factory: Factory;
      profile: FactoryProfile | null;
      reviews: FactoryReview[];
      showcases: FactoryShowcase[];
    }
  | { status: 'error' };

export function useFactoryProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = React.useState<TabId>('products');
  const [startingConversation, setStartingConversation] = React.useState(false);
  const data = useData();
  const [api, setApi] = React.useState<ApiDetailState>({ status: 'loading' });

  const factoriesRef = React.useRef(data.factories);
  const profilesRef = React.useRef(data.factoryProfiles);
  factoriesRef.current = data.factories;
  profilesRef.current = data.factoryProfiles;

  React.useEffect(() => {
    if (!id) {
      setApi({ status: 'error' });
      return;
    }
    setApi({ status: 'loading' });
    let cancelled = false;

    frontendApi
      .getFactory(id)
      .then((res) => {
        if (cancelled) return;
        const fid = String(id);
        const rawF = (res.factory && typeof res.factory === 'object' ? res.factory : {}) as Record<
          string,
          unknown
        >;
        const fb = factoriesRef.current.find((f) => String(f.id) === fid);
        const factory = mapFactoryFromApi(rawF, fid, fb);

        const rawP =
          res.profile && typeof res.profile === 'object' ? (res.profile as Record<string, unknown>) : null;
        const profFallback = profilesRef.current.find((p) => String(p.factoryId) === fid);
        const profile =
          rawP && Object.keys(rawP).length > 0
            ? mapProfileFromApi(rawP, fid, profFallback ?? null)
            : (profFallback ?? null);

        const revRows = Array.isArray(res.reviews) ? (res.reviews as Record<string, unknown>[]) : [];
        const reviews: FactoryReview[] = revRows
          .map((r) => mapReviewFromApi(r, fid))
          .filter((x): x is FactoryReview => x != null);

        const showcases: FactoryShowcase[] = [];
        for (const key of ['products', 'promotions', 'ideas'] as const) {
          const arr = res[key];
          if (Array.isArray(arr)) {
            for (const raw of arr) {
              const s = normShowcase(raw as Record<string, unknown>);
              if (s.id && s.title) {
                if (!s.factoryId) s.factoryId = fid;
                showcases.push(s);
              }
            }
          }
        }

        setApi({ status: 'ok', factory, profile, reviews, showcases });
      })
      .catch(() => {
        if (!cancelled) setApi({ status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const contextFactory = React.useMemo(
    () => data.factories.find((f) => String(f.id) === String(id)),
    [data.factories, id],
  );

  const factory = api.status === 'ok' ? api.factory : contextFactory ?? null;
  const profile =
    api.status === 'ok'
      ? api.profile
      : (data.factoryProfiles.find((p) => String(p.factoryId) === String(id)) ?? null);
  const reviews =
    api.status === 'ok'
      ? api.reviews
      : data.factoryReviews.filter((r) => String(r.factoryId) === String(id));
  const factoryShowcases = api.status === 'ok' ? api.showcases : [];

  const conversation = data.conversations.find((c) => String(c.factoryId) === String(id));
  const detailLoading = api.status === 'loading';

  const productItems = React.useMemo(
    () => factoryShowcases.filter((item) => item.contentType === 'product'),
    [factoryShowcases],
  );

  const promotionItems = React.useMemo(
    () => factoryShowcases.filter((item) => item.contentType === 'promotion'),
    [factoryShowcases],
  );

  const articleItems = React.useMemo(() => {
    const showcaseIdeas = factoryShowcases.filter((item) => item.contentType === 'idea');
    const ideas: IdeaArticle[] = showcaseIdeas.map((s) => ({
      id: s.id,
      factoryId: s.factoryId,
      factoryName: s.factoryName,
      title: s.title,
      excerpt: s.excerpt,
      image: s.image,
      tag: s.category,
      publishedAt: s.postedAt,
    }));
    return { showcaseIdeas, ideas };
  }, [factoryShowcases]);

  const showcasesLoading = detailLoading;

  const startConversation = React.useCallback(
    async (customerId: number | string): Promise<string | null> => {
      if (!id || startingConversation) return null;
      if (conversation) return String(conversation.id);
      setStartingConversation(true);
      try {
        const res = (await conversationsApi.create({
          customer_id: Number(customerId),
          factory_id: Number(id),
        })) as Record<string, unknown>;
        return String(res.conversation_id ?? res.id ?? '');
      } catch {
        return null;
      } finally {
        setStartingConversation(false);
      }
    },
    [id, conversation, startingConversation],
  );

  return {
    id,
    activeTab,
    setActiveTab,
    factory,
    profile,
    conversation,
    productItems,
    promotionItems,
    articleItems,
    reviews,
    showcasesLoading,
    detailLoading,
    startConversation,
    startingConversation,
  };
}
