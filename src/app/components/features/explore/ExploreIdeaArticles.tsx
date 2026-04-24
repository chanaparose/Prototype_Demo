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
            onClick={() => onArticleClick?.(article.id)}
            className="flex-shrink-0 w-[320px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-[#A656A0]/30 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full bg-[#F6EEFC] px-2 py-0.5 text-[10px] font-bold text-[#A656A0]">
                {article.tag || 'Idea'}
              </span>
              <p className="text-[10px] text-gray-400 truncate">
                {article.factoryName}
              </p>
            </div>
            <p className="text-[#292259] font-semibold line-clamp-2 mb-1 group-hover:text-[#A656A0] transition-colors" style={{ fontSize: 14 }}>
              {article.title}
            </p>
            <p className="text-gray-500 line-clamp-3" style={{ fontSize: 12 }}>
              {article.excerpt}
            </p>
            <div className="mt-2 pt-2 border-t border-gray-100">
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
