import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IdeaArticleCard } from '@/components/features/factory-ideas/IdeaArticleCard';
import type { FactoryItem } from '@/components/features/explore/factoryItemTypes';

import type { IExploreArticle } from '@/domain/explore/types/explore.model';

export type IdeaArticleItem = IExploreArticle;

type ExploreIdeaArticlesProps = {
  articles: IdeaArticleItem[];
  factories?: FactoryItem[];
  isLiked?: (id: string | number) => boolean;
  onToggleFavorite?: (id: string | number) => void;
  onSeeAll?: () => void;
  onArticleClick?: (id: string) => void;
};

export function ExploreIdeaArticles({
  articles,
  factories,
  isLiked,
  onToggleFavorite,
  onSeeAll,
  onArticleClick,
}: ExploreIdeaArticlesProps) {
  return (
    <div className='mb-3'>
      <div className='flex items-center justify-between px-4 mb-2'>
        <h3 className='text-brand-navy-ink' style={{ fontWeight: 700 }}>
          บทความ Idea
        </h3>
        <Button
          variant='unstyled'
          type='button'
          onClick={onSeeAll}
          className='flex items-center gap-0.5 text-brand-magenta hover:text-brand-magenta transition-colors'
          style={{ fontSize: 13 }}
        >
          ดูทั้งหมด
          <ChevronRight className='w-3.5 h-3.5' />
        </Button>
      </div>
      <div className='px-3 grid grid-cols-1 gap-2'>
        {articles.map((article) => {
          const factory = factories?.find((f) => f.id === article.factoryId);
          return (
            <IdeaArticleCard
              key={article.id}
              id={article.id}
              title={article.title}
              excerpt={article.excerpt}
              factoryName={article.factoryName}
              factoryVerified={factory?.verified}
              isLiked={isLiked?.(article.id) ?? false}
              onToggleFavorite={onToggleFavorite ?? (() => {})}
              onClick={() => onArticleClick?.(article.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
