import React from 'react';
import { ChevronRight } from 'lucide-react';

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
  onArticleClick?: (id: string) => void;
};

export function ExploreIdeaArticles({ articles, onSeeAll, onArticleClick }: ExploreIdeaArticlesProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between px-4 mb-2">
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
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div
        className="flex gap-2 overflow-x-auto px-3 pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {articles.map((article) => (
          <div
            key={article.id}
            onClick={() => onArticleClick?.(article.id)}
            className="flex-shrink-0 w-[240px] bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-[#A656A0]/30 transition-all group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center rounded-full bg-[#F6EEFC] px-2 py-0.5 text-[10px] font-bold text-[#A656A0]">
                {article.tag || 'Idea'}
              </span>
              <p className="text-[10px] text-gray-400 truncate">
                {article.factoryName}
              </p>
            </div>
            <p className="text-gray-700 font-semibold line-clamp-2 mb-1 leading-snug group-hover:text-[#A656A0] transition-colors" style={{ fontSize: 13 }}>
              {article.title}
            </p>
            <p className="text-gray-500 line-clamp-2" style={{ fontSize: 11 }}>
              {article.excerpt}
            </p>
            <div className="mt-1.5 pt-1.5 border-t border-gray-100">
              <p className="text-gray-400" style={{ fontSize: 10 }}>
                แตะเพื่ออ่านต่อ
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
