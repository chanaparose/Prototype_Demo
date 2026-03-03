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
};

export function ExploreIdeaArticles({ articles }: ExploreIdeaArticlesProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="text-gray-800" style={{ fontWeight: 700 }}>
          บทความ Idea
        </h3>
        <button type="button" className="flex items-center gap-0.5 text-purple-600" style={{ fontSize: 13 }}>
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
            className="flex-shrink-0 w-[280px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="relative h-36">
              <ImageWithFallback
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <span
                className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[10px] font-medium"
                style={{ background: 'rgba(108, 70, 255, 0.9)' }}
              >
                {article.tag}
              </span>
            </div>
            <div className="p-3">
              <p className="text-gray-800 font-medium truncate mb-0.5" style={{ fontSize: 13 }}>
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
