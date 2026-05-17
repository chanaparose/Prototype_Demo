import React from 'react';
import { ChevronRight, Heart } from 'lucide-react';
import { StatusBadge } from '@/shared/ui/badges/StatusBadge';
import { Button } from '@/components/ui/button';

export type IdeaArticleItem = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  tag: string;
  factoryName: string;
  likes?: number;
};

type ExploreIdeaArticlesProps = {
  articles: IdeaArticleItem[];

  onSeeAll?: () => void;
  onArticleClick?: (id: string) => void;
};

export function ExploreIdeaArticles({
  articles,
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
        {articles.map((article) => (
          <article
            key={article.id}
            onClick={() => onArticleClick?.(article.id)}
            className='bg-white rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer p-3'
          >
            <div className='flex items-center gap-2 mb-1.5'>
              <StatusBadge variant='info' size='sm'>
                ไอเดีย
              </StatusBadge>
              <span className='text-[10px] text-gray-400 truncate'>{article.factoryName}</span>
            </div>
            <h3 className='font-bold text-[13px] text-brand-navy-ink mb-1 line-clamp-2 leading-snug'>
              {article.title}
            </h3>
            <p className='text-[12px] text-gray-500 line-clamp-2'>{article.excerpt || ' '}</p>
            <div className='mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between'>
              <span className='text-[10px] text-gray-400'>แตะเพื่ออ่านต่อ</span>
              <Button
                variant='unstyled'
                type='button'
                onClick={(e) => e.stopPropagation()}
                className='flex items-center gap-0 shrink-0 tabular-nums text-[9px] active:opacity-70'
                aria-label='ถูกใจ'
              >
                <Heart className='w-2.5 h-2.5 shrink-0' />
                <span className='text-[10px] leading-none'>{Number(article.likes ?? 0)}</span>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
