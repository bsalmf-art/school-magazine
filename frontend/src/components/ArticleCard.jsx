import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SECTION_LABELS } from "../lib/api";

export const ArticleCard = ({ article, variant = "default", index = 0 }) => {
  if (variant === "feature") {
    return (
      <Link
        to={`/articles/${article.id}`}
        className="group block editorial-rise"
        data-testid={`feature-article-${article.id}`}
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1">
            <span className="inline-block text-xs tracking-[0.25em] text-[#987239] mb-4 uppercase">
              {SECTION_LABELS[article.section]}
            </span>
            <h3 className="font-display text-3xl md:text-4xl text-[#2D332F] leading-tight mb-4 group-hover:text-[#987239] transition-colors">
              {article.title}
            </h3>
            <p className="text-[#5C6660] leading-loose mb-6 text-base">
              {article.excerpt}
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#2D332F] group-hover:text-[#987239] transition-colors">
              تابع القراءة
              <ArrowLeft size={16} className="rtl:rotate-180" />
            </span>
          </div>
          <div className="order-1 md:order-2 overflow-hidden rounded-xl">
            <img
              src={article.image_url}
              alt={article.title}
              className="zoom-img w-full h-[420px] object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/articles/${article.id}`}
      className="group block editorial-rise"
      data-testid={`article-card-${article.id}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="overflow-hidden rounded-xl mb-5 aspect-[4/3]">
        <img
          src={article.image_url}
          alt={article.title}
          className="zoom-img w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <span className="inline-block text-[11px] tracking-[0.25em] text-[#987239] mb-2 uppercase">
        {SECTION_LABELS[article.section]}
      </span>
      <h3 className="font-display text-2xl text-[#2D332F] leading-snug mb-2 group-hover:text-[#987239] transition-colors">
        {article.title}
      </h3>
      <p className="text-sm text-[#5C6660] leading-loose line-clamp-3">
        {article.excerpt}
      </p>
      <p className="mt-3 text-xs text-[#5C6660]">
        بقلم {article.author}
      </p>
    </Link>
  );
};
