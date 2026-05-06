import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { SECTION_LABELS } from "../lib/api";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { LikeButton } from "../components/ArticleCard";

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await api.get(`/articles/${id}`);
        setArticle(res.data);
        const rel = await api.get(`/articles?section=${res.data.section}`);
        setRelated(rel.data.filter((a) => a.id !== res.data.id).slice(0, 3));
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-32 text-center text-[#5C6660]">
        جارٍ تحميل المقال...
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div
        className="max-w-3xl mx-auto px-6 py-32 text-center"
        data-testid="article-not-found"
      >
        <h2 className="font-display text-3xl text-[#2D332F] mb-4">
          المقال غير موجود
        </h2>
        <Link to="/" className="btn-pill btn-primary">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const date = new Date(article.created_at).toLocaleDateString("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article
      data-testid={`article-detail-${article.id}`}
      className="bg-[#FAF8F5]"
    >
      {/* Hero */}
      <header className="max-w-4xl mx-auto px-6 lg:px-10 pt-16 pb-10 editorial-rise">
        <Link
          to={`/section/${article.section}`}
          className="text-xs tracking-[0.3em] text-[#987239] uppercase hover:text-[#2D332F]"
          data-testid="back-to-section"
        >
          {SECTION_LABELS[article.section]}
        </Link>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-[#2D332F] leading-tight mt-5 mb-6">
          {article.title}
        </h1>
        <p className="text-lg text-[#5C6660] leading-loose mb-8">
          {article.excerpt}
        </p>
        <div className="flex flex-wrap items-center gap-6 text-sm text-[#5C6660] border-y border-[#E2DAC8] py-4">
          <span className="inline-flex items-center gap-2">
            <User size={14} />
            {article.author}
          </span>
          <span className="inline-flex items-center gap-2">
            <Calendar size={14} />
            {date}
          </span>
        </div>
      </header>

      {/* Image (only render if provided) */}
      {article.image_url && (
        <div className="max-w-5xl mx-auto px-6 lg:px-10 mb-12">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-[500px] object-cover rounded-xl"
          />
        </div>
      )}

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 lg:px-10 pb-10">
        <div className="article-prose">
          {article.content.split("\n").map((p, i) =>
            p.trim() ? <p key={i}>{p}</p> : null
          )}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 border-y border-[#E2DAC8] py-8">
          <p className="text-xs tracking-[0.3em] text-[#987239] uppercase">
            هل أعجبكِ هذا الموضوع؟
          </p>
          <LikeButton
            articleId={article.id}
            initialLikes={article.likes || 0}
            size="large"
          />
        </div>

        <div className="mt-10 flex justify-between items-center">
          <Link
            to={`/section/${article.section}`}
            className="inline-flex items-center gap-2 text-sm text-[#2D332F] hover:text-[#987239]"
            data-testid="back-to-section-bottom"
          >
            <ArrowLeft size={14} className="rtl:rotate-180" />
            عودة إلى {SECTION_LABELS[article.section]}
          </Link>
          <Link to="/opinion" className="btn-pill btn-outline text-sm">
            شاركنا رأيك
          </Link>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-[#F0EBE1] py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <p className="text-xs tracking-[0.3em] text-[#987239] uppercase mb-3">
              قراءات ذات صلة
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-[#2D332F] mb-10">
              من القسم نفسه
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {related.map((a) => (
                <Link
                  key={a.id}
                  to={`/articles/${a.id}`}
                  className="group block"
                  data-testid={`related-article-${a.id}`}
                >
                  <div className="overflow-hidden rounded-xl mb-4 aspect-[4/3]">
                    <img
                      src={a.image_url}
                      alt={a.title}
                      className="zoom-img w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-display text-xl text-[#2D332F] group-hover:text-[#987239] transition-colors leading-snug">
                    {a.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
};

export default ArticleDetail;
