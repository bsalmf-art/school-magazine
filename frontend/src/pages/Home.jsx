import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { SECTIONS, SECTION_LABELS } from "../lib/api";
import { ArticleCard } from "../components/ArticleCard";
import { ArrowLeft, Sparkles, MessageCircle, Star } from "lucide-react";

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/articles");
        setArticles(res.data);
      } catch (e) {
        console.error("Failed to load articles", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const featuredCover = articles.find((a) => a.featured) || articles[0];
  const bySection = (key) =>
    articles.filter((a) => a.section === key).slice(0, 3);

  return (
    <div data-testid="home-page">
      {/* HERO COVER */}
      <section
        className="relative paper-grain overflow-hidden"
        data-testid="hero-section"
      >
        <div className="absolute inset-0 bg-[#F0EBE1]" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 editorial-rise">
            <p className="text-xs tracking-[0.4em] text-[#987239] mb-6 uppercase">
              العدد الأول · المجلة الإلكترونية
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-[#2D332F] mb-8">
              معاً نبني
              <br />
              <span className="text-[#987239]">جسوراً</span> نحو النجاح
            </h1>
            <p className="text-lg text-[#5C6660] leading-loose max-w-xl mb-10">
              منصّةُ تواصلٍ بين البيت والمدرسة، نحتفي فيها بإنجازات بناتنا،
              ونُنصت لمقترحات أولياء الأمور، ونزرع وعياً يليق بأجيال الغد.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/section/news"
                className="btn-pill btn-primary"
                data-testid="hero-cta-read"
              >
                ابدأ القراءة
                <ArrowLeft size={16} className="rtl:rotate-180" />
              </Link>
              <Link
                to="/suggestions"
                className="btn-pill btn-outline"
                data-testid="hero-cta-suggest"
              >
                شاركنا اقتراحك
              </Link>
            </div>
          </div>

          {featuredCover && (
            <div
              className="lg:col-span-5 editorial-rise"
              style={{ animationDelay: "120ms" }}
            >
              <Link
                to={`/articles/${featuredCover.id}`}
                className="group block relative"
                data-testid="hero-featured-cover"
              >
                <div className="overflow-hidden rounded-2xl border border-[#E2DAC8]">
                  <img
                    src={featuredCover.image_url}
                    alt={featuredCover.title}
                    className="zoom-img w-full h-[520px] object-cover"
                  />
                </div>
                <div className="absolute -bottom-8 -start-4 lg:-start-8 max-w-xs bg-[#FAF8F5] border border-[#E2DAC8] rounded-xl p-5 shadow-sm">
                  <span className="text-[11px] tracking-[0.3em] text-[#987239] uppercase">
                    افتتاحية العدد
                  </span>
                  <p className="font-display text-xl text-[#2D332F] mt-2 leading-snug group-hover:text-[#987239] transition-colors">
                    {featuredCover.title}
                  </p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* QUICK SECTIONS BAR */}
      <section className="border-y border-[#E2DAC8] bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs tracking-[0.3em] text-[#5C6660] uppercase">
            استكشف الأقسام
          </p>
          <div className="flex flex-wrap gap-3">
            {SECTIONS.map((s) => (
              <Link
                key={s.key}
                to={`/section/${s.key}`}
                data-testid={`quick-section-${s.key}`}
                className="px-5 py-2 rounded-full border border-[#E2DAC8] text-sm text-[#2D332F] hover:bg-[#2D332F] hover:text-[#FAF8F5] hover:border-[#2D332F] transition-colors"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION GRIDS */}
      {loading && (
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 text-center text-[#5C6660]">
          جارٍ تحميل المحتوى...
        </div>
      )}

      {!loading &&
        SECTIONS.map((s, idx) => {
          const items = bySection(s.key);
          if (items.length === 0) return null;
          const isFeatured = idx === 0;
          return (
            <section
              key={s.key}
              className="max-w-7xl mx-auto px-6 lg:px-10 py-20"
              data-testid={`home-section-${s.key}`}
            >
              <div className="flex items-end justify-between mb-12 border-b border-[#E2DAC8] pb-6">
                <div>
                  <p className="text-xs tracking-[0.3em] text-[#987239] mb-2 uppercase">
                    قسم
                  </p>
                  <h2 className="font-display text-4xl md:text-5xl text-[#2D332F]">
                    {s.label}
                  </h2>
                </div>
                <Link
                  to={`/section/${s.key}`}
                  className="text-sm text-[#2D332F] hover:text-[#987239] inline-flex items-center gap-2"
                  data-testid={`see-all-${s.key}`}
                >
                  جميع المقالات
                  <ArrowLeft size={14} className="rtl:rotate-180" />
                </Link>
              </div>

              {isFeatured && items[0] ? (
                <div className="space-y-16">
                  <ArticleCard article={items[0]} variant="feature" />
                  {items.length > 1 && (
                    <div className="grid md:grid-cols-2 gap-10 pt-4">
                      {items.slice(1).map((a, i) => (
                        <ArticleCard key={a.id} article={a} index={i} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-10">
                  {items.map((a, i) => (
                    <ArticleCard key={a.id} article={a} index={i} />
                  ))}
                </div>
              )}
            </section>
          );
        })}

      {/* CALL-TO-ACTION CARDS */}
      <section
        className="max-w-7xl mx-auto px-6 lg:px-10 py-20"
        data-testid="cta-section"
      >
        <div className="grid md:grid-cols-2 gap-8">
          <Link
            to="/suggestions"
            className="group relative overflow-hidden rounded-2xl bg-[#8B9D83] text-[#FAF8F5] p-10 transition-transform hover:-translate-y-1"
            data-testid="cta-suggestions"
          >
            <Sparkles className="absolute top-6 left-6 opacity-30" size={80} />
            <MessageCircle size={28} className="mb-5" />
            <h3 className="font-display text-3xl mb-3">مقترحات أولياء الأمور</h3>
            <p className="text-sm leading-loose opacity-90 mb-6 max-w-md">
              صوتك جزء من قرارنا. شاركنا اقتراحك أو ملاحظتك، فنحن نُصغي بكلّ
              اهتمام.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold border-b border-[#FAF8F5]/40 pb-1">
              أرسل اقتراحك
              <ArrowLeft size={14} className="rtl:rotate-180" />
            </span>
          </Link>

          <Link
            to="/opinion"
            className="group relative overflow-hidden rounded-2xl bg-[#2D332F] text-[#FAF8F5] p-10 transition-transform hover:-translate-y-1"
            data-testid="cta-opinion"
          >
            <Star className="absolute top-6 left-6 opacity-20" size={80} />
            <Star size={28} className="mb-5" />
            <h3 className="font-display text-3xl mb-3">رأيك يهمنا</h3>
            <p className="text-sm leading-loose opacity-90 mb-6 max-w-md">
              ساعدنا على تطوير المجلة بكلمة صادقة منك، وقيّم تجربتك معنا في
              ثوانٍ.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold border-b border-[#FAF8F5]/40 pb-1">
              شاركنا رأيك
              <ArrowLeft size={14} className="rtl:rotate-180" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
