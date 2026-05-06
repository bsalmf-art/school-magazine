import { Link } from "react-router-dom";
import { ArrowLeft, Heart, ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import api, { SECTION_LABELS } from "../lib/api";
import { toast } from "sonner";

const STORAGE_KEY = "liked_articles";

const getLiked = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

export const LikeButton = ({ articleId, initialLikes = 0, size = "default" }) => {
  const [count, setCount] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const m = getLiked();
    setLiked(!!m[articleId]);
  }, [articleId]);

  useEffect(() => {
    setCount(initialLikes);
  }, [initialLikes]);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const ep = liked ? "unlike" : "like";
      const res = await api.post(`/articles/${articleId}/${ep}`);
      setCount(res.data.likes);
      const m = getLiked();
      if (liked) {
        delete m[articleId];
      } else {
        m[articleId] = true;
        toast.success("شكراً لتفاعلك");
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
      setLiked(!liked);
    } catch (err) {
      toast.error("تعذّر التفاعل");
    } finally {
      setBusy(false);
    }
  };

  const isLarge = size === "large";

  return (
    <button
      onClick={onClick}
      disabled={busy}
      data-testid={`like-button-${articleId}`}
      className={`inline-flex items-center gap-2 rounded-full transition-all ${
        isLarge
          ? "px-5 py-3 text-base"
          : "px-3 py-1.5 text-sm"
      } ${
        liked
          ? "bg-[#D4A373]/15 text-[#987239] border border-[#D4A373]"
          : "bg-[#F0EBE1] text-[#5C6660] border border-[#E2DAC8] hover:bg-[#E2DAC8]"
      }`}
      aria-label={liked ? "إلغاء الإعجاب" : "إعجاب"}
    >
      <Heart
        size={isLarge ? 20 : 16}
        className={liked ? "fill-[#D4A373] text-[#D4A373]" : ""}
      />
      <span data-testid={`like-count-${articleId}`}>{count}</span>
    </button>
  );
};

export const ArticleCard = ({ article, variant = "default", index = 0 }) => {
  const isVoice = article.section === "voice";

  if (variant === "feature") {
    return (
      <div className="group editorial-rise" style={{ animationDelay: `${index * 80}ms` }}>
        <Link
          to={`/articles/${article.id}`}
          className="block"
          data-testid={`feature-article-${article.id}`}
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
              {article.image_url ? (
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="zoom-img w-full h-[420px] object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-[420px] bg-[#F0EBE1] flex items-center justify-center">
                  <ImageIcon size={48} className="text-[#C2A878]" />
                </div>
              )}
            </div>
          </div>
        </Link>
        <div className="mt-5 flex items-center gap-3">
          <LikeButton
            articleId={article.id}
            initialLikes={article.likes || 0}
          />
          <span className="text-xs text-[#5C6660]">بقلم {article.author}</span>
        </div>
      </div>
    );
  }

  // Voice topic compact card style
  if (isVoice) {
    return (
      <div
        className="editorial-rise bg-white border border-[#E2DAC8] rounded-2xl p-6 transition-all hover:border-[#8B9D83] hover:-translate-y-0.5"
        style={{ animationDelay: `${index * 50}ms` }}
        data-testid={`voice-card-${article.id}`}
      >
        <Link to={`/articles/${article.id}`} className="block">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#8B9D83]/15 text-[#8B9D83] flex items-center justify-center font-display shrink-0">
              {(article.author || "و").charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#2D332F]">
                {article.author}
              </p>
              <p className="text-xs text-[#5C6660]">
                {new Date(article.created_at).toLocaleDateString("ar")}
              </p>
            </div>
          </div>
          <h3 className="font-display text-xl text-[#2D332F] mb-2 leading-snug group-hover:text-[#8B9D83]">
            {article.title}
          </h3>
          <p className="text-sm text-[#5C6660] leading-loose line-clamp-3 mb-4">
            {article.excerpt}
          </p>
        </Link>
        <div className="flex items-center justify-between border-t border-[#E2DAC8] pt-3 mt-3">
          <LikeButton
            articleId={article.id}
            initialLikes={article.likes || 0}
          />
          <Link
            to={`/articles/${article.id}`}
            className="text-xs text-[#987239] hover:text-[#2D332F]"
            data-testid={`voice-read-${article.id}`}
          >
            قراءة كاملة ←
          </Link>
        </div>
      </div>
    );
  }

  // Default editorial card
  return (
    <div className="editorial-rise" style={{ animationDelay: `${index * 60}ms` }}>
      <Link
        to={`/articles/${article.id}`}
        className="group block"
        data-testid={`article-card-${article.id}`}
      >
        <div className="overflow-hidden rounded-xl mb-5 aspect-[4/3] bg-[#F0EBE1]">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={article.title}
              className="zoom-img w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={36} className="text-[#C2A878]" />
            </div>
          )}
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
      </Link>
      <div className="mt-4 flex items-center justify-between">
        <LikeButton articleId={article.id} initialLikes={article.likes || 0} />
        <p className="text-xs text-[#5C6660]">بقلم {article.author}</p>
      </div>
    </div>
  );
};
