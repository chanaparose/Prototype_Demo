import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '../../shared';

export type IdeaArticleItem = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  tag: string;
  factoryName: string;
};

type ExploreIdeaArticlesProps = {
  articles: IdeaArticleItem[];
  /** e.g. navigate to factory-ideas with content-type filter */
  onSeeAll?: () => void;
};

export function ExploreIdeaArticles({ articles, onSeeAll }: ExploreIdeaArticlesProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="text-[#292259]" style={{ fontWeight: 700 }}>
          บทความ Idea
        </h3>
        <button
          type="button"
          onClick={onSeeAll}
          className="flex items-center gap-0.5 text-[#A656A0] hover:text-[#A656A0] transition-colors"
          style={{ fontSize: 13 }}
        >
          ดูทั้งหมด
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div
        className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {articles.map((article) => (
          <div
            key={article.id}
            className="flex-shrink-0 w-[280px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-[#A656A0]/30 transition-all group"
          >
            <div className="relative h-36 overflow-hidden">
              <ImageWithFallback
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
               
            </div>
            <div className="p-3">
              <p className="text-[#292259] font-medium truncate mb-0.5 group-hover:text-[#A656A0] transition-colors" style={{ fontSize: 13 }}>
                {article.title}
              </p>
              <p className="text-gray-500 line-clamp-2 mb-2" style={{ fontSize: 11 }}>
                {article.excerpt}
              </p>
              <p className="text-gray-400" style={{ fontSize: 10 }}>
                {article.factoryName}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
